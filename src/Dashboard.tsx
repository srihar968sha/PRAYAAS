import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { StudentDashboard } from "./components/StudentDashboard";
import { ClubMemberDashboard } from "./components/ClubMemberDashboard";
import { AdminDashboard } from "./components/AdminDashboard";

export function Dashboard() {
  const userProfile = useQuery(api.users.getCurrentUserProfile);

  if (!userProfile?.profile) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { profile } = userProfile;

  if (profile.role === "student") {
    return <StudentDashboard profile={profile} />;
  } else if (profile.role === "member") {
    return <ClubMemberDashboard profile={profile} />;
  } else if (profile.role === "admin") {
    return <AdminDashboard profile={profile} />;
  }

  return null;
}
