# Đề Thi Số — bản web chạy độc lập

Không cần `npm install`. Chỉ cần Node 18 trở lên.

## Chạy thử trên máy
```
ADMIN_PASSWORD=matkhau-cua-ban node server.js
```
Mở http://localhost:3000 — bấm **Giảng viên đăng nhập**, nhập mật khẩu, rồi tạo và xuất bản đề.
(Windows PowerShell: `$env:ADMIN_PASSWORD="matkhau"; node server.js`)

## Đưa lên mạng cho mọi người dùng
Cần một nơi chạy Node có **ổ đĩa lưu bền** (để không mất đề và kết quả khi khởi động lại).

- **Render / Railway / Fly.io**: tạo Web Service từ thư mục này (hoặc dùng Dockerfile kèm), Start command `node server.js`,
  đặt biến `ADMIN_PASSWORD`, gắn Disk/Volume và đặt `DATA_DIR` trỏ tới đường dẫn của disk đó.
- **VPS**: chạy `node server.js` bằng pm2 hoặc systemd, đặt Nginx/Caddy phía trước để có HTTPS.
- Tên miền riêng: trỏ DNS về dịch vụ ở trên, bật HTTPS.

## Biến môi trường
| Biến | Ý nghĩa |
|---|---|
| `ADMIN_PASSWORD` | Mật khẩu giảng viên (bắt buộc) |
| `PORT` | Cổng, mặc định 3000 |
| `DATA_DIR` | Nơi lưu dữ liệu (`db.json`, `uploads/`), mặc định `./data` |
| `SECRET` | Khóa ký phiên đăng nhập (không bắt buộc) |
| `AI_API_KEY` | Khóa API AI để chấm tự luận (không bắt buộc — thiếu thì các chức năng khác vẫn chạy bình thường; có thể dùng tên `OPENAI_API_KEY` thay thế) |
| `AI_API_URL` | Endpoint chat completions kiểu OpenAI, mặc định `https://api.openai.com/v1/chat/completions` |
| `AI_MODEL` | Tên model AI, mặc định `gpt-4o-mini` |
| `AI_TIMEOUT_MS` | Thời gian chờ mỗi lời gọi AI (ms), mặc định 45000 |
| `AI_TEMPERATURE` | Độ ngẫu nhiên của AI, mặc định 0.2 (nên để thấp cho việc chấm điểm) |

## Chấm bài tự luận bằng AI
Giảng viên có thể bật **chấm AI** cho từng câu tự luận ngay khi tạo đề (hoặc bật sau, trong bảng
**🤖 Chấm AI tự luận** ở trang *Quản lý đề & xem kết quả*):

1. Nếu không có đáp án mẫu, bấm **✨ AI đề xuất tiêu chí** — AI soạn tiêu chí chấm (rubric) từ câu hỏi và điểm tối đa.
2. Giảng viên **xem và chỉnh sửa tiêu chí** trước khi chấm, rồi bấm **▶ Lưu & chấm AI toàn bộ bài nộp**.
3. AI trả về **điểm đề xuất** + nhận xét ngắn cho từng bài (bỏ qua câu chưa trả lời). Điểm này hiển thị
   dạng huy hiệu 🤖 để phân biệt rõ với điểm chính thức.
4. Giảng viên kiểm tra lại và nhập **Điểm chính thức** vào ô tương ứng trong bảng kết quả — điểm chính thức
   luôn được ưu tiên hiển thị ở cột *Điểm TL*.

Toàn bộ lời gọi AI đi qua máy chủ (`/api/ai/rubric`, `/api/ai/grade`, chỉ giảng viên đã đăng nhập mới gọi được).
**API key không bao giờ được đưa xuống trình duyệt** và không nằm trong mã nguồn trên GitHub.

### Cấu hình API key trên Render
1. Mở [dashboard.render.com](https://dashboard.render.com) → chọn Web Service của ứng dụng này.
2. Menu **Environment** (biến môi trường) → **Add Environment Variable**.
3. Thêm các biến (tối thiểu là `AI_API_KEY`):
   - `AI_API_KEY` = khóa API của bạn (ví dụ `sk-...` của OpenAI).
   - `AI_MODEL` = tên model (mặc định `gpt-4o-mini`; Gemini: `gemini-2.0-flash`, Groq: `llama-3.3-70b-versatile`…).
   - `AI_API_URL` = chỉ cần đặt nếu dùng nhà cung cấp khác OpenAI (xem bảng dưới).
4. Bấm **Save Changes** — Render tự deploy lại. Kiểm tra: đăng nhập giảng viên → mở panel *Chấm AI tự luận*;
   nếu còn cảnh báo “Máy chủ chưa cấu hình AI” thì biến chưa nhận hiệu lực.

Nhà cung cấp tương thích (chuẩn OpenAI Chat Completions):

| Nhà cung cấp | `AI_API_URL` | `AI_MODEL` ví dụ |
|---|---|---|
| OpenAI (mặc định) | không cần đặt | `gpt-4o-mini` |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions` | `gemini-2.0-flash` |
| Groq | `https://api.groq.com/openai/v1/chat/completions` | `llama-3.3-70b-versatile` |
| OpenRouter | `https://openrouter.ai/api/v1/chat/completions` | `openai/gpt-4o-mini` |
| DeepInfra / Together / Ollama… | endpoint OpenAI-compatible của dịch vụ | theo tài liệu dịch vụ |

> 🔒 Bảo mật: chỉ dán API key vào Environment Variables của Render — **không commit key vào Git**,
> không đặt trong `public/index.html`. Nếu key lỡ lộ, hãy thu hồi (revoke) và tạo key mới ngay.

## Lưu ý
- Sinh viên không cần tài khoản; mỗi trình duyệt có một mã ngẫu nhiên để lưu kết quả của mình.
- Chấm trắc nghiệm diễn ra trên trình duyệt nên đáp án nằm trong dữ liệu đề; phù hợp bài kiểm tra thường, không phải thi nghiêm ngặt.
- Tiêu chí chấm (rubric) và đáp án mẫu của câu tự luận cũng nằm trong dữ liệu đề như đáp án trắc nghiệm — sinh viên am hiểu kỹ thuật có thể đọc được qua API; chỉ nên dùng cho kiểm tra thường.
- Điểm AI chỉ là **điểm đề xuất** — giảng viên phải duyệt lại trước khi dùng làm điểm chính thức. Bài tự luận của sinh viên (cùng câu hỏi, tiêu chí) được gửi tới nhà cung cấp AI khi chấm; bài quá dài sẽ bị cắt ngắn ở mức 12.000 ký tự.
- Dữ liệu cũ (đề đã tạo, kết quả đã nộp) không bị thay đổi cấu trúc: cấu hình AI nằm trong trường mới `q.ai` của câu tự luận, điểm AI trong trường mới `ai`, điểm giảng viên nhập trong trường mới `man` của mỗi lượt nộp.
- Sao lưu: chép thư mục `DATA_DIR`.
