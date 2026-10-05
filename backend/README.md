# Ideally Backend

FastAPI backend dùng LangChain Deep Agents + Gemini cho chatbot và ResearchPanel.

## Cấu trúc

```text
backend/
├── src/
│   ├── core/                # Settings, logger, agent Gemini và lỗi ứng dụng
│   ├── modules/
│   │   ├── chat/            # Endpoint chat Gemini
│   │   ├── session/         # Router, schemas, models, repository, service
│   │   └── research/        # Router và schemas kết quả research
│   ├── share/database.py    # SQLAlchemy engine, session và Base
│   └── main.py              # App factory, lifespan, CORS và đăng ký routers
├── tests/
├── .env.example
├── pyproject.toml
└── uv.lock
```

## Chạy local

Cần Python 3.11+ và [uv](https://docs.astral.sh/uv/).

```bash
cd backend
uv sync
cp .env.example .env   # Chỉ dùng khi chưa có .env; giữ nguyên key đang có.
# Điền GOOGLE_API_KEY hoặc GEMINI_API_KEY vào .env
uv run uvicorn src.main:app --reload --host 127.0.0.1 --port 8000
```

Swagger: http://localhost:8000/docs. Health: http://localhost:8000/health.
Không cần API key để chạy CRUD session; gửi message cần key Gemini hợp lệ.
Model mặc định là `gemini-3.8-flash`, thay bằng `GEMINI_MODEL` nếu cần.
SQLite mặc định nằm tại `backend/ideally.db`; `DATABASE_URL` có thể thay đổi.
Nếu đổi sang PostgreSQL, cài driver tương ứng và dùng URL SQLAlchemy phù hợp.

## API

| Method | URL | Chức năng |
| --- | --- | --- |
| POST | /api/v1/chat | Chat với Gemini, tự tạo phiên hoặc tiếp tục session_id |
| POST | /api/v1/sessions | Tạo phiên, body `{"title":"Tên phiên"}` hoặc `{}` |
| GET | /api/v1/sessions?limit=50&offset=0 | Danh sách phiên, mới nhất trước |
| GET | /api/v1/sessions/{id} | Phiên, messages và research mới nhất |
| DELETE | /api/v1/sessions/{id} | Xóa phiên và messages |
| POST | /api/v1/sessions/{id}/messages | Gửi message cho Deep Agent |
| GET | /api/v1/research/{id} | Research mới nhất, hoặc `null` nếu chưa có |

### Chat trực tiếp

```bash
curl -X POST http://localhost:8000/api/v1/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"Xin chào, bạn có thể giúp tôi nghiên cứu một ý tưởng không?"}'
```

Response:

```json
{
  "session_id": "UUID của phiên vừa tạo",
  "reply": "Câu trả lời từ Gemini",
  "research": null
}
```

Truyền `session_id` nhận được trong request tiếp theo để giữ ngữ cảnh:
`{"message":"Giải thích thêm","session_id":"UUID"}`. Thêm `"research":true`
để yêu cầu nghiên cứu web. Session mới chỉ được tạo khi AI trả lời thành công;
lỗi provider không để lại phiên rỗng. Endpoint dùng cùng Deep Agent + Gemini
và cơ chế lưu lịch sử với API session.

Ví dụ tạo phiên:

```bash
curl -X POST http://localhost:8000/api/v1/sessions \
  -H 'Content-Type: application/json' -d '{}'
```

Dùng ID trả về để gửi:

```bash
curl -X POST http://localhost:8000/api/v1/sessions/SESSION_ID/messages \
  -H 'Content-Type: application/json' \
  -d '{"content":"Nghiên cứu ứng dụng AI trong giáo dục","research":true}'
```

Response chứa `user_message`, `assistant_message` và `research`:

```json
{
  "title": "Chủ đề nghiên cứu",
  "summary": "Tổng quan",
  "findings": [{"title": "Phát hiện", "description": "Chi tiết"}],
  "sources": [{"title": "Tên nguồn", "url": "https://..."}]
}
```

Đối tượng `research` tương thích prop `research` của `ResearchPanel` hiện có.
Frontend gọi `/api/v1/chat`, tải lịch sử từ backend và hiển thị research trong panel.
Đặt `research: true` để yêu cầu tìm kiếm web và kết quả có cấu trúc.
Deep Agent dùng Gemini với tool `web_search`; tool gọi một Gemini riêng có
Google Search grounding để tránh trộn built-in search với function tools.
Chỉ nguồn thực sự xuất hiện trong citation của kết quả search được lưu; nguồn
không có citation sẽ không được tự tạo. Không có checkpointer chia sẻ giữa phiên:
lịch sử user/assistant được tải từ database cho mỗi lượt, filesystem agent là tạm thời.

## Kiểm thử

```bash
uv run pytest
uv run ruff check .
uv run ruff format --check .
```

Tests dùng agent giả, không gọi Google và không tốn phí Gemini. Chưa xác nhận
chất lượng research thực tế cho tới khi chạy với API key/model có quyền Google Search.

## Hành vi và phạm vi

- Lưu cả hai message và research trong một transaction sau khi AI thành công.
- 503 nếu thiếu key; 502 nếu provider lỗi; 504 nếu quá thời gian.
- 409 nếu phiên bị cập nhật/xóa trong lúc AI chạy; frontend tải lại trước khi thử lại.
- Lưu lịch sử qua restart; giới hạn 40 messages gần nhất đưa vào context.
- CORS chỉ cho Vite local mặc định. Không có auth/multi-user isolation; phù hợp local.
- `create_all` khởi tạo schema cho bản đầu tiên; dùng migration trước khi thay đổi schema
  trên database đã có dữ liệu. API hiện trả response sau khi agent hoàn tất, chưa streaming.

Tài liệu tích hợp:
[Deep Agents](https://docs.langchain.com/oss/python/deepagents/quickstart),
[Gemini LangChain](https://docs.langchain.com/oss/python/integrations/chat/google_generative_ai).

## Kết nối qua server.ts

Từ thư mục `Ideally`, chạy hai terminal:

```bash
npm run dev:backend
```

```bash
npm run dev
```

`server.ts` chuyển tiếp `/api/v1/*` đến FastAPI, giữ nguyên method, query,
JSON body và HTTP status. Frontend có thể gọi `/api/v1/chat`,
`/api/v1/sessions` và `/api/v1/research/{id}` qua cổng 3000.
Kiểm tra Python qua `http://localhost:3000/api/backend/health`.
Đổi `PYTHON_BACKEND_URL` trong `.env` của Ideally nếu Python chạy ở địa chỉ khác.
Backend phải chạy riêng; proxy trả 502 khi không kết nối được và 504 khi quá 180 giây.
Các API `/api/advisor/*`, search và translation vẫn được xử lý trong TypeScript.

## Chat trên giao diện

Workspace gửi câu hỏi tới `POST /api/v1/chat` qua `server.ts` (cổng 3000).
Chat thông thường gọi Gemini trực tiếp; research dùng Deep Agent với web search.
Session được giữ cho các lượt chat trong cùng phiên sử dụng ứng dụng.
Lỗi API được hiển thị trên giao diện, không thay bằng câu trả lời mẫu.
`GEMINI_FALLBACK_MODEL` mặc định là `gemini-3.1-flash-lite`; chat chuyển sang model này
khi model chính trả 404, 429, 500 hoặc 503.
Python không có route `/api/advisor/chat` (404); `/api/v1/chat` yêu cầu POST
(mở URL bằng trình duyệt gửi GET sẽ trả 405). Provider 404 được báo là lỗi model
với HTTP 502, còn provider quá tải/giới hạn tốc độ trả 503.

## Tavily external knowledge

Đặt `TAVILY_API_KEY` trong `backend/.env`. Function tool `web_search(query)` gọi
Tavily qua `src/core/search.py`, trả tối đa 5 nguồn với nội dung giới hạn.
Agent có thể gọi tool từ chat thông thường để tổng hợp kiến thức ngoài;
`research: true` yêu cầu nghiên cứu có cấu trúc. Nguồn được hiển thị dưới câu trả lời.
Không có key Tavily, research dùng Google Search grounding như trước.
Search dùng basic depth, timeout 20 giây, theo API chính thức:
https://docs.tavily.com/documentation/api-reference/endpoint/search

## Live Research Reasoning Map

`research.reasoning_map` trả năm cards `problem`, `evidence`, `research_question`,
`hypothesis`, `experiment`, được tạo từ hội thoại và kết quả tìm kiếm thật.
Mỗi card có title, summary, explanation, methodology, status, limitations,
unresolved_questions và sources. Backend loại source URL không xuất hiện trong
search và không gắn source-supported nếu thiếu nguồn. Hypothesis luôn là hypothesis;
question và experiment là AI-inferred. Sources chứa excerpt thực từ kết quả tìm kiếm.
Map lưu trong JSON research của session hiện có, không cần thay đổi schema database.
Chat follow-up không có map mới giữ map trước đó. Hội thoại cũ có thể dùng
Build Research Map để tạo map từ lịch sử hiện tại. Frontend không dùng preset map
hay biểu đồ số liệu mẫu trong Workspace.
