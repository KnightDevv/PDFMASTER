import React from 'react';
import { Loader2, CheckCircle2, FileText, Sparkles } from 'lucide-react';

export default function LoadingOverlay({ 
  isOpen, 
  title = "Generando PDF", 
  subtitle = "Procesando documento en alta resolución...", 
  progress = 0, 
  statusText = "Compilando páginas...",
  isDone = false 
}) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        padding: '2.5rem 2rem',
        maxWidth: '440px',
        width: '100%',
        textAlign: 'center',
        boxShadow: 'var(--shadow-lg), var(--shadow-glow)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.25rem',
        animation: 'scaleIn 0.3s ease-out'
      }}>
        {/* Animated Icon Ring */}
        <div style={{
          position: 'relative',
          width: '84px',
          height: '84px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {isDone ? (
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'var(--gradient-excel)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)',
              animation: 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
              <CheckCircle2 size={44} />
            </div>
          ) : (
            <>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: '50%',
                border: '3px solid var(--border-color)',
                borderTopColor: 'var(--accent-rose)',
                borderRightColor: 'var(--accent-violet)',
                animation: 'spin 1.2s linear infinite'
              }}></div>
              
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(244, 63, 94, 0.1)',
                color: 'var(--accent-rose)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={30} />
              </div>
            </>
          )}
        </div>

        {/* Title & Subtitle */}
        <div>
          <h3 style={{
            fontSize: '1.35rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '0.4rem'
          }}>
            {isDone ? '¡PDF Generado con Éxito!' : title}
          </h3>
          <p style={{
            fontSize: '0.925rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5
          }}>
            {isDone ? 'Iniciando descarga en tu navegador...' : subtitle}
          </p>
        </div>

        {/* Progress Bar & Percentage */}
        {!isDone && (
          <div style={{ width: '100%', marginTop: '0.5rem' }}>
            <div style={{
              display: 'flex',
              justify: 'space-between',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '0.4rem'
            }}>
              <span>{statusText}</span>
              <span>{Math.min(progress, 100)}%</span>
            </div>

            <div className="progress-bar-container" style={{ margin: 0 }}>
              <div 
                className="progress-bar-fill" 
                style={{ width: `${Math.min(progress, 100)}%`, transition: 'width 0.25s ease' }}
              ></div>
            </div>
          </div>
        )}

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
