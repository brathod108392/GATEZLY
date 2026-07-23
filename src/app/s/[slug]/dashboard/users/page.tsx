"use client";

import React, { useState, useEffect } from "react";
import { Users, Plus, Loader2, Search, X, Shield, ShieldAlert, User, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useSearchParams } from "next/navigation";
import { useSociety } from "@/components/providers/society-provider";

interface Resident {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  registration_status?: string;
  created_at: string;
  is_active?: boolean;
  flat_residents?: {
    is_owner: boolean;
    flats?: {
      number: string;
      property_type?: string;
      towers?: { name: string };
    };
  }[];
}

interface VacantFlat {
  id: string;
  number: string;
  property_type: string;
  towers: { name: string } | null;
}

export default function UsersPage() {
  const { society } = useSociety();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [roleFilter, setRoleFilter] = useState<"all" | "resident" | "guard" | "committee">("all");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "resident",
  });

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [editFormData, setEditFormData] = useState({ name: "", phone: "", role: "resident" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  
  // Reassign State
  const [vacantFlats, setVacantFlats] = useState<VacantFlat[]>([]);
  const [selectedReassignFlatId, setSelectedReassignFlatId] = useState("");
  const [selectedReassignIsOwner, setSelectedReassignIsOwner] = useState(false);

  useEffect(() => {
    fetchCurrentUserRole();
    fetchResidents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            property_type,
            towers ( name )
          )
        )
      `)
      .eq("society_id", society.id)
      .in("role", ["resident", "guard", "committee"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching residents:", error);
    } else {
      setResidents((data as unknown as Resident[]) || []);
    }
    setLoading(false);
  };

  const filteredUsers = residents.filter(r => {
    if (roleFilter !== "all" && r.role !== roleFilter) return false;
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

      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ ...formData, target_society_id: society.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to invite user");
      }

      setInviteSuccess("User invited successfully!");
      setFormData({ name: "", email: "", phone: "", role: "resident" });
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

  const openEditModal = async (resident: Resident) => {
    setSelectedResident(resident);
    setEditFormData({
      name: resident.full_name || "",
      phone: resident.phone || "",
      role: resident.role || "resident",
    });
    setEditError("");
    setEditSuccess("");
    setSelectedReassignFlatId("");
    setIsEditModalOpen(true);

    if (resident.is_active === false) {
      // Fetch available flats for reassignment
      const { data, error } = await supabase
        .from("flats")
        .select("id, number, property_type, towers!inner(name, society_id)")
        .eq("towers.society_id", society.id)
        .order("number");
        
      if (!error && data) {
        setVacantFlats(data as unknown as VacantFlat[]);
      }
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResident) return;
    
    setEditLoading(true);
    setEditError("");
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/users/${selectedResident.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          full_name: editFormData.name,
          phone: editFormData.phone,
          role: editFormData.role
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user");

      setEditSuccess("User updated successfully!");
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
    if (!confirm(`Are you sure you want to deactivate ${selectedResident.full_name}? They will lose access to the app.`)) return;
    
    setEditLoading(true);
    setEditError("");
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/users/${selectedResident.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ is_active: false }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to deactivate user");

      setEditSuccess("User deactivated successfully.");
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

  const handleDeletePermanent = async () => {
    if (!selectedResident) return;
    if (!confirm(`WARNING: This will permanently delete ${selectedResident.full_name} and wipe their login credentials completely. This cannot be undone. Proceed?`)) return;
    
    setEditLoading(true);
    setEditError("");
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/users/${selectedResident.id}`, {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${session?.access_token}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");

      setEditSuccess("User permanently deleted.");
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

  const handleReassign = async () => {
    if (!selectedResident || !selectedReassignFlatId) return;
    
    setEditLoading(true);
    setEditError("");
    
    try {
      const { error: assignError } = await supabase
        .from("flat_residents")
        .insert({
          flat_id: selectedReassignFlatId,
          resident_id: selectedResident.id,
          is_owner: selectedReassignIsOwner,
          move_in_date: new Date().toISOString()
        });
        
      if (assignError) throw assignError;

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/users/${selectedResident.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ is_active: true }),
      });
      if (!res.ok) throw new Error("Failed to activate user profile");

      setEditSuccess("User reassigned and activated successfully!");
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
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (currentUserRole === "resident") {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm max-w-2xl mx-auto mt-8">
        <div className="mx-auto h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-500 text-sm max-w-sm mx-auto">
          User management is only accessible to Committee members and Administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Users className="h-6 w-6 text-indigo-600" />
            <span>Users Directory</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage society residents, committee members, and guards.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-medium text-sm shadow-sm shadow-indigo-500/20 transition-all cursor-pointer ring-1 ring-inset ring-indigo-500/20"
        >
          <Plus className="h-4 w-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Filters and Search */}
        <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div className="flex items-center p-1 bg-slate-200/50 rounded-xl space-x-1 border border-slate-200/50 overflow-x-auto max-w-full">
            {['all', 'resident', 'committee', 'guard'].map(role => (
              <button 
                key={role}
                onClick={() => setRoleFilter(role as "all" | "resident" | "guard" | "committee")} 
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all capitalize whitespace-nowrap ${roleFilter === role ? "bg-white text-indigo-700 shadow-sm ring-1 ring-black/5" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"}`}
              >
                {role === 'all' ? 'All Users' : role}
              </button>
            ))}
          </div>

          <div className="relative w-full xl:w-auto">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search users by name, flat, phone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 w-full xl:w-80 bg-white hover:border-slate-300 transition-colors shadow-sm"
            />
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Contact Info</th>
                <th className="px-6 py-4 font-semibold">Property</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Added</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-indigo-500" />
                    <p className="text-sm font-medium">Loading directory...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                    <div className="h-12 w-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3 ring-1 ring-slate-200">
                      <Users className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">No users found</p>
                    <p className="text-xs mt-1">Try adjusting your filters or search criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((resident) => (
                  <tr key={resident.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-9 w-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm ring-1 ring-indigo-100">
                          {resident.full_name ? resident.full_name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{resident.full_name || "N/A"}</div>
                          <div className="flex items-center space-x-1 mt-0.5">
                            {resident.role === 'committee' && <ShieldCheck className="h-3 w-3 text-indigo-500" />}
                            {resident.role === 'guard' && <Shield className="h-3 w-3 text-slate-500" />}
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{resident.role}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-700 font-medium">{resident.email}</div>
                      {resident.phone ? (
                        <div className="text-xs text-slate-500 mt-0.5">{resident.phone}</div>
                      ) : (
                        <div className="text-xs text-slate-400 mt-0.5 italic">No phone</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {resident.flat_residents && resident.flat_residents.length > 0 ? (
                        <div className="space-y-1.5">
                          {resident.flat_residents.map((fr, idx) => (
                            <div key={idx} className="flex flex-col">
                              <span className="text-sm font-medium text-slate-800">
                                {fr.flats?.property_type === 'bungalow' ? (
                                  `Bungalow ${fr.flats?.number}`
                                ) : (
                                  `${fr.flats?.towers?.name} • Apt ${fr.flats?.number}`
                                )}
                              </span>
                              <div>
                                {fr.is_owner ? (
                                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md border border-slate-200 inline-block mt-0.5">OWNER</span>
                                ) : (
                                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-md border border-indigo-100 inline-block mt-0.5">TENANT</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic px-2 py-1 bg-slate-50 rounded-md border border-slate-100">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {resident.is_active === false ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          Inactive
                        </span>
                      ) : resident.registration_status === 'pending_signup' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20">
                          Pending Signup
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                      {new Date(resident.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => openEditModal(resident)}
                        className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      >
                        Manage
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200/50">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">Invite New User</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 p-1.5 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleInviteSubmit} className="p-6 space-y-4">
              {inviteError && (
                <div className="p-3 rounded-xl bg-red-50 ring-1 ring-inset ring-red-600/20 text-red-600 text-sm font-medium">
                  {inviteError}
                </div>
              )}
              {inviteSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 ring-1 ring-inset ring-emerald-600/20 text-emerald-700 text-sm font-medium">
                  {inviteSuccess}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Role</label>
                <select 
                  name="role"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                >
                  <option value="resident">Resident</option>
                  <option value="committee">Committee Member</option>
                  <option value="guard">Security Guard</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="john@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Phone Number (Optional)</label>
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>

              <div className="pt-5 flex items-center justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={inviteLoading}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 rounded-xl shadow-sm shadow-indigo-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px] ring-1 ring-inset ring-indigo-500/20"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-8 animate-in fade-in zoom-in-95 duration-200 border border-slate-200/50">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">Manage User</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 p-1.5 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 rounded-xl bg-red-50 ring-1 ring-inset ring-red-600/20 text-red-600 text-sm font-medium">
                  {editError}
                </div>
              )}
              {editSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 ring-1 ring-inset ring-emerald-600/20 text-emerald-700 text-sm font-medium">
                  {editSuccess}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Full Name</label>
                <input 
                  type="text" 
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Role</label>
                <select 
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                >
                  <option value="resident">Resident</option>
                  <option value="committee">Committee Member</option>
                  <option value="guard">Security Guard</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                <input 
                  type="tel" 
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
              
              <div className="space-y-1.5 pt-1">
                <label className="text-sm font-semibold text-slate-700">Email Address</label>
                <input 
                  type="email" 
                  value={selectedResident.email}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed text-sm"
                />
                <p className="text-[10px] text-slate-400 font-medium ml-1">Email addresses cannot be changed.</p>
              </div>

              <div className="pt-5 flex flex-col space-y-4">
                <div className="flex items-center justify-end space-x-3">
                  <button 
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={editLoading}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 rounded-xl shadow-sm shadow-indigo-500/20 transition-all disabled:opacity-70 flex items-center justify-center min-w-[120px] ring-1 ring-inset ring-indigo-500/20"
                  >
                    {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                  </button>
                </div>
                
                {selectedResident.is_active !== false && (
                  <div className="pt-5 mt-2 border-t border-slate-100">
                    <button 
                      type="button"
                      onClick={handleDeactivate}
                      disabled={editLoading}
                      className="w-full px-4 py-2.5 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-xl transition-colors bg-white shadow-sm"
                    >
                      Deactivate User
                    </button>
                  </div>
                )}
                
                {(!selectedResident.is_active || !selectedResident.flat_residents || selectedResident.flat_residents.length === 0) && (
                  <div className="pt-5 mt-2 border-t border-slate-100 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-1">Assign to Property</h4>
                      <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                        {selectedResident.is_active === false 
                          ? "If this resident is moving within the society, assign them to a new property to reactivate their account."
                          : "Assign this active resident to a vacant property."}
                      </p>
                      <div className="flex flex-col space-y-3">
                        <select
                          value={selectedReassignFlatId}
                          onChange={(e) => setSelectedReassignFlatId(e.target.value)}
                          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        >
                          <option value="">Select a property...</option>
                          {vacantFlats.map((flat) => (
                            <option key={flat.id} value={flat.id}>
                              {flat.property_type === 'bungalow' ? 'Bungalow' : (flat.property_type === 'apartment' ? 'Apartment' : 'Flat')} {flat.number} 
                              {flat.towers?.name ? ` (${flat.towers.name})` : ''}
                            </option>
                          ))}
                        </select>
                        <div className="flex space-x-3">
                          <select
                            value={selectedReassignIsOwner ? "owner" : "tenant"}
                            onChange={(e) => setSelectedReassignIsOwner(e.target.value === "owner")}
                            className="flex-1 px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          >
                            <option value="tenant">Tenant</option>
                            <option value="owner">Owner</option>
                          </select>
                          <button
                            type="button"
                            onClick={handleReassign}
                            disabled={!selectedReassignFlatId || editLoading}
                            className="px-6 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-sm"
                          >
                            Assign
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {selectedResident.is_active === false && (
                      <div className="pt-5 border-t border-slate-100">
                        <button 
                          type="button"
                          onClick={handleDeletePermanent}
                          disabled={editLoading}
                          className="w-full px-4 py-2.5 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 ring-1 ring-inset ring-red-600/20 rounded-xl transition-colors shadow-sm"
                        >
                          Permanently Delete Account
                        </button>
                      </div>
                    )}
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
