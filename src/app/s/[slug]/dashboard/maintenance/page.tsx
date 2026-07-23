import React from "react";
import { Wrench, Plus, FileText, CreditCard, PenTool } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Section */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-slate-200/60 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-start sm:items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-sm">
            <Wrench className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
              Maintenance & Billing
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Manage society dues, utility payments, and repair tasks
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-medium text-sm transition-all duration-200 shadow-sm active:scale-95 cursor-pointer">
            <FileText className="h-4 w-4 text-slate-500" />
            <span>View Reports</span>
          </button>
          <button className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-all duration-200 shadow-sm shadow-slate-900/20 active:scale-95 cursor-pointer">
            <Plus className="h-4 w-4" />
            <span>Generate Bill</span>
          </button>
        </div>
      </div>

      {/* Stats/Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75 fill-mode-both">
        {[
          { title: "Pending Dues", value: "₹0", icon: CreditCard, color: "text-rose-600", bg: "bg-rose-50" },
          { title: "Active Maintenance", value: "0 Tasks", icon: PenTool, color: "text-amber-600", bg: "bg-amber-50" },
          { title: "Total Collection", value: "₹0", icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                <p className="text-2xl font-semibold text-slate-900 mt-0.5">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl border border-slate-200/60 p-12 sm:p-20 text-center shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both flex flex-col items-center justify-center min-h-[400px]">
        <div className="h-20 w-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 shadow-inner">
          <Wrench className="h-10 w-10 text-slate-400" strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2 tracking-tight">Maintenance & Dues Hub</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed mb-8">
          This section is ready for flat maintenance billing statements, payment gateway history, and asset maintenance logs. We&apos;re building something great.
        </p>
        <button className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-medium text-sm transition-all duration-200 shadow-sm active:scale-95 cursor-pointer">
          <Plus className="h-4 w-4" />
          <span>Create First Record</span>
        </button>
      </div>
    </div>
  );
}
