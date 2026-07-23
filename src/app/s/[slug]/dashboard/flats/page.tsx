"use client";

import React, { useState, useEffect } from "react";
import { Building2, Plus, Loader2, X, LayoutGrid, List, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useSociety } from "@/components/providers/society-provider";

interface Tower {
  id: string;
  name: string;
  structure_type?: string;
}

interface Flat {
  id: string;
  tower_id: string;
  number: string;
  floor: number | null;
  property_type?: string;
  tower_name?: string;
}

interface Resident {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface FlatResident {
  id: string;
  flat_id: string;
  resident_id: string;
  is_owner: boolean;
  profiles: { full_name: string; email: string };
}

export default function FlatsPage() {
  const { society } = useSociety();
  const [towers, setTowers] = useState<Tower[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [flatResidents, setFlatResidents] = useState<Record<string, FlatResident[]>>({});
  
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [collapsedTowers, setCollapsedTowers] = useState<Set<string>>(new Set());

  // Modals
  const [isTowerModalOpen, setIsTowerModalOpen] = useState(false);
  const [isFlatModalOpen, setIsFlatModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedFlatId, setSelectedFlatId] = useState<string | null>(null);

  // Forms
  const [towerName, setTowerName] = useState("");
  const [towerType, setTowerType] = useState("tower");
  const [flatData, setFlatData] = useState({ tower_id: "", number: "", floor: "", property_type: "flat" });
  
  // Assign Form
  const [availableResidents, setAvailableResidents] = useState<Resident[]>([]);
  const [assignData, setAssignData] = useState({ resident_id: "", is_owner: false });

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Fetch User Role
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (data) setCurrentUserRole(data.role);
    }

    // Fetch Towers
    const { data: towersData } = await supabase.from("towers").select("*").eq("society_id", society.id).order("name");
    setTowers(towersData || []);

    // Fetch Flats
    const { data: flatsData } = await supabase.from("flats").select(`
      *,
      towers!inner ( name, society_id )
    `).eq("towers.society_id", society.id).order("number");
    
    if (flatsData) {
      const sortedFlats = flatsData.sort((a, b) => 
        a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: 'base' })
      );
      setFlats(sortedFlats.map(f => ({ ...f, tower_name: f.towers?.name })));
    }

    // Fetch Flat Residents (Assignments)
    const { data: frData } = await supabase.from("flat_residents").select(`
      id, flat_id, resident_id, is_owner,
      profiles ( full_name, email )
    `);
    
    if (frData) {
      const grouped: Record<string, FlatResident[]> = {};
      (frData as unknown as FlatResident[]).forEach((fr) => {
        if (!grouped[fr.flat_id]) grouped[fr.flat_id] = [];
        grouped[fr.flat_id].push(fr);
      });
      setFlatResidents(grouped);
    }

    setLoading(false);
  };

  const fetchAvailableResidents = async () => {
    const { data } = await supabase.from("profiles").select("id, full_name, email, role").eq("society_id", society.id).in("role", ["resident", "committee", "guard"]);
    setAvailableResidents(data || []);
  };

  const handleAddTower = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError("");
    
    const { error } = await supabase.from("towers").insert([{ name: towerName, structure_type: towerType, society_id: society.id }]);
    
    if (error) setActionError(error.message);
    else {
      setIsTowerModalOpen(false);
      setTowerName("");
      fetchData();
    }
    setActionLoading(false);
  };

  const parseFlatNumbers = (input: string): string[] => {
    const flats = new Set<string>();
    const parts = input.split(',').map(p => p.trim()).filter(Boolean);
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-').map(s => s.trim());
        const start = parseInt(startStr);
        const end = parseInt(endStr);
        if (!isNaN(start) && !isNaN(end) && start <= end && (end - start) < 200) {
          for (let i = start; i <= end; i++) {
            flats.add(i.toString());
          }
        } else {
          flats.add(part);
        }
      } else {
        flats.add(part);
      }
    }
    return Array.from(flats);
  };

  const handleAddFlat = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError("");
    
    const flatNumbers = parseFlatNumbers(flatData.number);
    if (flatNumbers.length === 0) {
      setActionError("Please enter valid flat numbers.");
      setActionLoading(false);
      return;
    }

    const inserts = flatNumbers.map(num => ({
      society_id: society.id,
      tower_id: flatData.tower_id,
      number: num,
      floor: flatData.floor ? parseInt(flatData.floor) : null,
      property_type: flatData.property_type
    }));

    const { error } = await supabase.from("flats").insert(inserts);
    
    if (error) setActionError(error.message);
    else {
      setIsFlatModalOpen(false);
      setFlatData({ tower_id: "", number: "", floor: "", property_type: "flat" });
      fetchData();
    }
    setActionLoading(false);
  };

  const handleAssignResident = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError("");
    
    const { error } = await supabase.from("flat_residents").insert([{
      society_id: society.id,
      flat_id: selectedFlatId,
      resident_id: assignData.resident_id,
      is_owner: assignData.is_owner
    }]);

    if (error) setActionError(error.message);
    else {
      setIsAssignModalOpen(false);
      setAssignData({ resident_id: "", is_owner: false });
      fetchData();
    }
    setActionLoading(false);
  };

  const openAssignModal = (flat_id: string) => {
    setSelectedFlatId(flat_id);
    fetchAvailableResidents();
    setIsAssignModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (currentUserRole === "resident") {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/60 p-12 text-center shadow-sm max-w-2xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mx-auto h-20 w-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <Building2 className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Access Denied</h2>
        <p className="text-slate-500 text-base max-w-sm mx-auto leading-relaxed">
          Flat management is restricted to Administrators and Committee Members.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-indigo-600" />
            <span>Flats & Towers</span>
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Manage society layout, add towers, create flats, and assign residents.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-slate-100/80 p-1 rounded-xl mr-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <button onClick={() => setIsTowerModalOpen(true)} className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200/60 text-slate-700 hover:bg-slate-50 text-sm font-semibold shadow-sm transition-all hover:shadow hover:border-slate-300">
            <Plus className="h-4 w-4" />
            <span>Add Structure</span>
          </button>
          <button onClick={() => setIsFlatModalOpen(true)} className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm shadow-indigo-600/20 transition-all hover:shadow-md hover:-translate-y-0.5">
            <Plus className="h-4 w-4" />
            <span>Add Properties</span>
          </button>
        </div>
      </div>

      {/* Flats Grid by Tower */}
      {towers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/60 p-16 text-center shadow-sm flex flex-col items-center justify-center">
          <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No towers configured yet</h3>
          <p className="text-slate-500 max-w-sm mb-6">Start by adding a structure to your society layout.</p>
          <button onClick={() => setIsTowerModalOpen(true)} className="text-indigo-600 font-semibold text-sm hover:text-indigo-700 bg-indigo-50 px-6 py-2.5 rounded-xl transition-colors">
            Create your first Tower
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {towers.map((tower, index) => {
            const towerFlats = flats.filter(f => f.tower_id === tower.id);
            return (
              <div 
                key={tower.id} 
                className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
              >
                <div 
                  className="bg-white px-6 py-5 border-b border-slate-100 flex justify-between items-center cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => {
                    setCollapsedTowers(prev => {
                      const next = new Set(prev);
                      if (next.has(tower.id)) next.delete(tower.id);
                      else next.add(tower.id);
                      return next;
                    });
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-xl transition-colors ${collapsedTowers.has(tower.id) ? 'bg-slate-100' : 'bg-indigo-50'}`}>
                      {collapsedTowers.has(tower.id) ? (
                        <ChevronDown className="h-5 w-5 text-slate-500" />
                      ) : (
                        <ChevronUp className="h-5 w-5 text-indigo-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
                        <span>{tower.name}</span>
                      </h3>
                      <p className="text-sm text-slate-500 mt-0.5">{tower.structure_type === 'individual_property' ? 'Individual Properties' : 'Tower / Block'}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-semibold text-slate-600 bg-slate-100/80 px-4 py-1.5 rounded-full">
                      {towerFlats.length} Properties
                    </span>
                  </div>
                </div>
                
                {!collapsedTowers.has(tower.id) && (
                  <div className="p-6 bg-slate-50/30">
                    {towerFlats.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-slate-400 text-sm">No properties in this tower.</p>
                      <button onClick={() => setIsFlatModalOpen(true)} className="mt-3 text-indigo-600 font-medium text-sm hover:underline">
                        Add Properties
                      </button>
                    </div>
                  ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {towerFlats.map(flat => (
                        <div key={flat.id} className="bg-white border border-slate-200/60 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-md transition-all duration-300 group flex flex-col h-full">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-lg text-slate-900 tracking-tight">
                                {flat.property_type === 'bungalow' ? 'Bungalow' : (flat.property_type === 'apartment' ? 'Apt' : 'Flat')} {flat.number}
                              </span>
                              {flat.floor && <span className="text-xs font-medium text-slate-500 mt-1">Floor {flat.floor}</span>}
                            </div>
                            <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                              <Building2 className="h-4 w-4" />
                            </div>
                          </div>
                          
                          <div className="space-y-3 mt-auto pt-4 border-t border-slate-100">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Residents</div>
                            {(flatResidents[flat.id] || []).length === 0 ? (
                              <div className="text-sm text-slate-400 italic py-2">Unoccupied</div>
                            ) : (
                              <div className="space-y-2">
                                {(flatResidents[flat.id] || []).map(fr => (
                                  <div key={fr.id} className="flex items-center space-x-3 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                                    <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                                      {fr.profiles.full_name?.charAt(0) || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-slate-800 truncate">{fr.profiles.full_name}</p>
                                      <p className="text-xs text-slate-500 truncate">{fr.profiles.email}</p>
                                    </div>
                                    {fr.is_owner && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-md shrink-0">OWNER</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <button 
                            onClick={() => openAssignModal(flat.id)}
                            className="mt-5 w-full py-2.5 text-sm font-semibold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 rounded-xl transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          >
                            + Assign Resident
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200/60">
                              <th className="p-4 pl-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Property</th>
                              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Floor</th>
                              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Residents</th>
                              <th className="p-4 pr-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {towerFlats.map(flat => (
                              <tr key={flat.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 pl-6">
                                  <div className="flex items-center space-x-3">
                                    <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                      <Building2 className="h-4 w-4" />
                                    </div>
                                    <span className="font-semibold text-sm text-slate-900">
                                      {flat.property_type === 'bungalow' ? 'Bungalow' : (flat.property_type === 'apartment' ? 'Apt' : 'Flat')} {flat.number}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-4 text-sm font-medium text-slate-600">
                                  {flat.floor ? flat.floor : '-'}
                                </td>
                                <td className="p-4">
                                  {(flatResidents[flat.id] || []).length === 0 ? (
                                    <span className="text-sm text-slate-400 italic">None</span>
                                  ) : (
                                    <div className="flex items-center space-x-3">
                                      <div className="flex -space-x-2">
                                        {(flatResidents[flat.id] || []).map(fr => (
                                          <div key={fr.id} title={`${fr.profiles.full_name} ${fr.is_owner ? '(Owner)' : ''}`} className="h-8 w-8 rounded-full bg-indigo-100 border-2 border-white text-indigo-700 flex items-center justify-center text-xs font-bold shadow-sm">
                                            {fr.profiles.full_name?.charAt(0) || 'U'}
                                          </div>
                                        ))}
                                      </div>
                                      <span className="text-sm font-medium text-slate-600">
                                        {(flatResidents[flat.id] || []).length} resident{(flatResidents[flat.id] || []).length > 1 ? 's' : ''}
                                      </span>
                                    </div>
                                  )}
                                </td>
                                <td className="p-4 pr-6 text-right">
                                  <button 
                                    onClick={() => openAssignModal(flat.id)}
                                    className="px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                                  >
                                    Assign
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Tower Modal */}
      {isTowerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 p-4 sm:p-0">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/60 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Add Structure</h3>
              <button onClick={() => setIsTowerModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddTower} className="p-6 space-y-5">
              {actionError && <div className="text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-100">{actionError}</div>}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Structure Name</label>
                <input 
                  type="text" 
                  required 
                  value={towerName} 
                  onChange={e => setTowerName(e.target.value)} 
                  placeholder="e.g. Tower A, Block B, Individual Property" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Structure Type</label>
                <select 
                  required 
                  value={towerType} 
                  onChange={e => setTowerType(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                >
                  <option value="tower">Tower / Block</option>
                  <option value="individual_property">Individual Property Zone</option>
                </select>
              </div>
              <div className="pt-2">
                <button type="submit" disabled={actionLoading} className="w-full py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm shadow-indigo-600/20 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0">
                  {actionLoading ? "Saving..." : "Save Structure"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Flat Modal */}
      {isFlatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 p-4 sm:p-0">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/60 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Add Properties</h3>
              <button onClick={() => setIsFlatModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddFlat} className="p-6 space-y-5">
              {actionError && <div className="text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-100">{actionError}</div>}
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Select Structure</label>
                <select 
                  required 
                  value={flatData.tower_id} 
                  onChange={e => {
                    const selectedTower = towers.find(t => t.id === e.target.value);
                    const isIndividual = selectedTower?.structure_type === 'individual_property';
                    setFlatData({
                      ...flatData, 
                      tower_id: e.target.value,
                      property_type: isIndividual ? 'bungalow' : 'flat'
                    });
                  }} 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                >
                  <option value="">-- Choose Structure --</option>
                  {towers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Property Type</label>
                <select 
                  required 
                  value={flatData.property_type} 
                  onChange={e => setFlatData({...flatData, property_type: e.target.value})} 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                >
                  {(!flatData.tower_id || towers.find(t => t.id === flatData.tower_id)?.structure_type !== 'individual_property') && (
                    <>
                      <option value="flat">Flat</option>
                      <option value="apartment">Apartment</option>
                    </>
                  )}
                  {(!flatData.tower_id || towers.find(t => t.id === flatData.tower_id)?.structure_type === 'individual_property') && (
                    <option value="bungalow">Bungalow</option>
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Unit Number(s)</label>
                <input 
                  type="text" 
                  required 
                  value={flatData.number} 
                  onChange={e => setFlatData({...flatData, number: e.target.value})} 
                  placeholder="e.g. 101, or 101-105" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" 
                />
                <p className="text-xs text-slate-500 pt-1">Supports ranges (101-105) and comma separated lists (101, 102).</p>
              </div>

              {flatData.property_type !== 'bungalow' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Floor (Optional)</label>
                  <input 
                    type="number" 
                    value={flatData.floor} 
                    onChange={e => setFlatData({...flatData, floor: e.target.value})} 
                    placeholder="e.g. 1" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" 
                  />
                </div>
              )}
              
              <div className="pt-2">
                <button type="submit" disabled={actionLoading} className="w-full py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm shadow-indigo-600/20 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0">
                  {actionLoading ? "Saving..." : "Save Properties"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Resident Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 p-4 sm:p-0">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/60 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Assign Resident</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAssignResident} className="p-6 space-y-5">
              {actionError && <div className="text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-100">{actionError}</div>}
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Select Resident</label>
                <select 
                  required 
                  value={assignData.resident_id} 
                  onChange={e => setAssignData({...assignData, resident_id: e.target.value})} 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                >
                  <option value="">-- Choose Resident --</option>
                  {availableResidents.map(r => <option key={r.id} value={r.id}>{r.full_name} ({r.email})</option>)}
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Occupancy Type</label>
                <select 
                  required 
                  value={assignData.is_owner ? "owner" : "tenant"} 
                  onChange={e => setAssignData({...assignData, is_owner: e.target.value === "owner"})} 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                >
                  <option value="tenant">Tenant</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              
              <div className="pt-2">
                <button type="submit" disabled={actionLoading} className="w-full py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm shadow-indigo-600/20 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0">
                  {actionLoading ? "Assigning..." : "Assign to Flat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
