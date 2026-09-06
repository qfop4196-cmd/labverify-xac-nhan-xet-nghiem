# Vận hành LabVerify tại máy chủ của đơn vị

## Mô hình lưu trữ

Máy chủ là máy tính của đơn vị. Docker lưu cơ sở dữ liệu D1 cục bộ trong Docker volume `labverify_data`; dữ liệu không được gửi sang Sites hoặc GitHub. GitHub chỉ nên giữ mã nguồn riêng tư, không chứa `.env.local`, bản sao cơ sở dữ liệu hay tệp xuất của người dùng.

## Chuẩn bị một lần

1. Cài Docker Desktop trên máy Windows chủ và bật chế độ Linux containers.
2. Mở PowerShell tại thư mục dự án, sao chép `.env.local.example` thành `.env.local`, rồi thay secret và mật khẩu. Secret cần ít nhất 32 ký tự; mỗi mật khẩu cần ít nhất 12 ký tự.
3. Chạy `docker compose up -d --build`.
4. Trên chính máy chủ, mở `http://localhost:8787/signin`, đăng nhập tài khoản `admin`, rồi vào ứng dụng. Mỗi người dùng trong `LABVERIFY_LOCAL_USERS` có không gian ban đầu riêng; quản trị viên tạo mã tham gia để mời kỹ thuật viên hoặc người xem xét vào đơn vị.

## Truy cập từ nơi khác

Dùng VPN của đơn vị hoặc Tailscale để người dùng truy cập địa chỉ nội bộ của máy chủ. Nếu có reverse proxy HTTPS, đặt `LABVERIFY_COOKIE_SECURE=true` và chỉ công bố HTTPS. Không mở trực tiếp cổng 8787 ra Internet.

## Sao lưu và khôi phục

Sao lưu Docker volume `labverify_data` khi dịch vụ dừng hoặc theo công cụ sao lưu nhất quán của Docker. Thử khôi phục vào máy không dùng dữ liệu thật trước khi áp dụng. Chức năng xuất JSON trong ứng dụng là xuất hồ sơ hiển thị, không thay thế bản sao lưu máy chủ.

## Cập nhật

Sau khi lấy mã nguồn bản mới từ GitHub riêng tư, chạy `docker compose up -d --build`. Giữ nguyên Docker volume để bảo toàn dữ liệu. Xem lại migration và sao lưu trước mọi phiên bản có thay đổi schema.
