import React, { useState, useRef } from 'react';
import { 
  FileStack, 
  Upload, 
  Trash2, 
  RotateCw, 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  CheckCircle,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getPdfInfo, renderPdfPageThumbnail, mergePdfFiles } from '../services/pdfService';
import LoadingOverlay from './LoadingOverlay';

export default function MergePdf() {
  const [items, setItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Iniciando procesamiento...');
  const [isDone, setIsDone] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFilesSelect = async (files) => {
    const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (pdfFiles.length === 0) return;

    const newItems = [];
    for (const file of pdfFiles) {
      try {
        const { pageCount, arrayBuffer } = await getPdfInfo(file);
        const thumbnail = await renderPdfPageThumbnail(arrayBuffer, 1, 0.4);
        
        newItems.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          size: (file.size / 1024 / 1024).toFixed(2), // MB
          pageCount,
          arrayBuffer,
          thumbnail,
          rotation: 0
        });
      } catch (err) {
        console.error('Error processing PDF file:', err);
      }
    }

    setItems(prev => [...prev, ...newItems]);
    setDownloadUrl(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
    setDownloadUrl(null);
  };

  const moveItem = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    setItems(newItems);
    setDownloadUrl(null);
  };

  const rotateItem = (id) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, rotation: (item.rotation + 90) % 360 };
      }
      return item;
    }));
    setDownloadUrl(null);
  };

  const handleMerge = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);
    setIsDone(false);
    setProgress(15);
    setStatusText('Analizando páginas y estructura...');

    try {
      // Artificial delay for smooth UX loading visual feedback
      await new Promise(r => setTimeout(r, 600));

      setStatusText('Uniendo documentos PDF...');
      const mergedBlob = await mergePdfFiles(items, (prog) => {
        setProgress(Math.max(20, prog));
      });

      setStatusText('Finalizando documento...');
      setProgress(95);
      await new Promise(r => setTimeout(r, 500));

      setProgress(100);
      setIsDone(true);

      const url = URL.createObjectURL(mergedBlob);
      setDownloadUrl(url);

      // Trigger download after brief completion animation
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `Unido_${items.length}_archivos.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        setIsProcessing(false);
      }, 1000);
    } catch (err) {
      alert('Ocurrió un error al unir los archivos PDF: ' + err.message);
      setIsProcessing(false);
    }
  };

  const totalPages = items.reduce((acc, curr) => acc + curr.pageCount, 0);

  return (
    <div>
      {/* Loading Modal Screen */}
      <LoadingOverlay 
        isOpen={isProcessing}
        title="Uniendo Documentos PDF"
        subtitle={`Combinando ${items.length} archivos (${totalPages} páginas) en un solo documento.`}
        progress={progress}
        statusText={statusText}
        isDone={isDone}
      />

      <div className="hero-section">
        <h1 className="hero-title">Unir Archivos PDF</h1>
        <p className="hero-subtitle">
          Combina múltiples documentos PDF en un solo archivo ordenado de alta calidad.
        </p>
      </div>

      {items.length === 0 ? (
        <div 
          className={`dropzone-container ${isDragOver ? 'drag-over' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            multiple 
            accept=".pdf,application/pdf" 
            style={{ display: 'none' }}
            onChange={(e) => handleFilesSelect(e.target.files)}
          />
          <div className="dropzone-icon">
            <Upload size={36} />
          </div>
          <h3 className="dropzone-title">Arrastra tus archivos PDF aquí</h3>
          <p className="dropzone-subtitle">o haz clic para explorar en tu equipo (ej. 16 archivos PDF)</p>
          <button className="btn-primary" type="button">
            <Upload size={18} />
            <span>Seleccionar Archivos PDF</span>
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                {items.length} {items.length === 1 ? 'archivo' : 'archivos'} seleccionados
              </span>
              <span className="file-card-badge">
                {totalPages} {totalPages === 1 ? 'páginas en total' : 'páginas en total'}
              </span>
            </div>

            <button 
              className="btn-secondary" 
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus size={18} />
              <span>Añadir más archivos</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              multiple 
              accept=".pdf,application/pdf" 
              style={{ display: 'none' }}
              onChange={(e) => handleFilesSelect(e.target.files)}
            />
          </div>

          <div className="file-cards-grid">
            {items.map((item, index) => (
              <div key={item.id} className="file-card-item">
                <div className="file-card-header">
                  <span className="file-card-name" title={item.name}>{item.name}</span>
                  <span className="file-card-badge">{item.pageCount} pág</span>
                </div>

                <div 
                  className="file-thumbnail"
                  style={{ transform: `rotate(${item.rotation}deg)`, transition: 'transform 0.3s ease' }}
                >
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.name} />
                  ) : (
                    <FileText size={48} color="#94A3B8" />
                  )}
                </div>

                <div className="file-card-actions">
                  <div style={{ display: 'flex', gap: '0.2rem' }}>
                    <button 
                      className="icon-action-btn" 
                      onClick={() => moveItem(index, -1)}
                      disabled={index === 0}
                      title="Mover a la izquierda"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <button 
                      className="icon-action-btn" 
                      onClick={() => moveItem(index, 1)}
                      disabled={index === items.length - 1}
                      title="Mover a la derecha"
                    >
                      <ArrowRight size={16} />
                    </button>
                    <button 
                      className="icon-action-btn" 
                      onClick={() => rotateItem(item.id)}
                      title="Rotar 90°"
                    >
                      <RotateCw size={16} />
                    </button>
                  </div>

                  <button 
                    className="icon-action-btn delete" 
                    onClick={() => removeItem(item.id)}
                    title="Eliminar de la lista"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="action-bar">
            <button className="btn-secondary" onClick={() => setItems([])}>
              <Trash2 size={18} />
              <span>Vaciar lista</span>
            </button>

            {downloadUrl ? (
              <a href={downloadUrl} download={`Unido_${items.length}_archivos.pdf`} className="btn-primary">
                <CheckCircle size={20} />
                <span>¡PDF Listo! Descargar de nuevo</span>
              </a>
            ) : (
              <button 
                className="btn-primary" 
                onClick={handleMerge}
                disabled={isProcessing}
              >
                <FileStack size={20} />
                <span>Unir {items.length} Archivos PDF</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
