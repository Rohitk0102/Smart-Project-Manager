import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Show, SignInButton, SignUpButton } from '@clerk/react';
import ClerkHeader from '../components/ClerkHeader';
import { FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi';

const Signup = () => {
    const [inputValue, setInputValue] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleVerify = async () => {
        setIsLoading(true);
        setErrorMsg('');
        
        // CTO Secret Check
        if (inputValue === '9866308149') {
            localStorage.setItem('isCTOSignup', 'true');
            setIsVerified(true);
            setIsLoading(false);
            return;
        }

        // Invite Check via API
        try {
            // Using fetch since api.js might rely on AuthContext which might not have token here,
            // but this is a public unauthenticated route anyway.
            const response = await fetch(`http://localhost:5005/api/auth/check-invite?email=${encodeURIComponent(inputValue)}`);
            const data = await response.json();
            
            if (response.ok && data.invited) {
                setIsVerified(true);
            } else {
                setErrorMsg('No invitation found for this email. Contact your administrator.');
            }
        } catch (err) {
            setErrorMsg('Failed to verify invitation. Server error.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-dark-bg p-0 transition-colors duration-300">
            <ClerkHeader />
            <div className="flex items-center justify-center p-4 min-h-[calc(100vh-73px)]">
                <div className="w-full max-w-md bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-3xl p-8 shadow-2xl transition-all">
                    <div className="text-center mb-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary mb-3">ProdMax Workspace</p>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Create Account</h1>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            Workspace access is strictly by invitation only.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <Show when="signed-out">
                            {!isVerified ? (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Enter Invitation Email or Access Code"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                                        />
                                    </div>
                                    
                                    {errorMsg && (
                                        <div className="flex items-center gap-2 text-red-500 text-sm font-medium bg-red-50 dark:bg-red-500/10 p-3 rounded-lg border border-red-200 dark:border-red-500/20">
                                            <FiXCircle className="shrink-0" />
                                            {errorMsg}
                                        </div>
                                    )}

                                    <button 
                                        onClick={handleVerify}
                                        disabled={isLoading || !inputValue}
                                        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-indigo-600 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? <FiLoader className="animate-spin" /> : 'Verify Access'}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-bold bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/20 mb-4">
                                        <FiCheckCircle size={18} />
                                        Access Verified! You may now sign up.
                                    </div>
                                    <SignUpButton mode="modal">
                                        <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20">
                                            Open sign up modal
                                        </button>
                                    </SignUpButton>
                                </div>
                            )}

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                <SignInButton mode="modal">
                                    <button className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold py-3 rounded-xl transition-all border border-slate-800 dark:border-slate-700">
                                        I already have an account
                                    </button>
                                </SignInButton>
                            </div>
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