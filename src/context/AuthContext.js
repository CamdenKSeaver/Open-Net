import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            const userData = await AsyncStorage.getItem('userData');
            const authToken = await AsyncStorage.getItem('authToken');
            if (userData && authToken) {
                setUser(JSON.parse(userData));
            }
            else {await AsyncStorage.removeItem('userData');
                await AsyncStorage.removeItem('authToken');
                setUser(null);}

        } catch (error) {
            console.error('Error loading user:', error); 
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const refreshUser = async () => {
        await checkUser();
    };

    return (
        <AuthContext.Provider value={{ user, loading, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};