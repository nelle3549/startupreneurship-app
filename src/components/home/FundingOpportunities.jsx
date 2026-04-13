import React from "react";
import { DollarSign, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function FundingOpportunities() {
  const navigate = useNavigate();
  const { data: opportunities = [] } = useQuery({
    queryKey: ["funding-opportunities"],
    queryFn: () => base44.entities.FundingOpportunity.list("order"),
  });

  const visible = opportunities.filter(o => !o.hidden);
  if (visible.length === 0) return null;

  const typeColors = [
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-green-100 text-green-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <DollarSign className="w-5 h-5 text-gray-700" />
        <h2 className="text-base font-bold text-gray-900">Funding & Grant Opportunities</h2>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {visible.map((opp, i) => (
          <motion.a
            key={opp.id}
            href={opp.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="block bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${typeColors[i % typeColors.length]}`}>{opp.type || "Grant"}</span>
            </div>
            <h3 className="font-bold text-gray-900 text-sm mb-0.5 leading-snug">{opp.title}</h3>
            <p className="text-xs text-gray-500 mb-3">{opp.org}</p>
            <p className="text-xs text-gray-600 leading-relaxed mb-4">{opp.description}</p>
            <div className="flex flex-col gap-1.5">
              {opp.amount && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span className="text-xs font-semibold text-emerald-700">{opp.amount}</span>
                </div>
              )}
              {opp.deadline && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-500">{opp.deadline}</span>
                </div>
              )}
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
}