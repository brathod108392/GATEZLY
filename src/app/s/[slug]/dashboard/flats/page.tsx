"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSociety } from "@/components/providers/society-provider";
import { 
  Building2, 
  Home, 
  Users, 
  Key, 
  IndianRupee, 
  PieChart, 
  Download, 
  Upload, 
  Layers, 
  Plus, 
  Search, 
  ChevronDown, 
  MoreVertical,
  X,
  Car,
  UserCircle,
  FileText,
  History,
  Filter
} from "lucide-react";

// -- Types --
interface Tower { id: string; name: string; }
interface Profile { id: string; full_name: string; email: string; phone?: string; }
interface FlatResident { id: string; flat_id: string; resident_id: string; is_owner: boolean; profiles: Profile; }
interface MaintenanceBill { id: string; flat_id: string; amount_expected: number; amount_paid: number; status: string; due_date: string; }
interface Vehicle { id: string; flat_id: string; vehicle_number: string; vehicle_type: string; }
interface FamilyMember { id: string; flat_id: string; full_name: string; relation: string; }
interface Flat {
  id: string;
  tower_id: string;
  number: string;
  floor: number | null;
  towers?: { name: string };
  // Computed fields
  residents?: FlatResident[];
  maintenance?: MaintenanceBill[];
  vehicles?: Vehicle[];
  family?: FamilyMember[];
}

export default function FlatsPage() {
  const { society } = useSociety();
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [towers, setTowers] = useState<Tower[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);

  // UI States
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [selectedFlat, setSelectedFlat] = useState<Flat | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Modals & Action States
  const [isTowerModalOpen, setIsTowerModalOpen] = useState(false);
  const [isFlatModalOpen, setIsFlatModalOpen] = useState(false);
  const [towerName, setTowerName] = useState("");
  const [towerType, setTowerType] = useState("tower");
  const [flatData, setFlatData] = useState({ tower_id: "", number: "", floor: "", property_type: "flat" });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [society]);

  const fetchData = async () => {
    if (!society?.id) return;
    setLoading(true);

    try {
      // 1. Fetch Towers & Flats
      const { data: towersData } = await supabase.from("towers").select("id, name").eq("society_id", society.id).order("name");
      const { data: flatsData } = await supabase.from("flats").select("*, towers(name)").eq("society_id", society.id).order("number");
      
      // 2. Fetch all flat relationships
      const { data: frData } = await supabase.from("flat_residents").select("*, profiles(id, full_name, email, phone)").eq("society_id", society.id);
      
      // Since these tables might not exist if user hasn't run SQL, we catch errors silently for them
      let maintData: MaintenanceBill[] = [];
      let vehData: Vehicle[] = [];
      let famData: FamilyMember[] = [];
      
      try {
        const { data: m } = await supabase.from("maintenance_bills").select("*").eq("society_id", society.id);
        if (m) maintData = m;
      } catch {
        // Ignore if table doesn't exist yet
      }

      try {
        const { data: v } = await supabase.from("vehicles").select("*").eq("society_id", society.id);
        if (v) vehData = v;
      } catch {
        // Ignore if table doesn't exist yet
      }

      try {
        const { data: f } = await supabase.from("family_members").select("*").eq("society_id", society.id);
        if (f) famData = f;
      } catch {
        // Ignore if table doesn't exist yet
      }

      // Combine Data
      const formattedFlats = (flatsData || []).map(flat => ({
        ...flat,
        residents: frData?.filter(fr => fr.flat_id === flat.id) || [],
        maintenance: maintData.filter(m => m.flat_id === flat.id),
        vehicles: vehData.filter(v => v.flat_id === flat.id),
        family: famData.filter(f => f.flat_id === flat.id),
      }));

      setTowers(towersData || []);
      setFlats(formattedFlats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // -- Stats Calculations --
  const totalFlats = flats.length;
  const occupiedFlats = flats.filter(f => f.residents && f.residents.length > 0).length;
  const vacantFlats = totalFlats - occupiedFlats;
  
  let totalExpected = 0;
  let totalPaid = 0;
  let pendingDue = 0;
  flats.forEach(f => {
    f.maintenance?.forEach(m => {
      totalExpected += Number(m.amount_expected || 0);
      totalPaid += Number(m.amount_paid || 0);
      if (m.status !== 'paid') {
        pendingDue += (Number(m.amount_expected || 0) - Number(m.amount_paid || 0));
      }
    });
  });
  const collectionPercent = totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0;

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const StatCard = ({ title, value, icon: Icon, color, bg }: any) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-center items-center gap-2 h-32 relative overflow-hidden">
      <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="z-10 text-center">
        <div className="text-2xl font-bold text-slate-900 leading-none">{value}</div>
        <div className="text-xs font-medium text-slate-500 mt-1.5">{title}</div>
      </div>
    </div>
  );

  // Filter Flats
  const filteredFlats = flats.filter(f => f.number.toLowerCase().includes(search.toLowerCase()));

  // Robust Alphanumeric sort by zero-padding numbers
  const padNumbers = (str: string) => str.replace(/\d+/g, n => n.padStart(10, '0'));

  // Group by Tower and sort alphanumerically
  const groupedFlats = towers
    .map(tower => ({
      ...tower,
      flats: filteredFlats
        .filter(f => f.tower_id === tower.id)
        .sort((a, b) => padNumbers(a.number).localeCompare(padNumbers(b.number)))
    }))
    .filter(g => g.flats.length > 0)
    .sort((a, b) => padNumbers(a.name).localeCompare(padNumbers(b.name)));

  const openDrawer = (flat: Flat) => {
    setSelectedFlat(flat);
    setIsDrawerOpen(true);
    setActiveTab("overview");
  };

  const handleAddTower = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!society?.id) return;
    setActionLoading(true);
    setActionError("");
    try {
      const { error } = await supabase.from("towers").insert([{
        society_id: society.id,
        name: towerName,
        structure_type: towerType
      }]);
      if (error) throw error;
      setTowerName("");
      setIsTowerModalOpen(false);
      fetchData();
    } catch (error) {
      setActionError((error as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddFlat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!society?.id) return;
    setActionLoading(true);
    setActionError("");
    try {
      const { error } = await supabase.from("flats").insert([{
        society_id: society.id,
        tower_id: flatData.tower_id,
        number: flatData.number,
        floor: parseInt(flatData.floor) || null,
        property_type: flatData.property_type
      }]);
      if (error) throw error;
      setFlatData({ tower_id: "", number: "", floor: "", property_type: "flat" });
      setIsFlatModalOpen(false);
      fetchData();
    } catch (error) {
      setActionError((error as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 relative overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-indigo-600"/> Flats & Towers
          </h1>
          <p className="text-slate-500 text-sm">Manage society layout, add towers, create flats, and assign residents.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => alert("CSV Import feature coming soon!")} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-medium text-sm">
            <Download className="h-4 w-4" /> Import CSV
          </button>
          <button onClick={() => alert("CSV Export feature coming soon!")} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-medium text-sm">
            <Upload className="h-4 w-4" /> Export
          </button>
          <button onClick={() => alert("Bulk Actions feature coming soon!")} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-medium text-sm">
            <Layers className="h-4 w-4" /> Bulk Actions <ChevronDown className="h-3 w-3 ml-1"/>
          </button>
          <button onClick={() => setIsTowerModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors shadow-sm font-semibold text-sm border border-indigo-200/50">
            <Plus className="h-4 w-4" /> Add Tower
          </button>
          <button onClick={() => setIsFlatModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20 font-medium text-sm">
            <Plus className="h-4 w-4" /> Add Flat
          </button>
        </div>
      </div>

      {/* Top Metrics Row - 5 Cards (Removed Total Towers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Flats/Bungalows" value={totalFlats} icon={Home} color="text-blue-600" bg="bg-blue-50" />
        <StatCard title="Occupied Flats" value={occupiedFlats} icon={Users} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard title="Vacant Flats" value={vacantFlats} icon={Key} color="text-orange-600" bg="bg-orange-50" />
        <StatCard title="Maintenance Due" value={formatCurrency(pendingDue)} icon={IndianRupee} color="text-rose-600" bg="bg-rose-50" />
        <StatCard title="Collection %" value={`${collectionPercent}%`} icon={PieChart} color="text-emerald-600" bg="bg-emerald-50" />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
         <div className="relative flex-1 max-w-sm">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
           <input 
             type="text" 
             placeholder="Search flat, owner, phone..." 
             className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
             value={search}
             onChange={(e) => setSearch(e.target.value)}
           />
         </div>
         <div className="flex flex-wrap items-center gap-3 overflow-x-auto pb-1 md:pb-0">
           {['Tower: All', 'Floor: All', 'Status: All', 'Ownership: All', 'Maintenance: All'].map((f, i) => (
             <div onClick={() => alert("Filtering logic coming soon!")} key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 whitespace-nowrap">
               {f} <ChevronDown className="h-3 w-3 text-slate-400" />
             </div>
           ))}
           <span onClick={() => alert("Filters cleared!")} className="text-xs font-semibold text-rose-500 cursor-pointer hover:text-rose-600 px-2">Clear</span>
           
           <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block"></div>
           
           <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
             <button onClick={() => setViewMode("card")} className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors ${viewMode === 'card' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
               <Building2 className="h-3.5 w-3.5"/> Card View
             </button>
             <button onClick={() => setViewMode("table")} className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
               <Filter className="h-3.5 w-3.5"/> Table View
             </button>
           </div>
         </div>
      </div>

      {/* Main Flats Layout */}
      <div className="space-y-8">
        {groupedFlats.map((group) => {
           const gTotal = group.flats.length;
           const gOccupied = group.flats.filter(f => f.residents && f.residents.length > 0).length;
           const gVacant = gTotal - gOccupied;
           const occPercent = gTotal > 0 ? Math.round((gOccupied / gTotal) * 100) : 0;

           return (
             <div key={group.id} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-200/50">
               {/* Tower Header */}
               <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{group.name}</h2>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2.5 py-0.5 rounded-full">{occPercent}% Occupied</span>
                        <span className="text-xs text-slate-500 font-medium">{gTotal} Flats</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-4 sm:mt-0 text-sm font-medium">
                     <div className="flex flex-col items-end">
                       <span className="text-slate-800 font-bold">{gOccupied} Occupied</span>
                       <span className="text-slate-400 text-xs">Flats</span>
                     </div>
                     <div className="h-8 w-px bg-slate-200"></div>
                     <div className="flex flex-col items-end">
                       <span className="text-slate-800 font-bold">{gVacant} Vacant</span>
                       <span className="text-slate-400 text-xs">Flats</span>
                     </div>
                  </div>
               </div>

                 {viewMode === 'card' ? (
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                     {group.flats.map((flat) => {
                        const residents = flat.residents || [];
                        const primary = residents[0];
                        const isOccupied = residents.length > 0;
                        const status = isOccupied ? (primary.is_owner ? 'OWNER' : 'TENANT') : 'VACANT';
                        const vehCount = flat.vehicles?.length || 0;
                        const famCount = flat.family?.length || 0;
                        
                        let flatMaintDue = 0;
                        flat.maintenance?.forEach(m => {
                           if (m.status !== 'paid') {
                             flatMaintDue += (Number(m.amount_expected) - Number(m.amount_paid));
                           }
                        });

                        return (
                          <div 
                            key={flat.id} 
                            onClick={() => openDrawer(flat)}
                            className={`bg-white rounded-2xl border ${isOccupied ? 'border-slate-200 hover:border-indigo-300 hover:shadow-md' : 'border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50'} p-5 cursor-pointer transition-all flex flex-col group relative`}
                          >
                             <div className="flex justify-between items-start mb-4">
                               <h3 className="text-lg font-extrabold text-slate-900">Flat {flat.number}</h3>
                               {status === 'OWNER' && <span className="text-[10px] font-bold tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">OWNER</span>}
                               {status === 'TENANT' && <span className="text-[10px] font-bold tracking-wider text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">TENANT</span>}
                               {status === 'VACANT' && <span className="text-[10px] font-bold tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">VACANT</span>}
                             </div>

                             {isOccupied ? (
                               <>
                                 <div className="flex items-center gap-3 mb-4">
                                   <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                                     {primary.profiles.full_name.charAt(0).toUpperCase()}
                                   </div>
                                   <div className="truncate">
                                     <div className="text-sm font-bold text-slate-900 truncate">{primary.profiles.full_name}</div>
                                     <div className="text-xs text-slate-500 truncate">{primary.profiles.phone || primary.profiles.email}</div>
                                   </div>
                                 </div>
                                 <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 mb-4">
                                    <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5"/> {1 + famCount} Residents</div>
                                    <div className="flex items-center gap-1.5"><Car className="h-3.5 w-3.5"/> {vehCount} Vehicles</div>
                                 </div>
                                 <div className="mt-auto pt-4 border-t border-slate-100">
                                    {flatMaintDue > 0 ? (
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md flex items-center gap-1">
                                          <IndianRupee className="h-3 w-3"/> Maintenance Due
                                        </span>
                                        <span className="text-sm font-extrabold text-rose-600">₹{flatMaintDue}</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center">
                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md flex items-center gap-1">
                                          ✓ Maintenance Paid
                                        </span>
                                      </div>
                                    )}
                                 </div>
                               </>
                             ) : (
                               <div className="flex flex-col items-center justify-center flex-1 py-4 text-center">
                                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                                    <UserCircle className="h-6 w-6" />
                                  </div>
                                  <span className="text-xs font-semibold text-slate-500 mb-4">No resident assigned</span>
                                  <button className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">Assign Resident</button>
                               </div>
                             )}
                             <div className="absolute top-4 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-5 w-5 text-slate-400" />
                             </div>
                          </div>
                        );
                     })}
                   </div>
                 ) : (
                   <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
                     <table className="w-full text-left text-sm text-slate-600">
                       <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                         <tr>
                           <th className="px-4 py-3">Flat / Unit</th>
                           <th className="px-4 py-3">Resident</th>
                           <th className="px-4 py-3">Contact</th>
                           <th className="px-4 py-3 text-center">Occupancy</th>
                           <th className="px-4 py-3 text-right">Maint. Due</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {group.flats.map((flat) => {
                            const residents = flat.residents || [];
                            const primary = residents[0];
                            const isOccupied = residents.length > 0;
                            const status = isOccupied ? (primary.is_owner ? 'OWNER' : 'TENANT') : 'VACANT';
                            let flatMaintDue = 0;
                            flat.maintenance?.forEach(m => {
                               if (m.status !== 'paid') flatMaintDue += (Number(m.amount_expected) - Number(m.amount_paid));
                            });

                            return (
                              <tr key={flat.id} onClick={() => openDrawer(flat)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                                <td className="px-4 py-3 font-bold text-slate-900">{flat.number}</td>
                                <td className="px-4 py-3 font-medium text-slate-800">{isOccupied ? primary.profiles.full_name : <span className="text-slate-400 italic">None</span>}</td>
                                <td className="px-4 py-3 text-slate-500">{isOccupied ? primary.profiles.phone || primary.profiles.email : '-'}</td>
                                <td className="px-4 py-3 text-center">
                                  {status === 'OWNER' && <span className="text-[10px] font-bold tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">OWNER</span>}
                                  {status === 'TENANT' && <span className="text-[10px] font-bold tracking-wider text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">TENANT</span>}
                                  {status === 'VACANT' && <span className="text-[10px] font-bold tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">VACANT</span>}
                                </td>
                                <td className="px-4 py-3 text-right font-bold">
                                  {flatMaintDue > 0 ? <span className="text-rose-600">₹{flatMaintDue}</span> : <span className="text-emerald-600">Paid</span>}
                                </td>
                              </tr>
                            );
                         })}
                       </tbody>
                     </table>
                   </div>
                 )}
               </div>
           );
        })}
        {groupedFlats.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
            <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700">No Flats Found</h3>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or adding a new tower.</p>
          </div>
        )}
      </div>

      {/* Right Slide-Over Drawer */}
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
        <div className={`absolute top-0 right-0 h-full w-full max-w-[450px] bg-white shadow-2xl transition-transform duration-300 ease-in-out transform ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
           
           {selectedFlat && (
             <>
                {/* Drawer Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black text-slate-900">Flat {selectedFlat.number}</h2>
                    {selectedFlat.residents && selectedFlat.residents.length > 0 && (
                      <span className={`text-[10px] font-bold tracking-wider px-2 py-1 rounded border ${selectedFlat.residents[0].is_owner ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-amber-600 bg-amber-50 border-amber-100'}`}>
                        {selectedFlat.residents[0].is_owner ? 'OWNER' : 'TENANT'}
                      </span>
                    )}
                  </div>
                  <button onClick={() => setIsDrawerOpen(false)} className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Drawer Tabs */}
                <div className="flex items-center gap-6 px-6 border-b border-slate-100">
                  {['Overview', 'Maintenance', 'Visitors', 'Documents'].map(tab => (
                    <button 
                      key={tab}
                      onClick={() => setActiveTab(tab.toLowerCase())}
                      className={`py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === tab.toLowerCase() ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Drawer Content - Overview */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                   {activeTab === 'overview' && (
                     <div className="space-y-8">
                       
                       {/* Resident Details */}
                       {selectedFlat.residents && selectedFlat.residents.length > 0 ? (
                         <div className="space-y-4">
                           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Primary Resident</h3>
                           <div className="bg-white p-4 rounded-2xl border border-slate-200/60 flex items-start gap-4">
                             <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg shrink-0">
                               {selectedFlat.residents[0].profiles.full_name.charAt(0).toUpperCase()}
                             </div>
                             <div>
                               <div className="text-base font-bold text-slate-900">{selectedFlat.residents[0].profiles.full_name}</div>
                               <div className="text-sm text-slate-500 mt-0.5">{selectedFlat.residents[0].profiles.phone || "+91 Not Provided"}</div>
                               <div className="text-sm text-slate-500">{selectedFlat.residents[0].profiles.email}</div>
                             </div>
                           </div>
                         </div>
                       ) : (
                         <div className="bg-white p-6 rounded-2xl border border-slate-200 border-dashed text-center">
                            <span className="text-sm font-semibold text-slate-500">No resident assigned</span>
                         </div>
                       )}

                       {/* Family Members */}
                       {selectedFlat.residents && selectedFlat.residents.length > 0 && (
                         <div className="space-y-4">
                           <div className="flex justify-between items-center">
                             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Family Members</h3>
                             <button className="text-xs font-bold text-indigo-600">Add New</button>
                           </div>
                           {selectedFlat.family && selectedFlat.family.length > 0 ? (
                             <div className="flex flex-wrap gap-2">
                                {selectedFlat.family.map(fam => (
                                  <div key={fam.id} className="h-10 w-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm" title={`${fam.full_name} (${fam.relation})`}>
                                    {fam.full_name.charAt(0).toUpperCase()}
                                  </div>
                                ))}
                             </div>
                           ) : (
                             <p className="text-sm text-slate-500 italic">No family members registered.</p>
                           )}
                         </div>
                       )}

                       {/* Vehicles */}
                       {selectedFlat.residents && selectedFlat.residents.length > 0 && (
                         <div className="space-y-4">
                           <div className="flex justify-between items-center">
                             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Vehicles</h3>
                             <button className="text-xs font-bold text-indigo-600">Add New</button>
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                             {selectedFlat.vehicles && selectedFlat.vehicles.length > 0 ? (
                               selectedFlat.vehicles.map(veh => (
                                 <div key={veh.id} className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col">
                                   <div className="flex items-center justify-between mb-1">
                                      <Car className="h-4 w-4 text-slate-400" />
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">{veh.vehicle_type}</span>
                                   </div>
                                   <div className="font-bold text-slate-800 text-sm mt-1">{veh.vehicle_number}</div>
                                 </div>
                               ))
                             ) : (
                               <div className="col-span-2 text-sm text-slate-500 italic">No vehicles registered.</div>
                             )}
                           </div>
                         </div>
                       )}

                       {/* Maintenance Box */}
                       <div className="space-y-4">
                           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Maintenance Overview</h3>
                           <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100">
                             <div className="flex justify-between items-end mb-4">
                               <div>
                                 <div className="text-xs font-bold text-orange-800 uppercase tracking-wide mb-1">Due Amount</div>
                                 <div className="text-3xl font-black text-orange-600">
                                   ₹{selectedFlat.maintenance?.reduce((acc, curr) => curr.status !== 'paid' ? acc + (Number(curr.amount_expected) - Number(curr.amount_paid)) : acc, 0) || 0}
                                 </div>
                               </div>
                               <div className="text-right">
                                 <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Status</div>
                                 <div className="text-sm font-bold text-slate-800">Pending</div>
                               </div>
                             </div>
                             <button className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2">
                               <IndianRupee className="h-4 w-4" /> Collect Payment
                             </button>
                           </div>
                       </div>

                       {/* Recent Activity */}
                       <div className="space-y-4">
                           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Activity</h3>
                           <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[11px] before:h-full before:w-0.5 before:bg-slate-200">
                              <div className="relative flex items-center gap-4 mb-4">
                                <div className="h-6 w-6 rounded-full bg-white border-2 border-emerald-500 z-10 flex items-center justify-center"><History className="h-3 w-3 text-emerald-500"/></div>
                                <div>
                                  <div className="text-sm font-semibold text-slate-800">Maintenance bill generated</div>
                                  <div className="text-xs text-slate-500">2 days ago</div>
                                </div>
                              </div>
                              <div className="relative flex items-center gap-4">
                                <div className="h-6 w-6 rounded-full bg-white border-2 border-blue-500 z-10 flex items-center justify-center"><UserCircle className="h-3 w-3 text-blue-500"/></div>
                                <div>
                                  <div className="text-sm font-semibold text-slate-800">Visitor entry by Delivery Agent</div>
                                  <div className="text-xs text-slate-500">Last week</div>
                                </div>
                              </div>
                           </div>
                       </div>

                     </div>
                   )}
                   {activeTab !== 'overview' && (
                     <div className="flex flex-col items-center justify-center h-full text-center py-20">
                       <FileText className="h-12 w-12 text-slate-300 mb-4" />
                       <h3 className="text-lg font-bold text-slate-700 capitalize">{activeTab} Details</h3>
                       <p className="text-sm text-slate-500 mt-1 max-w-[250px]">Detailed {activeTab} information for this flat will be displayed here.</p>
                     </div>
                   )}
                </div>

                {/* Drawer Footer */}
                <div className="p-6 border-t border-slate-100 flex items-center gap-3 bg-white mt-auto">
                   <button className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-colors">
                     Edit Flat Details
                   </button>
                   <button className="h-[48px] w-[48px] border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-colors text-slate-500">
                     <MoreVertical className="h-5 w-5" />
                   </button>
                </div>
             </>
           )}
        </div>
      </div>

      {/* Add Tower Modal */}
      {isTowerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Add New Tower/Block</h2>
              <button onClick={() => setIsTowerModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddTower} className="p-6 space-y-4">
              {actionError && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{actionError}</div>}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Name / Identifier</label>
                <input required type="text" value={towerName} onChange={e => setTowerName(e.target.value)} placeholder="e.g. Tower A, Block B" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Structure Type</label>
                <select value={towerType} onChange={e => setTowerType(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <option value="tower">Tower / Apartment Block</option>
                  <option value="row_house">Row Houses</option>
                  <option value="bungalow">Bungalows / Villas</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsTowerModalOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={actionLoading} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-70">
                  {actionLoading ? "Adding..." : "Add Tower"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Flat Modal */}
      {isFlatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Add New Flat/Unit</h2>
              <button onClick={() => setIsFlatModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddFlat} className="p-6 space-y-4">
              {actionError && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{actionError}</div>}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Select Tower/Block</label>
                <select required value={flatData.tower_id} onChange={e => setFlatData({...flatData, tower_id: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <option value="">-- Select Tower --</option>
                  {towers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Flat/Unit Number</label>
                <input required type="text" value={flatData.number} onChange={e => setFlatData({...flatData, number: e.target.value})} placeholder="e.g. 101, A-101" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Floor (Optional)</label>
                  <input type="number" value={flatData.floor} onChange={e => setFlatData({...flatData, floor: e.target.value})} placeholder="e.g. 1" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Property Type</label>
                  <select value={flatData.property_type} onChange={e => setFlatData({...flatData, property_type: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="flat">Flat / Apartment</option>
                    <option value="villa">Villa</option>
                    <option value="penthouse">Penthouse</option>
                    <option value="shop">Shop / Commercial</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsFlatModalOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={actionLoading || towers.length === 0} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-70">
                  {actionLoading ? "Adding..." : "Add Flat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
