import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ImageViewer({ src, alt, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);

  const handleZoomIn = () => setScale(Math.min(scale + 0.5, 3));
  const handleZoomOut = () => setScale(Math.max(scale - 0.5, 1));

  return (
    <>
      <div className="relative group">
        <img 
          src={src} 
          alt={alt} 
          className={`rounded-xl cursor-pointer max-h-[400px] object-contain mx-auto ${className}`}
          onClick={() => setIsOpen(true)}
        />
        <button
          onClick={() => setIsOpen(true)}
          className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Maximize2 className="w-4 h-4 text-gray-700" />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                disabled={scale <= 1}
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                <ZoomOut className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
                disabled={scale >= 3}
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                <ZoomIn className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <motion.img
              src={src}
              alt={alt}
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
              style={{ scale }}
              onClick={(e) => e.stopPropagation()}
              animate={{ scale }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}