import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function EquipmentBrowser() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [requestQuantity, setRequestQuantity] = useState(1);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const equipment = useQuery(api.equipment.getAllEquipment) || [];
  const categories = useQuery(api.equipment.getEquipmentCategories) || [];
  const activeSemester = useQuery(api.semesters.getActiveSemester);
  const submitRequest = useMutation(api.requests.submitRequest);

  const filteredEquipment = selectedCategory === "all" 
    ? equipment 
    : equipment.filter(item => item.category === selectedCategory);

  const handleRequestEquipment = (item: any) => {
    if (!activeSemester) {
      toast.error("No active session found. Please contact the club admin.");
      return;
    }
    setSelectedEquipment(item);
    setRequestQuantity(1);
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async () => {
    if (!selectedEquipment || !activeSemester) return;

    try {
      await submitRequest({
        equipmentId: selectedEquipment._id,
        quantity: requestQuantity,
        semesterId: activeSemester._id,
      });
      toast.success("Equipment request submitted successfully!");
      setShowRequestModal(false);
      setSelectedEquipment(null);
    } catch (error) {
      toast.error("Failed to submit request: " + (error as Error).message);
    }
  };

  if (!activeSemester) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📅</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Session</h3>
        <p className="text-gray-600">
          There is no active session currently. Please contact the club admin to set up a session before requesting equipment.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Browse Equipment</h2>
        <p className="text-gray-600 mb-4">
          Current session: <span className="font-semibold">{activeSemester.name}</span>
        </p>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              selectedCategory === "all"
                ? "bg-blue-100 text-blue-800 border border-blue-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedCategory === category
                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEquipment.map((item) => (
          <div key={item._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-500">{item.category}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                item.availableQuantity > 0
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}>
                {item.availableQuantity > 0 ? "Available" : "Out of Stock"}
              </span>
            </div>

            {item.description && (
              <p className="text-gray-600 text-sm mb-4">{item.description}</p>
            )}

            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Available:</span> {item.availableQuantity} / {item.totalQuantity}
              </div>
            </div>

            <button
              onClick={() => handleRequestEquipment(item)}
              disabled={item.availableQuantity === 0}
              className={`w-full py-2 px-4 rounded-lg text-sm font-medium ${
                item.availableQuantity > 0
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {item.availableQuantity > 0 ? "Request Equipment" : "Out of Stock"}
            </button>
          </div>
        ))}
      </div>

      {filteredEquipment.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Equipment Found</h3>
          <p className="text-gray-600">
            {selectedCategory === "all" 
              ? "No equipment is currently available."
              : `No equipment found in the "${selectedCategory}" category.`
            }
          </p>
        </div>
      )}

      {/* Request Modal */}
      {showRequestModal && selectedEquipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Request Equipment
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Equipment:</p>
              <p className="font-medium">{selectedEquipment.name}</p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Session:</p>
              <p className="font-medium">{activeSemester.name}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity (Available: {selectedEquipment.availableQuantity})
              </label>
              <input
                type="number"
                min="1"
                max={selectedEquipment.availableQuantity}
                value={requestQuantity}
                onChange={(e) => setRequestQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRequestModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRequest}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
