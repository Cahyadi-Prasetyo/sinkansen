import React from 'react';

export default function MainApp() {
    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 selection:bg-emerald-500 selection:text-white">
            <div className="max-w-2xl w-full bg-slate-800/90 backdrop-blur border border-slate-700/80 rounded-2xl p-8 shadow-2xl text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-6 text-3xl font-bold border border-emerald-500/20 shadow-inner">
                    🚄
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-3">
                    Sinkansen System
                </h1>
                <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                    Sistem Informasi Ketersediaan Dosen & Antrian Konsultasi Kampus.
                    Frontend React siap dikembangkan pada branch <code className="px-2 py-0.5 bg-slate-900 text-emerald-400 font-mono rounded border border-slate-700">fe</code>.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left p-4 bg-slate-900/80 rounded-xl border border-slate-700/60 text-xs mb-6">
                    <div>
                        <span className="text-slate-500 block mb-1 font-semibold uppercase tracking-wider">Backend</span>
                        <span className="text-slate-200 font-medium">Laravel 12 (PHP 8.2)</span>
                    </div>
                    <div>
                        <span className="text-slate-500 block mb-1 font-semibold uppercase tracking-wider">Frontend</span>
                        <span className="text-slate-200 font-medium">React 19 + Vite</span>
                    </div>
                    <div>
                        <span className="text-slate-500 block mb-1 font-semibold uppercase tracking-wider">Styling</span>
                        <span className="text-slate-200 font-medium">Tailwind CSS v4</span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-700/50 border border-slate-600/40">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Branch: <strong>fe</strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-700/50 border border-slate-600/40">
                        Target Integration: <strong>dev</strong>
                    </span>
                </div>
            </div>
        </div>
    );
}
