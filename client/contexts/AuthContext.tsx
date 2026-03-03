import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User,
    updateProfile,
} from 'firebase/auth';
import { firebaseAuth } from '../services/firebase';
import * as api from '../services/api';

export type UserRole = 'team_lead' | 'developer' | 'tester';

interface AuthUser {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
}

interface AuthContextType {
    user: AuthUser | null;
    firebaseUser: User | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, displayName: string, role: UserRole) => Promise<void>;
    logout: () => Promise<void>;
    isTeamLead: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
            if (fbUser) {
                setFirebaseUser(fbUser);

                // Use cached role as optimistic initial value
                const cachedRole = localStorage.getItem(`aiva_role_${fbUser.uid}`) as UserRole;

                setUser({
                    uid: fbUser.uid,
                    email: fbUser.email || '',
                    displayName: fbUser.displayName || '',
                    role: cachedRole || 'developer',
                });

                // Fetch the real role from the backend and update
                try {
                    const profile = await api.getMyProfile();
                    const backendRole = (profile.role as UserRole) || 'developer';
                    localStorage.setItem(`aiva_role_${fbUser.uid}`, backendRole);
                    setUser({
                        uid: fbUser.uid,
                        email: fbUser.email || '',
                        displayName: fbUser.displayName || profile.displayName || '',
                        role: backendRole,
                    });
                } catch (err) {
                    console.warn('Failed to fetch role from backend, using cached role:', err);
                }
            } else {
                setFirebaseUser(null);
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        setError(null);
        try {
            await signInWithEmailAndPassword(firebaseAuth, email, password);
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const register = async (email: string, password: string, displayName: string, role: UserRole) => {
        setError(null);
        try {
            const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
            await updateProfile(credential.user, { displayName });

            // Store role in localStorage cache
            localStorage.setItem(`aiva_role_${credential.user.uid}`, role);

            // Set role in backend (Firestore)
            try {
                await api.setUserRole(credential.user.uid, role);
            } catch (apiErr) {
                console.warn('Failed to set role in backend (will retry on next login):', apiErr);
            }

            setUser({
                uid: credential.user.uid,
                email: credential.user.email || '',
                displayName,
                role,
            });
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const logout = async () => {
        await signOut(firebaseAuth);
        setUser(null);
        setFirebaseUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                firebaseUser,
                loading,
                error,
                login,
                register,
                logout,
                isTeamLead: user?.role === 'team_lead',
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
