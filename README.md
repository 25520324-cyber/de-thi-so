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

## Lưu ý
- Sinh viên không cần tài khoản; mỗi trình duyệt có một mã ngẫu nhiên để lưu kết quả của mình.
- Chấm trắc nghiệm diễn ra trên trình duyệt nên đáp án nằm trong dữ liệu đề; phù hợp bài kiểm tra thường, không phải thi nghiêm ngặt.
- Sao lưu: chép thư mục `DATA_DIR`.
