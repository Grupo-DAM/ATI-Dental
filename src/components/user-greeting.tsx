import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

export interface UserGreetingProps {
  name: string;
}

export function UserGreeting({ name }: UserGreetingProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.greetingText}>Hola, {name}!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});

