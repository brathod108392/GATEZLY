"use client";

import React, { useState, useEffect } from "react";
import { Users, Plus, Loader2, Search, X } from "lucide-react";
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
          User management is only accessible to Committee members and Administrators.
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
            <span>Users</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage society residents, family members, committee, and guards.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Role Filter Tabs */}
        <div className="flex items-center overflow-x-auto border-b border-slate-200 bg-slate-50/50 p-2 space-x-2">
          <button onClick={() => setRoleFilter("all")} className={`px-4 py-2 text-sm font-semibold rounded-lg transition whitespace-nowrap ${roleFilter === "all" ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>All Users</button>
          <button onClick={() => setRoleFilter("resident")} className={`px-4 py-2 text-sm font-semibold rounded-lg transition whitespace-nowrap ${roleFilter === "resident" ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>Residents</button>
          <button onClick={() => setRoleFilter("committee")} className={`px-4 py-2 text-sm font-semibold rounded-lg transition whitespace-nowrap ${roleFilter === "committee" ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>Committee</button>
          <button onClick={() => setRoleFilter("guard")} className={`px-4 py-2 text-sm font-semibold rounded-lg transition whitespace-nowrap ${roleFilter === "guard" ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>Guards</button>
        </div>

        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="font-semibold text-slate-800">Directory</h3>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search users..." 
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
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-3">
                      <Users className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">No users found</p>
                    <p className="text-xs mt-1">Try adjusting your filters or search.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((resident) => (
                  <tr key={resident.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{resident.full_name || "N/A"}</div>
                      <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-1">{resident.role}</div>
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
                              {fr.flats?.property_type === 'bungalow' ? (
                                <span className="text-sm font-bold text-slate-800">Bungalow {fr.flats?.number}</span>
                              ) : (
                                <>
                                  <span className="text-sm font-bold text-slate-800">{fr.flats?.towers?.name} &bull; {fr.flats?.property_type === 'apartment' ? 'Apt' : 'Flat'} {fr.flats?.number}</span>
                                </>
                              )}
                              {fr.is_owner ? (
                                <span className="ml-1 text-[9px] font-bold bg-amber-100 text-amber-700 px-1 py-0.5 rounded">OWNER</span>
                              ) : (
                                <span className="ml-1 text-[9px] font-bold bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded">TENANT</span>
                              )}
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
                      ) : resident.registration_status === 'pending_signup' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          Pending Signup
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
              <h3 className="text-lg font-bold text-slate-900">Invite User</h3>
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
                <label className="text-sm font-medium text-slate-700">Role</label>
                <select 
                  name="role"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                >
                  <option value="resident">Resident</option>
                  <option value="committee">Committee Member</option>
                  <option value="guard">Security Guard</option>
                </select>
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
              <h3 className="text-lg font-bold text-slate-900">Edit User</h3>
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
                <label className="text-sm font-medium text-slate-700">Role</label>
                <select 
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                >
                  <option value="resident">Resident</option>
                  <option value="committee">Committee Member</option>
                  <option value="guard">Security Guard</option>
                </select>
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
                      Deactivate User
                    </button>
                  </div>
                )}
                
                {(!selectedResident.is_active || !selectedResident.flat_residents || selectedResident.flat_residents.length === 0) && (
                  <div className="pt-4 mt-2 border-t border-slate-100 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-2">Assign to Property</h4>
                      <p className="text-xs text-slate-500 mb-2">
                        {selectedResident.is_active === false 
                          ? "If this resident is moving within the society, assign them to a new property to reactivate their account."
                          : "Assign this active resident to a vacant property."}
                      </p>
                      <div className="flex flex-col space-y-2">
                        <select
                          value={selectedReassignFlatId}
                          onChange={(e) => setSelectedReassignFlatId(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-500"
                        >
                          <option value="">Select a property...</option>
                          {vacantFlats.map((flat) => (
                            <option key={flat.id} value={flat.id}>
                              {flat.property_type === 'bungalow' ? 'Bungalow' : (flat.property_type === 'apartment' ? 'Apartment' : 'Flat')} {flat.number} 
                              {flat.towers?.name ? ` (${flat.towers.name})` : ''}
                            </option>
                          ))}
                        </select>
                        <div className="flex space-x-2">
                          <select
                            value={selectedReassignIsOwner ? "owner" : "tenant"}
                            onChange={(e) => setSelectedReassignIsOwner(e.target.value === "owner")}
                            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-500"
                          >
                            <option value="tenant">Tenant</option>
                            <option value="owner">Owner</option>
                          </select>
                          <button
                            type="button"
                            onClick={handleReassign}
                            disabled={!selectedReassignFlatId || editLoading}
                            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                          >
                            Assign
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {selectedResident.is_active === false && (
                      <div className="pt-4 border-t border-slate-100">
                        <button 
                          type="button"
                          onClick={handleDeletePermanent}
                          disabled={editLoading}
                          className="w-full px-4 py-2.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition"
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
