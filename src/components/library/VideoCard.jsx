import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Video } from "lucide-react";
import { motion } from "framer-motion";

export default function VideoCard({ video, onPlay, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={() => onPlay(video)}>
        <CardContent className="p-0">
          <div className="relative aspect-video bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
            {video.thumbnail_url ? (
              <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
            ) : (
              <Video className="w-12 h-12 text-blue-600" />
            )}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors">
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                <Play className="w-8 h-8 text-gray-900 ml-1" />
              </div>
            </div>
            {video.grade_level && (
              <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                {video.grade_level}
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-1 truncate">{video.title}</h3>
            {video.description && (
              <p className="text-sm text-gray-500 line-clamp-2">{video.description}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}