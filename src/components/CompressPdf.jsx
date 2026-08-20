import React, { useState, useRef } from 'react';
import { 
  Zap, 
  Upload, 
  Trash2, 
  CheckCircle,
  FileCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PDFDocument } from 'pdf-lib';
import LoadingOverlay from './LoadingOverlay';

export default function CompressPdf({ lang = 'es', t }) {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Optimizando estructura del PDF...');
  const [isDone, setIsDone] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [compressedStats, setCompressedStats] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (f) => {
    if (!f) return;
    setFile(f);
    setDownloadUrl(null);
    setCompressedStats(null);
  };

  const handleCompress = async () => {
    if (!file) return;
    setIsProcessing(true);
    setIsDone(false);
    setProgress(20);
    setStatusText('Analizando objetos e imágenes del PDF...');

    try {
      await new Promise(r => setTimeout(r, 500));
      const arrayBuffer = await file.arrayBuffer();

      setProgress(60);
      setStatusText('Recomprimiendo flujos de datos y eliminando redundancias...');

      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const compressedBytes = await pdfDoc.save({ useObjectStreams: true });

      const origSize = file.size;
      const newSize = compressedBytes.byteLength;
      const reduction = Math.max(0, Math.round(((origSize - newSize) / origSize) * 100));

      setCompressedStats({
        origMb: (origSize / 1024 / 1024).toFixed(2),
        newMb: (newSize / 1024 / 1024).toFixed(2),
        reduction
      });

      setProgress(90);
      setStatusText('Finalizando compresión de documento...');
      await new Promise(r => setTimeout(r, 400));

      const blob = new Blob([compressedBytes], { type: 'application/pdf' });
      setProgress(100);
      setIsDone(true);

      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      setTimeout(() => {
        const a = document.createElement('a');
        a.href = url;
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        a.download = `${baseName}_Comprimido.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setIsProcessing(false);
      }, 1000);
    } catch (err) {
      console.error('Error compressing PDF:', err);
      alert('Error al comprimir PDF: ' + err.message);
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <LoadingOverlay 
        isOpen={isProcessing}
        title="Comprimiendo Documento PDF"
        subtitle={`Optimizando tamaño de "${file?.name}".`}
        progress={progress}
        statusText={statusText}
        isDone={isDone}
      />

      <div className="hero-section">
        <h1 className="hero-title">Comprimir PDF</h1>
        <p className="hero-subtitle">
          Reduce el tamaño de tus archivos PDF manteniendo la máxima calidad posible.
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
          <div className="dropzone-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}>
            <Zap size={36} />
          </div>
          <h3 className="dropzone-title">{t('dropzone.dragPdf')}</h3>
          <p className="dropzone-subtitle">Optimiza y reduce los megabytes de tu PDF al instante</p>
          <button className="btn-primary" type="button" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>
            <Upload size={18} />
            <span>{t('dropzone.browsePdf')}</span>
          </button>
        </div>
      ) : (
        <div>
          {compressedStats && (
            <div className="stats-row" style={{ margin: '1.5rem 0' }}>
              <div className="stat-item">
                <div className="stat-number" style={{ color: 'var(--accent-amber)' }}>-{compressedStats.reduction}%</div>
                <div className="stat-label">Reducción de tamaño</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{compressedStats.newMb} MB</div>
                <div className="stat-label">Nuevo tamaño (Antes: {compressedStats.origMb} MB)</div>
              </div>
            </div>
          )}

          <div className="action-bar">
            <button className="btn-secondary" onClick={() => { setFile(null); setDownloadUrl(null); setCompressedStats(null); }}>
              <Trash2 size={18} />
              <span>{t('actions.changeFile')}</span>
            </button>

            {downloadUrl ? (
              <a href={downloadUrl} download={`${file.name.replace(/\.[^/.]+$/, '')}_Comprimido.pdf`} className="btn-primary" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>
                <CheckCircle size={20} />
                <span>¡PDF Comprimido! Descargar de nuevo</span>
              </a>
            ) : (
              <button 
                className="btn-primary" 
                style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}
                onClick={handleCompress}
                disabled={isProcessing}
              >
                <Zap size={20} />
                <span>Comprimir PDF</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
