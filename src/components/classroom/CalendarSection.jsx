import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CalendarSection({ classroom }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const events = [
    { date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15), title: "Lesson 1 Due", type: "deadline" },
    { date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 22), title: "Lesson 2 Due", type: "deadline" },
  ];

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const getEventsForDate = (day) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
    return events.filter(e => e.date.toDateString() === dateStr);
  };

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });
  const days = Array.from({ length: daysInMonth(currentDate) }, (_, i) => i + 1);
  const emptyCells = Array.from({ length: firstDayOfMonth(currentDate) }, (_, i) => i);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{monthName}</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="text-center text-sm font-semibold text-gray-500 py-2">
                {day}
              </div>
            ))}

            {emptyCells.map((_, i) => (
              <div key={`empty-${i}`} className="h-24 bg-gray-50 rounded-lg" />
            ))}

            {days.map(day => {
              const dayEvents = getEventsForDate(day);
              return (
                <div key={day} className="h-24 border border-gray-200 rounded-lg p-2 hover:bg-blue-50 transition-colors">
                  <p className="text-sm font-semibold text-gray-900 mb-1">{day}</p>
                  <div className="space-y-1">
                    {dayEvents.map((event, i) => (
                      <div key={i} className="text-xs">
                        <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
                          {event.title}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <ul className="space-y-2">
              {events.map((event, i) => (
                <li key={i} className="flex items-center justify-between text-sm py-2 border-b last:border-b-0">
                  <span className="text-gray-700">{event.title}</span>
                  <span className="text-gray-500">{event.date.toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No upcoming deadlines.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}