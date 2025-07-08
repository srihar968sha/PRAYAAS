import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { useState } from "react";

export function OverdueManagement() {
  const [returningRental, setReturningRental] = useState<any>(null);
  const [lateFee, setLateFee] = useState(0);

  const overdueRentals = useQuery(api.rentals.getOverdueRentals) || [];
  const returnEquipment = useMutation(api.rentals.returnEquipment);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleReturn = async () => {
    if (!returningRental) return;

    try {
      await returnEquipment({
        rentalId: returningRental._id,
        lateFee: lateFee > 0 ? lateFee : undefined,
      });
      toast.success("Equipment returned successfully!");
      setReturningRental(null);
      setLateFee(0);
    } catch (error) {
      toast.error("Failed to return equipment: " + (error as Error).message);
    }
  };

  if (overdueRentals.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-green-400 text-6xl mb-4">✅</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Overdue Equipment</h3>
        <p className="text-gray-600">
          Great! All equipment is returned on time or within the due date.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Overdue Equipment</h2>
        <p className="text-gray-600 mt-2">
          {overdueRentals.length} item{overdueRentals.length > 1 ? 's are' : ' is'} overdue and need{overdueRentals.length === 1 ? 's' : ''} to be returned.
        </p>
      </div>

      <div className="space-y-4">
        {overdueRentals.map((rental) => (
          <div key={rental._id} className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {rental.equipment?.name}
                </h3>
                <p className="text-sm text-gray-500">{rental.equipment?.category}</p>
              </div>
              <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                {rental.overdueDays} day{rental.overdueDays > 1 ? 's' : ''} overdue
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Student</p>
                <p className="font-medium">{rental.student?.name}</p>
                <p className="text-xs text-gray-500">{rental.student?.studentId}</p>
                {rental.student?.phone && (
                  <p className="text-xs text-blue-600">{rental.student.phone}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">Quantity</p>
                <p className="font-medium">{rental.quantity}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Due Date</p>
                <p className="font-medium text-red-600">{formatDate(rental.dueDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Semester</p>
                <p className="font-medium">{rental.semester?.name}</p>
              </div>
            </div>

            <div className="bg-red-100 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-800 font-semibold">
                    Late Fee Calculation
                  </p>
                  <p className="text-red-700 text-sm">
                    {rental.overdueDays} days × ₹10/day = ₹{rental.calculatedLateFee}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-red-600">₹{rental.calculatedLateFee}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Rented by: <span className="font-medium">{rental.rentedBy?.name}</span>
                <br />
                Start date: {formatDate(rental.startDate)}
              </div>
              <button
                onClick={() => {
                  setReturningRental(rental);
                  setLateFee(rental.calculatedLateFee || 0);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                Process Return
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Return Modal */}
      {returningRental && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Process Overdue Return
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Student:</p>
              <p className="font-medium">{returningRental.student?.name}</p>
              <p className="text-sm text-gray-500">{returningRental.student?.studentId}</p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Equipment:</p>
              <p className="font-medium">{returningRental.equipment?.name}</p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Quantity:</p>
              <p className="font-medium">{returningRental.quantity}</p>
            </div>

            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold mb-2">
                Overdue by {returningRental.overdueDays} day{returningRental.overdueDays > 1 ? 's' : ''}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Late Fee to Collect (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={lateFee}
                  onChange={(e) => setLateFee(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter late fee amount"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Calculated: ₹{returningRental.calculatedLateFee} ({returningRental.overdueDays} days × ₹10)
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> Make sure to collect the late fee before marking as returned. 
                This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setReturningRental(null);
                  setLateFee(0);
                }}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReturn}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Return & Collect ₹{lateFee}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
