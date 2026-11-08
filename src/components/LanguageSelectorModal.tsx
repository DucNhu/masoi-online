import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Search, Globe, Sparkles, Check, RotateCcw, Compass } from 'lucide-react';
import {
  LanguageEntry,
  GLOBAL_LANGUAGES,
  REGION_TABS,
  RegionKey,
  detectBrowserLanguage,
  getCurrentLanguageEntry,
  setGlobalLanguage,
} from '../utils/i18nCatalog';

export interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCode?: string;
  onSelectLanguage?: (entry: LanguageEntry) => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  isOpen,
  onClose,
  currentCode,
  onSelectLanguage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<RegionKey>('ALL');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Lấy ngôn ngữ tự động phát hiện từ trình duyệt & múi giờ
  const detected = useMemo(() => {
    return detectBrowserLanguage();
  }, []);

  // Xác định mã ngôn ngữ đang hoạt động (ưu tiên prop currentCode, sau đó từ localStorage)
  const activeCode = currentCode || getCurrentLanguageEntry().code;

  // Tự động focus vào ô tìm kiếm khi mở Modal trên PC
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Đóng modal khi bấm phím ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Bộ lọc danh sách ngôn ngữ theo từ khóa và vùng lãnh thổ
  const filteredLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return GLOBAL_LANGUAGES.filter((item) => {
      if (selectedRegion !== 'ALL' && item.region !== selectedRegion) {
        return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.nativeName.toLowerCase().includes(q) ||
        item.country.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.greeting.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedRegion]);

  // Đếm số lượng quốc gia theo từng vùng để hiển thị badge
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: GLOBAL_LANGUAGES.length };
    for (const item of GLOBAL_LANGUAGES) {
      counts[item.region] = (counts[item.region] || 0) + 1;
    }
    return counts;
  }, []);

  if (!isOpen) return null;

  // Xử lý chọn ngôn ngữ
  const handleSelect = (item: LanguageEntry, isManual = true) => {
    const updated = setGlobalLanguage(item.code, isManual);
    onSelectLanguage?.(updated);
    onClose();
  };

  // Áp dụng nhanh cấu hình tự động từ trình duyệt
  const handleApplyDetected = () => {
    handleSelect(detected.entry, false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chọn Quốc Gia & Ngôn Ngữ"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 6, 12, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 250,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #13172c 0%, #0c0e1a 100%)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75), 0 0 35px rgba(168, 85, 247, 0.2)',
          overflow: 'hidden',
          animation: 'fadeInScale 0.22s ease-out forwards',
        }}
      >
        {/* ========================================== */}
        {/* MODAL HEADER                               */}
        {/* ========================================== */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(56, 189, 248, 0.3))',
                border: '1px solid rgba(168, 85, 247, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
              }}
            >
              🌍
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: '#f8fafc',
                    margin: 0,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Chọn Quốc Gia & Ngôn Ngữ
                </h2>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: '#c084fc',
                    background: 'rgba(168, 85, 247, 0.18)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    border: '1px solid rgba(168, 85, 247, 0.35)',
                  }}
                >
                  128+ Quốc Gia
                </span>
              </div>
              <p
                style={{
                  fontSize: '0.78rem',
                  color: '#94a3b8',
                  margin: '3px 0 0 0',
                }}
              >
                Khám phá & kết nối cùng người chơi Ma Sói trên toàn cầu
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Đóng bảng chọn ngôn ngữ"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#94a3b8',
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ========================================== */}
        {/* BANNER PHÁT HIỆN TỰ ĐỘNG (AUTO DETECT)      */}
        {/* ========================================== */}
        <div
          style={{
            margin: '14px 18px 0 18px',
            padding: '12px 14px',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '220px' }}>
            <span style={{ fontSize: '1.4rem' }}>{detected.entry.flag}</span>
            <div style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
              <div style={{ color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Compass size={14} />
                <span>Phát hiện từ trình duyệt ({detected.rawLocale}) & múi giờ ({detected.timeZone})</span>
              </div>
              <div style={{ color: '#f1f5f9', fontWeight: 600 }}>
                {detected.entry.nativeName} — {detected.entry.country}
                <span style={{ marginLeft: '6px', color: '#c084fc', fontStyle: 'italic' }}>
                  "{detected.entry.greeting}"
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleApplyDetected}
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #7c3aed 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.35)',
              transition: 'transform 0.15s ease',
              flexShrink: 0,
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Sparkles size={14} />
            <span>⚡ Tự Động Theo Trình Duyệt</span>
          </button>
        </div>

        {/* ========================================== */}
        {/* THANH TÌM KIẾM TỨC THỜI                    */}
        {/* ========================================== */}
        <div style={{ padding: '14px 18px 8px 18px' }}>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '14px',
              padding: '0 12px',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.7)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(168, 85, 247, 0.25)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Search size={18} color="#94a3b8" style={{ flexShrink: 0, marginRight: '8px' }} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Tìm tên quốc gia, ngôn ngữ, mã vùng (VD: vi, vn, Japan, Francais, +84)..."
              style={{
                width: '100%',
                padding: '12px 0',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#f8fafc',
                fontSize: '0.88rem',
                fontFamily: 'inherit',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                aria-label="Xóa từ khóa tìm kiếm"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#cbd5e1',
                  padding: 0,
                  marginLeft: '6px',
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Dòng trạng thái số lượng kết quả */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '6px',
              padding: '0 4px',
              fontSize: '0.72rem',
              color: '#94a3b8',
            }}
          >
            <span>
              Tìm thấy <strong style={{ color: '#38bdf8' }}>{filteredLanguages.length}</strong> / {GLOBAL_LANGUAGES.length} quốc gia
            </span>
            {searchQuery && (
              <span style={{ color: '#c084fc', fontStyle: 'italic' }}>
                Lọc theo từ khóa: "{searchQuery}"
              </span>
            )}
          </div>
        </div>

        {/* ========================================== */}
        {/* THANH LỌC CHÂU LỤC (REGION PILLS)         */}
        {/* ========================================== */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 18px 12px 18px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {REGION_TABS.map((tab) => {
            const isSelected = selectedRegion === tab.key;
            const count = regionCounts[tab.key] || 0;
            return (
              <button
                key={tab.key}
                onClick={() => setSelectedRegion(tab.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: isSelected ? 800 : 600,
                  border: isSelected
                    ? '1px solid rgba(168, 85, 247, 0.7)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(56, 189, 248, 0.25) 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                  color: isSelected ? '#ffffff' : '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                  boxShadow: isSelected ? '0 0 12px rgba(168, 85, 247, 0.3)' : 'none',
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                    color: isSelected ? '#ffffff' : '#64748b',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ========================================== */}
        {/* GRID DANH SÁCH QUỐC GIA (SCROLLABLE)       */}
        {/* ========================================== */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '4px 18px 18px 18px',
            minHeight: '260px',
          }}
        >
          {filteredLanguages.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 16px',
                textAlign: 'center',
                color: '#94a3b8',
              }}
            >
              <Globe size={40} color="#64748b" style={{ marginBottom: '12px', opacity: 0.7 }} />
              <p style={{ fontSize: '0.92rem', color: '#f1f5f9', fontWeight: 600, margin: '0 0 6px 0' }}>
                Không tìm thấy quốc gia hoặc ngôn ngữ phù hợp
              </p>
              <p style={{ fontSize: '0.78rem', margin: '0 0 16px 0', maxWidth: '320px' }}>
                Không có kết quả nào khớp với "{searchQuery}" trong khu vực hiện tại.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRegion('ALL');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(168, 85, 247, 0.2)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  color: '#c084fc',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={14} />
                <span>Đặt lại bộ lọc tìm kiếm</span>
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
                gap: '10px',
              }}
            >
              {filteredLanguages.map((item) => {
                const isSelected = item.code.toLowerCase() === activeCode.toLowerCase();

                return (
                  <div
                    key={item.code}
                    onClick={() => handleSelect(item, true)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelect(item, true);
                      }
                    }}
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.22) 0%, rgba(56, 189, 248, 0.16) 100%)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected
                        ? '1.5px solid rgba(168, 85, 247, 0.75)'
                        : '1px solid rgba(255, 255, 255, 0.07)',
                      borderRadius: '14px',
                      padding: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      position: 'relative',
                      boxShadow: isSelected
                        ? '0 6px 18px rgba(168, 85, 247, 0.25)'
                        : 'none',
                      transition: 'all 0.18s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
                        e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.35)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.07)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    {/* Header thẻ: Cờ + Mã Code Badge */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '4px',
                      }}
                    >
                      <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{item.flag}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isSelected && (
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                              fontSize: '0.68rem',
                              color: '#34d399',
                              fontWeight: 800,
                              background: 'rgba(16, 185, 129, 0.16)',
                              padding: '2px 6px',
                              borderRadius: '6px',
                              border: '1px solid rgba(16, 185, 129, 0.35)',
                            }}
                          >
                            <Check size={10} strokeWidth={3} /> Đang chọn
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            color: isSelected ? '#c084fc' : '#94a3b8',
                            background: 'rgba(0, 0, 0, 0.3)',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                          }}
                        >
                          {item.code}
                        </span>
                      </div>
                    </div>

                    {/* Tên bản địa (Native Name) */}
                    <div
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        color: isSelected ? '#ffffff' : '#f1f5f9',
                        lineHeight: 1.25,
                      }}
                    >
                      {item.nativeName}
                    </div>

                    {/* Tên quốc gia / vùng */}
                    <div
                      style={{
                        fontSize: '0.74rem',
                        color: '#94a3b8',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.country}
                    </div>

                    {/* Câu chào bản địa */}
                    <div
                      style={{
                        marginTop: '4px',
                        padding: '4px 8px',
                        background: 'rgba(0, 0, 0, 0.25)',
                        borderRadius: '8px',
                        fontSize: '0.72rem',
                        color: '#c084fc',
                        fontStyle: 'italic',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      💬 "{item.greeting}"
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================== */}
        {/* MODAL FOOTER                               */}
        {/* ========================================== */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: '#94a3b8',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>💡</span>
            <span>
              Giao diện hiển thị: <strong style={{ color: '#38bdf8' }}>Tiếng Việt</strong> cho Việt Nam và{' '}
              <strong style={{ color: '#c084fc' }}>English</strong> cho Quốc tế.
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f8fafc',
              padding: '6px 16px',
              borderRadius: '10px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
