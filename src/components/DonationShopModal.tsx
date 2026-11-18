import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Heart,
  QrCode,
  Tv,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  Settings,
  Sparkles,
  Play,
  CheckCircle2,
  Coins,
  Globe,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  DONATION_PACKAGES,
  DonationPackage,
  getBankConfig,
  saveBankConfig,
  generateVietQrUrl,
  BankConfig,
  SUPPORTED_BANKS,
  REWARDED_AD_CONFIG,
  LEGAL_DISCLAIMER_VI,
  LEGAL_DISCLAIMER_EN,
  PLAYER_COINS_KEY,
  PLAYER_TITLE_KEY,
  PLAYER_BADGE_KEY,
  DONATION_HISTORY_KEY,
  DonationHistoryItem,
  GlobalPaymentConfig,
  getGlobalPaymentConfig,
  saveGlobalPaymentConfig,
} from '../constants/donationConfig';
import { soundEffects } from '../utils/soundEffects';

export interface DonationShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'DONATE' | 'ADS' | 'LEGAL';
}

export const DonationShopModal: React.FC<DonationShopModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'DONATE',
}) => {
  const [activeTab, setActiveTab] = useState<'DONATE' | 'ADS' | 'LEGAL'>(initialTab);

  // Ngôn ngữ VI / EN
  const [lang, setLang] = useState<'vi' | 'en'>(() => {
    try {
      const saved = localStorage.getItem('ma_soi_lang');
      return saved === 'en' ? 'en' : 'vi';
    } catch {
      return 'vi';
    }
  });

  // Thông tin người chơi
  const [playerCoins, setPlayerCoins] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(PLAYER_COINS_KEY);
      return saved ? Number(saved) : 1500;
    } catch {
      return 1500;
    }
  });

  const [_playerTitle, setPlayerTitle] = useState<string>(() => {
    try {
      return localStorage.getItem(PLAYER_TITLE_KEY) || (lang === 'en' ? 'Night Hunter' : 'Thợ Săn Đêm');
    } catch {
      return lang === 'en' ? 'Night Hunter' : 'Thợ Săn Đêm';
    }
  });

  const [_playerBadge, setPlayerBadge] = useState<string>(() => {
    try {
      return localStorage.getItem(PLAYER_BADGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const [playerName, setPlayerName] = useState<string>(() => {
    try {
      return localStorage.getItem('ma_soi_player_name') || (lang === 'en' ? 'Night Hunter' : 'Thợ Săn Đêm');
    } catch {
      return 'Thợ Săn Đêm';
    }
  });

  // Ngân hàng nhận tiền
  const [bankConfig, setBankConfig] = useState<BankConfig>(() => getBankConfig());
  const [showAdminSettings, setShowAdminSettings] = useState<boolean>(false);
  const [editBankId, setEditBankId] = useState<string>(bankConfig.bankId);
  const [editAccountNo, setEditAccountNo] = useState<string>(bankConfig.accountNo);
  const [editAccountName, setEditAccountName] = useState<string>(bankConfig.accountName);

  // Kênh thanh toán: VIETQR hoặc GLOBAL
  const [paymentMethod, setPaymentMethod] = useState<'VIETQR' | 'GLOBAL'>(() => {
    try {
      const saved = localStorage.getItem('ma_soi_lang');
      return saved === 'en' ? 'GLOBAL' : 'VIETQR';
    } catch {
      return 'VIETQR';
    }
  });

  // Cổng thanh toán quốc tế (BuyMeACoffee, PayPal.Me, Ko-fi)
  const [globalPaymentConfig, setGlobalPaymentConfig] = useState<GlobalPaymentConfig>(() => getGlobalPaymentConfig());
  const [editBuyMeACoffee, setEditBuyMeACoffee] = useState<string>(globalPaymentConfig.buyMeACoffeeUrl);
  const [editPaypalMe, setEditPaypalMe] = useState<string>(globalPaymentConfig.paypalMeUrl);
  const [editKofi, setEditKofi] = useState<string>(globalPaymentConfig.kofiUrl);

  // Gói tài trợ đang chọn
  const [selectedPackage, setSelectedPackage] = useState<DonationPackage>(
    DONATION_PACKAGES.find((p) => p.popular) || DONATION_PACKAGES[0]
  );
  const [isCustomAmount, setIsCustomAmount] = useState<boolean>(false);
  const [customVND, setCustomVND] = useState<number>(30000);
  const [customUSD, setCustomUSD] = useState<number>(5);

  // Trạng thái copy thông tin
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Trạng thái thông báo thành công
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Trạng thái xem quảng cáo nhận thưởng (Rewarded Ads)
  const [adState, setAdState] = useState<'IDLE' | 'WATCHING' | 'REWARD_READY' | 'CLAIMED'>('IDLE');
  const [adTimeLeft, setAdTimeLeft] = useState<number>(REWARDED_AD_CONFIG.durationSeconds);
  const adTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync thông tin player & language
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const c = localStorage.getItem(PLAYER_COINS_KEY);
        if (c) setPlayerCoins(Number(c));
        const t = localStorage.getItem(PLAYER_TITLE_KEY);
        if (t) setPlayerTitle(t);
        const b = localStorage.getItem(PLAYER_BADGE_KEY);
        if (b) setPlayerBadge(b);
        const n = localStorage.getItem('ma_soi_player_name');
        if (n) setPlayerName(n);
        const l = localStorage.getItem('ma_soi_lang');
        if (l === 'en' || l === 'vi') setLang(l);
      } catch {
        // ignore
      }
    };

    window.addEventListener('ma-soi-profile-update', handleUpdate);
    window.addEventListener('ma-soi-lang-change', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('ma-soi-profile-update', handleUpdate);
      window.removeEventListener('ma-soi-lang-change', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Cleanup ad timer on unmount
  useEffect(() => {
    return () => {
      if (adTimerRef.current) {
        clearInterval(adTimerRef.current);
      }
    };
  }, []);

  // ESC để đóng modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Tính số tiền và coin thực tế theo lựa chọn
  const currentAmountVND = isCustomAmount ? customVND : selectedPackage.priceVND;
  const currentAmountUSD = isCustomAmount ? customUSD : selectedPackage.priceUSD;
  const currentCoinsGain = isCustomAmount
    ? (paymentMethod === 'GLOBAL' ? Math.max(1000, customUSD * 1500) : Math.max(100, Math.floor(customVND / 10)))
    : selectedPackage.coins;

  // Memo nội dung chuyển khoản độc nhất
  const currentMemo = useMemo(() => {
    const cleanPrefix = bankConfig.defaultMemoPrefix || 'MASOI';
    const cleanPkgId = isCustomAmount ? 'DONATE' : selectedPackage.id;
    // Lấy ký tự ASCII an toàn từ tên người chơi
    const asciiName = playerName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 8);
    return `${cleanPrefix} ${cleanPkgId} ${asciiName || 'VIP'}`.trim();
  }, [bankConfig.defaultMemoPrefix, isCustomAmount, selectedPackage.id, playerName]);

  // URL VietQR tạo động
  const vietQrUrl = useMemo(() => {
    return generateVietQrUrl(
      bankConfig.bankId,
      bankConfig.accountNo,
      currentAmountVND,
      currentMemo,
      'compact2'
    );
  }, [bankConfig.bankId, bankConfig.accountNo, currentAmountVND, currentMemo]);

  // Copy text vào clipboard kèm feedback
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    soundEffects.triggerHaptic('light');
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // Lưu cấu hình ngân hàng admin
  const handleSaveBankAdmin = () => {
    const updated = saveBankConfig({
      bankId: editBankId,
      accountNo: editAccountNo,
      accountName: editAccountName,
    });
    setBankConfig(updated);
    setShowAdminSettings(false);
    soundEffects.triggerHaptic('medium');
    setSuccessNotice(
      lang === 'en'
        ? '✅ Receiving bank account updated successfully!'
        : '✅ Đã lưu cấu hình tài khoản nhận tiền mới!'
    );
    setTimeout(() => setSuccessNotice(null), 3500);
  };

  // Lưu cấu hình thanh toán quốc tế admin
  const handleSaveGlobalAdmin = () => {
    const updated = saveGlobalPaymentConfig({
      buyMeACoffeeUrl: editBuyMeACoffee,
      paypalMeUrl: editPaypalMe,
      kofiUrl: editKofi,
    });
    setGlobalPaymentConfig(updated);
    setShowAdminSettings(false);
    soundEffects.triggerHaptic('medium');
    setSuccessNotice(
      lang === 'en'
        ? '✅ Global sponsor URLs updated successfully!'
        : '✅ Đã lưu cấu hình cổng thanh toán quốc tế!'
    );
    setTimeout(() => setSuccessNotice(null), 3500);
  };

  // Xác nhận chuyển khoản VietQR thành công
  const handleConfirmTransfer = () => {
    const newCoins = playerCoins + currentCoinsGain;
    const newTitle = isCustomAmount ? 'Nhà Hảo Tâm Làng Sói' : selectedPackage.bonusTitle;
    const newBadge = isCustomAmount ? '💖 Sponsor Tùy Tâm' : selectedPackage.bonusBadge;

    try {
      localStorage.setItem(PLAYER_COINS_KEY, String(newCoins));
      localStorage.setItem(PLAYER_TITLE_KEY, newTitle);
      localStorage.setItem(PLAYER_BADGE_KEY, newBadge);

      // Lưu lịch sử giao dịch
      const rawHistory = localStorage.getItem(DONATION_HISTORY_KEY);
      const historyList: DonationHistoryItem[] = rawHistory ? JSON.parse(rawHistory) : [];
      const newHistoryItem: DonationHistoryItem = {
        id: 'DONATE_' + Date.now(),
        packageId: isCustomAmount ? undefined : selectedPackage.id,
        packageName: isCustomAmount ? 'Ủng Hộ Tùy Tâm' : selectedPackage.name,
        amountVND: currentAmountVND,
        coinsReceived: currentCoinsGain,
        bonusTitle: newTitle,
        bonusBadge: newBadge,
        timestamp: Date.now(),
        method: isCustomAmount ? 'CUSTOM_DONATION' : 'VIETQR',
      };
      historyList.unshift(newHistoryItem);
      localStorage.setItem(DONATION_HISTORY_KEY, JSON.stringify(historyList.slice(0, 50)));

      // Dispatch event cho toàn bộ app
      window.dispatchEvent(new CustomEvent('ma-soi-profile-update'));
    } catch {
      // ignore
    }

    setPlayerCoins(newCoins);
    setPlayerTitle(newTitle);
    setPlayerBadge(newBadge);

    // Kích hoạt âm thanh & Confetti
    soundEffects.triggerHaptic('heavy');
    soundEffects.playBell();
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#facc15', '#f43f5e', '#38bdf8', '#a855f7'],
      });
    } catch {
      // fallback
    }

    setSuccessNotice(
      lang === 'en'
        ? `🎉 Thank you! +${currentCoinsGain.toLocaleString()} Coins added. Title "${newTitle}" unlocked!`
        : `🎉 Cảm ơn bạn đã tài trợ! Nhận ngay +${currentCoinsGain.toLocaleString()} Coin và danh hiệu "${newTitle}"!`
    );
  };

  // Xác nhận tài trợ quốc tế thành công & Nhận quà (Claim Perks)
  const handleConfirmGlobalTransfer = () => {
    const newCoins = playerCoins + currentCoinsGain;
    const newTitle = isCustomAmount
      ? (lang === 'en' ? 'Global Patron' : 'Nhà Hảo Tâm Quốc Tế')
      : (lang === 'en' ? selectedPackage.bonusTitleEn : selectedPackage.bonusTitle);
    const newBadge = isCustomAmount
      ? (lang === 'en' ? '💖 Global Supporter' : '💖 Sponsor Quốc Tế')
      : (lang === 'en' ? selectedPackage.bonusBadgeEn : selectedPackage.bonusBadge);

    try {
      localStorage.setItem(PLAYER_COINS_KEY, String(newCoins));
      localStorage.setItem(PLAYER_TITLE_KEY, newTitle);
      localStorage.setItem(PLAYER_BADGE_KEY, newBadge);

      // Lưu lịch sử giao dịch
      const rawHistory = localStorage.getItem(DONATION_HISTORY_KEY);
      const historyList: DonationHistoryItem[] = rawHistory ? JSON.parse(rawHistory) : [];
      const newHistoryItem: DonationHistoryItem = {
        id: 'GLOBAL_' + Date.now(),
        packageId: isCustomAmount ? undefined : selectedPackage.id,
        packageName: isCustomAmount
          ? (lang === 'en' ? 'Custom Global Sponsor' : 'Ủng Hộ Quốc Tế Tùy Chọn')
          : (lang === 'en' ? selectedPackage.nameEn : selectedPackage.name),
        amountVND: currentAmountVND,
        amountUSD: currentAmountUSD,
        coinsReceived: currentCoinsGain,
        bonusTitle: newTitle,
        bonusBadge: newBadge,
        timestamp: Date.now(),
        method: 'GLOBAL_SPONSOR',
      };
      historyList.unshift(newHistoryItem);
      localStorage.setItem(DONATION_HISTORY_KEY, JSON.stringify(historyList.slice(0, 50)));

      window.dispatchEvent(new CustomEvent('ma-soi-profile-update'));
    } catch {
      // ignore
    }

    setPlayerCoins(newCoins);
    setPlayerTitle(newTitle);
    setPlayerBadge(newBadge);

    soundEffects.triggerHaptic('heavy');
    soundEffects.playBell();
    try {
      confetti({
        particleCount: 100,
        spread: 85,
        origin: { y: 0.55 },
        colors: ['#38bdf8', '#facc15', '#f43f5e', '#a855f7'],
      });
    } catch {
      // fallback
    }

    setSuccessNotice(
      lang === 'en'
        ? `🎉 Thank you for your global sponsorship! +${currentCoinsGain.toLocaleString()} Coins added. Title "${newTitle}" unlocked!`
        : `🎉 Cảm ơn bạn đã tài trợ quốc tế! Nhận ngay +${currentCoinsGain.toLocaleString()} Coin và danh hiệu "${newTitle}"!`
    );
  };

  // Bắt đầu xem quảng cáo 15s
  const handleStartWatchingAd = () => {
    setAdState('WATCHING');
    setAdTimeLeft(REWARDED_AD_CONFIG.durationSeconds);
    soundEffects.triggerHaptic('medium');

    if (adTimerRef.current) clearInterval(adTimerRef.current);

    adTimerRef.current = setInterval(() => {
      setAdTimeLeft((prev) => {
        if (prev <= 1) {
          if (adTimerRef.current) clearInterval(adTimerRef.current);
          setAdState('REWARD_READY');
          soundEffects.triggerHaptic('heavy');
          soundEffects.playBell();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Nhận thưởng sau khi xem xong quảng cáo
  const handleClaimAdReward = () => {
    const reward = REWARDED_AD_CONFIG.coinReward;
    const newCoins = playerCoins + reward;

    try {
      localStorage.setItem(PLAYER_COINS_KEY, String(newCoins));

      const rawHistory = localStorage.getItem(DONATION_HISTORY_KEY);
      const historyList: DonationHistoryItem[] = rawHistory ? JSON.parse(rawHistory) : [];
      const newHistoryItem: DonationHistoryItem = {
        id: 'AD_' + Date.now(),
        packageName: 'Xem Quảng Cáo Tài Trợ (15s)',
        amountVND: 0,
        coinsReceived: reward,
        timestamp: Date.now(),
        method: 'REWARDED_AD',
      };
      historyList.unshift(newHistoryItem);
      localStorage.setItem(DONATION_HISTORY_KEY, JSON.stringify(historyList.slice(0, 50)));

      window.dispatchEvent(new CustomEvent('ma-soi-profile-update'));
    } catch {
      // ignore
    }

    setPlayerCoins(newCoins);
    setAdState('CLAIMED');
    soundEffects.triggerHaptic('heavy');

    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#facc15', '#eab308', '#ca8a04'],
      });
    } catch {
      // fallback
    }

    setSuccessNotice(
      lang === 'en'
        ? `🎁 Received +${reward} Coins from watching sponsor ad!`
        : `🎁 Đã nhận +${reward} Coin từ việc xem quảng cáo tài trợ!`
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 5, 12, 0.88)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-container card-glass"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          background: 'linear-gradient(175deg, rgba(20, 18, 36, 0.98) 0%, rgba(10, 10, 20, 0.99) 100%)',
          border: '1.5px solid rgba(250, 204, 21, 0.45)',
          borderRadius: '24px',
          boxShadow: '0 0 35px rgba(250, 204, 21, 0.25), 0 20px 40px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#f8fafc',
        }}
      >
        {/* ========================================== */}
        {/* HEADER MODAL                               */}
        {/* ========================================== */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(250, 204, 21, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 14px rgba(245, 158, 11, 0.45)',
                fontSize: '1.3rem',
              }}
            >
              💖
            </div>
            <div>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: '1.1rem',
                  letterSpacing: '0.04em',
                  color: '#fef08a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>{lang === 'en' ? 'SERVER SPONSOR & COIN SHOP' : 'TIỆM TÀI TRỢ & NẠP COIN'}</span>
                <span
                  style={{
                    fontSize: '0.66rem',
                    background: 'rgba(34, 197, 94, 0.2)',
                    color: '#4ade80',
                    border: '1px solid #22c55e',
                    padding: '2px 6px',
                    borderRadius: '8px',
                    fontWeight: 700,
                  }}
                >
                  {lang === 'en' ? 'ZERO GAMBLING' : '100% PHÁP LÝ'}
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                {lang === 'en'
                  ? 'Voluntary server maintenance • Safe VietQR Napas 24/7'
                  : 'Ủng hộ duy trì máy chủ WebRTC & Hosting • VietQR Napas 24/7'}
              </div>
            </div>
          </div>

          {/* User profile balance pill & Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                background: 'rgba(250, 204, 21, 0.15)',
                border: '1px solid rgba(250, 204, 21, 0.4)',
                borderRadius: '16px',
                padding: '4px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 800,
                color: '#fef08a',
                fontSize: '0.85rem',
              }}
            >
              <Coins size={14} color="#facc15" />
              <span>{playerCoins.toLocaleString()}</span>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#cbd5e1',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ========================================== */}
        {/* TAB NAVIGATION (3 TABS)                    */}
        {/* ========================================== */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.35)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '4px 12px 0 12px',
            gap: '8px',
          }}
        >
          <button
            onClick={() => setActiveTab('DONATE')}
            style={{
              flex: 1,
              padding: '10px 12px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'DONATE' ? '#facc15' : '#94a3b8',
              fontWeight: activeTab === 'DONATE' ? 800 : 600,
              fontSize: '0.82rem',
              borderBottom: activeTab === 'DONATE' ? '2.5px solid #facc15' : '2.5px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <Heart size={15} color={activeTab === 'DONATE' ? '#f43f5e' : '#94a3b8'} />
            <span>{lang === 'en' ? '💖 Donate & Coins (VietQR)' : '💖 Ủng Hộ & Nạp Coin'}</span>
          </button>

          <button
            onClick={() => setActiveTab('ADS')}
            style={{
              flex: 1,
              padding: '10px 12px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'ADS' ? '#38bdf8' : '#94a3b8',
              fontWeight: activeTab === 'ADS' ? 800 : 600,
              fontSize: '0.82rem',
              borderBottom: activeTab === 'ADS' ? '2.5px solid #38bdf8' : '2.5px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <Tv size={15} color={activeTab === 'ADS' ? '#38bdf8' : '#94a3b8'} />
            <span>{lang === 'en' ? '📺 Watch Ad (+300 🪙)' : '📺 Xem Quảng Cáo (+300 🪙)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('LEGAL')}
            style={{
              flex: 1,
              padding: '10px 12px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'LEGAL' ? '#4ade80' : '#94a3b8',
              fontWeight: activeTab === 'LEGAL' ? 800 : 600,
              fontSize: '0.82rem',
              borderBottom: activeTab === 'LEGAL' ? '2.5px solid #4ade80' : '2.5px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <ShieldCheck size={15} color={activeTab === 'LEGAL' ? '#4ade80' : '#94a3b8'} />
            <span>{lang === 'en' ? '📜 Legal Terms' : '📜 Điều Khoản Pháp Lý'}</span>
          </button>
        </div>

        {/* ========================================== */}
        {/* SUCCESS NOTIFICATION TOAST                 */}
        {/* ========================================== */}
        {successNotice && (
          <div
            style={{
              margin: '10px 16px 0 16px',
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'linear-gradient(90deg, rgba(34, 197, 94, 0.25) 0%, rgba(20, 184, 166, 0.2) 100%)',
              border: '1px solid #22c55e',
              color: '#f0fdf4',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 0 15px rgba(34, 197, 94, 0.3)',
              animation: 'fadeIn 0.25s ease-out',
            }}
          >
            <CheckCircle2 size={18} color="#4ade80" />
            <div style={{ flex: 1 }}>{successNotice}</div>
            <button
              onClick={() => setSuccessNotice(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 1: DONATION & COIN RECHARGE (VIETQR / GLOBAL) */}
        {/* ========================================== */}
        {activeTab === 'DONATE' && (
          <div
            style={{
              padding: '16px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {/* Bộ chuyển đổi kênh thanh toán: VietQR vs Toàn Cầu (Global) */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                background: 'rgba(0, 0, 0, 0.45)',
                padding: '4px',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('VIETQR');
                  soundEffects.triggerHaptic('light');
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: paymentMethod === 'VIETQR' ? 'rgba(250, 204, 21, 0.22)' : 'transparent',
                  color: paymentMethod === 'VIETQR' ? '#fef08a' : '#94a3b8',
                  fontWeight: paymentMethod === 'VIETQR' ? 800 : 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  borderBottom: paymentMethod === 'VIETQR' ? '2.5px solid #facc15' : '2.5px solid transparent',
                  boxShadow: paymentMethod === 'VIETQR' ? '0 0 12px rgba(250, 204, 21, 0.25)' : 'none',
                  transition: 'all 0.18s ease',
                }}
              >
                <QrCode size={15} color={paymentMethod === 'VIETQR' ? '#facc15' : '#94a3b8'} />
                <span>{lang === 'en' ? '⚡ VietQR Napas (VNĐ)' : '⚡ VietQR Napas 24/7 (VNĐ)'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('GLOBAL');
                  soundEffects.triggerHaptic('light');
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: paymentMethod === 'GLOBAL' ? 'rgba(56, 189, 248, 0.22)' : 'transparent',
                  color: paymentMethod === 'GLOBAL' ? '#38bdf8' : '#94a3b8',
                  fontWeight: paymentMethod === 'GLOBAL' ? 800 : 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  borderBottom: paymentMethod === 'GLOBAL' ? '2.5px solid #38bdf8' : '2.5px solid transparent',
                  boxShadow: paymentMethod === 'GLOBAL' ? '0 0 12px rgba(56, 189, 248, 0.25)' : 'none',
                  transition: 'all 0.18s ease',
                }}
              >
                <Globe size={15} color={paymentMethod === 'GLOBAL' ? '#38bdf8' : '#94a3b8'} />
                <span>{lang === 'en' ? '🌍 Global (PayPal / Coffee / Ko-fi)' : '🌍 Quốc Tế (USD • PayPal / Coffee)'}</span>
              </button>
            </div>

            {/* Lựa chọn gói tài trợ 4 mức */}
            <div>
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: '#cbd5e1',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{lang === 'en' ? '1. SELECT SPONSOR TIER:' : '1. CHỌN GÓI TÀI TRỢ YÊU THÍCH:'}</span>
                <span style={{ fontSize: '0.72rem', color: '#facc15' }}>
                  {lang === 'en' ? 'Bonus Titles & Badges included 🎁' : 'Tặng kèm Danh hiệu & Huy hiệu 🎁'}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
                  gap: '8px',
                }}
              >
                {DONATION_PACKAGES.map((pkg) => {
                  const isSelected = !isCustomAmount && selectedPackage.id === pkg.id;
                  const displayName = lang === 'en' || paymentMethod === 'GLOBAL' ? pkg.nameEn : pkg.name;
                  const displayBonusTitle = lang === 'en' || paymentMethod === 'GLOBAL' ? pkg.bonusTitleEn : pkg.bonusTitle;
                  const displayPrice = paymentMethod === 'GLOBAL'
                    ? `$${pkg.priceUSD} USD`
                    : `${pkg.priceVND.toLocaleString()} đ`;

                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => {
                        setSelectedPackage(pkg);
                        setIsCustomAmount(false);
                        soundEffects.triggerHaptic('light');
                      }}
                      style={{
                        position: 'relative',
                        padding: '10px 8px',
                        borderRadius: '14px',
                        border: isSelected
                          ? (paymentMethod === 'GLOBAL' ? '1.8px solid #38bdf8' : '1.8px solid #facc15')
                          : '1px solid rgba(255, 255, 255, 0.12)',
                        background: isSelected
                          ? (paymentMethod === 'GLOBAL'
                              ? 'linear-gradient(145deg, rgba(56, 189, 248, 0.2) 0%, rgba(3, 105, 161, 0.15) 100%)'
                              : 'linear-gradient(145deg, rgba(250, 204, 21, 0.18) 0%, rgba(202, 138, 4, 0.1) 100%)')
                          : 'rgba(255, 255, 255, 0.04)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        color: '#f8fafc',
                        transition: 'all 0.18s ease',
                        boxShadow: isSelected
                          ? (paymentMethod === 'GLOBAL' ? '0 0 15px rgba(56, 189, 248, 0.3)' : '0 0 15px rgba(250, 204, 21, 0.25)')
                          : 'none',
                      }}
                    >
                      {pkg.popular && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '6px',
                            background: '#e11d48',
                            color: '#fff',
                            fontSize: '0.58rem',
                            fontWeight: 900,
                            padding: '1px 5px',
                            borderRadius: '6px',
                            letterSpacing: '0.02em',
                          }}
                        >
                          HOT 🔥
                        </div>
                      )}
                      <div style={{ fontSize: '1.4rem', marginBottom: '2px' }}>{pkg.icon}</div>
                      <div style={{ fontWeight: 800, fontSize: '0.78rem', color: '#fef08a' }}>
                        {displayName}
                      </div>
                      <div style={{ fontWeight: 900, fontSize: '0.88rem', color: '#38bdf8', marginTop: '2px' }}>
                        {displayPrice}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#facc15', fontWeight: 700, marginTop: '2px' }}>
                        +{pkg.coins.toLocaleString()} 🪙
                      </div>
                      <div
                        style={{
                          fontSize: '0.62rem',
                          color: '#94a3b8',
                          marginTop: '4px',
                          borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
                          paddingTop: '3px',
                        }}
                      >
                        {displayBonusTitle}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Nút nhập số tiền tùy tâm */}
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomAmount(!isCustomAmount);
                    soundEffects.triggerHaptic('light');
                  }}
                  style={{
                    background: isCustomAmount
                      ? (paymentMethod === 'GLOBAL' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(250, 204, 21, 0.2)')
                      : 'rgba(255, 255, 255, 0.06)',
                    border: isCustomAmount
                      ? (paymentMethod === 'GLOBAL' ? '1px solid #38bdf8' : '1px solid #facc15')
                      : '1px solid rgba(255, 255, 255, 0.15)',
                    color: isCustomAmount
                      ? (paymentMethod === 'GLOBAL' ? '#38bdf8' : '#fef08a')
                      : '#cbd5e1',
                    borderRadius: '10px',
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {lang === 'en' ? '✏️ Custom Amount' : '✏️ Nhập Số Tiền Tùy Tâm'}
                </button>

                {isCustomAmount && paymentMethod === 'GLOBAL' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                    <span style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 800 }}>$</span>
                    <input
                      type="number"
                      step={1}
                      min={1}
                      max={500}
                      value={customUSD}
                      onChange={(e) => setCustomUSD(Math.max(1, Number(e.target.value)))}
                      style={{
                        flex: 1,
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(56, 189, 248, 0.5)',
                        borderRadius: '8px',
                        padding: '5px 10px',
                        color: '#38bdf8',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>USD</span>
                  </div>
                )}

                {isCustomAmount && paymentMethod === 'VIETQR' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                    <input
                      type="number"
                      step={5000}
                      min={10000}
                      max={10000000}
                      value={customVND}
                      onChange={(e) => setCustomVND(Math.max(1000, Number(e.target.value)))}
                      style={{
                        flex: 1,
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(250, 204, 21, 0.5)',
                        borderRadius: '8px',
                        padding: '5px 10px',
                        color: '#fef08a',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>VNĐ</span>
                  </div>
                )}
              </div>
            </div>

            {/* ======================================================= */}
            {/* KÊNH 1: GLOBAL PAYMENT (BUYMEACOFFEE, PAYPAL, KO-FI)     */}
            {/* ======================================================= */}
            {paymentMethod === 'GLOBAL' && (
              <div
                style={{
                  background: 'linear-gradient(160deg, rgba(14, 165, 233, 0.12) 0%, rgba(15, 23, 42, 0.7) 100%)',
                  border: '1.2px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '16px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe size={18} color="#38bdf8" />
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#e0f2fe' }}>
                      {lang === 'en' ? 'Instant Global Sponsor Gateways:' : 'Cổng Tài Trợ Quốc Tế 1-Chạm:'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#38bdf8' }}>
                    ${currentAmountUSD} USD
                  </span>
                </div>

                {/* 3 Cổng thanh toán quốc tế: BuyMeACoffee, PayPal.Me, Ko-fi */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '10px',
                  }}
                >
                  {/* 1. Buy Me a Coffee */}
                  <a
                    href={globalPaymentConfig.buyMeACoffeeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => soundEffects.triggerHaptic('medium')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: '#0f172a',
                      textDecoration: 'none',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      boxShadow: '0 0 14px rgba(245, 158, 11, 0.35)',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                    }}
                  >
                    <span style={{ fontSize: '1.4rem' }}>☕</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 900, color: '#ffffff' }}>Buy Me a Coffee</div>
                      <div style={{ fontSize: '0.65rem', color: '#fef3c7' }}>Cards, Apple & Google Pay</div>
                    </div>
                    <ExternalLink size={14} color="#ffffff" />
                  </a>

                  {/* 2. PayPal.Me */}
                  <a
                    href={`${globalPaymentConfig.paypalMeUrl}/${currentAmountUSD}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => soundEffects.triggerHaptic('medium')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      color: '#ffffff',
                      textDecoration: 'none',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      boxShadow: '0 0 14px rgba(2, 132, 199, 0.35)',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                    }}
                  >
                    <span style={{ fontSize: '1.4rem' }}>🅿️</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 900, color: '#ffffff' }}>PayPal.Me (${currentAmountUSD})</div>
                      <div style={{ fontSize: '0.65rem', color: '#e0f2fe' }}>1-Click Balance or Card</div>
                    </div>
                    <ExternalLink size={14} color="#ffffff" />
                  </a>

                  {/* 3. Ko-fi */}
                  <a
                    href={globalPaymentConfig.kofiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => soundEffects.triggerHaptic('medium')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                      color: '#ffffff',
                      textDecoration: 'none',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      boxShadow: '0 0 14px rgba(225, 29, 72, 0.35)',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                    }}
                  >
                    <span style={{ fontSize: '1.4rem' }}>❤️</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 900, color: '#ffffff' }}>Ko-fi Supporter</div>
                      <div style={{ fontSize: '0.65rem', color: '#ffe4e6' }}>0% Platform Fee Support</div>
                    </div>
                    <ExternalLink size={14} color="#ffffff" />
                  </a>
                </div>

                {/* Hướng dẫn ghi chú tên nhân vật để quản trò trao đặc quyền */}
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px dashed rgba(56, 189, 248, 0.35)',
                    fontSize: '0.74rem',
                    color: '#cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <div>
                    💡 {lang === 'en'
                      ? 'Tip: Please enter your in-game name in the payment note:'
                      : 'Mẹo: Vui lòng ghi tên nhân vật vào lời nhắn khi thanh toán:'}{' '}
                    <span style={{ fontWeight: 900, color: '#facc15' }}>{playerName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(playerName, 'playerName')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      color: copiedKey === 'playerName' ? '#4ade80' : '#cbd5e1',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.7rem',
                    }}
                  >
                    {copiedKey === 'playerName' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedKey === 'playerName' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Nút xác nhận sau khi donate trên web quốc tế */}
                <button
                  type="button"
                  onClick={handleConfirmGlobalTransfer}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 0 16px rgba(16, 185, 129, 0.45)',
                    transition: 'transform 0.1s',
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                  onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <Sparkles size={18} color="#fef08a" />
                  <span>
                    {lang === 'en'
                      ? 'Confirm Global Sponsor / Claim Perks'
                      : 'Xác Nhận Đã Tài Trợ Quốc Tế / Nhận Quà Ngay 🎁'}
                  </span>
                </button>
              </div>
            )}

            {/* ======================================================= */}
            {/* KÊNH 2: VIETQR NAPAS 24/7                                */}
            {/* ======================================================= */}
            {paymentMethod === 'VIETQR' && (
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1.2px solid rgba(250, 204, 21, 0.3)',
                  borderRadius: '16px',
                  padding: '14px',
                  display: 'grid',
                  gridTemplateColumns: '170px 1fr',
                  gap: '14px',
                  alignItems: 'center',
                }}
              >
                {/* Cột QR Code */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: '#ffffff',
                    padding: '8px',
                    borderRadius: '12px',
                    boxShadow: '0 0 16px rgba(0,0,0,0.4)',
                  }}
                >
                  <img
                    src={vietQrUrl}
                    alt="VietQR Napas 24/7"
                    style={{
                      width: '100%',
                      height: 'auto',
                      borderRadius: '8px',
                      display: 'block',
                    }}
                    loading="lazy"
                  />
                  <div
                    style={{
                      fontSize: '0.65rem',
                      color: '#0f172a',
                      fontWeight: 800,
                      marginTop: '4px',
                      textAlign: 'center',
                    }}
                  >
                    ⚡ Quét Mọi App Ngân Hàng
                  </div>
                </div>

                {/* Cột Thông tin chuyển khoản */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8' }}>{lang === 'en' ? 'Bank:' : 'Ngân hàng:'}</span>
                    <span style={{ fontWeight: 800, color: '#38bdf8' }}>{bankConfig.bankName}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8' }}>{lang === 'en' ? 'Account No:' : 'Số Tài Khoản:'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 900, color: '#fef08a', letterSpacing: '0.04em' }}>
                        {bankConfig.accountNo}
                      </span>
                      <button
                        onClick={() => handleCopy(bankConfig.accountNo, 'accountNo')}
                        title="Copy STK"
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '3px 6px',
                          color: copiedKey === 'accountNo' ? '#4ade80' : '#cbd5e1',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {copiedKey === 'accountNo' ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8' }}>{lang === 'en' ? 'Account Name:' : 'Chủ Tài Khoản:'}</span>
                    <span style={{ fontWeight: 800, color: '#f8fafc' }}>{bankConfig.accountName}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8' }}>{lang === 'en' ? 'Amount:' : 'Số Tiền:'}</span>
                    <span style={{ fontWeight: 900, color: '#f43f5e', fontSize: '0.92rem' }}>
                      {currentAmountVND.toLocaleString()} VNĐ
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(250, 204, 21, 0.08)',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      border: '1px dashed rgba(250, 204, 21, 0.3)',
                    }}
                  >
                    <span style={{ color: '#fef08a', fontSize: '0.72rem' }}>
                      {lang === 'en' ? 'Memo:' : 'Nội Dung:'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 900, color: '#facc15', fontSize: '0.75rem' }}>
                        {currentMemo}
                      </span>
                      <button
                        onClick={() => handleCopy(currentMemo, 'memo')}
                        title="Copy Nội Dung"
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '3px 6px',
                          color: copiedKey === 'memo' ? '#4ade80' : '#cbd5e1',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {copiedKey === 'memo' ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>

                  {/* Nút hành động chính */}
                  <button
                    onClick={handleConfirmTransfer}
                    style={{
                      marginTop: '6px',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      fontWeight: 900,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)',
                      transition: 'transform 0.1s',
                    }}
                    onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                    onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <CheckCircle2 size={16} />
                    <span>{lang === 'en' ? 'I Have Completed Transfer!' : 'Tôi Đã Chuyển Khoản Thành Công!'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Toggle cấu hình STK & Link Quốc Tế dành cho Admin / Sếp */}
            <div style={{ marginTop: '2px' }}>
              <button
                onClick={() => setShowAdminSettings(!showAdminSettings)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
              >
                <Settings size={12} />
                <span>
                  {showAdminSettings
                    ? (lang === 'en' ? 'Hide Gateway Configuration' : 'Ẩn Cấu Hình Cổng Thanh Toán')
                    : (lang === 'en' ? '⚙️ Admin: Configure Bank & Global Payment URLs' : '⚙️ Admin: Cấu Hình STK Ngân Hàng & Link Quốc Tế')}
                </span>
              </button>

              {showAdminSettings && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {/* Nhóm 1: STK Ngân Hàng Nội Địa */}
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#facc15', marginBottom: '6px' }}>
                      ⚡ {lang === 'en' ? 'VietQR Domestic Bank Account:' : 'Cấu hình STK Ngân Hàng VietQR (Napas 24/7):'}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Ngân Hàng:</label>
                        <select
                          value={editBankId}
                          onChange={(e) => setEditBankId(e.target.value)}
                          style={{
                            width: '100%',
                            background: 'rgba(30, 41, 59, 0.9)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#f8fafc',
                            padding: '4px 6px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                          }}
                        >
                          {SUPPORTED_BANKS.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.id} - {b.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Số Tài Khoản:</label>
                        <input
                          type="text"
                          value={editAccountNo}
                          onChange={(e) => setEditAccountNo(e.target.value)}
                          style={{
                            width: '100%',
                            background: 'rgba(30, 41, 59, 0.9)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#f8fafc',
                            padding: '4px 6px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: '6px' }}>
                      <label style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Tên Chủ Tài Khoản:</label>
                      <input
                        type="text"
                        value={editAccountName}
                        onChange={(e) => setEditAccountName(e.target.value.toUpperCase())}
                        style={{
                          width: '100%',
                          background: 'rgba(30, 41, 59, 0.9)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: '#f8fafc',
                          padding: '4px 6px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                        }}
                      />
                    </div>

                    <button
                      onClick={handleSaveBankAdmin}
                      style={{
                        marginTop: '6px',
                        float: 'right',
                        background: 'rgba(250, 204, 21, 0.2)',
                        border: '1px solid #facc15',
                        color: '#fef08a',
                        padding: '4px 12px',
                        borderRadius: '8px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {lang === 'en' ? 'Save Bank Account' : 'Lưu STK Ngân Hàng'}
                    </button>
                    <div style={{ clear: 'both' }} />
                  </div>

                  {/* Nhóm 2: Link Cổng Thanh Toán Quốc Tế */}
                  <div style={{ paddingTop: '8px', borderTop: '1px dashed rgba(255, 255, 255, 0.15)' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#38bdf8', marginBottom: '6px' }}>
                      🌍 {lang === 'en' ? 'International Gateways (BuyMeACoffee / PayPal / Ko-fi):' : 'Cấu hình Link Cổng Quốc Tế (BuyMeACoffee / PayPal / Ko-fi):'}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                      <div>
                        <label style={{ fontSize: '0.68rem', color: '#94a3b8' }}>☕ Buy Me a Coffee URL:</label>
                        <input
                          type="text"
                          value={editBuyMeACoffee}
                          onChange={(e) => setEditBuyMeACoffee(e.target.value)}
                          placeholder="https://buymeacoffee.com/username"
                          style={{
                            width: '100%',
                            background: 'rgba(30, 41, 59, 0.9)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#f8fafc',
                            padding: '4px 6px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.68rem', color: '#94a3b8' }}>🅿️ PayPal.Me URL:</label>
                        <input
                          type="text"
                          value={editPaypalMe}
                          onChange={(e) => setEditPaypalMe(e.target.value)}
                          placeholder="https://paypal.me/username"
                          style={{
                            width: '100%',
                            background: 'rgba(30, 41, 59, 0.9)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#f8fafc',
                            padding: '4px 6px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.68rem', color: '#94a3b8' }}>❤️ Ko-fi URL:</label>
                        <input
                          type="text"
                          value={editKofi}
                          onChange={(e) => setEditKofi(e.target.value)}
                          placeholder="https://ko-fi.com/username"
                          style={{
                            width: '100%',
                            background: 'rgba(30, 41, 59, 0.9)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#f8fafc',
                            padding: '4px 6px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                          }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSaveGlobalAdmin}
                      style={{
                        marginTop: '8px',
                        float: 'right',
                        background: 'rgba(56, 189, 248, 0.2)',
                        border: '1px solid #38bdf8',
                        color: '#38bdf8',
                        padding: '4px 12px',
                        borderRadius: '8px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {lang === 'en' ? 'Save Global Gateways' : 'Lưu Cổng Quốc Tế'}
                    </button>
                    <div style={{ clear: 'both' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 2: REWARDED ADS (+300 COINS)          */}
        {/* ========================================== */}
        {activeTab === 'ADS' && (
          <div
            style={{
              padding: '16px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Khung mô phỏng Video Quảng Cáo Tài Trợ */}
            <div
              style={{
                width: '100%',
                maxWidth: '480px',
                aspectRatio: '16/9',
                background: 'linear-gradient(135deg, #09090b 0%, #1e1b4b 100%)',
                border: '1.5px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '16px',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 25px rgba(56, 189, 248, 0.2)',
              }}
            >
              {/* Nền hiệu ứng sao đêm & trăng */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '16px',
                  fontSize: '2rem',
                  filter: 'drop-shadow(0 0 10px #facc15)',
                }}
              >
                🌕
              </div>
              <div
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '16px',
                  fontSize: '2rem',
                  filter: 'drop-shadow(0 0 8px #f97316)',
                }}
              >
                🔥
              </div>

              {adState === 'IDLE' && (
                <div style={{ textAlign: 'center', padding: '16px', zIndex: 1 }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '6px' }}>🐺</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fef08a' }}>
                    {lang === 'en' ? 'Sponsor Interactive Ad' : 'Xem Video Quảng Cáo Tài Trợ'}
                  </div>
                  <p style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px', maxWidth: '320px' }}>
                    {lang === 'en'
                      ? 'Watch a 15-second sponsor spotlight to receive +300 Free Coins for 3D outfits!'
                      : 'Dành 15 giây xem giới thiệu nhà tài trợ để nhận ngay +300 Coin miễn phí mở trang phục 3D!'}
                  </p>
                  <button
                    onClick={handleStartWatchingAd}
                    style={{
                      marginTop: '12px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      border: '1px solid #38bdf8',
                      borderRadius: '12px',
                      padding: '8px 20px',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 0 14px rgba(56, 189, 248, 0.4)',
                    }}
                  >
                    <Play size={16} />
                    <span>{lang === 'en' ? 'Start Watching (15s)' : 'Bắt Đầu Xem (15s)'}</span>
                  </button>
                </div>
              )}

              {adState === 'WATCHING' && (
                <div style={{ textAlign: 'center', padding: '16px', zIndex: 1, width: '80%' }}>
                  <div style={{ fontSize: '2rem', animation: 'spin 4s infinite linear' }}>⏳</div>
                  <div style={{ fontWeight: 900, fontSize: '1.4rem', color: '#38bdf8', marginTop: '6px' }}>
                    {adTimeLeft}s
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#cbd5e1', marginTop: '4px' }}>
                    {lang === 'en'
                      ? 'Supporting WebRTC Mesh & PWA Server...'
                      : 'Đang tài trợ băng thông âm thanh & máy chủ PWA...'}
                  </div>
                  {/* Progress bar */}
                  <div
                    style={{
                      width: '100%',
                      height: '6px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      marginTop: '12px',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${((15 - adTimeLeft) / 15) * 100}%`,
                        background: 'linear-gradient(90deg, #38bdf8 0%, #facc15 100%)',
                        transition: 'width 0.9s linear',
                      }}
                    />
                  </div>
                </div>
              )}

              {adState === 'REWARD_READY' && (
                <div style={{ textAlign: 'center', padding: '16px', zIndex: 1 }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '4px' }}>🎁</div>
                  <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#fef08a' }}>
                    {lang === 'en' ? 'Completed Sponsor View!' : 'Đã Hoàn Thành Lượt Xem!'}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: '2px' }}>
                    {lang === 'en' ? 'Click below to claim your 300 Coins' : 'Bấm nút dưới để nhận 300 Coin về túi'}
                  </p>
                  <button
                    onClick={handleClaimAdReward}
                    style={{
                      marginTop: '10px',
                      background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                      border: '1px solid #fef08a',
                      borderRadius: '12px',
                      padding: '8px 22px',
                      color: '#0f172a',
                      fontWeight: 900,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 0 18px rgba(234, 179, 8, 0.6)',
                    }}
                  >
                    <Sparkles size={16} color="#0f172a" />
                    <span>{lang === 'en' ? 'Claim +300 Coins 🪙' : 'Nhận +300 Coin 🪙'}</span>
                  </button>
                </div>
              )}

              {adState === 'CLAIMED' && (
                <div style={{ textAlign: 'center', padding: '16px', zIndex: 1 }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '4px' }}>🎉</div>
                  <div style={{ fontWeight: 900, fontSize: '1rem', color: '#4ade80' }}>
                    {lang === 'en' ? 'Reward Claimed Successfully!' : 'Đã Nhận Thưởng Thành Công!'}
                  </div>
                  <button
                    onClick={() => setAdState('IDLE')}
                    style={{
                      marginTop: '10px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '10px',
                      padding: '6px 14px',
                      color: '#cbd5e1',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    {lang === 'en' ? 'Watch Again' : 'Xem Tiếp Lượt Mới'}
                  </button>
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', maxWidth: '420px', fontSize: '0.72rem', color: '#94a3b8' }}>
              💡 {lang === 'en'
                ? 'Rewarded ads help keep the game 100% free for all players while supporting voice chat servers.'
                : 'Quảng cáo nhận thưởng giúp duy trì trò chơi miễn phí 100% cho mọi người và nuôi server Voice chat.'}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 3: LEGAL TERMS & ZERO-GAMBLING POLICY */}
        {/* ========================================== */}
        {activeTab === 'LEGAL' && (
          <div
            style={{
              padding: '16px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* Khung tóm tắt 3 cam kết vàng */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '8px',
              }}
            >
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '12px',
                  padding: '10px',
                }}
              >
                <div style={{ fontWeight: 800, color: '#f87171', fontSize: '0.8rem' }}>
                  🚫 KHÔNG ĐỔI THƯỞNG
                </div>
                <div style={{ fontSize: '0.7rem', color: '#cbd5e1', marginTop: '2px' }}>
                  Coin & vật phẩm chỉ để trang trí 3D, tuyệt đối KHÔNG quy đổi thành tiền mặt hoặc hiện vật.
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.35)',
                  borderRadius: '12px',
                  padding: '10px',
                }}
              >
                <div style={{ fontWeight: 800, color: '#4ade80', fontSize: '0.8rem' }}>
                  🛡️ KHÔNG CỜ BẠC
                </div>
                <div style={{ fontSize: '0.7rem', color: '#cbd5e1', marginTop: '2px' }}>
                  Game giải trí phi lợi nhuận. Tuyệt đối nghiêm cấm cá cược dưới mọi hình thức.
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '12px',
                  padding: '10px',
                }}
              >
                <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.8rem' }}>
                  💖 TỰ NGUYỆN DUY TRÌ
                </div>
                <div style={{ fontSize: '0.7rem', color: '#cbd5e1', marginTop: '2px' }}>
                  Khoản tài trợ tự nguyện hỗ trợ chi phí duy trì WebRTC Mesh & Hosting PWA.
                </div>
              </div>
            </div>

            {/* Văn bản điều khoản chi tiết */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '12px',
                fontSize: '0.74rem',
                lineHeight: 1.5,
                color: '#cbd5e1',
                whiteSpace: 'pre-line',
              }}
            >
              <div style={{ fontWeight: 800, color: '#fef08a', marginBottom: '6px' }}>
                {lang === 'en' ? 'LEGAL DISCLAIMER (VIETNAMESE LAW & INT\'L STANDARDS)' : 'ĐIỀU KHOẢN PHÁP LÝ CHI TIẾT:'}
              </div>
              {lang === 'en' ? LEGAL_DISCLAIMER_EN : LEGAL_DISCLAIMER_VI}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* MODAL FOOTER                               */}
        {/* ========================================== */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.74rem',
            color: '#94a3b8',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🔒</span>
            <span>
              {lang === 'en'
                ? 'Secure Napas 24/7 QR • 100% Non-Gambling Entertainment'
                : 'Mã QR Napas 24/7 chuẩn ngân hàng • Trò chơi giải trí phi lợi nhuận'}
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#f8fafc',
              padding: '6px 16px',
              borderRadius: '10px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {lang === 'en' ? 'Close' : 'Đóng'}
          </button>
        </div>
      </div>
    </div>
  );
};
