
import { useState, useEffect } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAward, FiTrendingUp, FiCheckCircle, FiStar, FiTarget, FiClock, FiZap, FiLayout, FiActivity, FiShield, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Leaderboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('all');

    useEffect(() => {
        const fetchLeaderboardData = async () => {
            try {
                const { data: projects } = await api.get('/projects');
                const tasksPromises = projects.map(p => api.get(`/tasks/project/${p._id}`));
                const tasksResponses = await Promise.all(tasksPromises);
                const allTasks = tasksResponses.flatMap(res => res.data);

                const userScores = {};
                const projectOwners = {};

                projects.forEach(p => {
                    if (p.ownerId) projectOwners[p._id] = p.ownerId._id || p.ownerId;
                });

                const getOrInitUser = (user, userId) => {
                    if (!userId) return null;
                    if (!userScores[userId]) {
                        userScores[userId] = {
                            member: user,
                            points: 0,
                            tasksCompleted: 0,
                            highPriority: 0,
                            projectsCount: new Set()
                        };
                    }
                    return userScores[userId];
                };

                const { data: allUsers } = await api.get('/auth/users');
                allUsers.forEach(u => {
                    getOrInitUser(u, u._id);
                });

                allTasks.forEach(task => {
                    if (task.status === 'completed') {
                        const taskDate = new Date(task.updatedAt);
                        const now = new Date();
                        const isThisWeek = (now - taskDate) < 7 * 24 * 60 * 60 * 1000;
                        const isThisMonth = (now.getMonth() === taskDate.getMonth()) && (now.getFullYear() === taskDate.getFullYear());

                        if (timeRange === 'week' && !isThisWeek) return;
                        if (timeRange === 'month' && !isThisMonth) return;

                        const points = (task.priority || 'low').toLowerCase() === 'high' ? 20 :
                            (task.priority || 'low').toLowerCase() === 'medium' ? 10 : 5;

                        const assignee = task.assignedTo;
                        if (assignee) {
                            const memberId = assignee._id || assignee;
                            const userData = getOrInitUser(assignee, memberId);
                            if (!userData) return;

                            let finalPoints = points;
                            const projectId = task.project._id || task.project;
                            const ownerId = projectOwners[projectId];

                            if (ownerId && memberId === ownerId) {
                                finalPoints += 2; 
                            }

                            userData.points += finalPoints;
                            userData.tasksCompleted += 1;
                            if ((task.priority || '').toLowerCase() === 'high') userData.highPriority += 1;
                            userData.projectsCount.add(projectId);
                        }
                    }
                });

                const sorted = Object.values(userScores)
                    .map(s => {
                        const points = Math.round(s.points * 10) / 10;
                        const level = Math.floor(points / 100) + 1;
                        const progress = ((points - ((level - 1) * 100)) / 100) * 100;

                        const badges = [];
                        if (s.highPriority >= 5) badges.push({ icon: '⚡', name: 'Blitz', color: 'text-yellow-400' });
                        if (s.tasksCompleted >= 10) badges.push({ icon: '🛡️', name: 'Veteran', color: 'text-blue-400' });
                        if (points >= 200) badges.push({ icon: '🚀', name: 'Legend', color: 'text-purple-400' });

                        return {
                            ...s,
                            projectsCount: s.projectsCount.size,
                            points,
                            level,
                            progress,
                            badges
                        };
                    })
                    .sort((a, b) => b.points - a.points);

                const detailedLog = [];
                allTasks.forEach(task => {
                    if (task.status === 'completed') {
                        const taskDate = new Date(task.updatedAt);
                        const now = new Date();
                        const isThisWeek = (now - taskDate) < 7 * 24 * 60 * 60 * 1000;
                        const isThisMonth = (now.getMonth() === taskDate.getMonth()) && (now.getFullYear() === taskDate.getFullYear());

                        if (timeRange === 'week' && !isThisWeek) return;
                        if (timeRange === 'month' && !isThisMonth) return;

                        const points = (task.priority || 'low').toLowerCase() === 'high' ? 20 :
                            (task.priority || 'low').toLowerCase() === 'medium' ? 10 : 5;
                        
                        const assignee = task.assignedTo;
                        if (assignee) {
                            detailedLog.push({
                                user: assignee,
                                taskTitle: task.title,
                                points,
                                date: taskDate
                            });
                        }
                    }
                });
                detailedLog.sort((a, b) => b.date - a.date);
                setRecentActivity(detailedLog.slice(0, 15));
                setStats(sorted);
            } catch (error) {
                console.error("Failed to fetch leaderboard", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboardData();
    }, [timeRange]);

    return (
        <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-[#050505] p-8 transition-colors duration-300 relative">
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>

            <div className="max-w-7xl mx-auto space-y-12 pb-24 relative z-10">
                
                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
                            <span className="p-3 bg-amber-400 text-white rounded-2xl shadow-xl shadow-amber-400/20 transform -rotate-3"><FiAward size={32} /></span>
                            Workspace Champions
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Top contributors based on completed impact points.</p>
                    </div>

                    <div className="flex bg-white dark:bg-white/5 p-1.5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm self-start">
                        {['all', 'month', 'week'].map((r) => (
                            <button
                                key={r}
                                onClick={() => setTimeRange(r)}
                                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${timeRange === r
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                                    : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                                    }`}
                            >
                                {r === 'all' ? 'All Time' : r}
                            </button>
                        ))}
                    </div>
                </header>

                {loading ? (
                    <div className="py-40 flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Calculating Standings...</p>
                    </div>
                ) : (
                    <div className="space-y-20">
                        
                        {/* Podium Section */}
                        {stats.length > 0 && (
                            <div className="flex flex-col lg:flex-row items-center justify-center gap-8 pt-10">
                                {/* Runner Up */}
                                {stats[1] && (
                                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="order-2 lg:order-1 flex flex-col items-center group cursor-pointer" onClick={() => navigate(`/profile/${stats[1].member._id}`)}>
                                        <div className="relative mb-6">
                                            <div className="absolute -inset-1 bg-slate-300 dark:bg-slate-700 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                            <div className="w-24 h-24 rounded-[2rem] border-b-4 border-slate-300 bg-white dark:bg-slate-800 relative z-10 overflow-hidden shadow-xl flex items-center justify-center">
                                                {stats[1].member.avatar ? <img src={stats[1].member.avatar} className="w-full h-full object-cover" /> : <span className="text-3xl font-black text-slate-300">{stats[1].member.name?.charAt(0)}</span>}
                                            </div>
                                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 text-[10px] font-black px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-600 z-20 shadow-md">#2</div>
                                        </div>
                                        <h3 className="font-bold text-slate-900 dark:text-white mb-1">{stats[1].member.name}</h3>
                                        <p className="text-primary font-black text-lg">{stats[1].points} <span className="text-[10px] uppercase">pts</span></p>
                                    </motion.div>
                                )}

                                {/* Champion */}
                                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="order-1 lg:order-2 flex flex-col items-center scale-125 lg:mb-12 group cursor-pointer" onClick={() => navigate(`/profile/${stats[0].member._id}`)}>
                                    <div className="relative mb-6">
                                        <div className="absolute -inset-2 bg-amber-400 rounded-[2.5rem] blur opacity-30 group-hover:opacity-60 transition-opacity animate-pulse"></div>
                                        <div className="w-28 h-28 rounded-[2.2rem] border-b-4 border-amber-500 bg-gradient-to-br from-amber-300 to-amber-500 relative z-10 overflow-hidden shadow-2xl flex items-center justify-center">
                                            {stats[0].member.avatar ? <img src={stats[0].member.avatar} className="w-full h-full object-cover" /> : <span className="text-4xl font-black text-white">{stats[0].member.name?.charAt(0)}</span>}
                                        </div>
                                        <div className="absolute -top-4 -right-4 bg-amber-400 text-white p-2 rounded-xl shadow-lg z-20 border-2 border-white dark:border-[#050505]"><FiAward size={20} /></div>
                                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-400 text-white text-[10px] font-black px-4 py-1 rounded-lg z-20 shadow-lg border border-amber-300 uppercase tracking-widest">Master</div>
                                    </div>
                                    <h3 className="font-black text-slate-900 dark:text-white text-xl mb-1">{stats[0].member.name}</h3>
                                    <p className="text-amber-500 font-black text-2xl">{stats[0].points} <span className="text-[10px] uppercase">pts</span></p>
                                </motion.div>

                                {/* Third */}
                                {stats[2] && (
                                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="order-3 flex flex-col items-center group cursor-pointer" onClick={() => navigate(`/profile/${stats[2].member._id}`)}>
                                        <div className="relative mb-6">
                                            <div className="absolute -inset-1 bg-orange-300 dark:bg-orange-900 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                            <div className="w-24 h-24 rounded-[2rem] border-b-4 border-orange-400 bg-white dark:bg-slate-800 relative z-10 overflow-hidden shadow-xl flex items-center justify-center">
                                                {stats[2].member.avatar ? <img src={stats[2].member.avatar} className="w-full h-full object-cover" /> : <span className="text-3xl font-black text-orange-200">{stats[2].member.name?.charAt(0)}</span>}
                                            </div>
                                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-black px-3 py-1 rounded-lg border border-orange-100 dark:border-orange-900/50 z-20 shadow-md">#3</div>
                                        </div>
                                        <h3 className="font-bold text-slate-900 dark:text-white mb-1">{stats[2].member.name}</h3>
                                        <p className="text-primary font-black text-lg">{stats[2].points} <span className="text-[10px] uppercase">pts</span></p>
                                    </motion.div>
                                )}
                            </div>
                        )}

                        {/* Full Rankings List */}
                        <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-sm">
                            <div className="grid grid-cols-1 divide-y divide-slate-100 dark:divide-white/5">
                                {stats.map((u, i) => (
                                    <motion.div 
                                        key={u.member._id}
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-all group cursor-pointer"
                                        onClick={() => navigate(`/profile/${u.member._id}`)}
                                    >
                                        <div className="flex items-center gap-6 flex-1">
                                            <div className="w-12 font-black text-2xl text-slate-300 dark:text-slate-700 group-hover:text-primary transition-colors italic">#{i+1}</div>
                                            <div className="relative">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
                                                    {u.member.avatar ? <img src={u.member.avatar} className="w-full h-full object-cover rounded-xl" /> : <div className="w-full h-full flex items-center justify-center font-black text-slate-400">{u.member.name.charAt(0)}</div>}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 bg-slate-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded border border-slate-700">LVL {u.level}</div>
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-slate-900 dark:text-white truncate">{u.member.name}</h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{u.tasksCompleted} Tasks</span>
                                                    <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{u.projectsCount} Projects</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8">
                                            <div className="flex gap-2">
                                                {u.badges.map((b, idx) => (
                                                    <div key={idx} className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center text-sm shadow-sm" title={b.name}>{b.icon}</div>
                                                ))}
                                            </div>
                                            <div className="text-right min-w-[80px]">
                                                <p className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{u.points}</p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Points</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Impact Feed */}
                        <div className="max-w-3xl mx-auto space-y-8">
                             <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 text-primary rounded-2xl"><FiZap size={24} /></div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Recent Impact</h3>
                                    <p className="text-slate-500 text-sm font-medium">Real-time completion activity from the team.</p>
                                </div>
                             </div>

                             <div className="space-y-4">
                                 {recentActivity.map((a, i) => (
                                     <motion.div 
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="flex items-center justify-between p-5 bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm"
                                     >
                                         <div className="flex items-center gap-4 min-w-0">
                                             <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 border border-slate-200 dark:border-white/5 overflow-hidden">
                                                 {a.user.avatar ? <img src={a.user.avatar} className="w-full h-full object-cover" /> : a.user.name?.charAt(0)}
                                             </div>
                                             <div className="min-w-0">
                                                 <p className="text-sm font-bold text-slate-900 dark:text-white truncate"><b>{a.user.name}</b> completed task</p>
                                                 <p className="text-xs text-slate-500 truncate italic">"{a.taskTitle}"</p>
                                             </div>
                                         </div>
                                         <div className="text-right">
                                             <p className="text-emerald-500 font-black">+{a.points}</p>
                                             <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(a.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                         </div>
                                     </motion.div>
                                 ))}
                             </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
