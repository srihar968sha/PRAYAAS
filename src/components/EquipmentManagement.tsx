import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function EquipmentManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const equipment = useQuery(api.equipment.getAllEquipment) || [];
  const categories = useQuery(api.equipment.getEquipmentCategories) || [];
  const addEquipment = useMutation(api.equipment.addEquipment);
  const updateEquipment = useMutation(api.equipment.updateEquipment);

  const filteredEquipment = selectedCategory === "all" 
    ? equipment 
    : equipment.filter(item => item.category === selectedCategory);

  const handleAddEquipment = () => {
    setEditingEquipment(null);
    setShowAddModal(true);
  };

  const handleEditEquipment = (item: any) => {
    setEditingEquipment(item);
    setShowAddModal(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Equipment Management</h2>
        <button
          onClick={handleAddEquipment}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>➕</span>
          Add Equipment
        </button>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              selectedCategory === "all"
                ? "bg-blue-100 text-blue-800 border border-blue-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Categories ({equipment.length})
          </button>
          {categories.map((category) => {
            const count = equipment.filter(item => item.category === category).length;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  selectedCategory === category
                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category} ({count})
              </button>
            );
          })}
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
              <button
                onClick={() => handleEditEquipment(item)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Edit
              </button>
            </div>

            {item.description && (
              <p className="text-gray-600 text-sm mb-4">{item.description}</p>
            )}

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Quantity:</span>
                <span className="font-medium">{item.totalQuantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Available:</span>
                <span className={`font-medium ${
                  item.availableQuantity > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {item.availableQuantity}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Currently Rented:</span>
                <span className="font-medium">{item.totalQuantity - item.availableQuantity}</span>
              </div>
            </div>

            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ 
                  width: `${(item.availableQuantity / item.totalQuantity) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {filteredEquipment.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Equipment Found</h3>
          <p className="text-gray-600">
            {selectedCategory === "all" 
              ? "No equipment has been added yet."
              : `No equipment found in the "${selectedCategory}" category.`
            }
          </p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <EquipmentModal
          equipment={editingEquipment}
          onClose={() => setShowAddModal(false)}
          onSave={async (data) => {
            try {
              if (editingEquipment) {
                await updateEquipment({
                  equipmentId: editingEquipment._id,
                  ...data,
                });
                toast.success("Equipment updated successfully!");
              } else {
                await addEquipment(data);
                toast.success("Equipment added successfully!");
              }
              setShowAddModal(false);
            } catch (error) {
              toast.error("Failed to save equipment: " + (error as Error).message);
            }
          }}
        />
      )}
    </div>
  );
}

interface EquipmentModalProps {
  equipment?: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

function EquipmentModal({ equipment, onClose, onSave }: EquipmentModalProps) {
  const [formData, setFormData] = useState({
    name: equipment?.name || "",
    category: equipment?.category || "",
    description: equipment?.description || "",
    totalQuantity: equipment?.totalQuantity || 1,
    isActive: equipment?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.category.trim()) {
      toast.error("Name and category are required");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {equipment ? "Edit Equipment" : "Add New Equipment"}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equipment Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Scientific Calculator"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Calculators"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Optional description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Quantity *
            </label>
            <input
              type="number"
              min="1"
              value={formData.totalQuantity}
              onChange={(e) => setFormData({ ...formData, totalQuantity: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Active (available for rental)
            </label>
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
              {equipment ? "Update" : "Add"} Equipment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
