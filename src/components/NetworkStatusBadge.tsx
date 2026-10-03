import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { networkHealth, NetworkHealthState } from '../utils/networkHealth';
import { soundEffects } from '../utils/soundEffects';

interface NetworkStatusBadgeProps {
  onRetryReconnect?: () => void;
  isReconnecting?: boolean;
}

export const NetworkStatusBadge: React.FC<NetworkStatusBadgeProps> = ({
  onRetryReconnect,
  isReconnecting = false,
}) => {
  const [networkState, setNetworkState] = useState<NetworkHealthState>(() => networkHealth.getState());

  useEffect(() => {
    const unsubscribe = networkHealth.subscribe((state) => {
      setNetworkState(state);
    });
    return unsubscribe;
  }, []);

  const handleRetry = () => {
    soundEffects.triggerHaptic('medium');
    networkHealth.measurePing();
    if (onRetryReconnect) {
      onRetryReconnect();
    }
  };

  const getQualityColor = () => {
    switch (networkState.quality) {
      case 'EXCELLENT':
        return '#34d399'; // Emerald green
      case 'GOOD':
        return '#facc15'; // Yellow
      case 'POOR':
        return '#fb923c'; // Orange
      case 'DISCONNECTED':
        return '#ef4444'; // Red
      default:
        return '#94a3b8';
    }
  };

  const color = getQualityColor();

  return (
    <>
      {/* 1. Badge nhỏ gọn hiển thị Ping */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 8px',
          borderRadius: '9999px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${color}44`,
          fontSize: '0.72rem',
          fontWeight: 700,
          color: '#cbd5e1',
          fontFamily: 'Montserrat, monospace',
        }}
        title={`Chất lượng mạng: ${networkState.quality} (${networkState.pingMs}ms)`}
      >
        {networkState.isOnline ? (
          <Wifi size={12} color={color} />
        ) : (
          <WifiOff size={12} color="#ef4444" />
        )}
        <span style={{ color }}>
          {networkState.isOnline ? `${networkState.pingMs}ms` : 'Mất mạng'}
        </span>
      </div>

      {/* 2. Floating Reconnection Toast khi mất mạng */}
      {!networkState.isOnline && (
        <div
          style={{
            position: 'fixed',
            top: 'calc(var(--safe-top, 0px) + 12px)',
            left: '16px',
            right: '16px',
            maxWidth: '480px',
            margin: '0 auto',
            zIndex: 99999,
            background: 'rgba(239, 68, 68, 0.95)',
            backdropFilter: 'blur(12px)',
            color: '#fff',
            borderRadius: '14px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 10px 25px rgba(239, 68, 68, 0.4)',
            animation: 'fadeInDown 0.25s ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <WifiOff size={18} />
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 800 }}>Mất Kết Nối Internet</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.9 }}>Đang chờ khôi phục mạng...</div>
            </div>
          </div>

          <button
            type="button"
            disabled={isReconnecting}
            onClick={handleRetry}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: isReconnecting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <RefreshCw size={13} className={isReconnecting ? 'spin' : ''} />
            <span>{isReconnecting ? 'Đang thử...' : 'Thử Lại'}</span>
          </button>
        </div>
      )}
    </>
  );
};
