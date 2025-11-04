import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EventDetailScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Event Detail Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  text: {
    fontSize: 20,
    color: '#111827',
  },
});

export default EventDetailScreen;
