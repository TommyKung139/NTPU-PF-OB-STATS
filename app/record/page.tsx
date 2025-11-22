'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, Player, PlayerStats } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, Save, ChevronRight } from 'lucide-react';

export default function RecordGamePage() {
    const router = useRouter();
    const { players, addGame, updateStats } = useStore();

    const [step, setStep] = useState(1);
    const [gameData, setGameData] = useState({
        opponent: '',
        date: new Date().toISOString().split('T')[0],
    });
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
    const [stats, setStats] = useState<Record<string, Partial<PlayerStats>>>({});

    // Initialize stats for selected players
    useEffect(() => {
        const initialStats: Record<string, Partial<PlayerStats>> = {};
        selectedPlayerIds.forEach(id => {
            if (!stats[id]) {
                initialStats[id] = {
                    pa: 0, ab: 0, h1: 0, h2: 0, h3: 0, hr: 0,
                    rbi: 0, bb: 0, so: 0, sf: 0, e: 0
                };
            }
        });
        setStats(prev => ({ ...prev, ...initialStats }));
    }, [selectedPlayerIds]);

    const handlePlayerToggle = (id: string) => {
        setSelectedPlayerIds(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleStatChange = (playerId: string, field: keyof PlayerStats, value: string) => {
        const numValue = parseInt(value) || 0;
        setStats(prev => ({
            ...prev,
            [playerId]: { ...prev[playerId], [field]: numValue }
        }));
    };

    const calculateStats = (s: Partial<PlayerStats>) => {
        const h = (s.h1 || 0) + (s.h2 || 0) + (s.h3 || 0) + (s.hr || 0);
        const avg = s.ab ? (h / s.ab).toFixed(3) : '.000';
        return { h, avg };
    };

    const handleSaveGame = async () => {
        if (!gameData.opponent) return;

        const gameId = await addGame({
            opponent: gameData.opponent,
            date: gameData.date,
        });

        for (const playerId of selectedPlayerIds) {
            const playerStats = stats[playerId];
            if (playerStats) {
                await updateStats({
                    playerId,
                    gameId,
                    pa: playerStats.pa || 0,
                    ab: playerStats.ab || 0,
                    h1: playerStats.h1 || 0,
                    h2: playerStats.h2 || 0,
                    h3: playerStats.h3 || 0,
                    hr: playerStats.hr || 0,
                    rbi: playerStats.rbi || 0,
                    bb: playerStats.bb || 0,
                    so: playerStats.so || 0,
                    sf: playerStats.sf || 0,
                    e: playerStats.e || 0,
                });
            }
        }

        router.push('/');
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Record Game Stats</h1>

            {step === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" /> Game Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Opponent Team</label>
                            <Input
                                value={gameData.opponent}
                                onChange={e => setGameData({ ...gameData, opponent: e.target.value })}
                                placeholder="e.g. Yankees"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Date</label>
                            <Input
                                type="date"
                                value={gameData.date}
                                onChange={e => setGameData({ ...gameData, date: e.target.value })}
                            />
                        </div>
                        <div className="pt-4 flex justify-end">
                            <Button
                                onClick={() => setStep(2)}
                                disabled={!gameData.opponent}
                                className="bg-blue-600"
                            >
                                Next: Select Roster <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" /> Select Roster
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                            {players.map(player => (
                                <div
                                    key={player.id}
                                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedPlayerIds.includes(player.id)
                                        ? 'bg-blue-50 border-blue-200'
                                        : 'hover:bg-slate-50'
                                        }`}
                                    onClick={() => handlePlayerToggle(player.id)}
                                >
                                    <Checkbox
                                        checked={selectedPlayerIds.includes(player.id)}
                                        onCheckedChange={() => handlePlayerToggle(player.id)}
                                    />
                                    <div>
                                        <span className="font-mono font-bold text-slate-600 mr-2">#{player.number}</span>
                                        <span className="font-medium">{player.name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between pt-4 border-t">
                            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                            <Button
                                onClick={() => setStep(3)}
                                disabled={selectedPlayerIds.length === 0}
                                className="bg-blue-600"
                            >
                                Next: Enter Stats <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === 3 && (
                <div className="space-y-6">
                    {selectedPlayerIds.map(playerId => {
                        const player = players.find(p => p.id === playerId);
                        const s = stats[playerId] || {};
                        const { avg } = calculateStats(s);

                        return (
                            <Card key={playerId} className="overflow-hidden">
                                <CardHeader className="bg-slate-50 py-3">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <span className="font-mono bg-white px-2 py-0.5 rounded border text-sm">#{player?.number}</span>
                                            {player?.name}
                                        </CardTitle>
                                        <div className="text-sm font-mono text-slate-500">
                                            AVG: <span className="font-bold text-slate-900">{avg}</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                        {[
                                            { label: 'PA', key: 'pa' },
                                            { label: 'AB', key: 'ab' },
                                            { label: '1B', key: 'h1' },
                                            { label: '2B', key: 'h2' },
                                            { label: '3B', key: 'h3' },
                                            { label: 'HR', key: 'hr' },
                                            { label: 'RBI', key: 'rbi' },
                                            { label: 'BB', key: 'bb' },
                                            { label: 'SO', key: 'so' },
                                            { label: 'SF', key: 'sf' },
                                            { label: 'E', key: 'e', color: 'text-red-600' },
                                        ].map((field) => (
                                            <div key={field.key} className="space-y-1">
                                                <label className={`text-xs font-bold uppercase ${field.color || 'text-slate-500'}`}>
                                                    {field.label}
                                                </label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    className="h-9 text-center font-mono"
                                                    value={s[field.key as keyof PlayerStats] || ''}
                                                    onChange={(e) => handleStatChange(playerId, field.key as keyof PlayerStats, e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}

                    <div className="flex justify-between pt-4 pb-12">
                        <Button variant="outline" onClick={() => setStep(2)}>Back to Roster</Button>
                        <Button onClick={handleSaveGame} className="bg-green-600 hover:bg-green-700 text-lg px-8">
                            <Save className="mr-2 h-5 w-5" /> Save Game
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
