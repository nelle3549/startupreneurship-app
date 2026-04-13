import React from "react";
import { Trophy, ExternalLink, Calendar, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const tagColors = [
  { color: "bg-red-50 border-red-200", tagColor: "bg-red-100 text-red-700" },
  { color: "bg-indigo-50 border-indigo-200", tagColor: "bg-indigo-100 text-indigo-700" },
  { color: "bg-amber-50 border-amber-200", tagColor: "bg-amber-100 text-amber-700" },
  { color: "bg-purple-50 border-purple-200", tagColor: "bg-purple-100 text-purple-700" },
  { color: "bg-green-50 border-green-200", tagColor: "bg-green-100 text-green-700" },
];

export default function InnovationCompetitions() {
  const { data: competitions = [] } = useQuery({
    queryKey: ["competitions"],
    queryFn: () => base44.entities.Competition.list("order"),
  });

  const visible = competitions.filter(c => !c.hidden);
  if (visible.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <Trophy className="w-5 h-5 text-gray-700" />
        <h2 className="text-base font-bold text-gray-900">Upcoming Innovation Competitions</h2>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {visible.map((comp, i) => {
          const { color, tagColor } = tagColors[i % tagColors.length];
          return (
            <motion.a
              key={comp.id}
              href={comp.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`block rounded-2xl border-2 p-5 hover:shadow-md transition-all group ${color}`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  {comp.emoji && <span className="text-xl">{comp.emoji}</span>}
                  {comp.type && <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${tagColor}`}>{comp.type}</span>}
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 flex-shrink-0 transition-colors" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-0.5 leading-snug">{comp.title}</h3>
              <p className="text-xs text-gray-500 mb-3">{comp.organizer}</p>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">{comp.description}</p>
              <div className="flex flex-col gap-1.5">
                {comp.date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <span className="text-xs text-gray-600">{comp.date}</span>
                  </div>
                )}
                {comp.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <span className="text-xs text-gray-600">{comp.location}</span>
                  </div>
                )}
                {comp.prize && (
                  <div className="flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-amber-700">{comp.prize}</span>
                  </div>
                )}
              </div>
            </motion.a>
          );
        })}
      </div>
    </div>
  );
}