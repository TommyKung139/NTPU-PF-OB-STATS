'use client';

import { cn } from '@/lib/utils';

interface SavantPercentileChartProps {
    metrics: {
        label: string;
        value: number; // The raw value (e.g. .300)
        percentile: number; // 0-100
        format?: (val: number) => string;
    }[];
}

export function SavantPercentileChart({ metrics }: SavantPercentileChartProps) {
    return (
        <div className="w-full bg-white rounded-lg shadow-sm border p-4">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <span className="text-slate-900">Batting</span>
                </h3>
                <div className="flex text-xs font-bold text-slate-400 gap-4 md:gap-12">
                    <span>POOR</span>
                    <span>AVERAGE</span>
                    <span>GREAT</span>
                </div>
            </div>

            <div className="space-y-3">
                {metrics.map((metric) => (
                    <div key={metric.label} className="relative">
                        <div className="flex items-center justify-between mb-1 text-sm">
                            <span className="font-medium text-slate-700 w-24 text-right pr-4">
                                {metric.label}
                            </span>

                            {/* Bar Container */}
                            <div className="flex-1 h-6 bg-slate-100 rounded-full relative overflow-hidden flex items-center">
                                {/* Gradient Background */}
                                <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-blue-500 via-slate-200 to-red-500" />

                                {/* The Circle Indicator */}
                                <div
                                    className={cn(
                                        "absolute h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white shadow-sm transition-all duration-500",
                                        metric.percentile >= 90 ? "bg-red-600" :
                                            metric.percentile >= 75 ? "bg-red-500" :
                                                metric.percentile >= 60 ? "bg-red-400" :
                                                    metric.percentile >= 40 ? "bg-slate-400" :
                                                        metric.percentile >= 25 ? "bg-blue-400" :
                                                            "bg-blue-600"
                                    )}
                                    style={{ left: `calc(${metric.percentile}% - 12px)` }}
                                >
                                    {metric.percentile}
                                </div>
                            </div>

                            <span className="font-mono text-slate-500 w-16 text-right pl-2 text-xs">
                                {metric.format ? metric.format(metric.value) : metric.value}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
