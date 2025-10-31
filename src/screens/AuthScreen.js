import React, { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
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






    return(
        <KeyboardAvoidingView
            style={StyleSheet.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView currentContainerStyle = {styles.scrollContainer}>
            {/*Title Section*/}
            <View style = {styles.header}>
                <View style ={styles.logoContainer}>
                    {/*TODO: lets get like an actual logo I have defaulted it for now*/}
                    <MaterialIcons name="sports-volleyball" size={40} color="#FB923C" />
                </View>
                <Text style={styles.appName}>OpenNet</Text>
            </View>

            {/*Forms*/}

            <View style = {styles.formContainer}>
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


            <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
            </View>

            <View style = {styles.inputContainter}>
                {!isLogin && (
                    <DoneTextInput
                        style = {styles.input}
                        placeholder = "Name"
                        value={formData.name}
                        onChangeText = {(value) => handleInputChange('name',value)}
                        autoCapitalize= "words"
                        editable = {!isLoading}
                        maxLength = {30}

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
        paddingVeritcal:12,
        alignItems: 'center',
        borderRadius: 12
    },
    toggleText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    toggleButtonActive: {
        backgroundColor: '#FFFFFF',
    },
    toggleTextActive: {
        color: '#111827',
    },
});

export default AuthScreen;