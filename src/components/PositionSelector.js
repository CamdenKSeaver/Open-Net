// src/components/PositionSelector.js
import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const POSITIONS = [
  'Setter',
  'Outside Hitter',
  'Middle Blocker',
  'Opposite',
  'Libero',
  'Defensive Specialist',
];

const PositionSelector = ({ visible, currentPosition, onSelect, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modal} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Position</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.positionList}>
            {POSITIONS.map((position) => (
              <TouchableOpacity
                key={position}
                style={[
                  styles.positionOption,
                  currentPosition === position && styles.selectedPosition,
                ]}
                onPress={() => onSelect(position)}
              >
                <Text
                  style={[
                    styles.positionText,
                    currentPosition === position && styles.selectedText,
                  ]}
                >
                  {position}
                </Text>
                {currentPosition === position && (
                  <MaterialIcons name="check" size={20} color="#FB923C" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  positionList: {
    padding: 16,
  },
  positionOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  selectedPosition: {
    backgroundColor: '#FFF7ED',
    borderWidth: 2,
    borderColor: '#FB923C',
  },
  positionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  selectedText: {
    color: '#FB923C',
    fontWeight: '600',
  },
});

export default PositionSelector;