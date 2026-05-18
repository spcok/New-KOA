/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[260px] bg-zinc-900 border-r border-zinc-700 flex flex-col">
        <div className="h-16 border-b border-zinc-700 flex items-center px-5 gap-3">
          <div className="w-6 h-6 bg-cyan-500 rounded" />
          <span className="font-semibold text-sm tracking-tight">CLINICAL CORE v0.1</span>
        </div>
        <nav className="flex-1 py-5">
          <div className="px-5 py-3 text-sm text-cyan-500 bg-cyan-950/20 border-r-2 border-cyan-500">Phase 0: Scaffolding</div>
          {["Phase 1: Schema Sync", "Phase 2: Auth Layer", "Phase 3: UI Skeleton", "Phase 4: Deployment"].map((item) => (
            <div key={item} className="px-5 py-3 text-sm text-zinc-400 hover:bg-zinc-800 cursor-default">{item}</div>
          ))}
        </nav>
        <div className="p-5 border-t border-zinc-700">
          <div className="text-xs text-zinc-400">OFFLINE-FIRST ENGINE</div>
          <div className="text-sm mt-1">TanStack + Electric</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-6 gap-6 overflow-hidden bg-zinc-950">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-medium tracking-tight">Project Initialization</h1>
            <p className="text-zinc-400 text-sm mt-1">Environment: Google AI Studio | Target: React Vite</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-zinc-400">STATUS</div>
            <div className="text-emerald-500 text-xs">● READY TO PROVISION</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-wider text-zinc-400">Data Architecture</span>
            <span className="font-mono text-sm text-cyan-500">@tanstack/react-db</span>
          </div>
          {/* Add other cards as needed */}
        </div>
        <div className="bg-black border border-zinc-700 rounded-lg flex-1 font-mono p-4 text-emerald-500 text-sm overflow-auto">
          {/* Terminal content placeholder */}
          <div className="flex gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
          </div>
          <p>&gt; npm install ...</p>
        </div>
      </main>
    </div>
  );
}
