import { motion } from 'framer-motion';
import { Show, UserButton, useUser as useClerkUser } from '@clerk/react';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
    const { user } = useAuth();
    const { user: clerkUser } = useClerkUser();

    const authMethods = clerkUser?.externalAccounts?.map((account) => account.provider).filter(Boolean) || [];

    return (
        <div className="flex-1 p-8 overflow-y-auto">
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mb-8"
            >
                <h2 className="text-3xl font-bold text-white mb-2">Settings</h2>
                <p className="text-slate-400">Account access is now managed entirely by Clerk.</p>
            </motion.header>

            <div className="grid gap-6 max-w-5xl lg:grid-cols-[1.1fr_0.9fr]">
                <motion.section
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-dark-card border border-slate-800 rounded-2xl p-8"
                >
                    <div className="flex items-start justify-between gap-4 mb-8">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary mb-3">Authentication</p>
                            <h3 className="text-2xl font-bold text-white">Manage your Clerk account</h3>
                            <p className="text-slate-400 mt-2 max-w-xl">
                                Passwords, Google sign-in, multi-session security, and account recovery are no longer handled by the app backend.
                            </p>
                        </div>

                        <Show when="signed-in">
                            <UserButton afterSignOutUrl="/login" />
                        </Show>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                            <p className="text-xs uppercase tracking-[0.25em] text-slate-500 mb-2">Primary Email</p>
                            <p className="text-white font-medium break-all">{clerkUser?.primaryEmailAddress?.emailAddress || user?.email || 'Unavailable'}</p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                            <p className="text-xs uppercase tracking-[0.25em] text-slate-500 mb-2">Workspace Role</p>
                            <p className="text-white font-medium">{user?.role || 'Member'}</p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                            <p className="text-xs uppercase tracking-[0.25em] text-slate-500 mb-2">Display Name</p>
                            <p className="text-white font-medium">{clerkUser?.fullName || user?.name || 'Unavailable'}</p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                            <p className="text-xs uppercase tracking-[0.25em] text-slate-500 mb-2">Connected Auth Methods</p>
                            <p className="text-white font-medium">
                                {authMethods.length > 0 ? authMethods.join(', ') : 'Email or default Clerk sign-in'}
                            </p>
                        </div>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    className="bg-dark-card border border-slate-800 rounded-2xl p-8"
                >
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary mb-3">Next Step</p>
                    <h3 className="text-2xl font-bold text-white mb-3">Enable Google in Clerk</h3>
                    <p className="text-slate-400 leading-7">
                        This codebase now relies on Clerk for sign-in and session handling. To make Google the actual auth method users see,
                        enable the Google social connection in your Clerk dashboard and it will appear in the Clerk sign-in and sign-up flows.
                    </p>
                    <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                        <p className="text-sm text-slate-300">
                            After Google is enabled, test the flow from the login page and confirm the app syncs your Clerk user into the workspace automatically.
                        </p>
                    </div>
                </motion.section>
            </div>
        </div>
    );
};

export default Settings;
