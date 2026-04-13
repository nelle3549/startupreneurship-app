import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, DollarSign, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ICON_URL } from "../components/data/courseData";

const OPPORTUNITIES = [
  {
    id: "1",
    title: "DOST-SETUP Program",
    org: "Dept. of Science & Technology",
    amount: "Up to ₱500,000",
    deadline: "Rolling basis",
    type: "Government Grant",
    typeColor: "bg-blue-100 text-blue-700",
    description: "Funds for small enterprises to upgrade technology, equipment, and processes.",
    fullDescription: "The Small Enterprise Technology Upgrading Program (SETUP) is a nationwide strategy of the Department of Science and Technology (DOST) to encourage and assist micro, small, and medium enterprises (MSMEs) to harness technology and innovation. It provides financial assistance for upgrading technology, equipment, processes, and building human capital in the form of technical assistance, grants, and research and development services.",
    url: "https://www.dost.gov.ph/programs/setup",
    eligibility: ["Filipino-owned MSMEs", "Registered with DTI or SEC", "At least 1 year in operation", "Not recipient of another DOST grant within 3 years"],
    howToApply: ["Visit your nearest DOST Regional Office", "Submit a Letter of Intent with company profile", "Undergo Technology Audit", "Submit full project proposal if approved"],
  },
  {
    id: "2",
    title: "QBO Innovation Hub Grant",
    org: "QBO Philippines",
    amount: "Up to ₱300,000",
    deadline: "Quarterly",
    type: "Startup Grant",
    typeColor: "bg-purple-100 text-purple-700",
    description: "Support for early-stage startups solving local problems through technology and innovation.",
    fullDescription: "QBO Innovation Hub is the Philippines' premier public-private partnership initiative for startups. The grant program supports early-stage technology startups that are developing solutions to pressing local and national challenges. Recipients receive not only funding but access to QBO's extensive network of mentors, investors, and corporate partners.",
    url: "https://qbo.com.ph/",
    eligibility: ["Filipino-founded startups", "Early to growth stage", "Technology-driven solution", "Incorporated or willing to incorporate"],
    howToApply: ["Submit online application at qbo.com.ph", "Pitch to selection panel", "Due diligence period", "Grant disbursement upon approval"],
  },
  {
    id: "3",
    title: "Kapatid Mentor ME Program",
    org: "DTI Philippines",
    amount: "Mentoring + Funding Access",
    deadline: "Open enrollment",
    type: "Govt. Program",
    typeColor: "bg-green-100 text-green-700",
    description: "Connects MSMEs with large corporations for mentoring and access to funding networks.",
    fullDescription: "The Kapatid Mentor ME Program is a DTI initiative that partners large corporations (Kuya/Ate) with MSMEs (Kapatid) for a structured mentoring program. Beyond mentoring, participants gain access to funding networks, market linkages, and business development services. The program runs in cohorts and is open to registered MSMEs nationwide.",
    url: "https://www.dti.gov.ph/",
    eligibility: ["Registered MSMEs with DTI", "At least 1 year operating", "Annual revenue under ₱100M", "Committed to program duration"],
    howToApply: ["Register at nearest DTI Provincial Office", "Attend orientation session", "Be matched with a corporate mentor", "Complete the 10-session program"],
  },
];

export default function FundingDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const opp = OPPORTUNITIES.find(o => o.id === id);

  if (!opp) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Opportunity not found.</p>
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
          <h1 className="text-base font-bold text-gray-900 truncate">Funding & Grant Opportunities</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Hero */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${opp.typeColor} mb-3 inline-block`}>{opp.type}</span>
          <h2 className="text-xl font-bold text-gray-900 mb-1">{opp.title}</h2>
          <p className="text-sm text-gray-500 mb-4">{opp.org}</p>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold text-emerald-700">{opp.amount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">Deadline: {opp.deadline}</span>
            </div>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{opp.fullDescription}</p>
        </div>

        {/* Eligibility */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Eligibility</h3>
          <ul className="space-y-2">
            {opp.eligibility.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-emerald-500 mt-0.5">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* How to Apply */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-3">How to Apply</h3>
          <ol className="space-y-2">
            {opp.howToApply.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* CTA */}
        <a href={opp.url} target="_blank" rel="noopener noreferrer">
          <Button className="w-full brand-gradient text-white rounded-full gap-2">
            <ExternalLink className="w-4 h-4" />
            Visit Official Website
          </Button>
        </a>
      </div>
    </div>
  );
}