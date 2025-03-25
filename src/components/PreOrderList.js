import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useState, useEffect} from 'react';
import DatePicker from 'react-native-date-picker';
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

const PreOrderList = ({navigation}) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPL, setLoadingPL] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editModalVisiblePL, setEditModalVisiblePL] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [status, setStatus] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [preOrderDate, setPreOrderDate] = useState('');
  const [open, setOpen] = useState(false);
  const [openTime, setOpenTime] = useState(false);
  const [openTimeSelectedOrder, setOpenTimeSelectedOrder] = useState(false);
  const [remarks, setRemarks] = useState({});
  const [mealCategory, setMealCategory] = useState({});
  const [mealTiming, setMealTiming] = useState({});
  const [quantities, setQuantities] = useState({});
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [modalIsVisible, setIsModalVisible] = useState(false);

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

  const onConfirm = selectedDate => {
    const formattedDate = selectedDate.toISOString().split('T')[0];
    setPreOrderDate(formattedDate); // Update the TextInput with selected date
    setOpen(false);
  };

  const onCancel = () => {
    setOpen(false); // Close the date picker without changing the date
  };

  const handleOpenTime = productId => {
    setOpenTime(prev => ({...prev, [productId]: true})); // Open time picker for specific item
  };

  const handleCloseTime = productId => {
    setOpenTime(prev => ({...prev, [productId]: false})); // Close time picker for specific item
  };

  const handleMealCategorySelection = (productId, category) => {
    setMealCategory(prev => ({...prev, [productId]: category}));
  };

  // Handle meal timing selection
  const handleTimeInputChange = (productId, time) => {
    const formattedTime = time.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    setMealTiming(prev => ({...prev, [productId]: formattedTime}));
  };

  // Handle remarks change
  const handleRemarksChange = (productId, text) => {
    setRemarks(prev => ({...prev, [productId]: text}));
  };

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
    fetchCustomerData();
    fetchOrderData();
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

  const displayPreOrderOrder = async () => {
    const AdminId = await AsyncStorage.getItem('id'); // Get the admin ID from AsyncStorage

    if (!AdminId) {
      Alert.alert(
        'Login Required',
        'Admin login is required for placing a pre-order.',
      );
      return;
    }

    // Gather the selected products with their quantities
    const selectedItems = products
      .filter(item => quantities[item.ProductID] > 0) // Filter products based on quantity
      .map(item => ({
        ...item, // Include the original item properties
        product_id: item.ProductID,
      }));

    if (selectedItems.length === 0) {
      Alert.alert(
        'No dish selected',
        'Please select at least one dish to place the pre-order.',
      );
      return;
    }

    // Set the selected items and show the modal
    setSelectedItems(selectedItems); // Update selected items for the modal
    setIsModalVisible(true); // Show the modal
  };

  const updatePreOrderDetails = async () => {
    try {
      // Validation
      if (!customerName || !email || !address || !phone || !preOrderDate) {
        Alert.alert('Validation Error', 'Please fill all the required fields.');
        return;
      }

      // Email Validation
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
      if (!emailRegex.test(email)) {
        Alert.alert('Validation Error', 'Please enter a valid email address.');
        return;
      }

      // Phone Validation (simple check for numeric values)
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phone)) {
        Alert.alert(
          'Validation Error',
          'Please enter a valid phone number (10 digits).',
        );
        return;
      }
      selectedOrder.Items.forEach(item => {
        // Check if Meal Category is empty
        if (!item.meal_category || item.meal_category.trim() === '') {
          Alert.alert(
            'Validation Error',
            'Meal category is required for all items.',
          );
          return; // Exit the current iteration and prevent further validation for this item
        }

        // Check if Meal Timing is empty
        if (!item.meal_timing || item.meal_timing.trim() === '') {
          Alert.alert(
            'Validation Error',
            'Meal timing is required for all items.',
          );
          return;
        }

        // Check if Remarks is empty (if it's provided)
        if (item.remarks && item.remarks.trim() === '') {
          Alert.alert(
            'Validation Error',
            'Remarks cannot be empty if provided.',
          );
          return;
        }
      });

      const AdminId = await AsyncStorage.getItem('id'); // Get the admin ID from AsyncStorage
      const formattedDate = formatDate(new Date(preOrderDate));
      const combinedItems = [
        ...selectedOrder.Items.map(item => ({
          product_id: item.productId,
          quantity: String(item.quantity),
          remarks: item.remarks || '',
          meal_category: item.meal_category || '',
          meal_timing: item.meal_timing || '',
        })),
        ...selectedItems.map(item => ({
          product_id: item.ProductID,
          quantity: String(quantities[item.ProductID]),
          remarks: remarks[item.ProductID] || '',
          meal_category: mealCategory[item.ProductID] || '',
          meal_timing: mealTiming[item.ProductID] || '',
        })),
      ];

      const orderData = {
        AdminId: AdminId, // Use the fetched AdminId
        CustomerName: customerName, // Replace with dynamic customer data
        Email: email, // Replace with dynamic customer email
        Address: address, // Replace with dynamic customer address
        Phone: phone, // Replace with dynamic customer phone
        PreOrderDate: formattedDate, // Add pre-order date to the request
        Items: combinedItems,
      };

      const response = await request
        .put(
          `http://192.168.10.40:8000/updatePreOrderDetails/${AdminId}/${selectedOrder.PreOrderId}`,
        ) // Your API endpoint
        .set('Content-Type', 'application/json') // Set headers
        .send(orderData); // Send the data in the request body

      if (response.status === 200) {
        Alert.alert('Pre-Order Updated', 'Pre-Order has been updated!');
        setTimeout(() => {
          navigation.replace('PreOrdersList');
        }, 3000);
      } else {
        Alert.alert(
          'Error',
          'There was an issue updaing your order. Please try again.',
        );
      }
    } catch (error) {
      console.log('Error placing order:', error);
      Alert.alert(
        'Error',
        'There was an issue placing your order. Please try again.',
      );
    }
  };

  const fetchOrderData = async () => {
    try {
      const userId = await AsyncStorage.getItem('id');
      if (!userId) {
        Alert.alert('Not Logged In', 'Please log in to view the orders.', [
          {text: 'OK'},
        ]);
        setLoading(false);
      } else {
        try {
          const response = await request.get(
            `http://192.168.10.40:8000/preOrdersListAdminMobileByID/${userId}`,
          );

          const data = response.body;
          if (data && data.data) {
            setOrders(data.data); // Reset orders
          } else {
            console.log('Empty data field in API response');
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

  const formatDateToYYYYMMDD = preOrderDate => {
    const monthMap = {
      Jan: '01',
      Feb: '02',
      Mar: '03',
      Apr: '04',
      May: '05',
      Jun: '06',
      Jul: '07',
      Aug: '08',
      Sep: '09',
      Oct: '10',
      Nov: '11',
      Dec: '12',
    };

    const [day, monthStr, year] = preOrderDate.split('-'); // Split DD-MMM-YYYY
    const month = monthMap[monthStr]; // Use the map to get the numeric month

    if (!month) {
      throw new Error(`Invalid month: ${monthStr}`); // Handle invalid month
    }

    // Ensure day is two digits
    const formattedDay = day.padStart(2, '0');

    return `${year}-${month}-${formattedDay}`; // Return in YYYY-MM-DD format
  };

  const formatDate = date => {
    const day = date.getDate(); // Get the day (1-31)
    const month = date.toLocaleString('default', {month: 'short'}); // Get the abbreviated month (Jan, Feb, Mar, etc.)
    const year = date.getFullYear(); // Get the full year (2024)

    // Format the date as d-M-YYYY (e.g., 31-Dec-2024)
    return `${day}-${month}-${year}`;
  };
  const renderOrder = ({item}) => {
    const totalQuantity = item.Items.reduce(
      (total, product) => total + product.quantity,
      0,
    );
    const totalAmount = item.Items.reduce(
      (total, product) => total + product.price * product.quantity,
      0,
    );
    const totalTax = item.Items.reduce(
      (total, product) => total + (product.tax ? parseFloat(product.tax) : 0),
      0,
    );
    const totalDiscounts = item.Items.reduce(
      (total, product) =>
        total + (product.discounts ? parseFloat(product.discounts) : 0),
      0,
    );

    const openEditModal = orderId => {
      const selectedOrderByID = orders.find(
        order => order.PreOrderId === orderId,
      );
      if (selectedOrderByID) {
        setSelectedOrder(selectedOrderByID);
        setCustomerName(selectedOrderByID.CustomerName || '');
        setStatus(selectedOrderByID.Status || '');
        setPhone(selectedOrderByID.Phone || '');
        setEmail(selectedOrderByID.Email || '');
        setAddress(selectedOrderByID.Address || '');
        const formattedPreOrderDate = selectedOrderByID.PreOrderDate
          ? formatDateToYYYYMMDD(selectedOrderByID.PreOrderDate)
          : '';

        setPreOrderDate(formattedPreOrderDate);
        setEditModalVisible(true);
      }
    };

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderDetails}>
          <View style={styles.ordersListIDAndEdit}>
            <Text style={styles.orderIdText}>
              PreOrder ID: {item.PreOrderId}
            </Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => openEditModal(item.PreOrderId)}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.orderSubTextC}>
            Customer: {item.CustomerName || 'N/A'}
          </Text>
          <Text style={styles.orderSubText}>
            Mobile No: {item.Phone || 'N/A'}
          </Text>
          <Text style={styles.orderSubText}>
            PreOrderDate: {item.PreOrderDate || 'N/A'}
          </Text>
        </View>
        {item.Items.map((product, index) => (
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
                Quantity: {product.quantity}
              </Text>
              <Text style={styles.mealCategory}>
                Meal Category: {product.meal_category}
              </Text>
              <Text style={styles.mealTiming}>
                Meal Timing: {product.meal_timing}
              </Text>
              <Text style={styles.mealRemarks}>Remarks: {product.remarks}</Text>
            </View>
            <View style={styles.qtyPrice}>
              <Text style={styles.productPrice}>₹{product.price}</Text>
            </View>
          </View>
        ))}
        <View style={styles.totalDetails}>
          <Text style={styles.totalText}>Total Quantity: {totalQuantity}</Text>
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

  const addInExisitingPreOrder = async () => {
    // Gather the selected products with their quantities, names, and prices
    try {
      // Validation
      if (!customerName || !email || !address || !phone || !preOrderDate) {
        Alert.alert('Validation Error', 'Please fill all the required fields.');
        return;
      }

      // Email Validation
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
      if (!emailRegex.test(email)) {
        Alert.alert('Validation Error', 'Please enter a valid email address.');
        return;
      }

      // Phone Validation (simple check for numeric values)
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phone)) {
        Alert.alert(
          'Validation Error',
          'Please enter a valid phone number (10 digits).',
        );
        return;
      }
    } catch (error) {
      console.log('Error adding  pre-order:', error);
      Alert.alert(
        'Error',
        'There was an issue adding your pre-order. Please try again.',
      );
    }
    const selectedItems = products
      .filter(item => quantities[item.ProductID] > 0)
      .map(item => ({
        ProductID: item.ProductID,
        ProductName: item.ProductName,
        Price: item.Price,
        Image: item.Image,
        Quantity: quantities[item.ProductID],
        MealCategory: mealCategory[item.ProductID],
        MealTiming: mealTiming[item.ProductID],
        Remarks: remarks[item.ProductID],
      }));
    for (const item of selectedItems) {
      const productId = item.ProductID;

      // Meal Category Validation
      if (!mealCategory[productId]) {
        Alert.alert(
          'Validation Error',
          'Meal category is required for all items.',
        );
        return;
      }

      // Meal Timing Validation
      if (!mealTiming[productId]) {
        Alert.alert(
          'Validation Error',
          'Meal timing is required for all items.',
        );
        return;
      }

      // Remarks Validation (optional, but ensure it's not empty if required)
      if (!remarks[productId]) {
        Alert.alert('Validation Error', 'Remarks are required for all items.');
        return;
      }
    }

    setSelectedProducts(selectedItems); // Set the selected products with additional details
    setEditModalVisiblePL(false);
    setEditModalVisible(true);
  };

  const handleMealCategoryChange = (index, mealCategory) => {
    const updatedProducts = [...selectedOrder.Items]; // Create a copy of the items array

    // Update the meal_category for the specific product at the given index
    updatedProducts[index].meal_category = mealCategory;

    // Update the state with the modified list of products
    setSelectedOrder(prevState => ({
      ...prevState,
      Items: updatedProducts,
    }));
  };

  const openMealTimePicker = index => {
    setOpenTimeSelectedOrder(prevState => ({
      ...prevState,
      [index]: true, // Open the time picker for the selected index
    }));
  };

  const closeMealTimePicker = index => {
    setOpenTimeSelectedOrder(prevState => ({
      ...prevState,
      [index]: false, // Close the time picker for the selected index
    }));
  };

  const handleTimeInputChangeSelectedOrder = (index, time) => {
    const updatedProducts = [...selectedOrder.Items]; // Create a copy of the items array

    // Update the meal_timing for the product at the specific index
    updatedProducts[index].meal_timing = time.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Update the state with the modified list of products
    setSelectedOrder(prevState => ({
      ...prevState,
      Items: updatedProducts,
    }));
  };
  const handleRemarksUpdate = (productId, text) => {
    // Update the remarks in the selectedOrder.Items
    const updatedProducts = [...selectedOrder.Items];

    // Find the product by productId and update its remarks
    const productIndex = updatedProducts.findIndex(
      product => product.productId === productId,
    );

    if (productIndex !== -1) {
      updatedProducts[productIndex].remarks = text; // Update the remarks for the specific product
    }

    // Update the selectedOrder state
    setSelectedOrder(prevState => ({
      ...prevState,
      Items: updatedProducts, // Set the updated items list with modified remarks
    }));

    // Optionally, update the remarks state for the UI (if required)
    setRemarks(prevState => ({
      ...prevState,
      [productId]: text, // Update remarks for this productId in the state
    }));
  };

  const handleQuantityChange = (productID, value) => {
    // Validate numeric input
    const numericValue = parseInt(value, 10) || 0;
    setQuantities(prevQuantities => ({
      ...prevQuantities,
      [productID]: numericValue,
    }));
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
          <Text style={styles.loadingText}>Fetching pre-orders...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.containerOrdersList}>
          <View style={styles.noOrdersContainer}>
            <Text style={styles.noOrdersText}>No pre-orders available.</Text>
          </View>
        </View>
      ) : (
        <View style={styles.containerOrdersList}>
          <View style={styles.ordersList}>
            <FlatList
              data={orders}
              renderItem={renderOrder}
              keyExtractor={item => item.PreOrderId}
            />
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
                Edit Pre-Order - ID: {selectedOrder.PreOrderId}
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
              <TouchableOpacity onPress={() => setOpen(true)}>
                <TextInput
                  style={styles.input}
                  placeholder="PreOrderDate"
                  value={preOrderDate}
                  onChangeText={setPreOrderDate}
                  placeholderTextColor="#888"
                  editable={false} // Make the input field non-editable
                />
              </TouchableOpacity>
              {open && (
                <DatePicker
                  modal
                  open={open}
                  date={new Date(preOrderDate || new Date())} // Default to current date if empty
                  mode="date"
                  onConfirm={onConfirm}
                  onCancel={onCancel}
                />
              )}
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
                          <View style={styles.quantityWrapper}>
                            <Text style={styles.quantityLabel}>
                              Quantity: {product.Quantity}
                            </Text>
                            <Text style={styles.productCost}>
                              ₹{parseFloat(product.Price).toFixed(2)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Text style={styles.sectionHeader}>
                        Select Meal Category: {product.MealCategory}
                      </Text>
                      <Text>Meal Timing: {product.MealTiming}</Text>
                      <Text>Remarks: {product.Remarks}</Text>
                    </View>
                  </View>
                ))}

                <View style={styles.orderItemContainer}>
                  {selectedOrder.Items.map((product, index) => (
                    <View key={index} style={styles.orderItemCard}>
                      <View style={styles.orderItemContent}>
                        {/* Product Image */}
                        <Image
                          source={{
                            uri: `data:image/png;base64,${product.image}`,
                          }}
                          style={styles.modalImage}
                        />

                        {/* Product Info */}
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
                                  ...selectedOrder.Items,
                                ];

                                // Ensure valid input for quantity
                                const parsedQuantity =
                                  isNaN(newQuantity) || newQuantity === ''
                                    ? 0
                                    : parseInt(newQuantity, 10);

                                updatedProducts[index].quantity =
                                  parsedQuantity;

                                setSelectedOrder(prevState => ({
                                  ...prevState,
                                  Items: updatedProducts,
                                }));
                              }}
                            />
                            <Text style={styles.productCost}>
                              ₹{parseFloat(product.price).toFixed(2)}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <Text style={styles.sectionHeader}>
                        Select Meal Category
                      </Text>
                      <View style={styles.mealCategoryContainer}>
                        {['Breakfast', 'Lunch', 'Dinner'].map(meal => (
                          <TouchableOpacity
                            key={meal}
                            style={[
                              styles.mealCategoryButton,
                              product.meal_category === meal &&
                                styles.selectedButton, // Highlight selected category
                            ]}
                            onPress={() =>
                              handleMealCategoryChange(index, meal)
                            } // Pass index to identify the product
                          >
                            <Text
                              style={[
                                styles.buttonText,
                                product.meal_category === meal &&
                                  styles.selectedButtonText, // Change text style if selected
                              ]}>
                              {meal}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {/* Meal Timing Selection */}
                      <TouchableOpacity
                        onPress={() => {
                          openMealTimePicker(index); // Open time picker for specific item based on its index
                        }}>
                        <TextInput
                          placeholder="Select Meal Time"
                          value={product.meal_timing || ''} // Display selected time or empty
                          style={styles.inputField}
                          editable={false} // Make input non-editable
                        />
                      </TouchableOpacity>

                      {/* Time Picker Modal */}
                      {openTimeSelectedOrder[index] && ( // Use index to control individual time picker visibility
                        <DatePicker
                          modal
                          mode="time" // Set picker mode to 'time'
                          open={openTimeSelectedOrder[index]} // Open for the specific index
                          date={new Date()} // Default to current time
                          onConfirm={time => {
                            handleTimeInputChangeSelectedOrder(index, time); // Handle time selection
                            closeMealTimePicker(index); // Close the picker
                          }}
                          onCancel={() => closeMealTimePicker(index)} // Close the picker on cancel
                        />
                      )}

                      {/* Remarks Input */}
                      <TextInput
                        placeholder="Remarks"
                        value={product.remarks || ''}
                        onChangeText={text =>
                          handleRemarksUpdate(product.productId, text)
                        }
                        style={styles.remarksInput}
                      />
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
                  onPress={updatePreOrderDetails}>
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
                onPress={() => displayPreOrderOrder()}>
                <Text style={styles.updateButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            <Modal visible={modalIsVisible} animationType="slide">
              <View style={styles.modalWrapper}>
                <View style={styles.modalContentPOF}>
                  <Text style={styles.titlePOF}>Pre-Order Form</Text>

                  {/* Customer Details */}
                  <TextInput
                    placeholder="Customer Name"
                    value={customerName}
                    onChangeText={setCustomerName}
                    style={styles.inputField}
                  />
                  <TextInput
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    style={styles.inputField}
                  />
                  <TextInput
                    placeholder="Address"
                    value={address}
                    onChangeText={setAddress}
                    style={styles.inputField}
                  />
                  <TextInput
                    placeholder="Phone"
                    value={phone}
                    onChangeText={setPhone}
                    style={styles.inputField}
                  />
                  {/* Pre-Order Date */}
                  <TouchableOpacity onPress={() => setOpen(true)}>
                    <TextInput
                      placeholder="Select Pre-Order Date"
                      value={preOrderDate}
                      style={styles.inputField}
                      editable={false} // Make the input field non-editable
                    />
                  </TouchableOpacity>

                  {open && (
                    <DatePicker
                      modal
                      open={open}
                      date={new Date(preOrderDate || new Date())} // Default to current date if empty
                      mode="date"
                      onConfirm={onConfirm}
                      onCancel={onCancel}
                    />
                  )}
                  {/* Item-Specific Details */}
                  <FlatList
                    data={selectedItems}
                    keyExtractor={item => item.ProductID.toString()}
                    renderItem={({item}) => (
                      <View style={styles.itemCard}>
                        <Text style={styles.itemTitle}>{item.ProductName}</Text>
                        <View style={styles.qtyContainerI}>
                          <Text style={styles.qtyLabelI}>Qty:</Text>
                          <TextInput
                            placeholder="Quantity"
                            value={quantities[item.ProductID]?.toString() || ''} // Display the quantity as a string
                            onChangeText={value =>
                              handleQuantityChange(item.ProductID, value)
                            }
                            keyboardType="numeric" // Restrict input to numbers
                            style={styles.inputFieldI}
                          />
                        </View>

                        <Text style={styles.sectionHeader}>
                          Select Meal Category
                        </Text>
                        <View style={styles.mealCategoryContainer}>
                          <TouchableOpacity
                            style={[
                              styles.mealCategoryButton,
                              mealCategory[item.ProductID] === 'Breakfast' &&
                                styles.selectedButton,
                            ]}
                            onPress={() =>
                              handleMealCategorySelection(
                                item.ProductID,
                                'Breakfast',
                              )
                            }>
                            <Text
                              style={[
                                styles.buttonText,
                                mealCategory[item.ProductID] === 'Breakfast' &&
                                  styles.selectedButtonText,
                              ]}>
                              Breakfast
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.mealCategoryButton,
                              mealCategory[item.ProductID] === 'Lunch' &&
                                styles.selectedButton,
                            ]}
                            onPress={() =>
                              handleMealCategorySelection(
                                item.ProductID,
                                'Lunch',
                              )
                            }>
                            <Text
                              style={[
                                styles.buttonText,
                                mealCategory[item.ProductID] === 'Lunch' &&
                                  styles.selectedButtonText,
                              ]}>
                              Lunch
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.mealCategoryButton,
                              mealCategory[item.ProductID] === 'Dinner' &&
                                styles.selectedButton,
                            ]}
                            onPress={() =>
                              handleMealCategorySelection(
                                item.ProductID,
                                'Dinner',
                              )
                            }>
                            <Text
                              style={[
                                styles.buttonText,
                                mealCategory[item.ProductID] === 'Dinner' &&
                                  styles.selectedButtonText,
                              ]}>
                              Dinner
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {/* Meal Timing Selection */}
                        <TouchableOpacity
                          onPress={() => {
                            handleOpenTime(item.ProductID); // Open time picker for specific item
                          }}>
                          <TextInput
                            placeholder="Select Meal Time"
                            value={mealTiming[item.ProductID] || ''}
                            style={styles.inputField}
                            editable={false}
                          />
                        </TouchableOpacity>
                        {openTime[item.ProductID] && (
                          <DatePicker
                            modal
                            mode="time"
                            open={openTime[item.ProductID]} // Open for the specific item
                            date={new Date()} // Default to current time
                            onConfirm={time => {
                              handleTimeInputChange(item.ProductID, time);
                              handleCloseTime(item.ProductID);
                            }}
                            onCancel={() => handleCloseTime(item.ProductID)}
                          />
                        )}
                        <TextInput
                          placeholder="Remarks"
                          value={remarks[item.ProductID] || ''}
                          onChangeText={text =>
                            handleRemarksChange(item.ProductID, text)
                          }
                          style={styles.remarksInput}
                        />
                      </View>
                    )}
                  />

                  {/* Submit Button */}
                  <View style={styles.addOrderButtons}>
                    <TouchableOpacity
                      onPress={() => setIsModalVisible(false)}
                      style={styles.placeOrderButton}>
                      <Text style={styles.placeOrderButtonText}>Close</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.placeOrderButton}
                      onPress={addInExisitingPreOrder}>
                      <Text style={styles.placeOrderButtonText}>
                        ADD Pre-Order
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
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
    padding: 10,
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
  orderSubTextC: {
    marginRight: 18,
    fontSize: 14,
    color: '#6B7280',
    marginTop: 0,
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
    padding: 5,
    marginTop: 10,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  productImage: {
    backgroundColor: '#E5E7EB',
    width: 90,
    height: 100,
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
    color: 'black',
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
    height: 600,
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
    marginBottom: 0,
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },

  editButton: {
    backgroundColor: '#300172FF',
    borderRadius: 5,
  },

  editButtonText: {
    padding: 5,
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
  modalWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark background for the modal
  },
  modalContentPOF: {
    height: 700,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 600,
  },
  titlePOF: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    color: '#300172FF',
  },
  inputField: {
    color: 'black',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingLeft: 10,
    marginVertical: 6,
    fontSize: 16,
  },
  inputFieldI: {
    width: 50,
    color: 'black',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    fontSize: 16,
    marginLeft: 5,
    marginBottom: 6,
  },
  itemCard: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 8,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  itemTitle: {
    color: '#300172FF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  remarksInput: {
    height: 60,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingLeft: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  mealCategoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  mealCategoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
  },
  mealTimingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  mealTimingButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
  },
  selectedButton: {
    backgroundColor: '#300172FF',
  },
  selectedInfo: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
  selectedButtonText: {
    color: 'white',
  },
  submitButton: {
    backgroundColor: '#300172FF',
    paddingVertical: 15,
    paddingHorizontal: 5,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  qtyLabelI: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 5,
    alignSelf: 'center',
  },
  qtyContainerI: {
    flexDirection: 'row',
    justifyContent: 'start',
    alignItems: 'center',
    marginTop: 0,
  },
  addOrderButtons: {
    marginTop: 1,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-evenly',
  },
  placeOrderButton: {
    backgroundColor: '#300172FF',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 5,
    marginTop: 5,
    alignSelf: 'center',
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 18,
  },
  placeOrderButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default PreOrderList;
