'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/authStore';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

export function SignInDialog() {
    const { isSignInOpen, closeSignIn, signIn, resetPassword, signInLoading, signInError, signInInfo } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const ok = await signIn(email, password);
        if (ok) {
            setEmail('');
            setPassword('');
        }
    };

    return (
        <Dialog open={isSignInOpen} onOpenChange={(open) => { if (!open) closeSignIn(); }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" /> Team Sign In
                    </DialogTitle>
                    <DialogDescription>
                        Viewing stats is open to everyone. Signing in is only needed to add players,
                        record games, or edit/delete data. Don&apos;t have an account? Ask your team
                        admin to create one for you.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <label htmlFor="signin-email" className="text-sm font-medium">Email</label>
                        <Input
                            id="signin-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            autoFocus
                            disabled={signInLoading}
                        />
                    </div>
                    <div className="grid gap-2">
                        <label htmlFor="signin-password" className="text-sm font-medium">Password</label>
                        <Input
                            id="signin-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={signInLoading}
                        />
                    </div>

                    {signInError && (
                        <p className="text-sm text-red-600 font-medium">{signInError}</p>
                    )}
                    {signInInfo && (
                        <p className="text-sm text-green-600 font-medium">{signInInfo}</p>
                    )}

                    <button
                        type="button"
                        onClick={() => resetPassword(email)}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        Forgot password?
                    </button>

                    <DialogFooter>
                        <Button type="submit" disabled={signInLoading} className="bg-blue-600 hover:bg-blue-700">
                            {signInLoading ? 'Signing in…' : 'Sign In'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
