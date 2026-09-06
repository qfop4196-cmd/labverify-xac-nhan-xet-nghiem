# Xác nhận chất lượng trước triển khai

Ngày xác nhận: 07/09/2026

## Kiểm tra đã thực hiện

| Hạng mục | Cách kiểm tra | Kết quả mong đợi |
|---|---|---|
| Công thức đánh giá | `npm test` | Độ chụm, độ đúng, TE, khoảng tham chiếu, định tính và chặn dữ liệu sai đơn vị đều đạt |
| API và phân quyền | `npm run test:api` | Đăng nhập cục bộ, vai trò, luồng duyệt, nhật ký, xuất dữ liệu, chống truy cập chéo và kiểm tra origin đạt |
| Xuất Excel | `node tests/export.test.mjs` | Tệp có dữ liệu, tiêu đề, định dạng và thông tin truy xuất nguồn gốc |
| AI trợ lý | `npm run test:ai` | Ba truy vấn nghiệp vụ truy hồi đúng tài liệu; hai truy vấn ngoài phạm vi bị chặn |
| Kiểu dữ liệu | `npm run typecheck` | Không có lỗi TypeScript |
| Bản dựng | `npm run build` | Tạo được worker và giao diện để triển khai |
| Phụ thuộc | `npm audit --omit=dev` | Không có lỗ hổng được báo cáo |
| Cơ sở dữ liệu | Chạy migration D1 cục bộ | 11 câu lệnh tạo cấu trúc và dữ liệu mẫu hoàn tất |

## Giới hạn xác nhận

- WebMCP đã được đăng ký để đọc và tạo bản nháp đánh giá; môi trường kiểm thử cục bộ hiện không cung cấp ngữ cảnh WebMCP tương thích để chạy kiểm thử đầu-cuối.
- Không khẳng định tương đương thẩm định lâm sàng. Kết quả của ứng dụng là hỗ trợ quyết định theo dữ liệu đầu vào, với nguồn tham chiếu, phiên bản, đơn vị và điều kiện được hiển thị để người có thẩm quyền phê duyệt.
- Các hồ sơ FT4 nội bộ gắn cờ “cần xác nhận IFU” khi không có tài liệu IFU chính thức trong hồ sơ dự án; ứng dụng không dùng chúng để tự động tuyên bố tuân thủ nhà sản xuất.
