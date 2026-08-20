import React, { useState, useRef } from 'react';
import { 
  Scissors, 
  Upload, 
  Trash2, 
  CheckCircle,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getPdfInfo, splitPdfFile, renderPdfPageThumbnail } from '../services/pdfService';
import LoadingOverlay from './LoadingOverlay';

export default function SplitPdf() {
  const [file, setFile] = useState(null);
  const [info, setInfo] = useState(null);
  const [selectedPages, setSelectedPages] = useState([]);
  const [thumbnails, setThumbnails] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Extrayendo páginas...');
  const [isDone, setIsDone] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (f) => {
    if (!f) return;
    setFile(f);
    setDownloadUrl(null);
    try {
      const pdfInfo = await getPdfInfo(f);
      setInfo(pdfInfo);
      
      const allPages = Array.from({ length: pdfInfo.pageCount }, (_, i) => i + 1);
      setSelectedPages(allPages);

      // Render thumbnails for each page
      const thumbs = [];
      for (let p = 1; p <= pdfInfo.pageCount; p++) {
        const thumb = await renderPdfPageThumbnail(pdfInfo.arrayBuffer, p, 0.3);
        thumbs.push(thumb);
      }
      setThumbnails(thumbs);
    } catch (err) {
      alert('Error al leer el archivo PDF: ' + err.message);
      setFile(null);
    }
  };

  const togglePage = (pageNum) => {
    if (selectedPages.includes(pageNum)) {
      setSelectedPages(selectedPages.filter(p => p !== pageNum));
    } else {
      setSelectedPages([...selectedPages, pageNum].sort((a, b) => a - b));
    }
    setDownloadUrl(null);
  };

  const handleSplit = async () => {
    if (!file || selectedPages.length === 0) return;
    setIsProcessing(true);
    setIsDone(false);
    setProgress(35);
    setStatusText('Extrayendo páginas seleccionadas...');

    try {
      await new Promise(r => setTimeout(r, 500));

      const pdfBlob = await splitPdfFile(info.arrayBuffer, selectedPages);
      setProgress(85);
      setStatusText('Generando nuevo documento PDF...');
      await new Promise(r => setTimeout(r, 400));

      setProgress(100);
      setIsDone(true);

      const url = URL.createObjectURL(pdfBlob);
      setDownloadUrl(url);

      setTimeout(() => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `Dividido_${file.name}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        setIsProcessing(false);
      }, 1000);
    } catch (err) {
      alert('Error al dividir el archivo PDF: ' + err.message);
      setIsProcessing(false);
    }
  };

  return (
    <div>
      {/* Loading Modal Screen */}
      <LoadingOverlay 
        isOpen={isProcessing}
        title="Dividiendo Documento PDF"
        subtitle={`Extrayendo ${selectedPages.length} páginas de "${file?.name}".`}
        progress={progress}
        statusText={statusText}
        isDone={isDone}
      />

      <div className="hero-section">
        <h1 className="hero-title">Dividir PDF</h1>
        <p className="hero-subtitle">
          Extrae páginas específicas de tu documento PDF para crear un nuevo archivo independiente.
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
            <Scissors size={36} />
          </div>
          <h3 className="dropzone-title">Arrastra tu archivo PDF aquí</h3>
          <p className="dropzone-subtitle">Selecciona qué páginas deseas extraer</p>
          <button className="btn-primary" type="button">
            <Upload size={18} />
            <span>Seleccionar PDF</span>
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{file.name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Haz clic en las páginas para activarlas o desactivarlas. ({selectedPages.length} de {info?.pageCount} seleccionadas)
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-secondary" onClick={() => setSelectedPages(Array.from({ length: info?.pageCount || 0 }, (_, i) => i + 1))}>
                Seleccionar todas
              </button>
              <button className="btn-secondary" onClick={() => setSelectedPages([])}>
                Desmarcar todas
              </button>
            </div>
          </div>

          <div className="file-cards-grid">
            {Array.from({ length: info?.pageCount || 0 }, (_, i) => i + 1).map((pageNum, idx) => {
              const isSelected = selectedPages.includes(pageNum);
              return (
                <div 
                  key={pageNum}
                  className="file-card-item"
                  style={{
                    borderColor: isSelected ? 'var(--accent-red)' : 'var(--border-color)',
                    opacity: isSelected ? 1 : 0.45,
                    cursor: 'pointer'
                  }}
                  onClick={() => togglePage(pageNum)}
                >
                  <div className="file-card-header">
                    <span className="file-card-name">Página {pageNum}</span>
                    <span className="file-card-badge" style={{ background: isSelected ? 'var(--accent-red)' : 'transparent', color: isSelected ? '#fff' : 'inherit' }}>
                      {isSelected ? 'Incluida' : 'Omitida'}
                    </span>
                  </div>

                  <div className="file-thumbnail">
                    {thumbnails[idx] ? (
                      <img src={thumbnails[idx]} alt={`Página ${pageNum}`} />
                    ) : (
                      <FileText size={48} color="#94A3B8" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="action-bar">
            <button className="btn-secondary" onClick={() => { setFile(null); setInfo(null); }}>
              <Trash2 size={18} />
              <span>Cambiar archivo</span>
            </button>

            {downloadUrl ? (
              <a href={downloadUrl} download={`Dividido_${file.name}`} className="btn-primary">
                <CheckCircle size={20} />
                <span>¡PDF Dividido! Descargar</span>
              </a>
            ) : (
              <button className="btn-primary" onClick={handleSplit} disabled={isProcessing || selectedPages.length === 0}>
                <Scissors size={20} />
                <span>Dividir ({selectedPages.length} páginas)</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
