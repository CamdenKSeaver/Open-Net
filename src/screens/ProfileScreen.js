import React from 'react';
import { View, Text, StyleSheet,TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import {supabase} from '../../supabaseConfig';
const ProfileScreen = () => {
    const { user } = useAuth();

const handleSignOut = async () => {
    try {
    const { error } = await supabase.auth.signOut();
    if (error) 
        throw error;
        Alert.alert('Signed out', 'You have been signed out successfully.');
    } 
    catch (error) {
        Alert.alert('Error', error.message);
    }
};
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile Screen</Text>
       <View style={styles.container}>
            {user ? (
              <>
                <Text style={styles.title}>Welcome to OpenNet!</Text>
                <Text style={styles.email}>Signed in as: {user.email}</Text>
      
                <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                  <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.email}>No user signed in.</Text>
            )}
          </View>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#111827',
    },
    email: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 30,
    },
    signOutButton: {
        backgroundColor: '#FB923C',
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 12,
    },
    signOutText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 16,
    },
        text: {
        fontSize: 20,
        color: '#111827',
    },
});

export default ProfileScreen;
