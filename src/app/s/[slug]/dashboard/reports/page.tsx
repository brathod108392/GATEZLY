import React from "react";
import { BarChart3, Download, PieChart, Activity, FileText } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center space-x-3">
            <div className="h-10 w-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
            </div>
            <span>Reports & Analytics</span>
          </h1>
          <p className="text-slate-500 text-sm max-w-xl pl-13">
            Gate traffic statistics, visitor entry audit logs, and maintenance financial summaries.
          </p>
        </div>
        <div className="flex items-center space-x-3 pl-13 sm:pl-0">
          <button className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200/60 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
            <FileText className="h-4 w-4" />
            <span>Schedule</span>
          </button>
          <button className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm shadow-indigo-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Content Shell */}
      <div className="bg-white rounded-3xl border border-slate-200/60 p-16 text-center shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-purple-50/50 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center space-y-5">
          <div className="relative">
            <div className="absolute -inset-4 bg-indigo-500/10 rounded-full blur-xl opacity-50" />
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200/60 text-indigo-600 flex items-center justify-center shadow-sm relative">
              <PieChart className="h-8 w-8" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-slate-900">Reports & Analytics Shell</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              This section is ready for chart visualizations, PDF export reports, and gate audit analytics.
            </p>
          </div>
          
          <div className="pt-4 flex items-center justify-center space-x-6 text-sm text-slate-400">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Real-time tracking</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Automated reports</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
