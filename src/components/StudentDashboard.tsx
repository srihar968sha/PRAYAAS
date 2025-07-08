import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { EquipmentBrowser } from "./EquipmentBrowser";
import { MyRequests } from "./MyRequests";
import { MyRentals } from "./MyRentals";

interface StudentDashboardProps {
  profile: any;
}

export function StudentDashboard({ profile }: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState("browse");
  const myRequests = useQuery(api.requests.getMyRequests) || [];
  const myRentals = useQuery(api.rentals.getMyRentals) || [];

  const pendingRequests = myRequests.filter(req => req.status === "pending").length;
  const activeRentals = myRentals.filter(rental => !rental.isReturned).length;
  const overdueRentals = myRentals.filter(rental => !rental.isReturned && rental.isOverdue).length;

  const tabs = [
    { id: "browse", label: "Browse Equipment", icon: "🔍" },
    { id: "requests", label: "My Requests", icon: "📋", badge: pendingRequests },
    { id: "rentals", label: "My Rentals", icon: "📦", badge: activeRentals },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, {profile.name}!
        </h1>
        <p className="text-gray-600">Student ID: {profile.studentId}</p>
        
        {overdueRentals > 0 && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-red-600 text-xl mr-2">⚠️</span>
              <div>
                <h3 className="text-red-800 font-semibold">Overdue Equipment</h3>
                <p className="text-red-700">
                  You have {overdueRentals} overdue rental{overdueRentals > 1 ? 's' : ''}. Please return them as soon as possible to avoid additional late fees.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm relative ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{tab.icon}</span>
                {tab.label}
                {tab.badge && tab.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="tab-content">
        {activeTab === "browse" && <EquipmentBrowser />}
        {activeTab === "requests" && <MyRequests />}
        {activeTab === "rentals" && <MyRentals />}
      </div>
    </div>
  );
}
