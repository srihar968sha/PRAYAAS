import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { EquipmentManagement } from "./EquipmentManagement";
import { RequestsManagement } from "./RequestsManagement";
import { OverdueManagement } from "./OverdueManagement";
import { TransactionHistory } from "./TransactionHistory";
import { RentalsManagement } from "./RentalsManagement";
import { SemesterManagement } from "./SemesterManagement";

interface ClubMemberDashboardProps {
  profile: any;
}

export function ClubMemberDashboard({ profile }: ClubMemberDashboardProps) {
  const [activeTab, setActiveTab] = useState("equipment");
  const pendingRequestsCount = useQuery(api.requests.getPendingRequestsCount) || 0;
  const overdueRentalsCount = useQuery(api.rentals.getOverdueRentalsCount) || 0;
  const dashboardStats = useQuery(api.transactions.getDashboardStats);

  const tabs = [
    { id: "equipment", label: "Equipment", icon: "📦" },
    { id: "requests", label: "Requests", icon: "📋", badge: pendingRequestsCount },
    { id: "rentals", label: "Rentals", icon: "🔄" },
    { id: "overdue", label: "Overdue", icon: "⏰", badge: overdueRentalsCount, badgeColor: "red" },
    { id: "semesters", label: "Sessions", icon: "📅" },
    { id: "transactions", label: "Transactions", icon: "📊" },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Club Member Dashboard
        </h1>
        <p className="text-gray-600">Welcome, {profile.name}!</p>
        
        {dashboardStats && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{dashboardStats.totalEquipment}</div>
              <div className="text-sm text-blue-800">Equipment Items</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{dashboardStats.activeRentals}</div>
              <div className="text-sm text-green-800">Active Rentals</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{dashboardStats.pendingRequests}</div>
              <div className="text-sm text-yellow-800">Pending Requests</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{dashboardStats.overdueRentals}</div>
              <div className="text-sm text-red-800">Overdue Items</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{dashboardStats.totalStudents}</div>
              <div className="text-sm text-purple-800">Students</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{dashboardStats.pendingUsers}</div>
              <div className="text-sm text-gray-800">Pending Users</div>
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
