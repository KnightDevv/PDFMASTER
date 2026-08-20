import React, { useState, useRef } from 'react';
import { 
  Layers, 
  Upload, 
  Trash2, 
  RotateCw, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getPdfInfo, renderPdfPageThumbnail, mergePdfFiles } from '../services/pdfService';
import LoadingOverlay from './LoadingOverlay';

export default function OrganizePdf() {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Reorganizando estructura del PDF...');
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
      const pageList = [];

      for (let p = 1; p <= pdfInfo.pageCount; p++) {
        const thumb = await renderPdfPageThumbnail(pdfInfo.arrayBuffer, p, 0.35);
        pageList.push({
          id: Math.random().toString(36).substr(2, 9),
          pageNum: p,
          thumbnail: thumb,
          rotation: 0
        });
      }

      setPages(pageList);
    } catch (err) {
      alert('Error al leer el documento PDF: ' + err.message);
      setFile(null);
    }
  };

  const removePage = (id) => {
    setPages(pages.filter(p => p.id !== id));
    setDownloadUrl(null);
  };

  const movePage = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= pages.length) return;
    const list = [...pages];
    const temp = list[index];
    list[index] = list[target];
    list[target] = temp;
    setPages(list);
    setDownloadUrl(null);
  };

  const rotatePage = (id) => {
    setPages(pages.map(p => {
      if (p.id === id) {
        return { ...p, rotation: (p.rotation + 90) % 360 };
      }
      return p;
    }));
    setDownloadUrl(null);
  };

  const handleSaveOrganized = async () => {
    if (!file || pages.length === 0) return;
    setIsProcessing(true);
    setIsDone(false);
    setProgress(30);
    setStatusText('Aplicando nuevo orden y rotación de páginas...');

    try {
      await new Promise(r => setTimeout(r, 500));

      const pdfInfo = await getPdfInfo(file);
      
      const mergeItems = pages.map(p => ({
        file,
        arrayBuffer: pdfInfo.arrayBuffer,
        pageRange: [p.pageNum],
        rotation: p.rotation
      }));

      setProgress(75);
      setStatusText('Generando PDF optimizado...');
      const pdfBlob = await mergePdfFiles(mergeItems);

      setProgress(100);
      setIsDone(true);

      const url = URL.createObjectURL(pdfBlob);
      setDownloadUrl(url);

      setTimeout(() => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `Organizado_${file.name}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        confetti({ particleCount: 90, spread: 65, origin: { y: 0.6 } });
        setIsProcessing(false);
      }, 1000);
    } catch (err) {
      alert('Error al guardar el archivo organizado: ' + err.message);
      setIsProcessing(false);
    }
  };

  return (
    <div>
      {/* Loading Modal Screen */}
      <LoadingOverlay 
        isOpen={isProcessing}
        title="Guardando PDF Organizado"
        subtitle={`Reorganizando ${pages.length} páginas del documento.`}
        progress={progress}
        statusText={statusText}
        isDone={isDone}
      />

      <div className="hero-section">
        <h1 className="hero-title">Organizar Páginas PDF</h1>
        <p className="hero-subtitle">
          Reordena, gira o elimina páginas individuales de tu archivo PDF de forma interactiva.
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
            <Layers size={36} />
          </div>
          <h3 className="dropzone-title">Arrastra tu archivo PDF aquí</h3>
          <p className="dropzone-subtitle">Reordena o elimina las páginas a tu gusto</p>
          <button className="btn-primary" type="button">
            <Upload size={18} />
            <span>Seleccionar PDF</span>
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {file.name} ({pages.length} páginas restantes)
            </h3>
          </div>

          <div className="file-cards-grid">
            {pages.map((p, index) => (
              <div key={p.id} className="file-card-item">
                <div className="file-card-header">
                  <span className="file-card-name">Página origin. {p.pageNum}</span>
                  <span className="file-card-badge">Pos. {index + 1}</span>
                </div>

                <div 
                  className="file-thumbnail"
                  style={{ transform: `rotate(${p.rotation}deg)`, transition: 'transform 0.3s ease' }}
                >
                  {p.thumbnail ? (
                    <img src={p.thumbnail} alt={`Página ${p.pageNum}`} />
                  ) : (
                    <FileText size={48} color="#94A3B8" />
                  )}
                </div>

                <div className="file-card-actions">
                  <div style={{ display: 'flex', gap: '0.2rem' }}>
                    <button className="icon-action-btn" onClick={() => movePage(index, -1)} disabled={index === 0} title="Mover izquierda">
                      <ArrowLeft size={16} />
                    </button>
                    <button className="icon-action-btn" onClick={() => movePage(index, 1)} disabled={index === pages.length - 1} title="Mover derecha">
                      <ArrowRight size={16} />
                    </button>
                    <button className="icon-action-btn" onClick={() => rotatePage(p.id)} title="Rotar 90°">
                      <RotateCw size={16} />
                    </button>
                  </div>

                  <button className="icon-action-btn delete" onClick={() => removePage(p.id)} title="Eliminar página">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="action-bar">
            <button className="btn-secondary" onClick={() => { setFile(null); setPages([]); }}>
              <Trash2 size={18} />
              <span>Cambiar archivo</span>
            </button>

            {downloadUrl ? (
              <a href={downloadUrl} download={`Organizado_${file.name}`} className="btn-primary">
                <CheckCircle size={20} />
                <span>¡PDF Guardado! Descargar</span>
              </a>
            ) : (
              <button className="btn-primary" onClick={handleSaveOrganized} disabled={isProcessing || pages.length === 0}>
                <Layers size={20} />
                <span>Guardar PDF Organizado</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
