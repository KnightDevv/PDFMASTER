import React from 'react';
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
  ArrowRight,
  ShieldCheck,
  Globe,
  Lock,
  MonitorSmartphone
} from 'lucide-react';

export default function Dashboard({ navigate, t }) {
  const tools = [
    { id: 'merge', title: t('nav.unirPdf'), description: t('tools.merge.desc'), icon: Combine, iconClass: '' },
    { id: 'excel', title: t('nav.excelPdf'), description: t('tools.excel.desc'), icon: FileSpreadsheet, iconClass: 'tool-icon-excel' },
    { id: 'pdf-a-excel', title: t('nav.pdfExcel'), description: t('tools.pdfExcel.desc'), icon: FileSpreadsheet, iconClass: 'tool-icon-excel' },
    { id: 'word', title: t('nav.wordPdf'), description: t('tools.word.desc'), icon: FileText, iconClass: 'tool-icon-indigo' },
    { id: 'pdf-a-word', title: t('nav.pdfWord'), description: t('tools.pdfWord.desc'), icon: FileText, iconClass: 'tool-icon-indigo' },
    { id: 'pdf-a-imagenes', title: t('nav.pdfImagenes'), description: t('tools.pdfImages.desc'), icon: ImagePlus, iconClass: 'tool-icon-amber' },
    { id: 'comprimir-pdf', title: t('nav.comprimirPdf'), description: t('tools.compress.desc'), icon: Zap, iconClass: 'tool-icon-amber' },
    { id: 'marca-de-agua', title: t('nav.marcaAgua'), description: t('tools.watermark.desc'), icon: Stamp, iconClass: 'tool-icon-rose' },
    { id: 'sign', title: t('nav.firmarPdf'), description: t('tools.sign.desc'), icon: PenTool, iconClass: 'tool-icon-rose' },
    { id: 'split', title: t('nav.dividirPdf'), description: t('tools.split.desc'), icon: Scissors, iconClass: 'tool-icon-cyan' },
    { id: 'img2pdf', title: t('nav.imagenesPdf'), description: t('tools.images.desc'), icon: ImagePlus, iconClass: 'tool-icon-amber' },
    { id: 'organize', title: t('nav.organizarPdf'), description: t('tools.organize.desc'), icon: LayoutList, iconClass: '' }
  ];

  return (
    <div>
      {/* Hero Landing Section */}
      <section className="hero-landing">
        <div className="hero-landing-inner">
          <div className="hero-badge">
            <Lock size={14} />
            <span>{t('hero.badge')}</span>
          </div>

          <h1>{t('hero.title')}</h1>
          <p>{t('hero.subtitle')}</p>

          <div className="hero-cta-row">
            <button className="btn-primary" onClick={() => navigate('merge')}>
              <Combine size={20} />
              <span>{t('hero.btnMerge')}</span>
            </button>
            <button className="btn-outline" onClick={() => navigate('excel')}>
              <FileSpreadsheet size={20} />
              <span>{t('hero.btnExcel')}</span>
            </button>
            <button className="btn-outline" onClick={() => navigate('pdf-a-word')}>
              <FileText size={20} />
              <span>PDF a Word</span>
            </button>
            <button className="btn-outline" onClick={() => navigate('sign')}>
              <PenTool size={20} />
              <span>{t('hero.btnSign')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-item">
          <div className="stat-number">{t('stats.toolsCount')}</div>
          <div className="stat-label">{t('stats.toolsLabel')}</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{t('stats.serversCount')}</div>
          <div className="stat-label">{t('stats.serversLabel')}</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{t('stats.freeCount')}</div>
          <div className="stat-label">{t('stats.freeLabel')}</div>
        </div>
      </div>

      {/* Tools Section */}
      <section>
        <div className="section-heading">
          <h2>{t('sections.allToolsTitle')}</h2>
          <p>{t('sections.allToolsSub')}</p>
        </div>

        <div className="tools-grid">
          {tools.map((tool) => {
            const IconComp = tool.icon;
            return (
              <div
                key={tool.id}
                className="tool-card"
                onClick={() => navigate(tool.id)}
              >
                <div className={`tool-icon-wrapper ${tool.iconClass}`}>
                  <IconComp size={26} strokeWidth={2} />
                </div>
                <h3 className="tool-title">{tool.title}</h3>
                <p className="tool-description">{tool.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-rose)', fontWeight: 700, fontSize: '0.9rem', marginTop: 'auto' }}>
                  <span>{tool.title}</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section style={{ marginTop: '4rem' }}>
        <div className="section-heading">
          <h2>{t('sections.howItWorksTitle')}</h2>
          <p>{t('sections.howItWorksSub')}</p>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>{t('sections.step1Title')}</h3>
            <p>{t('sections.step1Desc')}</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>{t('sections.step2Title')}</h3>
            <p>{t('sections.step2Desc')}</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>{t('sections.step3Title')}</h3>
            <p>{t('sections.step3Desc')}</p>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section style={{ marginTop: '4rem' }}>
        <div className="section-heading">
          <h2>{t('sections.trustTitle')}</h2>
        </div>

        <div className="trust-grid">
          <div className="trust-item">
            <ShieldCheck size={28} className="trust-icon" />
            <div>
              <h4>{t('sections.privacyTitle')}</h4>
              <p>{t('sections.privacyDesc')}</p>
            </div>
          </div>
          <div className="trust-item">
            <Zap size={28} className="trust-icon" />
            <div>
              <h4>{t('sections.speedTitle')}</h4>
              <p>{t('sections.speedDesc')}</p>
            </div>
          </div>
          <div className="trust-item">
            <Globe size={28} className="trust-icon" />
            <div>
              <h4>{t('sections.offlineTitle')}</h4>
              <p>{t('sections.offlineDesc')}</p>
            </div>
          </div>
          <div className="trust-item">
            <MonitorSmartphone size={28} className="trust-icon" />
            <div>
              <h4>{t('sections.devicesTitle')}</h4>
              <p>{t('sections.devicesDesc')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
