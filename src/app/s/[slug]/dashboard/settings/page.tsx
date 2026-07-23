"use client";

import React, { useState } from "react";
import { Save, Shield, Bell, Building2, Camera, Lock, CheckCircle2, AlertCircle, X, ChevronRight, SlidersHorizontal } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handleSaveClick = () => {
    setShowSaveModal(true);
  };

  const confirmSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setShowSaveModal(false);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    }, 1500);
  };

  const tabs = [
    { id: "general", label: "General Info", icon: Building2 },
    { id: "security", label: "Security & Gates", icon: Shield },
    { id: "notifications", label: "Alerts & Comms", icon: Bell },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Toast Notification */}
      <div 
        className={`fixed top-6 right-6 z-50 transition-all duration-500 transform ${
          showSuccessToast ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center space-x-3 border border-slate-700">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-medium">Settings saved successfully</span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/60 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="absolute top-0 right-0 p-32 bg-indigo-50/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="relative z-10 flex items-start sm:items-center space-x-5">
          <div className="p-3.5 bg-gradient-to-b from-white to-slate-50 border border-slate-200/80 rounded-2xl text-indigo-600 shadow-sm flex-shrink-0">
            <SlidersHorizontal className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Portal Settings</h1>
            <p className="text-sm text-slate-500 font-medium mt-1.5 max-w-lg leading-relaxed">
              Configure gate checkpoints, security rules, notification channels, and user role permissions.
            </p>
          </div>
        </div>
        <div className="relative z-10 sm:ml-auto">
          <button 
            onClick={handleSaveClick}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        {/* Sidebar Nav */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-3xl border border-slate-200/60 p-3 shadow-sm sticky top-6">
            <nav className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all whitespace-nowrap ${
                      isActive 
                        ? "bg-slate-900 text-white shadow-md shadow-slate-900/10" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                    <span>{tab.label}</span>
                    {isActive && <ChevronRight className="h-4 w-4 ml-auto opacity-50 hidden lg:block" />}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === "general" && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-sm">
                <div className="p-6 sm:p-8 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-indigo-500" />
                    <span>Society Profile</span>
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Manage core information about your society.</p>
                </div>
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Society Name</label>
                      <input 
                        type="text" 
                        defaultValue="Sunrise Valley Apartments"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Registration Number</label>
                      <input 
                        type="text" 
                        defaultValue="REG-2023-8944"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Complete Address</label>
                    <textarea 
                      rows={3}
                      defaultValue="123 Valley Road, Tech Park Layout, Bangalore, 560001"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-sm">
                <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                      <Camera className="h-5 w-5 text-rose-500" />
                      <span>Gate Checkpoints</span>
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Configure entry points and camera integrations.</p>
                  </div>
                  <button className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors">
                    + Add Gate
                  </button>
                </div>
                <div className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-100">
                    {/* Gate Item */}
                    <div className="bg-white p-6 hover:bg-slate-50 transition-colors cursor-pointer group">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-600">
                            <Lock className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Main Gate</h4>
                            <p className="text-xs text-slate-500 mt-0.5">2 Cameras Active</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Online</span>
                        </div>
                      </div>
                    </div>
                    {/* Gate Item */}
                    <div className="bg-white p-6 hover:bg-slate-50 transition-colors cursor-pointer group">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2.5 bg-slate-100 rounded-xl text-slate-500">
                            <Lock className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Basement Entry</h4>
                            <p className="text-xs text-slate-500 mt-0.5">1 Camera Active</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Offline</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-sm p-6 sm:p-8">
                <h3 className="text-base font-bold text-slate-900 mb-4">Security Policies</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">Mandatory Visitor Approval</p>
                      <p className="text-xs text-slate-500 mt-0.5">Require resident approval for all non-service visitors</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">Night Curfew Mode</p>
                      <p className="text-xs text-slate-500 mt-0.5">Restrict delivery entry between 11 PM and 6 AM</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" value="" className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-sm p-6 sm:p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
                <div className="h-16 w-16 rounded-3xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-4">
                  <Bell className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Communication Channels</h3>
                <p className="text-sm text-slate-500 max-w-sm mt-2 mb-6">
                  Configure SMS, Email, and Push notification templates for visitor arrivals and community announcements.
                </p>
                <button className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors shadow-md shadow-slate-900/10">
                  Configure Channels
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Confirmation Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => !isSaving && setShowSaveModal(false)}
          />
          <div className="relative bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowSaveModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              disabled={isSaving}
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <AlertCircle className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Confirm Changes</h3>
                <p className="text-sm text-slate-500 mt-2">
                  Are you sure you want to apply these settings? This may affect currently active gate checkpoints and security policies.
                </p>
              </div>
              
              <div className="flex items-center gap-3 w-full pt-4">
                <button 
                  onClick={() => setShowSaveModal(false)}
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmSave}
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 rounded-2xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20 disabled:opacity-70 flex items-center justify-center"
                >
                  {isSaving ? (
                    <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    "Confirm Save"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
