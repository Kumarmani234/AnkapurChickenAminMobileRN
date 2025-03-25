import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome'; // Import the icons
import request from 'superagent';

const FooterMenu = ({navigation}) => {
  const [userId, setUserId] = useState(null);   
  const [orderCounts, setOrderCounts] = useState({
    All: 0,
  });

  // Function to fetch order counts
  const fetchOrderCounts = async () => {
    try {
      const userId = await AsyncStorage.getItem('id');
      if (!userId) {
        return;
      }

      const response = await request.get(
        `http://192.168.10.40:8000/ordersListAdminMobileByIDAllCounts/${userId}`,
      );

      if (response.body) {
        setOrderCounts({
          All: response.body.All,
        });
      }
    } catch (error) {
      console.log('Error fetching order counts:', error);
    }
  };

  // Fetch counts on component mount
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const id = await AsyncStorage.getItem('id');
        setUserId(id); // Store user ID in state
      } catch (error) {
        console.log('Error fetching user ID:', error);
      }
    };

    fetchUserId();
    fetchOrderCounts();
  }, []);

  return (
    <View style={styles.footer}>
      {/* Menu Button */}
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigation.replace('MenuScreen')}>
        <Icon name="cutlery" size={20} color="#fff" />
        <Text style={styles.menuText}>Menu</Text>
      </TouchableOpacity>

      {/* Orders Button */}
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigation.replace('OrdersList')}>
        <View style={styles.orderCountsContainer}>
          <Text style={styles.menuText}>Orders</Text>
          {userId && <Text style={styles.countText}>({orderCounts.All})</Text>}
        </View>
      </TouchableOpacity>

      {/* Settings Button (No Action) */}
      <TouchableOpacity style={styles.menuItem}>
        <Icon name="cogs" size={20} color="#fff" />
        <Text style={styles.menuText}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#300172FF',
    paddingVertical: 12,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5, // For Android shadow
  },
  menuItem: {
    alignItems: 'center',
    padding: 5,
    flexDirection: 'row', // Align icon and text horizontally
    justifyContent: 'center', // Center the items within the menu item
  },
  menuText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 5, // Add space between the icon and the text
    fontWeight: '600',
  },
  countText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  orderCountsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default FooterMenu;
