import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Users, Search } from "lucide-react";

export default function StudentListSection({ classroom, isFacilitator }) {
  const [search, setSearch] = useState("");

  const { data: enrollments = [] } = useQuery({
    queryKey: ["classroom-enrollments", classroom.id],
    queryFn: () => base44.entities.Enrollment.filter({ classroom_id: classroom.id }),
  });

  const filteredStudents = enrollments.filter(e =>
    e.student_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.student_email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredStudents.length > 0 ? (
        <div className="flex flex-col gap-4">
          {filteredStudents.map((enrollment) => (
            <Card key={enrollment.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{enrollment.student_name}</p>
                    <p className="text-sm text-gray-500">{enrollment.student_email}</p>
                    <div className="mt-3">
                      <Badge className={
                        enrollment.status === "approved" ? "bg-emerald-100 text-emerald-700 border-0" :
                        enrollment.status === "pending" ? "bg-amber-100 text-amber-700 border-0" :
                        "bg-red-100 text-red-700 border-0"
                      }>
                        {enrollment.status?.charAt(0).toUpperCase() + enrollment.status?.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <Users className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            <p>{search ? "No students found." : "No students enrolled yet."}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}