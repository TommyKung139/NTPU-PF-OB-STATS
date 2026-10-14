'use client';

interface SavantPercentileChartProps {
    metrics: {
        label: string;
        value: number; // The raw value (e.g. .300)
        percentile: number; // 0-100
        format?: (val: number) => string;
    }[];
}

// Diverging pair (validated: blue <-> red, neutral gray midpoint) — percentile
// is a polarity (poor vs great around a league-average center), which is
// exactly what a diverging scale encodes. Discrete steps read more clearly
// than a continuous interpolation at this marker size.
function markerColor(percentile: number) {
    if (percentile >= 90) return '#e34948'; // great — red, full strength
    if (percentile >= 75) return '#ea7472';
    if (percentile >= 60) return '#ef9d9b';
    if (percentile >= 40) return '#9a9890'; // average — neutral gray
    if (percentile >= 25) return '#6fa4e0';
    return '#2a78d6'; // poor — blue, full strength
}

export function SavantPercentileChart({ metrics }: SavantPercentileChartProps) {
    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200/80 p-4">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                <h3 className="font-semibold text-slate-900">
                    Batting
                </h3>
                <div className="flex text-[11px] font-semibold tracking-wide text-slate-400 gap-4 md:gap-12">
                    <span>POOR</span>
                    <span>AVERAGE</span>
                    <span>GREAT</span>
                </div>
            </div>

            <div className="space-y-3.5">
                {metrics.map((metric) => (
                    <div key={metric.label} className="relative">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-slate-600 w-24 text-right pr-4">
                                {metric.label}
                            </span>

                            {/* Bar Container */}
                            <div className="flex-1 h-5 bg-slate-100 rounded-full relative overflow-hidden flex items-center">
                                {/* Diverging background wash: blue -> gray -> red */}
                                <div
                                    className="absolute inset-0 opacity-[0.16]"
                                    style={{ background: 'linear-gradient(to right, #2a78d6, #9a9890, #e34948)' }}
                                />

                                {/* The marker */}
                                <div
                                    className="absolute h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm transition-all duration-500"
                                    style={{
                                        left: `calc(${metric.percentile}% - 10px)`,
                                        backgroundColor: markerColor(metric.percentile),
                                        boxShadow: '0 0 0 2px #fff',
                                    }}
                                >
                                    {metric.percentile}
                                </div>
                            </div>

                            <span className="font-mono text-slate-500 w-16 text-right pl-2 text-xs tabular-nums">
                                {metric.format ? metric.format(metric.value) : metric.value}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
