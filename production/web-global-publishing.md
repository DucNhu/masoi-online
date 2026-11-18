# 🌍 Hướng Dẫn Phát Hành Web Game Toàn Cầu & Kiếm Tiền Quốc Tế
## Global Web Distribution & International Monetization Guide
### Dự án: Ma Sói Online & 3D Campfire (Werewolf 3D: Campfire Party)

---

## 1. TỔNG QUAN CHIẾN LƯỢC: "WEB TRƯỚC" (WEB-FIRST GLOBAL DISTRIBUTION)
- **Ưu tiên số 1**: Xuất bản game trực tiếp lên mạng web toàn cầu dưới dạng **HTML5 / WebGL Instant Play** (Không cần cài đặt, tải nhanh dưới 2 giây trên mọi trình duyệt Chrome, Safari, Edge, Firefox, iOS Mobile Safari và Android Chrome).
- **Mô hình Doanh Thu Quốc Tế (International Voluntary Patronage)**:
  - 100% Phi cờ bạc (Zero-Gambling Compliance), không cá cược, không rút tiền mặt.
  - Tích hợp 3 cổng ủng hộ quốc tế 1-chạm:
    * ☕ **Buy Me a Coffee**: [https://buymeacoffee.com/ducnhu](https://buymeacoffee.com/ducnhu) (Thẻ Visa/Mastercard, Apple Pay, Google Pay).
    * 🅿️ **PayPal.Me**: [https://paypal.me/ducnhu](https://paypal.me/ducnhu) (Chuyển tiền nhanh 1-chạm bảo vệ người mua).
    * ❤️ **Ko-fi**: [https://ko-fi.com/ducnhu](https://ko-fi.com/ducnhu) (Ủng hộ 0% phí nền tảng).
  - Tặng quà vinh danh (Perks): Coins, Danh hiệu độc quyền (*Camp Fan, Village Patron, Forest Knight, Moonlight VIP*), Huy hiệu rực rỡ và hiệu ứng pháo hoa Confetti.
- **File Gói Phân Phối (Production Bundle)**: `werewolf-3d-web.zip` (sinh ra qua lệnh `npm run build:zip`).

---

## 2. HƯỚNG DẪN XUẤT BẢN CHI TIẾT TỪNG NỀN TẢNG (STEP-BY-STEP PLATFORM GUIDES)

### 2.1. itch.io (Nền Tảng Game Indie Số 1 Thế Giới - Khuyến Nghị Hàng Đầu)
itch.io là kênh phân phối game độc lập linh hoạt và thân thiện nhất với các game HTML5 Three.js / React:
1. **Đăng ký / Đăng nhập tài khoản**: Truy cập [https://itch.io](https://itch.io) -> Đăng nhập tài khoản nhà phát triển.
2. **Tạo Project mới**:
   - Nhấp vào avatar góc phải trên -> chọn **Upload new project**.
   - **Title**: `Werewolf 3D: Campfire Online`
   - **Project URL**: `https://ducnhu.itch.io/werewolf-3d-campfire`
   - **Classification**: Chọn **Games**.
   - **Kind of project**: Chọn **HTML** (*You have a ZIP or HTML file that will be played in the browser*).
3. **Tải File Game Lên (Upload)**:
   - Tại mục **Uploads**, nhấp **Upload files** -> Chọn file `werewolf-3d-web.zip`.
   - Sau khi tải lên xong, tích chọn ô: **This file will be played in the browser**.
4. **Cấu hình Khung Hình Nhúng (Embed Options)**:
   - **Viewport dimensions**: Chiều rộng `1280` px, Chiều cao `720` px (Tỷ lệ 16:9 chuẩn).
   - Tích chọn: **Auto-detect size** hoặc **Fullscreen button** (Cho phép người chơi phóng to toàn màn hình).
   - Tích chọn: **Mobile friendly** (Hỗ trợ định hướng ngang/dọc trên điện thoại).
5. **Cấu hình Quyên Góp & Kiếm Tiền (Pricing)**:
   - **Pricing**: Chọn **$0 or donate** (Khuyến khích ủng hộ tự nguyện).
   - **Suggested donation**: `$3.00` hoặc `$5.00`.
6. **Điền Nội Dung & Hình Ảnh**:
   - Copy toàn bộ nội dung từ mục **3. COPY-PASTE STORE ASSETS** bên dưới vào phần Description.
   - Thêm Cover Image (630x500px) và Screenshots cảnh lửa trại 3D Chibi.
7. **Xuất Bản**:
   - Đặt **Visibility** thành **Public**.
   - Nhấp **Save & View Page** để kiểm tra gameplay trực tiếp trong iframe.

---

### 2.2. CrazyGames (Cổng Game Trình Duyệt Triệu Lượt Chơi Hàng Ngày)
CrazyGames là cổng web game casual lớn nhất hiện nay với hàng chục triệu người chơi:
1. Truy cập **CrazyGames Developer Portal**: [https://developer.crazygames.com](https://developer.crazygames.com).
2. Tạo game mới:
   - **Game Name**: `Werewolf 3D: Campfire Party`
   - **Platform**: `HTML5`
   - **Source**: Tải lên `werewolf-3d-web.zip` (hoặc cung cấp link hosted Vercel/GitHub Pages `https://ducnhu.github.io/masoi-online/`).
3. Đáp ứng tiêu chuẩn kỹ thuật CrazyGames:
   - Game chạy độc lập trên `index.html`.
   - Tương thích Responsive Fullscreen.
   - Không chứa liên kết ngoài gây crash iframe sandbox.
4. Gửi duyệt (Submit for Review) -> Đội ngũ QA của CrazyGames sẽ test và phản hồi trong 24-48 giờ.

---

### 2.3. GameJolt
1. Đăng nhập [https://gamejolt.com](https://gamejolt.com) -> Nhấp nút **Add Game**.
2. Chọn loại game: **Complete / Stable**.
3. Tại phần **Packages**:
   - Thêm bản phát hành **Browser / HTML**.
   - Upload file `werewolf-3d-web.zip`.
   - Chọn file chạy chính: `index.html`.
4. Thiết lập độ phân giải mặc định: `1280 x 720`, bật chế độ Fullscreen.

---

### 2.4. Poki (Poki for Developers)
1. Đăng ký thông qua [https://developers.poki.com](https://developers.poki.com).
2. Nộp bản build demo (sử dụng link Vercel / GitHub Pages).
3. Đội ngũ Curators của Poki đánh giá độ cuốn hút của core loop và phản hồi hợp đồng phân phối toàn cầu.

---

## 3. COPY-PASTE TIẾNG ANH CHUẨN QUỐC TẾ (ENGLISH STORE ASSETS)

### 📌 Title & Short Tagline
- **Game Title**: `Werewolf 3D: Campfire Online (Social Deduction Party)`
- **Short Tagline**: `The Cozy 3D Werewolf & Mafia Game in Your Browser! Roam around the campfire, chat with voice, and unmask the wolves under the full moon.`

---

### 📌 Long Description (Markdown Ready)
```markdown
🔥 Welcome to **Werewolf 3D: Campfire Online** — the ultimate cross-platform social deduction party game right in your web browser!

Gather around the crackling 3D bonfire under the starlit sky. Night falls upon the village, whispers spread through the pine forest, and hungry werewolves hunt their prey. When dawn breaks, debate with friends, analyze suspicious clues, and vote out the wolves before they take over the town!

### 🌟 KEY FEATURES
- 🏕️ **Interactive 3D Campfire Metaverse**: Freely roam around the pine woods, sit on logs, jump, howl at the moon, and interact with fellow campers in real time using Three.js 3D Chibi avatars!
- 🎙️ **Real-Time WebRTC Spatial Voice Chat**: Hear other players naturally based on their distance and position around the campfire. No third-party apps required!
- 🎭 **Rich Role Variety**: Play as the cunning **Werewolf**, wise **Seer**, fearless **Hunter**, protective **Bodyguard**, mystical **Witch**, or clever **Villager**.
- 👗 **49+ Chibi Costumes & Accessories**: Express your unique style with 14 skins (Vampire Lord, Samurai, Cyber Wolf, Cupid), 13 hats, 10 glowing eye effects, and 12 back wings/swords!
- ⚡ **Instant Zero-Install Play**: Optimized for lightning-fast loading on mobile and desktop web browsers. No large downloads or app store hurdles!
- 🛡️ **Zero-Gambling, 100% Fair Play**: A purely social and recreational indie project built with love for the global community.

### 🎮 GAME CONTROLS
- **Desktop (Keyboard & Mouse)**:
  - `W / A / S / D` or `Arrow Keys`: Move character
  - `Spacebar`: Jump / Howl
  - `Mouse Drag / Right-Click`: Rotate 3D camera
  - `Mouse Wheel`: Zoom camera in & out
  - `C` or `Wardrobe Icon`: Open 3D Chibi Fashion Wardrobe
  - `M`: Toggle Microphone
- **Mobile & Tablet**:
  - Touch-screen Virtual Joystick to move
  - One-touch action buttons for jumping, voting, and night abilities
  - Pinch-to-zoom camera

### 💖 VOLUNTARY SUPPORT & SPONSORSHIP
Werewolf 3D is 100% free-to-play with zero pay-to-win mechanics. If you enjoy cozy late-night matches with friends, you can support our 24/7 WebRTC server costs:
- ☕ **Buy Me a Coffee**: https://buymeacoffee.com/ducnhu
- 🅿️ **PayPal.Me**: https://paypal.me/ducnhu
- ❤️ **Ko-fi**: https://ko-fi.com/ducnhu

*All supporters receive exclusive in-game Coins, unique VIP titles, and moonlight badges!*
```

---

### 📌 FAQ (Frequently Asked Questions)
```markdown
Q: Do I need to create an account to play?
A: No! You can jump right in as a guest with instant room codes, or customize your player name and profile in seconds.

Q: How does Voice Chat work?
A: We use secure peer-to-peer WebRTC mesh technology directly in your browser. Simply allow microphone access when prompted to speak with your room.

Q: Can mobile and PC players play together?
A: Yes! The game is fully cross-platform with real-time sync between iPhone, Android, iPad, Mac, and Windows browsers.
```

---

## 4. QUY TRÌNH BUILD & TẠO FILE ZIP PHÂN PHỐI

Để tạo gói zip phân phối mới nhất bất kỳ lúc nào, chỉ cần chạy lệnh:
```bash
npm run build:zip
```
Script sẽ tự động:
1. Biên dịch TypeScript và build code production tối ưu qua Vite (`dist/`).
2. Nén toàn bộ thư mục `dist/` thành file nén chuẩn `werewolf-3d-web.zip` ở thư mục gốc.
3. Sẵn sàng kéo thả upload trực tiếp lên itch.io, CrazyGames, GameJolt hoặc Poki!
