import React, { useState, useRef } from 'react';
import { 
  Stamp, 
  Upload, 
  Trash2, 
  CheckCircle,
  FileCheck,
  Settings2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import LoadingOverlay from './LoadingOverlay';

export default function WatermarkPdf({ lang = 'es', t }) {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('CONFIDENCIAL');
  const [opacity, setOpacity] = useState(0.3);
  const [angle, setAngle] = useState(45);
  const [fontSize, setFontSize] = useState(50);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Aplicando marca de agua...');
  const [isDone, setIsDone] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (f) => {
    if (!f) return;
    setFile(f);
    setDownloadUrl(null);
  };

  const handleAddWatermark = async () => {
    if (!file || !text.trim()) return;
    setIsProcessing(true);
    setIsDone(false);
    setProgress(20);
    setStatusText('Cargando documento y tipografía...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const pages = pdfDoc.getPages();
      const totalPages = pages.length;

      for (let i = 0; i < totalPages; i++) {
        setProgress(Math.round(25 + ((i + 1) / totalPages) * 65));
        setStatusText(`Aplicando marca de agua en página ${i + 1} de ${totalPages}...`);

        const page = pages[i];
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const textHeight = font.heightAtSize(fontSize);

        // Center on page
        const x = (width - textWidth) / 2;
        const y = (height - textHeight) / 2;

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0.6, 0.1, 0.1),
          opacity: opacity,
          rotate: degrees(angle)
        });
      }

      setProgress(95);
      setStatusText('Compilando PDF final...');
      await new Promise(r => setTimeout(r, 400));

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      setProgress(100);
      setIsDone(true);

      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      setTimeout(() => {
        const a = document.createElement('a');
        a.href = url;
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        a.download = `${baseName}_MarcaDeAgua.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setIsProcessing(false);
      }, 1000);
    } catch (err) {
      console.error('Error adding watermark:', err);
      alert('Error al añadir marca de agua: ' + err.message);
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <LoadingOverlay 
        isOpen={isProcessing}
        title="Añadiendo Marca de Agua"
        subtitle={`Estampando "${text}" en todas las páginas.`}
        progress={progress}
        statusText={statusText}
        isDone={isDone}
      />

      <div className="hero-section">
        <h1 className="hero-title">Marca de Agua en PDF</h1>
        <p className="hero-subtitle">
          Superpone un texto de marca de agua personalizado sobre cada página de tu documento PDF.
        </p>
      </div>

      {!file ? (
        <div 
          className={`dropzone-container ${isDragOver ? 'drag-over' : ''}`}
          onDrop={(e) => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]); }}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            accept=".pdf,application/pdf" 
            style={{ display: 'none' }}
            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
          />
          <div className="dropzone-icon" style={{ background: 'rgba(225, 29, 72, 0.15)', color: 'var(--accent-rose)' }}>
            <Stamp size={36} />
          </div>
          <h3 className="dropzone-title">{t('dropzone.dragPdf')}</h3>
          <p className="dropzone-subtitle">Personaliza texto, ángulo y transparencia</p>
          <button className="btn-primary" type="button">
            <Upload size={18} />
            <span>{t('dropzone.browsePdf')}</span>
          </button>
        </div>
      ) : (
        <div>
          <div className="options-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <Settings2 size={18} />
              <span>Opciones de Marca de Agua:</span>
            </div>

            <div className="option-group">
              <label>Texto:</label>
              <input 
                type="text" 
                className="option-select"
                style={{ width: '180px', fontWeight: 700 }}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            <div className="option-group">
              <label>Transparencia:</label>
              <input 
                type="range" 
                min="0.1" 
                max="0.9" 
                step="0.1"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                style={{ width: '90px' }}
              />
              <span>{Math.round(opacity * 100)}%</span>
            </div>

            <div className="option-group">
              <label>Ángulo:</label>
              <select className="option-select" value={angle} onChange={(e) => setAngle(Number(e.target.value))}>
                <option value={45}>45° Inclinado</option>
                <option value={0}>0° Horizontal</option>
                <option value={90}>90° Vertical</option>
              </select>
            </div>
          </div>

          <div className="action-bar">
            <button className="btn-secondary" onClick={() => { setFile(null); setDownloadUrl(null); }}>
              <Trash2 size={18} />
              <span>{t('actions.changeFile')}</span>
            </button>

            {downloadUrl ? (
              <a href={downloadUrl} download={`${file.name.replace(/\.[^/.]+$/, '')}_MarcaDeAgua.pdf`} className="btn-primary">
                <CheckCircle size={20} />
                <span>¡PDF Listo! Descargar de nuevo</span>
              </a>
            ) : (
              <button className="btn-primary" onClick={handleAddWatermark} disabled={isProcessing}>
                <Stamp size={20} />
                <span>Aplicar Marca de Agua</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
