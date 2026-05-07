import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from '../screens/LoginScreen';
import AdminDashboard from '../screens/AdminDashboard';
import UserManagement from '../screens/UserManagement';
import UserDashboard from '../screens/UserDashboard';
import { theme } from '../styles/theme';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: theme.colors.background }
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="UserManagement" component={UserManagement} />
        <Stack.Screen name="UserDashboard" component={UserDashboard} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
