export function AdminApproval() {
  return (
    <div className="flex items-center justify-center min-h-[600px] p-8">
      <div className="w-full max-w-md mx-auto text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="text-yellow-600 text-5xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Approval Pending</h2>
          <p className="text-gray-600 mb-4">
            Your account is waiting for approval from the club admin. You'll be able to access the equipment portal once your account is approved.
          </p>
          <p className="text-sm text-gray-500">
            Please contact the club admin if you have any questions.
          </p>
        </div>
      </div>
    </div>
  );
}
