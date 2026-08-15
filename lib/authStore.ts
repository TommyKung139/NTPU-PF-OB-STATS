import { create } from 'zustand';
import { auth } from '@/lib/firebase';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    type User,
} from 'firebase/auth';

interface AuthState {
    user: User | null;
    initializing: boolean;

    isSignInOpen: boolean;
    signInLoading: boolean;
    signInError: string | null;
    signInInfo: string | null;

    openSignIn: () => void;
    closeSignIn: () => void;
    signIn: (email: string, password: string) => Promise<boolean>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<boolean>;

    // Call before any write action. Returns true if already signed in.
    // If not signed in, opens the sign-in dialog and returns false so the
    // caller can bail out of the write.
    requireAuth: () => boolean;
}

let listenerStarted = false;

export const useAuthStore = create<AuthState>((set, get) => {
    // Start the Firebase auth listener exactly once, on first store access.
    // (Safe to do here since lib/firebase.ts + this module only run client-side.)
    if (!listenerStarted && typeof window !== 'undefined') {
        listenerStarted = true;
        onAuthStateChanged(auth, (user) => {
            set({ user, initializing: false });
        });
    }

    return {
        user: null,
        initializing: true,

        isSignInOpen: false,
        signInLoading: false,
        signInError: null,
        signInInfo: null,

        openSignIn: () => set({ isSignInOpen: true, signInError: null, signInInfo: null }),
        closeSignIn: () => set({ isSignInOpen: false, signInError: null, signInInfo: null }),

        signIn: async (email, password) => {
            set({ signInLoading: true, signInError: null, signInInfo: null });
            try {
                await signInWithEmailAndPassword(auth, email, password);
                set({ signInLoading: false, isSignInOpen: false });
                return true;
            } catch (err: any) {
                set({
                    signInLoading: false,
                    signInError: '登入失敗，請確認帳號密碼是否正確 (sign-in failed — check email/password).',
                });
                return false;
            }
        },

        signOut: async () => {
            await firebaseSignOut(auth);
        },

        resetPassword: async (email) => {
            if (!email) {
                set({ signInError: 'Enter your email above first, then click "Forgot password".' });
                return false;
            }
            try {
                await sendPasswordResetEmail(auth, email);
                set({ signInError: null, signInInfo: 'Password reset email sent — check your inbox.' });
                return true;
            } catch (err: any) {
                set({ signInError: 'Could not send reset email. Double-check the address.', signInInfo: null });
                return false;
            }
        },

        requireAuth: () => {
            if (get().user) return true;
            set({ isSignInOpen: true, signInError: null, signInInfo: null });
            return false;
        },
    };
});
