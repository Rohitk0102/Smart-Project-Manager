import Sidebar from './Sidebar';

const Layout = ({ children }) => {
    return (
        <div className="flex h-screen bg-dark-bg text-white overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden bg-[#0a0f1c]">
                {children}
            </main>
        </div>
    );
};

export default Layout;
