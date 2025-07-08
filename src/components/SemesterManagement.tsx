import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function SemesterManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSemester, setEditingSemester] = useState<any>(null);

  const semesters = useQuery(api.semesters.getAllSemesters) || [];
  const createSemester = useMutation(api.semesters.createSemester);
  const updateSemester = useMutation(api.semesters.updateSemester);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleAddSemester = () => {
    setEditingSemester(null);
    setShowAddModal(true);
  };

  const handleEditSemester = (semester: any) => {
    setEditingSemester(semester);
    setShowAddModal(true);
  };

  const activeSemester = semesters.find(s => s.isActive);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Session Management</h2>
        <button
          onClick={handleAddSemester}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>➕</span>
          Add Session
        </button>
      </div>

      {activeSemester && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-green-600 text-xl mr-2">✅</span>
            <div>
              <h3 className="text-green-800 font-semibold">Active Session</h3>
              <p className="text-green-700">
                {activeSemester.name} ({activeSemester.code}) - {formatDate(activeSemester.startDate)} to {formatDate(activeSemester.endDate)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {semesters.map((semester) => (
          <div key={semester._id} className={`bg-white rounded-lg shadow-sm border p-6 ${
            semester.isActive ? 'border-green-200 bg-green-50' : 'border-gray-200'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  {semester.name}
                  {semester.isActive && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Active
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-500">Code: {semester.code}</p>
              </div>
              <button
                onClick={() => handleEditSemester(semester)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Edit
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Start Date</p>
                <p className="font-medium">{formatDate(semester.startDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">End Date</p>
                <p className="font-medium">{formatDate(semester.endDate)}</p>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Created: {formatDate(semester._creationTime.toString())}
            </div>
          </div>
        ))}
      </div>

      {semesters.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📅</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sessions Created</h3>
          <p className="text-gray-600">
            Create your first session to start managing equipment rentals.
          </p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <SemesterModal
          semester={editingSemester}
          onClose={() => setShowAddModal(false)}
          onSave={async (data) => {
            try {
              if (editingSemester) {
                await updateSemester({
                  semesterId: editingSemester._id,
                  ...data,
                });
                toast.success("Session updated successfully!");
              } else {
                await createSemester(data);
                toast.success("Session created successfully!");
              }
              setShowAddModal(false);
            } catch (error) {
              toast.error("Failed to save session: " + (error as Error).message);
            }
          }}
        />
      )}
    </div>
  );
}

interface SemesterModalProps {
  semester?: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

function SemesterModal({ semester, onClose, onSave }: SemesterModalProps) {
  const [formData, setFormData] = useState({
    code: semester?.code || "",
    name: semester?.name || "",
    startDate: semester?.startDate || "",
    endDate: semester?.endDate || "",
    setAsActive: semester?.isActive || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim() || !formData.startDate || !formData.endDate) {
      toast.error("All fields are required");
      return;
    }
    
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.error("End date must be after start date");
      return;
    }
    
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {semester ? "Edit Session" : "Add New Session"}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Code *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., W25, S25"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Winter 2025"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date *
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date *
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="setAsActive"
              checked={formData.setAsActive}
              onChange={(e) => setFormData({ ...formData, setAsActive: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="setAsActive" className="text-sm text-gray-700">
              Set as active session
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
              {semester ? "Update" : "Create"} Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
