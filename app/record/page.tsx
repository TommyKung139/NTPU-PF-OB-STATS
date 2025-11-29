'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore, Player, PlayerStats } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, Save, ChevronRight } from 'lucide-react';

function RecordGameContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const gameId = searchParams.get('gameId');
    const { players, games, stats: allStats, addGame, updateGame, updateStats } = useStore();

    const [step, setStep] = useState(1);
    const [gameData, setGameData] = useState({
        opponent: '',
        date: new Date().toISOString().split('T')[0],
    });
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
    const [stats, setStats] = useState<Record<string, Partial<PlayerStats>>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Load existing game data if editing
    useEffect(() => {
        if (gameId && games.length > 0) {
            const game = games.find(g => g.id === gameId);
            if (game) {
                setGameData({
                    opponent: game.opponent,
                    date: game.date,
                });
                setIsEditing(true);

                // Load existing stats
                const gameStats = allStats.filter(s => s.gameId === gameId);
                const playerIds = gameStats.map(s => s.playerId);
                setSelectedPlayerIds(playerIds);

                const statsMap: Record<string, Partial<PlayerStats>> = {};
                gameStats.forEach(s => {
                    statsMap[s.playerId] = { ...s };
                });
                setStats(statsMap);
            }
        }
    }, [gameId, games, allStats]);

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
        if (!gameData.opponent || isSaving) return;

        setIsSaving(true);

        try {
            let targetGameId = gameId;

            if (isEditing && gameId) {
                await updateGame(gameId, {
                    opponent: gameData.opponent,
                    date: gameData.date,
                });
            } else {
                targetGameId = await addGame({
                    opponent: gameData.opponent,
                    date: gameData.date,
                });
            }

            if (!targetGameId) throw new Error('Failed to get game ID');

            for (const playerId of selectedPlayerIds) {
                const playerStats = stats[playerId];
                if (playerStats) {
                    await updateStats({
                        playerId,
                        gameId: targetGameId,
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
        } catch (error) {
            console.error('Error saving game:', error);
            setIsSaving(false);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl relative">
            {isSaving && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="h-24 w-24 rounded-full border-4 border-slate-100"></div>
                            <div className="absolute top-0 left-0 h-24 w-24 rounded-full border-4 border-green-500 border-t-transparent animate-spin"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <div className="bg-green-500 rounded-full p-3 shadow-lg shadow-green-500/20">
                                    <Save className="h-8 w-8 text-white" />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2 text-center">
                            <h2 className="text-xl font-bold text-slate-900">{isEditing ? 'Updating Game Record' : 'Saving Game Record'}</h2>
                            <p className="text-sm text-slate-500">Updating player stats and team history...</p>
                        </div>
                    </div>
                </div>
            )}

            <h1 className="text-3xl font-bold text-slate-900 mb-8">{isEditing ? 'Edit Game Stats' : 'Record Game Stats'}</h1>

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
                                disabled={isSaving}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Date</label>
                            <Input
                                type="date"
                                value={gameData.date}
                                onChange={e => setGameData({ ...gameData, date: e.target.value })}
                                disabled={isSaving}
                            />
                        </div>
                        <div className="pt-4 flex justify-end">
                            <Button
                                onClick={() => setStep(2)}
                                disabled={!gameData.opponent || isSaving}
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
                                    onClick={() => !isSaving && handlePlayerToggle(player.id)}
                                >
                                    <Checkbox
                                        checked={selectedPlayerIds.includes(player.id)}
                                        onCheckedChange={() => handlePlayerToggle(player.id)}
                                        disabled={isSaving}
                                    />
                                    <div>
                                        <span className="font-mono font-bold text-slate-600 mr-2">#{player.number}</span>
                                        <span className="font-medium">{player.name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between pt-4 border-t">
                            <Button variant="outline" onClick={() => setStep(1)} disabled={isSaving}>Back</Button>
                            <Button
                                onClick={() => setStep(3)}
                                disabled={selectedPlayerIds.length === 0 || isSaving}
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
                                                    disabled={isSaving}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}

                    <div className="flex justify-between pt-4 pb-12">
                        <Button variant="outline" onClick={() => setStep(2)} disabled={isSaving}>Back to Roster</Button>
                        <Button
                            onClick={handleSaveGame}
                            disabled={isSaving}
                            className="bg-green-600 hover:bg-green-700 text-lg px-8"
                        >
                            {isSaving ? (isEditing ? 'Updating...' : 'Saving...') : (
                                <>
                                    <Save className="mr-2 h-5 w-5" /> {isEditing ? 'Update Game' : 'Save Game'}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function RecordGamePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <RecordGameContent />
        </Suspense>
    );
}
