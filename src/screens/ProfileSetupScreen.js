import DoneTextInput from '../components/DoneTextInput';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView
} from 'react-native';


const VOLLEYBALL_POSITIONS = [
    'Outside Hitter',
    'Middle Blocker',
    'Opposite Hitter',
    'Setter',
    'Libero',
    'Defensive Specialist'
];
//TODO
//Prolly get some icons, draw them in or art class or something
const COURT_TYPES = [
    { id: 'beach', label: 'Beach', icon: '' },
    { id: 'indoor', label: 'Indoor', icon: '' },
    { id: 'grass', label: 'Grass', icon: '' }
];
const ProfileSetupScreen = ({onProfileComplete}) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    const renderStep1 = () => (
        <View style = {styles.stepContainer}>
            <Text style = {styles.stepTitle}>
                Basic Info
            </Text>

            <View style = {styles.form}>
                <Text style =  {styles.label}> Full Name</Text>
                <DoneTextInput
                    style = {styles.input}
                    value = { name}
                    onChangeText= {setName}
                    placeholder="Enter full name"
                    autoCapitalize= "words"
                    editable = { !loading}
                    maxLength= {50}
                />
                <Text style={styles.label}>Age</Text>
                <DoneTextInput
                    style={styles.input}
                    value={age}
                    
                    placeholder="Enter your age"
                    keyboardType="number-pad"
                    maxLength={3}
                    editable={!loading}
                />

                <Text style={styles.label}>Phone Number</Text>
                <DoneTextInput
                    style = { styles.input}
                    value = {phoneNumber}
                    placeholder ="(123) 456-7890"
                    keyboardType = "phone-pad"
                    maxLength = {14}
                    editable= {!loading}
                />
            </View>

        </View>
    );

    return (
        <ScrollView contentContainerStyle = {styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            {currentStep === 1 && renderStep1()}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    stepContainer: {
        marginBottom: 32,
    },
    stepTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 8,
    },
    form: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#FFFFFF',
        color: '#111827',
        minHeight: 50,
    },
    content: {
        padding: 24,
        minHeight: '100%',
    },
})

export default ProfileSetupScreen;