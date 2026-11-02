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
| `AI_API_KEY` | Khóa API AI để chấm bài — trắc nghiệm + tự luận (không bắt buộc — thiếu thì các chức năng khác vẫn chạy bình thường; có thể dùng tên `OPENAI_API_KEY` thay thế) |
| `AI_API_URL` | Endpoint chat completions kiểu OpenAI, mặc định `https://api.openai.com/v1/chat/completions` |
| `AI_MODEL` | Tên model AI, mặc định `gpt-4o-mini` |
| `AI_TIMEOUT_MS` | Thời gian chờ mỗi lời gọi AI (ms), mặc định 45000 |
| `AI_TEMPERATURE` | Độ ngẫu nhiên của AI, mặc định 0.2 (nên để thấp cho việc chấm điểm) |

## Thi theo thời gian — bắt đầu, đếm ngược, nộp bài
- Sinh viên chọn đề sẽ thấy **màn hình Bắt đầu**: thông tin đề, số câu trắc nghiệm/tự luận, thời gian làm bài.
  Bấm **🚀 Bắt đầu làm bài** để vào thi — **đồng hồ đếm ngược** bắt đầu chạy từ thời điểm đó.
- Giảng viên đặt **Thời gian làm bài (phút)** khi tạo đề (0 = không giới hạn) và có thể đổi sau
  trong panel *🤖 Chấm AI toàn bài*.
- Hết giờ, bài được **tự động nộp**; sinh viên cũng có thể nộp sớm bằng nút **📮 Nộp bài** (có hộp thoại xác nhận).
- Trong khi làm bài có **thanh tiến độ** “Đã trả lời x/y câu” và thanh hành động dính cuối màn hình;
  còn ≤ 5 phút đồng hồ chuyển đỏ nhấp nháy.

## Chấm toàn bộ bài thi bằng AI (trắc nghiệm + tự luận)
Mọi bài nộp được **chấm tự động TOÀN BỘ ngay khi nộp** (xem mục dưới) — giảng viên **không cần bấm chấm**,
chỉ xem kết quả. Panel **🤖 Cấu hình chấm AI** ở trang *Quản lý đề & xem kết quả* dành cho xem/chỉnh cấu hình:

**Phần trắc nghiệm:**
- Đề đã có đáp án (từ file/nhập sẵn) thì chấm theo đáp án đó.
- Đề thiếu đáp án: AI **tự xác định đáp án ở lượt nộp đầu tiên** (lưu vào trường mới `autoKey`, gắn nhãn 🤖)
  để chấm trắc nghiệm ngay; giảng viên **duyệt/chỉnh từng câu trong bảng** (dropdown) rồi bấm
  **💾 Lưu cấu hình** để duyệt chính thức (chuyển vào `answerKey`).
- Nút **✨ AI đề xuất đáp án trắc nghiệm** giúp gợi ý đáp án trước giờ thi (tùy chọn).

**Phần tự luận:**
- AI chấm **mọi** câu tự luận đã trả lời (không cần “bật” từng câu); điểm tối đa mặc định 10.
- Trong panel có thể đặt **điểm tối đa**, bấm **✨ AI đề xuất tiêu chí** hoặc tự viết tiêu chí + đáp án mẫu —
  chấm tự động sẽ bám theo đó (tùy chọn nhưng nên làm để chấm sát hơn).
- Bảng kết quả có cột **Tổng** (TN + TL); điểm AI mang huy hiệu 🤖; giảng viên phúc khảo bằng cách nhập
  **Điểm chính thức** cho từng câu — điểm chính thức luôn được ưu tiên.

Toàn bộ lời gọi AI đi qua máy chủ (`/api/ai/rubric`, `/api/ai/grade`, `/api/ai/mc-key` — chỉ giảng viên
đã đăng nhập mới gọi được; riêng `/api/ai/auto-grade` dành cho luồng nộp bài của sinh viên, chỉ chấm
đúng bài nộp của chính uid gửi lên). **API key không bao giờ được đưa xuống trình duyệt** và không nằm trong mã nguồn trên GitHub.

## Chấm tự động ngay khi nộp bài + xem lại bài làm
- Sinh viên bấm **Nộp bài** → trình duyệt gọi `POST /api/ai/auto-grade`: máy chủ đọc bài nộp đã lưu và
  **chấm TOÀN BỘ bài ngay lập tức** — trắc nghiệm theo đáp án của đề (nếu đề thiếu đáp án thì AI tự xác định
  và lưu vào `autoKey`), AI chấm **mọi** câu tự luận **đã trả lời** (không cần bật cấu hình; câu bỏ trống
  không chấm), song song tối đa 3 câu một lượt.
- Giảng viên **không phải bấm chấm gì cả**: điểm (TN, TL do AI, tổng) tự xuất hiện ở bảng kết quả và trên
  màn hình sinh viên ngay khi nộp; panel 🤖 chỉ để cấu hình thời gian/đáp án/tiêu chí và duyệt đáp án AI.
- Màn hình kết quả hiện **điểm từng phần + TỔNG CỘNG** và nhận xét AI của từng câu tự luận; câu sinh viên
  **không làm** được đánh dấu riêng, đáp án đúng hiện **màu cam** để phân biệt.
- Điểm AI chấm tự động được lưu vào `att.ai` (`src: "auto"`) dưới dạng **điểm đề xuất** — giảng viên vẫn
  duyệt/chỉnh lại ở bảng kết quả như cũ.
- Nút **🔍 Xem lại bài làm & đáp án** (ở màn hình kết quả và mục “📚 Bài bạn đã nộp” ở trang sinh viên)
  dựng lại toàn bộ bài: lựa chọn của bạn, đáp án đúng, bài viết tự luận + điểm AI; câu bỏ trống tô cam.
- Nếu AI **không xác định được đáp án trắc nghiệm** (lỗi key/model/mạng), lỗi cụ thể hiện ngay trên màn hình
  kết quả của sinh viên (`mcKeyError`) để giảng viên biết và xử lý; nút **🩺 Kiểm tra kết nối AI** trong panel
  🤖 (endpoint `POST /api/ai/ping`, chỉ giảng viên) gọi thử mô hình và báo lỗi chính xác.
- Khi đáp án xuất hiện muộn (AI xác định lại được hoặc giảng viên mới nhập), điểm trắc nghiệm của **bài nộp cũ**
  được tính lại tự động: trên máy chủ khi chấm lượt mới, và hiển thị ngay ở bảng kết quả + trang Xem lại.
- Chống lạm dụng: chấm tự động giới hạn ~12 yêu cầu / 10 phút cho mỗi IP (vượt → 429).
- Nếu máy chủ thiếu `AI_API_KEY`: trắc nghiệm vẫn chấm bình thường, câu tự luận báo “chưa cấu hình AI”
  và chờ giảng viên chấm — không hỏng luồng nộp bài.

### Cấu hình API key trên Render
1. Mở [dashboard.render.com](https://dashboard.render.com) → chọn Web Service của ứng dụng này.
2. Menu **Environment** (biến môi trường) → **Add Environment Variable**.
3. Thêm các biến (tối thiểu là `AI_API_KEY`):
   - `AI_API_KEY` = khóa API của bạn (ví dụ `sk-...` của OpenAI).
   - `AI_MODEL` = tên model (mặc định `gpt-4o-mini`; Gemini: `gemini-2.0-flash`, Groq: `llama-3.3-70b-versatile`…).
   - `AI_API_URL` = chỉ cần đặt nếu dùng nhà cung cấp khác OpenAI (xem bảng dưới).
4. Bấm **Save Changes** — Render tự deploy lại. Kiểm tra: đăng nhập giảng viên → mở panel *Chấm AI toàn bài*;
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
- Dữ liệu cũ (đề đã tạo, kết quả đã nộp) không bị thay đổi cấu trúc: cấu hình AI nằm trong trường mới `q.ai` của câu tự luận, thời gian làm bài trong trường mới `timeLimit` của đề, điểm AI trong trường mới `ai`, điểm giảng viên nhập trong trường mới `man`, lựa chọn trắc nghiệm trong trường mới `mc` của mỗi lượt nộp.
- **Bài nộp trước bản cập nhật này** không lưu lựa chọn trắc nghiệm (`mc`) nên không thể chấm lại phần trắc nghiệm cho các bài đó (phần tự luận và các chức năng khác vẫn bình thường).
- Sao lưu: chép thư mục `DATA_DIR`.
