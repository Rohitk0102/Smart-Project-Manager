import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { logout } = useAuth();
    const location = useLocation();

    return (
        <aside className="w-16 md:w-64 bg-dark-card border-r border-slate-800 flex flex-col transition-all duration-300 h-screen sticky top-0">
            <div className="h-16 flex items-center justify-center md:justify-start px-6 border-b border-slate-800">
                <div className="w-8 h-8 bg-gradient-to-tr from-primary to-purple-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">P</div>
                <span className="ml-3 font-bold text-lg tracking-tight hidden md:block">ProdMax</span>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                <Link to="/" className={`p-3 rounded-xl cursor-pointer flex items-center transition-all duration-200 group ${location.pathname === '/' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                    <div className={`w-5 h-5 rounded-md ${location.pathname === '/' ? 'bg-primary' : 'bg-slate-700 group-hover:bg-slate-600'} transition-colors`}></div>
                    <span className="ml-3 font-medium hidden md:block">Dashboard</span>
                </Link>
                <Link to="/my-tasks" className={`p-3 rounded-xl cursor-pointer flex items-center transition-all duration-200 group ${location.pathname === '/my-tasks' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                    <div className={`w-5 h-5 rounded-md ${location.pathname === '/my-tasks' ? 'bg-primary' : 'bg-slate-700 group-hover:bg-slate-600'} transition-colors`}></div>
                    <span className="ml-3 font-medium hidden md:block">My Tasks</span>
                </Link>
                <Link to="/calendar" className={`p-3 rounded-xl cursor-pointer flex items-center transition-all duration-200 group ${location.pathname === '/calendar' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                    <div className={`w-5 h-5 rounded-md ${location.pathname === '/calendar' ? 'bg-primary' : 'bg-slate-700 group-hover:bg-slate-600'} transition-colors`}></div>
                    <span className="ml-3 font-medium hidden md:block">Calendar</span>
                </Link>
                {['Team', 'Settings'].map((item) => (
                    <div key={item} className={`p-3 rounded-xl cursor-pointer flex items-center transition-all duration-200 group text-slate-400 hover:bg-slate-800 hover:text-white`}>
                        <div className={`w-5 h-5 rounded-md bg-slate-700 group-hover:bg-slate-600 transition-colors`}></div>
                        <span className="ml-3 font-medium hidden md:block">{item}</span>
                    </div>
                ))}
            </nav>
            <div className="p-4 border-t border-slate-800">
                <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl mb-4 hidden md:block border border-slate-700">
                    <h4 className="text-sm font-semibold text-white">Pro Plan</h4>
                    <p className="text-xs text-slate-400 mt-1">Unlock AI Generator</p>
                    <button className="mt-3 w-full py-2 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-semibold rounded-lg transition-colors border border-primary/20">Upgrade</button>
                </div>
                <div onClick={logout} className="p-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 text-slate-400 cursor-pointer flex items-center transition-colors">
                    <div className="w-5 h-5 rounded-md bg-slate-700 group-hover:bg-red-500/20"></div>
                    <span className="ml-3 font-medium hidden md:block">Logout</span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
