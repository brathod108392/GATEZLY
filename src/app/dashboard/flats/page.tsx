import React from "react";
import { Building2, Plus } from "lucide-react";

export default function FlatsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            <span>Flats & Blocks</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Overview of society wings, flat allocations, and occupancy status.
          </p>
        </div>
        <button className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition cursor-pointer">
          <Plus className="h-4 w-4" />
          <span>Add Flat Unit</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
        <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <Building2 className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Flats & Wings Management Shell</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          This section is ready for building block layouts, unit mapping, and owner/tenant occupancy details.
        </p>
      </div>
    </div>
  );
}
