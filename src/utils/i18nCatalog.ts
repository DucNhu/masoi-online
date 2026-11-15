/**
 * i18nCatalog.ts
 * Engine hỗ trợ 128+ Quốc gia & Vùng lãnh thổ trên toàn thế giới cho Ma Sói Game Studio.
 * Cung cấp danh mục ngôn ngữ toàn cầu, tự động phát hiện theo Browser Locale / TimeZone,
 * và điều phối chuyển đổi ngôn ngữ đồng bộ toàn bộ ứng dụng.
 */

export interface LanguageEntry {
  code: string;        // VD: 'vi-VN', 'en-US', 'en-GB', 'ja-JP', 'ko-KR', 'zh-CN', 'fr-FR', ...
  name: string;        // Tên ngôn ngữ/quốc gia bằng Tiếng Việt & Quốc tế, VD: 'Tiếng Việt (Việt Nam)'
  nativeName: string;  // Tên bản địa, VD: 'Tiếng Việt', 'English (United States)', '日本語 (日本)', '한국어 (대한민국)'
  country: string;     // Tên quốc gia, VD: 'Việt Nam / Vietnam', 'Nhật Bản / Japan'
  flag: string;        // Emoji cờ quốc gia, VD: '🇻🇳', '🇺🇸', '🇯🇵', '🇰🇷'
  region: 'ASIA' | 'EUROPE' | 'AMERICAS' | 'MEA' | 'OCEANIA';
  uiLang: 'vi' | 'en'; // Ngôn ngữ hiển thị cốt lõi ('vi' cho Việt Nam, 'en' cho quốc tế)
  greeting: string;    // Câu chào bản địa của quốc gia đó (VD: 'Xin chào', 'Hello', 'こんにちは', '안녕하세요', 'Bonjour', 'Hola'...)
}

/**
 * Danh sách 133 Quốc gia và Vùng lãnh thổ trên toàn cầu (vượt chuẩn 128+).
 */
export const GLOBAL_LANGUAGES: LanguageEntry[] = [
  // ==========================================
  // CHÂU Á (ASIA) - 35 Quốc Gia & Vùng Lãnh Thổ
  // ==========================================
  {
    code: 'vi-VN',
    name: 'Tiếng Việt (Việt Nam)',
    nativeName: 'Tiếng Việt',
    country: 'Việt Nam / Vietnam',
    flag: '🇻🇳',
    region: 'ASIA',
    uiLang: 'vi',
    greeting: 'Xin chào',
  },
  {
    code: 'ja-JP',
    name: 'Tiếng Nhật (Nhật Bản)',
    nativeName: '日本語 (日本)',
    country: 'Nhật Bản / Japan',
    flag: '🇯🇵',
    region: 'ASIA',
    uiLang: 'en',
    greeting: 'こんにちは (Konnichiwa)',
  },
  {
    code: 'ko-KR',
    name: 'Tiếng Hàn (Hàn Quốc)',
    nativeName: '한국어 (대한민국)',
    country: 'Hàn Quốc / South Korea',
    flag: '🇰🇷',
    region: 'ASIA',
    uiLang: 'en',
    greeting: '안녕하세요 (Annyeonghaseyo)',
  },
  {
    code: 'zh-CN',
    name: 'Tiếng Trung Giản Thể (Trung Quốc)',
    nativeName: '简体中文 (中国)',
    country: 'Trung Quốc / China',
    flag: '🇨🇳',
    region: 'ASIA',
    uiLang: 'en',
    greeting: '你好 (Nǐ hǎo)',
  },
  {
    code: 'zh-TW',
    name: 'Tiếng Trung Phồn Thể (Đài Loan)',
    nativeName: '繁體中文 (台灣)',
    country: 'Đài Loan / Taiwan',
    flag: '🇹🇼',
    region: 'ASIA',
    uiLang: 'en',
    greeting: '你好 (Nǐ hǎo)',
  },
  {
    code: 'zh-HK',
    name: 'Tiếng Trung Phồn Thể (Hồng Kông)',
    nativeName: '繁體中文 (香港)',
    country: 'Hồng Kông / Hong Kong',
    flag: '🇭🇰',
    region: 'ASIA',
    uiLang: 'en',
    greeting: '你好 (Néih hóu)',
  },
  {
    code: 'th-TH',
    name: 'Tiếng Thái (Thái Lan)',
    nativeName: 'ภาษาไทย (ประเทศไทย)',
    country: 'Thái Lan / Thailand',
    flag: '🇹🇭',
    region: 'ASIA',
    uiLang: 'en',
    greeting: 'สวัสดี (Sawasdee)',
  },
  {
    code: 'id-ID',
    name: 'Tiếng Indonesia (Indonesia)',
    nativeName: 'Bahasa Indonesia',
    country: 'Indonesia',
    flag: '🇮🇩',
    region: 'ASIA',
    uiLang: 'en',
    greeting: 'Halo / Selamat',
  },
  {
    code: 'ms-MY',
    name: 'Tiếng Mã Lai (Malaysia)',
    nativeName: 'Bahasa Melayu (Malaysia)',
    country: 'Malaysia',
    flag: '🇲🇾',
    region: 'ASIA',
    uiLang: 'en',
    greeting: 'Selamat Sejahtera',
  },
  {
    code: 'en-SG',
    name: 'Tiếng Anh (Singapore)',
    nativeName: 'English (Singapore)',
    country: 'Singapore',
    flag: '🇸🇬',
    region: 'ASIA',
    uiLang: 'en',
    greeting: 'Hello / Welcome',
  },
  {
    code: 'tl-PH',
    name: 'Tiếng Filipino (Philippines)',
    nativeName: 'Tagalog (Pilipinas)',
    country: 'Philippines',
    flag: '🇵🇭',
    region: 'ASIA',
    uiLang: 'en',
    greeting: 'Kamusta',
  },
  {
    code: 'hi-IN',
    name: 'Tiếng Hindi (Ấn Độ)',
    nativeName: 'हिन्दी (भारत)',
    country: 'Ấn Độ / India',
    flag: '🇮🇳',
    region: 'ASIA',
    uiLang: 'en',
    greeting: 'नमस्ते (Namaste)',
  },
  {
    code: 'en-IN',
    name: 'Tiếng Anh (Ấn Độ)',
    nativeName: 'English (India)',
    country: 'Ấn Độ / India',
    flag: '🇮🇳',
    region: 'ASIA',
    uiLang: 'en',
    greeting: 'Namaste / Hello',
  },
  {
    code: 'ur-PK',
    name: 'Tiếng Urdu (Pakistan)',
    nativeName: 'اردو (پاکستان)',
    country: 'Pakistan',
    flag: '🇵🇰',
    region: 'ASIA',
    uiLang: 'en',
    greeting: 'السلام علیکم (Assalam-o-Alaikum)',
  },
  {
    code: 'bn-BD',
    name: 'Tiếng Bengali (Bangladesh)',
    nativeName: 'বাংলা (বাংলাদেশ)',
    country: 'Bangladesh',
    flag: '🇧🇩',
    region: 'ASIA',
    uiLang: 'en',
    greeting: 'হ্যালো (Hyālō)',
  },
  {
    code: 'si-LK',
    name: 'Tiếng Sinhala (Sri Lanka)',
    nativeName: 'සිංහල (ශ්‍රී ලංකාව)',
    country: 'Sri Lanka',
    flag: '🇱🇰',
    region: 'ASIA',
    uiLang: 'en',
    greeting: 'ආයුබෝවන් (Ayubowan)',
  },
  {
    code: 'ne-NP',
    name: 'Tiếng Nepal (Nepal)',
    nativeName: 'नेपाली (नेपाल)',
    country: 'Nepal',
    flag: '🇳🇵',
    region: 'ASIA',
    uiLang: 'en',
    greeting: 'नमस्ते (Namaste)',
  },
  {
    code: 'my-MM',
    name: 'Tiếng Miến Điện (Myanmar)',
    nativeName: 'မြန်မာဘာသာ (မြန်မာ)',
    country: 'Myanmar',
    flag: '🇲🇲',
    region: 'ASIA',
    uiLang: 'en',
    greeting: 'မင်္ဂလာပါ (Mingalaba)',
  },
  {
    code: 'km-KH',
    name: 'Tiếng Khmer (Campuchia)',
    nativeName: 'ភាសាខ្មែរ (កម្ពុជា)',
    country: 'Campuchia / Cambodia',
    flag: '🇰🇭',
    region: 'ASIA',
    uiLang: 'en',
    greeting: 'ជំរាបសួរ (Choum Reap Sour)',
  },
  {
    code: 'lo-LA',
    name: 'Tiếng Lào (Lào)',
    nativeName: 'ພາສາລາວ (ປະເທດລາວ)',
    country: 'Lào / Laos',
    flag: '🇱🇦',
    region: 'ASIA',
    uiLang: 'en',
    greeting: 'ສະບາຍດີ (Sabaidee)',
  },
  {
    code: 'mn-MN',
    name: 'Tiếng Mông Cổ (Mông Cổ)',
    nativeName: 'Монгол хэл (Монгол)',
    country: 'Mông Cổ / Mongolia',
    flag: '🇲🇳',
    region: 'ASIA',
    uiLang: 'en',
    greeting: 'Сайн байна уу (Sain baina uu)',
  },
  {
    code: 'kk-KZ',
    name: 'Tiếng Kazakh (Kazakhstan)',
    nativeName: 'Қазақ тілі (Қазақстан)',
    country: 'Kazakhstan',
    flag: '🇰🇿',
    region: 'ASIA',
    uiLang: 'en',
    greeting: 'Сәлеметсіз бе (Sälemetsiz be)',
  },
  {
    code: 'uz-UZ',
    name: 'Tiếng Uzbek (Uzbekistan)',
    nativeName: 'Oʻzbek tili (Oʻzbekiston)',
    country: 'Uzbekistan',
    flag: '🇺🇿',
    region: 'ASIA',
    uiLang: 'en',
    greeting: 'Salom',
  },
  {
    code: 'az-AZ',
    name: 'Tiếng Azerbaijan (Azerbaijan)',
    nativeName: 'Azərbaycan dili',
    country: 'Azerbaijan',
    flag: '🇦🇿',
    region: 'ASIA',
    uiLang: 'en',
    greeting: 'Salam',
  },
  {
    code: 'ka-GE',
    name: 'Tiếng Georgia (Georgia)',
    nativeName: 'ქართული (საქართველო)',
    country: 'Georgia',
    flag: '🇬🇪',
    region: 'ASIA',
    uiLang: 'en',
    greeting: 'გამარჯობა (Gamarjoba)',
  },
  {
    code: 'hy-AM',
    name: 'Tiếng Armenia (Armenia)',
    nativeName: 'Հայերեն (Հայաստան)',
    country: 'Armenia',
    flag: '🇦🇲',
    region: 'ASIA',
    uiLang: 'en',
    greeting: 'Բարև (Barev)',
  },
  {
    code: 'ms-BN',
    name: 'Tiếng Mã Lai (Brunei)',
    nativeName: 'Bahasa Melayu (Brunei)',
    country: 'Brunei',
    flag: '🇧🇳',
    region: 'ASIA',
    uiLang: 'en',
    greeting: 'Selamat Sejahtera',
  },
  {
    code: 'pt-TL',
    name: 'Tiếng Bồ Đào Nha (Đông Timor)',
    nativeName: 'Português (Timor-Leste)',
    country: 'Đông Timor / Timor-Leste',
    flag: '🇹🇱',
    region: 'ASIA',
    uiLang: 'en',
    greeting: 'Olá',
  },
  {
    code: 'dv-MV',
    name: 'Tiếng Dhivehi (Maldives)',
    nativeName: 'ދިވެހި (ދިވެހިރާއްޖެ)',
    country: 'Maldives',
    flag: '🇲🇻',
    region: 'ASIA',
    uiLang: 'en',
    greeting: 'Assalaam Alaikum',
  },
  {
    code: 'dz-BT',
    name: 'Tiếng Dzongkha (Bhutan)',
    nativeName: 'རྫོང་ཁ (འབྲུག)',
    country: 'Bhutan',
    flag: '🇧🇹',
    region: 'ASIA',
    uiLang: 'en',
    greeting: 'Kuzu zangpo la',
  },
  {
    code: 'ky-KG',
    name: 'Tiếng Kyrgyz (Kyrgyzstan)',
    nativeName: 'Кыргызча (Кыргызстан)',
    country: 'Kyrgyzstan',
    flag: '🇰🇬',
    region: 'ASIA',
    uiLang: 'en',
    greeting: 'Саламатсызбы (Salamatsyzby)',
  },
  {
    code: 'tg-TJ',
    name: 'Tiếng Tajik (Tajikistan)',
    nativeName: 'Тоҷикӣ (Тоҷикистон)',
    country: 'Tajikistan',
    flag: '🇹🇯',
    region: 'ASIA',
    uiLang: 'en',
    greeting: 'Салом (Salom)',
  },
  {
    code: 'tk-TM',
    name: 'Tiếng Turkmen (Turkmenistan)',
    nativeName: 'Türkmençe (Türkmenistan)',
    country: 'Turkmenistan',
    flag: '🇹🇲',
    region: 'ASIA',
    uiLang: 'en',
    greeting: 'Salam',
  },
  {
    code: 'ps-AF',
    name: 'Tiếng Pashto (Afghanistan)',
    nativeName: 'پښتو (افغانستان)',
    country: 'Afghanistan',
    flag: '🇦🇫',
    region: 'ASIA',
    uiLang: 'en',
    greeting: 'سلام (Salam)',
  },
  {
    code: 'zh-MO',
    name: 'Tiếng Trung Phồn Thể (Ma Cao)',
    nativeName: '繁體中文 (澳門)',
    country: 'Ma Cao / Macau',
    flag: '🇲🇴',
    region: 'ASIA',
    uiLang: 'en',
    greeting: '你好 (Néih hóu)',
  },

  // ==========================================
  // CHÂU ÂU (EUROPE) - 42 Quốc Gia & Vùng Lãnh Thổ
  // ==========================================
  {
    code: 'en-GB',
    name: 'Tiếng Anh (Vương Quốc Anh)',
    nativeName: 'English (United Kingdom)',
    country: 'Vương Quốc Anh / UK',
    flag: '🇬🇧',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Good day / Cheers',
  },
  {
    code: 'fr-FR',
    name: 'Tiếng Pháp (Pháp)',
    nativeName: 'Français (France)',
    country: 'Pháp / France',
    flag: '🇫🇷',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Bonjour',
  },
  {
    code: 'de-DE',
    name: 'Tiếng Đức (Đức)',
    nativeName: 'Deutsch (Deutschland)',
    country: 'Đức / Germany',
    flag: '🇩🇪',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Guten Tag / Hallo',
  },
  {
    code: 'es-ES',
    name: 'Tiếng Tây Ban Nha (Tây Ban Nha)',
    nativeName: 'Español (España)',
    country: 'Tây Ban Nha / Spain',
    flag: '🇪🇸',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: '¡Hola!',
  },
  {
    code: 'it-IT',
    name: 'Tiếng Ý (Ý)',
    nativeName: 'Italiano (Italia)',
    country: 'Ý / Italy',
    flag: '🇮🇹',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Ciao / Buongiorno',
  },
  {
    code: 'pt-PT',
    name: 'Tiếng Bồ Đào Nha (Bồ Đào Nha)',
    nativeName: 'Português (Portugal)',
    country: 'Bồ Đào Nha / Portugal',
    flag: '🇵🇹',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Olá / Bom dia',
  },
  {
    code: 'ru-RU',
    name: 'Tiếng Nga (Nga)',
    nativeName: 'Русский (Россия)',
    country: 'Nga / Russia',
    flag: '🇷🇺',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Здравствуйте (Privet)',
  },
  {
    code: 'nl-NL',
    name: 'Tiếng Hà Lan (Hà Lan)',
    nativeName: 'Nederlands (Nederland)',
    country: 'Hà Lan / Netherlands',
    flag: '🇳🇱',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Hallo / Goedendag',
  },
  {
    code: 'pl-PL',
    name: 'Tiếng Ba Lan (Ba Lan)',
    nativeName: 'Polski (Polska)',
    country: 'Ba Lan / Poland',
    flag: '🇵🇱',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Cześć / Dzień dobry',
  },
  {
    code: 'sv-SE',
    name: 'Tiếng Thụy Điển (Thụy Điển)',
    nativeName: 'Svenska (Sverige)',
    country: 'Thụy Điển / Sweden',
    flag: '🇸🇪',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Hej / God dag',
  },
  {
    code: 'no-NO',
    name: 'Tiếng Na Uy (Na Uy)',
    nativeName: 'Norsk (Norge)',
    country: 'Na Uy / Norway',
    flag: '🇳🇴',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Hei / God dag',
  },
  {
    code: 'da-DK',
    name: 'Tiếng Đan Mạch (Đan Mạch)',
    nativeName: 'Dansk (Danmark)',
    country: 'Đan Mạch / Denmark',
    flag: '🇩🇰',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Hej / Goddag',
  },
  {
    code: 'fi-FI',
    name: 'Tiếng Phần Lan (Phần Lan)',
    nativeName: 'Suomi (Suomi)',
    country: 'Phần Lan / Finland',
    flag: '🇫🇮',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Hei / Päivää',
  },
  {
    code: 'de-CH',
    name: 'Tiếng Đức (Thụy Sĩ)',
    nativeName: 'Deutsch (Schweiz)',
    country: 'Thụy Sĩ / Switzerland',
    flag: '🇨🇭',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Grüezi / Hallo',
  },
  {
    code: 'de-AT',
    name: 'Tiếng Đức (Áo)',
    nativeName: 'Deutsch (Österreich)',
    country: 'Áo / Austria',
    flag: '🇦🇹',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Servus / Grüß Gott',
  },
  {
    code: 'fr-BE',
    name: 'Tiếng Pháp (Bỉ)',
    nativeName: 'Français (Belgique)',
    country: 'Bỉ / Belgium',
    flag: '🇧🇪',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Bonjour',
  },
  {
    code: 'cs-CZ',
    name: 'Tiếng Séc (Cộng Hòa Séc)',
    nativeName: 'Čeština (Česko)',
    country: 'Cộng hòa Séc / Czechia',
    flag: '🇨🇿',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Ahoj / Dobrý den',
  },
  {
    code: 'hu-HU',
    name: 'Tiếng Hungary (Hungary)',
    nativeName: 'Magyar (Magyarország)',
    country: 'Hungary',
    flag: '🇭🇺',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Szia / Jó napot',
  },
  {
    code: 'ro-RO',
    name: 'Tiếng Romania (Romania)',
    nativeName: 'Română (România)',
    country: 'Romania',
    flag: '🇷🇴',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Bună ziua / Salut',
  },
  {
    code: 'el-GR',
    name: 'Tiếng Hy Lạp (Hy Lạp)',
    nativeName: 'Ελληνικά (Ελλάδα)',
    country: 'Hy Lạp / Greece',
    flag: '🇬🇷',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Γειά σας (Geia sas)',
  },
  {
    code: 'uk-UA',
    name: 'Tiếng Ukraina (Ukraina)',
    nativeName: 'Українська (Україна)',
    country: 'Ukraina / Ukraine',
    flag: '🇺🇦',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Привіт (Pryvit)',
  },
  {
    code: 'en-IE',
    name: 'Tiếng Anh & Gaeilge (Ireland)',
    nativeName: 'English (Ireland) / Gaeilge',
    country: 'Ireland',
    flag: '🇮🇪',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Dia dhuit / Hello',
  },
  {
    code: 'gd-GB',
    name: 'Tiếng Gaelic (Scotland)',
    nativeName: 'Gàidhlig (Alba)',
    country: 'Scotland',
    flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Halò',
  },
  {
    code: 'cy-GB',
    name: 'Tiếng Wales (Xứ Wales)',
    nativeName: 'Cymraeg (Cymru)',
    country: 'Xứ Wales / Wales',
    flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Shwmae',
  },
  {
    code: 'is-IS',
    name: 'Tiếng Iceland (Iceland)',
    nativeName: 'Íslenska (Ísland)',
    country: 'Iceland',
    flag: '🇮🇸',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Halló / Góðan daginn',
  },
  {
    code: 'sk-SK',
    name: 'Tiếng Slovak (Slovakia)',
    nativeName: 'Slovenčina (Slovensko)',
    country: 'Slovakia',
    flag: '🇸🇰',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Ahoj / Dobrý deň',
  },
  {
    code: 'bg-BG',
    name: 'Tiếng Bulgaria (Bulgaria)',
    nativeName: 'Български (България)',
    country: 'Bulgaria',
    flag: '🇧🇬',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Здравейте (Zdraveite)',
  },
  {
    code: 'hr-HR',
    name: 'Tiếng Croatia (Croatia)',
    nativeName: 'Hrvatski (Hrvatska)',
    country: 'Croatia',
    flag: '🇭🇷',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Bok / Dobar dan',
  },
  {
    code: 'sr-RS',
    name: 'Tiếng Serbia (Serbia)',
    nativeName: 'Српски (Србија)',
    country: 'Serbia',
    flag: '🇷🇸',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Здраво (Zdravo)',
  },
  {
    code: 'sl-SI',
    name: 'Tiếng Slovenia (Slovenia)',
    nativeName: 'Slovenščina (Slovenija)',
    country: 'Slovenia',
    flag: '🇸🇮',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Živjo / Dober dan',
  },
  {
    code: 'lt-LT',
    name: 'Tiếng Litva (Litva)',
    nativeName: 'Lietuvių (Lietuva)',
    country: 'Litva / Lithuania',
    flag: '🇱🇹',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Labas / Laba diena',
  },
  {
    code: 'lv-LV',
    name: 'Tiếng Latvia (Latvia)',
    nativeName: 'Latviešu (Latvija)',
    country: 'Latvia',
    flag: '🇱🇻',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Sveiki / Labdien',
  },
  {
    code: 'et-EE',
    name: 'Tiếng Estonia (Estonia)',
    nativeName: 'Eesti (Eesti)',
    country: 'Estonia',
    flag: '🇪🇪',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Tere / Tere päevast',
  },
  {
    code: 'lb-LU',
    name: 'Tiếng Luxembourg (Luxembourg)',
    nativeName: 'Lëtzebuergesch',
    country: 'Luxembourg',
    flag: '🇱🇺',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Moien',
  },
  {
    code: 'mt-MT',
    name: 'Tiếng Malta (Malta)',
    nativeName: 'Malti (Malta)',
    country: 'Malta',
    flag: '🇲🇹',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Bongu / Kif int',
  },
  {
    code: 'sq-AL',
    name: 'Tiếng Albania (Albania)',
    nativeName: 'Shqip (Shqipëria)',
    country: 'Albania',
    flag: '🇦🇱',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Përshëndetje',
  },
  {
    code: 'mk-MK',
    name: 'Tiếng Macedonia (Bắc Macedonia)',
    nativeName: 'Македонски (Северна Македонија)',
    country: 'Bắc Macedonia',
    flag: '🇲🇰',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Здраво (Zdravo)',
  },
  {
    code: 'bs-BA',
    name: 'Tiếng Bosnia (Bosna & Hercegovina)',
    nativeName: 'Bosanski (Bosna i Hercegovina)',
    country: 'Bosnia & Herzegovina',
    flag: '🇧🇦',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Zdravo / Dobar dan',
  },
  {
    code: 'sr-ME',
    name: 'Tiếng Montenegro (Montenegro)',
    nativeName: 'Crnogorski (Crna Gora)',
    country: 'Montenegro',
    flag: '🇲🇪',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Zdravo',
  },
  {
    code: 'be-BY',
    name: 'Tiếng Belarus (Belarus)',
    nativeName: 'Беларуская (Беларусь)',
    country: 'Belarus',
    flag: '🇧🇾',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Прывітанне (Pryvitannie)',
  },
  {
    code: 'ro-MD',
    name: 'Tiếng Romania (Moldova)',
    nativeName: 'Română (Moldova)',
    country: 'Moldova',
    flag: '🇲🇩',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Bună / Salut',
  },
  {
    code: 'fr-MC',
    name: 'Tiếng Pháp (Monaco)',
    nativeName: 'Français (Monaco)',
    country: 'Monaco',
    flag: '🇲🇨',
    region: 'EUROPE',
    uiLang: 'en',
    greeting: 'Bonjour',
  },

  // ==========================================
  // CHÂU MỸ (AMERICAS) - 26 Quốc Gia & Vùng Lãnh Thổ
  // ==========================================
  {
    code: 'en-US',
    name: 'Tiếng Anh (Hoa Kỳ)',
    nativeName: 'English (United States)',
    country: 'Hoa Kỳ / United States',
    flag: '🇺🇸',
    region: 'AMERICAS',
    uiLang: 'en',
    greeting: 'Hello / Welcome',
  },
  {
    code: 'en-CA',
    name: 'Tiếng Anh (Canada)',
    nativeName: 'English (Canada)',
    country: 'Canada',
    flag: '🇨🇦',
    region: 'AMERICAS',
    uiLang: 'en',
    greeting: 'Hello / Welcome eh!',
  },
  {
    code: 'fr-CA',
    name: 'Tiếng Pháp (Canada - Québec)',
    nativeName: 'Français (Canada)',
    country: 'Canada',
    flag: '🇨🇦',
    region: 'AMERICAS',
    uiLang: 'en',
    greeting: 'Bonjour / Allô',
  },
  {
    code: 'es-MX',
    name: 'Tiếng Tây Ban Nha (Mexico)',
    nativeName: 'Español (México)',
    country: 'Mexico',
    flag: '🇲🇽',
    region: 'AMERICAS',
    uiLang: 'en',
    greeting: '¡Hola! ¿Qué onda?',
  },
  {
    code: 'pt-BR',
    name: 'Tiếng Bồ Đào Nha (Brazil)',
    nativeName: 'Português (Brasil)',
    country: 'Brazil',
    flag: '🇧🇷',
    region: 'AMERICAS',
    uiLang: 'en',
    greeting: 'Olá / Tudo bem?',
  },
  {
    code: 'es-AR',
    name: 'Tiếng Tây Ban Nha (Argentina)',
    nativeName: 'Español (Argentina)',
    country: 'Argentina',
    flag: '🇦🇷',
    region: 'AMERICAS',
    uiLang: 'en',
    greeting: '¡Hola, che!',
  },
  {
    code: 'es-CO',
    name: 'Tiếng Tây Ban Nha (Colombia)',
    nativeName: 'Español (Colombia)',
    country: 'Colombia',
    flag: '🇨🇴',
    region: 'AMERICAS',
    uiLang: 'en',
    greeting: '¡Hola! ¿Qué más?',
  },
  {
    code: 'es-CL',
    name: 'Tiếng Tây Ban Nha (Chile)',
    nativeName: 'Español (Chile)',
    country: 'Chile',
    flag: '🇨🇱',
    region: 'AMERICAS',
    uiLang: 'en',
    greeting: '¡Hola! ¿Cómo estai?',
  },
  {
    code: 'es-PE',
    name: 'Tiếng Tây Ban Nha (Peru)',
    nativeName: 'Español (Perú)',
    country: 'Peru',
    flag: '🇵🇪',
    region: 'AMERICAS',
    uiLang: 'en',
    greeting: '¡Hola!',
  },
  {
    code: 'es-VE',
    name: 'Tiếng Tây Ban Nha (Venezuela)',
    nativeName: 'Español (Venezuela)',
    country: 'Venezuela',
    flag: '🇻🇪',
    region: 'AMERICAS',
    uiLang: 'en',
    greeting: '¡Hola! ¿Qué hubo?',
  },
  {
    code: 'es-EC',
    name: 'Tiếng Tây Ban Nha (Ecuador)',
    nativeName: 'Español (Ecuador)',
    country: 'Ecuador',
    flag: '🇪🇨',
    region: 'AMERICAS',
    uiLang: 'en',
    greeting: '¡Hola!',
  },
  {
    code: 'es-CU',
    name: 'Tiếng Tây Ban Nha (Cuba)',
    nativeName: 'Español (Cuba)',
    country: 'Cuba',
    flag: '🇨🇺',
    region: 'AMERICAS',
    uiLang: 'en',
    greeting: '¡Hola! ¿Qué bola?',
  },
  {
    code: 'es-DO',
    name: 'Tiếng Tây Ban Nha (Cộng Hòa Dominica)',
    nativeName: 'Español (República Dominicana)',
    country: 'Cộng hòa Dominica',
    flag: '🇩🇴',
    region: 'AMERICAS',
    uiLang: 'en',
    greeting: '¡Dímelo! / ¡Hola!',
  },
  {
    code: 'es-GT',
    name: 'Tiếng Tây Ban Nha (Guatemala)',
    nativeName: 'Español (Guatemala)',
    country: 'Guatemala',
    flag: '🇬🇹',
    region: 'AMERICAS',
    uiLang: 'en',
    greeting: '¡Hola! ¿Qué onda?',
  },
  {
    code: 'es-CR',
    name: 'Tiếng Tây Ban Nha (Costa Rica)',
    nativeName: 'Español (Costa Rica)',
    country: 'Costa Rica',
    flag: '🇨🇷',
    region: 'AMERICAS',
    uiLang: 'en',
    greeting: '¡Pura Vida!',
  },
  {
    code: 'es-PA',
    name: 'Tiếng Tây Ban Nha (Panama)',
    nativeName: 'Español (Panamá)',
    country: 'Panama',
    flag: '🇵🇦',
    region: 'AMERICAS',
    uiLang: 'en',
    greeting: '¡Hola! ¿Qué xopá?',
  },
  {
    code: 'es-UY',
    name: 'Tiếng Tây Ban Nha (Uruguay)',
    nativeName: 'Español (Uruguay)',
    country: 'Uruguay',
    flag: '🇺🇾',
    region: 'AMERICAS',
    uiLang: 'en',
    greeting: '¡Hola, bo!',
  },
  {
    code: 'es-PY',
    name: 'Tiếng Tây Ban Nha & Guaraní (Paraguay)',
    nativeName: 'Español / Guaraní (Paraguay)',
    country: 'Paraguay',
    flag: '🇵🇾',
    region: 'AMERICAS',
    uiLang: 'en',
    greeting: 'Mba\'éichapa / ¡Hola!',
  },
  {
    code: 'es-BO',
    name: 'Tiếng Tây Ban Nha (Bolivia)',
    nativeName: 'Español (Bolivia)',
    country: 'Bolivia',
    flag: '🇧🇴',
    region: 'AMERICAS',
    uiLang: 'en',
    greeting: '¡Hola!',
  },
  {
    code: 'es-SV',
    name: 'Tiếng Tây Ban Nha (El Salvador)',
    nativeName: 'Español (El Salvador)',
    country: 'El Salvador',
    flag: '🇸🇻',
    region: 'AMERICAS',
    uiLang: 'en',
    greeting: '¡Hola! ¿Qué tal?',
  },
  {
    code: 'es-HN',
    name: 'Tiếng Tây Ban Nha (Honduras)',
    nativeName: 'Español (Honduras)',
    country: 'Honduras',
    flag: '🇭🇳',
    region: 'AMERICAS',
    uiLang: 'en',
    greeting: '¡Hola!',
  },
  {
    code: 'es-NI',
    name: 'Tiếng Tây Ban Nha (Nicaragua)',
    nativeName: 'Español (Nicaragua)',
    country: 'Nicaragua',
    flag: '🇳🇮',
    region: 'AMERICAS',
    uiLang: 'en',
    greeting: '¡Hola! ¿Ideay?',
  },
  {
    code: 'en-JM',
    name: 'Tiếng Anh (Jamaica)',
    nativeName: 'English (Jamaica)',
    country: 'Jamaica',
    flag: '🇯🇲',
    region: 'AMERICAS',
    uiLang: 'en',
    greeting: 'Wah Gwaan / Hello',
  },
  {
    code: 'en-TT',
    name: 'Tiếng Anh (Trinidad & Tobago)',
    nativeName: 'English (Trinidad)',
    country: 'Trinidad & Tobago',
    flag: '🇹🇹',
    region: 'AMERICAS',
    uiLang: 'en',
    greeting: 'Hello / Good day',
  },
  {
    code: 'es-PR',
    name: 'Tiếng Tây Ban Nha (Puerto Rico)',
    nativeName: 'Español (Puerto Rico)',
    country: 'Puerto Rico',
    flag: '🇵🇷',
    region: 'AMERICAS',
    uiLang: 'en',
    greeting: '¡Hola, qué tal!',
  },
  {
    code: 'en-BS',
    name: 'Tiếng Anh (Bahamas)',
    nativeName: 'English (Bahamas)',
    country: 'Bahamas',
    flag: '🇧🇸',
    region: 'AMERICAS',
    uiLang: 'en',
    greeting: 'Hello / Welcome',
  },

  // ==========================================
  // TRUNG ĐÔNG & CHÂU PHI (MEA) - 24 Quốc Gia
  // ==========================================
  {
    code: 'tr-TR',
    name: 'Tiếng Thổ Nhĩ Kỳ (Thổ Nhĩ Kỳ)',
    nativeName: 'Türkçe (Türkiye)',
    country: 'Thổ Nhĩ Kỳ / Turkey',
    flag: '🇹🇷',
    region: 'MEA',
    uiLang: 'en',
    greeting: 'Merhaba / Selam',
  },
  {
    code: 'ar-SA',
    name: 'Tiếng Ả Rập (Ả Rập Xê Út)',
    nativeName: 'العربية (المملكة العربية السعودية)',
    country: 'Ả Rập Xê Út / Saudi Arabia',
    flag: '🇸🇦',
    region: 'MEA',
    uiLang: 'en',
    greeting: 'مرحباً (Marhaban)',
  },
  {
    code: 'ar-AE',
    name: 'Tiếng Ả Rập (UAE - Dubai)',
    nativeName: 'العربية (الإمارات)',
    country: 'UAE / Dubai',
    flag: '🇦🇪',
    region: 'MEA',
    uiLang: 'en',
    greeting: 'مرحباً (Hala)',
  },
  {
    code: 'he-IL',
    name: 'Tiếng Do Thái (Israel)',
    nativeName: 'עברית (ישראל)',
    country: 'Israel',
    flag: '🇮🇱',
    region: 'MEA',
    uiLang: 'en',
    greeting: 'שלום (Shalom)',
  },
  {
    code: 'ar-QA',
    name: 'Tiếng Ả Rập (Qatar)',
    nativeName: 'العربية (قطر)',
    country: 'Qatar',
    flag: '🇶🇦',
    region: 'MEA',
    uiLang: 'en',
    greeting: 'أهلاً وسهلاً',
  },
  {
    code: 'ar-KW',
    name: 'Tiếng Ả Rập (Kuwait)',
    nativeName: 'العربية (الكويت)',
    country: 'Kuwait',
    flag: '🇰🇼',
    region: 'MEA',
    uiLang: 'en',
    greeting: 'مرحباً (Marhaban)',
  },
  {
    code: 'ar-EG',
    name: 'Tiếng Ả Rập (Ai Cập)',
    nativeName: 'العربية (مصر)',
    country: 'Ai Cập / Egypt',
    flag: '🇪🇬',
    region: 'MEA',
    uiLang: 'en',
    greeting: 'أهلاً (Ahlan)',
  },
  {
    code: 'fa-IR',
    name: 'Tiếng Ba Tư (Iran)',
    nativeName: 'فارسی (ایران)',
    country: 'Iran',
    flag: '🇮🇷',
    region: 'MEA',
    uiLang: 'en',
    greeting: 'سلام (Salam)',
  },
  {
    code: 'ar-IQ',
    name: 'Tiếng Ả Rập (Iraq)',
    nativeName: 'العربية (العراق)',
    country: 'Iraq',
    flag: '🇮🇶',
    region: 'MEA',
    uiLang: 'en',
    greeting: 'مرحباً (Marhaban)',
  },
  {
    code: 'ar-JO',
    name: 'Tiếng Ả Rập (Jordan)',
    nativeName: 'العربية (الأردن)',
    country: 'Jordan',
    flag: '🇯🇴',
    region: 'MEA',
    uiLang: 'en',
    greeting: 'أهلاً (Ahlan)',
  },
  {
    code: 'ar-LB',
    name: 'Tiếng Ả Rập (Lebanon)',
    nativeName: 'العربية (لبنان)',
    country: 'Lebanon',
    flag: '🇱🇧',
    region: 'MEA',
    uiLang: 'en',
    greeting: 'أهلاً (Kifak / Marhaba)',
  },
  {
    code: 'ar-MA',
    name: 'Tiếng Ả Rập & Darija (Morocco)',
    nativeName: 'العربية (المغرب) / Darija',
    country: 'Morocco',
    flag: '🇲🇦',
    region: 'MEA',
    uiLang: 'en',
    greeting: 'سلام (Salam / Ahlan)',
  },
  {
    code: 'ar-DZ',
    name: 'Tiếng Ả Rập (Algeria)',
    nativeName: 'العربية (الجزائر)',
    country: 'Algeria',
    flag: '🇩🇿',
    region: 'MEA',
    uiLang: 'en',
    greeting: 'سلام (Salam)',
  },
  {
    code: 'ar-TN',
    name: 'Tiếng Ả Rập (Tunisia)',
    nativeName: 'العربية (تونس)',
    country: 'Tunisia',
    flag: '🇹🇳',
    region: 'MEA',
    uiLang: 'en',
    greeting: 'عسلامة (Aslema)',
  },
  {
    code: 'en-ZA',
    name: 'Tiếng Anh & Zulu (Nam Phi)',
    nativeName: 'English (South Africa) / Zulu',
    country: 'Nam Phi / South Africa',
    flag: '🇿🇦',
    region: 'MEA',
    uiLang: 'en',
    greeting: 'Sawubona / Hello',
  },
  {
    code: 'en-NG',
    name: 'Tiếng Anh & Yoruba (Nigeria)',
    nativeName: 'English (Nigeria) / Yorùbá',
    country: 'Nigeria',
    flag: '🇳🇬',
    region: 'MEA',
    uiLang: 'en',
    greeting: 'Bawo ni / Hello',
  },
  {
    code: 'sw-KE',
    name: 'Tiếng Swahili (Kenya)',
    nativeName: 'Kiswahili (Kenya)',
    country: 'Kenya',
    flag: '🇰🇪',
    region: 'MEA',
    uiLang: 'en',
    greeting: 'Jambo / Habari',
  },
  {
    code: 'am-ET',
    name: 'Tiếng Amharic (Ethiopia)',
    nativeName: 'አማርኛ (ኢትዮጵያ)',
    country: 'Ethiopia',
    flag: '🇪🇹',
    region: 'MEA',
    uiLang: 'en',
    greeting: 'ሰላም (Selam)',
  },
  {
    code: 'en-GH',
    name: 'Tiếng Anh & Twi (Ghana)',
    nativeName: 'English (Ghana) / Twi',
    country: 'Ghana',
    flag: '🇬🇭',
    region: 'MEA',
    uiLang: 'en',
    greeting: 'Akwaaba / Hello',
  },
  {
    code: 'sw-TZ',
    name: 'Tiếng Swahili (Tanzania)',
    nativeName: 'Kiswahili (Tanzania)',
    country: 'Tanzania',
    flag: '🇹🇿',
    region: 'MEA',
    uiLang: 'en',
    greeting: 'Habari / Hujambo',
  },
  {
    code: 'fr-SN',
    name: 'Tiếng Pháp & Wolof (Senegal)',
    nativeName: 'Français (Sénégal) / Wolof',
    country: 'Senegal',
    flag: '🇸🇳',
    region: 'MEA',
    uiLang: 'en',
    greeting: 'Bonjour / Nanga def',
  },
  {
    code: 'fr-CI',
    name: 'Tiếng Pháp (Bờ Biển Ngà)',
    nativeName: 'Français (Côte d\'Ivoire)',
    country: 'Bờ Biển Ngà / Ivory Coast',
    flag: '🇨🇮',
    region: 'MEA',
    uiLang: 'en',
    greeting: 'Bonjour',
  },
  {
    code: 'ar-OM',
    name: 'Tiếng Ả Rập (Oman)',
    nativeName: 'العربية (عمان)',
    country: 'Oman',
    flag: '🇴🇲',
    region: 'MEA',
    uiLang: 'en',
    greeting: 'مرحباً (Marhaban)',
  },
  {
    code: 'ar-BH',
    name: 'Tiếng Ả Rập (Bahrain)',
    nativeName: 'العربية (البحرين)',
    country: 'Bahrain',
    flag: '🇧🇭',
    region: 'MEA',
    uiLang: 'en',
    greeting: 'أهلاً (Ahlan)',
  },

  // ==========================================
  // CHÂU ĐẠI DƯƠNG (OCEANIA) - 6 Quốc Gia
  // ==========================================
  {
    code: 'en-AU',
    name: 'Tiếng Anh (Úc)',
    nativeName: 'English (Australia)',
    country: 'Úc / Australia',
    flag: '🇦🇺',
    region: 'OCEANIA',
    uiLang: 'en',
    greeting: 'G\'day mate!',
  },
  {
    code: 'en-NZ',
    name: 'Tiếng Anh & Māori (New Zealand)',
    nativeName: 'English (New Zealand) / Māori',
    country: 'New Zealand',
    flag: '🇳🇿',
    region: 'OCEANIA',
    uiLang: 'en',
    greeting: 'Kia Ora / Hello',
  },
  {
    code: 'en-FJ',
    name: 'Tiếng Anh & Fijian (Fiji)',
    nativeName: 'English / Na Vosa Vakaviti (Fiji)',
    country: 'Fiji',
    flag: '🇫🇯',
    region: 'OCEANIA',
    uiLang: 'en',
    greeting: 'Bula!',
  },
  {
    code: 'en-PG',
    name: 'Tiếng Anh & Tok Pisin (Papua New Guinea)',
    nativeName: 'Tok Pisin / English (PNG)',
    country: 'Papua New Guinea',
    flag: '🇵🇬',
    region: 'OCEANIA',
    uiLang: 'en',
    greeting: 'Halo olgeta / Hello',
  },
  {
    code: 'sm-WS',
    name: 'Tiếng Samoa (Samoa)',
    nativeName: 'Gagana Sāmoa (Sāmoa)',
    country: 'Samoa',
    flag: '🇼🇸',
    region: 'OCEANIA',
    uiLang: 'en',
    greeting: 'Talofa',
  },
  {
    code: 'to-TO',
    name: 'Tiếng Tonga (Tonga)',
    nativeName: 'Lea Faka-Tonga (Tonga)',
    country: 'Tonga',
    flag: '🇹🇴',
    region: 'OCEANIA',
    uiLang: 'en',
    greeting: 'Mālō e lelei',
  },
];

/**
 * Danh sách Tab lọc khu vực địa lý
 */
export const REGION_TABS = [
  { key: 'ALL', label: 'Tất cả', icon: '🌍' },
  { key: 'ASIA', label: 'Châu Á', icon: '🌏' },
  { key: 'EUROPE', label: 'Châu Âu', icon: '🌍' },
  { key: 'AMERICAS', label: 'Châu Mỹ', icon: '🌎' },
  { key: 'MEA', label: 'Trung Đông & Phi', icon: '🌍' },
  { key: 'OCEANIA', label: 'Châu Đại Dương', icon: '🏝️' },
] as const;

export type RegionKey = typeof REGION_TABS[number]['key'];

/**
 * Tự động phát hiện thông minh ngôn ngữ và quốc gia của người chơi
 * dựa trên navigator.languages, navigator.language và Intl TimeZone.
 */
export function detectBrowserLanguage(): {
  entry: LanguageEntry;
  rawLocale: string;
  timeZone: string;
} {
  let rawLocale = 'vi-VN';
  if (typeof navigator !== 'undefined') {
    rawLocale = navigator.languages?.[0] || navigator.language || 'vi-VN';
  }

  let timeZone = 'Asia/Ho_Chi_Minh';
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh';
  } catch {
    // Fallback timeZone mặc định nếu trình duyệt không hỗ trợ Intl
  }

  const normalizedLocale = rawLocale.replace('_', '-').trim().toLowerCase();

  // 1. Khớp chính xác hoàn toàn (Exact code match)
  let matched = GLOBAL_LANGUAGES.find(
    (item) => item.code.toLowerCase() === normalizedLocale
  );

  // 2. Nếu chưa khớp, thử khớp theo tiền tố ngôn ngữ và múi giờ
  if (!matched) {
    const langPrefix = normalizedLocale.split('-')[0];

    // Ưu tiên đặc biệt theo ngôn ngữ phổ biến
    if (langPrefix === 'vi') {
      matched = GLOBAL_LANGUAGES.find((item) => item.code === 'vi-VN');
    } else if (langPrefix === 'ja') {
      matched = GLOBAL_LANGUAGES.find((item) => item.code === 'ja-JP');
    } else if (langPrefix === 'ko') {
      matched = GLOBAL_LANGUAGES.find((item) => item.code === 'ko-KR');
    } else if (langPrefix === 'th') {
      matched = GLOBAL_LANGUAGES.find((item) => item.code === 'th-TH');
    } else if (langPrefix === 'id') {
      matched = GLOBAL_LANGUAGES.find((item) => item.code === 'id-ID');
    } else if (langPrefix === 'zh') {
      if (normalizedLocale.includes('tw') || normalizedLocale.includes('hant')) {
        matched = GLOBAL_LANGUAGES.find((item) => item.code === 'zh-TW');
      } else if (normalizedLocale.includes('hk')) {
        matched = GLOBAL_LANGUAGES.find((item) => item.code === 'zh-HK');
      } else if (normalizedLocale.includes('mo')) {
        matched = GLOBAL_LANGUAGES.find((item) => item.code === 'zh-MO');
      } else {
        matched = GLOBAL_LANGUAGES.find((item) => item.code === 'zh-CN');
      }
    } else if (langPrefix === 'fr') {
      if (timeZone.toLowerCase().includes('canada') || timeZone.toLowerCase().includes('montreal')) {
        matched = GLOBAL_LANGUAGES.find((item) => item.code === 'fr-CA');
      } else if (timeZone.toLowerCase().includes('brussels')) {
        matched = GLOBAL_LANGUAGES.find((item) => item.code === 'fr-BE');
      } else {
        matched = GLOBAL_LANGUAGES.find((item) => item.code === 'fr-FR');
      }
    } else if (langPrefix === 'de') {
      if (timeZone.toLowerCase().includes('zurich')) {
        matched = GLOBAL_LANGUAGES.find((item) => item.code === 'de-CH');
      } else if (timeZone.toLowerCase().includes('vienna')) {
        matched = GLOBAL_LANGUAGES.find((item) => item.code === 'de-AT');
      } else {
        matched = GLOBAL_LANGUAGES.find((item) => item.code === 'de-DE');
      }
    } else if (langPrefix === 'pt') {
      if (timeZone.toLowerCase().includes('sao_paulo') || timeZone.toLowerCase().includes('brazil')) {
        matched = GLOBAL_LANGUAGES.find((item) => item.code === 'pt-BR');
      } else {
        matched = GLOBAL_LANGUAGES.find((item) => item.code === 'pt-PT');
      }
    } else if (langPrefix === 'es') {
      if (timeZone.toLowerCase().includes('mexico')) {
        matched = GLOBAL_LANGUAGES.find((item) => item.code === 'es-MX');
      } else if (timeZone.toLowerCase().includes('buenos_aires')) {
        matched = GLOBAL_LANGUAGES.find((item) => item.code === 'es-AR');
      } else if (timeZone.toLowerCase().includes('bogota')) {
        matched = GLOBAL_LANGUAGES.find((item) => item.code === 'es-CO');
      } else if (timeZone.toLowerCase().includes('santiago')) {
        matched = GLOBAL_LANGUAGES.find((item) => item.code === 'es-CL');
      } else {
        matched = GLOBAL_LANGUAGES.find((item) => item.code === 'es-ES');
      }
    } else if (langPrefix === 'en') {
      // Phân bổ tiếng Anh theo TimeZone
      const tzLower = timeZone.toLowerCase();
      if (tzLower.includes('london')) {
        matched = GLOBAL_LANGUAGES.find((item) => item.code === 'en-GB');
      } else if (tzLower.includes('australia') || tzLower.includes('sydney') || tzLower.includes('melbourne')) {
        matched = GLOBAL_LANGUAGES.find((item) => item.code === 'en-AU');
      } else if (tzLower.includes('singapore')) {
        matched = GLOBAL_LANGUAGES.find((item) => item.code === 'en-SG');
      } else if (tzLower.includes('toronto') || tzLower.includes('vancouver')) {
        matched = GLOBAL_LANGUAGES.find((item) => item.code === 'en-CA');
      } else if (tzLower.includes('auckland')) {
        matched = GLOBAL_LANGUAGES.find((item) => item.code === 'en-NZ');
      } else if (tzLower.includes('kolkata') || tzLower.includes('calcutta')) {
        matched = GLOBAL_LANGUAGES.find((item) => item.code === 'en-IN');
      } else {
        matched = GLOBAL_LANGUAGES.find((item) => item.code === 'en-US');
      }
    } else {
      // Thử tìm bất kỳ entry nào có cùng mã ngôn ngữ tiền tố
      matched = GLOBAL_LANGUAGES.find((item) =>
        item.code.toLowerCase().startsWith(langPrefix + '-')
      );
    }
  }

  // 3. Nếu vẫn chưa khớp, thử suy luận từ TimeZone
  if (!matched) {
    const tzLower = timeZone.toLowerCase();
    if (tzLower.includes('ho_chi_minh') || tzLower.includes('saigon')) {
      matched = GLOBAL_LANGUAGES.find((item) => item.code === 'vi-VN');
    } else if (tzLower.includes('tokyo')) {
      matched = GLOBAL_LANGUAGES.find((item) => item.code === 'ja-JP');
    } else if (tzLower.includes('seoul')) {
      matched = GLOBAL_LANGUAGES.find((item) => item.code === 'ko-KR');
    } else if (tzLower.includes('bangkok')) {
      matched = GLOBAL_LANGUAGES.find((item) => item.code === 'th-TH');
    } else if (tzLower.includes('paris')) {
      matched = GLOBAL_LANGUAGES.find((item) => item.code === 'fr-FR');
    } else if (tzLower.includes('berlin')) {
      matched = GLOBAL_LANGUAGES.find((item) => item.code === 'de-DE');
    } else if (tzLower.includes('london')) {
      matched = GLOBAL_LANGUAGES.find((item) => item.code === 'en-GB');
    }
  }

  // Fallback an toàn: Tiếng Việt (Việt Nam)
  if (!matched) {
    matched = GLOBAL_LANGUAGES[0];
  }

  return {
    entry: matched,
    rawLocale,
    timeZone,
  };
}

/**
 * Lấy LanguageEntry hiện tại đang được lưu hoặc phát hiện
 */
export function getCurrentLanguageEntry(): LanguageEntry {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return GLOBAL_LANGUAGES[0];
  }

  const savedCode = localStorage.getItem('ma_soi_locale_code');
  if (savedCode) {
    const found = GLOBAL_LANGUAGES.find(
      (item) => item.code.toLowerCase() === savedCode.trim().toLowerCase()
    );
    if (found) {
      if (localStorage.getItem('ma_soi_lang') !== found.uiLang) {
        localStorage.setItem('ma_soi_lang', found.uiLang);
      }
      return found;
    }
  }

  // Kiểm tra lưu vết cũ ma_soi_lang ('vi' | 'en')
  const legacyLang = localStorage.getItem('ma_soi_lang');
  if (legacyLang === 'en') {
    const enEntry = GLOBAL_LANGUAGES.find((item) => item.code === 'en-US') || GLOBAL_LANGUAGES[0];
    localStorage.setItem('ma_soi_locale_code', enEntry.code);
    return enEntry;
  }
  if (legacyLang === 'vi') {
    const viEntry = GLOBAL_LANGUAGES[0];
    localStorage.setItem('ma_soi_locale_code', viEntry.code);
    return viEntry;
  }

  // Tự động phát hiện lần đầu
  const detected = detectBrowserLanguage();
  localStorage.setItem('ma_soi_locale_code', detected.entry.code);
  localStorage.setItem('ma_soi_lang', detected.entry.uiLang);
  return detected.entry;
}

/**
 * Thiết lập ngôn ngữ toàn cầu, lưu vào localStorage và phát sự kiện đồng bộ
 */
export function setGlobalLanguage(code: string, isManual = true): LanguageEntry {
  const norm = code.trim().toLowerCase();
  let entry = GLOBAL_LANGUAGES.find(
    (item) => item.code.toLowerCase() === norm
  );

  // Hỗ trợ alias ngắn gọn 'vi' -> 'vi-VN', 'en' -> 'en-US'
  if (!entry) {
    if (norm === 'vi') {
      entry = GLOBAL_LANGUAGES.find((item) => item.code === 'vi-VN');
    } else if (norm === 'en') {
      entry = GLOBAL_LANGUAGES.find((item) => item.code === 'en-US');
    }
  }

  if (!entry) {
    entry = GLOBAL_LANGUAGES[0];
  }

  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.setItem('ma_soi_locale_code', entry.code);
    localStorage.setItem('ma_soi_lang', entry.uiLang);
    if (isManual) {
      localStorage.setItem('ma_soi_lang_manual', '1');
    }

    // Phát sự kiện đồng bộ toàn ứng dụng
    window.dispatchEvent(
      new CustomEvent('ma-soi-lang-change', { detail: entry.uiLang })
    );
    window.dispatchEvent(
      new CustomEvent('ma-soi-locale-change', { detail: entry })
    );
  }

  return entry;
}

/**
 * Hàm tìm kiếm và lọc danh sách quốc gia tức thời theo từ khóa và vùng địa lý
 */
export function searchLanguages(
  query: string,
  region: RegionKey = 'ALL'
): LanguageEntry[] {
  const q = query.trim().toLowerCase();

  return GLOBAL_LANGUAGES.filter((item) => {
    // Lọc theo vùng
    if (region !== 'ALL' && item.region !== region) {
      return false;
    }

    // Nếu không có từ khóa tìm kiếm, nhận toàn bộ
    if (!q) {
      return true;
    }

    // Tìm kiếm đa trường không dấu / có dấu
    return (
      item.name.toLowerCase().includes(q) ||
      item.nativeName.toLowerCase().includes(q) ||
      item.country.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      item.greeting.toLowerCase().includes(q)
    );
  });
}

export interface StoreAppMetadata {
  locale: string;
  appName: string;
  subtitle: string;
  promoText: string;
  description: string;
  keywords: string[];
}

export const STORE_METADATA_MAP: Record<string, StoreAppMetadata> = {
  'vi-VN': {
    locale: 'vi-VN',
    appName: 'Ma Sói Online',
    subtitle: 'Khu Cắm Trại 3D • Voice Chat • Ma Sói Thời Gian Thực',
    promoText: 'Trải nghiệm Đêm Đồng Thời kịch tính, tự do dạo bước Khu Cắm Trại 3D và Voice Chat sống động cùng bạn bè khắp nơi!',
    description: 'Ma Sói Online mang trải nghiệm board game ma sói kinh điển lên một tầm cao mới với Đấu Trường Lửa Trại 3D thời gian thực. Tùy biến nhân vật Chibi 3D, khám phá cơ chế Đêm Đồng Thời loại bỏ thời gian chết, hỗ trợ Quản Trò Thông Minh, hệ thống Voice Chat WebRTC độ trễ siêu thấp và hỗ trợ 128+ quốc gia.',
    keywords: ['ma soi', 'ma soi online', 'werewolf 3d', 'board game', 'quan tro', 'ma soi tieng viet', 'voice chat', 'party game'],
  },
  'en-US': {
    locale: 'en-US',
    appName: 'Werewolf Online: 3D Campfire',
    subtitle: '3D Social Deduction • Simultaneous Night • Voice Chat',
    promoText: 'Experience the next-gen 3D Werewolf Campfire with simultaneous night phases, proximity voice chat, and real-time social deduction!',
    description: 'Werewolf Online brings the classic social deduction party game to life in an immersive 3D Campfire Arena. Customize your 3D avatar, roam freely around the bonfire, engage in simultaneous night actions with zero downtime, and communicate via crystal-clear real-time voice chat with players worldwide across 128+ countries.',
    keywords: ['werewolf online', 'mafia online', 'social deduction', '3d werewolf', 'voice chat', 'party game', 'board game', 'campfire 3d'],
  },
  'ja-JP': {
    locale: 'ja-JP',
    appName: '人狼オンライン: 3Dキャンプファイア',
    subtitle: '3Dリアルタイム人狼・ボイスチャット・心理戦',
    promoText: '3D焚き火エリアで繰り広げられる新世代リアルタイム人狼ゲーム！同時進行の夜フェーズとクリアなボイスチャット搭載。',
    description: '『人狼オンライン: 3Dキャンプファイア』は、世界中のプレイヤーと楽しめる次世代3D人狼ゲームです。可愛いちびキャラをカスタマイズし、焚き火の周りを自由に探索。待ち時間ゼロの「同時夜フェーズ」と超低遅延ボイスチャットで、緊迫した心理戦をお楽しみください。',
    keywords: ['人狼', '人狼ゲーム', '3D人狼', 'ボイスチャット', 'オンラインゲーム', '心理戦', '推理ゲーム', 'パーティーゲーム'],
  },
  'ko-KR': {
    locale: 'ko-KR',
    appName: '웨어울프 온라인: 3D 캠프파이어',
    subtitle: '3D 실시간 마피아・보이스 채팅・심리 추리 게임',
    promoText: '3D 모닥불 광장에서 펼쳐지는 실시간 마피아 게임! 대기 시간 없는 동시 밤 페이즈와 고음질 보이스 채팅 지원.',
    description: '웨어울프 온라인은 몰입感 넘치는 3D 캠프파이어 무대에서 펼쳐지는 차세대 소셜 디덕션 마피아 게임입니다. 개성 있는 3D 캐릭터 커스터마이징, 실시간 음성 대화, 혁신적인 동시 밤 액션으로 전 세계 플레이어들과 최고의 심리전을 경험해보세요.',
    keywords: ['마피아', '웨어울프', '3D 마피아', '보이스 채팅', '추리 게임', '파티 게임', '보드게임', '온라인 마피아'],
  },
  'zh-CN': {
    locale: 'zh-CN',
    appName: '狼人杀3D: 篝火营地',
    subtitle: '3D实时狼人杀・实时语音・沉浸式推理',
    promoText: '新一代3D篝火狼人杀！双阵营夜间同步行动，零等待时间，超低延迟实时语音畅聊。',
    description: '《狼人杀3D: 篝火营地》将经典社交推理桌游带入沉浸式3D篝火世界。自由装扮Q版3D角色，围绕篝火自由漫步。首创「全员夜间同步行动」彻底消除漫长等待，配合清晰流畅的高清语音聊天，与全球玩家展开智慧博弈！',
    keywords: ['狼人杀', '3D狼人杀', '语音桌游', '社交推理', '派对游戏', '桌游', '实时语音', '多人联机'],
  },
  'es-ES': {
    locale: 'es-ES',
    appName: 'Hombre Lobo 3D: Fogata Online',
    subtitle: 'Deducción Social 3D • Noche Simultánea • Chat de Voz',
    promoText: '¡Descubre la nueva generación de Hombre Lobo en un campamento 3D interactivo con chat de voz en tiempo real!',
    description: 'Hombre Lobo 3D: Fogata Online revoluciona el clásico juego de deducción social con escenarios 3D en tiempo real. Personaliza tu avatar Chibi, pasea por la fogata, ejecuta acciones nocturnas simultáneas sin aburridas esperas y debate con amigos usando chat de voz de baja latencia.',
    keywords: ['hombre lobo', 'juegos de mesa', 'deduccion social', 'chat de voz', 'juego de fiesta', 'hombre lobo online', 'mafia 3d'],
  },
  'fr-FR': {
    locale: 'fr-FR',
    appName: 'Loups-Garous 3D: Feu de Camp',
    subtitle: 'Déduction Sociale 3D • Nuit Simultanée • Chat Vocal',
    promoText: 'Plongez dans une arène 3D autour du feu de camp avec chat vocal en direct et phase de nuit simultanée sans temps mort !',
    description: 'Loups-Garous 3D: Feu de Camp réinvente le célèbre jeu d\'ambiance et de déduction dans un univers 3D interactif. Personnalisez votre avatar Chibi, explorez le campement et vivez des nuits simultanées sans attente grâce à notre système de chat vocal haute fidélité.',
    keywords: ['loup garou', 'loups garous', 'jeu de deduction', 'chat vocal', 'multijoueur', 'jeu de societe', 'loups garous 3d'],
  },
  'de-DE': {
    locale: 'de-DE',
    appName: 'Werwölfe 3D: Lagerfeuer Online',
    subtitle: '3D Social Deduction • Gleichzeitige Nacht • Sprach-Chat',
    promoText: 'Erlebe das ultimative 3D-Werwolf-Abenteuer am Lagerfeuer mit synchroner Nachtphase und kristallklarem Sprach-Chat!',
    description: 'Werwölfe 3D: Lagerfeuer Online bringt das klassische Gesellschaftsspiel in ein lebendiges 3D-Lagerfeuer-Erlebnis. Gestalte deinen Chibi-Charakter, bewege dich frei im Camp, spiele simultane Nachtaktionen ohne Wartezeit und diskutiere live per Sprach-Chat mit Spielern weltweit.',
    keywords: ['werwölfe', 'werwolf online', 'social deduction', 'party spiel', 'sprach chat', '3d werwolf', 'gesellschaftsspiel'],
  },
  'pt-BR': {
    locale: 'pt-BR',
    appName: 'Lobisomem 3D: Fogueira Online',
    subtitle: 'Dedução Social 3D • Noite Simultânea • Chat de Voz',
    promoText: 'Entre na fogueira 3D para partidas eletrizantes de Lobisomem com ações noturnas simultâneas e chat de voz em tempo real!',
    description: 'Lobisomem 3D: Fogueira Online transforma o jogo clássico de dedução social em uma experiência 3D imersiva. Personalize seu avatar Chibi, explore o acampamento, participe de noites simultâneas com zero tempo de espera e debata ao vivo pelo chat de voz WebRTC.',
    keywords: ['lobisomem', 'lobisomem online', 'jogo de deducao', 'chat de voz', 'festa 3d', 'jogo de tabuleiro'],
  },
  'th-TH': {
    locale: 'th-TH',
    appName: 'มนุษย์หมาป่า 3D: แคมป์ไฟออนไลน์',
    subtitle: 'เกมหมาป่า 3D • คืนพร้อมกัน • ระบบ Voice Chat',
    promoText: 'สัมผัสประสบการณ์เกมหมาป่ารอบกองไฟ 3D ล้ำสมัย เล่นแอ็กชันกลางคืนพร้อมกัน และพูดคุยผ่านเสียงสดแบบเรียลไทม์!',
    description: 'มนุษย์หมาป่า 3D: แคมป์ไฟออนไลน์ นำบอร์ดเกมสืบสวนยอดนิยมสู่สมรภูมิแคมป์ไฟ 3D ที่สมจริง ปรับแต่งตัวละคร Chibi สุดน่ารัก เดินสำรวจรอบกองไฟ ดำเนินการกลางคืนพร้อมกันโดยไม่ต้องรอนาน และสื่อสารผ่านระบบ Voice Chat แบบเรียลไทม์กับผู้เล่นทั่วโลก',
    keywords: ['เกมหมาป่า', 'มนุษย์หมาป่า', 'werewolf 3d', 'บอร์ดเกม', 'voice chat', 'เกมปาร์ตี้', 'หมาป่าออนไลน์'],
  },
  'id-ID': {
    locale: 'id-ID',
    appName: 'Werewolf 3D: Api Unggun Online',
    subtitle: 'Deduksi Sosial 3D • Malam Simultan • Voice Chat',
    promoText: 'Rasakan keseruan Werewolf 3D di area api unggun interaktif dengan aksi malam simultan dan voice chat langsung!',
    description: 'Werewolf 3D: Api Unggun Online menghadirkan permainan deduksi sosial klasik ke dalam arena 3D yang hidup. Kustomisasi avatar Chibi 3D Anda, jelajahi area kemah, jalankan aksi malam simultan tanpa jeda membosankan, và berdiskusi seru lewat voice chat berkualitas tinggi bersama teman.',
    keywords: ['werewolf indonesia', 'game werewolf', 'deduksi sosial', 'voice chat', 'game pesta', 'board game 3d'],
  },
};

/**
 * Trả về metadata cho Apple App Store Connect & Google Play Console theo mã quốc gia/ngôn ngữ
 */
export function getStoreAppMetadata(localeCode?: string): StoreAppMetadata {
  let targetCode = localeCode?.trim();

  if (!targetCode && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    targetCode = localStorage.getItem('ma_soi_locale_code') || 'vi-VN';
  }

  if (!targetCode) {
    targetCode = 'vi-VN';
  }

  const exact = STORE_METADATA_MAP[targetCode];
  if (exact) {
    return exact;
  }

  const lower = targetCode.toLowerCase();
  for (const [key, value] of Object.entries(STORE_METADATA_MAP)) {
    if (key.toLowerCase() === lower) {
      return value;
    }
  }

  const prefix = lower.split(/[-_]/)[0];
  for (const [key, value] of Object.entries(STORE_METADATA_MAP)) {
    if (key.toLowerCase().startsWith(prefix)) {
      return value;
    }
  }

  return targetCode.toLowerCase().startsWith('vi')
    ? STORE_METADATA_MAP['vi-VN']
    : STORE_METADATA_MAP['en-US'];
}
