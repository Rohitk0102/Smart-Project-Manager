import { createContext, useState, useEffect, useContext } from 'react';
import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/react';
import api from '../api';
import { setClerkTokenGetter } from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const { getToken, isLoaded, isSignedIn, signOut } = useClerkAuth();
    const { user: clerkUser } = useClerkUser();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isLoaded) {
            return undefined;
        }

        setClerkTokenGetter(isSignedIn ? getToken : null);

        return () => {
            setClerkTokenGetter(null);
        };
    }, [getToken, isLoaded, isSignedIn]);

    useEffect(() => {
        const syncUser = async () => {
            if (!isLoaded) {
                return;
            }

            if (!isSignedIn || !clerkUser) {
                setUser(null);
                setError('');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError('');

            try {
                const { data } = await api.get('/auth/profile');
                setUser(data);
            } catch (syncError) {
                console.error('Clerk user sync failed', syncError);
                setUser(null);
                setError(syncError.response?.data?.message || 'Failed to sync Clerk session');
            } finally {
                setLoading(false);
            }
        };

        syncUser();
    }, [
        clerkUser?.id,
        isLoaded,
        isSignedIn,
    ]);

    const updateUser = (userData) => {
        setUser(userData);
    };

    const logout = () => signOut({ redirectUrl: '/login' });

    return (
        <AuthContext.Provider value={{ user, logout, loading, updateUser, error, isSignedIn }}>
            {children}
        </AuthContext.Provider>
    );
};
