import React, { useState, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  CheckCircle,
  Download,
  FileCheck,
  Archive
} from 'lucide-react';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';
import LoadingOverlay from './LoadingOverlay';

export default function PdfToImages({ lang = 'es', t }) {
  const [file, setFile] = useState(null);
  const [pageImages, setPageImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Extrayendo páginas como imágenes HD...');
  const [isDone, setIsDone] = useState(false);
  const [zipUrl, setZipUrl] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (f) => {
    if (!f) return;
    setFile(f);
    setPageImages([]);
    setZipUrl(null);
  };

  const handleConvertToImages = async () => {
    if (!file) return;
    setIsProcessing(true);
    setIsDone(false);
    setProgress(10);
    setStatusText('Cargando documento PDF...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      const numPages = pdf.numPages;

      const zip = new JSZip();
      const images = [];

      for (let i = 1; i <= numPages; i++) {
        setProgress(Math.round(15 + (i / numPages) * 70));
        setStatusText(`Renderizando página ${i} de ${numPages} en Ultra HD...`);

        const page = await pdf.getPage(i);
        const scale = 2.0; // High resolution 300 DPI
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        await page.render({ canvasContext: ctx, viewport }).promise;

        const dataUrl = canvas.toDataURL('image/png');
        images.push({ pageNum: i, dataUrl });

        // Add base64 to ZIP archive
        const base64Data = dataUrl.split(',')[1];
        zip.file(`Pagina_${i}.png`, base64Data, { base64: true });
      }

      setPageImages(images);
      setProgress(90);
      setStatusText('Empaquetando imágenes en archivo .zip...');

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      setZipUrl(url);

      setProgress(100);
      setIsDone(true);

      setTimeout(() => {
        const a = document.createElement('a');
        a.href = url;
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        a.download = `${baseName}_Imagenes.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setIsProcessing(false);
      }, 1000);
    } catch (err) {
      console.error('Error converting PDF to images:', err);
      alert('Error al convertir PDF a imágenes: ' + err.message);
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <LoadingOverlay 
        isOpen={isProcessing}
        title="Convertiendo PDF a Imágenes JPG/PNG"
        subtitle={`Renderizando páginas de "${file?.name}" en Ultra HD.`}
        progress={progress}
        statusText={statusText}
        isDone={isDone}
      />

      <div className="hero-section">
        <h1 className="hero-title">Convertir PDF a Imágenes (JPG / PNG)</h1>
        <p className="hero-subtitle">
          Extrae cada página de tu documento PDF como una imagen independiente de alta resolución.
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
          <div className="dropzone-icon">
            <ImageIcon size={36} />
          </div>
          <h3 className="dropzone-title">{t('dropzone.dragPdf')}</h3>
          <p className="dropzone-subtitle">Extrae páginas en formato PNG o descargables en archivo ZIP</p>
          <button className="btn-primary" type="button">
            <Upload size={18} />
            <span>{t('dropzone.browsePdf')}</span>
          </button>
        </div>
      ) : (
        <div>
          {pageImages.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  Páginas extraídas ({pageImages.length} imágenes):
                </h3>

                {zipUrl && (
                  <a href={zipUrl} download={`${file.name.replace(/\.[^/.]+$/, '')}_Imagenes.zip`} className="btn-primary">
                    <Archive size={18} />
                    <span>Descargar Todo (.ZIP)</span>
                  </a>
                )}
              </div>

              <div className="file-cards-grid">
                {pageImages.map((img) => (
                  <div key={img.pageNum} className="file-card-item">
                    <div className="file-card-header">
                      <span className="file-card-name">Página {img.pageNum}</span>
                    </div>

                    <div className="file-thumbnail">
                      <img src={img.dataUrl} alt={`Página ${img.pageNum}`} />
                    </div>

                    <a href={img.dataUrl} download={`Pagina_${img.pageNum}.png`} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                      <Download size={14} />
                      <span>Descargar PNG</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="action-bar">
            <button className="btn-secondary" onClick={() => { setFile(null); setPageImages([]); setZipUrl(null); }}>
              <Trash2 size={18} />
              <span>{t('actions.changeFile')}</span>
            </button>

            {zipUrl ? (
              <a href={zipUrl} download={`${file.name.replace(/\.[^/.]+$/, '')}_Imagenes.zip`} className="btn-primary">
                <CheckCircle size={20} />
                <span>¡Imágenes Listas! Descargar ZIP</span>
              </a>
            ) : (
              <button className="btn-primary" onClick={handleConvertToImages} disabled={isProcessing}>
                <ImageIcon size={20} />
                <span>Convertir PDF a Imágenes HD</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
