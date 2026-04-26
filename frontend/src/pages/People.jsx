import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { FiSearch, FiFilter, FiMessageSquare, FiUser, FiMoreVertical, FiTrendingUp, FiCheckCircle, FiAward, FiStar, FiChevronDown } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const UserPopover = ({ user, currentUser, onClose, onChat }) => {
    const navigate = useNavigate();
    const isSelf = user._id === currentUser?._id;

    if (isSelf) return null;

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute z-50 bg-white dark:bg-dark-card border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-4 w-64 top-12 left-0"
        >
            <div className="flex items-center gap-3 mb-4 border-b border-slate-100 dark:border-white/5 pb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {user.avatar ? <img src={user.avatar} className="w-full h-full rounded-full object-cover" /> : user.name?.charAt(0)}
                </div>
                <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{user.role}</p>
                </div>
            </div>

            <div className="space-y-2">
                <button 
                    onClick={() => navigate(`/profile/${user._id}`)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 font-medium transition-all"
                >
                    <FiUser size={18} className="text-primary" />
                    <span>View Profile</span>
                </button>
                <button 
                    onClick={() => { onChat(user); onClose(); }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 font-medium transition-all"
                >
                    <FiMessageSquare size={18} className="text-indigo-500" />
                    <span>Chat</span>
                </button>
            </div>
        </motion.div>
    );
};

const People = () => {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [techFilter, setTechFilter] = useState('All');
    const [sortBy, setSortBy] = useState('Name');
    const [activePopover, setActivePopover] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data } = await api.get('/auth/users');
                setUsers(data);
            } catch (err) {
                console.error("Failed to fetch users", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleUserClick = (user) => {
        if (user._id === currentUser?._id) {
            navigate('/settings');
        } else {
            setActivePopover(activePopover === user._id ? null : user._id);
        }
    };

    const handleChat = (user) => {
        // Trigger global DM event (will be handled by FloatingChatManager later)
        const event = new CustomEvent('open_dm', { detail: user });
        window.dispatchEvent(event);
    };

    const filteredUsers = users
        .filter(u => {
            const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                u.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = roleFilter === 'All' || u.role === roleFilter;
            const matchesTech = techFilter === 'All' || u.technicalRole === techFilter;
            return matchesSearch && matchesRole && matchesTech;
        })
        .sort((a, b) => {
            if (sortBy === 'Name') return a.name.localeCompare(b.name);
            if (sortBy === 'Points') return (b.points || 0) - (a.points || 0);
            return 0;
        });

    if (loading) return (
        <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-[#050505] p-8 relative transition-colors duration-300">
            <div className="max-w-7xl mx-auto pb-20">
                <header className="mb-12">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
                                People
                                <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 tracking-widest uppercase">{users.length} Workspace Members</span>
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Manage collaborations and view your workspace directory.</p>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-[#121212] p-4 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
                        <div className="relative md:col-span-2">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white transition-all"
                            />
                        </div>
                        <div className="relative">
                            <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select 
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white appearance-none transition-all"
                            >
                                <option value="All">All Roles</option>
                                <option value="CTO">CTO</option>
                                <option value="PM">PM</option>
                                <option value="TeamLead">Team Lead</option>
                                <option value="Employee">Employee</option>
                            </select>
                        </div>
                        <div className="relative">
                            <FiTrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select 
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white appearance-none transition-all"
                            >
                                <option value="Name">Sort by Name</option>
                                <option value="Points">Sort by Points</option>
                            </select>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredUsers.map(u => (
                        <motion.div 
                            key={u._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-[#121212] rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm p-6 hover:shadow-2xl hover:border-primary/30 transition-all group relative cursor-pointer"
                            onClick={() => handleUserClick(u)}
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="relative mb-4">
                                    <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-indigo-600 rounded-full blur opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
                                    <div className="relative w-20 h-20 rounded-full bg-slate-100 dark:bg-white/5 p-1">
                                        {u.avatar ? (
                                            <img src={u.avatar} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-2xl font-black text-white">
                                                {u.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-4 border-white dark:border-[#121212] rounded-full"></div>
                                </div>

                                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{u.name}</h4>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{u.role}</p>
                                
                                <div className="flex flex-wrap justify-center gap-2 mb-6">
                                    <span className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold border border-indigo-100 dark:border-indigo-500/20 uppercase tracking-tighter">
                                        {u.technicalRole || 'Specialization'}
                                    </span>
                                    <span className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-100 dark:border-amber-500/20 uppercase tracking-tighter flex items-center gap-1">
                                        <FiStar size={10} /> {u.points} PTS
                                    </span>
                                </div>

                                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 italic mb-6">
                                    {u.bio || "No biography provided yet."}
                                </p>

                                <div className="absolute top-4 right-4 text-slate-300 group-hover:text-primary transition-colors">
                                    <FiMoreVertical size={20} />
                                </div>
                            </div>

                            <AnimatePresence>
                                {activePopover === u._id && (
                                    <UserPopover 
                                        user={u} 
                                        currentUser={currentUser} 
                                        onClose={() => setActivePopover(null)} 
                                        onChat={handleChat}
                                    />
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <FiSearch size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">No members found</h3>
                        <p className="text-slate-500 mt-2">Try adjusting your filters or search query.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default People;