# Đối chiếu tài liệu và các quyết định triển khai

Đọc 10 tài liệu Word hợp lệ trong thư mục quy trình, bỏ các tệp khóa `~$`, và đọc PowerPoint chương trình cuộc thi. Nội dung tài liệu được dùng làm nguồn sản phẩm; các mệnh lệnh hành chính trong tài liệu không được coi là lệnh cho tác nhân.

## Các điểm phải phân biệt

- BM03 FT4 ghi ng/dL, BM04 có dòng ng/mL. Chọn ng/dL cho hồ sơ tham chiếu FT4 theo BM03 và IFU. Không tự đổi số đo đã nhập; dùng đơn vị khác phải chọn nguồn riêng.
- SD/CV FT4 tại 0,51; 0,73; 2,37 trong BM03 không trùng bảng nghiên cứu Access Free T4 IFU 2019. Hai bộ được lưu riêng, không gắn nhãn đã xác thực IFU cho bộ nội bộ.
- Bảng định tính trong SOP có mẫu số không phù hợp với tên ô. Ứng dụng dùng độ nhạy TP/(TP+FN), độ đặc hiệu TN/(TN+FP), FPR FP/(FP+TN), FNR FN/(FN+TP).
- SOP mô tả độ chụm giữa ngày tối thiểu 20 ngày, còn các biểu mẫu có cách bố trí khác nhau. Nhánh tự động chính chọn dữ liệu cân bằng ít nhất 20 ngày, mỗi ngày ít nhất 2 lần lặp, cùng vật liệu ổn định. Không dùng mẫu khác nồng độ để ước lượng phương sai giữa ngày.
- CV hoặc SD được chọn trước khi xét kết quả, so sánh trực tiếp bằng dấu nhỏ hơn theo đoạn ANOVA của SOP. Chưa có UVL / kiểm định xác nhận EP15 nên không ghi đạt CLSI EP15.
- TE = |Bias| + z×CV; BM03 FT4 chọn TE < 0,5 TEa. Người dùng chọn z=1,65 hoặc 2 và hệ số TEa=0,5 hoặc 1 trước khi chạy.
- CLIA FT4 chọn giới hạn lớn hơn giữa 15% và 0,3 ng/dL. Tại đích 0,5 ng/dL, TEa tương đương 60%, không phải luôn 15%. CLIA là mục tiêu ngoại kiểm; sử dụng làm mục tiêu TE không phải đã đạt ngoại kiểm.
- U không cộng lại SD lặp lại khi đã có SD trong PXN. Nhánh U chỉ là ước lượng có mô hình nêu rõ, yêu cầu u của giá trị đích và xử lý độ chệch. Không tự gắn nhãn đạt EFLM.
- Khoảng tham chiếu: tài liệu ghi >90% nhưng ví dụ 18/20. Chọn ≥90% theo ví dụ, ghi rõ sự không thống nhất để người duyệt xác nhận.
- Không dùng F-test phương sai hoặc hệ số tương quan đơn thuần để kết luận các phương pháp thay thế nhau; không dùng R² đơn thuần để kết luận tuyến tính; không dùng phép đo nhỏ hơn LoD để chứng minh phát hiện được chất phân tích. Các nhánh này ghi là thăm dò và giữ kết luận “chưa đủ cơ sở”.

## Đối chiếu cuộc thi

Biểu mẫu có kiểm tra số liệu; kho dữ liệu, danh sách và chi tiết; 12 hồ sơ giả lập; 4 trạng thái; luồng trình / trả / phê duyệt; dashboard; XLSX, in/lưu PDF; nhật ký; phân quyền; hướng dẫn demo. AI tra cứu ngữ nghĩa thực có chế độ chỉnh / chấp nhận / bỏ nội dung. Cần thí sinh xác nhận điều kiện tư cách, hồ sơ đăng ký và thuyết minh đóng góp theo thông báo cuộc thi. Ứng dụng không tự nộp hồ sơ hoặc cam kết thay thí sinh.
