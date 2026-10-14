'use client';

import { useStore, PlayerStats } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, TrendingDown, Activity, Edit, Trash2, Target, Zap, CalendarDays } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const { players, games, stats, deleteGame } = useStore();

  // Helper to calculate stats
  const calculateMetrics = (playerStats: PlayerStats[]) => {
    const totalAB = playerStats.reduce((sum, s) => sum + (s.ab || 0), 0);
    const totalH = playerStats.reduce((sum, s) => sum + (s.h1 || 0) + (s.h2 || 0) + (s.h3 || 0) + (s.hr || 0), 0);
    const totalBB = playerStats.reduce((sum, s) => sum + (s.bb || 0), 0);
    const totalSF = playerStats.reduce((sum, s) => sum + (s.sf || 0), 0);
    const totalTB = playerStats.reduce((sum, s) => sum + (s.h1 || 0) + 2 * (s.h2 || 0) + 3 * (s.h3 || 0) + 4 * (s.hr || 0), 0);

    const avg = totalAB ? (totalH / totalAB) : 0;
    const obp = (totalAB + totalBB + totalSF) ? (totalH + totalBB) / (totalAB + totalBB + totalSF) : 0;
    const slg = totalAB ? (totalTB / totalAB) : 0;
    const ops = obp + slg;

    return {
      avg: avg.toFixed(3),
      ops: ops.toFixed(3),
      hr: playerStats.reduce((sum, s) => sum + (s.hr || 0), 0),
      rbi: playerStats.reduce((sum, s) => sum + (s.rbi || 0), 0),
    };
  };

  // Team Stats
  const teamMetrics = calculateMetrics(stats);

  // Hot/Cold Logic (Last 5 games)
  // 1. Get last 5 game IDs (excluding Legacy Import)
  const sortedGames = [...games]
    .filter(g => g.opponent !== 'Legacy Stats Import')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const last5GameIds = sortedGames.slice(0, 5).map(g => g.id);

  // 2. Calculate stats for each player in these games
  const playerPerformances = players.map(player => {
    const pStats = stats.filter(s => s.playerId === player.id && last5GameIds.includes(s.gameId));
    const metrics = calculateMetrics(pStats);
    const pa = pStats.reduce((sum, s) => sum + (s.pa || 0), 0);
    return {
      ...player,
      avg: parseFloat(metrics.avg),
      ops: parseFloat(metrics.ops),
      pa
    };
  }).filter(p => p.pa > 0); // Only players with PAs in the last 5 games

  const hotPlayers = [...playerPerformances].sort((a, b) => b.ops - a.ops).slice(0, 3);
  const coldPlayers = [...playerPerformances].sort((a, b) => a.ops - b.ops).slice(0, 3);

  const statTiles = [
    { label: 'Team AVG', value: teamMetrics.avg.replace('0.', '.'), sub: 'Season total', icon: Target },
    { label: 'Team OPS', value: teamMetrics.ops, sub: 'Season total', icon: Activity },
    { label: 'Home runs', value: teamMetrics.hr, sub: 'Season total', icon: Zap },
    { label: 'Games played', value: games.length, sub: 'Recorded', icon: CalendarDays },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Team performance at a glance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statTiles.map((tile) => (
          <Card key={tile.label} className="border-slate-200/80 shadow-sm">
            <CardContent className="px-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">{tile.label}</span>
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <tile.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="text-3xl font-semibold text-slate-900 mt-3 tabular-nums">{tile.value}</div>
              <p className="text-xs text-slate-400 mt-1">{tile.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Hot Players */}
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <span className="h-7 w-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </span>
              Who&apos;s Hot <span className="text-slate-400 font-normal">· Last 5 games</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hotPlayers.length === 0 ? (
              <p className="text-slate-500 text-sm">Not enough data yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {hotPlayers.map(p => (
                  <div key={p.id} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                    <div>
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      <div className="text-xs text-slate-400">#{p.number}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-red-600">{p.ops.toFixed(3)} OPS</div>
                      <div className="text-xs text-slate-400">{p.avg.toFixed(3).replace('0.', '.')} AVG</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cold Players */}
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <span className="h-7 w-7 rounded-lg bg-blue-50 text-primary flex items-center justify-center">
                <TrendingDown className="h-4 w-4" />
              </span>
              Who&apos;s Cold <span className="text-slate-400 font-normal">· Last 5 games</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {coldPlayers.length === 0 ? (
              <p className="text-slate-500 text-sm">Not enough data yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {coldPlayers.map(p => (
                  <div key={p.id} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                    <div>
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      <div className="text-xs text-slate-400">#{p.number}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-primary">{p.ops.toFixed(3)} OPS</div>
                      <div className="text-xs text-slate-400">{p.avg.toFixed(3).replace('0.', '.')} AVG</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Games List */}
      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span className="h-7 w-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Activity className="h-4 w-4" />
            </span>
            Recent games
          </CardTitle>
          <Link href="/record">
            <Button variant="outline" size="sm">
              Record New <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {games.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No games recorded yet.
            </div>
          ) : (
            <div className="space-y-1.5">
              {sortedGames.map(game => (
                <div key={game.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-primary/60" />
                    <div>
                      <div className="font-semibold text-slate-900">vs {game.opponent}</div>
                      <div className="text-xs text-slate-400">{game.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/record?gameId=${game.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-red-600"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this game record? This action cannot be undone.')) {
                          deleteGame(game.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
