import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { FiArrowLeft, FiMessageSquare, FiAward, FiCode, FiUser, FiMail, FiCalendar, FiEdit3, FiStar } from 'react-icons/fi';
import { motion } from 'framer-motion';

const Profile = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [profileUser, setProfileUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSelf, setIsSelf] = useState(false);

    useEffect(() => {
        if (userId === currentUser?._id) {
            setIsSelf(true);
            setProfileUser(currentUser);
            setLoading(false);
            return;
        }

        const fetchProfile = async () => {
            try {
                const { data } = await api.get(`/auth/users`);
                const found = data.find(u => u._id === userId);
                if (found) {
                    setProfileUser(found);
                } else {
                    console.error("User not found");
                }
            } catch (err) {
                console.error("Failed to load profile", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [userId, currentUser]);

    const handleChat = () => {
        const event = new CustomEvent('open_dm', { detail: profileUser });
        window.dispatchEvent(event);
    };

    if (loading) return (
        <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!profileUser) return (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
            <FiUser size={48} className="text-slate-300 mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Profile Not Found</h2>
            <p className="text-slate-500 mb-6">The user you are looking for does not exist in this workspace.</p>
            <Link to="/people" className="text-primary font-bold hover:underline">Back to Directory</Link>
        </div>
    );

    return (
        <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-[#050505] p-8 transition-colors duration-300">
            <div className="max-w-4xl mx-auto pb-20">
                <Link to="/people" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors mb-8 font-medium">
                    <FiArrowLeft /> Back to Directory
                </Link>

                <div className="bg-white dark:bg-[#121212] rounded-[2.5rem] border border-slate-200 dark:border-white/5 overflow-hidden shadow-2xl">
                    {/* Cover / Header */}
                    <div className="h-48 bg-gradient-to-r from-primary via-indigo-600 to-fuchsia-600 relative">
                        <div className="absolute inset-0 bg-black/10"></div>
                        <div className="absolute -bottom-16 left-12 p-1 bg-white dark:bg-[#121212] rounded-[2rem] shadow-xl">
                            <div className="w-32 h-32 rounded-[1.8rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-4xl font-black text-primary overflow-hidden border border-slate-100 dark:border-white/10">
                                {profileUser.avatar ? <img src={profileUser.avatar} className="w-full h-full object-cover" /> : profileUser.name.charAt(0)}
                            </div>
                        </div>
                    </div>

                    <div className="pt-20 px-12 pb-12">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-2">
                                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{profileUser.name}</h1>
                                    {isSelf && (
                                        <button 
                                            onClick={() => navigate('/settings')}
                                            className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-primary transition-all"
                                        >
                                            <FiEdit3 size={18} />
                                        </button>
                                    )}
                                </div>
                                <p className="text-primary font-bold uppercase tracking-[0.2em] text-xs mb-6">{profileUser.role} &bull; Workspace Member</p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-primary"><FiMail size={16} /></div>
                                        <span className="text-sm font-medium">{profileUser.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-indigo-500"><FiCode size={16} /></div>
                                        <span className="text-sm font-medium">{profileUser.technicalRole || 'No Specialization'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {!isSelf && (
                                        <button 
                                            onClick={handleChat}
                                            className="flex items-center gap-2 px-8 py-3.5 bg-primary hover:bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                                        >
                                            <FiMessageSquare /> Send Message
                                        </button>
                                    )}
                                    <div className="flex items-center gap-2 px-6 py-3 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 rounded-2xl font-black uppercase text-xs tracking-widest">
                                        <FiStar className="fill-current" /> {profileUser.points} Recognition Points
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 space-y-8">
                                <section>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <FiUser className="text-primary" /> Professional Bio
                                    </h3>
                                    <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                        {profileUser.bio || "This user hasn't shared a bio with the workspace yet. Use the chat to get to know them better!"}
                                    </div>
                                </section> section
                            </div>

                            <div className="space-y-8">
                                <section className="p-6 rounded-3xl bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10">
                                    <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <FiAward /> Achievements
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Early Adopter</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Workspace Pioneer</p>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;