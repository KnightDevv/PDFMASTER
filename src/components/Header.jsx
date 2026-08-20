import React, { useState } from 'react';
import {
  Combine,
  FileSpreadsheet,
  FileText,
  Scissors,
  ImagePlus,
  LayoutList,
  PenTool,
  Zap,
  Stamp,
  Sun,
  Moon,
  Globe,
  LayoutDashboard,
  Menu,
  X
} from 'lucide-react';

export default function Header({ activeRoute, navigate, theme, toggleTheme, lang, setLang, t }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: 'inicio', label: t('nav.inicio'), icon: LayoutDashboard },
    { id: 'unir-pdf', label: t('nav.unirPdf'), icon: Combine },
    { id: 'excel-a-pdf', label: t('nav.excelPdf'), icon: FileSpreadsheet },
    { id: 'pdf-a-excel', label: t('nav.pdfExcel'), icon: FileSpreadsheet },
    { id: 'word-a-pdf', label: t('nav.wordPdf'), icon: FileText },
    { id: 'pdf-a-word', label: t('nav.pdfWord'), icon: FileText },
    { id: 'pdf-a-imagenes', label: t('nav.pdfImagenes'), icon: ImagePlus },
    { id: 'comprimir-pdf', label: t('nav.comprimirPdf'), icon: Zap },
    { id: 'marca-de-agua', label: t('nav.marcaAgua'), icon: Stamp },
    { id: 'firmar-pdf', label: t('nav.firmarPdf'), icon: PenTool },
    { id: 'dividir-pdf', label: t('nav.dividirPdf'), icon: Scissors },
    { id: 'imagenes-a-pdf', label: t('nav.imagenesPdf'), icon: ImagePlus },
    { id: 'organizar-pdf', label: t('nav.organizarPdf'), icon: LayoutList },
  ];

  const handleNav = (routeId) => {
    navigate(routeId);
    setMobileOpen(false);
  };

  const toggleLanguage = () => {
    setLang(prev => prev === 'es' ? 'en' : 'es');
  };

  return (
    <>
      <header className="app-header">
        <div className="brand-logo" onClick={() => handleNav('inicio')}>
          <div className="brand-badge">
            <Combine size={20} />
          </div>
          <span>{t('brand')}</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="nav-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-button ${activeRoute === item.id ? 'active' : ''}`}
                onClick={() => handleNav(item.id)}
              >
                <Icon size={17} strokeWidth={2.2} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Language Switcher */}
          <button 
            className="theme-toggle-btn"
            onClick={toggleLanguage}
            title={lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.45rem 0.75rem', fontWeight: 700, fontSize: '0.85rem' }}
          >
            <Globe size={16} />
            <span>{lang.toUpperCase()}</span>
          </button>

          {/* Theme Toggle */}
          <button className="theme-toggle-btn" onClick={toggleTheme} title="Cambiar tema">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Abrir menú"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div className={`mobile-nav-drawer ${mobileOpen ? 'open' : ''}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-button ${activeRoute === item.id ? 'active' : ''}`}
              onClick={() => handleNav(item.id)}
            >
              <Icon size={20} strokeWidth={2.2} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
