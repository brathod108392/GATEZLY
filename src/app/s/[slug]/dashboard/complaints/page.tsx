import React from "react";
import { MessageSquareWarning, Plus } from "lucide-react";

export default function ComplaintsPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/60 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2">
            <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MessageSquareWarning className="h-5 w-5" />
            </div>
            <span>Complaints & Helpdesk</span>
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Resident support requests, issue ticketing, and resolution tracking.
          </p>
        </div>
        <button className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm hover:shadow transition-all hover:-translate-y-0.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2">
          <Plus className="h-4 w-4" />
          <span>New Ticket</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/60 p-12 text-center space-y-4 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both">
        <div className="h-16 w-16 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-indigo-500 flex items-center justify-center mx-auto shadow-inner">
          <MessageSquareWarning className="h-8 w-8" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-slate-900">Complaints & Helpdesk Shell</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            This section is ready for resident ticket submission, status updates (Open, In Progress, Resolved), and staff assignment.
          </p>
        </div>
      </div>
    </div>
  );
}
