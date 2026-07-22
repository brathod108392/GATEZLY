"use client";

import React, { useState, useEffect } from "react";
import { Building2, Plus, Loader2, X, LayoutGrid, List, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

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
    const { data: towersData } = await supabase.from("towers").select("*").order("name");
    setTowers(towersData || []);

    // Fetch Flats
    const { data: flatsData } = await supabase.from("flats").select(`
      *,
      towers ( name )
    `).order("number");
    
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
    const { data } = await supabase.from("profiles").select("id, full_name, email, role").eq("role", "resident");
    setAvailableResidents(data || []);
  };

  const handleAddTower = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError("");
    
    const { error } = await supabase.from("towers").insert([{ name: towerName, structure_type: towerType }]);
    
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
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }

  if (currentUserRole === "resident") {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="mx-auto h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <Building2 className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-500 text-sm max-w-sm mx-auto">
          Flat management is restricted to Administrators and Committee Members.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            <span>Flats & Towers</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage society layout, add towers, create flats, and assign residents.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-slate-100 p-1 rounded-xl mr-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <button onClick={() => setIsTowerModalOpen(true)} className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-sm transition">
            <Plus className="h-3.5 w-3.5" />
            <span>Add Structure</span>
          </button>
          <button onClick={() => setIsFlatModalOpen(true)} className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-600/20 transition">
            <Plus className="h-3.5 w-3.5" />
            <span>Add Properties</span>
          </button>
        </div>
      </div>

      {/* Flats Grid by Tower */}
      {towers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No towers configured yet.</p>
          <button onClick={() => setIsTowerModalOpen(true)} className="mt-4 text-blue-600 font-medium text-sm hover:underline">
            Create your first Tower
          </button>
        </div>
      ) : (
        towers.map(tower => {
          const towerFlats = flats.filter(f => f.tower_id === tower.id);
          return (
            <div key={tower.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div 
                className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition"
                onClick={() => {
                  setCollapsedTowers(prev => {
                    const next = new Set(prev);
                    if (next.has(tower.id)) next.delete(tower.id);
                    else next.add(tower.id);
                    return next;
                  });
                }}
              >
                <div className="flex items-center space-x-3">
                  {collapsedTowers.has(tower.id) ? (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  )}
                  <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-blue-500" />
                    <span>{tower.name}</span>
                  </h3>
                </div>
                <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                  {towerFlats.length} Properties
                </span>
              </div>
              
              {!collapsedTowers.has(tower.id) && (
                <div className="p-6">
                  {towerFlats.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-4">No properties in this tower. Add one above.</p>
                ) : viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {towerFlats.map(flat => (
                      <div key={flat.id} className="border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition group">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="text-center mb-1">
                              <span className="font-bold text-sm text-slate-800">{flat.property_type === 'bungalow' ? 'Bungalow' : (flat.property_type === 'apartment' ? 'Apt' : 'Flat')} {flat.number}</span>
                            </div>
                          </div>
                          {flat.floor && <span className="text-[10px] uppercase font-bold text-slate-400">Floor {flat.floor}</span>}
                        </div>
                        
                        <div className="space-y-2 mt-4">
                          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Assigned Residents</div>
                          {(flatResidents[flat.id] || []).length === 0 ? (
                            <div className="text-sm text-slate-400 italic">No residents assigned</div>
                          ) : (
                            (flatResidents[flat.id] || []).map(fr => (
                              <div key={fr.id} className="flex items-center space-x-2 bg-slate-50 p-2 rounded-lg">
                                <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                                  {fr.profiles.full_name?.charAt(0) || 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-slate-800 truncate">{fr.profiles.full_name}</p>
                                  <p className="text-[10px] text-slate-500 truncate">{fr.profiles.email}</p>
                                </div>
                                {fr.is_owner && <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">OWNER</span>}
                              </div>
                            ))
                          )}
                        </div>
                        
                        <button 
                          onClick={() => openAssignModal(flat.id)}
                          className="mt-4 w-full py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                        >
                          + Assign Resident
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Property</th>
                          <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Floor</th>
                          <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Residents</th>
                          <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {towerFlats.map(flat => (
                          <tr key={flat.id} className="hover:bg-slate-50 transition">
                            <td className="p-4">
                              <span className="font-bold text-sm text-slate-900">
                                {flat.property_type === 'bungalow' ? 'Bungalow' : (flat.property_type === 'apartment' ? 'Apt' : 'Flat')} {flat.number}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-slate-600">
                              {flat.floor ? flat.floor : '-'}
                            </td>
                            <td className="p-4">
                              {(flatResidents[flat.id] || []).length === 0 ? (
                                <span className="text-xs text-slate-400 italic">None</span>
                              ) : (
                                <div className="flex -space-x-2">
                                  {(flatResidents[flat.id] || []).map(fr => (
                                    <div key={fr.id} title={`${fr.profiles.full_name} ${fr.is_owner ? '(Owner)' : ''}`} className="h-8 w-8 rounded-full bg-blue-100 border-2 border-white text-blue-600 flex items-center justify-center text-xs font-bold">
                                      {fr.profiles.full_name?.charAt(0) || 'U'}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <button 
                                onClick={() => openAssignModal(flat.id)}
                                className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                              >
                                + Assign
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              )}
            </div>
          );
        })
      )}

      {/* Add Tower Modal */}
      {isTowerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Add Structure (Tower/Block/Zone)</h3>
              <button onClick={() => setIsTowerModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddTower} className="p-6 space-y-4">
              {actionError && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{actionError}</div>}
              <div>
                <label className="text-sm font-medium text-slate-700">Structure Name</label>
                <input type="text" required value={towerName} onChange={e => setTowerName(e.target.value)} placeholder="e.g. Tower A, Block B, Individual Property" className="w-full mt-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Structure Type</label>
                <select required value={towerType} onChange={e => setTowerType(e.target.value)} className="w-full mt-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500">
                  <option value="tower">Tower / Block</option>
                  <option value="individual_property">Individual Property Zone</option>
                </select>
              </div>
              <button type="submit" disabled={actionLoading} className="w-full py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition">
                {actionLoading ? "Saving..." : "Save Structure"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Flat Modal */}
      {isFlatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Add Properties</h3>
              <button onClick={() => setIsFlatModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddFlat} className="p-6 space-y-4">
              {actionError && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{actionError}</div>}
              
              <div>
                <label className="text-sm font-medium text-slate-700">Select Structure</label>
                <select required value={flatData.tower_id} onChange={e => {
                  const selectedTower = towers.find(t => t.id === e.target.value);
                  const isIndividual = selectedTower?.structure_type === 'individual_property';
                  setFlatData({
                    ...flatData, 
                    tower_id: e.target.value,
                    property_type: isIndividual ? 'bungalow' : 'flat'
                  });
                }} className="w-full mt-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Choose Structure --</option>
                  {towers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Property Type</label>
                <select required value={flatData.property_type} onChange={e => setFlatData({...flatData, property_type: e.target.value})} className="w-full mt-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500">
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

              <div>
                <label className="text-sm font-medium text-slate-700">Unit Number(s)</label>
                <input type="text" required value={flatData.number} onChange={e => setFlatData({...flatData, number: e.target.value})} placeholder="e.g. 101, or 101-105" className="w-full mt-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500" />
                <p className="text-[10px] text-slate-500 mt-1 ml-1">Supports ranges (101-105) and comma separated lists (101, 102).</p>
              </div>
              {flatData.property_type !== 'bungalow' && (
                <div>
                  <label className="text-sm font-medium text-slate-700">Floor (Optional)</label>
                  <input type="number" value={flatData.floor} onChange={e => setFlatData({...flatData, floor: e.target.value})} placeholder="e.g. 1" className="w-full mt-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
              <button type="submit" disabled={actionLoading} className="w-full py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition">
                {actionLoading ? "Saving..." : "Save Properties"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Assign Resident Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Assign Resident</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAssignResident} className="p-6 space-y-4">
              {actionError && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{actionError}</div>}
              <div>
                <label className="text-sm font-medium text-slate-700">Select Resident</label>
                <select required value={assignData.resident_id} onChange={e => setAssignData({...assignData, resident_id: e.target.value})} className="w-full mt-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Choose Resident --</option>
                  {availableResidents.map(r => <option key={r.id} value={r.id}>{r.full_name} ({r.email})</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Occupancy Type</label>
                <select required value={assignData.is_owner ? "owner" : "tenant"} onChange={e => setAssignData({...assignData, is_owner: e.target.value === "owner"})} className="w-full mt-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500">
                  <option value="tenant">Tenant</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              <button type="submit" disabled={actionLoading} className="w-full py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition">
                {actionLoading ? "Assigning..." : "Assign to Flat"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
