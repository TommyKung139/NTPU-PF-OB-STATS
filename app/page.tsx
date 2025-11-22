'use client';

import { useStore, PlayerStats } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const { players, games, stats } = useStore();

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
  // 1. Get last 5 game IDs
  const sortedGames = [...games].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const last5GameIds = sortedGames.slice(0, 5).map(g => g.id);

  // 2. Calculate stats for each player in these games
  const playerPerformances = players.map(player => {
    const pStats = stats.filter(s => s.playerId === player.id && last5GameIds.includes(s.gameId));
    const metrics = calculateMetrics(pStats);
    return {
      ...player,
      avg: parseFloat(metrics.avg),
      ops: parseFloat(metrics.ops),
      ab: pStats.reduce((sum, s) => sum + (s.ab || 0), 0)
    };
  }).filter(p => p.ab > 0); // Only players with ABs

  const hotPlayers = [...playerPerformances].sort((a, b) => b.ops - a.ops).slice(0, 3);
  const coldPlayers = [...playerPerformances].sort((a, b) => a.ops - b.ops).slice(0, 3);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="bg-slate-900 text-white border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Team AVG</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{teamMetrics.avg.replace('0.', '.')}</div>
            <p className="text-xs text-slate-400">Season Total</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 text-white border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Team OPS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{teamMetrics.ops}</div>
            <p className="text-xs text-slate-400">Season Total</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 text-white border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Home Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{teamMetrics.hr}</div>
            <p className="text-xs text-slate-400">Season Total</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 text-white border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Games Played</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{games.length}</div>
            <p className="text-xs text-slate-400">Recorded</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Hot Players */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <TrendingUp className="h-5 w-5" /> Who's Hot (Last 5 Games)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hotPlayers.length === 0 ? (
              <p className="text-slate-500 text-sm">Not enough data yet.</p>
            ) : (
              <div className="space-y-4">
                {hotPlayers.map(p => (
                  <div key={p.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                    <div>
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-xs text-slate-500">#{p.number}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-red-600">{p.ops.toFixed(3)} OPS</div>
                      <div className="text-xs text-slate-500">{p.avg.toFixed(3).replace('0.', '.')} AVG</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cold Players (Optional, maybe just Recent Games instead?) 
            Actually user asked for "whos in a slump or whos hot". So I'll keep Cold.
        */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <TrendingDown className="h-5 w-5" /> Who's Cold (Last 5 Games)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {coldPlayers.length === 0 ? (
              <p className="text-slate-500 text-sm">Not enough data yet.</p>
            ) : (
              <div className="space-y-4">
                {coldPlayers.map(p => (
                  <div key={p.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                    <div>
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-xs text-slate-500">#{p.number}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-blue-600">{p.ops.toFixed(3)} OPS</div>
                      <div className="text-xs text-slate-500">{p.avg.toFixed(3).replace('0.', '.')} AVG</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Games List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" /> Recent Games
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
            <div className="space-y-2">
              {sortedGames.map(game => (
                <div key={game.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-bold text-slate-900">vs {game.opponent}</div>
                    <div className="text-xs text-slate-500">{game.date}</div>
                  </div>
                  {/* Could add W/L or Score here if we tracked it */}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
