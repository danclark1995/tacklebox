import { useState, useEffect, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import EmberLoader from '@/components/ui/EmberLoader'
import { colours, spacing, typography, zIndex } from '@/config/tokens'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

/**
 * BrandGuidePDFViewer — Full-screen PDF booklet viewer.
 *
 * Props:
 *   clientId  – client ID to fetch the brand guide for
 *   onClose   – close handler
 */
export default function BrandGuidePDFViewer({ clientId, onClose }) {
  const [pdfData, setPdfData] = useState(null)
  const [numPages, setNumPages] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pageWidth, setPageWidth] = useState(600)

  // Calculate page width based on viewport
  useEffect(() => {
    const updateWidth = () => {
      const maxW = Math.min(window.innerWidth - 160, 800)
      setPageWidth(Math.max(320, maxW))
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Fetch PDF from API
  useEffect(() => {
    async function fetchPDF() {
      try {
        const res = await fetch(apiEndpoint(`/brand-profiles/${clientId}/guide-pdf`), {
          headers: { ...getAuthHeaders() },
        })
        if (!res.ok) {
          setError(res.status === 404 ? 'No brand guide uploaded yet' : 'Failed to load brand guide')
          setLoading(false)
          return
        }
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        setPdfData(url)
      } catch {
        setError('Failed to load brand guide')
      } finally {
        setLoading(false)
      }
    }
    fetchPDF()
    return () => {
      if (pdfData) URL.revokeObjectURL(pdfData)
    }
  }, [clientId])

  const goNext = useCallback(() => {
    setCurrentPage(p => Math.min(p + 1, numPages || 1))
  }, [numPages])

  const goPrev = useCallback(() => {
    setCurrentPage(p => Math.max(p - 1, 1))
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goNext, goPrev, onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'unset' }
  }, [])

  const onDocumentLoadSuccess = ({ numPages: total }) => {
    setNumPages(total)
  }

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: zIndex.modal + 10,
  }

  const closeButtonStyle = {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'none',
    border: 'none',
    color: colours.neutral[500],
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s',
    zIndex: 10,
  }

  const navButtonStyle = (disabled) => ({
    background: 'none',
    border: 'none',
    color: disabled ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)',
    cursor: disabled ? 'default' : 'pointer',
    padding: '12px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s, background-color 0.2s',
    flexShrink: 0,
  })

  const pageContainerStyle = {
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5)',
    backgroundColor: '#ffffff',
    maxHeight: 'calc(100vh - 140px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      {/* Close button */}
      <button
        style={closeButtonStyle}
        onClick={onClose}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#fff' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = colours.neutral[500] }}
      >
        <X size={24} />
      </button>

      {/* Loading state */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing[4] }}>
          <EmberLoader size="lg" />
          <span style={{ color: colours.neutral[600], fontSize: typography.fontSize.sm }}>
            Loading brand guide...
          </span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{ textAlign: 'center', color: colours.neutral[600] }}>
          <div style={{ fontSize: typography.fontSize.lg, marginBottom: spacing[2] }}>{error}</div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid #333',
              color: colours.neutral[700],
              padding: '8px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: typography.fontSize.sm,
            }}
          >
            Close
          </button>
        </div>
      )}

      {/* PDF viewer */}
      {pdfData && !error && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4], maxWidth: '100%' }}>
            {/* Left arrow */}
            <button
              style={navButtonStyle(currentPage <= 1)}
              onClick={goPrev}
              disabled={currentPage <= 1}
              onMouseEnter={(e) => { if (currentPage > 1) e.currentTarget.style.color = 'rgba(255,255,255,0.9)' }}
              onMouseLeave={(e) => { if (currentPage > 1) e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
            >
              <ChevronLeft size={32} />
            </button>

            {/* Page */}
            <div style={pageContainerStyle}>
              <Document
                file={pdfData}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div style={{ width: pageWidth, height: pageWidth * 1.4, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
                    <EmberLoader size="md" />
                  </div>
                }
              >
                <Page
                  pageNumber={currentPage}
                  width={pageWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
            </div>

            {/* Right arrow */}
            <button
              style={navButtonStyle(currentPage >= numPages)}
              onClick={goNext}
              disabled={currentPage >= numPages}
              onMouseEnter={(e) => { if (currentPage < numPages) e.currentTarget.style.color = 'rgba(255,255,255,0.9)' }}
              onMouseLeave={(e) => { if (currentPage < numPages) e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
            >
              <ChevronRight size={32} />
            </button>
          </div>

          {/* Page indicator */}
          {numPages && (
            <div style={{ marginTop: spacing[4], display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing[3] }}>
              <span style={{ fontSize: typography.fontSize.sm, color: colours.neutral[600] }}>
                Page {currentPage} of {numPages}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {Array.from({ length: numPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    style={{
                      width: currentPage === i + 1 ? '20px' : '8px',
                      height: '8px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: currentPage === i + 1 ? '#fff' : 'rgba(255,255,255,0.25)',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'all 0.2s',
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
