import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function MyRentals() {
  const myRentals = useQuery(api.rentals.getMyRentals) || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const activeRentals = myRentals.filter(rental => !rental.isReturned);
  const returnedRentals = myRentals.filter(rental => rental.isReturned);

  if (myRentals.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📦</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Rentals Yet</h3>
        <p className="text-gray-600">
          You don't have any equipment rentals. Submit a request to get started!
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Equipment Rentals</h2>
      
      {/* Active Rentals */}
      {activeRentals.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Rentals</h3>
          <div className="space-y-4">
            {activeRentals.map((rental) => (
              <div key={rental._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {rental.equipment?.name}
                    </h4>
                    <p className="text-sm text-gray-500">{rental.equipment?.category}</p>
                  </div>
                  <div className="text-right">
                    {rental.isOverdue && (
                      <span className="inline-block px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full mb-2">
                        Overdue
                      </span>
                    )}
                    <p className="text-sm text-gray-600">
                      Due: {formatDate(rental.dueDate)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Quantity</p>
                    <p className="font-medium">{rental.quantity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Session</p>
                    <p className="font-medium">{rental.semester?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-medium">{formatDate(rental.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Rented By</p>
                    <p className="font-medium">{rental.rentedBy?.name}</p>
                  </div>
                </div>

                {rental.isOverdue && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-red-600 text-lg mr-2">⚠️</span>
                      <div>
                        <p className="text-red-800 font-semibold">
                          Overdue by {rental.overdueDays} day{rental.overdueDays > 1 ? 's' : ''}
                        </p>
                        <p className="text-red-700 text-sm">
                          Late fee: ₹{rental.calculatedLateFee}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Returned Rentals */}
      {returnedRentals.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rental History</h3>
          <div className="space-y-4">
            {returnedRentals.map((rental) => (
              <div key={rental._id} className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {rental.equipment?.name}
                    </h4>
                    <p className="text-sm text-gray-500">{rental.equipment?.category}</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    Returned
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Quantity</p>
                    <p className="font-medium">{rental.quantity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-medium">{formatDate(rental.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Due Date</p>
                    <p className="font-medium">{formatDate(rental.dueDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Return Date</p>
                    <p className="font-medium">{rental.returnDate ? formatDate(rental.returnDate) : 'N/A'}</p>
                  </div>
                  {rental.lateFee && rental.lateFee > 0 && (
                    <div>
                      <p className="text-sm text-gray-600">Late Fee</p>
                      <p className="font-medium text-red-600">₹{rental.lateFee}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
