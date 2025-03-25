// src/App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MenuScreen from './src/components/Menu'; // Import main app screen
import OrdersList from './src/components/OrdersList'; // Import orders list screen
import Header from './src/components/Header'; // Import header component
import { enableScreens } from 'react-native-screens';
import SplashScreen from './src/components/Splash';
import PreOrderList from './src/components/PreOrderList';

enableScreens(); // Call this before your navigation container

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="PreOrdersList">
      <Stack.Screen
          name="SplashScreen"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MenuScreen"
          component={MenuScreen}
          options={{
            header: ({ navigation }) => <Header navigation={navigation} />,
          }}
        />
        <Stack.Screen
          name="OrdersList"
          component={OrdersList}
          options={{
            header: ({ navigation }) => <Header navigation={navigation} />, // Custom header for OrdersList
          }}
        />
          <Stack.Screen
          name="PreOrdersList"
          component={PreOrderList}
          options={{
            header: ({ navigation }) => <Header navigation={navigation} />, // Custom header for OrdersList
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
