'use client';

import { useStore, PlayerStats } from '@/lib/store';
import { SavantPercentileChart } from '@/components/SavantPercentileChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { notFound } from 'next/navigation';
import { ArrowLeft, UserCircle } from 'lucide-react';
import Link from 'next/link';

import React from 'react';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function PlayerPage({ params }: PageProps) {
    const { players, games, stats } = useStore();
    const { id } = React.use(params);
    const player = players.find((p) => p.id === id);

    if (!player) {
        return notFound();
    }

    // --- Helper Functions ---

    const calculateAdvancedStats = (pStats: PlayerStats[]) => {
        const pa = pStats.reduce((sum, s) => sum + (s.pa || 0), 0);
        const ab = pStats.reduce((sum, s) => sum + (s.ab || 0), 0);
        const h = pStats.reduce((sum, s) => sum + (s.h1 || 0) + (s.h2 || 0) + (s.h3 || 0) + (s.hr || 0), 0);
        const h1 = pStats.reduce((sum, s) => sum + (s.h1 || 0), 0);
        const h2 = pStats.reduce((sum, s) => sum + (s.h2 || 0), 0);
        const h3 = pStats.reduce((sum, s) => sum + (s.h3 || 0), 0);
        const hr = pStats.reduce((sum, s) => sum + (s.hr || 0), 0);
        const bb = pStats.reduce((sum, s) => sum + (s.bb || 0), 0);
        const so = pStats.reduce((sum, s) => sum + (s.so || 0), 0);
        const sf = pStats.reduce((sum, s) => sum + (s.sf || 0), 0);
        const tb = h1 + 2 * h2 + 3 * h3 + 4 * hr;

        const avg = ab ? h / ab : 0;
        const obp = (ab + bb + sf) ? (h + bb) / (ab + bb + sf) : 0;
        const slg = ab ? tb / ab : 0;
        const ops = obp + slg;
        const iso = slg - avg; // isoP%

        // wOBA (Approximate weights)
        const wobaNum = (0.69 * bb) + (0.89 * h1) + (1.27 * h2) + (1.62 * h3) + (2.10 * hr);
        const wobaDenom = ab + bb + sf;
        const woba = wobaDenom ? wobaNum / wobaDenom : 0;

        return { pa, ab, h, hr, bb, so, avg, obp, slg, ops, iso, woba };
    };

    // --- Data Preparation ---

    // 1. Get Team Baseline for OPS+
    const teamStats = calculateAdvancedStats(stats);
    const teamObp = teamStats.obp || 0.320;
    const teamSlg = teamStats.slg || 0.400;

    // 2. Get All Players' Stats for Percentiles
    const allPlayersStats = players.map(p => {
        const pStats = stats.filter(s => s.playerId === p.id);
        return { id: p.id, ...calculateAdvancedStats(pStats) };
    }).filter(p => p.pa > 0);

    // 3. Calculate Percentile
    const getPercentile = (value: number, dataset: number[]) => {
        if (dataset.length === 0) return 0;
        const sorted = [...dataset].sort((a, b) => a - b);
        const rank = sorted.filter(v => v < value).length;
        const equal = sorted.filter(v => v === value).length;
        return Math.round(((rank + 0.5 * equal) / sorted.length) * 100);
    };

    // 4. Get Stats Splits
    const sortedGames = [...games].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const last5GameIds = sortedGames.slice(0, 5).map(g => g.id);
    const last10GameIds = sortedGames.slice(0, 10).map(g => g.id);

    const playerAllTimeStats = stats.filter(s => s.playerId === player.id);
    const playerLast5Stats = stats.filter(s => s.playerId === player.id && last5GameIds.includes(s.gameId));
    const playerLast10Stats = stats.filter(s => s.playerId === player.id && last10GameIds.includes(s.gameId));

    const metricsAllTime = calculateAdvancedStats(playerAllTimeStats);
    const metricsLast5 = calculateAdvancedStats(playerLast5Stats);
    const metricsLast10 = calculateAdvancedStats(playerLast10Stats);

    const calculateOpsPlus = (obp: number, slg: number) => {
        if (!teamObp || !teamSlg) return 100;
        return 100 * ((obp / teamObp) + (slg / teamSlg) - 1);
    };

    const opsPlus = calculateOpsPlus(metricsAllTime.obp, metricsAllTime.slg);

    // Chart Metrics (Percentiles based on Career stats vs Team)
    const chartMetrics = [
        {
            label: 'xwOBA', // Using wOBA as proxy
            value: metricsAllTime.woba,
            percentile: getPercentile(metricsAllTime.woba, allPlayersStats.map(p => p.woba)),
            format: (v: number) => v.toFixed(3).replace('0.', '.')
        },
        {
            label: 'xBA', // Using AVG as proxy
            value: metricsAllTime.avg,
            percentile: getPercentile(metricsAllTime.avg, allPlayersStats.map(p => p.avg)),
            format: (v: number) => v.toFixed(3).replace('0.', '.')
        },
        {
            label: 'xSLG', // Using SLG as proxy
            value: metricsAllTime.slg,
            percentile: getPercentile(metricsAllTime.slg, allPlayersStats.map(p => p.slg)),
            format: (v: number) => v.toFixed(3).replace('0.', '.')
        },
        {
            label: 'OPS+',
            value: opsPlus,
            percentile: getPercentile(opsPlus, allPlayersStats.map(p => calculateOpsPlus(p.obp, p.slg))),
            format: (v: number) => Math.round(v).toString()
        },
        {
            label: 'BB %',
            value: metricsAllTime.pa ? (metricsAllTime.bb / metricsAllTime.pa) * 100 : 0,
            percentile: getPercentile(metricsAllTime.pa ? (metricsAllTime.bb / metricsAllTime.pa) : 0, allPlayersStats.map(p => p.pa ? (p.bb / p.pa) : 0)),
            format: (v: number) => v.toFixed(1)
        },
        {
            label: 'K %',
            value: metricsAllTime.pa ? (metricsAllTime.so / metricsAllTime.pa) * 100 : 0,
            percentile: 100 - getPercentile(metricsAllTime.pa ? (metricsAllTime.so / metricsAllTime.pa) : 0, allPlayersStats.map(p => p.pa ? (p.so / p.pa) : 0)), // Inverse for K%
            format: (v: number) => v.toFixed(1)
        },
        {
            label: 'ISO',
            value: metricsAllTime.iso,
            percentile: getPercentile(metricsAllTime.iso, allPlayersStats.map(p => p.iso)),
            format: (v: number) => v.toFixed(3).replace('0.', '.')
        },
    ];

    return (
        <div className="container mx-auto py-8 px-4">
            <Link href="/players" className="flex items-center text-slate-500 hover:text-slate-900 mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Roster
            </Link>

            {/* Player Header */}
            <div className="bg-white border-b mb-8 pb-6 flex flex-col md:flex-row items-center gap-8">
                <div className="h-32 w-32 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                    <UserCircle className="h-24 w-24 text-slate-300" />
                </div>
                <div className="text-center md:text-left">
                    <h1 className="text-5xl font-bold text-slate-900 mb-2">{player.name}</h1>
                    <div className="text-xl text-slate-600 flex items-center justify-center md:justify-start gap-3">
                        <span className="font-mono font-bold bg-slate-100 px-2 py-1 rounded">#{player.number}</span>
                        <span>|</span>
                        <span>Team Player</span>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-[1fr_400px] gap-12">
                {/* Left Column: Stats Table */}
                <div className="space-y-8">
                    <div>
                        <h3 className="text-xl font-bold mb-4 text-slate-900">Standard Batting</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Split</th>
                                        <th className="px-4 py-3 font-medium text-right">PA</th>
                                        <th className="px-4 py-3 font-medium text-right">AB</th>
                                        <th className="px-4 py-3 font-medium text-right">H</th>
                                        <th className="px-4 py-3 font-medium text-right">HR</th>
                                        <th className="px-4 py-3 font-medium text-right">AVG</th>
                                        <th className="px-4 py-3 font-medium text-right">OBP</th>
                                        <th className="px-4 py-3 font-medium text-right">SLG</th>
                                        <th className="px-4 py-3 font-medium text-right">OPS</th>
                                        <th className="px-4 py-3 font-medium text-right">wOBA</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {[
                                        { label: 'Last 5 Games', data: metricsLast5 },
                                        { label: 'Last 10 Games', data: metricsLast10 },
                                        { label: 'Career', data: metricsAllTime, highlight: true },
                                    ].map((row) => (
                                        <tr key={row.label} className={row.highlight ? 'bg-slate-50 font-bold' : 'bg-white'}>
                                            <td className="px-4 py-3 font-medium text-slate-900">{row.label}</td>
                                            <td className="px-4 py-3 text-right">{row.data.pa}</td>
                                            <td className="px-4 py-3 text-right">{row.data.ab}</td>
                                            <td className="px-4 py-3 text-right">{row.data.h}</td>
                                            <td className="px-4 py-3 text-right">{row.data.hr}</td>
                                            <td className="px-4 py-3 text-right">{row.data.avg.toFixed(3).replace('0.', '.')}</td>
                                            <td className="px-4 py-3 text-right">{row.data.obp.toFixed(3).replace('0.', '.')}</td>
                                            <td className="px-4 py-3 text-right">{row.data.slg.toFixed(3).replace('0.', '.')}</td>
                                            <td className="px-4 py-3 text-right">{row.data.ops.toFixed(3)}</td>
                                            <td className="px-4 py-3 text-right">{row.data.woba.toFixed(3).replace('0.', '.')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column: Percentiles */}
                <div>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="text-slate-900">Percentile Rankings</span>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">vs Teammates</span>
                    </h3>
                    <SavantPercentileChart metrics={chartMetrics} />
                </div>
            </div>
        </div>
    );
}
