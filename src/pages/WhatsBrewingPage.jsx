import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, ExternalLink, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const RESOURCES = [
  {
    id: 1,
    title: "The Lean Startup",
    description: "Eric Ries' method for building companies — how to use continuous innovation to create radically successful businesses.",
    tag: "Book",
    color: "bg-blue-50 border-blue-200",
    tagColor: "bg-blue-100 text-blue-700",
    emoji: "📗",
    url: "https://theleanstartup.com/",
  },
  {
    id: 2,
    title: "Y Combinator Library",
    description: "Free resources, essays, and startup advice from one of the world's most successful startup accelerators.",
    tag: "Resource",
    color: "bg-orange-50 border-orange-200",
    tagColor: "bg-orange-100 text-orange-700",
    emoji: "🚀",
    url: "https://www.ycombinator.com/library",
  },
  {
    id: 3,
    title: "How to Start a Startup",
    description: "Sam Altman's legendary Stanford lecture series covering everything from idea to scale.",
    tag: "Course",
    color: "bg-purple-50 border-purple-200",
    tagColor: "bg-purple-100 text-purple-700",
    emoji: "🎓",
    url: "https://startupclass.samaltman.com/",
  },
  {
    id: 4,
    title: "Zero to One",
    description: "Peter Thiel's notes on startups — how to build companies that create new things rather than copying what works.",
    tag: "Book",
    color: "bg-green-50 border-green-200",
    tagColor: "bg-green-100 text-green-700",
    emoji: "📘",
    url: "https://www.amazon.com/Zero-One-Notes-Startups-Future/dp/0804139296",
  },
  {
    id: 5,
    title: "Paul Graham Essays",
    description: "Timeless essays on startups, programming, and life from Y Combinator co-founder Paul Graham.",
    tag: "Articles",
    color: "bg-amber-50 border-amber-200",
    tagColor: "bg-amber-100 text-amber-700",
    emoji: "✍️",
    url: "https://paulgraham.com/articles.html",
  },
  {
    id: 6,
    title: "First Round Review",
    description: "Tactical advice from founders and operators on building products, teams, and culture.",
    tag: "Articles",
    color: "bg-rose-50 border-rose-200",
    tagColor: "bg-rose-100 text-rose-700",
    emoji: "📰",
    url: "https://review.firstround.com/",
  },
];

export default function WhatsBrewingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link to="/Home" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-700" />
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-gray-700" />
            <h1 className="text-lg font-bold text-gray-900">What's Brewing</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {RESOURCES.map((r, i) => (
            <motion.a
              key={r.id}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`block rounded-2xl border-2 p-5 hover:shadow-md transition-all group cursor-pointer ${r.color}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className="text-2xl">{r.emoji}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${r.tagColor}`}>{r.tag}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </div>
              <h3 className="font-bold text-gray-900 mb-1.5 text-sm leading-snug">{r.title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{r.description}</p>
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
}