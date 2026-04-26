import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMinus, FiSend, FiUser, FiMaximize2, FiMessageSquare } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const DraggableChatWindow = ({ targetUser, onClose }) => {
    const { user: currentUser } = useAuth();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [isMinimized, setIsMinimized] = useState(false);
    const scrollRef = useRef(null);
    
    const chatKey = `prodmax_chat_${[currentUser?._id, targetUser?._id].sort().join('_')}`;

    useEffect(() => {
        const saved = localStorage.getItem(chatKey);
        if (saved) setMessages(JSON.parse(saved));

        // Listen for new messages from other windows/tabs
        const handleStorage = (e) => {
            if (e.key === chatKey) setMessages(JSON.parse(e.newValue));
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [chatKey]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, isMinimized]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        const newMsg = {
            id: Date.now(),
            senderId: currentUser._id,
            text: message,
            timestamp: new Date().toISOString()
        };

        const updated = [...messages, newMsg];
        setMessages(updated);
        localStorage.setItem(chatKey, JSON.stringify(updated));
        setMessage('');
        
        // Trigger storage event for same tab
        window.dispatchEvent(new Event('storage'));
    };

    if (isMinimized) {
        return (
            <motion.div 
                layout
                className="w-64 bg-primary text-white p-3 rounded-t-xl cursor-pointer flex items-center justify-between shadow-lg"
                onClick={() => setIsMinimized(false)}
            >
                <div className="flex items-center gap-2 truncate">
                    <FiMessageSquare />
                    <span className="text-xs font-bold truncate">{targetUser.name}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onClose(); }}><FiX /></button>
            </motion.div>
        );
    }

    return (
        <motion.div 
            layout
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-80 h-96 bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
        >
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between cursor-move">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">
                        {targetUser.avatar ? <img src={targetUser.avatar} className="w-full h-full rounded-full" /> : targetUser.name.charAt(0)}
                    </div>
                    <span className="text-xs font-bold">{targetUser.name}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsMinimized(true)} className="hover:text-primary"><FiMinus /></button>
                    <button onClick={onClose} className="hover:text-red-500"><FiX /></button>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50 dark:bg-black/20">
                {messages.length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-[10px] uppercase font-bold tracking-widest">No history on this device</div>
                )}
                {messages.map(m => {
                    const isMe = m.senderId === currentUser._id;
                    return (
                        <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-2 rounded-xl text-xs ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-tl-none'}`}>
                                {m.text}
                            </div>
                        </div>
                    );
                })}
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-dark-card flex gap-2">
                <input 
                    type="text" 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-100 dark:bg-white/5 border-none rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary outline-none"
                />
                <button type="submit" className="p-2 bg-primary text-white rounded-lg hover:bg-indigo-600 transition-colors">
                    <FiSend size={14} />
                </button>
            </form>
        </motion.div>
    );
};

const FloatingChatManager = () => {
    const [openChats, setOpenChats] = useState([]);

    useEffect(() => {
        const handleOpenDM = (e) => {
            const targetUser = e.detail;
            if (!openChats.find(c => c._id === targetUser._id)) {
                setOpenChats(prev => [...prev, targetUser].slice(-3)); // Limit to 3 open chats
            }
        };
        window.addEventListener('open_dm', handleOpenDM);
        return () => window.removeEventListener('open_dm', handleOpenDM);
    }, [openChats]);

    return (
        <div className="fixed bottom-0 right-20 z-[200] flex flex-row-reverse items-end gap-4 pointer-events-none">
            <div className="flex flex-row-reverse gap-4 pointer-events-auto">
                {openChats.map(u => (
                    <DraggableChatWindow 
                        key={u._id} 
                        targetUser={u} 
                        onClose={() => setOpenChats(prev => prev.filter(c => c._id !== u._id))}
                    />
                ))}
            </div>
        </div>
    );
};

export default FloatingChatManager;