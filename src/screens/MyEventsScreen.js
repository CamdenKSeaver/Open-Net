
import { View, Text, StyleSheet } from 'react-native';

const MyEventsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>My Events Screen</Text>
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

export default MyEventsScreen;
