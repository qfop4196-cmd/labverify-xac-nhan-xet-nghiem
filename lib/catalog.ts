export type ReferencePoint = {name:string; concentration:number; repeatCV:number; withinCV:number; repeatSD:number; withinSD:number};
export type Profile = {id:string;manufacturer:string;model:string;assay:string;analyte:string;unit:string;matrix:string;version:string;source:string;url:string;note:string;points:ReferencePoint[]};
export const REVIEW_DATE='2026-09-06';
export const CLIA_URL='https://www.govinfo.gov/content/pkg/CFR-2025-title42-vol5/pdf/CFR-2025-title42-vol5-sec493-933.pdf';
export const profiles:Profile[]=[
{id:'dxi-local-ft4',manufacturer:'Beckman Coulter',model:'DxI 800',assay:'FT4 theo hồ sơ đơn vị',analyte:'FT4',unit:'ng/dL',matrix:'Huyết thanh / huyết tương heparin',version:'BM03 · hồ sơ 03/2026',source:'BM03 Kế hoạch kiểm tra xác nhận giá trị sử dụng',url:'',note:'Thông số chép từ hồ sơ người dùng. Chưa có IFU khớp chính xác phiên bản này. Cần xác nhận bộ thuốc thử và nguồn gốc công bố trước áp dụng.',points:[{name:'Thấp',concentration:.51,repeatCV:3.9,withinCV:5.2,repeatSD:.02,withinSD:.03},{name:'Bình thường',concentration:.73,repeatCV:2.6,withinCV:3.6,repeatSD:.02,withinSD:.03},{name:'Cao',concentration:2.37,repeatCV:2,withinCV:2.7,repeatSD:.05,withinSD:.06}]},
{id:'access-ft4-2019',manufacturer:'Beckman Coulter',model:'Access Immunoassay Systems',assay:'Access Free T4 · 33880',analyte:'FT4',unit:'ng/dL',matrix:'Huyết thanh / huyết tương heparin',version:'B01902 L · 05/2019 · trang 9',source:'Beckman Coulter · Instructions For Use',url:'https://www.beckmancoulter.com/download/file/phxB01902L-EN_US/B01902L?type=pdf',note:'Kết quả nghiên cứu độ chụm trong IFU 2019, không tự động thay cho công bố của mọi máy DxI hoặc phiên bản thuốc thử khác. FT4 Access không được pha loãng để định lượng.',points:[{name:'Mức 1',concentration:.46,repeatCV:4.4,withinCV:9.2,repeatSD:.02,withinSD:.04},{name:'Mức 2',concentration:.76,repeatCV:2.12,withinCV:4.95,repeatSD:.02,withinSD:.04},{name:'Mức 3',concentration:2.04,repeatCV:2.74,withinCV:4.32,repeatSD:.06,withinSD:.09},{name:'Mức 4',concentration:4.27,repeatCV:1.82,withinCV:5.05,repeatSD:.08,withinSD:.22}]},
{id:'cobas-ft4-iii',manufacturer:'Roche Diagnostics',model:'cobas e 411',assay:'Elecsys FT4 III',analyte:'FT4',unit:'ng/dL',matrix:'Huyết thanh / huyết tương Li-heparin, K2/K3-EDTA',version:'FDA K181233 · 2018 · trang 4',source:'FDA · Decision Summary K181233',url:'https://www.accessdata.fda.gov/cdrh_docs/reviews/K181233.pdf',note:'Nghiên cứu trên cobas e 411 với Elecsys FT4 III. Không suy rộng cho e 601, e 801 hoặc FT4 II/IV. Cần kiểm tra IFU đang sử dụng.',points:[{name:'Huyết thanh 2',concentration:1.05,repeatCV:1.8,withinCV:3.5,repeatSD:.019,withinSD:.037},{name:'Huyết thanh 3',concentration:1.86,repeatCV:1.7,withinCV:3,repeatSD:.032,withinSD:.057},{name:'Huyết thanh 4',concentration:4.49,repeatCV:1.9,withinCV:3.9,repeatSD:.086,withinSD:.176}]}
];
export const benchmarks=[
{analyte:'FT4',unit:'ng/dL',percent:15,absolute:.3},
{analyte:'TSH',unit:'mIU/L',percent:20,absolute:.2},
{analyte:'Glucose',unit:'mg/dL',percent:8,absolute:6},
{analyte:'HbA1c',unit:'%',percent:8,absolute:0},
{analyte:'Kali',unit:'mmol/L',percent:0,absolute:.3},
{analyte:'Natri',unit:'mmol/L',percent:0,absolute:4},
{analyte:'Triglyceride',unit:'mg/dL',percent:15,absolute:0},
{analyte:'Uric acid',unit:'mg/dL',percent:10,absolute:0}
];
export const sourceNotes=[
{title:'Đối chiếu nguồn theo đúng phạm vi',body:'Một chuẩn ngoại kiểm như CLIA không phải bảng xếp hạng máy toàn thế giới và không chứng nhận phương pháp. Ứng dụng hiển thị khoảng cách đến tiêu chí đã chọn, kèm tên nguồn và phiên bản.'},
{title:'Chênh lệch trong tài liệu nội bộ',body:'BM03 ghi FT4 ng/dL; BM04 có dòng ghi ng/mL. Hệ thống chuẩn hóa hồ sơ FT4 có sẵn về ng/dL, không tự quy đổi dữ liệu nhập. Một số bảng độ nhạy/đặc hiệu trong SOP đảo mẫu số; ứng dụng dùng TP/(TP+FN), TN/(TN+FP).'},
{title:'Độ chụm và độ không đảm bảo đo',body:'ANOVA phân tách phương sai trong ngày và giữa ngày. Khi đã dùng SD trong PXN (bao gồm lặp lại), không cộng thêm SD lặp lại lần nữa. Ước lượng U cần thành phần độ không đảm bảo đích và đánh giá độ chệch, không được suy từ CV đơn thuần.'},
{title:'CLSI và EFLM',body:'CLSI EP15 là phương pháp xác nhận có giới hạn xác nhận thống kê; so sánh trực tiếp CV/SD trong ứng dụng không thay cho EP15 đầy đủ. Chưa nhập các ngưỡng EFLM khi chưa xác minh phiên bản, chất phân tích và điều kiện áp dụng.'}
];
export const knowledge=[
{id:'qt-steps',title:'Luồng hồ sơ XN-QTQL-16',text:'Chọn phương pháp (BM05), lập kế hoạch (BM03), đánh giá điều kiện (BM07), thu thập dữ liệu (BM01/BM06), đánh giá (BM04), xem xét và phê duyệt. Nếu chưa đạt: ghi nguyên nhân, khắc phục và tạo phiên bản đánh giá lại.'},
{id:'qt-precision',title:'Độ chụm theo SOP nội bộ',text:'Với dữ liệu ổn định cùng mức, cùng vật liệu qua ngày: ANOVA một yếu tố cho SD lặp lại và SD trong PXN. Nhánh dài ngày yêu cầu ít nhất 20 ngày. Đối chiếu trực tiếp với công bố đã chọn. Không gộp các mẫu bệnh nhân có nồng độ khác nhau thành một nhóm ANOVA.'},
{id:'qt-te',title:'Sai số toàn bộ và mục tiêu chất lượng',text:'TE% = |Bias%| + z × CV trong PXN. Hồ sơ FT4 BM03 chọn TE < 0,5 TEa; SOP cho khoảng hệ số 0,5 đến 1 và z từ 1,65 đến 2. Người lập chọn tiêu chí trước khi xem kết quả. CLIA FT4: dùng giới hạn lớn hơn giữa 15% và 0,3 ng/dL, quy đổi về phần trăm tại giá trị đích.'},
{id:'qt-scope',title:'Phạm vi kết luận',text:'Đạt tiêu chí đang xét không có nghĩa toàn bộ phương pháp đã được xác nhận. Các chỉ tiêu phù hợp với mục đích sử dụng phải được lập kế hoạch và người có thẩm quyền xem xét. LoD cần dữ liệu phát hiện ở nồng độ thấp và giới hạn nền; không lấy 95% kết quả nhỏ hơn LoD để chứng minh khả năng phát hiện.'}
];
