"use client";

import React, { useState, useEffect } from "react";
import { Users, Plus, Loader2, Search, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Resident {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  created_at: string;
  is_active?: boolean;
  flat_residents?: {
    is_owner: boolean;
    flats?: {
      number: string;
      towers?: { name: string };
    };
  }[];
}

export default function ResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [editFormData, setEditFormData] = useState({ name: "", phone: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  useEffect(() => {
    fetchCurrentUserRole();
    fetchResidents();
  }, []);

  const fetchCurrentUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (data) {
        setCurrentUserRole(data.role);
      }
    }
    setRoleLoading(false);
  };

  const fetchResidents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        *,
        flat_residents (
          is_owner,
          flats (
            number,
            towers ( name )
          )
        )
      `)
      .eq("role", "resident")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching residents:", error);
    } else {
      setResidents((data as unknown as Resident[]) || []);
    }
    setLoading(false);
  };

  const filteredResidents = residents.filter(r => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    const nameMatch = r.full_name?.toLowerCase().includes(search);
    const emailMatch = r.email?.toLowerCase().includes(search);
    const phoneMatch = r.phone?.toLowerCase().includes(search);
    
    const flatMatch = r.flat_residents?.some(fr => 
      fr.flats?.number?.toLowerCase().includes(search) ||
      fr.flats?.towers?.name?.toLowerCase().includes(search)
    );
    
    return nameMatch || emailMatch || phoneMatch || flatMatch;
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError("");
    setInviteSuccess("");

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch("/api/residents/invite", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to invite resident");
      }

      setInviteSuccess("Resident invited successfully!");
      setFormData({ name: "", email: "", phone: "" });
      fetchResidents(); // Refresh list
      
      // Close modal after short delay
      setTimeout(() => {
        setIsModalOpen(false);
        setInviteSuccess("");
      }, 2000);
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        setInviteError(err.message);
      } else {
        setInviteError("An unknown error occurred");
      }
    } finally {
      setInviteLoading(false);
    }
  };

  const openEditModal = (resident: Resident) => {
    setSelectedResident(resident);
    setEditFormData({
      name: resident.full_name || "",
      phone: resident.phone || ""
    });
    setEditError("");
    setEditSuccess("");
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResident) return;
    
    setEditLoading(true);
    setEditError("");
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/residents/${selectedResident.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          full_name: editFormData.name,
          phone: editFormData.phone
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update resident");

      setEditSuccess("Resident updated successfully!");
      fetchResidents();
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditSuccess("");
      }, 1500);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : String(err));
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedResident) return;
    if (!confirm(`Are you sure you want to deactivate ${selectedResident.full_name}? They will lose access to the app and be removed from their flat.`)) return;
    
    setEditLoading(true);
    setEditError("");
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/residents/${selectedResident.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ is_active: false }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to deactivate resident");

      setEditSuccess("Resident deactivated successfully.");
      fetchResidents();
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditSuccess("");
      }, 1500);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : String(err));
    } finally {
      setEditLoading(false);
    }
  };

  if (roleLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (currentUserRole === "resident") {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="mx-auto h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <Users className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-500 text-sm max-w-sm mx-auto">
          The resident directory is only accessible to Committee members and Administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2">
            <Users className="h-6 w-6 text-blue-600" />
            <span>Residents</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage society residents, family members, and tenant profiles.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Resident</span>
        </button>
      </div>

      {/* Residents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Directory</h3>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search residents, flats..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-64 bg-white"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Flat / Tower</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Added On</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
                    <p className="text-sm">Loading directory...</p>
                  </td>
                </tr>
              ) : filteredResidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-3">
                      <Users className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">No residents found</p>
                    <p className="text-xs mt-1">Try adjusting your search or add a new resident.</p>
                  </td>
                </tr>
              ) : (
                filteredResidents.map((resident) => (
                  <tr key={resident.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{resident.full_name || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">{resident.email}</div>
                      {resident.phone && <div className="text-xs text-slate-400 mt-0.5">{resident.phone}</div>}
                    </td>
                    <td className="px-6 py-4">
                      {resident.flat_residents && resident.flat_residents.length > 0 ? (
                        <div className="space-y-1">
                          {resident.flat_residents.map((fr, idx) => (
                            <div key={idx} className="flex items-center space-x-1">
                              <span className="text-sm font-bold text-slate-800">{fr.flats?.number}</span>
                              <span className="text-xs text-slate-500">({fr.flats?.towers?.name})</span>
                              {fr.is_owner && <span className="ml-1 text-[9px] font-bold bg-amber-100 text-amber-700 px-1 py-0.5 rounded">OWNER</span>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {resident.is_active === false ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          Inactive
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(resident.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => openEditModal(resident)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium transition"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Resident Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Invite Resident</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleInviteSubmit} className="p-6 space-y-4">
              {inviteError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                  {inviteError}
                </div>
              )}
              {inviteSuccess && (
                <div className="p-3 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm font-medium">
                  {inviteSuccess}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="john@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Phone Number (Optional)</label>
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={inviteLoading}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
                >
                  {inviteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Resident Modal */}
      {isEditModalOpen && selectedResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Edit Resident</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                  {editError}
                </div>
              )}
              {editSuccess && (
                <div className="p-3 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm font-medium">
                  {editSuccess}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Full Name</label>
                <input 
                  type="text" 
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Phone Number</label>
                <input 
                  type="tel" 
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                />
              </div>
              
              <div className="space-y-1.5 pt-2">
                <label className="text-sm font-medium text-slate-700">Email Address</label>
                <input 
                  type="email" 
                  value={selectedResident.email}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed text-sm"
                />
                <p className="text-[10px] text-slate-500">Email addresses cannot be changed.</p>
              </div>

              <div className="pt-4 flex flex-col space-y-3">
                <div className="flex items-center justify-end space-x-3">
                  <button 
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={editLoading}
                    className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition disabled:opacity-70 flex items-center justify-center min-w-[120px]"
                  >
                    {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                  </button>
                </div>
                
                {selectedResident.is_active !== false && (
                  <div className="pt-4 mt-2 border-t border-slate-100">
                    <button 
                      type="button"
                      onClick={handleDeactivate}
                      disabled={editLoading}
                      className="w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition"
                    >
                      Deactivate Resident (Moved Out)
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
