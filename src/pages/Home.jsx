import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Users, Shield, UserCircle, BookOpen, Flame } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { ICON_URL } from "../components/data/courseData";
import { getSavedUser } from "../components/userStorage";
import { useCurrentUser } from "../components/useCurrentUser";
import { useAuth } from "../lib/AuthContext";
import { useNotifications } from "../components/hooks/useNotifications";
import DailyBanner from "../components/home/DailyBanner";
import WhatsBrewingSection from "../components/home/WhatsBrewingSection";
import GameOfTheDay, { getLoginStreak } from "../components/home/GameOfTheDay";
import FundingOpportunities from "../components/home/FundingOpportunities";
import InnovationCompetitions from "../components/home/InnovationCompetitions";
import LoginSignup from "../components/registration/LoginSignup";

function recordLoginStreak() {
  try {
    const today = new Date().toISOString().split("T")[0];
    const data = JSON.parse(localStorage.getItem("startupreneur_streaks") || "{}");
    const days = new Set(data.login_days || []);
    days.add(today);
    localStorage.setItem("startupreneur_streaks", JSON.stringify({ ...data, login_days: Array.from(days) }));
  } catch (e) {}
}

export default function Home() {
  const currentUser = getSavedUser();
  const { isAuthenticated } = useAuth();
  const { user: authUser, isAdmin, isFacilitator, isStudent } = useCurrentUser();
  const { pendingFacilitatorsCount, pendingEnrollmentsCount } = useNotifications();
  const [showLogin, setShowLogin] = useState(false);

  const { data: studentEnrollments = [] } = useQuery({
    queryKey: ["student-enrollments", authUser?.email],
    queryFn: () => base44.entities.Enrollment.filter({ student_email: authUser?.email, status: "approved" }),
    enabled: !!authUser?.email && !isAdmin && !isFacilitator,
  });

  const { data: enrolledClassrooms = [] } = useQuery({
    queryKey: ["enrolled-classrooms", studentEnrollments.map(e => e.classroom_id).join(',')],
    queryFn: async () => {
      if (studentEnrollments.length === 0) return [];
      const allClassrooms = await base44.entities.Classroom.list();
      return allClassrooms.filter(c =>
        studentEnrollments.some(e => e.classroom_id === c.id)
      );
    },
    enabled: studentEnrollments.length > 0,
  });

  const firstClassroomId = enrolledClassrooms[0]?.id;

  useEffect(() => {
    if (currentUser) recordLoginStreak();
  }, []);

  const loginStreak = currentUser ? getLoginStreak() : 0;

  const toTitleCase = (str) => str ? str.toLowerCase().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "";
  const firstName = currentUser?.first_name
    ? toTitleCase(currentUser.first_name)
    : (authUser?.full_name?.split(" ")[0] ? toTitleCase(authUser.full_name.split(" ")[0]) : "there");
  const honorific = currentUser?.honorifics ? currentUser.honorifics + " " : "";

  const isVerifiedFacilitator = isFacilitator || (currentUser?.role === "facilitator" && currentUser?.status === "verified");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={ICON_URL} alt="Startupreneur" className="w-8 h-8" />
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-none">Startupreneur</h1>
              <p className="text-xs text-gray-400">Home</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link to="/Admin" className="relative">
                <Button variant="outline" className="rounded-full gap-2 text-sm hidden sm:flex border-red-200 text-red-600 hover:bg-red-50">
                  <Shield className="w-4 h-4" />
                  Admin
                  {pendingFacilitatorsCount > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-semibold leading-none">
                      {pendingFacilitatorsCount}
                    </span>
                  )}
                </Button>
                <Button variant="outline" size="icon" className="rounded-full sm:hidden border-red-200 text-red-600 relative">
                  <Shield className="w-4 h-4" />
                  {pendingFacilitatorsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                      {pendingFacilitatorsCount}
                    </span>
                  )}
                </Button>
              </Link>
            )}
            {isVerifiedFacilitator && (
              <Link to="/Portal" className="relative">
                <Button variant="outline" className="rounded-full gap-2 text-sm hidden sm:flex">
                  <Users className="w-4 h-4" />
                  Portal
                  {pendingEnrollmentsCount > 0 && (
                    <span className="ml-1 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5 font-semibold leading-none">
                      {pendingEnrollmentsCount}
                    </span>
                  )}
                </Button>
                <Button variant="outline" size="icon" className="rounded-full sm:hidden relative">
                  <Users className="w-4 h-4" />
                  {pendingEnrollmentsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                      {pendingEnrollmentsCount}
                    </span>
                  )}
                </Button>
              </Link>
            )}
            {isStudent && firstClassroomId && (
              <Link to={`/ClassroomView?id=${firstClassroomId}`}>
                <Button className="rounded-full gap-2 text-sm hidden sm:flex bg-orange-500 hover:bg-orange-600 text-white border-0">
                  <BookOpen className="w-4 h-4" />
                  Classroom
                </Button>
                <Button size="icon" className="rounded-full sm:hidden bg-orange-500 hover:bg-orange-600 text-white border-0">
                  <BookOpen className="w-4 h-4" />
                </Button>
              </Link>
            )}
            {isAuthenticated ? (
              <Link to="/AccountSettings">
                <Button variant="outline" size="icon" className="rounded-full">
                  <UserCircle className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <Button onClick={() => setShowLogin(true)} className="rounded-full brand-gradient text-white text-sm px-4">
                Get Started
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Greeting */}
        <div>
          {loginStreak > 0 && (
            <div className="inline-flex items-center gap-1.5 mb-2 bg-orange-50 border border-orange-200 text-orange-600 text-xs font-semibold px-3 py-1 rounded-full">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              {loginStreak}-day streak
            </div>
          )}
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Good {getGreeting()}, {honorific}{firstName}! 👋
          </h2>
          <p className="text-gray-500 text-sm mt-1">Here's what's happening with your learning journey.</p>
        </div>

        {/* Daily Quote Banner */}
        <DailyBanner />

        {/* Game of the Day */}
        <GameOfTheDay />

        {/* Funding & Grant Opportunities */}
        <FundingOpportunities />

        {/* Upcoming Innovation Competitions */}
        <InnovationCompetitions />

        {/* What's Brewing — articles & resources */}
        <WhatsBrewingSection />
      </div>

      {/* Login dialog */}
      {showLogin && (
        <LoginSignup
          onComplete={() => window.location.reload()}
          onCancel={() => setShowLogin(false)}
        />
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}