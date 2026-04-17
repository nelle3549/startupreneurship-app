import React, { useMemo, useState, useEffect } from "react";
import { Sparkles, Share2, Check } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { entities } from "@/api/entities";

const FALLBACK_QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "An entrepreneur is someone who jumps off a cliff and builds a plane on the way down.", author: "Reid Hoffman" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { text: "Your most unhappy customers are your greatest source of learning.", author: "Bill Gates" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
  { text: "Success is not the key to happiness. Happiness is the key to success.", author: "Albert Schweitzer" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Risk more than others think is safe. Dream more than others think is practical.", author: "Howard Schultz" },
  { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "The entrepreneur always searches for change, responds to it, and exploits it as an opportunity.", author: "Peter Drucker" },
  { text: "It's fine to celebrate success, but it is more important to heed the lessons of failure.", author: "Bill Gates" },
  { text: "Failure is simply the opportunity to begin again, this time more intelligently.", author: "Henry Ford" },
];

function getDayQuote(quoteList) {
  const today = new Date().toISOString().split("T")[0];
  const all = quoteList && quoteList.length > 0 ? quoteList : FALLBACK_QUOTES;
  const active = all.filter(q => !q.hidden);
  
  const scheduled = active.find(q => q.scheduled_date === today);
  if (scheduled) return scheduled;
  
  const rotatable = active.filter(q => !q.scheduled_date || q.scheduled_date < today);
  if (rotatable.length === 0) return active[0] || FALLBACK_QUOTES[0];
  
  const start = new Date("2024-01-01");
  const now = new Date();
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return rotatable[diff % rotatable.length];
}

export default function DailyBanner() {
  const [copied, setCopied] = useState(false);
  const [lastFeatured, setLastFeatured] = useState(null);

  const { data: dbQuotes = [] } = useQuery({
    queryKey: ["quotes"],
    queryFn: () => entities.Quote.list("order"),
  });

  const archiveMutation = useMutation({
    mutationFn: (data) => entities.HistoryArchive.create(data),
  });

  const quote = useMemo(() => getDayQuote(dbQuotes), [dbQuotes]);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const stored = localStorage.getItem("lastArchivedQuote");
    if (stored !== today && quote?.id && !quote.hidden) {
      archiveMutation.mutate({
        content_type: "quote",
        content_id: quote.id,
        title: quote.text?.slice(0, 50) || "Untitled",
        featured_date: today,
        meta: { text: quote.text, author: quote.author }
      });
      localStorage.setItem("lastArchivedQuote", today);
    }
  }, [quote?.id]);

  const handleShare = () => {
    const text = `"${quote.text}" — ${quote.author}`;
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="brand-gradient rounded-3xl p-6 sm:p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />
      <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
      <div className="absolute -bottom-8 -left-4 w-24 h-24 bg-white/10 rounded-full pointer-events-none" />
      <div className="relative z-10">
         <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-2">
             <Sparkles className="w-4 h-4 text-white/80" />
             <span className="text-xs font-semibold text-white/80 uppercase tracking-widest">Quote of the Day</span>
           </div>
           <button
             onClick={handleShare}
             className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs font-medium transition-colors bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full"
           >
             {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
             {copied ? "Copied!" : "Share"}
           </button>
         </div>
         <p className="text-white text-xl sm:text-2xl font-semibold leading-relaxed mb-4 italic">
           "{quote?.text || FALLBACK_QUOTES[0].text}"
         </p>
         <p className="text-white/70 text-sm">— {quote?.author || FALLBACK_QUOTES[0].author}</p>
       </div>
    </div>
  );
}