'use client';

import { useState, useEffect } from 'react';
import { Activity, Clock, ShieldAlert, CheckCircle2, Info } from 'lucide-react';

export default function LogsPage() {
  const [logs, setLogs] = useState<{ id: number; action?: string; details?: string; user?: string; time?: string; type?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mocking fetch /api/platform/logs
    setTimeout(() => {
      setLogs([
        { id: 1, action: 'Updated Settings', details: 'Enabled global banner', user: 'Admin One', time: '2 mins ago', type: 'info' },
        { id: 2, action: 'Deleted User', details: 'Removed john@doe.com', user: 'Admin Two', time: '1 hour ago', type: 'warning' },
        { id: 3, action: 'Invited Admin', details: 'Sent invite to jane@gatezly.com', user: 'Admin One', time: '3 hours ago', type: 'success' },
        { id: 4, action: 'System Backup', details: 'Automated backup completed', user: 'System', time: '1 day ago', type: 'info' },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'warning': return <ShieldAlert className="w-5 h-5 text-amber-500" />;
      case 'success': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 fill-mode-forwards p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Audit Logs</h1>
          <p className="text-white/60 mt-2 text-sm">System activity and administrator actions history.</p>
        </div>
        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
          <Activity className="w-6 h-6 text-indigo-400" />
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl relative">
        <div className="absolute top-0 bottom-0 left-[2.25rem] md:left-[3.25rem] w-px bg-white/10"></div>
        
        <div className="space-y-8 relative">
          {loading ? (
            <div className="text-center text-white/50 animate-pulse py-10">Loading logs...</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex gap-4 md:gap-8 group">
                <div className="relative z-10 w-10 h-10 rounded-2xl bg-zinc-900 border border-white/20 flex items-center justify-center shrink-0 group-hover:border-white/40 transition-colors shadow-lg">
                  {getIconForType(log.type || '')}
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 flex-1 group-hover:bg-white/[0.08] transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                    <h3 className="text-white font-medium text-lg">{log.action}</h3>
                    <div className="flex items-center text-xs text-white/40 bg-black/20 px-2.5 py-1 rounded-full w-fit">
                      <Clock className="w-3 h-3 mr-1.5" />
                      {log.time}
                    </div>
                  </div>
                  <p className="text-white/60 text-sm mb-3">{log.details}</p>
                  <div className="text-xs text-white/40 flex items-center gap-1.5 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                    Initiated by: <span className="text-white/70">{log.user}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
