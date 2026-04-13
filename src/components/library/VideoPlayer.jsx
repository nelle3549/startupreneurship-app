import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

function extractDriveId(url) {
  // Handle different Google Drive URL formats
  const patterns = [
    /\/file\/d\/([^\/]+)/,
    /id=([^&]+)/,
    /\/d\/([^\/]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default function VideoPlayer({ video, onClose }) {
  const driveId = extractDriveId(video.drive_url);
  const embedUrl = driveId ? `https://drive.google.com/file/d/${driveId}/preview` : null;

  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
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
          className="relative bg-white rounded-xl shadow-2xl w-[95vw] h-[95vh] max-w-5xl flex flex-col z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-900 text-lg truncate pr-4">{video.title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Player */}
          <div className="flex-1 overflow-hidden bg-black">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                className="w-full h-full"
                frameBorder="0"
                allow="autoplay"
                allowFullScreen
                title={video.title}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                <p>Unable to embed this video.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}