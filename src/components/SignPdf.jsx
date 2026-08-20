import React, { useState, useRef, useEffect } from 'react';
import { 
  PenTool, 
  Upload, 
  Trash2, 
  CheckCircle,
  FileText,
  RotateCw,
  Type,
  Image as ImageIcon,
  Eye,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PDFDocument, degrees } from 'pdf-lib';
import { getPdfInfo, renderPdfPageThumbnail } from '../services/pdfService';
import LoadingOverlay from './LoadingOverlay';

export default function SignPdf({ lang = 'es', t }) {
  const [file, setFile] = useState(null);
  const [info, setInfo] = useState(null);
  const [activePage, setActivePage] = useState(1);
  const [pageThumbnail, setPageThumbnail] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Signature creation mode: 'draw' | 'type' | 'upload'
  const [sigMode, setSigMode] = useState('draw');
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
  const [typedName, setTypedName] = useState('Mi Firma');
  const [drawColor, setDrawColor] = useState('#000000');

  // Signature placement on preview
  const [sigPos, setSigPos] = useState({ x: 120, y: 150, width: 160, height: 80, rotation: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Estampando firma digital...');
  const [isDone, setIsDone] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);

  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);

  // Draw Signature Canvas Handlers
  useEffect(() => {
    if (sigMode === 'draw' && canvasRef.current) {
      const cvs = canvasRef.current;
      const ctx = cvs.getContext('2d');
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = drawColor;
    }
  }, [sigMode, drawColor]);

  const startDrawing = (e) => {
    isDrawing.current = true;
    const cvs = canvasRef.current;
    const ctx = cvs.getContext('2d');
    const rect = cvs.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    const cvs = canvasRef.current;
    const ctx = cvs.getContext('2d');
    const rect = cvs.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing.current) {
      isDrawing.current = false;
      if (canvasRef.current) {
        setSignatureDataUrl(canvasRef.current.toDataURL('image/png'));
      }
    }
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      const cvs = canvasRef.current;
      const ctx = cvs.getContext('2d');
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      setSignatureDataUrl(null);
    }
  };

  // Generate typed signature canvas
  useEffect(() => {
    if (sigMode === 'type' && typedName) {
      const cvs = document.createElement('canvas');
      cvs.width = 400;
      cvs.height = 160;
      const ctx = cvs.getContext('2d');
      ctx.font = '42px "Brush Script MT", cursive, sans-serif';
      ctx.fillStyle = drawColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedName, 200, 80);
      setSignatureDataUrl(cvs.toDataURL('image/png'));
    }
  }, [sigMode, typedName, drawColor]);

  const handleImageUpload = (e) => {
    const imgFile = e.target.files?.[0];
    if (!imgFile) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setSignatureDataUrl(evt.target.result);
    };
    reader.readAsDataURL(imgFile);
  };

  const handleFileSelect = async (f) => {
    if (!f) return;
    setFile(f);
    setDownloadUrl(null);
    try {
      const pdfInfo = await getPdfInfo(f);
      setInfo(pdfInfo);
      setActivePage(1);

      const thumb = await renderPdfPageThumbnail(pdfInfo.arrayBuffer, 1, 0.8);
      setPageThumbnail(thumb);
    } catch (err) {
      alert('Error al leer el archivo PDF: ' + err.message);
      setFile(null);
    }
  };

  // Render thumbnail when activePage changes
  useEffect(() => {
    if (info && activePage) {
      renderPdfPageThumbnail(info.arrayBuffer, activePage, 0.8).then(setPageThumbnail);
    }
  }, [activePage, info]);

  // Handle Dragging signature overlay on preview
  const handleMouseDownSig = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - sigPos.x, y: e.clientY - sigPos.y });
  };

  const handleMouseMoveSig = (e) => {
    if (!isDragging) return;
    setSigPos(prev => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    }));
  };

  const handleMouseUpSig = () => setIsDragging(false);

  const handleSignPdf = async () => {
    if (!file || !signatureDataUrl) {
      alert('Por favor dibuja, escribe o sube una firma primero.');
      return;
    }

    setIsProcessing(true);
    setIsDone(false);
    setProgress(25);
    setStatusText('Incrustando firma digital en la página...');

    try {
      await new Promise(r => setTimeout(r, 500));

      const pdfDoc = await PDFDocument.load(info.arrayBuffer);
      const page = pdfDoc.getPage(activePage - 1);
      const { width: pWidth, height: pHeight } = page.getSize();

      // Convert dataUrl to bytes
      const base64Data = signatureDataUrl.split(',')[1];
      const binaryStr = atob(base64Data);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const embeddedSig = await pdfDoc.embedPng(bytes);

      setProgress(65);
      setStatusText('Calculando coordenadas vectoriales de la firma...');

      // Map preview coordinates to PDF page points
      // Preview container is approx 480px width
      const previewWidth = 480;
      const previewHeight = 640;

      const scaleX = pWidth / previewWidth;
      const scaleY = pHeight / previewHeight;

      const drawW = sigPos.width * scaleX;
      const drawH = sigPos.height * scaleY;

      // PDF y-axis is inverted (bottom-left 0,0)
      const x = Math.max(0, sigPos.x * scaleX);
      const y = Math.max(0, pHeight - (sigPos.y * scaleY) - drawH);

      page.drawImage(embeddedSig, {
        x,
        y,
        width: drawW,
        height: drawH,
        rotate: degrees(sigPos.rotation)
      });

      setProgress(90);
      setStatusText('Generando PDF firmado en alta resolución...');
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
        a.download = `Firmado_${file.name}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setIsProcessing(false);
      }, 1000);
    } catch (err) {
      console.error('Error signing PDF:', err);
      alert('Error al firmar el PDF: ' + err.message);
      setIsProcessing(false);
    }
  };

  const tSign = t('tools.sign');

  return (
    <div onMouseMove={handleMouseMoveSig} onMouseUp={handleMouseUpSig}>
      <LoadingOverlay 
        isOpen={isProcessing}
        title={tSign.title}
        subtitle={`Estampando firma en la página ${activePage} de "${file?.name}".`}
        progress={progress}
        statusText={statusText}
        isDone={isDone}
      />

      <div className="hero-section">
        <h1 className="hero-title">{tSign.title}</h1>
        <p className="hero-subtitle">{tSign.sub}</p>
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
            <PenTool size={36} />
          </div>
          <h3 className="dropzone-title">{t('dropzone.dragPdf')}</h3>
          <p className="dropzone-subtitle">Firma digitalmente con ratón, texto o imagen</p>
          <button className="btn-primary" type="button">
            <Upload size={18} />
            <span>{t('dropzone.browsePdf')}</span>
          </button>
        </div>
      ) : (
        <div>
          {/* Signature Builder Toolbar */}
          <div className="options-bar" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <button 
                className={`sheet-tab-btn ${sigMode === 'draw' ? 'active' : ''}`}
                onClick={() => setSigMode('draw')}
              >
                <PenTool size={16} />
                <span style={{ marginLeft: '0.4rem' }}>{tSign.drawTab}</span>
              </button>

              <button 
                className={`sheet-tab-btn ${sigMode === 'type' ? 'active' : ''}`}
                onClick={() => setSigMode('type')}
              >
                <Type size={16} />
                <span style={{ marginLeft: '0.4rem' }}>{tSign.typeTab}</span>
              </button>

              <button 
                className={`sheet-tab-btn ${sigMode === 'upload' ? 'active' : ''}`}
                onClick={() => setSigMode('upload')}
              >
                <ImageIcon size={16} />
                <span style={{ marginLeft: '0.4rem' }}>{tSign.uploadTab}</span>
              </button>
            </div>

            {/* Signature Input Controls */}
            {sigMode === 'draw' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Color:</label>
                  {['#000000', '#1E40AF', '#B91C1C'].map(c => (
                    <button 
                      key={c} 
                      onClick={() => setDrawColor(c)}
                      style={{
                        width: '24px', height: '24px', borderRadius: '50%', background: c,
                        border: drawColor === c ? '2px solid var(--accent-rose)' : 'none', cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>

                <div style={{ border: '1px dashed var(--border-color)', borderRadius: '8px', background: '#FFFFFF', padding: '4px' }}>
                  <canvas 
                    ref={canvasRef} 
                    width={320} 
                    height={100}
                    style={{ display: 'block', cursor: 'crosshair', background: '#FFFFFF' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>

                <button className="btn-secondary" onClick={clearCanvas}>
                  <Trash2 size={16} />
                  <span>{tSign.clearSign}</span>
                </button>
              </div>
            )}

            {sigMode === 'type' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Texto:</label>
                <input 
                  type="text" 
                  className="option-select"
                  style={{ width: '250px', fontSize: '1.1rem' }}
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                />
              </div>
            )}

            {sigMode === 'upload' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label className="btn-secondary" style={{ cursor: 'pointer' }}>
                  <Upload size={16} />
                  <span>Seleccionar imagen de firma (.png/.jpg)</span>
                  <input type="file" accept="image/png,image/jpeg" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>
              </div>
            )}
          </div>

          {/* Interactive PDF Page Preview with Signature Drag & Resize */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                Página {activePage} de {info?.pageCount}
              </span>

              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button 
                  className="btn-secondary" 
                  disabled={activePage <= 1}
                  onClick={() => setActivePage(prev => prev - 1)}
                >
                  Anterior
                </button>
                <button 
                  className="btn-secondary" 
                  disabled={activePage >= (info?.pageCount || 1)}
                  onClick={() => setActivePage(prev => prev + 1)}
                >
                  Siguiente
                </button>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--accent-rose)', fontWeight: 600, marginBottom: '0.75rem' }}>
              {tSign.dragHint}
            </p>

            <div 
              style={{
                position: 'relative',
                width: '480px',
                height: '640px',
                background: '#FFFFFF',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden',
                border: '1px solid var(--border-color)',
                userSelect: 'none'
              }}
            >
              {pageThumbnail && (
                <img 
                  src={pageThumbnail} 
                  alt={`Página ${activePage}`} 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              )}

              {/* Signature Overlay Element */}
              {signatureDataUrl && (
                <div
                  onMouseDown={handleMouseDownSig}
                  style={{
                    position: 'absolute',
                    left: `${sigPos.x}px`,
                    top: `${sigPos.y}px`,
                    width: `${sigPos.width}px`,
                    height: `${sigPos.height}px`,
                    transform: `rotate(${sigPos.rotation}deg)`,
                    border: '2px dashed var(--accent-rose)',
                    borderRadius: '4px',
                    cursor: 'move',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,255,255,0.85)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                >
                  <img 
                    src={signatureDataUrl} 
                    alt="Firma" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
                  />

                  {/* Rotate Button */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSigPos(p => ({ ...p, rotation: (p.rotation + 90) % 360 })); }}
                    style={{
                      position: 'absolute', top: '-12px', right: '-12px',
                      background: 'var(--accent-rose)', color: '#fff', border: 'none',
                      borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    title="Rotar firma"
                  >
                    <RotateCw size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="action-bar">
            <button className="btn-secondary" onClick={() => { setFile(null); setInfo(null); }}>
              <Trash2 size={18} />
              <span>{t('actions.changeFile')}</span>
            </button>

            {downloadUrl ? (
              <a href={downloadUrl} download={`Firmado_${file.name}`} className="btn-primary">
                <CheckCircle size={20} />
                <span>{t('actions.readyDownload')}</span>
              </a>
            ) : (
              <button 
                className="btn-primary" 
                onClick={handleSignPdf}
                disabled={isProcessing || !signatureDataUrl}
              >
                <PenTool size={20} />
                <span>{tSign.btn}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
