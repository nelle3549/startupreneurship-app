import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";

const GRID_SIZE = 4; // 4x4 puzzle
const PIECE_COUNT = GRID_SIZE * GRID_SIZE; // 16 pieces

// Individual puzzle piece URLs in grid order (r1c1, r1c2, ..., r4c4)
const PIECE_URLS = [
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6988a35c638b51ac0d5d3224/1fbf667fa_ProblemSolving_r1_c1_processed_by_imagy.png",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6988a35c638b51ac0d5d3224/e8fbfb92f_ProblemSolving_r1_c2_processed_by_imagy.png",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6988a35c638b51ac0d5d3224/0771b9b3d_ProblemSolving_r1_c3_processed_by_imagy.png",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6988a35c638b51ac0d5d3224/5d4f86fb9_ProblemSolving_r1_c4_processed_by_imagy.png",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6988a35c638b51ac0d5d3224/faaa92d88_ProblemSolving_r2_c1_processed_by_imagy.png",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6988a35c638b51ac0d5d3224/1d34940bb_ProblemSolving_r2_c2_processed_by_imagy.png",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6988a35c638b51ac0d5d3224/97132873f_ProblemSolving_r2_c3_processed_by_imagy.png",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6988a35c638b51ac0d5d3224/529b63fe2_ProblemSolving_r2_c4_processed_by_imagy.png",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6988a35c638b51ac0d5d3224/d9faa73a5_ProblemSolving_r3_c1_processed_by_imagy.png",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6988a35c638b51ac0d5d3224/d79f909db_ProblemSolving_r3_c2_processed_by_imagy.png",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6988a35c638b51ac0d5d3224/67c6488ff_ProblemSolving_r3_c3_processed_by_imagy.png",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6988a35c638b51ac0d5d3224/9cedaec22_ProblemSolving_r3_c4_processed_by_imagy.png",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6988a35c638b51ac0d5d3224/e3772e1cb_ProblemSolving_r4_c1_processed_by_imagy.png",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6988a35c638b51ac0d5d3224/ce61dbb5c_ProblemSolving_r4_c2_processed_by_imagy.png",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6988a35c638b51ac0d5d3224/776982462_ProblemSolving_r4_c3_processed_by_imagy.png",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6988a35c638b51ac0d5d3224/4a12c8fb9_ProblemSolving_r4_c4_processed_by_imagy.png",
];

export default function JigsawPuzzleActivity({ onComplete }) {
  const containerRef = useRef(null);
  const [slotToPiece, setSlotToPiece] = useState({}); // Maps slotId to pieceId
  const [puzzleComplete, setPuzzleComplete] = useState(false);
  const [draggedPiece, setDraggedPiece] = useState(null);
  const [dragSourceSlot, setDragSourceSlot] = useState(null);

  // Initialize puzzle pieces randomly placed on board
  useEffect(() => {
    // Create random mapping of all pieces on the board
    const randomMap = {};
    const slotIndices = Array.from({ length: PIECE_COUNT }, (_, i) => i);
    const pieceIndices = Array.from({ length: PIECE_COUNT }, (_, i) => i);
    
    // Shuffle pieces and assign to slots
    for (let i = pieceIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pieceIndices[i], pieceIndices[j]] = [pieceIndices[j], pieceIndices[i]];
    }
    
    slotIndices.forEach((slot, idx) => {
      randomMap[slot] = pieceIndices[idx];
    });
    
    setSlotToPiece(randomMap);
  }, []);

  // Check if puzzle is complete (all pieces in correct positions)
  useEffect(() => {
    const isComplete = Array.from({ length: PIECE_COUNT }, (_, i) => slotToPiece[i] === i).every(Boolean);
    if (isComplete && Object.keys(slotToPiece).length === PIECE_COUNT) {
      setPuzzleComplete(true);
      setTimeout(() => onComplete(), 1500);
    }
  }, [slotToPiece, onComplete]);

  const handlePointerDown = (e, pieceId) => {
    if (puzzleComplete) return;
    e.preventDefault();
    const slot = Object.entries(slotToPiece).find(([_, id]) => id === pieceId)?.[0];
    setDraggedPiece(pieceId);
    setDragSourceSlot(parseInt(slot));
  };

  const handlePointerUp = (e) => {
    if (draggedPiece === null) return;
    e.preventDefault();

    // Use elementFromPoint to find the slot under the pointer
    const element = document.elementFromPoint(e.clientX, e.clientY);
    const slot = element?.closest('[data-slot-id]');
    
    if (slot) {
      const slotId = parseInt(slot.getAttribute('data-slot-id'));
      
      setSlotToPiece(prev => {
        const newMap = { ...prev };
        const occupyingPieceId = newMap[slotId];

        if (occupyingPieceId !== undefined && dragSourceSlot !== undefined) {
          // Swap: place occupying piece in source slot
          newMap[dragSourceSlot] = occupyingPieceId;
        }

        // Place the dragged piece in the target slot
        newMap[slotId] = draggedPiece;
        return newMap;
      });
    }

    setDraggedPiece(null);
    setDragSourceSlot(null);
  };

  return (
    <div className="flex flex-col h-full gap-3" onPointerUp={handlePointerUp}>
      {/* Instructions */}
      <div className="bg-blue-50 rounded-2xl p-3 text-center border border-blue-200 flex-shrink-0">
        <p className="text-sm text-gray-700 font-medium">Drag puzzle pieces to the correct position</p>
      </div>

      <div className="flex justify-center flex-1 overflow-hidden">
        {/* Puzzle Board */}
        <div
          ref={containerRef}
          className="relative bg-gray-100 rounded-2xl border-2 border-gray-200 overflow-hidden max-w-2xl w-full"
          style={{ aspectRatio: "1", touchAction: "none" }}
        >
          <div
            className="grid gap-0 w-full h-full"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
            }}
          >
            {Array.from({ length: PIECE_COUNT }, (_, slotId) => {
              const pieceId = slotToPiece[slotId];
              return (
                <div
                  key={`slot-${slotId}`}
                  data-slot-id={slotId}
                  className={`relative overflow-hidden ${!puzzleComplete ? "border border-gray-300 bg-gray-50" : ""}`}
                  style={{ touchAction: "none" }}
                >
                  {pieceId !== undefined && (
                    <img
                      src={PIECE_URLS[pieceId]}
                      alt={`Puzzle piece ${pieceId}`}
                      draggable={false}
                      onPointerDown={(e) => handlePointerDown(e, pieceId)}
                      className={`w-full h-full object-cover select-none ${!puzzleComplete ? "cursor-move" : "cursor-default"}`}
                      style={{ touchAction: "none", userSelect: "none" }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>



      {/* Completion Message */}
      <AnimatePresence>
        {puzzleComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-3 text-center flex-shrink-0"
          >
            <p className="text-lg font-bold text-emerald-700">🎉 Puzzle Complete!</p>
            <p className="text-sm text-emerald-600 mt-1">Great job solving the problem!</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}