import React from 'react';
import { Text, View } from 'react-native';

export interface UserGreetingProps {
  name: string;
}

export function UserGreeting({ name }: UserGreetingProps) {
  return (
    <View>
      <Text>Hola, {name}!</Text>
    </View>
  );
}
