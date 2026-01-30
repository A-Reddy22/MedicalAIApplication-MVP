import { MessageSquare } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-blue-500" />
        <h2 className="mb-2">Med School Chat Agent</h2>
        <p className="text-gray-600">Coming soon - AI-powered admissions Q&A</p>
      </div>
    </div>
  );
}
