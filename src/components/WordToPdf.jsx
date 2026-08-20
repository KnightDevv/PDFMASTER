import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Trash2, 
  CheckCircle,
  Eye,
  Settings2,
  FileCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { parseWordDocument, convertWordDomToPdf } from '../services/wordService';
import LoadingOverlay from './LoadingOverlay';

export default function WordToPdf() {
  const [wordFile, setWordFile] = useState(null);
  const [wordHtml, setWordHtml] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Preparando renderizado...');
  const [isDone, setIsDone] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Options - DEFAULT: 'single_page' (Ajustar todo a 1 sola página)
  const [orientation, setOrientation] = useState('portrait');
  const [fitMode, setFitMode] = useState('single_page'); // 'single_page' | 'fit_width' | 'actual_size'

  const fileInputRef = useRef(null);
  const previewRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;
    setIsParsing(true);
    setWordFile(file);
    setDownloadUrl(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const parsed = await parseWordDocument(arrayBuffer);
      setWordHtml(parsed.html);
    } catch (err) {
      console.error('Error reading Word file:', err);
      alert('Ocurrió un error al leer el archivo Word. Asegúrate de que sea un archivo .docx válido.');
      setWordFile(null);
      setWordHtml('');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleConvertToPdf = async () => {
    if (!previewRef.current || !wordHtml) return;
    setIsConverting(true);
    setIsDone(false);
    setProgress(20);
    setStatusText('Analizando tipografía e imágenes del documento Word...');

    try {
      await new Promise(r => setTimeout(r, 500));

      setProgress(50);
      setStatusText(fitMode === 'single_page' ? 'Ajustando escala para limitar a 1 sola página...' : 'Generando vectorización...');

      const pdfBlob = await convertWordDomToPdf(previewRef.current, {
        orientation,
        fitMode,
      });

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
        const baseName = wordFile.name.replace(/\.[^/.]+$/, '');
        a.download = `${baseName}_Convertido.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        setIsConverting(false);
      }, 1000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Error al convertir el documento Word a PDF: ' + err.message);
      setIsConverting(false);
    }
  };

  return (
    <div>
      {/* Loading Modal Screen */}
      <LoadingOverlay 
        isOpen={isConverting}
        title="Convertiendo Word a PDF"
        subtitle={fitMode === 'single_page' ? `Empaquetando documento "${wordFile?.name}" en 1 sola página.` : `Procesando documento "${wordFile?.name}".`}
        progress={progress}
        statusText={statusText}
        isDone={isDone}
      />

      <div className="hero-section">
        <h1 className="hero-title">Convertir Word a PDF</h1>
        <p className="hero-subtitle">
          Transforma tus documentos .docx de Microsoft Word a PDF manteniendo formato, fuentes e imágenes.
        </p>
      </div>

      {!wordFile ? (
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
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
            style={{ display: 'none' }}
            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
          />
          <div className="dropzone-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-indigo)' }}>
            <FileText size={36} />
          </div>
          <h3 className="dropzone-title">Arrastra tu archivo Word aquí</h3>
          <p className="dropzone-subtitle">Soporta archivos .docx de Microsoft Word con imágenes y tablas</p>
          <button className="btn-primary" type="button" style={{ background: 'var(--gradient-indigo)' }}>
            <Upload size={18} />
            <span>Seleccionar Archivo Word</span>
          </button>
        </div>
      ) : isParsing ? (
        <div style={{ padding: '4rem 0', textAlign: 'center' }}>
          <div className="dropzone-icon" style={{ margin: '0 auto 1.5rem auto', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-indigo)' }}>
            <FileText size={36} />
          </div>
          <h3>Procesando documento Word...</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Leyendo la estructura, párrafos, tablas e imágenes incrustadas.
          </p>
        </div>
      ) : (
        <div>
          {/* Options Header Bar */}
          <div className="options-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              <Settings2 size={18} />
              <span>Opciones de Maquetación:</span>
            </div>

            <div className="option-group">
              <label>Ajuste de página:</label>
              <select 
                className="option-select"
                value={fitMode}
                onChange={(e) => setFitMode(e.target.value)}
              >
                <option value="single_page">Ajustar todo a 1 sola página (Recomendado)</option>
                <option value="fit_width">Ajustar solo ancho (Múltiples páginas)</option>
                <option value="actual_size">Tamaño real (100%)</option>
              </select>
            </div>

            <div className="option-group">
              <label>Orientación:</label>
              <select 
                className="option-select"
                value={orientation}
                onChange={(e) => setOrientation(e.target.value)}
              >
                <option value="portrait">Vertical (Portrait)</option>
                <option value="landscape">Horizontal (Landscape)</option>
              </select>
            </div>
          </div>

          {/* Live Interactive Preview Box */}
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Eye size={18} />
              <span>Vista previa del documento Word:</span>
            </span>

            <span className="file-card-badge">
              {wordFile.name}
            </span>
          </div>

          <div className="excel-preview-wrapper">
            <div 
              ref={previewRef} 
              className="excel-render-container"
              style={{
                maxWidth: orientation === 'landscape' ? '1000px' : '800px',
                padding: '40px',
                fontFamily: 'Georgia, "Times New Roman", serif',
                lineHeight: 1.6,
                color: '#1E293B'
              }}
            >
              <div 
                className="word-html-content"
                dangerouslySetInnerHTML={{ __html: wordHtml }} 
              />
            </div>
          </div>

          <div className="action-bar">
            <button className="btn-secondary" onClick={() => { setWordFile(null); setWordHtml(''); }}>
              <Trash2 size={18} />
              <span>Cambiar archivo</span>
            </button>

            {downloadUrl ? (
              <a href={downloadUrl} download={`${wordFile.name.replace(/\.[^/.]+$/, '')}_Convertido.pdf`} className="btn-primary" style={{ background: 'var(--gradient-indigo)' }}>
                <CheckCircle size={20} />
                <span>¡PDF Listo! Descargar de nuevo</span>
              </a>
            ) : (
              <button 
                className="btn-primary" 
                style={{ background: 'var(--gradient-indigo)' }}
                onClick={handleConvertToPdf}
                disabled={isConverting}
              >
                <FileCheck size={20} />
                <span>Convertir Word a PDF y Descargar</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
