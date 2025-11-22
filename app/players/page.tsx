'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStore, Player } from '@/lib/store';
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
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Trash2, Plus, User } from 'lucide-react';

export default function PlayersPage() {
    const { players, addPlayer, updatePlayer, deletePlayer } = useStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
    const [formData, setFormData] = useState({ name: '', number: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPlayer) {
            updatePlayer(editingPlayer.id, formData);
        } else {
            addPlayer(formData);
        }
        setIsDialogOpen(false);
        setEditingPlayer(null);
        setFormData({ name: '', number: '' });
    };

    const openEdit = (player: Player) => {
        setEditingPlayer(player);
        setFormData({ name: player.name, number: player.number });
        setIsDialogOpen(true);
    };

    const openAdd = () => {
        setEditingPlayer(null);
        setFormData({ name: '', number: '' });
        setIsDialogOpen(true);
    };

    const importLegacyStats = async () => {
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

            // Add Player
            await addPlayer({ name, number });

            // Look up the player we just added
            const player = useStore.getState().players.find(p => p.name === name && p.number === number);

            if (player) {
                await updateStats({
                    playerId: player.id,
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
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Team Roster</h1>
                    <p className="text-slate-500">Manage your players and jersey numbers</p>
                </div>
                <div className="space-x-2">
                    <Button onClick={importLegacyStats} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                        Import Legacy Stats
                    </Button>
                    <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700">
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
                                    <TableHead className="w-[100px]">Number</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {players.map((player) => (
                                    <TableRow key={player.id}>
                                        <TableCell className="font-mono font-bold text-lg text-slate-700">
                                            #{player.number}
                                        </TableCell>
                                        <TableCell className="font-medium text-lg">
                                            <Link href={`/players/${player.id}`} className="hover:underline hover:text-blue-600">
                                                {player.name}
                                            </Link>
                                        </TableCell>
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
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

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
                        <DialogFooter>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                {editingPlayer ? 'Save Changes' : 'Add Player'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
