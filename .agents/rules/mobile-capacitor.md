# Mobile Native Standards — iOS & Android via Capacitor

Tài liệu quy định tiêu chuẩn kỹ thuật đóng gói và vận hành ứng dụng Ma Sói trên thiết bị di động Native (App Store & Google Play) thông qua Capacitor Framework.

## 1. Kiến Trúc Mobile Bridge
- **Engine Core**: Web application Vite + React + TypeScript + Vanilla CSS.
- **Native Wrapper**: `@capacitor/core`, `@capacitor/ios`, `@capacitor/android`, `@capacitor/cli`.
- **Target OS**:
  - **iOS**: iOS 15.0+ (Tối ưu đặc thù iPhone 16 Pro, iPhone 15/14 Pro với Dynamic Island và ProMotion 120Hz).
  - **Android**: Android 10+ (API Level 29+), hỗ trợ đa dạng màn hình, gesture navigation.

## 2. Tiêu Chuẩn UX & Safe Area (Bắt Buộc)
- **Viewport Safe-Area Insets**:
  - Bắt buộc khai báo `viewport-fit=cover` trong `index.html`.
  - Toàn bộ layout cố định (Header, Fixed Footer, Modals) phải padding bằng biến CSS:
    ```css
    padding-top: env(safe-area-inset-top, 20px);
    padding-bottom: env(safe-area-inset-bottom, 20px);
    padding-left: env(safe-area-inset-left, 0px);
    padding-right: env(safe-area-inset-right, 0px);
    ```
- **Touch & Gesture**:
  - Chiều cao/rộng vùng chạm tối thiểu: **48px** cho tất cả các nút bấm, lá bài, và lựa chọn người chơi.
  - Vô hiệu hóa hành vi zoom ngoài ý muốn: `touch-action: manipulation`.
  - Tích hợp Haptic Feedback (`@capacitor/haptics`) khi người chơi chọn bài, bấm vote, hoặc khi đến lượt hành động trong đêm.

## 3. Quản Lý Trạng Thái & Ứng Biến Vòng Đời Ứng Dụng (App Lifecycle)
- **Backgrounding & Pause**:
  - Khi người dùng nhận cuộc gọi hoặc chuyển ứng dụng (`appStateChange: isActive: false`), game engine phải tự động lưu snapshot vào `localStorage`.
- **Screen Awake**:
  - Trong quá trình diễn ra ván đấu ban đêm hoặc đếm ngược ban ngày, tích hợp giữ sáng màn hình để quản trò hoặc người chơi không bị tắt màn hình đột ngột.
- **Privacy Shield**:
  - Chế độ bảo mật chống người ngồi kế bên nhìn lén lá bài / thông tin vai trò khi cầm điện thoại.

## 4. Quy Trình Build & Xuất Bản (Build Pipeline)
- Build web: `npm run build` -> sinh thư mục `dist/`.
- Đồng bộ Native: `npx cap sync` (cập nhật code web vào Xcode project và Android Studio project).
- Mở IDE native khi cần cấu hình certificate: `npx cap open ios` / `npx cap open android`.
