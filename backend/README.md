# Backend

FastAPI cung cấp một Deep Agent dùng Tavily để tìm kiếm web. Agent dùng SQLite để lưu
lịch sử hội thoại ngắn hạn theo `thread_id` và long-memory theo `user_id`.

## Cấu hình

Đặt các biến môi trường sau trước khi chạy:

```bash
export OPENAI_API_KEY="your-openai-api-key"
export TAVILY_API_KEY="your-tavily-api-key"
export OPENAI_MODEL="gpt-4.1-mini"
```

`OPENAI_MODEL` là tùy chọn. Có thể đặt `AGENT_DB_PATH` để đổi vị trí file SQLite; mặc
định là `./data/agent.sqlite3`.

## Chạy local

```bash
cd Ideally/backend
uv sync --no-install-project
uv run uvicorn src.main:app --reload
```

## Cấu trúc

- `src/models`: schema request/response và domain model.
- `src/views`: FastAPI routes, chuyển request tới controller.
- `src/controllers`: điều phối request và tạo response.
- `src/services`: xử lý Deep Agent, Tavily và memory tools.
- `src/repositories`: thao tác SQLite cho long-memory.

## Chat API

`POST /api/chat`

```json
{
  "user_id": "user-123",
  "thread_id": "conversation-456",
  "message": "Tìm tin mới nhất về FastAPI và cho tôi biết 3 điểm chính."
}
```

Gửi lại cùng `user_id` và `thread_id` để tiếp tục hội thoại. Dùng cùng `user_id` với
`thread_id` mới để bắt đầu cuộc hội thoại khác nhưng vẫn có thể dùng long-memory.
Agent có thể lưu thông tin lâu dài khi người dùng yêu cầu ghi nhớ. `user_id` cần được
lấy từ lớp xác thực của ứng dụng gọi API để memory của các người dùng không bị dùng
chéo.

## Chạy bằng Docker

```bash
docker build -t ideally-backend .
docker run --rm -p 8000:8000 \
  -e OPENAI_API_KEY="$OPENAI_API_KEY" \
  -e TAVILY_API_KEY="$TAVILY_API_KEY" \
  -v ideally-agent-data:/data \
  ideally-backend
```

Mở `/docs` để xem tài liệu API.
