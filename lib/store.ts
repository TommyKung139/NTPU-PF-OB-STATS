import { create } from 'zustand';
import { db } from '@/lib/firebase';
import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    limit,
    writeBatch,
    DocumentData,
    QueryDocumentSnapshot,
} from 'firebase/firestore';

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

    error: string | null;

    // Actions
    fetchData: () => Promise<void>;
    addPlayer: (player: Omit<Player, 'id'>) => Promise<void>;
    updatePlayer: (id: string, data: Partial<Player>) => Promise<void>;
    deletePlayer: (id: string) => Promise<void>;
    clearAllData: () => Promise<void>;

    addGame: (game: Omit<Game, 'id' | 'isFinished'>) => Promise<string>;
    updateGame: (id: string, game: Partial<Game>) => Promise<void>;
    deleteGame: (id: string) => Promise<void>;
    finishGame: (id: string) => Promise<void>;

    updateStats: (stats: PlayerStats) => Promise<void>;
    getStatsForGame: (gameId: string) => PlayerStats[];
    getPlayerStats: (playerId: string) => PlayerStats[];
}

// Firestore collection names
const PLAYERS_COL = 'players';
const GAMES_COL = 'games';
const STATS_COL = 'stats';

// Firestore batches are capped at 500 writes; chunk conservatively.
async function batchDeleteDocs(docs: QueryDocumentSnapshot<DocumentData>[], colName: string) {
    const CHUNK_SIZE = 400;
    for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
        const chunk = docs.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        chunk.forEach((d) => batch.delete(doc(db, colName, d.id)));
        await batch.commit();
    }
}

export const useStore = create<AppState>((set, get) => ({
    players: [],
    games: [],
    stats: [],
    isLoading: false,
    error: null,

    fetchData: async () => {
        set({ isLoading: true, error: null });

        try {
            const fetchPromise = Promise.all([
                getDocs(collection(db, PLAYERS_COL)),
                getDocs(collection(db, GAMES_COL)),
                getDocs(collection(db, STATS_COL)),
            ]);

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 300000) // 5 minutes
            );

            const [pSnap, gSnap, sSnap] = await Promise.race([fetchPromise, timeoutPromise]) as [
                Awaited<ReturnType<typeof getDocs>>,
                Awaited<ReturnType<typeof getDocs>>,
                Awaited<ReturnType<typeof getDocs>>
            ];

            const players: Player[] = pSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Player, 'id'>) }));

            const games: Game[] = gSnap.docs.map((d) => {
                const data = d.data() as any;
                return {
                    id: d.id,
                    opponent: data.opponent,
                    date: data.date,
                    isFinished: !!data.isFinished,
                };
            });

            const stats: PlayerStats[] = sSnap.docs.map((d) => {
                const s = d.data() as any;
                return {
                    playerId: s.playerId,
                    gameId: s.gameId,
                    pa: s.pa, ab: s.ab, h1: s.h1, h2: s.h2, h3: s.h3, hr: s.hr,
                    rbi: s.rbi, bb: s.bb, so: s.so, sf: s.sf, e: s.e
                };
            });

            set({ players, games, stats, isLoading: false });
        } catch (err: any) {
            console.error('Error fetching data:', err);
            set({ isLoading: false, error: '紀錄組掛機惹，請稍後再試' });
        }
    },

    addPlayer: async (player) => {
        try {
            const ref = await addDoc(collection(db, PLAYERS_COL), player);
            set((state) => ({ players: [...state.players, { id: ref.id, ...player }] }));
        } catch (error) {
            console.error(error);
        }
    },

    updatePlayer: async (id, updateData) => {
        try {
            await updateDoc(doc(db, PLAYERS_COL, id), updateData as { [x: string]: any });
        } catch (error) {
            console.error(error);
            return;
        }
        set((state) => ({
            players: state.players.map((p) => p.id === id ? { ...p, ...updateData } : p)
        }));
    },

    deletePlayer: async (id) => {
        try {
            await deleteDoc(doc(db, PLAYERS_COL, id));
        } catch (error) {
            console.error(error);
            return;
        }
        set((state) => ({
            players: state.players.filter((p) => p.id !== id)
        }));
    },

    clearAllData: async () => {
        // Delete in order of dependencies: Stats -> Games -> Players
        try {
            const sSnap = await getDocs(collection(db, STATS_COL));
            await batchDeleteDocs(sSnap.docs, STATS_COL);
        } catch (error) {
            console.error('Error clearing stats:', error);
        }

        try {
            const gSnap = await getDocs(collection(db, GAMES_COL));
            await batchDeleteDocs(gSnap.docs, GAMES_COL);
        } catch (error) {
            console.error('Error clearing games:', error);
        }

        try {
            const pSnap = await getDocs(collection(db, PLAYERS_COL));
            await batchDeleteDocs(pSnap.docs, PLAYERS_COL);
        } catch (error) {
            console.error('Error clearing players:', error);
        }

        set({ players: [], games: [], stats: [] });
    },

    addGame: async (game) => {
        const payload = {
            opponent: game.opponent,
            date: game.date,
            isFinished: false,
        };

        try {
            const ref = await addDoc(collection(db, GAMES_COL), payload);
            const newGame: Game = { id: ref.id, ...payload };
            set((state) => ({ games: [...state.games, newGame] }));
            return newGame.id;
        } catch (error) {
            console.error(error);
            return '';
        }
    },

    updateGame: async (id, game) => {
        const updates: any = {};
        if (game.opponent !== undefined) updates.opponent = game.opponent;
        if (game.date !== undefined) updates.date = game.date;
        if (game.isFinished !== undefined) updates.isFinished = game.isFinished;

        try {
            await updateDoc(doc(db, GAMES_COL, id), updates);
        } catch (error) {
            console.error(error);
            return;
        }

        set((state) => ({
            games: state.games.map((g) => g.id === id ? { ...g, ...game } : g)
        }));
    },

    deleteGame: async (id) => {
        // Delete stats first
        try {
            const sSnap = await getDocs(query(collection(db, STATS_COL), where('gameId', '==', id)));
            await batchDeleteDocs(sSnap.docs, STATS_COL);
        } catch (error) {
            console.error('Error deleting game stats:', error);
        }

        // Delete game
        try {
            await deleteDoc(doc(db, GAMES_COL, id));
        } catch (error) {
            console.error('Error deleting game:', error);
            return;
        }

        set((state) => ({
            games: state.games.filter((g) => g.id !== id),
            stats: state.stats.filter((s) => s.gameId !== id)
        }));
    },

    finishGame: async (id) => {
        try {
            await updateDoc(doc(db, GAMES_COL, id), { isFinished: true });
        } catch (error) {
            console.error(error);
            return;
        }
        set((state) => ({
            games: state.games.map((g) => g.id === id ? { ...g, isFinished: true } : g)
        }));
    },

    updateStats: async (newStats) => {
        const payload = {
            playerId: newStats.playerId,
            gameId: newStats.gameId,
            pa: newStats.pa, ab: newStats.ab,
            h1: newStats.h1, h2: newStats.h2, h3: newStats.h3, hr: newStats.hr,
            rbi: newStats.rbi, bb: newStats.bb, so: newStats.so, sf: newStats.sf, e: newStats.e
        };

        try {
            // Check if stats exist for this player/game combo
            const existingSnap = await getDocs(query(
                collection(db, STATS_COL),
                where('playerId', '==', newStats.playerId),
                where('gameId', '==', newStats.gameId),
                limit(1)
            ));

            if (!existingSnap.empty) {
                await updateDoc(doc(db, STATS_COL, existingSnap.docs[0].id), payload);
            } else {
                await addDoc(collection(db, STATS_COL), payload);
            }
        } catch (error) {
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
