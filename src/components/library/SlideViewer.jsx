import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Maximize, ChevronLeft, ChevronRight } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Configure PDF.js worker via CDN
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function SlideViewer({ slide, onClose }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageWidth, setPageWidth] = useState(() => Math.min(window.innerWidth * 0.85, 1200));

  const handleFullscreen = () => {
    const container = document.getElementById("pdf-viewer-container");
    if (container) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
      }
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error) => {
    setError(error.message);
    setLoading(false);
  };

  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  React.useEffect(() => {
    const onResize = () => setPageWidth(Math.min(window.innerWidth * 0.85, 1200));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative bg-white rounded-xl shadow-2xl w-[95vw] h-[95vh] max-w-7xl flex flex-col z-10"
          id="pdf-viewer-container"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-900 text-lg truncate pr-4">{slide.title}</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleFullscreen} className="gap-2">
                <Maximize className="w-4 h-4" />
                Fullscreen
              </Button>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 overflow-auto relative bg-gray-100 flex items-center justify-center">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-gray-600">Loading PDF...</div>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-red-600">Error loading PDF: {error}</div>
              </div>
            )}

            <Document
              file={slide.file_url}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading=""
              error=""
            >
              <Page
                pageNumber={currentPage}
                width={pageWidth}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>
            
            {/* Page Navigation */}
            {numPages && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <span className="text-sm font-medium min-w-[80px] text-center">
                  Page {currentPage} of {numPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === numPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}