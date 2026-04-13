import React, { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const ACTIVITY_DATA = {
  objects: [
    { id: "fruits", label: "Fruits & Groceries", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6988a35c638b51ac0d5d3224/29b240340_fruits.png" },
    { id: "bread", label: "Bread", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6988a35c638b51ac0d5d3224/ece4847d3_bread.png" },
    { id: "coffee", label: "Coffee", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6988a35c638b51ac0d5d3224/f70d92c45_coffee.png" },
    { id: "sushi", label: "Sushi", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6988a35c638b51ac0d5d3224/3d702e372_sushi.png" }
  ],
  businesses: [
    { id: "mart", label: "Mart", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6988a35c638b51ac0d5d3224/615904fcd_mart.png" },
    { id: "bakery", label: "Bakery", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6988a35c638b51ac0d5d3224/f5c9a9f1d_bakery.png" },
    { id: "coffee_shop", label: "Coffee Shop", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6988a35c638b51ac0d5d3224/73f419612_coffee_shop.png" },
    { id: "restaurant", label: "Restaurant", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6988a35c638b51ac0d5d3224/e26f0f581_restaurant.png" }
  ],
  correctMatches: {
    fruits: "mart",
    bread: "bakery",
    coffee: "coffee_shop",
    sushi: "restaurant"
  }
};

export default function MatchObjectsToBusinessesActivity({ onComplete }) {
  const [selectedObject, setSelectedObject] = useState(null);
  const [connections, setConnections] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [shuffledBusinesses, setShuffledBusinesses] = useState([]);
  const svgRef = useRef(null);
  const objectRefsMap = useRef({});
  const businessRefsMap = useRef({});

  // Shuffle businesses on mount
  useEffect(() => {
    const shuffled = [...ACTIVITY_DATA.businesses].sort(() => Math.random() - 0.5);
    setShuffledBusinesses(shuffled);
  }, []);

  const isComplete = useMemo(() => {
    return Object.keys(ACTIVITY_DATA.correctMatches).every(
      obj => connections[obj] === ACTIVITY_DATA.correctMatches[obj]
    );
  }, [connections]);

  // Auto-complete when all matched
  const completedRef = React.useRef(false);
  useEffect(() => {
    if (isComplete && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  }, [isComplete]);

  // Draw lines connecting objects to businesses
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    svg.innerHTML = "";

    Object.entries(connections).forEach(([objectId, businessId]) => {
      const objRef = objectRefsMap.current[objectId];
      const bizRef = businessRefsMap.current[businessId];

      if (!objRef || !bizRef) return;

      const objRect = objRef.getBoundingClientRect();
      const bizRect = bizRef.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();

      const x1 = objRect.left - svgRect.left + objRect.width / 2;
      const y1 = objRect.top - svgRect.top + objRect.height / 2;
      const x2 = bizRect.left - svgRect.left + bizRect.width / 2;
      const y2 = bizRect.top - svgRect.top + bizRect.height / 2;

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
      line.setAttribute("stroke", "#10b981");
      line.setAttribute("stroke-width", "3");
      line.setAttribute("stroke-linecap", "round");

      svg.appendChild(line);
    });
  }, [connections]);

  const handleObjectClick = (objectId) => {
    if (connections[objectId]) return;
    setSelectedObject(selectedObject === objectId ? null : objectId);
    setFeedback(null);
  };

  const handleBusinessClick = (businessId) => {
    if (!selectedObject) return;

    const isCorrect = ACTIVITY_DATA.correctMatches[selectedObject] === businessId;

    if (isCorrect) {
      setConnections(prev => ({
        ...prev,
        [selectedObject]: businessId
      }));
      setFeedback({ type: "correct", message: "Perfect! 🎉" });
      setSelectedObject(null);
      setTimeout(() => setFeedback(null), 1500);
    } else {
      setFeedback({ type: "incorrect", message: "Try again!" });
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  const handleDisconnect = (objectId) => {
    setConnections(prev => {
      const newConnections = { ...prev };
      delete newConnections[objectId];
      return newConnections;
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-6 px-4">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Connect Products to Businesses</h3>
        <p className="text-sm text-gray-600">Tap a product on the left, then tap the business where you'd find it on the right.</p>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ height: "100%", zIndex: 1 }}
        />

        <div className="grid grid-cols-2 gap-4 sm:gap-6 relative z-2">
          {/* Objects Column */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Products</p>
            <div className="space-y-3">
              {ACTIVITY_DATA.objects.map(obj => {
                const isConnected = connections[obj.id];
                const isSelected = selectedObject === obj.id;
                return (
                  <div
                    key={obj.id}
                    ref={(el) => { objectRefsMap.current[obj.id] = el; }}
                    className="relative"
                  >
                    <button
                      onClick={() => handleObjectClick(obj.id)}
                      disabled={isConnected}
                      className={`w-full p-3 sm:p-4 rounded-xl transition-all ${
                        isConnected
                          ? "bg-emerald-100 border-2 border-emerald-400 opacity-60 cursor-not-allowed"
                          : isSelected
                          ? "bg-blue-100 border-2 border-blue-400 scale-105"
                          : "bg-white border-2 border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <img src={obj.image} alt={obj.label} className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 object-contain" />
                      <p className="text-xs font-semibold text-gray-800">{obj.label}</p>
                    </button>
                    {isConnected && (
                      <button
                        onClick={() => handleDisconnect(obj.id)}
                        className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1 hover:bg-emerald-600"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Businesses Column */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Businesses</p>
            <div className="space-y-3">
              {shuffledBusinesses.map(biz => (
                <div
                  key={biz.id}
                  ref={(el) => { businessRefsMap.current[biz.id] = el; }}
                >
                  <button
                    onClick={() => handleBusinessClick(biz.id)}
                    disabled={!selectedObject}
                    className={`w-full p-3 sm:p-4 rounded-xl transition-all ${
                      selectedObject
                        ? "bg-amber-100 border-2 border-amber-300 hover:bg-amber-200 cursor-pointer"
                        : "bg-white border-2 border-gray-200 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <img src={biz.image} alt={biz.label} className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 object-contain" />
                    <p className="text-xs font-semibold text-gray-800">{biz.label}</p>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <div className={`text-center py-3 px-4 rounded-lg mt-6 text-sm font-semibold ${
          feedback.type === "correct"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-red-100 text-red-700"
        }`}>
          {feedback.message}
        </div>
      )}

      {isComplete && (
        <div className="text-center mt-8">
          <p className="text-lg font-bold text-emerald-600 font-bold">Excellent! All connected! 🎉</p>
        </div>
      )}
    </div>
  );
}