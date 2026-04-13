import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trophy, Calendar, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ICON_URL } from "../components/data/courseData";

const COMPETITIONS = [
  {
    id: "1",
    title: "IdeaSpace Foundation Challenge",
    organizer: "IdeaSpace Foundation",
    type: "Pitch Competition",
    emoji: "🎤",
    date: "April 2026",
    location: "Manila, Philippines",
    prize: "Up to ₱1,000,000",
    description: "Annual competition for Filipino startups to pitch and win funding, mentoring, and acceleration.",
    fullDescription: "The IdeaSpace Foundation Challenge is the Philippines' premier startup pitch competition, designed to discover and accelerate the country's most promising technology startups. Finalists receive intensive coaching, investor introductions, and the chance to win up to ₱1,000,000 in funding plus a spot in the IdeaSpace acceleration program.",
    color: "bg-red-50 border-red-200",
    tagColor: "bg-red-100 text-red-700",
    url: "https://ideaspace.ph/",
    eligibility: ["Filipino startup (at least 51% Filipino-owned)", "Early to growth stage", "Technology-driven product or service", "Team of at least 2 members"],
    whatToExpect: ["Online application and screening", "Regional pitching rounds", "National finals in Manila", "Mentoring and acceleration for finalists"],
  },
  {
    id: "2",
    title: "Hack4PH National Hackathon",
    organizer: "DICT Philippines",
    type: "Hackathon",
    emoji: "💻",
    date: "May 2026",
    location: "Nationwide (Online)",
    prize: "₱250,000 top prize",
    description: "Build tech solutions for Philippine government challenges in 48 hours. Open to all students.",
    fullDescription: "Hack4PH is the national hackathon organized by the Department of Information and Communications Technology (DICT). Teams of students and professionals compete to build innovative technology solutions addressing real Philippine government challenges within 48 hours. The event is held nationwide, with regional hubs and an online track.",
    color: "bg-indigo-50 border-indigo-200",
    tagColor: "bg-indigo-100 text-indigo-700",
    url: "https://dict.gov.ph/",
    eligibility: ["Open to all Filipino citizens", "Students and professionals welcome", "Teams of 3–5 members", "No prior coding experience required for non-tech tracks"],
    whatToExpect: ["Problem statement release 1 week before", "48-hour build sprint", "Pitching to panel of judges", "Top 3 teams win cash prizes"],
  },
  {
    id: "3",
    title: "Global Student Entrepreneur Awards",
    organizer: "EO Philippines",
    type: "Global Competition",
    emoji: "🌏",
    date: "June 2026",
    location: "Global + PH Qualifier",
    prize: "Global recognition + funding",
    description: "Compete as a student entrepreneur running a real business. Philippine chapter open to university students.",
    fullDescription: "The Global Student Entrepreneur Awards (GSEA) is the world's premier global competition for student entrepreneurs. Run by the Entrepreneurs' Organization (EO), GSEA recognizes students who own and operate a business while attending college or university. The Philippines chapter hosts a national qualifier, with the winner advancing to the global finals.",
    color: "bg-amber-50 border-amber-200",
    tagColor: "bg-amber-100 text-amber-700",
    url: "https://gsea.org/",
    eligibility: ["Currently enrolled university student", "Must own and operate a business", "Business must generate revenue", "18–30 years old"],
    whatToExpect: ["Local chapter qualifier", "National finals in the Philippines", "Global finals for national winner", "Mentoring, networking, and global exposure"],
  },
];

export default function CompetitionDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const comp = COMPETITIONS.find(c => c.id === id);

  if (!comp) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Competition not found.</p>
          <Button onClick={() => navigate("/Home")} variant="outline" className="rounded-full">Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/Home")} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-700" />
          </button>
          <img src={ICON_URL} alt="Startupreneur" className="w-7 h-7" />
          <h1 className="text-base font-bold text-gray-900 truncate">Upcoming Innovation Competitions</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Hero */}
        <div className={`rounded-2xl border-2 p-6 ${comp.color}`}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{comp.emoji}</span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${comp.tagColor}`}>{comp.type}</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">{comp.title}</h2>
          <p className="text-sm text-gray-500 mb-4">{comp.organizer}</p>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">{comp.date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">{comp.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-amber-700">{comp.prize}</span>
            </div>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{comp.fullDescription}</p>
        </div>

        {/* Eligibility */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Who Can Join</h3>
          <ul className="space-y-2">
            {comp.eligibility.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-emerald-500 mt-0.5">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* What to Expect */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-3">What to Expect</h3>
          <ol className="space-y-2">
            {comp.whatToExpect.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* CTA */}
        <a href={comp.url} target="_blank" rel="noopener noreferrer">
          <Button className="w-full brand-gradient text-white rounded-full gap-2">
            <ExternalLink className="w-4 h-4" />
            Visit Official Website
          </Button>
        </a>
      </div>
    </div>
  );
}