import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { format } from "date-fns";

export default function HistoryArchiveTab() {
  const [search, setSearch] = useState("");

  const { data: archives = [], isLoading } = useQuery({
    queryKey: ["history-archive"],
    queryFn: () => entities.HistoryArchive.list("-featured_date"),
  });

  const filtered = archives.filter(a =>
    a.title?.toLowerCase().includes(search.toLowerCase()) ||
    a.content_type?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return (
    <div className="flex justify-center py-10">
      <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
    </div>
  );

  const typeEmoji = { quote: "💬", game: "🎮" };
  const groupedByMonth = {};
  filtered.forEach(a => {
    const month = a.featured_date?.slice(0, 7) || "Unknown";
    if (!groupedByMonth[month]) groupedByMonth[month] = [];
    groupedByMonth[month].push(a);
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search archives..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 rounded-full"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm">
          No archives yet. Featured content will appear here automatically.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByMonth)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([month, items]) => (
              <div key={month}>
                <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-200">
                  {format(new Date(month + "-01"), "MMMM yyyy")}
                </h3>
                <div className="space-y-2">
                  {items.map(a => (
                    <Card key={a.id} className="bg-gray-50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-lg">{typeEmoji[a.content_type] || "📋"}</span>
                              <span className="text-sm font-semibold text-gray-900">{a.title || "Untitled"}</span>
                              <Badge className="text-xs bg-gray-200 text-gray-700 border-0 py-0">
                                {a.content_type === "quote" ? "Quote" : "Game"}
                              </Badge>
                            </div>
                            {a.meta?.text && (
                              <p className="text-xs text-gray-600 italic line-clamp-2">"{a.meta.text}"</p>
                            )}
                            {a.meta?.hint && (
                              <p className="text-xs text-gray-500 mt-1">💡 {a.meta.hint}</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-medium text-gray-500">
                              {format(new Date(a.featured_date), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}