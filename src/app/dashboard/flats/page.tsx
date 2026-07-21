"use client";

import React, { useState, useEffect } from "react";
import { Building2, Plus, Loader2, X, Home } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Tower {
  id: string;
  name: string;
}

interface Flat {
  id: string;
  tower_id: string;
  number: string;
  floor: number | null;
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

  // Modals
  const [isTowerModalOpen, setIsTowerModalOpen] = useState(false);
  const [isFlatModalOpen, setIsFlatModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedFlatId, setSelectedFlatId] = useState<string | null>(null);

  // Forms
  const [towerName, setTowerName] = useState("");
  const [flatData, setFlatData] = useState({ tower_id: "", number: "", floor: "" });
  
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
      setFlats(flatsData.map(f => ({ ...f, tower_name: f.towers?.name })));
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
    
    const { error } = await supabase.from("towers").insert([{ name: towerName }]);
    
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
      floor: flatData.floor ? parseInt(flatData.floor) : null
    }));

    const { error } = await supabase.from("flats").insert(inserts);
    
    if (error) setActionError(error.message);
    else {
      setIsFlatModalOpen(false);
      setFlatData({ tower_id: "", number: "", floor: "" });
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
          <button 
            onClick={() => setIsTowerModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
          >
            Add Tower
          </button>
          <button 
            onClick={() => setIsFlatModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Flat</span>
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
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-lg">{tower.name}</h3>
                <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                  {towerFlats.length} Flats
                </span>
              </div>
              
              <div className="p-6">
                {towerFlats.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-4">No flats in this tower. Add one above.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {towerFlats.map(flat => (
                      <div key={flat.id} className="border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition group">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-2">
                            <Home className="h-5 w-5 text-blue-500" />
                            <span className="font-bold text-slate-900 text-lg">Flat {flat.number}</span>
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
                )}
              </div>
            </div>
          );
        })
      )}

      {/* Add Tower Modal */}
      {isTowerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Add Tower</h3>
              <button onClick={() => setIsTowerModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddTower} className="p-6 space-y-4">
              {actionError && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{actionError}</div>}
              <div>
                <label className="text-sm font-medium text-slate-700">Tower Name</label>
                <input type="text" required value={towerName} onChange={e => setTowerName(e.target.value)} placeholder="e.g. Tower A" className="w-full mt-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" disabled={actionLoading} className="w-full py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition">
                {actionLoading ? "Saving..." : "Save Tower"}
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
              <h3 className="text-lg font-bold text-slate-900">Add Flat</h3>
              <button onClick={() => setIsFlatModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddFlat} className="p-6 space-y-4">
              {actionError && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{actionError}</div>}
              <div>
                <label className="text-sm font-medium text-slate-700">Select Tower</label>
                <select required value={flatData.tower_id} onChange={e => setFlatData({...flatData, tower_id: e.target.value})} className="w-full mt-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Choose Tower --</option>
                  {towers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Flat Number(s)</label>
                <input type="text" required value={flatData.number} onChange={e => setFlatData({...flatData, number: e.target.value})} placeholder="e.g. 101, or 101-105" className="w-full mt-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500" />
                <p className="text-[10px] text-slate-500 mt-1 ml-1">Supports ranges (101-105) and comma separated lists (101, 102).</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Floor (Optional)</label>
                <input type="number" value={flatData.floor} onChange={e => setFlatData({...flatData, floor: e.target.value})} placeholder="e.g. 1" className="w-full mt-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" disabled={actionLoading} className="w-full py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition">
                {actionLoading ? "Saving..." : "Save Flat"}
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
              <div className="flex items-center space-x-2 mt-2">
                <input type="checkbox" id="is_owner" checked={assignData.is_owner} onChange={e => setAssignData({...assignData, is_owner: e.target.checked})} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="is_owner" className="text-sm font-medium text-slate-700">Is this resident the Owner?</label>
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
