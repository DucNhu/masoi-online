import React from 'react';
import { AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Xác Nhận',
  cancelText = 'Hủy Bỏ',
  type,
  variant,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const mode = variant || type || 'danger';
  const isDanger = mode === 'danger';
  const isWarning = mode === 'warning';

  const theme = isDanger
    ? {
        border: '1px solid rgba(239, 68, 68, 0.45)',
        titleColor: '#f87171',
        iconBg: 'rgba(239, 68, 68, 0.15)',
        icon: <AlertTriangle size={24} color="#f87171" />,
        confirmBtnClass: 'btn btn-danger',
      }
    : isWarning
    ? {
        border: '1px solid rgba(245, 158, 11, 0.45)',
        titleColor: '#fbbf24',
        iconBg: 'rgba(245, 158, 11, 0.15)',
        icon: <AlertCircle size={24} color="#fbbf24" />,
        confirmBtnClass: 'btn btn-gold',
      }
    : {
        border: '1px solid rgba(56, 189, 248, 0.45)',
        titleColor: '#38bdf8',
        iconBg: 'rgba(56, 189, 248, 0.15)',
        icon: <HelpCircle size={24} color="#38bdf8" />,
        confirmBtnClass: 'btn btn-primary',
      };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 350,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#16192b',
          border: theme.border,
          borderRadius: '20px',
          padding: '24px 20px',
          maxWidth: '380px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.85)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: theme.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto',
          }}
        >
          {theme.icon}
        </div>

        <h3
          style={{
            fontSize: '1.18rem',
            marginBottom: '8px',
            color: theme.titleColor,
            fontWeight: 800,
          }}
          className="font-cinzel"
        >
          {title}
        </h3>

        <p
          style={{
            fontSize: '0.88rem',
            color: 'var(--text-secondary)',
            marginBottom: '20px',
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => {
              soundEffects.triggerHaptic('light');
              onCancel();
            }}
            className="btn btn-ghost"
            style={{ flex: 1, height: '46px', fontSize: '0.92rem' }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              soundEffects.triggerHaptic('medium');
              onConfirm();
            }}
            className={theme.confirmBtnClass}
            style={{ flex: 1, height: '46px', fontSize: '0.92rem', fontWeight: 700 }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
