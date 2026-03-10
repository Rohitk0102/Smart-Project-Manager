import { Link } from 'react-router-dom';
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react';

const ClerkHeader = ({ compact = false }) => {
    return (
        <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-white/10 bg-white/85 dark:bg-[#050505]/80 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-6 py-4">
                {compact ? (
                    <div />
                ) : (
                    <Link to="/" className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 shadow-lg shadow-indigo-500/20" />
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary">ProdMax</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">Workspace</p>
                        </div>
                    </Link>
                )}

                <div className="flex items-center gap-3">
                    <Show when="signed-out">
                        <SignInButton mode="modal">
                            <button className="rounded-xl border border-slate-300 dark:border-white/15 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                                Sign in
                            </button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition-colors">
                                Sign up
                            </button>
                        </SignUpButton>
                    </Show>

                    <Show when="signed-in">
                        <UserButton afterSignOutUrl="/login" userProfileMode="modal" />
                    </Show>
                </div>
            </div>
        </header>
    );
};

export default ClerkHeader;
