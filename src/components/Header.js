import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import request from 'superagent'; // Import your request utility for API calls
import Icon from 'react-native-vector-icons/MaterialIcons';
const Header = ({navigation}) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [ordersCount, setOrdersCount] = useState(0); // State to hold orders count
  const menuItems = [
    {id: '1', title: 'Menu', icon: 'restaurant-menu', screen: 'MenuScreen'},
    {id: '2', title: 'Pre-Orders', icon: 'list-alt', screen: 'PreOrdersList'},
    {id: '3', title: 'Products', icon: 'inventory', screen: null},
    {id: '4', title: 'User Management', icon: 'people', screen: null},
    {id: '5', title: 'Inventory', icon: 'store', screen: null},
    {id: '6', title: 'Sales Reports', icon: 'bar-chart', screen: null},
    {id: '7', title: 'Settings', icon: 'settings', screen: null},
    {id: '8', title: 'Analytics', icon: 'analytics', screen: null},
    {id: '9', title: 'Feedback', icon: 'feedback', screen: null},
    {id: '10', title: 'Customer Support', icon: 'support', screen: null},
  ];
  const openDrawer = () => {
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  const fetchOrdersCount = async id => {
    try {
      const response = await request.get(
        `http://192.168.10.40:8000/ordersAdminMobileByIDCount/${id}`,
      );
      console.log(response.body); // Adjust the endpoint as needed
      if (response.body.ordersCount) {
        setOrdersCount(response.body.ordersCount);
      }
    } catch (error) {
      console.log('Error fetching orders count:', error);
    }
  };

  const handleLogin = async () => {
    if (email && password) {
      try {
        const response = await request.post(
          `http://192.168.10.40:8000/login?email=${email}&password=${password}`,
        );
        if (response.body.token) {
          await AsyncStorage.setItem('token', response.body.token);
          await AsyncStorage.setItem('id', String(response.body.id));
          Alert.alert('Success', 'Logged in successfully!');
          fetchOrdersCount(await AsyncStorage.getItem('id')); // Fetch orders count after login
          setLoginModalVisible(false);
          setIsLoggedIn(true);
          setEmail('');
          setPassword('');
          navigation.replace('MenuScreen');
        } else {
          Alert.alert('Error', 'Invalid credentials.');
        }
      } catch (error) {
        Alert.alert('Error', 'Login failed. Please try again.');
      }
    } else {
      Alert.alert('Error', 'Please fill in all fields.');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('id');
    setIsLoggedIn(false);
    Alert.alert('Success', 'Logged out successfully.');
    setTimeout(() => {
      navigation.replace('SplashScreen');
    }, 3000);
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem('token');
      const id = await AsyncStorage.getItem('id');
      if (token && id) {
        setIsLoggedIn(true);
        fetchOrdersCount(id); // Fetch orders count if already logged in
      }
    };

    checkLoginStatus();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
          <Text style={styles.menuButtonText}>☰</Text>
        </TouchableOpacity>
        <Image
          source={require('./images/ankapur_chicken_logo.webp')}
          style={styles.logo}
          resizeMode="contain"
        />
        {isLoggedIn && (
          <Text style={styles.ordersCountText}>
            Active Orders:{' '}
            <Text style={styles.ordersCountNumber}>{ordersCount}</Text>
          </Text>
        )}
      </View>
      {/* Login Modal */}
      <Modal
        transparent={true}
        visible={loginModalVisible}
        animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.loginText}>Log In</Text>
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCorrect={false}
              style={styles.input}
              autoCapitalize="none"
            />
            <View style={styles.loginPopUpBottomButtons}>
              <TouchableOpacity
                onPress={() => setLoginModalVisible(false)}
                style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleLogin}
                style={styles.loginButton}>
                <Text style={styles.loginButtonText}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Menu Drawer */}
      <Modal visible={drawerVisible} transparent animationType="left">
        <View style={styles.drawerContainer}>
          <View style={styles.drawerContent}>
            <View style={styles.drawerHeader}>
              <Image
                source={require('./images/ankapur_chicken_logo.webp')}
                style={styles.drawerLogo}
              />
              <TouchableOpacity
                onPress={closeDrawer}
                style={styles.closeButton}>
                <Image
                  source={require('./images/cancel_icon.png')}
                  style={styles.cancelIcon}
                />
              </TouchableOpacity>
            </View>

            <FlatList
              data={menuItems}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    if (item.screen) {
                      navigation.replace(item.screen);
                    }
                    closeDrawer();
                  }}>
                  <Icon name={item.icon} size={20} color="#180039FF" />
                  <Text style={styles.menuItemText}>{item.title}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={item => item.id}
            />

            <View style={styles.authContainer}>
              <TouchableOpacity
                onPress={() => {
                  if (isLoggedIn) {
                    // Open confirmation modal for logout
                    Alert.alert('Logout', 'Are you sure you want to logout?', [
                      {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: closeDrawer,
                      },
                      {text: 'Logout', onPress: handleLogout},
                    ]);
                  } else {
                    setLoginModalVisible(true);
                  }
                  closeDrawer();
                }}>
                <Text style={styles.authText}>
                  {isLoggedIn ? 'Logout' : 'Login'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    height: 80,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'start',
    padding: 10,
    backgroundColor: '#300172FF',
  },
  logo: {
    backgroundColor: 'white',
    borderRadius: 5,
    width: 180,
    height: 60,
  },
  authContainer: {
    marginTop: 'auto',
    padding: 20,
    alignItems: 'center', // Center items horizontally
    justifyContent: 'center',
  },
  authText: {
    fontSize: 18,
    color: '#300172FF',
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 10,
  },
  menuButtonText: {
    color: '#ffffff',
    fontSize: 24,
  },

  ordersCountText: {
    marginLeft: 18,
    fontSize: 16, // Regular font size for the text
    fontWeight: '600', // Semi-bold for emphasis on "Total Orders"
    color: '#ffffff', // Neutral color for the text
  },
  ordersCountNumber: {
    fontSize: 20, // Larger font size for the order number
    fontWeight: 'bold', // Bold to make the number stand out
    color: '#ff6347', // Use a bright color like tomato for the number
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  drawerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: '70%',
    backgroundColor: '#ffffff',
    borderRightColor: '#cccccc',
    borderRightWidth: 1,
    zIndex: 1000,
  },
  drawerContent: {
    padding: 10,
  },
  drawerTitle: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
  },

  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  drawerLogo: {
    width: 200,
    height: 80,
    alignSelf: 'center',
  },
  closeButton: {
    padding: 10,
  },

  closeButtonText: {
    color: '#fff', // Set text color
    fontSize: 16, // Adjust font size
    textAlign: 'center', // Center the text
  },

  cancelIcon: {
    color: '#300172FF',
    width: 15,
    height: 15,
  },

  input: {
    height: 40,
    borderColor: '#cccccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    borderRadius: 5,
    width: '100%',
  },
  loginText: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#300172FF',
    textAlign: 'center',
    marginBottom: 5,
  },
  loginPopUpBottomButtons: {
    flexDirection: 'row', // To align buttons horizontally
    justifyContent: 'center', // To center buttons horizontally
    alignItems: 'center', // To center buttons vertically within the container
  },
  loginButton: {
    marginRight: 10, // Add margin if you want space between buttons
    padding: 10,
    backgroundColor: '#300172FF',
    borderRadius: 5,
  },
  cancelButton: {
    padding: 10,
    borderRadius: 5,
  },
  loginButtonText: {
    color: 'white',
  },
  cancelButtonText: {
    color: '#300172FF',
  },
  menuItem: {
    flexDirection: 'row', // Align icon and text in the same row
    alignItems: 'center', // Center icon and text vertically
    padding: 14,
    borderBottomColor: '#E4E2E2FF',
    borderBottomWidth: 1,
  },
  menuItemText: {
    marginLeft: 10, // Space between icon and text
    fontSize: 15,
    color: '#180039FF',
  },
});
export default Header;
