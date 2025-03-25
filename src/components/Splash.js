// src/components/SplashScreen.js
import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';

const SplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current; // Initial value for opacity: 0

  useEffect(() => {
    // Start the animation
    Animated.timing(fadeAnim, {
      toValue: 1, // Animate to opacity: 1
      duration: 2000, // Duration of the animation
      useNativeDriver: true, // Use native driver for better performance
    }).start();

    // Navigate to the main app after 3 seconds
    const timer = setTimeout(() => {
      navigation.replace('MenuScreen'); // Replace current screen with MenuScreen
    }, 3000);

    return () => clearTimeout(timer); // Cleanup the timer on unmount
  }, [fadeAnim, navigation]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim }}>
        <Image
          source={require('./images/ankapur_chicken_logo.webp')} // Adjust the path as needed
          style={styles.image}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5fcff',
  },
  image: {
    width: 300, // Set the desired width
    height: 200, // Set height to maintain aspect ratio
    resizeMode: 'contain',
    marginBottom: 20,
  },
});

export default SplashScreen;
