'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, User, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

type UserProfile = { id: string; email?: string; full_name?: string; role?: string; society_id?: string; society_name?: string; created_at?: string; status?: string };

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    // Simulating call to /api/platform/users or direct supabase query
    const { data } = await supabase.from('profiles').select('*').limit(50);
    if (data) setUsers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(user => 
    (user.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 fill-mode-forwards p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Platform Users</h1>
          <p className="text-white/60 mt-2 text-sm">Global directory of all users across societies.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all backdrop-blur-md"
            />
          </div>
          <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white/70">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/10 rounded-3xl backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/[0.02] border-b border-white/10 text-white/50">
              <tr>
                <th className="px-6 py-4 font-medium">User Details</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Society</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-white/50 animate-pulse">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user, idx) => (
                  <tr key={user.id || idx} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-white/60" />
                        </div>
                        <div>
                          <p className="text-white font-medium group-hover:text-indigo-400 transition-colors">{user.full_name || 'Unknown User'}</p>
                          <p className="text-white/50 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-white/80 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                        {user.role || 'Member'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/70">
                      {user.society_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-white/50">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
