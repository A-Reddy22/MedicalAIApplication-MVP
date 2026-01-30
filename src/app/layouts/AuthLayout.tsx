import { Outlet } from "react-router-dom";
import { GraduationCap } from "lucide-react";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <GraduationCap className="w-9 h-9 text-blue-600" />
          <div>
            <h1 className="text-2xl font-semibold">MedAdmit AI</h1>
            <p className="text-sm text-gray-600">Your personalized med school admissions coach.</p>
          </div>
        </div>
        <div className="bg-white shadow-lg rounded-2xl p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
