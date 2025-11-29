'use client';

import { useStore } from '@/lib/store';
import { BarChart2, AlertCircle } from 'lucide-react';

export function GlobalLoader() {
    const { isLoading, error } = useStore();

    if (!isLoading && !error) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
            <div className="text-center">
                {error ? (
                    <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                        <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertCircle className="h-8 w-8 text-red-600" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold text-slate-900">連線錯誤</h2>
                            <p className="text-slate-500 max-w-md">{error}</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
                        <div className="relative">
                            {/* Background ring */}
                            <div className="h-24 w-24 rounded-full border-4 border-slate-100"></div>

                            {/* Spinning progress ring */}
                            <div className="absolute top-0 left-0 h-24 w-24 rounded-full border-4 border-green-500 border-t-transparent animate-spin"></div>

                            {/* Icon in center */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <div className="bg-green-500 rounded-full p-3 shadow-lg shadow-green-500/20">
                                    <BarChart2 className="h-8 w-8 text-white" />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-slate-900">紀錄組熱身中...</h2>
                            <p className="text-sm text-slate-500">打擊數據準備中...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
