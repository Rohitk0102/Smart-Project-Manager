import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { FiX, FiSend, FiLoader, FiUserPlus, FiCheckCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const GiveAccessModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [email, setEmail] = useState('');
    const [role, setRole] = useState(user?.role === 'CTO' ? 'PM' : 'TeamLead');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    if (!isOpen || !user) return null;

    // Define roles available to assign based on the current user's role
    const availableRoles = user.role === 'CTO' 
        ? ['PM', 'TeamLead', 'Employee'] 
        : ['TeamLead', 'Employee'];

    const handleInvite = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            await api.post('/auth/invite', { email, role });
            setSuccess(true);
            setEmail('');
            setTimeout(() => {
                setSuccess(false);
                onClose();
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send invite');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl relative"
                    >
                        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                            <FiX size={24} />
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                                <FiUserPlus size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Give Access</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Invite a new member to the workspace.</p>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-200 dark:border-red-500/20 font-medium">
                                {error}
                            </div>
                        )}

                        {success ? (
                            <div className="py-8 flex flex-col items-center justify-center text-emerald-500 gap-4">
                                <FiCheckCircle size={48} className="animate-bounce" />
                                <p className="font-bold text-lg text-slate-900 dark:text-white">Invitation Sent!</p>
                            </div>
                        ) : (
                            <form onSubmit={handleInvite} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                                        placeholder="colleague@company.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Role</label>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                                    >
                                        {availableRoles.map(r => (
                                            <option key={r} value={r}>{r === 'PM' ? 'Project Manager' : r === 'TeamLead' ? 'Team Lead' : r}</option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !email}
                                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all mt-4"
                                >
                                    {loading ? <FiLoader className="animate-spin" size={18} /> : <><FiSend size={18} /> Send Invitation</>}
                                </button>
                            </form>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default GiveAccessModal;