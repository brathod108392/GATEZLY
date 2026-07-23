'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Shield, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

// Use proper type instead of any
type AdminProfile = { id: string; email?: string; full_name?: string; role?: string; created_at?: string; avatar_url?: string };

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const fetchAdmins = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'superadmin');
    if (data) setAdmins(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: 'superadmin' })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setInviteEmail('');
        fetchAdmins();
      } else {
        alert('Failed to invite admin');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (admins.length <= 1) {
      alert("Cannot remove the last superadmin.");
      return;
    }
    await supabase.from('users').delete().eq('id', id);
    fetchAdmins();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 fill-mode-forwards p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Super Admins</h1>
          <p className="text-slate-500 mt-2 text-sm">Manage platform administrators and their access levels.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-slate-100 hover:bg-white/20 text-slate-900 px-4 py-2 rounded-xl transition-all border border-slate-100 backdrop-blur-md"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Admin</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl backdrop-blur-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse">Loading admins...</div>
        ) : (
          <div className="divide-y divide-white/5">
            {admins.map((admin, idx) => (
              <div 
                key={admin.id || idx} 
                className="p-6 flex items-center justify-between hover:bg-white transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-slate-200">
                    <Shield className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-medium">{admin.full_name || 'Admin User'}</h3>
                    <p className="text-slate-400 text-sm">{admin.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                    Active
                  </span>
                  <button 
                    onClick={() => handleDelete(admin.id)}
                    className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {admins.length === 0 && (
              <div className="p-8 text-center text-slate-400">No super admins found.</div>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-50 border border-slate-200 rounded-3xl w-full max-w-md shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Invite Super Admin</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  placeholder="admin@gatezly.com"
                  required
                />
              </div>
              <div className="flex justify-end pt-4">
                <button 
                  type="submit"
                  className="bg-indigo-500 hover:bg-indigo-600 text-slate-900 px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/25 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
