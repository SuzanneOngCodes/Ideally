# Deploy Ideally lên Cloud Run

Dockerfile chạy Express và FastAPI trong cùng container. Script khởi động đợi
FastAPI `/health` thành công rồi mới chạy Express. Nếu một process thoát, container
thoát để Cloud Run có thể khởi động lại. Không dùng `--reload` trong production.
Express lắng nghe `0.0.0.0:$PORT`, Python chỉ lắng nghe `127.0.0.1:8000`.

## Chuẩn bị

Chạy từ thư mục `Ideally` trong Cloud Shell hoặc máy có Google Cloud CLI.
Thay các giá trị bên dưới bằng project và tên service hiện tại của bạn:

```bash
export IDEALLY_PROJECT="YOUR_PROJECT_ID"
export IDEALLY_REGION="asia-southeast1"
export IDEALLY_SERVICE="ideally"
export IDEALLY_RUNTIME_SA="ideally-runtime@${IDEALLY_PROJECT}.iam.gserviceaccount.com"
gcloud config set project "$IDEALLY_PROJECT"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
```

Tạo service account nếu chưa có:

```bash
gcloud iam service-accounts create ideally-runtime --display-name="Ideally Cloud Run"
```

Tạo hai secret `ideally-google-api-key` và `ideally-tavily-api-key` trong
Secret Manager bằng Google Cloud Console, thêm phiên bản chứa key tương ứng.
Không đưa `.env` hay API key vào image. `.dockerignore` và `.gcloudignore`
đã loại bỏ các file này khỏi build/upload.

Cấp quyền đọc từng secret cho service account:

```bash
gcloud secrets add-iam-policy-binding ideally-google-api-key --member="serviceAccount:${IDEALLY_RUNTIME_SA}" --role=roles/secretmanager.secretAccessor
gcloud secrets add-iam-policy-binding ideally-tavily-api-key --member="serviceAccount:${IDEALLY_RUNTIME_SA}" --role=roles/secretmanager.secretAccessor
```

## Deploy

```bash
gcloud run deploy "$IDEALLY_SERVICE" \
  --source . \
  --region "$IDEALLY_REGION" \
  --service-account "$IDEALLY_RUNTIME_SA" \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --concurrency 8 \
  --timeout 240 \
  --set-secrets GOOGLE_API_KEY=ideally-google-api-key:latest,GEMINI_API_KEY=ideally-google-api-key:latest,TAVILY_API_KEY=ideally-tavily-api-key:latest \
  --update-env-vars NODE_ENV=production,PYTHON_BACKEND_URL=http://127.0.0.1:8000,GEMINI_MODEL=gemini-3.8-flash,GEMINI_FALLBACK_MODEL=gemini-3.1-flash-lite
```

Lệnh dùng Dockerfile hiện tại và Cloud Build, không cần Docker daemon local.
Giữ chính sách truy cập hiện có của service. Với service mới, lệnh có thể hỏi
có cho phép truy cập công khai không; lựa chọn theo nhu cầu của bạn.
Các API session chưa có auth riêng; quyền truy cập hiện được kiểm soát ở Cloud Run.

## Database

Mặc định `/tmp/ideally.db` chỉ phù hợp thử nghiệm: dữ liệu mất khi instance dừng
và không chia sẻ giữa instances. Để giữ lịch sử production, dùng PostgreSQL.
Driver `psycopg` đã có trong dependencies. Tạo secret `ideally-database-url`:

```text
postgresql+psycopg://USER:PASSWORD@HOST:5432/ideally
```

Password trong URL cần percent-encode. Database phải truy cập được từ Cloud Run.
Với Cloud SQL qua Unix socket, URL có dạng:

```text
postgresql+psycopg://USER:PASSWORD@/ideally?host=/cloudsql/PROJECT:REGION:INSTANCE
```

Cấp quyền đọc secret database cho runtime service account, quyền
`roles/cloudsql.client` nếu dùng Cloud SQL; rồi cập nhật service:

```bash
gcloud secrets add-iam-policy-binding ideally-database-url --member="serviceAccount:${IDEALLY_RUNTIME_SA}" --role=roles/secretmanager.secretAccessor
gcloud run services update "$IDEALLY_SERVICE" --region "$IDEALLY_REGION" \
  --update-secrets DATABASE_URL=ideally-database-url:latest
```

Nếu dùng Cloud SQL, thêm `--add-cloudsql-instances PROJECT:REGION:INSTANCE`
vào lệnh update. Cấu hình kết nối riêng/VPC theo database của bạn.
Backend khởi tạo tables bằng `create_all`; chạy migration trước khi đổi schema
trên database đã có dữ liệu.

## Kiểm tra

```bash
export IDEALLY_URL="$(gcloud run services describe "$IDEALLY_SERVICE" --region "$IDEALLY_REGION" --format='value(status.url)')"
curl -H "Authorization: Bearer $(gcloud auth print-identity-token)" "$IDEALLY_URL/api/backend/health"
curl -X POST "$IDEALLY_URL/api/v1/chat" \
  -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  -H 'Content-Type: application/json' \
  -d '{"message":"Tìm tài liệu chính thức Tavily và tổng hợp ngắn kèm nguồn."}'
```

Tài khoản dùng kiểm tra cần quyền invoke nếu service private.
Health phải trả `status: ok`; chat trả `session_id`, `reply`, `research`.
Đọc logs nếu lỗi:

```bash
gcloud run services logs read "$IDEALLY_SERVICE" --region "$IDEALLY_REGION" --limit 100
```

## Thử image local khi Docker đang chạy

```bash
docker build --platform linux/amd64 -t ideally-cloud-run .
docker run --rm -p 8080:8080 --env-file backend/.env ideally-cloud-run
```

Mở http://localhost:8080 và kiểm tra `/api/backend/health`.

Tài liệu: https://docs.cloud.google.com/run/docs/container-contract
https://docs.cloud.google.com/run/docs/deploying-source-code
https://docs.cloud.google.com/run/docs/configuring/services/secrets
