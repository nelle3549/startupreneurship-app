import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ICON_URL } from "../components/data/courseData";

const RESOURCES = [
  {
    id: "1",
    title: "The Lean Startup",
    tag: "Book",
    color: "bg-blue-50 border-blue-200",
    tagColor: "bg-blue-100 text-blue-700",
    emoji: "📗",
    url: "https://theleanstartup.com/",
    description: "Eric Ries' method for building companies — how to use continuous innovation to create radically successful businesses.",
    fullDescription: "The Lean Startup introduces a scientific approach to creating and managing startups. Eric Ries argues that startups exist to learn how to build a sustainable business, and that this learning can be validated scientifically through a process called the Build-Measure-Learn feedback loop. The methodology has influenced millions of entrepreneurs worldwide and is considered essential reading for anyone starting a company.",
    keyTakeaways: [
      "Build a Minimum Viable Product (MVP) to test assumptions quickly",
      "Measure outcomes using actionable metrics, not vanity metrics",
      "Learn whether to pivot or persevere based on validated data",
      "Innovation accounting to track progress in uncertain environments",
    ],
    author: "Eric Ries",
    year: "2011",
  },
  {
    id: "2",
    title: "Y Combinator Library",
    tag: "Resource",
    color: "bg-orange-50 border-orange-200",
    tagColor: "bg-orange-100 text-orange-700",
    emoji: "🚀",
    url: "https://www.ycombinator.com/library",
    description: "Free resources, essays, and startup advice from one of the world's most successful startup accelerators.",
    fullDescription: "The Y Combinator Library is a free, curated collection of startup wisdom from YC partners, alumni founders, and industry experts. It covers every stage of the startup journey—from idea validation and fundraising to scaling and hiring. YC has funded companies like Airbnb, Dropbox, Stripe, and Reddit, making this resource invaluable for anyone building a startup.",
    keyTakeaways: [
      "How to find product-market fit and validate ideas early",
      "Fundraising strategies and how to talk to investors",
      "Building and managing high-performing startup teams",
      "Growth tactics used by top YC alumni",
    ],
    author: "Y Combinator",
    year: "Ongoing",
  },
  {
    id: "3",
    title: "How to Start a Startup",
    tag: "Course",
    color: "bg-purple-50 border-purple-200",
    tagColor: "bg-purple-100 text-purple-700",
    emoji: "🎓",
    url: "https://startupclass.samaltman.com/",
    description: "Sam Altman's legendary Stanford lecture series covering everything from idea to scale.",
    fullDescription: "How to Start a Startup is a free online course originally developed for Stanford University by Sam Altman (former YC President) and other top founders and investors. The lectures cover the entire arc of building a startup—from coming up with the right idea, to building a great team, to growing the business, to managing yourself as a founder.",
    keyTakeaways: [
      "How to evaluate and choose the right startup idea",
      "Building a co-founder relationship that lasts",
      "Hiring your first employees and creating culture",
      "Sales, growth, and going from 0 to 1",
    ],
    author: "Sam Altman et al.",
    year: "2014 (Timeless)",
  },
  {
    id: "4",
    title: "Zero to One",
    tag: "Book",
    color: "bg-green-50 border-green-200",
    tagColor: "bg-green-100 text-green-700",
    emoji: "📘",
    url: "https://www.amazon.com/Zero-One-Notes-Startups-Future/dp/0804139296",
    description: "Peter Thiel's notes on startups — how to build companies that create new things rather than copying what works.",
    fullDescription: "Zero to One is Peter Thiel's contrarian guide to innovation and building the future. Drawing on his experience co-founding PayPal and being the first investor in Facebook, Thiel argues that true innovation is going from 0 to 1—creating something genuinely new—rather than going from 1 to n (copying what works). The book challenges founders to think differently about competition, monopoly, and building lasting companies.",
    keyTakeaways: [
      "Why monopoly is good for startups (and why competition destroys value)",
      "The importance of a secret: what do you know that others don't?",
      "Why great companies are built on strong founder relationships",
      "How to think about the future and build technology that lasts",
    ],
    author: "Peter Thiel",
    year: "2014",
  },
  {
    id: "5",
    title: "Paul Graham Essays",
    tag: "Articles",
    color: "bg-amber-50 border-amber-200",
    tagColor: "bg-amber-100 text-amber-700",
    emoji: "✍️",
    url: "https://paulgraham.com/articles.html",
    description: "Timeless essays on startups, programming, and life from Y Combinator co-founder Paul Graham.",
    fullDescription: "Paul Graham has been writing essays on startups, technology, and life since the early 2000s. His writing is considered some of the most insightful content available for founders. Essays like 'Do Things That Don't Scale,' 'How to Get Startup Ideas,' and 'Default Alive or Default Dead' are required reading in startup culture worldwide.",
    keyTakeaways: [
      "'Do Things That Don't Scale'—why manual effort early pays off",
      "How to recognize a good startup idea vs. a bad one",
      "Why startups should stay lean and default alive",
      "The importance of talking to users more than you think you need to",
    ],
    author: "Paul Graham",
    year: "2001–Present",
  },
  {
    id: "6",
    title: "First Round Review",
    tag: "Articles",
    color: "bg-rose-50 border-rose-200",
    tagColor: "bg-rose-100 text-rose-700",
    emoji: "📰",
    url: "https://review.firstround.com/",
    description: "Tactical advice from founders and operators on building products, teams, and culture.",
    fullDescription: "First Round Review is the editorial publication of First Round Capital, one of Silicon Valley's leading seed-stage venture capital firms. The publication features in-depth, tactical articles from the founders, executives, and operators of some of the world's most successful technology companies. Every article is hands-on and built for practitioners.",
    keyTakeaways: [
      "Deep tactical guides on product management and engineering",
      "Real stories from founders on building company culture",
      "How top operators approach hiring, management, and scaling",
      "Frameworks for decision-making at every stage of growth",
    ],
    author: "First Round Capital",
    year: "Ongoing",
  },
];

export default function ArticleDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const resource = RESOURCES.find(r => r.id === id);

  if (!resource) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Resource not found.</p>
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
          <h1 className="text-base font-bold text-gray-900 truncate">What's Brewing</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Hero */}
        <div className={`rounded-2xl border-2 p-6 ${resource.color}`}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{resource.emoji}</span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${resource.tagColor}`}>{resource.tag}</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">{resource.title}</h2>
          <p className="text-xs text-gray-500 mb-4">By {resource.author} · {resource.year}</p>
          <p className="text-sm text-gray-700 leading-relaxed">{resource.fullDescription}</p>
        </div>

        {/* Key Takeaways */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Key Takeaways</h3>
          <ul className="space-y-3">
            {resource.keyTakeaways.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-blue-500 mt-0.5 font-bold">→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <a href={resource.url} target="_blank" rel="noopener noreferrer">
          <Button className="w-full brand-gradient text-white rounded-full gap-2">
            <ExternalLink className="w-4 h-4" />
            Read / Access Resource
          </Button>
        </a>
      </div>
    </div>
  );
}