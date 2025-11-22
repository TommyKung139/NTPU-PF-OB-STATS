import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Player {
    id: string;
    name: string;
    number: string;
    image_url?: string;
}

export interface Game {
    id: string;
    opponent: string;
    date: string;
    isFinished: boolean;
}

export interface PlayerStats {
    playerId: string;
    gameId: string;
    pa: number;
    ab: number;
    h1: number;
    h2: number;
    h3: number;
    hr: number;
    rbi: number;
    bb: number;
    so: number;
    sf: number;
    e: number;
}

interface AppState {
    players: Player[];
    games: Game[];
    stats: PlayerStats[];
    isLoading: boolean;

    // Actions
    fetchData: () => Promise<void>;
    addPlayer: (player: Omit<Player, 'id'>) => Promise<void>;
    updatePlayer: (id: string, data: Partial<Player>) => Promise<void>;
    deletePlayer: (id: string) => Promise<void>;
    clearAllData: () => Promise<void>;

    addGame: (game: Omit<Game, 'id' | 'isFinished'>) => Promise<string>;
    finishGame: (id: string) => Promise<void>;

    updateStats: (stats: PlayerStats) => Promise<void>;
    getStatsForGame: (gameId: string) => PlayerStats[];
    getPlayerStats: (playerId: string) => PlayerStats[];
}

export const useStore = create<AppState>((set, get) => ({
    players: [],
    games: [],
    stats: [],
    isLoading: false,

    fetchData: async () => {
        set({ isLoading: true });

        const [pRes, gRes, sRes] = await Promise.all([
            supabase.from('players').select('*'),
            supabase.from('games').select('*'),
            supabase.from('stats').select('*')
        ]);

        if (pRes.error) console.error(pRes.error);
        if (gRes.error) console.error(gRes.error);
        if (sRes.error) console.error(sRes.error);

        const players = pRes.data || [];
        const games = (gRes.data || []).map((g: any) => ({
            id: g.id,
            opponent: g.opponent,
            date: g.date,
            isFinished: g.is_finished
        }));
        const stats = (sRes.data || []).map((s: any) => ({
            playerId: s.player_id,
            gameId: s.game_id,
            pa: s.pa, ab: s.ab, h1: s.h1, h2: s.h2, h3: s.h3, hr: s.hr,
            rbi: s.rbi, bb: s.bb, so: s.so, sf: s.sf, e: s.e
        }));

        set({ players, games, stats, isLoading: false });
    },

    addPlayer: async (player) => {
        const { data, error } = await supabase.from('players').insert([player]).select().single();
        if (error) {
            console.error(error);
            return;
        }
        set((state) => ({ players: [...state.players, data] }));
    },

    updatePlayer: async (id, updateData) => {
        const { error } = await supabase.from('players').update(updateData).eq('id', id);
        if (error) {
            console.error(error);
            return;
        }
        set((state) => ({
            players: state.players.map((p) => p.id === id ? { ...p, ...updateData } : p)
        }));
    },

    deletePlayer: async (id) => {
        const { error } = await supabase.from('players').delete().eq('id', id);
        if (error) {
            console.error(error);
            return;
        }
        set((state) => ({
            players: state.players.filter((p) => p.id !== id)
        }));
    },

    clearAllData: async () => {
        // Delete in order of dependencies: Stats -> Games -> Players
        // Actually, if we just delete players and games, stats might cascade or we should delete them explicitly.
        // Let's be safe and delete everything.

        const { error: sErr } = await supabase.from('stats').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        if (sErr) console.error('Error clearing stats:', sErr);

        const { error: gErr } = await supabase.from('games').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (gErr) console.error('Error clearing games:', gErr);

        const { error: pErr } = await supabase.from('players').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (pErr) console.error('Error clearing players:', pErr);

        set({ players: [], games: [], stats: [] });
    },

    addGame: async (game) => {
        const { data, error } = await supabase.from('games').insert([{
            opponent: game.opponent,
            date: game.date,
            is_finished: false
        }]).select().single();

        if (error || !data) {
            console.error(error);
            return '';
        }

        const newGame: Game = {
            id: data.id,
            opponent: data.opponent,
            date: data.date,
            isFinished: data.is_finished
        };

        set((state) => ({ games: [...state.games, newGame] }));
        return newGame.id;
    },

    finishGame: async (id) => {
        const { error } = await supabase.from('games').update({ is_finished: true }).eq('id', id);
        if (error) {
            console.error(error);
            return;
        }
        set((state) => ({
            games: state.games.map((g) => g.id === id ? { ...g, isFinished: true } : g)
        }));
    },

    updateStats: async (newStats) => {
        // Check if stats exist for this player/game combo
        const { data: existing } = await supabase
            .from('stats')
            .select('id')
            .eq('player_id', newStats.playerId)
            .eq('game_id', newStats.gameId)
            .single();

        const payload = {
            player_id: newStats.playerId,
            game_id: newStats.gameId,
            pa: newStats.pa, ab: newStats.ab,
            h1: newStats.h1, h2: newStats.h2, h3: newStats.h3, hr: newStats.hr,
            rbi: newStats.rbi, bb: newStats.bb, so: newStats.so, sf: newStats.sf, e: newStats.e
        };

        let error;
        if (existing) {
            const res = await supabase.from('stats').update(payload).eq('id', existing.id);
            error = res.error;
        } else {
            const res = await supabase.from('stats').insert([payload]);
            error = res.error;
        }

        if (error) {
            console.error(error);
            return;
        }

        // Optimistic update or refetch? Let's do optimistic for now to keep it snappy
        set((state) => {
            const existingIndex = state.stats.findIndex(
                (s) => s.playerId === newStats.playerId && s.gameId === newStats.gameId
            );
            if (existingIndex >= 0) {
                const updatedStats = [...state.stats];
                updatedStats[existingIndex] = newStats;
                return { stats: updatedStats };
            }
            return { stats: [...state.stats, newStats] };
        });
    },

    getStatsForGame: (gameId) => {
        return get().stats.filter((s) => s.gameId === gameId);
    },

    getPlayerStats: (playerId) => {
        return get().stats.filter((s) => s.playerId === playerId);
    }
}));
