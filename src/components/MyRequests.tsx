import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function MyRequests() {
  const myRequests = useQuery(api.requests.getMyRequests) || [];

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (myRequests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📋</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Requests Yet</h3>
        <p className="text-gray-600">
          You haven't submitted any equipment requests. Browse equipment to get started!
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Equipment Requests</h2>
      
      <div className="space-y-4">
        {myRequests.map((request) => (
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
              {request.reviewDate && (
                <div>
                  <p className="text-sm text-gray-600">Review Date</p>
                  <p className="font-medium">{formatDate(request.reviewDate)}</p>
                </div>
              )}
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
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
