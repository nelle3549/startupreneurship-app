import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle2, AlertCircle } from "lucide-react";

export default function ActivitiesSection({ classroom }) {
  const activities = [
    {
      id: 1,
      title: "Lesson 1: Getting Started",
      lessonNumber: 1,
      dueDate: new Date(Date.now() + 604800000).toLocaleDateString(),
      status: "pending",
      description: "Complete the introduction lesson and answer the reflection questions.",
    },
    {
      id: 2,
      title: "Lesson 2: Problem Identification",
      lessonNumber: 2,
      dueDate: new Date(Date.now() + 1209600000).toLocaleDateString(),
      status: "pending",
      description: "Identify a real-world problem and analyze its root causes.",
    },
  ];

  const getStatusBadge = (status) => {
    if (status === "completed") {
      return <Badge className="bg-emerald-100 text-emerald-700 border-0 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed</Badge>;
    }
    if (status === "overdue") {
      return <Badge className="bg-red-100 text-red-700 border-0 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Overdue</Badge>;
    }
    return <Badge className="bg-amber-100 text-amber-700 border-0">Pending</Badge>;
  };

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <Card key={activity.id}>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{activity.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{activity.description}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Due: {activity.dueDate}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 min-w-max">
                {getStatusBadge(activity.status)}
                <Button size="sm" variant="outline">
                  View
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {activities.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            <p>No activities assigned yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}