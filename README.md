# LabVerify

Webapp tiếng Việt hỗ trợ kiểm tra xác nhận phương pháp xét nghiệm từ hồ sơ XN-QTQL-16. Giao diện nhập theo máy, mức tự động hóa, bộ thuốc thử, chất phân tích, đơn vị, lô và vật liệu; kết quả có công thức và nguồn đối chiếu. Đây là sản phẩm thử nghiệm để đánh giá chuyên môn trước khi triển khai thường quy.

## Chức năng

- Độ chụm: ANOVA một yếu tố cân bằng, SD mẫu, CV lặp lại, SD/CV trong PXN, Bias, TE, TEa và Sigma mô tả. Không gộp các mức nồng độ. Không tự coi so sánh trực tiếp CV/SD là xác nhận EP15.
- Các phép khảo sát định tính, khoảng tham chiếu, độ chụm tại LoQ; phân tích thăm dò so sánh phương pháp, tuyến tính và LoD có chặn kết luận tự động.
- Kho hồ sơ D1 theo đơn vị, bản nháp / chờ xem xét / cần bổ sung / đã phê duyệt. Lưu kết quả trên máy chủ, khóa hồ sơ khi đang duyệt / đã duyệt, chống cập nhật phiên bản cũ.
- Vai trò kỹ thuật viên, người xem xét và quản trị viên. Hồ sơ thật không được tự phê duyệt. Mã tham gia một lần có thời hạn 24 giờ.
- 12 hồ sơ giả lập có dữ liệu tính toán thực. Chế độ diễn vai trò chỉ áp dụng cho hồ sơ có cờ giả lập do máy chủ tạo.
- Nhập CSV/TSV số đo, thư viện JSON có cấu trúc; xuất XLSX có số đo và nguồn; in/lưu PDF; sao lưu JSON và khôi phục bản nháp.
- AI tra cứu ngữ nghĩa chạy trong Web Worker trình duyệt, mô hình MiniLM đa ngôn ngữ q8. Điểm kết hợp cosine embedding 70% và trùng từ trong tiêu đề 30%. Trích nội dung có sẵn, có bản nháp cho người dùng sửa/chấp nhận/bỏ; không sinh ngưỡng hay ra quyết định chuyên môn. Không cần API key.

## Chạy và kiểm tra

Node 22.13+; npm theo package-lock.json.

```text
npm ci
npm run dev
npm run typecheck
npm test
npm run test:api
node tests/export.test.mjs
npm run test:ai
npm run build
```

Kiểm thử API dùng máy chủ phát triển ở localhost:3000 và cookie giả lập có sẵn của Sites, không chạy vào hệ thống thực. Phải áp dụng migration Drizzle vào D1 cục bộ trước. Production nhận danh tính từ Sites dispatcher; không triển khai trực tiếp Worker có header định danh do client tự cung cấp vào môi trường công khai.

## Chạy tại máy chủ cá nhân / đơn vị

Đã có `Dockerfile`, `docker-compose.yml` và đăng nhập cục bộ ký số để vận hành không phụ thuộc Sites. Cài Docker Desktop, sao chép `.env.local.example` thành `.env.local`, thay toàn bộ mật khẩu mẫu và chạy `docker compose up -d --build`. Máy chủ lắng nghe cổng 8787, dữ liệu nằm trong Docker volume tại chính máy chủ. Hướng dẫn vận hành, sao lưu và truy cập VPN ở `docs/SELF_HOSTING.md`.

Khi dùng Docker cục bộ, thiết lập `LABVERIFY_LOCAL_MODE=true` qua compose. Ứng dụng chỉ chấp nhận người dùng khai báo trong `LABVERIFY_LOCAL_USERS`; phiên đăng nhập dùng cookie HTTP-only được ký HMAC, hết hạn sau 12 giờ. Dùng HTTPS/VPN cho truy cập ngoài máy chủ; không công bố trực tiếp cổng 8787 ra Internet.

`db/schema.ts` quản lý schema; `drizzle/` chứa migration. `lib/engine.ts` là phép tính chuẩn dùng chung giao diện và máy chủ. `lib/catalog.ts` là bộ tham chiếu có phiên bản. `.openai/hosting.json` chứa định danh Site và binding D1; không chứa thông tin bí mật.

Mô hình AI: https://huggingface.co/Xenova/paraphrase-multilingual-MiniLM-L12-v2, revision `2c4055b12046f11709e9df2c122e59ffbdc2f900`. Lần đầu trình duyệt tải trọng số và bộ tách từ; cần mạng và tài nguyên phù hợp. Trọng số được cache tại thiết bị. Mô hình không được tải trong Worker máy chủ 128 MB. Tìm từ khóa vẫn hoạt động khi không tải được mô hình.

## Dữ liệu nguồn

1. Hồ sơ FT4 / DxI 800: ba nồng độ và độ chụm từ BM03 của người dùng, chưa có IFU khớp chính xác. Giữ nhãn cần xác nhận.
2. Beckman Coulter Access Free T4, IFU B01902 L, May 2019, trang 9: https://www.beckmancoulter.com/download/file/phxB01902L-EN_US/B01902L?type=pdf
3. Roche cobas e 411 / Elecsys FT4 III, FDA Decision Summary K181233, trang 4: https://www.accessdata.fda.gov/cdrh_docs/reviews/K181233.pdf
4. CLIA, 42 CFR 2025 §493.933, trang 745–746, có đoạn tiếp nối §493.931 cho hóa sinh: https://www.govinfo.gov/content/pkg/CFR-2025-title42-vol5/pdf/CFR-2025-title42-vol5-sec493-933.pdf

Chỉ trích thông số cần thiết và tóm lược quy trình. Không đưa DOCX gốc, mã mẫu bệnh nhân hoặc tên nhân viên trong tài liệu gốc vào website. Hồ sơ mẫu dùng số đo sinh tổng hợp có thuật toán tái lập. Phân biệt thông số nghiên cứu NSX với giá trị đích QC do phòng xét nghiệm cung cấp.

## Điều kiện trước chuyển giao

- Người phụ trách xét nghiệm duyệt nguồn, phiên bản IFU và cách diễn giải các điểm không nhất quán trong tài liệu gốc. Ngưỡng ghép nồng độ ±10% là quy ước của ứng dụng, không phải khuyến cáo quốc tế.
- Xác nhận kế hoạch thí nghiệm, tính ổn định của vật liệu qua ngày và phạm vi sử dụng. Hoàn thiện phương pháp thống kê chuyên biệt nếu muốn dùng các nhánh thăm dò để xác nhận chính thức.
- Cấp quyền website cho thành viên trước, sau đó dùng mã tham gia để phân quyền nghiệp vụ theo đơn vị. Bản phát hành đầu giữ quyền truy cập riêng tư của chủ sở hữu.
- Đo thời gian xử lý trước/sau trên cùng bộ hồ sơ giả lập; chưa có cơ sở tuyên bố tỷ lệ tiết kiệm thực tế.
- Phân công người duy trì nguồn tham chiếu, kiểm tra định kỳ bản vá thư viện, sao lưu và thử khôi phục. Hiện giao diện liệt kê tối đa 500 hồ sơ và 200 nhật ký; xuất JSON tương ứng phần đang hiển thị.
- Không có chữ ký số pháp lý, kết nối LIS hoặc chứng nhận ISO tự động.

Xem `docs/VALIDATION.md` và `docs/SOURCE_REVIEW.md` để biết kết quả kiểm thử và các giới hạn.
