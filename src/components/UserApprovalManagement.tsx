import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function UserApprovalManagement() {
  const [selectedTab, setSelectedTab] = useState("pending");
  const [approvingUser, setApprovingUser] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const pendingUsers = useQuery(api.users.getPendingUsers) || [];
  const allUsers = useQuery(api.users.getAllUsers) || [];
  const updateUserApproval = useMutation(api.users.updateUserApproval);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleApproval = async (isApproved: boolean) => {
    if (!approvingUser) return;

    try {
      await updateUserApproval({
        profileId: approvingUser._id,
        isApproved,
        reason: reason.trim() || undefined,
      });
      toast.success(`User ${isApproved ? 'approved' : 'rejected'} successfully!`);
      setApprovingUser(null);
      setReason("");
    } catch (error) {
      toast.error("Failed to update user approval: " + (error as Error).message);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "student":
        return "bg-blue-100 text-blue-800";
      case "member":
        return "bg-green-100 text-green-800";
      case "admin":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const tabs = [
    { id: "pending", label: "Pending Approval", count: pendingUsers.length },
    { id: "approved", label: "Approved Users", count: allUsers.length },
  ];

  // Filter and search users
  const baseUsers = selectedTab === "pending" ? pendingUsers : allUsers;
  const filteredUsers = baseUsers.filter(user => {
    const matchesSearch = searchTerm === "" || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.studentId && user.studentId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const currentUsers = filteredUsers;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        {selectedTab === "pending" && pendingUsers.length > 0 && (
          <div className="flex items-center text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
            <span className="mr-2">⚠️</span>
            {pendingUsers.length} user{pendingUsers.length > 1 ? 's' : ''} awaiting approval
          </div>
        )}
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by name, email, or student ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="member">Club Members</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-4">
        {currentUsers.map((user) => (
          <div key={user._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {user.studentId && (
                <div>
                  <p className="text-sm text-gray-600">Student ID</p>
                  <p className="font-medium">{user.studentId}</p>
                </div>
              )}
              {user.phone && (
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
              )}
              {user.department && (
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-medium">{user.department}</p>
                </div>
              )}
              {user.year && (
                <div>
                  <p className="text-sm text-gray-600">Year</p>
                  <p className="font-medium">{user.year}</p>
                </div>
              )}
            </div>

            <div className="text-sm text-gray-600 mb-4">
              Registration Date: {formatDate(user._creationTime.toString())}
            </div>

            {selectedTab === "pending" && (
              <div className="flex gap-2">
                <button
                  onClick={() => setApprovingUser({ ...user, action: "approve" })}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  Approve
                </button>
                <button
                  onClick={() => setApprovingUser({ ...user, action: "reject" })}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                >
                  Reject
                </button>
              </div>
            )}

            {selectedTab === "approved" && (
              <div className="flex items-center text-sm text-green-600">
                <span className="mr-2">✅</span>
                Approved User
              </div>
            )}
          </div>
        ))}
      </div>

      {currentUsers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">
            {searchTerm || roleFilter !== "all" ? "🔍" : "👥"}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm || roleFilter !== "all" 
              ? "No Users Found" 
              : selectedTab === "pending" ? "🎉 No Pending Users" : "No Approved Users"
            }
          </h3>
          <p className="text-gray-600">
            {searchTerm || roleFilter !== "all"
              ? "Try adjusting your search or filter criteria."
              : selectedTab === "pending" 
                ? "All users have been processed! Great job keeping up with approvals."
                : "No approved users found."
            }
          </p>
        </div>
      )}

      {/* Approval Modal */}
      {approvingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {approvingUser.action === "approve" ? "Approve" : "Reject"} User
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">User:</p>
              <p className="font-medium">{approvingUser.name}</p>
              <p className="text-sm text-gray-500">{approvingUser.email}</p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Role:</p>
              <p className="font-medium">{approvingUser.role}</p>
            </div>

            {approvingUser.studentId && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Student ID:</p>
                <p className="font-medium">{approvingUser.studentId}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {approvingUser.action === "approve" ? "Note (optional):" : "Rejection reason:"}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder={
                  approvingUser.action === "approve" 
                    ? "Optional note for the user..."
                    : "Please provide a reason for rejection..."
                }
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setApprovingUser(null);
                  setReason("");
                }}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApproval(approvingUser.action === "approve")}
                className={`flex-1 py-2 px-4 rounded-lg text-white ${
                  approvingUser.action === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {approvingUser.action === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
