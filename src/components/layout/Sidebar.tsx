import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { 
  LayoutDashboard, PawPrint, Stethoscope, ClipboardList, ShieldAlert,
  CalendarDays, Apple, Syringe, Activity, BriefcaseMedical, AlertTriangle, 
  Wrench, Users, Clock, CalendarHeart, FileBadge, FileWarning, 
  BarChart3, Settings, HelpCircle, ChevronDown, ChevronRight, HeartPulse,
  Utensils
} from 'lucide-react';

const navGroups = [
  {
    title: 'Husbandry',
    icon: PawPrint,
    items: [
      { name: 'Daily Logs', to: '/husbandry/daily-logs', icon: ClipboardList },
      { name: 'Daily Rounds', to: '/husbandry/daily-rounds', icon: CalendarDays },
      { name: 'Feeding Schedule', to: '/husbandry/feeding-schedule', icon: Utensils },
    ]
  },
  {
    title: 'Clinical and Medical',
    icon: Stethoscope,
    items: [
      { name: 'Clinical Records', to: '/clinical/records', icon: HeartPulse },
      { name: 'Medication', to: '/clinical/medication', icon: Syringe },
      { name: 'Quarantine and Isolation', to: '/clinical/quarantine', icon: ShieldAlert },
    ]
  },
  {
    title: 'Safety and Compliance',
    icon: AlertTriangle,
    items: [
      { name: 'First Aid', to: '/safety/first-aid', icon: BriefcaseMedical },
      { name: 'Incidents', to: '/safety/incidents', icon: AlertTriangle },
      { name: 'Safety Drills', to: '/safety/drills', icon: Activity },
      { name: 'Maintenance', to: '/safety/maintenance', icon: Wrench },
    ]
  },
  {
    title: 'Staff',
    icon: Users,
    items: [
      { name: 'Timesheets', to: '/staff/timesheets', icon: Clock },
      { name: 'Rota', to: '/staff/rota', icon: CalendarDays },
      { name: 'Holiday Requests', to: '/staff/holidays', icon: CalendarHeart },
      { name: 'ZLA Compliance', to: '/staff/zla', icon: FileBadge },
      { name: 'Missing Records', to: '/staff/missing', icon: FileWarning },
    ]
  },
  {
    title: 'Admin',
    icon: Settings,
    items: [
      { name: 'Reports', to: '/admin/reports', icon: BarChart3 },
      { name: 'Settings', to: '/admin/settings', icon: Settings },
      { name: 'Help', to: '/admin/help', icon: HelpCircle },
    ]
  }
];

function NavGroup({ group }: { group: any, key?: React.Key }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="mb-4">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors"
      >
        <div className="flex items-center gap-2">
          <group.icon size={14} />
          {group.title}
        </div>
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {isOpen && (
        <div className="mt-1 space-y-0.5">
          {group.items.map((item: any) => (
            <Link
              key={item.name}
              to={item.to}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors group [&.active]:bg-emerald-500/10 [&.active]:text-emerald-400"
            >
              <item.icon size={16} className="shrink-0 transition-colors group-[&.active]:text-emerald-400" />
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  return (
    <div className="w-64 bg-[#0F1117] border-r border-slate-800/80 flex flex-col h-full shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0A0B0E] border border-slate-800/80 flex items-center justify-center shadow-inner">
            <ShieldAlert size={16} className="text-emerald-500" />
          </div>
          <span className="font-black text-white tracking-tight uppercase">Vetaura</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 mb-6 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors group [&.active]:bg-emerald-500/10 [&.active]:text-emerald-400"
        >
          <LayoutDashboard size={18} className="shrink-0 transition-colors group-[&.active]:text-emerald-400" />
          Dashboard
        </Link>
        
        {navGroups.map((group) => (
          <NavGroup key={group.title} group={group} />
        ))}
      </nav>
    </div>
  );
}
