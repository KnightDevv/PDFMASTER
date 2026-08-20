import React from 'react';
import { Mail } from 'lucide-react';

export default function TermsPage({ lang = 'es', t }) {
  return (
    <div className="legal-page">
      <h1>{t('legal.termsTitle')}</h1>
      <p><strong>{t('legal.lastUpdated')}</strong></p>

      <h2>{t('legal.sec1Title')}</h2>
      <p>{t('legal.sec1Desc')}</p>

      <h2>{t('legal.sec2Title')}</h2>
      <p>{t('legal.sec2Desc')}</p>

      <h2>{t('legal.sec3Title')}</h2>
      <p>{t('legal.sec3Desc')}</p>

      <h2>{t('legal.sec4Title')}</h2>
      <p>{t('legal.sec4Desc')}</p>

      <h2>{t('legal.sec5Title')}</h2>
      <p>{t('legal.sec5Desc')}</p>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 700, color: 'var(--accent-rose)', marginTop: '0.5rem' }}>
        <Mail size={18} />
        <a href="mailto:knightbinner@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>knightbinner@gmail.com</a>
      </div>
    </div>
  );
}
