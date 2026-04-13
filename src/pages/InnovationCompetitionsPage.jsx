import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, ExternalLink, Calendar, MapPin, Bell, X, LogIn, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getSavedUser } from "../components/userStorage";
import { Button } from "@/components/ui/button";

const COMPETITIONS = [
  {
    id: 1,
    title: "IdeaSpace Foundation Challenge",
    organizer: "IdeaSpace Foundation",
    type: "Pitch Competition",
    emoji: "🎤",
    date: "April 2026",
    location: "Manila, Philippines",
    prize: "Up to ₱1,000,000",
    description: "Annual competition for Filipino startups to pitch and win funding, mentoring, and acceleration.",
    color: "bg-red-50 border-red-200",
    tagColor: "bg-red-100 text-red-700",
    url: "https://ideaspace.ph/",
  },
  {
    id: 2,
    title: "Hack4PH National Hackathon",
    organizer: "DICT Philippines",
    type: "Hackathon",
    emoji: "💻",
    date: "May 2026",
    location: "Nationwide (Online)",
    prize: "₱250,000 top prize",
    description: "Build tech solutions for Philippine government challenges in 48 hours. Open to all students.",
    color: "bg-indigo-50 border-indigo-200",
    tagColor: "bg-indigo-100 text-indigo-700",
    url: "https://dict.gov.ph/",
  },
  {
    id: 3,
    title: "Global Student Entrepreneur Awards",
    organizer: "EO Philippines",
    type: "Global Competition",
    emoji: "🌏",
    date: "June 2026",
    location: "Global + PH Qualifier",
    prize: "Global recognition + funding",
    description: "Compete as a student entrepreneur running a real business. Philippine chapter open to university students.",
    color: "bg-amber-50 border-amber-200",
    tagColor: "bg-amber-100 text-amber-700",
    url: "https://gsea.org/",
  },
];

function LoginPromptModal({ comp, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full z-10"
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
        <div className="text-center mb-5">
          <div className="text-4xl mb-3">{comp.emoji}</div>
          <h3 className="text-base font-bold text-gray-900 mb-1">{comp.title}</h3>
          <p className="text-xs text-gray-500 mb-4">{comp.organizer}</p>
          <div className="bg-gray-50 rounded-xl p-3 mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-gray-600 text-left">Log in to receive updates and reminders about this event.</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Link to="/Library" onClick={onClose}>
            <Button className="w-full brand-gradient text-white rounded-full gap-2">
              <LogIn className="w-4 h-4" />
              Log In to Get Updates
            </Button>
          </Link>
          <a href={comp.url} target="_blank" rel="noopener noreferrer" onClick={onClose}>
            <Button variant="outline" className="w-full rounded-full gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              Visit Event Page
            </Button>
          </a>
        </div>
      </motion.div>
    </div>
  );
}

export default function InnovationCompetitionsPage() {
  const currentUser = getSavedUser();
  const [promptComp, setPromptComp] = useState(null);

  const handleCardClick = (comp) => {
    if (!currentUser) {
      setPromptComp(comp);
    } else {
      window.open(comp.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link to="/Home" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-700" />
          </Link>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-gray-700" />
            <h1 className="text-lg font-bold text-gray-900">Upcoming Innovation Competitions</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {COMPETITIONS.map((comp, i) => (
            <motion.div
              key={comp.id}
              onClick={() => handleCardClick(comp)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`cursor-pointer block rounded-2xl border-2 p-5 hover:shadow-md transition-all group ${comp.color}`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{comp.emoji}</span>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${comp.tagColor}`}>{comp.type}</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 flex-shrink-0 transition-colors" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-0.5 leading-snug">{comp.title}</h3>
              <p className="text-xs text-gray-500 mb-3">{comp.organizer}</p>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">{comp.description}</p>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  <span className="text-xs text-gray-600">{comp.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  <span className="text-xs text-gray-600">{comp.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <span className="text-xs font-semibold text-amber-700">{comp.prize}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {promptComp && (
          <LoginPromptModal comp={promptComp} onClose={() => setPromptComp(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}