'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Menu, X, LogIn, LogOut, UserCircle } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/lib/authStore';

const navItems = [
    { name: 'Dashboard', href: '/' },
    { name: 'Record Game', href: '/record' },
    { name: 'Players', href: '/players' },
    { name: 'Lineup AI', href: '/lineup' },
];

export function Navbar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const { user, openSignIn, signOut } = useAuthStore();

    return (
        <nav className="bg-slate-900 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="text-xl font-bold tracking-tight text-blue-400">
                            Savant<span className="text-white">Stats</span>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-2">
                        <div className="flex items-baseline space-x-4">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                                        pathname === item.href
                                            ? 'bg-slate-800 text-blue-400'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    )}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>

                        <div className="pl-4 ml-2 border-l border-slate-800">
                            {user ? (
                                <div className="flex items-center gap-3">
                                    <span className="hidden lg:flex items-center gap-1 text-xs text-slate-400">
                                        <UserCircle className="h-4 w-4" /> {user.email}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => signOut()}
                                        className="text-slate-300 hover:text-white hover:bg-slate-800"
                                    >
                                        <LogOut className="h-4 w-4 mr-1" /> Sign Out
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openSignIn()}
                                    className="text-slate-300 hover:text-white hover:bg-slate-800"
                                >
                                    <LogIn className="h-4 w-4 mr-1" /> Sign In
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-slate-300 hover:text-white hover:bg-slate-800"
                        >
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-slate-900 border-t border-slate-800">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    'block px-3 py-2 rounded-md text-base font-medium',
                                    pathname === item.href
                                        ? 'bg-slate-800 text-blue-400'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                )}
                            >
                                {item.name}
                            </Link>
                        ))}

                        <div className="pt-2 mt-2 border-t border-slate-800">
                            {user ? (
                                <button
                                    onClick={() => { signOut(); setIsOpen(false); }}
                                    className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                                >
                                    <LogOut className="h-4 w-4" /> Sign Out ({user.email})
                                </button>
                            ) : (
                                <button
                                    onClick={() => { openSignIn(); setIsOpen(false); }}
                                    className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                                >
                                    <LogIn className="h-4 w-4" /> Sign In
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
