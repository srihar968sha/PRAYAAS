import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function RequestsManagement() {
  const [selectedTab, setSelectedTab] = useState("pending");
  const [reviewingRequest, setReviewingRequest] = useState<any>(null);
  const [reviewReason, setReviewReason] = useState("");

  const pendingRequests = useQuery(api.requests.getPendingRequests) || [];
  const allRequests = useQuery(api.requests.getAllRequests) || [];
  const reviewRequest = useMutation(api.requests.reviewRequest);

  const approvedRequests = allRequests.filter(req => req.status === "approved");
  const rejectedRequests = allRequests.filter(req => req.status === "rejected");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleReview = async (requestId: any, status: "approved" | "rejected") => {
    try {
      await reviewRequest({
        requestId,
        status,
        reason: reviewReason.trim() || undefined,
      });
      toast.success(`Request ${status} successfully!`);
      setReviewingRequest(null);
      setReviewReason("");
    } catch (error) {
      toast.error("Failed to review request: " + (error as Error).message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const tabs = [
    { id: "pending", label: "Pending", count: pendingRequests.length },
    { id: "approved", label: "Approved", count: approvedRequests.length },
    { id: "rejected", label: "Rejected", count: rejectedRequests.length },
  ];

  const getCurrentRequests = () => {
    switch (selectedTab) {
      case "pending":
        return pendingRequests;
      case "approved":
        return approvedRequests;
      case "rejected":
        return rejectedRequests;
      default:
        return [];
    }
  };

  const currentRequests = getCurrentRequests();

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Equipment Requests</h2>

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
        {currentRequests.map((request) => (
          <div key={request._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {request.equipment?.name}
                </h3>
                <p className="text-sm text-gray-500">{request.equipment?.category}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Student</p>
                <p className="font-medium">{request.student?.name}</p>
                <p className="text-xs text-gray-500">{request.student?.studentId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Quantity</p>
                <p className="font-medium">{request.quantity}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Session</p>
                <p className="font-medium">{request.semester?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Request Date</p>
                <p className="font-medium">{formatDate(request.requestDate)}</p>
              </div>
            </div>

            {request.reason && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">
                  {request.status === "rejected" ? "Rejection Reason:" : "Note:"}
                </p>
                <p className="text-sm text-gray-800">{request.reason}</p>
              </div>
            )}

            {request.reviewer && (
              <div className="mt-4 text-sm text-gray-600">
                Reviewed by: <span className="font-medium">{request.reviewer.name}</span>
                {request.reviewDate && (
                  <span className="ml-2">on {formatDate(request.reviewDate)}</span>
                )}
              </div>
            )}

            {request.status === "pending" && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setReviewingRequest({ ...request, action: "approve" })}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  Approve
                </button>
                <button
                  onClick={() => setReviewingRequest({ ...request, action: "reject" })}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {currentRequests.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No {selectedTab} Requests
          </h3>
          <p className="text-gray-600">
            There are no {selectedTab} equipment requests at the moment.
          </p>
        </div>
      )}

      {/* Review Modal */}
      {reviewingRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {reviewingRequest.action === "approve" ? "Approve" : "Reject"} Request
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Student:</p>
              <p className="font-medium">{reviewingRequest.student?.name}</p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Equipment:</p>
              <p className="font-medium">{reviewingRequest.equipment?.name}</p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Quantity:</p>
              <p className="font-medium">{reviewingRequest.quantity}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {reviewingRequest.action === "approve" ? "Note (optional):" : "Rejection reason:"}
              </label>
              <textarea
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder={
                  reviewingRequest.action === "approve" 
                    ? "Optional note for the student..."
                    : "Please provide a reason for rejection..."
                }
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setReviewingRequest(null);
                  setReviewReason("");
                }}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReview(
                  reviewingRequest._id, 
                  reviewingRequest.action === "approve" ? "approved" : "rejected"
                )}
                className={`flex-1 py-2 px-4 rounded-lg text-white ${
                  reviewingRequest.action === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {reviewingRequest.action === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
