import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { motion } from 'framer-motion';

const ProjectAnalytics = ({ tasks, project }) => {
    // 1. Core Metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const runningTasks = tasks.filter(t => t.status === 'running').length;
    const todoTasks = tasks.filter(t => t.status === 'to-do').length;
    
    const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    
    const highPriorityTasks = tasks.filter(t => ['high', 'urgent'].includes((t.priority || '').toLowerCase()));
    const highPriorityPending = highPriorityTasks.filter(t => t.status !== 'completed').length;

    // 2. Prepare Data for Charts

    // Priority Distribution
    const priorities = { high: 0, medium: 0, low: 0, urgent: 0 };
    tasks.forEach(t => {
        const p = (t.priority || 'low').toLowerCase();
        if (priorities[p] !== undefined) priorities[p]++;
        else priorities.low++; 
    });

    const priorityData = [
        { name: 'Urgent', value: priorities.urgent, color: '#e11d48' }, // Rose-600
        { name: 'High', value: priorities.high, color: '#f43f5e' }, // Rose-500
        { name: 'Medium', value: priorities.medium, color: '#f59e0b' }, // Amber-500
        { name: 'Low', value: priorities.low, color: '#10b981' } // Emerald-500
    ].filter(d => d.value > 0);

    // Status Pipeline Data
    const statusData = [
        { name: 'To Do', value: todoTasks, color: '#94a3b8' },
        { name: 'Running', value: runningTasks, color: '#6366f1' },
        { name: 'Done', value: completedTasks, color: '#22c55e' }
    ];

    // Workload Breakdown (Stacked Bar)
    const memberStats = {};
    tasks.forEach(t => {
        const name = t.assignedTo?.name || 'Unassigned';
        const displayName = name.split(' ')[0];
        
        if (!memberStats[displayName]) {
            memberStats[displayName] = { name: displayName, todo: 0, running: 0, completed: 0, total: 0 };
        }
        
        memberStats[displayName].total++;
        if (t.status === 'completed') memberStats[displayName].completed++;
        else if (t.status === 'running') memberStats[displayName].running++;
        else memberStats[displayName].todo++;
    });

    const workloadData = Object.values(memberStats)
        .sort((a, b) => b.total - a.total)
        .slice(0, 6);

    // Team Metadata
    const teamSize = [project?.ownerId, ...(project?.assignedLeads || []), ...(project?.assignedEmployees || [])]
        .filter(Boolean)
        .filter((v, i, a) => a.findIndex(t => (t._id || t) === (v._id || v)) === i)
        .length;

    // Custom Label for Pie
    const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-black">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar h-full bg-slate-50 dark:bg-[#050505] transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-8 pb-24">
                
                {/* Dashboard Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <span className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20"><FiActivity size={28} /></span>
                            Analytical Board
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Strategic overview of <span className="text-primary font-bold">{project?.name}</span></p>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-white dark:bg-[#121212] p-2 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                        <div className="px-4 py-2 border-r border-slate-100 dark:border-white/5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Health</p>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${highPriorityPending > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{highPriorityPending > 0 ? 'Action Required' : 'On Track'}</span>
                            </div>
                        </div>
                        <div className="px-4 py-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bottlenecks</p>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{runningTasks} Tasks In-Flight</span>
                        </div>
                    </div>
                </header>

                {/* Primary Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Completion', value: `${completionRate}%`, sub: `${completedTasks} of ${totalTasks} done`, icon: <FiCheckCircle />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                        { label: 'Active Load', value: runningTasks, sub: 'Currently in progress', icon: <FiPlay />, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                        { label: 'Urgent/High', value: highPriorityPending, sub: 'Pending attention', icon: <FiAlertCircle />, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                        { label: 'Team Velocity', value: teamSize, sub: 'Active contributors', icon: <FiUsers />, color: 'text-blue-500', bg: 'bg-blue-500/10' }
                    ].map((s, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white dark:bg-[#121212] p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-2xl transition-all group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-2 rounded-xl ${s.bg} ${s.color} transition-transform group-hover:scale-110`}>{s.icon}</div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</span>
                            </div>
                            <p className="text-4xl font-black text-slate-900 dark:text-white mb-1">{s.value}</p>
                            <p className="text-xs text-slate-500 font-medium">{s.sub}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Large Visual Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Workload Distribution */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="lg:col-span-2 bg-white dark:bg-[#121212] p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Team Workload Balance</h3>
                                <p className="text-sm text-slate-500 font-medium">Task distribution across active contributors</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase"><span className="w-2 h-2 rounded-full bg-slate-400"></span> To Do</div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-500 uppercase"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Running</div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Done</div>
                            </div>
                        </div>
                        
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={workloadData} layout="vertical" margin={{ left: 20, right: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.03} horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 800 }}
                                        width={80}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: 'rgba(99,102,241,0.05)' }}
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                const d = payload[0].payload;
                                                return (
                                                    <div className="bg-slate-900 border border-slate-700 p-4 rounded-2xl shadow-2xl">
                                                        <p className="font-bold text-white mb-2">{label}</p>
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] text-slate-400 flex justify-between gap-8 uppercase">To Do <span className="text-white font-mono">{d.todo}</span></p>
                                                            <p className="text-[10px] text-indigo-400 flex justify-between gap-8 uppercase">Running <span className="text-white font-mono">{d.running}</span></p>
                                                            <p className="text-[10px] text-emerald-400 flex justify-between gap-8 uppercase">Completed <span className="text-white font-mono">{d.completed}</span></p>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="todo" stackId="a" fill="#94a3b8" radius={[0, 0, 0, 0]} barSize={28} />
                                    <Bar dataKey="running" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="completed" stackId="a" fill="#22c55e" radius={[0, 10, 10, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Priority Mix */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white dark:bg-[#121212] p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm flex flex-col items-center"
                    >
                        <h3 className="w-full text-lg font-bold text-slate-900 dark:text-white mb-2">Priority Spectrum</h3>
                        <p className="w-full text-xs text-slate-500 font-medium mb-10">Criticality mix of active tasks</p>
                        
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={priorityData}
                                        innerRadius={75}
                                        outerRadius={110}
                                        paddingAngle={10}
                                        dataKey="value"
                                        stroke="none"
                                        label={renderPieLabel}
                                        labelLine={false}
                                    >
                                        {priorityData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl shadow-xl text-xs">
                                                        <p className="font-bold text-white mb-1">{payload[0].name}</p>
                                                        <p className="text-slate-300">Volume: <span className="text-white font-mono">{payload[0].value}</span></p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Legend iconType="circle" verticalAlign="bottom" wrapperStyle={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', paddingTop: 20 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        
                        <div className="mt-8 w-full p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-center">
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Attention Required</p>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{highPriorityPending} Critical Path Bottlenecks</p>
                        </div>
                    </motion.div>
                </div>

                {/* Status Pipeline Footer */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-[#121212] p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden relative"
                >
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-slate-400 via-indigo-500 to-emerald-500 opacity-20"></div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="md:w-1/3">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Pipeline Velocity</h3>
                            <p className="text-sm text-slate-500 font-medium">Real-time status of the project lifecycle</p>
                        </div>
                        
                        <div className="flex-1 w-full">
                            <div className="grid grid-cols-3 gap-4 h-24">
                                {statusData.map((s, i) => (
                                    <div key={i} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group hover:border-primary transition-all">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 group-hover:text-primary transition-colors">{s.name}</p>
                                        <p className="text-3xl font-black text-slate-900 dark:text-white">{s.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

            </div>
        </div>
    );
};

// Icons 
const FiActivity = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>;
const FiCheckCircle = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const FiPlay = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>;
const FiUsers = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const FiAlertCircle = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;

export default ProjectAnalytics;
