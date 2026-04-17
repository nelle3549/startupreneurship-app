import React from "react";
import { BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/entities";

const cardColors = [
  { bg: "bg-blue-50 border-blue-200", tag: "bg-blue-100 text-blue-700" },
  { bg: "bg-orange-50 border-orange-200", tag: "bg-orange-100 text-orange-700" },
  { bg: "bg-purple-50 border-purple-200", tag: "bg-purple-100 text-purple-700" },
  { bg: "bg-green-50 border-green-200", tag: "bg-green-100 text-green-700" },
  { bg: "bg-amber-50 border-amber-200", tag: "bg-amber-100 text-amber-700" },
  { bg: "bg-rose-50 border-rose-200", tag: "bg-rose-100 text-rose-700" },
];

export default function WhatsBrewingSection() {
  const { data: articles = [] } = useQuery({
    queryKey: ["articles"],
    queryFn: () => entities.Article.list("order"),
  });

  const visible = articles.filter(a => !a.hidden);
  if (visible.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <BookOpen className="w-5 h-5 text-gray-700" />
        <h2 className="text-base font-bold text-gray-900">What's Brewing</h2>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((r, i) => {
          const { bg, tag } = cardColors[i % cardColors.length];
          return (
            <motion.a
              key={r.id}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`block rounded-2xl border-2 p-5 hover:shadow-md transition-all ${bg}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className="text-2xl">{r.emoji || "📄"}</span>
                {r.tag && <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${tag}`}>{r.tag}</span>}
              </div>
              <h3 className="font-bold text-gray-900 mb-1.5 text-sm leading-snug">{r.title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{r.description}</p>
            </motion.a>
          );
        })}
      </div>
    </div>
  );
}