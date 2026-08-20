import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function CustomToast({ isOpen, message, type = 'error', onClose }) {
  if (!isOpen || !message) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '24px',
      right: '24px',
      zIndex: 10001,
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      backgroundColor: type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
      color: '#FFFFFF',
      backdropFilter: 'blur(10px)',
      padding: '0.9rem 1.25rem',
      borderRadius: '12px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
      fontSize: '0.925rem',
      fontWeight: 600,
      maxWidth: '420px',
      animation: 'slideInRight 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
    }}>
      {type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
      <span style={{ flex: 1, lineHeight: 1.4 }}>{message}</span>
      <button 
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#FFFFFF',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <X size={18} />
      </button>
    </div>
  );
}
