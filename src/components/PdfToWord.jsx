import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Trash2, 
  CheckCircle,
  FileCheck,
  Maximize2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import * as pdfjsLib from 'pdfjs-dist';
import LoadingOverlay from './LoadingOverlay';

export default function PdfToWord({ lang = 'es', t }) {
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Extrayendo texto del PDF...');
  const [isDone, setIsDone] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (f) => {
    if (!f) return;
    setFile(f);
    setDownloadUrl(null);
    setExtractedText('');
  };

  const handleConvertToWord = async () => {
    if (!file) return;
    setIsProcessing(true);
    setIsDone(false);
    setProgress(15);
    setStatusText('Leyendo capas de texto del PDF...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

      let fullHtml = `<h1 style="text-align: center; color: #1E293B;">${file.name.replace(/\.[^/.]+$/, '')}</h1>`;
      const numPages = pdf.numPages;

      for (let i = 1; i <= numPages; i++) {
        setProgress(Math.round(20 + (i / numPages) * 65));
        setStatusText(`Extrayendo texto y estructura de página ${i} de ${numPages}...`);

        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        fullHtml += `<div style="margin-bottom: 2rem; border-bottom: 1px solid #E2E8F0; padding-bottom: 1.5rem;">`;
        fullHtml += `<p style="color: #64748B; font-weight: bold; font-size: 0.85rem;">--- Página ${i} ---</p>`;

        let lastY;
        let lineText = '';

        for (const item of textContent.items) {
          if (lastY !== item.transform[5] && lineText) {
            fullHtml += `<p style="margin: 0.4rem 0; font-size: 11pt; font-family: Georgia, serif;">${lineText}</p>`;
            lineText = '';
          }
          lineText += item.str + ' ';
          lastY = item.transform[5];
        }
        if (lineText) {
          fullHtml += `<p style="margin: 0.4rem 0; font-size: 11pt; font-family: Georgia, serif;">${lineText}</p>`;
        }

        fullHtml += `</div>`;
      }

      setExtractedText(fullHtml);
      setProgress(90);
      setStatusText('Empaquetando archivo Word .doc editable...');
      await new Promise(r => setTimeout(r, 400));

      // Build downloadable Word .doc HTML Blob compatible with Microsoft Word
      const wordHtmlHeader = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Documento Convertido</title></head>
        <body style="font-family: Georgia, 'Times New Roman', serif; padding: 40px;">
          ${fullHtml}
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff', wordHtmlHeader], { type: 'application/msword' });
      setProgress(100);
      setIsDone(true);

      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      setTimeout(() => {
        const a = document.createElement('a');
        a.href = url;
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        a.download = `${baseName}_Convertido.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setIsProcessing(false);
      }, 1000);
    } catch (err) {
      console.error('Error converting PDF to Word:', err);
      alert('Error al convertir PDF a Word: ' + err.message);
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <LoadingOverlay 
        isOpen={isProcessing}
        title="Convertiendo PDF a Word"
        subtitle={`Extrayendo párrafos y texto editable de "${file?.name}".`}
        progress={progress}
        statusText={statusText}
        isDone={isDone}
      />

      <div className="hero-section">
        <h1 className="hero-title">Convertir PDF a Word</h1>
        <p className="hero-subtitle">
          Convierte fácilmente tus archivos PDF a documentos de Microsoft Word editables en segundos.
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
          <div className="dropzone-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-indigo)' }}>
            <FileText size={36} />
          </div>
          <h3 className="dropzone-title">{t('dropzone.dragPdf')}</h3>
          <p className="dropzone-subtitle">Genera un archivo Word editable sin perder texto</p>
          <button className="btn-primary" type="button" style={{ background: 'var(--gradient-indigo)' }}>
            <Upload size={18} />
            <span>{t('dropzone.browsePdf')}</span>
          </button>
        </div>
      ) : (
        <div>
          {extractedText && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                Vista previa del contenido extraído:
              </h3>
              <div 
                className="excel-preview-wrapper"
                style={{ maxHeight: '400px', overflowY: 'auto', background: '#FFFFFF', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                dangerouslySetInnerHTML={{ __html: extractedText }}
              />
            </div>
          )}

          <div className="action-bar">
            <button className="btn-secondary" onClick={() => { setFile(null); setExtractedText(''); setDownloadUrl(null); }}>
              <Trash2 size={18} />
              <span>{t('actions.changeFile')}</span>
            </button>

            {downloadUrl ? (
              <a href={downloadUrl} download={`${file.name.replace(/\.[^/.]+$/, '')}_Convertido.doc`} className="btn-primary" style={{ background: 'var(--gradient-indigo)' }}>
                <CheckCircle size={20} />
                <span>¡Word Listo! Descargar de nuevo</span>
              </a>
            ) : (
              <button 
                className="btn-primary" 
                style={{ background: 'var(--gradient-indigo)' }}
                onClick={handleConvertToWord}
                disabled={isProcessing}
              >
                <FileCheck size={20} />
                <span>Convertir PDF a Word Editable</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
