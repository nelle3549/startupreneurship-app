import React from "react";
import { Link } from "react-router-dom";
import { DollarSign, Calendar, ArrowLeft, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

const OPPORTUNITIES = [
  {
    id: 1,
    title: "DOST-SETUP Program",
    org: "Dept. of Science & Technology",
    amount: "Up to ₱500,000",
    deadline: "Rolling basis",
    type: "Government Grant",
    typeColor: "bg-blue-100 text-blue-700",
    description: "Funds for small enterprises to upgrade technology, equipment, and processes.",
    url: "https://www.dost.gov.ph/programs/setup",
  },
  {
    id: 2,
    title: "QBO Innovation Hub Grant",
    org: "QBO Philippines",
    amount: "Up to ₱300,000",
    deadline: "Quarterly",
    type: "Startup Grant",
    typeColor: "bg-purple-100 text-purple-700",
    description: "Support for early-stage startups solving local problems through technology and innovation.",
    url: "https://qbo.com.ph/",
  },
  {
    id: 3,
    title: "Kapatid Mentor ME Program",
    org: "DTI Philippines",
    amount: "Mentoring + Funding Access",
    deadline: "Open enrollment",
    type: "Govt. Program",
    typeColor: "bg-green-100 text-green-700",
    description: "Connects MSMEs with large corporations for mentoring and access to funding networks.",
    url: "https://www.dti.gov.ph/",
  },
];

export default function FundingGrants() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link to="/Home" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-700" />
          </Link>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gray-700" />
            <h1 className="text-lg font-bold text-gray-900">Funding & Grant Opportunities</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {OPPORTUNITIES.map((opp, i) => (
            <motion.a
              key={opp.id}
              href={opp.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="block bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${opp.typeColor}`}>{opp.type}</span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 flex-shrink-0 transition-colors" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-0.5 leading-snug">{opp.title}</h3>
              <p className="text-xs text-gray-500 mb-3">{opp.org}</p>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">{opp.description}</p>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span className="text-xs font-semibold text-emerald-700">{opp.amount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-500">{opp.deadline}</span>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
}