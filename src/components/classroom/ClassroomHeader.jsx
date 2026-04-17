import React, { useState } from "react";
import { entities } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function ClassroomHeader({ classroom }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: facilitator } = useQuery({
    queryKey: ["facilitator", classroom.facilitator_id],
    queryFn: async () => {
      const accounts = await entities.UserAccount.filter({
        user_id: classroom.facilitator_id,
      });
      return accounts.length > 0 ? accounts[0] : null;
    },
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["classroom-enrollments-header", classroom.id],
    queryFn: () =>
      entities.Enrollment.filter({
        classroom_id: classroom.id,
        status: "approved",
      }),
  });

  const handleCopyCode = () => {
    navigator.clipboard.writeText(classroom.enrollment_code);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Classroom code copied to clipboard.",
      duration: 2000,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-1 truncate">
              {classroom.name}
            </h1>
            <p className="text-sm text-gray-500 mb-4">{classroom.description}</p>

            <div className="space-y-3">
              {/* Facilitator Info */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600 font-medium">Facilitator:</span>
                <span className="text-gray-900">
                  {[facilitator?.first_name, facilitator?.last_name].filter(Boolean).join(" ") || classroom.facilitator_email}
                </span>
                {facilitator?.school_organization && (
                  <span className="text-gray-400">
                    · {facilitator.school_organization}
                  </span>
                )}
              </div>

              {/* Enrollment Code */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium">Code:</span>
                <Badge variant="outline" className="font-mono text-sm px-3 py-1">
                  {classroom.enrollment_code}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyCode}
                  className="gap-1 h-7 text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              {/* Student Count */}
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  {enrollments.length} student{enrollments.length !== 1 ? "s" : ""}{" "}
                  enrolled
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}