import React from 'react';
import { Mail } from 'lucide-react';

export default function PrivacyPage({ lang = 'es', t }) {
  return (
    <div className="legal-page">
      <h1>{t('legal.privacyTitle')}</h1>
      <p><strong>{t('legal.lastUpdated')}</strong></p>

      <h2>{t('legal.privSec1Title')}</h2>
      <p>{t('legal.privSec1Desc')}</p>

      <h2>{t('legal.privSec2Title')}</h2>
      <p>{t('legal.privSec2Desc')}</p>

      <h2>{t('legal.sec5Title')}</h2>
      <p>{t('legal.sec5Desc')}</p>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 700, color: 'var(--accent-rose)', marginTop: '0.5rem' }}>
        <Mail size={18} />
        <a href="mailto:knightbinner@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>knightbinner@gmail.com</a>
      </div>
    </div>
  );
}
