'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useStore, Player, PlayerStats, Game } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Trash2, Plus, User, ChevronDown, ChevronUp, AlertTriangle, Upload, Image as ImageIcon } from 'lucide-react';
import { SavantPercentileChart } from '@/components/SavantPercentileChart';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    const iso = slg - avg;

    // wOBA (Approximate weights)
    const wobaNum = (0.69 * bb) + (0.89 * h1) + (1.27 * h2) + (1.62 * h3) + (2.10 * hr);
    const wobaDenom = ab + bb + sf;
    const woba = wobaDenom ? wobaNum / wobaDenom : 0;

    return { pa, ab, h, hr, bb, so, avg, obp, slg, ops, iso, woba };
};

// --- Sub-component for Player Details ---
function PlayerDetailsPanel({ player, stats, players, games }: { player: Player, stats: PlayerStats[], players: Player[], games: Game[] }) {
    const [viewMode, setViewMode] = useState<'career' | 'last5'>('career');

    // Filter Stats based on View Mode
    let filteredStats = stats.filter(s => s.playerId === player.id);
    let comparisonStats = stats; // For percentiles

    if (viewMode === 'last5') {
        // Get last 5 games excluding Legacy
        const sortedGames = [...games]
            .filter(g => g.opponent !== 'Legacy Stats Import')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const last5GameIds = sortedGames.slice(0, 5).map(g => g.id);

        filteredStats = filteredStats.filter(s => last5GameIds.includes(s.gameId));

        // For percentiles, we should compare against everyone's Last 5 performance?
        // Or just keep career percentiles? Usually percentiles are season/career based.
        // But if I want to see how I did in last 5 games vs team in last 5 games, I should filter team stats too.
        comparisonStats = stats.filter(s => last5GameIds.includes(s.gameId));
    }

    const metrics = calculateAdvancedStats(filteredStats);

    // Team Baseline for OPS+ (based on current view)
    const teamStats = calculateAdvancedStats(comparisonStats);
    const teamObp = teamStats.obp || 0.320;
    const teamSlg = teamStats.slg || 0.400;

    const calculateOpsPlus = (obp: number, slg: number) => {
        if (!teamObp || !teamSlg) return 100;
        return 100 * ((obp / teamObp) + (slg / teamSlg) - 1);
    };

    const opsPlus = calculateOpsPlus(metrics.obp, metrics.slg);

    // Percentiles
    const allPlayersStats = players.map(p => {
        const pStats = comparisonStats.filter(s => s.playerId === p.id);
        return { id: p.id, ...calculateAdvancedStats(pStats) };
    }).filter(p => p.pa > 0);

    const getPercentile = (value: number, dataset: number[]) => {
        if (dataset.length === 0) return 0;
        const sorted = [...dataset].sort((a, b) => a - b);
        const rank = sorted.filter(v => v < value).length;
        const equal = sorted.filter(v => v === value).length;
        return Math.round(((rank + 0.5 * equal) / sorted.length) * 100);
    };

    const chartMetrics = [
        {
            label: 'xwOBA',
            value: metrics.woba,
            percentile: getPercentile(metrics.woba, allPlayersStats.map(p => p.woba)),
            format: (v: number) => v.toFixed(3).replace('0.', '.')
        },
        {
            label: 'xBA',
            value: metrics.avg,
            percentile: getPercentile(metrics.avg, allPlayersStats.map(p => p.avg)),
            format: (v: number) => v.toFixed(3).replace('0.', '.')
        },
        {
            label: 'xSLG',
            value: metrics.slg,
            percentile: getPercentile(metrics.slg, allPlayersStats.map(p => p.slg)),
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
            value: metrics.pa ? (metrics.bb / metrics.pa) * 100 : 0,
            percentile: getPercentile(metrics.pa ? (metrics.bb / metrics.pa) : 0, allPlayersStats.map(p => p.pa ? (p.bb / p.pa) : 0)),
            format: (v: number) => v.toFixed(1)
        },
        {
            label: 'K %',
            value: metrics.pa ? (metrics.so / metrics.pa) * 100 : 0,
            percentile: 100 - getPercentile(metrics.pa ? (metrics.so / metrics.pa) : 0, allPlayersStats.map(p => p.pa ? (p.so / p.pa) : 0)),
            format: (v: number) => v.toFixed(1)
        },
        {
            label: 'ISO',
            value: metrics.iso,
            percentile: getPercentile(metrics.iso, allPlayersStats.map(p => p.iso)),
            format: (v: number) => v.toFixed(3).replace('0.', '.')
        },
    ];

    return (
        <div className="p-4 bg-slate-50 rounded-lg mt-2 border border-slate-200">
            <div className="grid lg:grid-cols-[200px_500px_1fr] gap-8">
                {/* Image Column */}
                <div className="flex flex-col items-center justify-center">
                    <div className="relative w-40 h-56 bg-black rounded-lg overflow-hidden flex items-center justify-center shadow-lg">
                        {player.image_url ? (
                            <img src={player.image_url} alt={player.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-white text-center p-4">
                                <p className="font-bold text-sm">目前沒有圖片</p>
                                <p className="text-xs mt-1">可自行上傳</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Column */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-700">Detailed Statistics</h4>
                        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'career' | 'last5')}>
                            <TabsList className="h-8">
                                <TabsTrigger value="career" className="text-xs">Career</TabsTrigger>
                                <TabsTrigger value="last5" className="text-xs">Last 5 Games</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                        <div className="flex justify-between border-b border-slate-200 py-2">
                            <span className="text-slate-500">PA:</span>
                            <span className="font-mono font-bold text-slate-900">{metrics.pa}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 py-2">
                            <span className="text-slate-500">AB:</span>
                            <span className="font-mono font-bold text-slate-900">{metrics.ab}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 py-2">
                            <span className="text-slate-500">Hits:</span>
                            <span className="font-mono font-bold text-slate-900">{metrics.h}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 py-2">
                            <span className="text-slate-500">HR:</span>
                            <span className="font-mono font-bold text-slate-900">{metrics.hr}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 py-2">
                            <span className="text-slate-500">RBI:</span>
                            <span className="font-mono font-bold text-slate-900">{filteredStats.reduce((sum, s) => sum + (s.rbi || 0), 0)}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 py-2">
                            <span className="text-slate-500">BB:</span>
                            <span className="font-mono font-bold text-slate-900">{metrics.bb}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 py-2">
                            <span className="text-slate-500">SO:</span>
                            <span className="font-mono font-bold text-slate-900">{metrics.so}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 py-2">
                            <span className="text-slate-500">wOBA:</span>
                            <span className="font-mono font-bold text-slate-900">{metrics.woba.toFixed(3).replace('0.', '.')}</span>
                        </div>
                    </div>
                </div>

                {/* Chart Column */}
                <div>
                    <h4 className="font-bold text-slate-700 mb-2">Percentile Rankings (vs Team)</h4>
                    <SavantPercentileChart metrics={chartMetrics} />
                </div>
            </div>
        </div>
    );
}

export default function PlayersPage() {
    const { players, stats, games, addPlayer, updatePlayer, deletePlayer, clearAllData } = useStore();

    // Player Edit/Add State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
    const [formData, setFormData] = useState({ name: '', number: '', image_url: '' });

    // Password & Action State
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [pendingAction, setPendingAction] = useState<'import' | 'delete' | null>(null);
    const [passwordError, setPasswordError] = useState('');
    const [isDeleteWarningOpen, setIsDeleteWarningOpen] = useState(false);

    // Table Expansion State
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    // Image Upload Ref (for Edit Dialog)
    const fileInputRef = useRef<HTMLInputElement>(null);

    const toggleRow = (playerId: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(playerId)) {
            newExpanded.delete(playerId);
        } else {
            newExpanded.add(playerId);
        }
        setExpandedRows(newExpanded);
    };

    // --- Action Handlers ---

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPlayer) {
            updatePlayer(editingPlayer.id, formData);
        } else {
            addPlayer(formData);
        }
        setIsDialogOpen(false);
        setEditingPlayer(null);
        setFormData({ name: '', number: '', image_url: '' });
    };

    const openEdit = (player: Player) => {
        setEditingPlayer(player);
        setFormData({ name: player.name, number: player.number, image_url: player.image_url || '' });
        setIsDialogOpen(true);
    };

    const openAdd = () => {
        setEditingPlayer(null);
        setFormData({ name: '', number: '', image_url: '' });
        setIsDialogOpen(true);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setFormData(prev => ({ ...prev, image_url: base64String }));
            };
            reader.readAsDataURL(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = () => {
        setFormData(prev => ({ ...prev, image_url: '' }));
    };

    const initiateImport = () => {
        setPendingAction('import');
        setPassword('');
        setPasswordError('');
        setIsPasswordOpen(true);
    };

    const initiateDelete = () => {
        setIsDeleteWarningOpen(true);
    };

    const confirmDeleteWarning = () => {
        setIsDeleteWarningOpen(false);
        setPendingAction('delete');
        setPassword('');
        setPasswordError('');
        setIsPasswordOpen(true);
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'NTPUPFOB') {
            setIsPasswordOpen(false);
            if (pendingAction === 'import') {
                await executeImport();
            } else if (pendingAction === 'delete') {
                await executeDelete();
            }
            setPendingAction(null);
        } else {
            setPasswordError('確定要刪掉嗎？要的話，提示：北大財政OB英文');
        }
    };

    const executeDelete = async () => {
        await clearAllData();
        alert('All data has been cleared.');
    };

    const executeImport = async () => {
        const csvData = `Number,Name,PA,AB,AVG,OBP,OPS,SLG,H,1B,2B,3B,HR,RBI,BB,SO,SF,PA/BB,BABIP,BB%,OPS+,wOBA,isoP%
,胡宜誠,5,5,0.000,0.000,0.000,0.000,0,0,0,0,0,0,0,0,0,#DIV/0!,0.000,0.00%,-100.0,0.000,0.000
,鄔芳益,26,24,0.375,0.423,1.090,0.667,9,6,0,2,1,6,2,0,0,13.000,0.348,7.69%,180.7,0.454,0.292
0,林顥,60,54,0.315,0.367,0.756,0.389,17,14,2,1,0,5,5,1,1,12.000,0.315,8.33%,95.9,0.332,0.074
1,游子儀,94,94,0.553,0.553,1.383,0.830,52,39,4,5,4,31,0,0,0,#DIV/0!,0.533,0.00%,256.5,0.586,0.277
2,劉晏廷,369,341,0.302,0.344,0.720,0.375,103,88,7,6,2,49,24,9,4,15.375,0.302,6.50%,86.5,0.316,0.073
5,黃郁凱,13,12,0.250,0.308,0.724,0.417,3,2,0,1,0,3,1,0,0,13.000,0.250,7.69%,87.1,0.309,0.167
6,孔昱棠,455,430,0.419,0.446,1.009,0.563,180,141,20,15,4,89,23,15,2,19.783,0.426,5.05%,160.9,0.432,0.144
7,楊昌曄,15,12,0.167,0.267,0.433,0.167,2,2,0,0,0,2,2,2,1,7.500,0.182,13.33%,13.4,0.211,0.000
9,陳品合,30,27,0.148,0.233,0.381,0.148,4,4,0,0,0,3,3,5,0,10.000,0.182,10.00%,-0.2,0.188,0.000
35,李彥成,55,50,0.360,0.400,0.820,0.420,18,16,1,1,0,15,4,3,1,13.750,0.375,7.27%,112.7,0.359,0.060
11,高偉辰,18,16,0.188,0.333,0.521,0.188,3,3,0,0,0,0,3,4,0,6.000,0.250,16.67%,36.5,0.250,0.000
12,大威,252,231,0.238,0.290,0.541,0.251,55,52,3,0,0,22,18,24,3,14.000,0.262,7.14%,40.7,0.247,0.013
13,蔡超評,40,37,0.297,0.350,0.647,0.297,11,11,0,0,0,1,3,2,0,13.333,0.314,7.50%,68.5,0.295,0.000
14,陳哲廣,405,372,0.382,0.427,0.949,0.522,142,113,10,15,4,72,31,19,4,13.065,0.391,7.65%,145.4,0.406,0.140
15,徐祥哲,5,4,0.000,0.200,0.200,0.000,0,0,0,0,0,0,1,1,0,5.000,0.000,20.00%,-46.3,0.140,0.000
17,蕭仲鈞,288,256,0.254,0.306,0.579,0.273,65,62,1,2,0,21,23,33,5,12.522,0.285,7.99%,50.6,0.265,0.020
18,陳揚傑,410,366,0.284,0.354,0.665,0.311,104,96,6,2,0,38,41,18,7,10.000,0.293,10.00%,73.0,0.299,0.027
20,張開元,142,127,0.252,0.310,0.570,0.260,32,31,1,0,0,8,12,4,3,11.833,0.254,8.45%,48.3,0.261,0.008
21,蔡承佑,100,91,0.341,0.390,0.983,0.593,31,21,1,5,4,24,8,2,1,12.500,0.314,8.00%,153.5,0.411,0.253
22,洪浩銓,11,10,0.200,0.273,0.473,0.200,2,2,0,0,0,0,1,1,0,11.000,0.222,9.09%,23.3,0.224,0.000
25,朱峻廷,140,131,0.336,0.371,0.723,0.351,44,42,2,0,0,8,8,6,4,17.500,0.341,5.71%,87.7,0.316,0.015
27,莊凱臣,302,271,0.251,0.325,0.579,0.255,68,67,1,0,0,32,30,26,1,10.067,0.276,9.93%,50.9,0.269,0.004
29,邱俊翔,239,217,0.392,0.444,0.835,0.392,85,85,0,0,0,23,21,7,2,11.381,0.401,8.79%,117.2,0.374,0.000
98,李亮頤,22,21,0.048,0.091,0.139,0.048,1,1,0,0,0,0,1,3,0,22.000,0.056,4.55%,-63.7,0.072,0.000
31,小威,201,185,0.270,0.323,0.604,0.281,50,48,2,0,0,16,15,10,1,13.400,0.284,7.46%,57.3,0.275,0.011
33,林呈蒲,233,203,0.296,0.361,0.695,0.335,60,54,4,2,0,42,24,2,5,9.708,0.291,10.30%,80.7,0.313,0.039
34,楊紹邦,76,72,0.250,0.289,0.539,0.250,18,18,0,0,0,7,4,3,0,19.000,0.261,5.26%,40.4,0.246,0.000
39,黃偉哲,57,54,0.296,0.298,0.650,0.352,16,13,3,0,0,9,1,6,2,57.000,0.320,1.75%,68.3,0.279,0.056
99,計柏如,77,69,0.420,0.455,0.976,0.522,29,25,2,1,1,13,6,0,2,12.833,0.400,7.79%,152.8,0.419,0.101
51,洪一銘,331,316,0.456,0.474,1.085,0.611,144,119,5,16,4,95,13,4,3,25.462,0.450,3.93%,180.4,0.461,0.155
56,王博緯,404,364,0.352,0.396,0.885,0.489,128,98,14,12,4,68,32,19,8,12.625,0.355,7.92%,128.9,0.378,0.137
57,邱映暐,20,18,0.278,0.350,0.683,0.333,5,4,1,0,0,7,2,0,0,10.000,0.278,10.00%,77.5,0.308,0.056
72,黃柏融,93,84,0.238,0.290,0.540,0.250,20,19,1,0,0,7,7,10,3,13.286,0.260,7.53%,40.6,0.244,0.012
91,陳昱融,278,252,0.286,0.356,0.654,0.298,72,69,3,0,0,15,27,9,1,10.296,0.295,9.71%,70.2,0.298,0.012
97,李明展,14,13,0.077,0.143,0.220,0.077,1,1,0,0,0,2,1,1,0,14.000,0.083,7.14%,-42.4,0.113,0.000
36,鄭志維,164,147,0.279,0.354,0.762,0.408,41,30,4,6,1,17,17,9,2,9.647,0.288,10.37%,97.3,0.329,0.129
,TEAM,5444,4976,0.325,0.373,0.771,0.399,1615,1396,98,92,29,750,414,258,66,13.150,0.334,7.60%,100.0,0.338,0.074`;

        const rows = csvData.split('\n').slice(1); // Skip header
        const { addPlayer, addGame, updateStats } = useStore.getState();

        // Create a legacy game bucket
        const gameId = await addGame({
            opponent: 'Legacy Stats Import',
            date: new Date().toISOString().split('T')[0],
        });

        for (const row of rows) {
            const cols = row.split(',');
            if (cols.length < 5 || cols[1] === 'TEAM') continue;

            const number = cols[0].trim() || '?';
            const name = cols[1].trim();

            if (!name) continue;

            // Check if player already exists
            const existingPlayer = useStore.getState().players.find(p => p.name === name && p.number === number);

            let playerId = existingPlayer?.id;

            if (!existingPlayer) {
                // Add Player if not exists
                await addPlayer({ name, number });
                // Get the new player ID
                const newPlayer = useStore.getState().players.find(p => p.name === name && p.number === number);
                playerId = newPlayer?.id;
            }

            if (playerId) {
                await updateStats({
                    playerId: playerId,
                    gameId,
                    pa: parseInt(cols[2]) || 0,
                    ab: parseInt(cols[3]) || 0,
                    h1: parseInt(cols[9]) || 0,
                    h2: parseInt(cols[10]) || 0,
                    h3: parseInt(cols[11]) || 0,
                    hr: parseInt(cols[12]) || 0,
                    rbi: parseInt(cols[13]) || 0,
                    bb: parseInt(cols[14]) || 0,
                    so: parseInt(cols[15]) || 0,
                    sf: parseInt(cols[16]) || 0,
                    e: 0
                });
            }
        }

        alert('Stats imported successfully!');
        window.location.reload();
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Team Roster</h1>
                    <p className="text-slate-500">Manage your players and jersey numbers</p>
                </div>
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <Button onClick={initiateDelete} variant="destructive" className="bg-red-600 hover:bg-red-700 w-full md:w-auto">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Data
                    </Button>
                    <Button onClick={initiateImport} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 w-full md:w-auto">
                        Import Legacy Stats
                    </Button>
                    <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
                        <Plus className="mr-2 h-4 w-4" /> Add Player
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Active Players ({players.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {players.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <User className="mx-auto h-12 w-12 mb-4 opacity-20" />
                            <p>No players added yet. Add your teammates to get started!</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]"></TableHead>
                                    <TableHead className="w-[80px]">Number</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="text-right hidden md:table-cell">AVG</TableHead>
                                    <TableHead className="text-right hidden md:table-cell">OBP</TableHead>
                                    <TableHead className="text-right hidden md:table-cell">SLG</TableHead>
                                    <TableHead className="text-right hidden md:table-cell">OPS</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {players.map((player) => {
                                    const pStats = stats.filter(s => s.playerId === player.id);
                                    const metrics = calculateAdvancedStats(pStats);
                                    const isExpanded = expandedRows.has(player.id);

                                    return (
                                        <>
                                            <TableRow key={player.id} className={isExpanded ? 'bg-slate-50 border-b-0' : ''}>
                                                <TableCell>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toggleRow(player.id)}>
                                                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                    </Button>
                                                </TableCell>
                                                <TableCell className="font-mono font-bold text-lg text-slate-700">
                                                    #{player.number}
                                                </TableCell>
                                                <TableCell className="font-medium text-lg">
                                                    <span className="text-slate-900">
                                                        {player.name}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right font-mono hidden md:table-cell">{metrics.avg.toFixed(3).replace('0.', '.')}</TableCell>
                                                <TableCell className="text-right font-mono hidden md:table-cell">{metrics.obp.toFixed(3).replace('0.', '.')}</TableCell>
                                                <TableCell className="text-right font-mono hidden md:table-cell">{metrics.slg.toFixed(3).replace('0.', '.')}</TableCell>
                                                <TableCell className="text-right font-mono font-bold text-blue-700 hidden md:table-cell">{metrics.ops.toFixed(3)}</TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openEdit(player)}
                                                    >
                                                        <Pencil className="h-4 w-4 text-slate-500" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => deletePlayer(player.id)}
                                                        className="hover:text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                            {isExpanded && (
                                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                                    <TableCell colSpan={8} className="p-4 pt-0">
                                                        <PlayerDetailsPanel
                                                            player={player}
                                                            stats={stats}
                                                            players={players}
                                                            games={games}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Edit/Add Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingPlayer ? 'Edit Player' : 'Add New Player'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-2">
                            <label htmlFor="name" className="text-sm font-medium">
                                Player Name
                            </label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                placeholder="e.g. Shohei Ohtani"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="number" className="text-sm font-medium">
                                Jersey Number
                            </label>
                            <Input
                                id="number"
                                value={formData.number}
                                onChange={(e) =>
                                    setFormData({ ...formData, number: e.target.value })
                                }
                                placeholder="17"
                                required
                            />
                        </div>

                        {/* Image Upload in Dialog */}
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">
                                Player Photo
                            </label>
                            <div className="flex items-center gap-4">
                                <div className="relative w-20 h-28 bg-black rounded overflow-hidden flex items-center justify-center border border-slate-200">
                                    {formData.image_url ? (
                                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs text-white text-center">No Image</span>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="h-4 w-4 mr-2" /> Upload Photo
                                    </Button>
                                    {formData.image_url && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700"
                                            onClick={removeImage}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" /> Remove
                                        </Button>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                {editingPlayer ? 'Save Changes' : 'Add Player'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Password Dialog */}
            <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Authentication Required</DialogTitle>
                        <DialogDescription>
                            Please enter the administrator password to continue.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div className="grid gap-2">
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter Password"
                                autoFocus
                            />
                            {passwordError && (
                                <p className="text-sm text-red-600 font-medium">
                                    {passwordError}
                                </p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button type="submit">Confirm</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Warning Alert */}
            <AlertDialog open={isDeleteWarningOpen} onOpenChange={setIsDeleteWarningOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center text-red-600">
                            <AlertTriangle className="mr-2 h-5 w-5" />
                            Warning: Irreversible Action
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will permanently delete ALL players, games, and statistics. This cannot be undone.
                            Are you sure you want to proceed?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteWarning} className="bg-red-600 hover:bg-red-700">
                            Yes, I understand
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
