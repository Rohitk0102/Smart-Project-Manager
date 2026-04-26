import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { FiSearch, FiMessageSquare, FiUser, FiLoader, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const ClerkHeader = ({ compact = false }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef(null);

    // Debounced search logic
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                const { data } = await api.get(`/auth/search?query=${searchQuery}`);
                setSearchResults(data);
                setShowResults(true);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // Close results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChat = (targetUser) => {
        const event = new CustomEvent('open_dm', { detail: targetUser });
        window.dispatchEvent(event);
        setShowResults(false);
        setSearchQuery('');
    };

    return (
        <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-white/10 bg-white/85 dark:bg-[#050505]/80 backdrop-blur-xl transition-colors duration-300">
            <div className="flex items-center justify-between gap-4 px-6 py-4">
                {compact ? (
                    <div />
                ) : (
                    <Link to="/" className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 shadow-lg shadow-indigo-500/20" />
                        <div className="hidden sm:block min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary">ProdMax</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate font-medium">Workspace</p>
                        </div>
                    </Link>
                )}

                {/* Global Search Bar */}
                {!compact && user && (
                    <div className="flex-1 max-w-xl relative" ref={searchRef}>
                        <div className="relative group">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => searchQuery && setShowResults(true)}
                                placeholder="Search members..."
                                className="w-full bg-slate-100 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-2xl py-2.5 pl-12 pr-10 text-sm focus:bg-white dark:focus:bg-[#0a0a0a] focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-900 dark:text-white transition-all shadow-inner"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                                >
                                    <FiX size={14} />
                                </button>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        <AnimatePresence>
                            {showResults && (searchResults.length > 0 || isSearching) && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden shadow-indigo-500/10 z-50"
                                >
                                    <div className="p-2">
                                        {isSearching ? (
                                            <div className="p-8 flex items-center justify-center gap-3 text-slate-400 font-medium">
                                                <FiLoader className="animate-spin" />
                                                <span className="text-xs uppercase tracking-widest">Searching workspace...</span>
                                            </div>
                                        ) : (
                                            <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                                <p className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 mb-1">Members</p>
                                                {searchResults.map((res) => (
                                                    <div 
                                                        key={res._id}
                                                        className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all group/item cursor-pointer"
                                                        onClick={() => {
                                                            navigate(`/profile/${res._id}`);
                                                            setShowResults(false);
                                                            setSearchQuery('');
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
                                                                {res.avatar ? <img src={res.avatar} className="w-full h-full rounded-full object-cover" /> : res.name.charAt(0)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-slate-900 dark:text-white truncate text-sm">{res.name}</p>
                                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{res.technicalRole || res.role}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleChat(res);
                                                                }}
                                                                className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover/item:opacity-100"
                                                                title="Quick Chat"
                                                            >
                                                                <FiMessageSquare size={16} />
                                                            </button>
                                                            <div className="p-2 rounded-lg text-slate-400 hover:text-primary transition-all opacity-0 group-hover/item:opacity-100">
                                                                <FiUser size={16} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-slate-50 dark:bg-white/[0.02] p-3 text-center border-t border-slate-100 dark:border-white/5">
                                        <p className="text-[10px] text-slate-400 font-medium">Tip: Click profile to view details or the message icon to chat instantly.</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <Show when="signed-out">
                        <SignInButton mode="modal">
                            <button className="rounded-xl border border-slate-300 dark:border-white/15 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                                Sign in
                            </button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition-colors">
                                Sign up
                            </button>
                        </SignUpButton>
                    </Show>

                    <Show when="signed-in">
                        {user?.role && user.role !== 'Pending' && (
                            <span className={`hidden md:inline-block px-3 py-1 mr-2 text-[10px] font-black uppercase tracking-widest rounded-full border ${
                                user.role === 'CTO' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/30' :
                                user.role === 'PM' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30' :
                                user.role === 'TeamLead' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30' :
                                'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                            }`}>
                                {user.role === 'TeamLead' ? 'Lead' : user.role === 'PM' ? 'Manager' : user.role}
                            </span>
                        )}
                        <UserButton afterSignOutUrl="/login" userProfileMode="modal" />
                    </Show>
                </div>
            </div>
        </header>
    );
};

export default ClerkHeader;