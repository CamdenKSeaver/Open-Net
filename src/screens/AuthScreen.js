import React, { useState } from 'react';
import { 
    KeyboardAvoidingView, 
    ScrollView, 
    View,
    StyleSheet,
    Platform,
    Text,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DoneTextInput from '../components/DoneTextInput';
const AuthScreen = () => {
    const [isLogin,setIsLogin] = useState(true);
    const [loading,setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleEmailAuth = () => {
        alert('Got to auth');
    };




    return(
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle  = {styles.scrollContainer}>
            {/*Title Section*/}
            <View style = {styles.header}>
                <View style ={styles.logoContainer}>
                    {/*TODO: lets get like an actual logo I have defaulted it for now*/}
                    <MaterialIcons name="sports-volleyball" size={40} color="#FB923C" />
                </View>
                <Text style={styles.appName}>OpenNet</Text>
                <Text style={styles.tagline}>Find your perfect volleyball community</Text>
            </View>

            {/*Forms*/}

            <View style = {styles.formContainer}>
                <View style ={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleButton, isLogin && styles.toggleButtonActive]}
                        onPress={() => setIsLogin(true)}
                    >
                        <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>
                            Login
                        </Text>
                        
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleButton, !isLogin && styles.toggleButtonActive]}
                        onPress={() => setIsLogin(false)}
                    >
                        <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>
                            Sign Up
                        </Text>
                        
                    </TouchableOpacity>
                </View>
            

            {/*TODO: get ios and google login setup*/}

            <View style = {styles.inputContainer}>
                {!isLogin && (
                    <DoneTextInput
                        style = {styles.input}
                        placeholder = "Name"
                        value={formData.name}
                        onChangeText = {(value) => handleInputChange('name',value)}
                        autoCapitalize= "words"
                        editable = {!loading}
                        maxLength = {30}
                        placeholderTextColor="#6B7280"

                    />
                )}
                <DoneTextInput
                    style={styles.input}
                    placeholder="Email Address"
                    value={formData.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                    maxLength={100}
                    placeholderTextColor="#6B7280"
                />
                <View style={styles.passwordContainer}>
                <DoneTextInput
                    style={styles.passwordInput}
                    placeholder="Password"
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                    maxLength={50}
                    placeholderTextColor="#6B7280"
                />
                <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                >
                    <MaterialIcons 
                    name={showPassword ? "visibility-off" : "visibility"} 
                    size={20} 
                    color="#9CA3AF" 
                    />
                </TouchableOpacity>
                </View>

                {!isLogin && (
                <DoneTextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChangeText={(value) => handleInputChange('confirmPassword', value)}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                    maxLength={50}
                    placeholderTextColor="#6B7280"
                />
                )}

                <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleEmailAuth}
                disabled={loading}
                >
                {loading ? (<ActivityIndicator color="#FFFFFF" size="small" />) : 
                (
                    <Text style={styles.submitButtonText}>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    </Text>
                )}
                </TouchableOpacity>

                    
                
            </View>

            </View>
            </ScrollView>

        </KeyboardAvoidingView>
    )
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FB923C',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    toggleButton:{
        flex:1,
        paddingVertical:12,
        alignItems: 'center',
        borderRadius: 12
    },
    toggleText: {
        fontSize: 16,
        fontWeight:'600',
        color: '#6B7280',
    },
    toggleButtonActive: {
        backgroundColor: '#FFFFFF',
    },
    toggleTextActive: {
        color: '#111827',
    },
    appName: {
        fontSize: 36,
        fontWeight: 'bold',
        color:'#FFFFFF',
        marginBottom: 8,
    },
    logoContainer: {
        width:80,
        height: 80,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        alignItems:'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    formContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius:24,
        padding: 32,
    },
    inputContainer: {
        gap: 16,
    },
    eyeIcon: {
        position: 'absolute',
        right: 16,
        top: 16,
        padding: 4,
    },
    passwordInput: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        paddingVertical:16,
        paddingHorizontal:24,
        paddingRight: 56,
        fontSize:16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius:16,
        paddingVertical: 16,
        paddingHorizontal: 24,
        fontSize: 16,
    },
    passwordContainer: {
        position:'relative',
    },
    submitButton: {
        backgroundColor: '#FB923C',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    tagline: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        padding: 4,
        marginBottom: 24,
    },
});

export default AuthScreen;