import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import MergePdf from './components/MergePdf';
import ExcelToPdf from './components/ExcelToPdf';
import WordToPdf from './components/WordToPdf';
import PdfToWord from './components/PdfToWord';
import PdfToExcel from './components/PdfToExcel';
import PdfToImages from './components/PdfToImages';
import CompressPdf from './components/CompressPdf';
import WatermarkPdf from './components/WatermarkPdf';
import SplitPdf from './components/SplitPdf';
import ImagesToPdf from './components/ImagesToPdf';
import OrganizePdf from './components/OrganizePdf';
import SignPdf from './components/SignPdf';
import TermsPage from './components/TermsPage';
import PrivacyPage from './components/PrivacyPage';
import { translations } from './utils/translations';
import { Mail } from 'lucide-react';

function getDynamicProjectToken() {
  let prj = sessionStorage.getItem('pdf_master_prj');
  if (!prj) {
    prj = 'prj_' + Math.random().toString(36).substr(2, 8);
    sessionStorage.setItem('pdf_master_prj', prj);
  }
  return prj;
}

function generateSessionToken() {
  return 's_' + Math.random().toString(36).substr(2, 8);
}

export function buildDynamicPath(toolKey) {
  const prj = getDynamicProjectToken();
  const sess = generateSessionToken();

  const pathMap = {
    'inicio': `/v1/workspace/${prj}/dashboard?view=overview&session=${sess}&status=active`,
    'unir-pdf': `/v1/workspace/${prj}/tools/pdf-merge?mode=batch&session=${sess}&engine=pdf-lib`,
    'excel-a-pdf': `/v1/workspace/${prj}/tools/excel-to-pdf?format=exact&session=${sess}&render=hd`,
    'pdf-a-excel': `/v1/workspace/${prj}/tools/pdf-to-excel?format=xlsx&session=${sess}&extract=tables`,
    'word-a-pdf': `/v1/workspace/${prj}/tools/word-to-pdf?format=exact&session=${sess}&render=hd`,
    'pdf-a-word': `/v1/workspace/${prj}/tools/pdf-to-word?format=doc&session=${sess}&extract=text`,
    'pdf-a-imagenes': `/v1/workspace/${prj}/tools/pdf-to-images?format=zip&session=${sess}&quality=300dpi`,
    'comprimir-pdf': `/v1/workspace/${prj}/tools/pdf-compress?mode=lossless&session=${sess}&optimize=true`,
    'marca-de-agua': `/v1/workspace/${prj}/tools/pdf-watermark?style=diagonal&session=${sess}&opacity=0.3`,
    'dividir-pdf': `/v1/workspace/${prj}/tools/pdf-split?scope=pages&session=${sess}&action=extract`,
    'imagenes-a-pdf': `/v1/workspace/${prj}/tools/image-to-pdf?quality=hd&session=${sess}&fit=page`,
    'organizar-pdf': `/v1/workspace/${prj}/tools/pdf-organize?view=grid&session=${sess}&rotate=enabled`,
    'firmar-pdf': `/v1/workspace/${prj}/tools/pdf-sign?mode=digital&session=${sess}&security=active`,
    'terminos': `/v1/legal/terms-and-conditions?ref=footer&session=${sess}&ver=2026.1`,
    'privacidad': `/v1/legal/privacy-policy?ref=footer&session=${sess}&ver=2026.1`,
  };

  return pathMap[toolKey] || pathMap['inicio'];
}

function getRouteFromUrl() {
  const path = window.location.pathname + window.location.search;
  const hash = window.location.hash;

  if (path.includes('pdf-merge') || hash.includes('unir-pdf')) return 'unir-pdf';
  if (path.includes('excel-to-pdf') || hash.includes('excel-a-pdf')) return 'excel-a-pdf';
  if (path.includes('pdf-to-excel') || hash.includes('pdf-a-excel')) return 'pdf-a-excel';
  if (path.includes('word-to-pdf') || hash.includes('word-a-pdf')) return 'word-a-pdf';
  if (path.includes('pdf-to-word') || hash.includes('pdf-a-word')) return 'pdf-a-word';
  if (path.includes('pdf-to-images') || hash.includes('pdf-a-imagenes')) return 'pdf-a-imagenes';
  if (path.includes('pdf-compress') || hash.includes('comprimir-pdf')) return 'comprimir-pdf';
  if (path.includes('pdf-watermark') || hash.includes('marca-de-agua')) return 'marca-de-agua';
  if (path.includes('pdf-sign') || hash.includes('firmar-pdf')) return 'firmar-pdf';
  if (path.includes('pdf-split') || hash.includes('dividir-pdf')) return 'dividir-pdf';
  if (path.includes('image-to-pdf') || hash.includes('imagenes-a-pdf')) return 'imagenes-a-pdf';
  if (path.includes('pdf-organize') || hash.includes('organizar-pdf')) return 'organizar-pdf';
  if (path.includes('terms-and-conditions') || hash.includes('terminos')) return 'terminos';
  if (path.includes('privacy-policy') || hash.includes('privacidad')) return 'privacidad';

  return 'inicio';
}

export default function App() {
  const [activeRoute, setActiveRoute] = useState(getRouteFromUrl);
  const [theme, setTheme] = useState('light');
  const [lang, setLang] = useState('es'); // 'es' | 'en'

  const t = (path) => {
    const keys = path.split('.');
    let current = translations[lang] || translations.es;
    for (const k of keys) {
      if (current && current[k] !== undefined) {
        current = current[k];
      } else {
        return path;
      }
    }
    return current;
  };

  useEffect(() => {
    const onLocationChange = () => {
      setActiveRoute(getRouteFromUrl());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('popstate', onLocationChange);
    window.addEventListener('hashchange', onLocationChange);
    return () => {
      window.removeEventListener('popstate', onLocationChange);
      window.removeEventListener('hashchange', onLocationChange);
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const navigate = (routeId) => {
    const idMap = {
      'merge': 'unir-pdf',
      'excel': 'excel-a-pdf',
      'word': 'word-a-pdf',
      'sign': 'firmar-pdf',
      'split': 'dividir-pdf',
      'img2pdf': 'imagenes-a-pdf',
      'organize': 'organizar-pdf',
      'dashboard': 'inicio',
    };
    const resolvedId = idMap[routeId] || routeId;
    const targetPath = buildDynamicPath(resolvedId);
    
    window.history.pushState({}, '', targetPath);
    setActiveRoute(resolvedId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const renderPage = () => {
    switch (activeRoute) {
      case 'unir-pdf': return <MergePdf lang={lang} t={t} />;
      case 'excel-a-pdf': return <ExcelToPdf lang={lang} t={t} />;
      case 'pdf-a-excel': return <PdfToExcel lang={lang} t={t} />;
      case 'word-a-pdf': return <WordToPdf lang={lang} t={t} />;
      case 'pdf-a-word': return <PdfToWord lang={lang} t={t} />;
      case 'pdf-a-imagenes': return <PdfToImages lang={lang} t={t} />;
      case 'comprimir-pdf': return <CompressPdf lang={lang} t={t} />;
      case 'marca-de-agua': return <WatermarkPdf lang={lang} t={t} />;
      case 'firmar-pdf': return <SignPdf lang={lang} t={t} />;
      case 'dividir-pdf': return <SplitPdf lang={lang} t={t} />;
      case 'imagenes-a-pdf': return <ImagesToPdf lang={lang} t={t} />;
      case 'organizar-pdf': return <OrganizePdf lang={lang} t={t} />;
      case 'terminos': return <TermsPage lang={lang} t={t} />;
      case 'privacidad': return <PrivacyPage lang={lang} t={t} />;
      default: return <Dashboard navigate={navigate} lang={lang} t={t} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div className="bg-glow-orb-1"></div>
      <div className="bg-glow-orb-2"></div>

      <Header
        activeRoute={activeRoute}
        navigate={navigate}
        theme={theme}
        toggleTheme={toggleTheme}
        lang={lang}
        setLang={setLang}
        t={t}
      />

      <main className="main-content">
        {renderPage()}
      </main>

      {/* Professional Footer */}
      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-grid">
            <div className="footer-brand">
              <h3>PDF Master</h3>
              <p>{t('footer.tagline')}</p>
              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--accent-rose)', fontWeight: 600 }}>
                <Mail size={16} />
                <a href="mailto:knightbinner@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>knightbinner@gmail.com</a>
              </div>
            </div>

            <div className="footer-col">
              <h4>{t('footer.colTools')}</h4>
              <a onClick={(e) => { e.preventDefault(); navigate('unir-pdf'); }} href={buildDynamicPath('unir-pdf')}>{t('nav.unirPdf')}</a>
              <a onClick={(e) => { e.preventDefault(); navigate('excel-a-pdf'); }} href={buildDynamicPath('excel-a-pdf')}>{t('nav.excelPdf')}</a>
              <a onClick={(e) => { e.preventDefault(); navigate('pdf-a-excel'); }} href={buildDynamicPath('pdf-a-excel')}>{t('nav.pdfExcel')}</a>
              <a onClick={(e) => { e.preventDefault(); navigate('word-a-pdf'); }} href={buildDynamicPath('word-a-pdf')}>{t('nav.wordPdf')}</a>
              <a onClick={(e) => { e.preventDefault(); navigate('pdf-a-word'); }} href={buildDynamicPath('pdf-a-word')}>{t('nav.pdfWord')}</a>
              <a onClick={(e) => { e.preventDefault(); navigate('pdf-a-imagenes'); }} href={buildDynamicPath('pdf-a-imagenes')}>{t('nav.pdfImagenes')}</a>
            </div>

            <div className="footer-col">
              <h4>{t('footer.colResources')}</h4>
              <a onClick={(e) => { e.preventDefault(); navigate('comprimir-pdf'); }} href={buildDynamicPath('comprimir-pdf')}>{t('nav.comprimirPdf')}</a>
              <a onClick={(e) => { e.preventDefault(); navigate('marca-de-agua'); }} href={buildDynamicPath('marca-de-agua')}>{t('nav.marcaAgua')}</a>
              <a onClick={(e) => { e.preventDefault(); navigate('firmar-pdf'); }} href={buildDynamicPath('firmar-pdf')}>{t('nav.firmarPdf')}</a>
              <a onClick={(e) => { e.preventDefault(); navigate('terminos'); }} href={buildDynamicPath('terminos')}>{t('footer.terms')}</a>
              <a onClick={(e) => { e.preventDefault(); navigate('privacidad'); }} href={buildDynamicPath('privacidad')}>{t('footer.privacy')}</a>
            </div>

            <div className="footer-col">
              <h4>{t('footer.colSecurity')}</h4>
              <a onClick={(e) => { e.preventDefault(); navigate('inicio'); }} href={buildDynamicPath('inicio')}>Creador: (Mauro)</a>
              <a onClick={(e) => { e.preventDefault(); navigate('inicio'); }} href={buildDynamicPath('inicio')}>Contacto: knightbinner@gmail.com</a>
              <a onClick={(e) => { e.preventDefault(); navigate('inicio'); }} href={buildDynamicPath('inicio')}>Procesamiento 100% Privado</a>
              <a onClick={(e) => { e.preventDefault(); navigate('inicio'); }} href={buildDynamicPath('inicio')}>Motor Ultra HD 384 DPI</a>
            </div>
          </div>

          <div className="footer-bottom">
            <p>{t('footer.rights')} Creador: (Mauro)</p>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <a onClick={(e) => { e.preventDefault(); navigate('terminos'); }} href={buildDynamicPath('terminos')} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.825rem' }}>{t('footer.terms')}</a>
              <a onClick={(e) => { e.preventDefault(); navigate('privacidad'); }} href={buildDynamicPath('privacidad')} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.825rem' }}>{t('footer.privacy')}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
