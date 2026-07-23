import React from "react";
import { UserCheck, QrCode } from "lucide-react";

export default function VisitorsPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/60 p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all hover:shadow-md">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <UserCheck className="h-6 w-6" />
            </div>
            <span>Visitors & Gate Entry</span>
          </h1>
          <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
            Real-time visitor access logs, pre-approvals, and digital QR fast pass generation.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm shadow-sm transition-all active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:ring-offset-2">
          <QrCode className="h-4 w-4" />
          <span>Issue Fast Pass</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/60 p-16 text-center space-y-4 shadow-sm relative overflow-hidden group transition-all hover:shadow-md">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="relative z-10">
          <div className="h-16 w-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
            <UserCheck className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Visitors Command Shell</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
            This section is ready for live ANPR license plate scans, visitor check-in logs, and gate security clearance feeds.
          </p>
        </div>
      </div>
    </div>
  );
}
