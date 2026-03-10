import { Link } from 'react-router-dom';
import { Show, SignInButton, SignUpButton } from '@clerk/react';
import ClerkHeader from '../components/ClerkHeader';

const Signup = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-dark-bg p-0 transition-colors duration-300">
            <ClerkHeader />
            <div className="flex items-center justify-center p-4 min-h-[calc(100vh-73px)]">
                <div className="w-full max-w-md bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-3xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary mb-3">ProdMax Workspace</p>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Create your account</h1>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            Signup is now powered by Clerk. Once Google is enabled in Clerk, the modal can offer Google as the primary sign-up path.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <Show when="signed-out">
                            <SignUpButton mode="modal">
                                <button className="w-full bg-primary hover:bg-indigo-600 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20">
                                    Open sign up
                                </button>
                            </SignUpButton>

                            <SignInButton mode="modal">
                                <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-all border border-slate-800">
                                    I already have an account
                                </button>
                            </SignInButton>
                        </Show>
                    </div>

                    <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        Already registered? <Link to="/login" className="text-primary hover:underline">Open the sign in flow</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
