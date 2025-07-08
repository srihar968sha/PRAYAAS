import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function TransactionHistory() {
  const [selectedActionType, setSelectedActionType] = useState<string>("all");
  const [limit, setLimit] = useState(50);

  const transactionHistory = useQuery(api.transactions.getTransactionHistory, {
    limit,
    actionType: selectedActionType === "all" ? undefined : selectedActionType as any,
  }) || [];

  const actionTypes = [
    { value: "all", label: "All Actions" },
    { value: "request_submitted", label: "Request Submitted" },
    { value: "request_approved", label: "Request Approved" },
    { value: "request_rejected", label: "Request Rejected" },
    { value: "equipment_rented", label: "Equipment Rented" },
    { value: "equipment_returned", label: "Equipment Returned" },
    { value: "user_approved", label: "User Approved" },
    { value: "user_rejected", label: "User Rejected" },
    { value: "equipment_added", label: "Equipment Added" },
    { value: "equipment_updated", label: "Equipment Updated" },
    { value: "semester_created", label: "Semester Created" },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "request_submitted":
        return "📝";
      case "request_approved":
        return "✅";
      case "request_rejected":
        return "❌";
      case "equipment_rented":
        return "📤";
      case "equipment_returned":
        return "📥";
      case "user_approved":
        return "👤";
      case "user_rejected":
        return "🚫";
      case "equipment_added":
        return "➕";
      case "equipment_updated":
        return "✏️";
      case "semester_created":
        return "📅";
      default:
        return "📋";
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case "request_approved":
      case "equipment_returned":
      case "user_approved":
        return "text-green-600";
      case "request_rejected":
      case "user_rejected":
        return "text-red-600";
      case "equipment_rented":
        return "text-blue-600";
      case "request_submitted":
        return "text-yellow-600";
      case "equipment_added":
      case "equipment_updated":
      case "semester_created":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Transaction History</h2>

      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Action Type
          </label>
          <select
            value={selectedActionType}
            onChange={(e) => setSelectedActionType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {actionTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Records
          </label>
          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={25}>25 records</option>
            <option value={50}>50 records</option>
            <option value={100}>100 records</option>
            <option value={200}>200 records</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactionHistory.map((transaction) => (
                <tr key={transaction._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">
                        {getActionIcon(transaction.actionType)}
                      </span>
                      <span className={`text-sm font-medium ${getActionColor(transaction.actionType)}`}>
                        {actionTypes.find(type => type.value === transaction.actionType)?.label || transaction.actionType}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {transaction.user?.name || 'Unknown User'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.user?.role || 'Unknown Role'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {transaction.details}
                    </div>
                    {transaction.metadata && (
                      <div className="text-xs text-gray-500 mt-1">
                        {transaction.metadata.equipmentName && (
                          <span>Equipment: {transaction.metadata.equipmentName} </span>
                        )}
                        {transaction.metadata.studentName && (
                          <span>Student: {transaction.metadata.studentName} </span>
                        )}
                        {transaction.metadata.quantity && (
                          <span>Qty: {transaction.metadata.quantity} </span>
                        )}
                        {transaction.metadata.lateFee && (
                          <span>Late Fee: ₹{transaction.metadata.lateFee}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(transaction.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {transactionHistory.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Transactions Found</h3>
          <p className="text-gray-600">
            {selectedActionType === "all" 
              ? "No transaction history available."
              : `No transactions found for the selected action type.`
            }
          </p>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500 text-center">
        Showing {transactionHistory.length} of {limit} records
      </div>
    </div>
  );
}
