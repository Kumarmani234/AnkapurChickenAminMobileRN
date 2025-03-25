import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Modal,
  TextInput,
  Image,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import request from 'superagent';
import FooterMenu from './Footer';

const OrderList = ({navigation}) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPL, setLoadingPL] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editModalVisiblePL, setEditModalVisiblePL] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [quantities, setQuantities] = useState({});
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('Active');
  const [orderCounts, setOrderCounts] = useState({
    All: 0,
    Active: 0,
    Complete: 0,
  });
  const [paginationMeta, setPaginationMeta] = useState({
    current_page: 1,
    last_page: 0,
    total: 0,
  });
  const [mobileNumbers, setMobileNumbers] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // To store the search term

  const filteredNumbers = mobileNumbers.filter(item => {
    // Ensure mobileNumber is a string, and remove non-numeric characters
    const cleanMobileNumber = (item.mobileNumber || '')
      .toString()
      .replace(/[^0-9]/g, '') // Remove non-numeric characters
      .toLowerCase();
    const cleanSearchTerm = (searchTerm || '')
      .toString()
      .replace(/[^0-9a-zA-Z]/g, '') // Clean the search term similarly
      .toLowerCase();

    // Return whether the clean mobile number or name contains the search term
    return (
      cleanMobileNumber.includes(cleanSearchTerm) ||
      (item.name || '').toString().toLowerCase().includes(cleanSearchTerm)
    );
  });

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
    setSearchTerm('');
  };

  const handleSelectNumber = number => {
    setPhone(number);
    setSelectedNumber(number);
    setModalVisible(false);
  };

  useEffect(() => {
    fetchMobileNumbers();
    fetchOrderCounts();
    fetchOrderData(selectedFilter, paginationMeta.current_page);
    if (selectedNumber) {
      fetchCustomerData();
    }
  }, [selectedNumber, searchTerm]);

  const fetchCustomerData = async () => {
    const responseCustomerData = await request.get(
      `http://192.168.10.40:8000/getCustomerDetails?phone=${selectedNumber}`,
    );

    if (responseCustomerData.ok) {
      // Check if the response was successful
      const customerData = responseCustomerData.body;
      if (customerData && customerData.data) {
        const capitalize = str =>
          str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';

        const firstName = capitalize(customerData.data.CustomerFName);
        const address = capitalize(customerData.data.Delivery_Addresss);
        const lastName =
          customerData.data.CustomerLName &&
          !/[.,/]/.test(customerData.data.CustomerLName)
            ? capitalize(customerData.data.CustomerLName) // Capitalize last name
            : '';

        setCustomerName(firstName + ' ' + lastName);

        setEmail(
          customerData.data.Email ? customerData.data.Email.toLowerCase() : '',
        );
        setAddress(address);
      } else {
        console.log('No customer data found');
      }
    } else {
      console.log('Failed to fetch customer data');
    }
  };

  const fetchMobileNumbers = async () => {
    try {
      const url =
        searchTerm != null
          ? `http://192.168.10.40:8000/getMobileNumbers?searchTerm=${searchTerm}`
          : 'http://192.168.10.40:8000/getMobileNumbers'; // Use the base URL if no search term

      const response = await request.get(url); // Make the API request with the search term if available
      const data = response.body;

      if (data) {
        const formattedData = data.data.map(item => {
          // Ensure CustomerLName is properly handled
          const capitalize = str =>
            str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';

          // Capitalize first and last name
          const firstName = capitalize(item.CustomerFName);
          const lastName =
            item.CustomerLName && !/[.,/]/.test(item.CustomerLName)
              ? capitalize(item.CustomerLName) // Capitalize last name
              : ''; // If invalid, set last name to empty string

          return {
            name: firstName + ' ' + lastName, // Concatenate capitalized first and last name
            mobileNumber: item.CustPhoneNumber, // Ensure to use CustPhoneNumber here
          };
        });

        // If search term is provided, apply filtering on the client-side
        const filteredData = formattedData.filter(item => {
          // Clean both mobile number and search term for matching
          const cleanMobileNumber = item.mobileNumber
            .replace(/[^0-9]/g, '')
            .toLowerCase();
          const cleanSearchTerm = searchTerm
            .replace(/[^0-9a-zA-Z]/g, '')
            .toLowerCase();

          // Return whether the cleaned mobile number or name includes the search term
          return (
            cleanMobileNumber.includes(cleanSearchTerm) ||
            item.name.toLowerCase().includes(cleanSearchTerm)
          );
        });

        setMobileNumbers(filteredData); // Set the filtered data to the state
      } else {
        console.log('Failed to fetch mobile numbers');
      }
    } catch (error) {
      console.log('Error fetching mobile numbers:', error);
    }
  };

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
        // Use setState to update the orderCounts state
        setOrderCounts({
          All: response.body.All,
          Active: response.body.Active,
          Complete: response.body.Complete,
        });
      }
    } catch (error) {
      console.log('Error fetching order counts:', error);
    }
  };

  const fetchOrderData = async (type, page) => {
    try {
      const userId = await AsyncStorage.getItem('id');
      if (!userId) {
        Alert.alert('Not Logged In', 'Please log in to view the orders.', [
          {text: 'OK'},
        ]);
        setLoading(false);
      } else {
        try {
          let endpoint = '';
          if (type === 'All') {
            endpoint = `ordersListAdminMobileByIDAll/${userId}`;
          } else if (type === 'Active') {
            endpoint = `ordersListAdminMobileByID/${userId}`;
          } else if (type === 'Complete') {
            endpoint = `ordersListAdminMobileByIDComplete/${userId}`;
          }
          const response = await request.get(
            `http://192.168.10.40:8000/${endpoint}?page=${page}`,
          );

          const data = response.body;
          if (data && data.data) {
            setOrders(data.data); // Reset orders
            setPaginationMeta(data.meta);
          } else {
            console.warn('Empty data field in API response');
          }
        } catch (error) {
          console.log('Error fetching order data:', error);
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      console.log('Error fetching user ID:', error);
    }
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const renderOrder = ({item}) => {
    const totalQuantity = item.Orders.reduce(
      (total, product) => total + product.quantity,
      0,
    );
    const totalAmount = item.Orders.reduce(
      (total, product) => total + product.price * product.quantity,
      0,
    );
    const totalTax = item.Orders.reduce(
      (total, product) => total + (product.tax ? parseFloat(product.tax) : 0),
      0,
    );
    const totalDiscounts = item.Orders.reduce(
      (total, product) =>
        total + (product.discounts ? parseFloat(product.discounts) : 0),
      0,
    );
    const openEditModal = orderId => {
      const selectedOrderByID = orders.find(order => order.OrderId === orderId);
      if (selectedOrderByID) {
        setSelectedOrder(selectedOrderByID);
        setCustomerName(selectedOrderByID.CustomerName || '');
        setPhone(selectedOrderByID.Phone || '');
        setEmail(selectedOrderByID.Email || '');
        setAddress(selectedOrderByID.Address || '');
        setEditModalVisible(true);
      }
    };

    const formattedDate = formatDate(item.Date);

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderDetails}>
          <View style={styles.ordersListIDAndEdit}>
            <Text style={styles.orderIdText}>Order ID: {item.OrderId}</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => openEditModal(item.OrderId)}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.orderSubTextDate}>Date: {formattedDate}</Text>
          <Text style={styles.orderSubText}>
            Customer: {item.CustomerName || 'N/A'}
          </Text>
          <Text style={styles.orderSubText}>
            Mobile No: {item.Phone || 'N/A'}
          </Text>
        </View>
        {item.Orders.map((product, index) => (
          <View key={index} style={styles.productCard}>
            {product.image && (
              <Image
                style={styles.productImage}
                source={
                  product.image
                    ? {uri: `data:image/png;base64,${product.image}`}
                    : require('./images/ankapur_chicken_logo.webp') // Replace with the path to your default image
                }
              />
            )}
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.productName}</Text>
              <Text style={styles.productQuantity}>
                Qty: {product.quantity}
              </Text>
            </View>
            <View style={styles.qtyPrice}>
              <Text style={styles.productPrice}>
                ₹{product.price.toFixed(2)}
              </Text>
            </View>
          </View>
        ))}
        <View style={styles.totalDetails}>
          <Text style={styles.totalText}>Total Qty: {totalQuantity}</Text>
          <Text style={styles.totalText}>
            Total Tax: ₹{totalTax.toFixed(2)}
          </Text>
          <Text style={styles.totalText}>
            Total Discounts: ₹{totalDiscounts.toFixed(2)}
          </Text>
          <Text style={styles.totalBillText}>
            Bill Total: ₹{(totalAmount + totalTax - totalDiscounts).toFixed(2)}
          </Text>
        </View>
      </View>
    );
  };

  const handleUpdateOrder = async () => {
    const AdminId = await AsyncStorage.getItem('id'); // Get the admin ID from AsyncStorage
    if (!AdminId) {
      Alert.alert(
        'Login Required',
        'Admin login is required to update an order.',
      );
      return;
    }

    // Gather the selected products with their quantities
    const selectedItems = products
      .filter(item => quantities[item.ProductID] > 0) // Filter products based on quantity
      .map(item => ({
        ...item, // Include the original item properties
        price: item.Price, // Add price
        image: item.Image,
        title: item.ProductName,
        tax: item.Tax,
        discounts: item.Discounts,
      }));

    // Prepare the order data with the updated items
    const updatedOrderData = {
      AdminId: AdminId, // Use the fetched AdminId
      CustomerName: customerName ?? null, // Replace with dynamic customer data
      Email: email ?? null, // Replace with dynamic customer email
      Address: address ?? null, // Replace with dynamic customer address
      Phone: phone ?? null, // Replace with dynamic customer phone
      Orders: selectedItems.map(item => ({
        product_id: item.ProductID,
        product_name: item.title,
        quantity: quantities[item.ProductID],
        price: item.price,
        image_path: item.image,
        remarks: 'Normal',
        tax: item.tax,
        discounts: item.discounts,
      })),
    };

    try {
      const response = await request
        .put(
          `http://192.168.10.40:8000/updateOrderDetails/${AdminId}/${selectedOrder.OrderId}`,
        ) // Use the order ID in the URL
        .set('Content-Type', 'application/json') // Set headers
        .send(updatedOrderData); // Send the updated order data in the request body

      if (response.status === 200) {
        Alert.alert(
          'Order Updated',
          'Your order has been successfully updated!',
        );

        // Optionally update the UI or perform navigation
        setTimeout(() => {
          navigation.replace('OrdersList');
        }, 3000);
      } else {
        Alert.alert(
          'Error',
          'There was an issue updating the order. Please try again.',
        );
      }
    } catch (error) {
      console.log('Error updating order:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred while updating the order. Please try again.',
      );
    }
  };

  const getDishList = async () => {
    setEditModalVisible(false);
    try {
      const response = await request.get(
        'http://192.168.10.40:8000/getHNAnkapurProducts',
      );
      const rawData = response.body;

      if (
        Array.isArray(rawData) &&
        rawData.length > 0 &&
        Array.isArray(rawData[0])
      ) {
        const cleanedData = rawData[0].map(item => ({
          ProductID: item.ProductID?.trim() || 'No ID',
          ProductName: item.ProductName?.trim() || 'No Name',
          ShortDescription: item.ShortDescription?.trim() || 'No Description',
          LongDescription: item.LongDescription?.trim() || 'No Description',
          Price: parseFloat(item.Price) || 0,
          Available: item.Available?.trim() || 'No Available',
          Remarks: item.Remarks?.trim() || 'No Remarks',
          Quanity: item.Quanity?.trim() || 'N/A',
          CategoryID: item.CategoryID?.trim() || 'No Category',
          DishTypeID: item.DishTypeID?.trim() || 'No Type',
          Tax: parseFloat(item.Tax) || 0,
          Discounts: parseFloat(item.Discounts) || 0,
          Image: item.Image?.trim() || 'No Image',
          SIH: item.SIH?.trim() || 'N/A',
          KitchenDescription:
            item['Kitchen Description']?.trim() || 'No Description',
          RestCode: item.RestCode?.trim() || 'No Code',
        }));

        const sortedData = cleanedData.sort((a, b) => b.Price - a.Price);
        setProducts(sortedData);

        setQuantities(prevQuantities => {
          const initialQuantities = {...prevQuantities};
          sortedData.forEach(item => {
            if (!(item.ProductID in initialQuantities)) {
              initialQuantities[item.ProductID] = 0;
            }
          });
          return initialQuantities;
        });
      } else {
        Alert.alert(
          'Invalid response format',
          'The response is not in the expected format.',
        );
      }
    } catch (error) {
      console.log('Error fetching dishes data:', error);
    } finally {
      setLoadingPL(false);
    }
  };
  const toggleSelect = productId => {
    setQuantities(prevQuantities => ({
      ...prevQuantities,
      [productId]: prevQuantities[productId] > 0 ? 0 : 1,
    }));
  };

  const incrementQty = productID => {
    setQuantities(prevQuantities => ({
      ...prevQuantities,
      [productID]: prevQuantities[productID] + 1,
    }));
  };

  const decrementQty = productID => {
    setQuantities(prevQuantities => ({
      ...prevQuantities,
      [productID]:
        prevQuantities[productID] > 0 ? prevQuantities[productID] - 1 : 0,
    }));
  };
  const openPL = () => {
    getDishList();
    setEditModalVisiblePL(true);
  };
  const closePL = () => {
    // Reset all quantities to 0 instead of an empty object
    setQuantities(
      products.reduce((acc, product) => {
        acc[product.ProductID] = 0; // Reset each product's quantity to 0
        return acc;
      }, {}),
    );

    setEditModalVisiblePL(false);
    setEditModalVisible(true); // Show the modal again, if necessary
  };

  const closeEM = () => {
    setSelectedNumber('');
    setSelectedProducts([]);
    setEditModalVisible(false);
    setQuantities(
      products.reduce((acc, product) => {
        acc[product.ProductID] = 0; // Reset each product's quantity to 0
        return acc;
      }, {}),
    );
  };

  const addInExisitingOrder = async () => {
    const AdminId = await AsyncStorage.getItem('id'); // Get the admin ID from AsyncStorage
    if (!AdminId) {
      Alert.alert(
        'Login Required',
        'Admin login is required for placing an order.',
      );
      return;
    }

    // Gather the selected products with their quantities, names, and prices
    const selectedItems = products
      .filter(item => quantities[item.ProductID] > 0)
      .map(item => ({
        ProductID: item.ProductID,
        ProductName: item.ProductName,
        Price: item.Price,
        Image: item.Image,
        Quantity: quantities[item.ProductID], // Get the selected quantity
      }));

    if (selectedItems.length === 0) {
      Alert.alert(
        'No dish selected',
        'Please select at least one dish to update the order.',
      );
      return;
    }

    setSelectedProducts(selectedItems); // Set the selected products with additional details
    setEditModalVisiblePL(false);
    setEditModalVisible(true);
  };

  const renderItem = ({item}) => {
    const imageSource = item.Image
      ? {uri: `data:image/jpeg;base64,${item.Image}`}
      : require('./images/ankapur_chicken_logo.webp');
    const isOutOfStock = item.Available == '0';

    return (
      <View style={styles.productItem}>
        <View style={styles.imageContainer}>
          <Image source={imageSource} style={styles.productImagePL} />
          <TouchableOpacity
            style={styles.toggleSelectContainer}
            onPress={() => toggleSelect(item.ProductID)}>
            {quantities[item.ProductID] > 0 && (
              <Image
                source={require('./images/tick.png')}
                style={styles.tickMark}
              />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.productInfoCard}>
          <Text style={styles.productNamePL}>{item.ProductName}</Text>
          <Text
            style={[
              styles.availabilityText,
              {color: item.Available == 0 ? '#FF0000' : '#008000'},
            ]}>
            {item.Available == 0 ? 'Out of Stock' : 'In Stock'}
          </Text>
          <Text style={styles.productPricePL}>₹{item.Price.toFixed(0)}</Text>

          <View style={styles.qtyContainer}>
            <TouchableOpacity
              onPress={() => decrementQty(item.ProductID)}
              style={[
                styles.qtyButton,
                isOutOfStock && {backgroundColor: '#d3d3d3'},
              ]}
              disabled={isOutOfStock}>
              <Text style={styles.qtyButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantities[item.ProductID]}</Text>
            <TouchableOpacity
              onPress={() => incrementQty(item.ProductID)}
              style={[
                styles.qtyButton,
                isOutOfStock && {backgroundColor: '#d3d3d3'},
              ]}
              disabled={isOutOfStock}>
              <Text style={styles.qtyButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#6200EA" />
          <Text style={styles.loadingText}>Fetching orders...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.containerOrdersList}>
          <View style={styles.filterButtonsContainer}>
            {/* All Orders Button with count */}
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === 'All' && styles.activeFilterButton, // Highlight active button
              ]}
              onPress={() => {
                setSelectedFilter('All');
                fetchOrderData('All', 1); // Fetch orders of type 'All' starting from page 1
              }}>
              <Text style={styles.filterButtonText}>
                All ({orderCounts.All})
              </Text>
            </TouchableOpacity>

            {/* Active Orders Button with count */}
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === 'Active' && styles.activeFilterButton,
              ]}
              onPress={() => {
                setSelectedFilter('Active');
                fetchOrderData('Active', 1);
              }}>
              <Text style={styles.filterButtonText}>
                Active ({orderCounts.Active})
              </Text>
            </TouchableOpacity>

            {/* Complete Orders Button with count */}
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === 'Complete' && styles.activeFilterButton,
              ]}
              onPress={() => {
                setSelectedFilter('Complete');
                fetchOrderData('Complete', 1);
              }}>
              <Text style={styles.filterButtonText}>
                Complete ({orderCounts.Complete})
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.noOrdersContainer}>
            <Text style={styles.noOrdersText}>No orders available.</Text>
          </View>
        </View>
      ) : (
        <View style={styles.containerOrdersList}>
          <View style={styles.filterButtonsContainer}>
            {/* All Orders Button with count */}
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === 'All' && styles.activeFilterButton, // Highlight active button
              ]}
              onPress={() => {
                setSelectedFilter('All');
                fetchOrderData('All', 1); // Fetch orders of type 'All' starting from page 1
              }}>
              <Text style={styles.filterButtonText}>
                All ({orderCounts.All})
              </Text>
            </TouchableOpacity>

            {/* Active Orders Button with count */}
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === 'Active' && styles.activeFilterButton,
              ]}
              onPress={() => {
                setSelectedFilter('Active');
                fetchOrderData('Active', 1);
              }}>
              <Text style={styles.filterButtonText}>
                Active ({orderCounts.Active})
              </Text>
            </TouchableOpacity>

            {/* Complete Orders Button with count */}
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === 'Complete' && styles.activeFilterButton,
              ]}
              onPress={() => {
                setSelectedFilter('Complete');
                fetchOrderData('Complete', 1);
              }}>
              <Text style={styles.filterButtonText}>
                Complete ({orderCounts.Complete})
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.ordersList}>
            <FlatList
              data={orders}
              renderItem={renderOrder}
              keyExtractor={item => item.OrderId.toString()}
              onEndReached={() =>
                paginationMeta.current_page < paginationMeta.last_page &&
                fetchOrderData(selectedFilter, paginationMeta.current_page + 1)
              }
              onEndReachedThreshold={0.1}
            />
            <View style={styles.paginationContainer}>
              {/* Previous Button */}
              <TouchableOpacity
                style={[
                  styles.paginationButton,
                  paginationMeta.current_page === 1 && styles.disabledButton, // Disable on first page
                ]}
                disabled={paginationMeta.current_page === 1}
                onPress={() => {
                  if (paginationMeta.current_page > 1) {
                    fetchOrderData(
                      selectedFilter,
                      paginationMeta.current_page - 1,
                    ); // Load previous page
                  }
                }}>
                <Text style={styles.paginationText}>Previous</Text>
              </TouchableOpacity>

              {/* Page Info */}
              <Text style={styles.paginationInfo}>
                Page {paginationMeta.current_page} of {paginationMeta.last_page}
              </Text>

              {/* Next Button */}
              <TouchableOpacity
                style={[
                  styles.paginationButton,
                  paginationMeta.current_page === paginationMeta.last_page &&
                    styles.disabledButton, // Disable on last page
                ]}
                disabled={
                  paginationMeta.current_page === paginationMeta.last_page
                }
                onPress={() => {
                  if (paginationMeta.current_page < paginationMeta.last_page) {
                    fetchOrderData(
                      selectedFilter,
                      paginationMeta.current_page + 1,
                    ); // Load next page
                  }
                }}>
                <Text style={styles.paginationText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      {/* Edit Modal */}
      {selectedOrder && (
        <Modal
          visible={editModalVisible}
          onRequestClose={() => setEditModalVisible(false)}
          transparent={true}
          animationType="fade">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Edit Order - ID: {selectedOrder.OrderId}
              </Text>
              {/* Customer Details */}
              <TouchableOpacity onPress={toggleModal}>
                <Text style={styles.buttonTextSMN}>Select a Number ▼</Text>
              </TouchableOpacity>
              <Text style={styles.buttonTextSM}>(OR)</Text>

              {/* Modal to select a number */}
              <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={toggleModal}>
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContentSMN}>
                    <Text style={styles.modalTitle}>Select a Number</Text>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search by number or name"
                      value={searchTerm}
                      autoCapitalize="none"
                      autoCorrect={false}
                      onChangeText={text => setSearchTerm(text)}
                    />
                    {filteredNumbers.length > 0 ? (
                      <FlatList
                        data={mobileNumbers}
                        renderItem={({item}) => (
                          <TouchableOpacity
                            onPress={() =>
                              handleSelectNumber(item.mobileNumber)
                            }
                            style={styles.listItem}>
                            <Text style={styles.itemText}>
                              {item.mobileNumber}
                            </Text>
                            <Text style={styles.itemText}>({item.name})</Text>
                          </TouchableOpacity>
                        )}
                        keyExtractor={(item, index) => index.toString()}
                      />
                    ) : (
                      <Text style={styles.emptyText}>
                        No mobile numbers available
                      </Text>
                    )}

                    {/* Close the modal */}
                    <TouchableOpacity onPress={toggleModal}>
                      <Text style={styles.cancelButtonTextSMN}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
              <TextInput
                style={styles.input}
                placeholder="Mobile"
                value={phone}
                onChangeText={setPhone}
                placeholderTextColor="#888"
              />
              <TextInput
                style={styles.input}
                placeholder="Customer Name"
                value={customerName}
                onChangeText={setCustomerName}
                placeholderTextColor="#888"
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                placeholderTextColor="#888"
              />
              <TextInput
                style={styles.input}
                placeholder="Address"
                value={address}
                onChangeText={setAddress}
                placeholderTextColor="#888"
              />
              {/* Add New Dish Section */}
              <View style={styles.addNewDishContainer}>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => openPL()}>
                  <Text style={styles.addButtonText}>Add New Dish</Text>
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedProducts.map((product, index) => (
                  <View style={styles.orderItemContainer}>
                    <View key={index} style={styles.orderItemCard}>
                      <View style={styles.orderItemContent}>
                        <Image
                          source={{
                            uri: `data:image/png;base64,${product.Image}`,
                          }}
                          style={styles.modalImage}
                        />
                        <View style={styles.productInfo}>
                          <Text style={styles.productTitle}>
                            {product.ProductName}
                          </Text>
                          <View style={styles.rowStart}>
                            <Text style={styles.quantityLabel}>
                              Qty: {product.Quantity}
                            </Text>
                            <Text style={styles.productCostForSelected}>
                              ₹{parseFloat(product.Price).toFixed(2)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}

                <View style={styles.orderItemContainer}>
                  {selectedOrder.Orders.map((product, index) => (
                    <View key={index} style={styles.orderItemCard}>
                      <View style={styles.orderItemContent}>
                        <Image
                          source={{
                            uri: `data:image/png;base64,${product.image}`,
                          }}
                          style={styles.modalImage}
                        />
                        <View style={styles.productInfo}>
                          <Text style={styles.productTitle}>
                            {product.productName}
                          </Text>
                          <View style={styles.quantityWrapper}>
                            <Text style={styles.quantityLabel}>Qty:</Text>
                            <TextInput
                              style={styles.quantityField}
                              keyboardType="numeric"
                              value={product.quantity.toString()}
                              onChangeText={newQuantity => {
                                const updatedProducts = [
                                  ...selectedOrder.Orders,
                                ];

                                // Check if the input is a valid number
                                const parsedQuantity =
                                  isNaN(newQuantity) || newQuantity === ''
                                    ? 0
                                    : parseInt(newQuantity, 10);

                                updatedProducts[index].quantity =
                                  parsedQuantity;

                                setSelectedOrder({
                                  ...selectedOrder,
                                  Orders: updatedProducts,
                                });
                              }}
                            />
                            <Text style={styles.productCost}>
                              ₹{parseFloat(product.price).toFixed(2)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => closeEM()}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.updateButton}
                  onPress={handleUpdateOrder}>
                  <Text style={styles.updateButtonText}>Update</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
      <Modal
        visible={editModalVisiblePL}
        onRequestClose={() => setEditModalVisiblePL(false)}
        transparent={true}
        animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Dishes List</Text>
            {/* Scrollable Container for Inputs and Products */}
            <View style={styles.containerDL}>
              {loadingPL ? (
                <View style={styles.loader}>
                  <ActivityIndicator size="large" color="#300172FF" />
                  <Text>Loading dishes...</Text>
                </View>
              ) : products.length === 0 ? (
                <View style={styles.noOrdersContainer}>
                  <Text style={styles.noOrdersText}>No dishes available.</Text>
                </View>
              ) : (
                <View>
                  <FlatList
                    style={styles.productListContainer}
                    data={products}
                    keyExtractor={item => item.ProductID.toString()}
                    renderItem={renderItem}
                    numColumns={2}
                    contentContainerStyle={styles.productList}
                  />
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => closePL(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.updateButton}
                onPress={() => addInExisitingOrder()}>
                <Text style={styles.updateButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <FooterMenu navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 80,
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  containerDL: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  orderCard: {
    marginLeft: 10,
    marginRight: 10,
    marginTop: 10,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  orderSubText: {
    marginRight: 18,
    fontSize: 14,
    color: '#6B7280',
    marginTop: 5,
  },
  orderSubTextDate: {
    marginRight: 18,
    fontSize: 14,
    color: '#6B7280',
  },
  orderSubTextCard: {
    flexDirection: 'row',
    justifyContent: 'start',
  },
  totalDetails: {
    marginVertical: 10,
    paddingTop: 2,
  },
  totalText: {
    alignSelf: 'flex-start',
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 5,
  },
  totalBillText: {
    alignSelf: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#300172FF',
    marginTop: 10,
  },
  productCard: {
    flexDirection: 'row',
    padding: 10,
    marginTop: 10,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  productImage: {
    backgroundColor: '#E5E7EB',
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  productDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productQuantity: {
    fontSize: 14,
    color: '#6B7280',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  productTotal: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginTop: 4,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4A5568',
  },
  noOrdersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noOrdersText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6B7280',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    width: '90%',
    height: 700,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden', // To ensure content doesn't overflow outside modal
  },
  modalTitle: {
    color: '#300172FF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    paddingLeft: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  orderItemContainer: {
    backgroundColor: '#F3F4F6',
    padding: 5,
    borderRadius: 5,
  },
  orderItemCard: {
    padding: 15,
    margin: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  productCost: {
    marginTop: 10,
    fontSize: 16,
    marginLeft: 35,
    fontWeight: 'bold',
    color: '#757575',
    marginBottom: 10,
  },
  quantityLabel: {
    fontSize: 14,
    color: '#333',
    marginRight: 10,
    fontWeight: 'bold',
  },
  quantityField: {
    marginTop: 8,
    height: 40,
    width: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    textAlign: 'center',
    fontSize: 14,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 8,
  },
  actionButtons: {
    width: 220,
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 8,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#300172FF',
    fontWeight: 'bold',
  },
  cancelButtonTextSMN: {
    marginLeft: 100,
    marginTop: 10,
    fontSize: 14,
    color: '#300172FF',
    fontWeight: 'bold',
  },
  updateButton: {
    backgroundColor: '#300172FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
  },
  updateButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  // Add the following styles
  modalImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginRight: 10, // Adding some space between the image and text
  },
  orderItemContent: {
    flexDirection: 'row',
    alignItems: 'center', // Aligns items horizontally
    justifyContent: 'space-between', // Ensures the content and image are spaced out
  },
  quantityWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', // Align the quantity input to the left
  },
  addNewDishContainer: {
    marginBottom: 10,
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    width: 120,
    backgroundColor: '#300172FF',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    padding: 5,
    color: '#fff',
    fontSize: 14,
  },
  productList: {
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  productItem: {
    flex: 1,
    margin: 6,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    overflow: 'hidden',
  },
  productInfoCard: {
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  productNamePL: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  productPricePL: {
    marginTop: 5,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  availabilityText: {
    fontSize: 13,
    marginTop: 5,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  qtyContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  qtyButton: {
    width: 30,
    height: 30,
    backgroundColor: '#300172FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginHorizontal: 10,
  },
  qtyButtonText: {
    color: '#fff',
    fontSize: 20,
  },
  qtyText: {
    fontSize: 16,
    marginVertical: 6,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleSelectContainer: {
    position: 'absolute', // Ensures the tick mark is positioned absolutely within this container
    top: 0, // Aligns the tick mark to the top of the image
    right: 0, // Aligns the tick mark to the right of the image
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%', // Ensures it takes the full width of the image container
    height: '100%', // Ensures it takes the full height of the image container
  },

  tickMark: {
    position: 'absolute', // Makes sure the tick mark is placed over the image
    top: 5, // Adjust to fine-tune the positioning
    right: 5, // Adjust to fine-tune the positioning
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  productImagePL: {
    width: 128,
    height: 150,
    borderRadius: 10,
  },
  ordersList: {
    height: 565,
  },
  paginationContainer: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 0,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paginationButton: {
    backgroundColor: '#300172FF',
    padding: 8,
    borderRadius: 5,
  },
  disabledButton: {
    backgroundColor: '#B8B7B7FF',
  },
  paginationText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },

  paginationInfo: {
    padding: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },
  ordersListIDAndEdit: {
    flexDirection: 'row', // Arrange items horizontally
    justifyContent: 'space-between', // Space between the Order ID and the Edit button
    alignItems: 'center', // Align the items vertically in the center
    marginBottom: 10,
  },

  orderIdText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },

  editButton: {
    backgroundColor: '#300172FF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
  },

  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  filterButtonsContainer: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 0,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // For Android shadow
  },
  filterButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#B8B7B7FF',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#300172FF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  containerOrdersList: {
    flex: 1,
  },
  qtyPrice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  RNPickerSelectStyleStyle: {
    height: 20,
  },
  rowStart: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  productCostForSelected: {
    marginLeft: 35,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#757575',
    marginBottom: 10,
  },
  listItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#EEE',
  },
  itemText: {
    color: 'black',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#300172FF',
    padding: 10,
    borderRadius: 5,
  },
  buttonTextSMN: {
    marginLeft: 8,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    marginLeft: 70,
  },
  modalContentSMN: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    width: '80%',
    height: 400,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  buttonTextSM: {
    marginLeft: 10,
    marginBottom: 8,
  },
  emptyText: {
    marginLeft: 10,
    marginTop: 110,
    marginBottom: 110,
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 16,
  },
  searchInput: {
    marginLeft: 8,
    fontSize: 15,
    borderRadius: 8,
    backgroundColor: '#F4F4F4FF',
    borderColor: 'grey',
  },
});

export default OrderList;
