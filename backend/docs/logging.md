# Đọc log backend

Backend ghi JSON ra stderr. Dùng `LOG_LEVEL=INFO` trong `backend/.env` và khởi động
lại backend. Timestamp là UTC, có offset `+00:00`.

Mỗi HTTP request được cấp `request_id`, cũng trả về qua header `X-Request-ID`.
Lọc theo ID này để xem toàn bộ luồng. `agent_run_id` xác định lượt chạy agent;
`run_id` và `parent_run_id` nối lời gọi model/tool trong lượt chạy đó.
`chat.received` và `chat.saved` liên kết request với `session_id` (session mới chỉ
có ID sau khi lưu).

| Event | Nội dung |
| --- | --- |
| `request.start/end/error` | Method, path, HTTP status, thời gian hoặc vị trí lỗi |
| `agent.start/end/error` | Research mode, số message lịch sử, thời gian và lỗi |
| `agent.configured` | Chế độ chat, custom tools, skill paths, search provider |
| `model.attempt` | Model, số thứ tự lần thử, Vertex và location |
| `model.attempt.error` | Lỗi và có chuyển sang model dự phòng hay không |
| `model.start/end/error` | Lần gọi model thực tế, thời gian, token usage nếu SDK cung cấp |
| `tool.requested` | Model đề xuất tool nào, `tool_call_id`, params; chưa xác nhận thực thi |
| `tool.start` | Tool bắt đầu chạy: tên, query/params, run ID và parent ID |
| `tool.end/error` | Status, thời gian, số ký tự kết quả hoặc vị trí lỗi |
| `skill.catalog.ready` | Các skill đã được đọc để đăng ký vào filesystem của agent |
| `skill.load.start/loaded/load.error` | Đọc skill theo stage hoặc qua tool `read_file` |
| `auditor.fallback` | Auditor chuyển sang xử lý local sau lỗi model |

Ví dụ minh họa, lược bỏ timestamp và các trường phụ:

```json
{"event":"tool.requested","request_id":"req1","tool_call_id":"call1","tool":"web_search","params":{"query":"classification latency evidence"}}
{"event":"tool.start","request_id":"req1","run_id":"tool1","parent_run_id":"parent1","tool":"web_search","params":{"query":"classification latency evidence"}}
{"event":"tool.end","request_id":"req1","run_id":"tool1","tool":"web_search","status":"success","duration_ms":482.3,"output_chars":1830}
{"event":"skill.loaded","request_id":"req1","skill":"verify-problem","stage":"verify","source":"stage_middleware","scope":"full"}
```

`skill.catalog.ready` không có nghĩa model đã sử dụng skill. `skill.loaded` ghi
nhận ứng dụng đọc nội dung thành công; với `source=read_file`, `scope=requested_lines`
chỉ xác nhận phần được yêu cầu đọc. Sự kiện này không chứng minh model tuân thủ skill.
Luồng `AgentService` đăng ký `load_skill`, `web_search`, `crawl_web_markdown` cho cả
chat thông thường và research. `skill_paths` chỉ thư mục skill có sẵn;
`skill_loading=load_skill` cho biết agent nạp nội dung qua tool theo tác vụ.
`skill.selected` ghi tên skill và mục đích; `skill.loaded` với `source=load_skill`
xác nhận nội dung đã được đọc. `agent.workflow.incomplete` báo agent bỏ qua bước
bắt buộc và được yêu cầu sửa trước khi trả lời.


Query/params được ghi ở INFO. API key đã cấu hình, các trường credential/token,
Authorization và secret trong URL được che. Mỗi chuỗi tối đa 2.000 ký tự,
collection tối đa 40 phần tử, tối đa 6 tầng lồng nhau; dữ liệu quá dài được đánh dấu
`[truncated]`. Không ghi nguyên lịch sử chat, system prompt, nội dung skill hay
response body; kết quả tool chỉ ghi status và kích thước. Query/params vẫn có thể
chứa nội dung người dùng nhập.

Lỗi ghi `error_type`, `provider_status`, tối đa 8 frame gồm file/dòng/hàm và
`missing_name` cho NameError. Không ghi exception body có thể chứa request hoặc key.

Chạy và lưu log (Uvicorn access/startup logs vẫn có thể ở dạng text):

```bash
uv run uvicorn src.main:app --reload --host 127.0.0.1 --port 8000 2>&1 | tee backend.log
```

Lọc sự kiện JSON bằng jq:

```bash
jq -R 'fromjson? | select(.request_id == "REQUEST_ID")' backend.log
jq -R 'fromjson? | select(.event == "tool.start" or .event == "skill.loaded")' backend.log
```
