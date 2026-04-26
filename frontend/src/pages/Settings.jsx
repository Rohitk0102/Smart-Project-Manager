import { useState } from 'react';
import { motion } from 'framer-motion';
import { Show, UserButton, useUser as useClerkUser } from '@clerk/react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { FiCheck, FiCpu, FiLayout, FiServer, FiSettings, FiUser, FiZap, FiLoader, FiMessageSquare } from 'react-icons/fi';

const Settings = () => {
    const { user, updateUser } = useAuth();
    const { user: clerkUser } = useClerkUser();

    const [bio, setBio] = useState(user?.bio || '');
    const [techRole, setTechRole] = useState(user?.technicalRole || 'Unspecified');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const techRoles = [
        { id: 'AI', label: 'AI', icon: <FiZap /> },
        { id: 'Frontend', label: 'Frontend', icon: <FiLayout /> },
        { id: 'Backend', label: 'Backend', icon: <FiServer /> },
        { id: 'DevOps', label: 'DevOps', icon: <FiSettings /> },
        { id: 'ML Engineer', label: 'ML Engineer', icon: <FiCpu /> }
    ];

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);
        try {
            const { data } = await api.put('/auth/profile/tech-role', { technicalRole: techRole, bio });
            updateUser(data);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error("Failed to update profile", err);
        } finally {
            setLoading(false);
        }
    };

    const authMethods = clerkUser?.externalAccounts?.map((account) => account.provider).filter(Boolean) || [];

    return (
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar h-full bg-slate-50 dark:bg-[#050505] transition-colors duration-300">
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mb-12"
            >
                <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Settings</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Manage your workspace specialization and account security.</p>
            </motion.header>

            <div className="grid gap-8 max-w-6xl xl:grid-cols-[1fr_0.8fr]">
                {/* Specialization Section */}
                <motion.section
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-10 shadow-sm"
                >
                    <div className="mb-10">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-3">Workspace Identity</p>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white">Professional Profile</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Define your technical focus and share a brief bio with the team.</p>
                    </div>

                    <form onSubmit={handleSaveProfile} className="space-y-8">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Technical Specialization</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                {techRoles.map((role) => (
                                    <div
                                        key={role.id}
                                        onClick={() => setTechRole(role.id)}
                                        className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 text-center ${
                                            techRole === role.id 
                                            ? 'bg-primary/5 border-primary text-primary shadow-lg shadow-primary/5' 
                                            : 'bg-slate-50 dark:bg-white/5 border-transparent text-slate-400 hover:border-slate-200 dark:hover:border-white/10'
                                        }`}
                                    >
                                        <span className="text-xl">{role.icon}</span>
                                        <span className="text-[10px] font-bold uppercase tracking-tight">{role.label}</span>
                                        {techRole === role.id && <FiCheck className="absolute top-2 right-2 text-primary" />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Brief Biography</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="I'm a senior developer focused on building scalable systems..."
                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all h-32 resize-none"
                            />
                        </div>

                        <div className="flex items-center gap-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-10 py-4 bg-primary hover:bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                {loading ? <FiLoader className="animate-spin" /> : 'Save Specialization'}
                            </button>
                            {success && (
                                <motion.p 
                                    initial={{ opacity: 0, x: -10 }} 
                                    animate={{ opacity: 1, x: 0 }} 
                                    className="text-emerald-500 font-bold text-sm flex items-center gap-2"
                                >
                                    <FiCheck /> Profile Updated
                                </motion.p>
                            )}
                        </div>
                    </form>
                </motion.section>

                <div className="space-y-8">
                    {/* Clerk Account Section */}
                    <motion.section
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-10 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-3">Security</p>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Clerk Account</h3>
                            </div>
                            <UserButton afterSignOutUrl="/login" userProfileMode="modal" />
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 p-5">
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-widest">Workspace Rank</p>
                                <p className="text-slate-900 dark:text-white font-bold">{user?.role || 'Member'}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 p-5">
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-widest">Linked Email</p>
                                <p className="text-slate-900 dark:text-white font-bold truncate">{user?.email || 'Unavailable'}</p>
                            </div>
                        </div>
                    </motion.section>

                    {/* Support Info */}
                    <motion.section
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-10"
                    >
                        <h4 className="text-lg font-bold text-primary mb-3">Need Help?</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            If you need to change your workspace permissions or rank, please contact your CTO or Project Manager directly through the Chat hub.
                        </p>
                    </motion.section>
                </div>
            </div>
        </div>
    );
};

export default Settings;