'use client';

import { useState, useEffect } from 'react';
import { Settings2, Bell, AlertTriangle, Save } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    maintenance_mode: false,
    global_banner_active: false,
    global_banner_text: ''
  });
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    // Fetch /api/platform/settings mock
    setSettings({
      maintenance_mode: false,
      global_banner_active: true,
      global_banner_text: 'Welcome to the new Gatezly Portal!'
    });
  }, []);

  const handleSaveSettings = async () => {
    setLoading(true);
    // await fetch('/api/platform/settings', { method: 'POST', body: JSON.stringify(settings) });
    setTimeout(() => {
      setLoading(false);
      alert('Settings saved successfully');
    }, 800);
  };

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcement) return;
    // await fetch('/api/platform/notifications', { method: 'POST', body: JSON.stringify({ message: announcement }) });
    alert('Global announcement sent!');
    setAnnouncement('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 fill-mode-forwards p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Platform Settings</h1>
        <p className="text-slate-500 mt-2 text-sm">Configure global application settings and broadcast announcements.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 backdrop-blur-xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-400">
              <Settings2 className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">General Configuration</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-slate-900 flex items-center gap-2">
                  Maintenance Mode
                  {settings.maintenance_mode && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                </label>
                <p className="text-xs text-slate-400 mt-1">Lock down the platform for updates.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.maintenance_mode}
                  onChange={(e) => setSettings({...settings, maintenance_mode: e.target.checked})}
                />
                <div className="w-11 h-6 bg-slate-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="text-sm font-medium text-slate-900">Global Banner</label>
                  <p className="text-xs text-slate-400 mt-1">Show a banner at the top of all apps.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.global_banner_active}
                    onChange={(e) => setSettings({...settings, global_banner_active: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-slate-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                </label>
              </div>
              <input 
                type="text"
                disabled={!settings.global_banner_active}
                value={settings.global_banner_text}
                onChange={(e) => setSettings({...settings, global_banner_text: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-50"
                placeholder="Banner text..."
              />
            </div>

            <button 
              onClick={handleSaveSettings}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-slate-100 hover:bg-white/20 text-slate-900 px-4 py-2.5 rounded-xl transition-all border border-slate-100 mt-4"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 backdrop-blur-xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2.5 bg-purple-500/20 rounded-xl text-purple-400">
              <Bell className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Global Announcement</h2>
          </div>
          
          <form onSubmit={handleSendAnnouncement} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-2">Message Content</label>
              <textarea 
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
                placeholder="Type a message to push to all users..."
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-purple-500 hover:bg-purple-600 text-slate-900 px-4 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-purple-500/25"
            >
              Broadcast Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
