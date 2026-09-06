import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'LabVerify | Kiểm tra xác nhận xét nghiệm', description: 'Đánh giá hiệu năng phương pháp xét nghiệm, đối chiếu nguồn tham chiếu và quản lý hồ sơ phê duyệt.' };
export default function RootLayout({children}: {children: React.ReactNode}) { return <html lang="vi"><body>{children}</body></html>; }
