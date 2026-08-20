import React, { useState, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle,
  Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { imagesToPdf } from '../services/pdfService';
import LoadingOverlay from './LoadingOverlay';

export default function ImagesToPdf() {
  const [images, setImages] = useState([]);
  const [orientation, setOrientation] = useState('portrait');
  const [margin, setMargin] = useState(10);
  const [fitMode, setFitMode] = useState('single_page'); // 'single_page' | 'page_per_image'
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Procesando imágenes...');
  const [isDone, setIsDone] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFilesSelect = (files) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    const newItems = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      preview: URL.createObjectURL(file),
      size: (file.size / 1024).toFixed(1) // KB
    }));

    setImages(prev => [...prev, ...newItems]);
    setDownloadUrl(null);
  };

  const removeImage = (id) => {
    setImages(images.filter(img => img.id !== id));
    setDownloadUrl(null);
  };

  const moveImage = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    const list = [...images];
    const temp = list[index];
    list[index] = list[target];
    list[target] = temp;
    setImages(list);
    setDownloadUrl(null);
  };

  const handleConvert = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    setIsDone(false);
    setProgress(25);
    setStatusText('Optimizando imágenes para la maquetación PDF...');

    try {
      await new Promise(r => setTimeout(r, 500));

      const rawFiles = images.map(img => img.file);
      setProgress(60);
      setStatusText(fitMode === 'single_page' ? 'Empaquetando todas las imágenes en 1 sola página...' : 'Creando páginas individuales...');

      const pdfBlob = await imagesToPdf(rawFiles, margin, orientation, fitMode);
      setProgress(90);
      setStatusText('Compilando documento final...');
      await new Promise(r => setTimeout(r, 400));

      setProgress(100);
      setIsDone(true);

      const url = URL.createObjectURL(pdfBlob);
      setDownloadUrl(url);

      setTimeout(() => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `Imagenes_Convertidas.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        confetti({ particleCount: 90, spread: 65, origin: { y: 0.6 } });
        setIsProcessing(false);
      }, 1000);
    } catch (err) {
      alert('Error al convertir imágenes a PDF: ' + err.message);
      setIsProcessing(false);
    }
  };

  return (
    <div>
      {/* Loading Modal Screen */}
      <LoadingOverlay 
        isOpen={isProcessing}
        title="Convertiendo Imágenes a PDF"
        subtitle={fitMode === 'single_page' ? `Empaquetando ${images.length} imágenes en 1 sola página.` : `Procesando ${images.length} imágenes en páginas individuales.`}
        progress={progress}
        statusText={statusText}
        isDone={isDone}
      />

      <div className="hero-section">
        <h1 className="hero-title">Imágenes a PDF</h1>
        <p className="hero-subtitle">
          Convierte imágenes JPG, PNG o WebP en un solo documento PDF limpio y bien estructurado.
        </p>
      </div>

      {images.length === 0 ? (
        <div 
          className={`dropzone-container ${isDragOver ? 'drag-over' : ''}`}
          onDrop={(e) => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files) handleFilesSelect(e.dataTransfer.files); }}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            multiple 
            accept="image/png,image/jpeg,image/webp" 
            style={{ display: 'none' }}
            onChange={(e) => e.target.files && handleFilesSelect(e.target.files)}
          />
          <div className="dropzone-icon">
            <ImageIcon size={36} />
          </div>
          <h3 className="dropzone-title">Arrastra tus imágenes aquí</h3>
          <p className="dropzone-subtitle">Soporta formatos JPG, PNG y WebP</p>
          <button className="btn-primary" type="button">
            <Upload size={18} />
            <span>Seleccionar Imágenes</span>
          </button>
        </div>
      ) : (
        <div>
          <div className="options-bar">
            <div className="option-group">
              <label>Ajuste de página:</label>
              <select className="option-select" value={fitMode} onChange={(e) => setFitMode(e.target.value)}>
                <option value="single_page">Ajustar todas las imágenes a 1 sola página (Recomendado)</option>
                <option value="page_per_image">1 imagen por cada página</option>
              </select>
            </div>

            <div className="option-group">
              <label>Orientación:</label>
              <select className="option-select" value={orientation} onChange={(e) => setOrientation(e.target.value)}>
                <option value="portrait">Vertical (Portrait)</option>
                <option value="landscape">Horizontal (Landscape)</option>
              </select>
            </div>

            <div className="option-group">
              <label>Margen:</label>
              <select className="option-select" value={margin} onChange={(e) => setMargin(Number(e.target.value))}>
                <option value={0}>Sin margen (0mm)</option>
                <option value={10}>Margen normal (10mm)</option>
                <option value={20}>Margen grande (20mm)</option>
              </select>
            </div>

            <button className="btn-secondary" onClick={() => fileInputRef.current?.click()} style={{ marginLeft: 'auto' }}>
              <Plus size={16} />
              <span>Añadir imágenes</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              multiple 
              accept="image/png,image/jpeg,image/webp" 
              style={{ display: 'none' }}
              onChange={(e) => e.target.files && handleFilesSelect(e.target.files)}
            />
          </div>

          <div className="file-cards-grid">
            {images.map((img, index) => (
              <div key={img.id} className="file-card-item">
                <div className="file-card-header">
                  <span className="file-card-name" title={img.name}>{img.name}</span>
                  <span className="file-card-badge">{img.size} KB</span>
                </div>

                <div className="file-thumbnail">
                  <img src={img.preview} alt={img.name} />
                </div>

                <div className="file-card-actions">
                  <div style={{ display: 'flex', gap: '0.2rem' }}>
                    <button className="icon-action-btn" onClick={() => moveImage(index, -1)} disabled={index === 0}>
                      <ArrowLeft size={16} />
                    </button>
                    <button className="icon-action-btn" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1}>
                      <ArrowRight size={16} />
                    </button>
                  </div>

                  <button className="icon-action-btn delete" onClick={() => removeImage(img.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="action-bar">
            <button className="btn-secondary" onClick={() => setImages([])}>
              <Trash2 size={18} />
              <span>Vaciar lista</span>
            </button>

            {downloadUrl ? (
              <a href={downloadUrl} download="Imagenes_Convertidas.pdf" className="btn-primary">
                <CheckCircle size={20} />
                <span>¡PDF Listo! Descargar de nuevo</span>
              </a>
            ) : (
              <button className="btn-primary" onClick={handleConvert} disabled={isProcessing}>
                <ImageIcon size={20} />
                <span>Convertir {images.length} imágenes a PDF</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
