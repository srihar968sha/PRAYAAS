import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function RentalsManagement() {
  const [selectedTab, setSelectedTab] = useState("active");
  const [showDirectRentalModal, setShowDirectRentalModal] = useState(false);
  const [returningRental, setReturningRental] = useState<any>(null);
  const [lateFee, setLateFee] = useState(0);

  const allRentals = useQuery(api.rentals.getAllRentals) || [];
  const returnEquipment = useMutation(api.rentals.returnEquipment);
  const createDirectRental = useMutation(api.rentals.createDirectRental);

  const activeRentals = allRentals.filter(rental => !rental.isReturned);
  const returnedRentals = allRentals.filter(rental => rental.isReturned);
  const overdueRentals = activeRentals.filter(rental => rental.isOverdue);

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

  const tabs = [
    { id: "active", label: "Active Rentals", count: activeRentals.length },
    { id: "overdue", label: "Overdue", count: overdueRentals.length },
    { id: "returned", label: "Returned", count: returnedRentals.length },
  ];

  const getCurrentRentals = () => {
    switch (selectedTab) {
      case "active":
        return activeRentals;
      case "overdue":
        return overdueRentals;
      case "returned":
        return returnedRentals;
      default:
        return [];
    }
  };

  const currentRentals = getCurrentRentals();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Rentals Management</h2>
        <button
          onClick={() => setShowDirectRentalModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>➕</span>
          Direct Rental
        </button>
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
        {currentRentals.map((rental) => (
          <div key={rental._id} className={`bg-white rounded-lg shadow-sm border p-6 ${
            rental.isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {rental.equipment?.name}
                </h3>
                <p className="text-sm text-gray-500">{rental.equipment?.category}</p>
              </div>
              <div className="text-right">
                {rental.isOverdue && (
                  <span className="inline-block px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full mb-2">
                    Overdue
                  </span>
                )}
                {rental.isReturned && (
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full mb-2">
                    Returned
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Student</p>
                <p className="font-medium">{rental.student?.name}</p>
                <p className="text-xs text-gray-500">{rental.student?.studentId}</p>
              </div>
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
                <p className="text-sm text-gray-600">Session</p>
                <p className="font-medium">{rental.semester?.name}</p>
              </div>
            </div>

            {rental.isOverdue && !rental.isReturned && (
              <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-800 font-semibold">
                      Overdue by {rental.overdueDays} day{rental.overdueDays > 1 ? 's' : ''}
                    </p>
                    <p className="text-red-700 text-sm">
                      Calculated late fee: ₹{rental.calculatedLateFee}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {rental.isReturned && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Return Date</p>
                  <p className="font-medium">{rental.returnDate ? formatDate(rental.returnDate) : 'N/A'}</p>
                </div>
                {rental.lateFee && rental.lateFee > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Late Fee Collected</p>
                    <p className="font-medium text-red-600">₹{rental.lateFee}</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 text-sm text-gray-600">
              Rented by: <span className="font-medium">{rental.rentedBy?.name}</span>
            </div>

            {!rental.isReturned && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    setReturningRental(rental);
                    setLateFee(rental.calculatedLateFee || 0);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  Mark as Returned
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {currentRentals.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No {selectedTab} Rentals
          </h3>
          <p className="text-gray-600">
            There are no {selectedTab} rentals at the moment.
          </p>
        </div>
      )}

      {/* Return Modal */}
      {returningRental && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Return Equipment
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Student:</p>
              <p className="font-medium">{returningRental.student?.name}</p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Equipment:</p>
              <p className="font-medium">{returningRental.equipment?.name}</p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Quantity:</p>
              <p className="font-medium">{returningRental.quantity}</p>
            </div>

            {returningRental.isOverdue && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-semibold mb-2">
                  Overdue by {returningRental.overdueDays} day{returningRental.overdueDays > 1 ? 's' : ''}
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Late Fee (₹)
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
                    Suggested: ₹{returningRental.calculatedLateFee}
                  </p>
                </div>
              </div>
            )}

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
                className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Return Equipment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Rental Modal */}
      {showDirectRentalModal && (
        <DirectRentalModal
          onClose={() => setShowDirectRentalModal(false)}
          onSave={async (data) => {
            try {
              await createDirectRental(data);
              toast.success("Direct rental created successfully!");
              setShowDirectRentalModal(false);
            } catch (error) {
              toast.error("Failed to create rental: " + (error as Error).message);
            }
          }}
        />
      )}
    </div>
  );
}

interface DirectRentalModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
}

function DirectRentalModal({ onClose, onSave }: DirectRentalModalProps) {
  const [formData, setFormData] = useState({
    studentId: "",
    equipmentId: "",
    semesterId: "",
    quantity: 1,
    customDueDate: "",
  });

  const students = useQuery(api.users.getAllUsers) || [];
  const equipment = useQuery(api.equipment.getAllEquipment) || [];
  const semesters = useQuery(api.semesters.getAllSemesters) || [];

  const approvedStudents = students.filter(user => user.role === "student" && user.isApproved);
  const selectedEquipment = equipment.find(eq => eq._id === formData.equipmentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.equipmentId || !formData.semesterId) {
      toast.error("Please fill in all required fields");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Create Direct Rental
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student *
            </label>
            <select
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a student</option>
              {approvedStudents.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name} ({student.studentId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equipment *
            </label>
            <select
              value={formData.equipmentId}
              onChange={(e) => setFormData({ ...formData, equipmentId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select equipment</option>
              {equipment.filter(eq => eq.isActive && eq.availableQuantity > 0).map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name} (Available: {item.availableQuantity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session *
            </label>
            <select
              value={formData.semesterId}
              onChange={(e) => setFormData({ ...formData, semesterId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select session</option>
              {semesters.map((semester) => (
                <option key={semester._id} value={semester._id}>
                  {semester.name} {semester.isActive && "(Active)"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity *
            </label>
            <input
              type="number"
              min="1"
              max={selectedEquipment?.availableQuantity || 1}
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            {selectedEquipment && (
              <p className="text-xs text-gray-500 mt-1">
                Available: {selectedEquipment.availableQuantity}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Due Date (optional)
            </label>
            <input
              type="date"
              value={formData.customDueDate}
              onChange={(e) => setFormData({ ...formData, customDueDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to use session end date
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Rental
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
