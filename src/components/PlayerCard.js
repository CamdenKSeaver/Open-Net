// src/components/PlayerCard.js
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const PlayerCard = ({ 
  player, 
  showPosition = true,
  canChangePosition = false,
  onChangePosition 
}) => {
  return (
    <View style={styles.container}>
      {/* Avatar */}
      {player.profile_image_url ? (
        <Image 
          source={{ uri: player.profile_image_url }} 
          style={styles.avatar}
        />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <MaterialIcons name="person" size={28} color="#9CA3AF" />
        </View>
      )}

      {/* Player Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{player.name}</Text>
        {showPosition && (
          <View style={styles.positionRow}>
            <MaterialIcons name="sports-volleyball" size={14} color="#6B7280" />
            <Text style={styles.position}>{player.position || 'No position set'}</Text>
          </View>
        )}
        {player.experience_level && (
          <Text style={styles.experience}>{player.experience_level}</Text>
        )}
      </View>

      {/* Change Position Button */}
      {canChangePosition && onChangePosition && (
        <TouchableOpacity 
          style={styles.changeButton}
          onPress={onChangePosition}
        >
          <MaterialIcons name="edit" size={18} color="#FB923C" />
          <Text style={styles.changeButtonText}>Change</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  positionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  position: {
    fontSize: 14,
    color: '#6B7280',
  },
  experience: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FB923C',
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FB923C',
  },
});

export default PlayerCard;