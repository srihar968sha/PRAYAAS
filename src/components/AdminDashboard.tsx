import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ClubMemberDashboard } from "./ClubMemberDashboard";
import { UserApprovalManagement } from "./UserApprovalManagement";
import { SemesterManagement } from "./SemesterManagement";
import { RequestsManagement } from "./RequestsManagement";
import { EquipmentManagement } from "./EquipmentManagement";
import { RentalsManagement } from "./RentalsManagement";
import { OverdueManagement } from "./OverdueManagement";
import { TransactionHistory } from "./TransactionHistory";

interface AdminDashboardProps {
  profile: any;
}

export function AdminDashboard({ profile }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("users");
  const pendingUsers = useQuery(api.users.getPendingUsers) || [];
  const pendingRequestsCount = useQuery(api.requests.getPendingRequestsCount) || 0;
  const overdueRentalsCount = useQuery(api.rentals.getOverdueRentalsCount) || 0;

  const tabs = [
    { id: "users", label: "User Approvals", icon: "👥", badge: pendingUsers.length, badgeColor: pendingUsers.length > 0 ? "red" : undefined },
    { id: "equipment", label: "Equipment", icon: "📦" },
    { id: "requests", label: "Requests", icon: "📋", badge: pendingRequestsCount, badgeColor: pendingRequestsCount > 0 ? "red" : undefined },
    { id: "rentals", label: "Rentals", icon: "🔄" },
    { id: "overdue", label: "Overdue", icon: "⏰", badge: overdueRentalsCount, badgeColor: overdueRentalsCount > 0 ? "red" : undefined },
    { id: "semesters", label: "Sessions", icon: "📅" },
    { id: "transactions", label: "Transactions", icon: "📊" },
  ];



  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">Welcome, {profile.name}!</p>
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
                  <span className={`${tab.badgeColor === 'red' ? 'bg-red-500' : 'bg-blue-500'} text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center`}>
                    {tab.badge}
                  </span>
                )}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="tab-content">
        {activeTab === "users" && <UserApprovalManagement />}
        {activeTab === "equipment" && <EquipmentManagement />}
        {activeTab === "requests" && <RequestsManagement />}
        {activeTab === "rentals" && <RentalsManagement />}
        {activeTab === "overdue" && <OverdueManagement />}
        {activeTab === "semesters" && <SemesterManagement />}
        {activeTab === "transactions" && <TransactionHistory />}
      </div>
    </div>
  );
}
