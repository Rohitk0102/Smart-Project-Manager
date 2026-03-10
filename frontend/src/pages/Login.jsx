import { Link } from 'react-router-dom';
import { Show, SignInButton, SignUpButton } from '@clerk/react';
import ClerkHeader from '../components/ClerkHeader';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const { error } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-dark-bg transition-colors duration-300">
            <ClerkHeader />
            <div className="flex items-center justify-center p-4 min-h-[calc(100vh-73px)]">
                <div className="w-full max-w-md bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-3xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary mb-3">ProdMax Workspace</p>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Sign in</h1>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            Clerk now handles authentication for this app. Enable Google in Clerk to make Google sign-in available in the modal.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <Show when="signed-out">
                            <SignInButton mode="modal">
                                <button className="w-full bg-primary hover:bg-indigo-600 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20">
                                    Continue to sign in
                                </button>
                            </SignInButton>

                            <SignUpButton mode="modal">
                                <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-all border border-slate-800">
                                    Create a new account
                                </button>
                            </SignUpButton>
                        </Show>
                    </div>

                    <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        Need a new account? <Link to="/signup" className="text-primary hover:underline">Open the sign up flow</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
