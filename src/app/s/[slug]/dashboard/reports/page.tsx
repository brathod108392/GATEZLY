import React from "react";
import { BarChart3, Download } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <span>Reports & Analytics</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gate traffic statistics, visitor entry audit logs, and maintenance financial summaries.
          </p>
        </div>
        <button className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition cursor-pointer">
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
        <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <BarChart3 className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Reports & Analytics Shell</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          This section is ready for chart visualizations, PDF export reports, and gate audit analytics.
        </p>
      </div>
    </div>
  );
}
