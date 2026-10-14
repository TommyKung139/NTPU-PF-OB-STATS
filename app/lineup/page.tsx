'use client';

import { useState } from 'react';
import { useStore, Player, PlayerStats } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Sparkles, Users } from 'lucide-react';

export default function LineupPage() {
    const { players, stats } = useStore();
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
    const [generatedLineup, setGeneratedLineup] = useState<{ player: Player; role: string; reason: string }[] | null>(null);

    const handlePlayerToggle = (id: string) => {
        setSelectedPlayerIds(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const calculateMetrics = (playerId: string) => {
        const pStats = stats.filter(s => s.playerId === playerId);
        const totalAB = pStats.reduce((sum, s) => sum + (s.ab || 0), 0);
        const totalH = pStats.reduce((sum, s) => sum + (s.h1 || 0) + (s.h2 || 0) + (s.h3 || 0) + (s.hr || 0), 0);
        const totalBB = pStats.reduce((sum, s) => sum + (s.bb || 0), 0);
        const totalSF = pStats.reduce((sum, s) => sum + (s.sf || 0), 0);
        const totalTB = pStats.reduce((sum, s) => sum + (s.h1 || 0) + 2 * (s.h2 || 0) + 3 * (s.h3 || 0) + 4 * (s.hr || 0), 0);

        const avg = totalAB ? (totalH / totalAB) : 0;
        const obp = (totalAB + totalBB + totalSF) ? (totalH + totalBB) / (totalAB + totalBB + totalSF) : 0;
        const slg = totalAB ? (totalTB / totalAB) : 0;
        const ops = obp + slg;

        return { avg, obp, slg, ops };
    };

    const generateLineup = () => {
        // 1. Get selected players with their stats
        const roster = players
            .filter(p => selectedPlayerIds.includes(p.id))
            .map(p => ({ ...p, stats: calculateMetrics(p.id) }));

        if (roster.length === 0) return;

        // 2. Sort by OPS for general strength
        const sortedByOps = [...roster].sort((a, b) => b.stats.ops - a.stats.ops);

        // 3. Assign roles based on traditional baseball logic
        // This is a simplified algorithm
        const lineup: typeof generatedLineup = [];
        const usedIds = new Set<string>();

        const pickPlayer = (criteria: (p: typeof roster[0]) => number, excludeIds: Set<string>) => {
            const candidates = roster.filter(p => !excludeIds.has(p.id));
            if (candidates.length === 0) return null;
            return candidates.reduce((prev, curr) => criteria(curr) > criteria(prev) ? curr : prev);
        };

        // 1. Leadoff (High OBP, Speed - we don't have speed, so just OBP)
        const leadoff = pickPlayer(p => p.stats.obp, usedIds);
        if (leadoff) {
            lineup.push({ player: leadoff, role: 'Leadoff', reason: `Highest OBP (${leadoff.stats.obp.toFixed(3)}) to get on base` });
            usedIds.add(leadoff.id);
        }

        // 4. Cleanup (High SLG/Power)
        const cleanup = pickPlayer(p => p.stats.slg, usedIds);
        if (cleanup) {
            // Insert at index 3 (4th spot) later, for now just push and we reorder
            // Actually let's build the order slots
        }

        // Let's try a slot-filling approach
        const slots = [
            { name: 'Leadoff', criteria: (p: any) => p.stats.obp, reason: 'High OBP to start the inning' },
            { name: '2nd Hole', criteria: (p: any) => p.stats.avg, reason: 'Good contact hitter' },
            { name: '3rd Hole', criteria: (p: any) => p.stats.ops, reason: 'Best overall hitter' },
            { name: 'Cleanup', criteria: (p: any) => p.stats.slg, reason: 'Power hitter to drive in runs' },
            { name: '5th Spot', criteria: (p: any) => p.stats.ops, reason: 'Strong hitter to protect cleanup' },
            { name: '6th Spot', criteria: (p: any) => p.stats.ops, reason: 'Solid bat' },
            { name: '7th Spot', criteria: (p: any) => p.stats.ops, reason: 'Lower lineup depth' },
            { name: '8th Spot', criteria: (p: any) => p.stats.ops, reason: 'Lower lineup depth' },
            { name: '9th Spot', criteria: (p: any) => p.stats.obp, reason: 'Second leadoff' }, // Often a high OBP guy to turn lineup over
            // 10, 11 etc just fill with remaining best OPS
        ];

        const finalLineup: typeof generatedLineup = [];
        const assignedIds = new Set<string>();

        // Fill defined slots up to roster size
        for (let i = 0; i < roster.length; i++) {
            const slot = slots[i] || { name: `${i + 1}th Spot`, criteria: (p: any) => p.stats.ops, reason: 'Remaining depth' };

            const bestFit = roster
                .filter(p => !assignedIds.has(p.id))
                .sort((a, b) => slot.criteria(b) - slot.criteria(a))[0];

            if (bestFit) {
                finalLineup.push({
                    player: bestFit,
                    role: slot.name,
                    reason: `${slot.reason} (${slot.criteria(bestFit).toFixed(3)})`
                });
                assignedIds.add(bestFit.id);
            }
        }

        setGeneratedLineup(finalLineup);
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <span className="h-9 w-9 rounded-lg bg-[#6250d6]/10 text-[#6250d6] flex items-center justify-center">
                        <Brain className="h-5 w-5" />
                    </span>
                    AI Lineup Generator
                </h1>
                <p className="text-slate-500 text-sm mt-1">Pick who&apos;s playing and let the model suggest a batting order</p>
            </div>

            <div className="grid gap-6 md:grid-cols-[1fr_1.5fr]">
                {/* Player Selection */}
                <Card className="h-fit border-slate-200/80 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <Users className="h-4 w-4 text-[#6250d6]" /> Select attending players
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1 mb-6 max-h-[60vh] overflow-y-auto">
                            {players.map(player => (
                                <div
                                    key={player.id}
                                    className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors ${selectedPlayerIds.includes(player.id) ? 'bg-[#6250d6]/5' : ''}`}
                                    onClick={() => handlePlayerToggle(player.id)}
                                >
                                    <Checkbox
                                        checked={selectedPlayerIds.includes(player.id)}
                                        onCheckedChange={() => handlePlayerToggle(player.id)}
                                    />
                                    <span className="font-mono font-bold text-slate-400 w-8">#{player.number}</span>
                                    <span className="font-medium">{player.name}</span>
                                </div>
                            ))}
                        </div>
                        <Button
                            onClick={generateLineup}
                            disabled={selectedPlayerIds.length < 9}
                            className="w-full bg-[#6250d6] hover:bg-[#5340c0]"
                        >
                            <Sparkles className="mr-2 h-4 w-4" /> Generate Optimized Lineup
                        </Button>
                        {selectedPlayerIds.length < 9 && (
                            <p className="text-xs text-center text-slate-500 mt-2">Select at least 9 players</p>
                        )}
                    </CardContent>
                </Card>

                {/* Results */}
                <div className="space-y-3">
                    {generatedLineup ? (
                        generatedLineup.map((slot, index) => (
                            <Card key={slot.player.id} className="overflow-hidden border-slate-200/80 shadow-sm border-l-4 border-l-[#6250d6]">
                                <div className="flex items-center p-4">
                                    <div className="flex-shrink-0 w-12 text-center">
                                        <div className="text-2xl font-bold text-slate-300">{index + 1}</div>
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900">{slot.player.name}</span>
                                            <span className="text-sm font-mono bg-slate-100 px-1.5 rounded text-slate-500">#{slot.player.number}</span>
                                        </div>
                                        <div className="text-sm text-[#6250d6] font-medium">{slot.role}</div>
                                        <div className="text-xs text-slate-500">{slot.reason}</div>
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl p-12">
                            <Brain className="h-16 w-16 mb-4 opacity-20" />
                            <p className="text-sm text-center">Select players and click Generate to see the AI suggestion</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
