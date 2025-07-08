import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";

export function UserSetup() {
  const [role, setRole] = useState<"student" | "member">("student");
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createProfile = useMutation(api.users.createUserProfile);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (role === "student" && !studentId.trim()) {
      toast.error("Student ID is required for students");
      return;
    }

    setIsSubmitting(true);
    try {
      await createProfile({
        role,
        name: name.trim(),
        studentId: role === "student" ? studentId.trim() : undefined,
        phone: phone.trim() || undefined,
        department: department.trim() || undefined,
        year: year.trim() || undefined,
      });
      toast.success("Profile created successfully! Please wait for approval.");
    } catch (error) {
      toast.error("Failed to create profile: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[600px] p-8">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-4">Complete Your Profile</h1>
          <p className="text-secondary">Please provide your details to access the equipment portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I am a:
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="student"
                  checked={role === "student"}
                  onChange={(e) => setRole(e.target.value as "student")}
                  className="mr-2"
                />
                Student
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="member"
                  checked={role === "member"}
                  onChange={(e) => setRole(e.target.value as "member")}
                  className="mr-2"
                />
                Club Member
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="auth-input-field"
              placeholder="Enter your full name"
              required
            />
          </div>

          {role === "student" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student ID *
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="auth-input-field"
                placeholder="Enter your student ID"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="auth-input-field"
              placeholder="Enter your phone number"
            />
          </div>

          {role === "student" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="auth-input-field"
                  placeholder="e.g., Computer Science"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="auth-input-field"
                >
                  <option value="">Select year</option>
                  <option value="1st">1st Year</option>
                  <option value="2nd">2nd Year</option>
                  <option value="3rd">3rd Year</option>
                  <option value="4th">4th Year</option>
                  <option value="Graduate">Graduate</option>
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="auth-button"
          >
            {isSubmitting ? "Creating Profile..." : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}
