import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Maximize2
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

export default function PdfViewerModal({ isOpen, onClose, pdfBlobUrl, pdfArrayBuffer, title = "Visor HD", t }) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [scale, setScale] = useState(1.2);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isOpen || (!pdfBlobUrl && !pdfArrayBuffer)) return;

    const loadDoc = async () => {
      try {
        let loadingTask;
        if (pdfArrayBuffer) {
          loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfArrayBuffer) });
        } else if (pdfBlobUrl) {
          loadingTask = pdfjsLib.getDocument(pdfBlobUrl);
        }
        const doc = await loadingTask.promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
      } catch (err) {
        console.error('Error loading PDF in viewer:', err);
      }
    };

    loadDoc();
  }, [isOpen, pdfBlobUrl, pdfArrayBuffer]);

  // Render current page onto canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let isMounted = true;
    pdfDoc.getPage(currentPage).then(page => {
      if (!isMounted || !canvasRef.current) return;

      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      page.render({ canvasContext: ctx, viewport });
    });

    return () => { isMounted = false; };
  }, [pdfDoc, currentPage, scale]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(9, 13, 22, 0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.5rem',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-color)',
        color: 'var(--text-primary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700, fontSize: '1.1rem' }}>
          <Maximize2 size={20} color="var(--accent-rose)" />
          <span>{title}</span>
        </div>

        {/* Controls Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Zoom */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'var(--bg-hover)', borderRadius: '8px', padding: '0.2rem 0.5rem' }}>
            <button className="icon-action-btn" onClick={() => setScale(s => Math.max(0.6, s - 0.2))} title={t('actions.zoomOut')}>
              <ZoomOut size={16} />
            </button>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, minWidth: '45px', textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
            <button className="icon-action-btn" onClick={() => setScale(s => Math.min(3.0, s + 0.2))} title={t('actions.zoomIn')}>
              <ZoomIn size={16} />
            </button>
          </div>

          {/* Page Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
            <button className="icon-action-btn" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)} title={t('actions.prevPage')}>
              <ChevronLeft size={18} />
            </button>
            <span>{currentPage} / {numPages}</span>
            <button className="icon-action-btn" disabled={currentPage >= numPages} onClick={() => setCurrentPage(p => p + 1)} title={t('actions.nextPage')}>
              <ChevronRight size={18} />
            </button>
          </div>

          {pdfBlobUrl && (
            <a href={pdfBlobUrl} download="Documento_HD.pdf" className="btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
              <Download size={16} />
              <span>Descargar</span>
            </a>
          )}

          <button className="icon-action-btn delete" onClick={onClose} title={t('actions.closeViewer')}>
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Canvas Scroll View */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <canvas 
          ref={canvasRef} 
          style={{
            background: '#FFFFFF',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            borderRadius: '4px',
            maxWidth: '100%'
          }}
        />
      </div>
    </div>
  );
}
