import React, {useState, useEffect} from 'react';
import DatePicker from 'react-native-date-picker';
import {
  View,
  TextInput,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import request from 'superagent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FooterMenu from './Footer';
const MenuScreen = ({navigation}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalIsVisible, setIsModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantities, setQuantities] = useState({});

  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [preOrderDate, setPreOrderDate] = useState('');
  const [open, setOpen] = useState(false);
  const [openTime, setOpenTime] = useState(false);

  // Item-Specific Details
  const [selectedItems, setSelectedItems] = useState([]);
  const [remarks, setRemarks] = useState({});
  const [mealCategory, setMealCategory] = useState({});
  const [mealTiming, setMealTiming] = useState({});

  useEffect(() => {
    const fetchProducts = async () => {
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
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const formatDate = date => {
    const day = date.getDate(); // Get the day (1-31)
    const month = date.toLocaleString('default', {month: 'short'}); // Get the abbreviated month (Jan, Feb, Mar, etc.)
    const year = date.getFullYear(); // Get the full year (2024)

    // Format the date as d-M-YYYY (e.g., 31-Dec-2024)
    return `${day}-${month}-${year}`;
  };
  const handleQuantityChange = (productID, value) => {
    // Validate numeric input
    const numericValue = parseInt(value, 10) || 0;
    setQuantities(prevQuantities => ({
      ...prevQuantities,
      [productID]: numericValue,
    }));
  };

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
  const placeOrder = async () => {
    const AdminId = await AsyncStorage.getItem('id'); // Get the admin ID from AsyncStorage
    if (!AdminId) {
      Alert.alert(
        'Login Required',
        'Admin login is required for placing an order.',
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

    if (selectedItems.length === 0) {
      Alert.alert(
        'No dish selected',
        'Please select atleast one dish to place the order.',
      );
      return;
    }

    // Prepare the order data
    const orderData = {
      AdminId: AdminId, // Use the fetched AdminId
      CustomerName: null, // Replace with dynamic customer data
      Email: null, // Replace with dynamic customer email
      Address: null, // Replace with dynamic customer address
      Phone: null, // Replace with dynamic customer phone
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
        .post('http://192.168.10.40:8000/addOrder') // Your API endpoint
        .set('Content-Type', 'application/json') // Set headers
        .send(orderData); // Send the data in the request body

      if (response.body.success) {
        Alert.alert('Order Placed', 'Order has been successfully placed!');
        setTimeout(() => {
          navigation.replace('MenuScreen');
        }, 3000);
      } else {
        Alert.alert(
          'Error',
          'There was an issue placing your order. Please try again.',
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

  const submitPreOrder = async () => {
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
          Alert.alert(
            'Validation Error',
            'Remarks are required for all items.',
          );
          return;
        }
      }

      const AdminId = await AsyncStorage.getItem('id'); // Get the admin ID from AsyncStorage
      const formattedDate = formatDate(new Date(preOrderDate));
      const orderData = {
        AdminId: AdminId, // Use the fetched AdminId
        CustomerName: customerName, // Replace with dynamic customer data
        Email: email, // Replace with dynamic customer email
        Address: address, // Replace with dynamic customer address
        Phone: phone, // Replace with dynamic customer phone
        PreOrderDate: formattedDate, // Add pre-order date to the request
        Items: selectedItems.map(item => ({
          product_id: item.ProductID,
          quantity: String(quantities[item.ProductID]),
          remarks: remarks[item.ProductID] || '',
          meal_category: mealCategory[item.ProductID] || '',
          meal_timing: mealTiming[item.ProductID] || '',
        })),
      };

      const response = await request
        .post('http://192.168.10.40:8000/addPreOrder') // Your API endpoint
        .set('Content-Type', 'application/json') // Set headers
        .send(orderData); // Send the data in the request body

      if (response.body.success) {
        Alert.alert(
          'Pre-Order Placed',
          'Pre-Order has been successfully placed!',
        );
        setTimeout(() => {
          navigation.replace('MenuScreen');
        }, 3000);
      } else {
        Alert.alert(
          'Error',
          'There was an issue placing your order. Please try again.',
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

  const renderItem = ({item}) => {
    const imageSource = item.Image
      ? {uri: `data:image/jpeg;base64,${item.Image}`}
      : require('./images/ankapur_chicken_logo.webp');
    const isOutOfStock = item.Available == '0';

    return (
      <View style={styles.productItem}>
        <View style={styles.imageContainer}>
          <Image source={imageSource} style={styles.productImage} />
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
          <TouchableOpacity
            onPress={() => {
              setSelectedProduct(item);
              setModalVisible(true);
            }}>
            <Text style={styles.buttonText}>View Info</Text>
          </TouchableOpacity>
          <Text style={styles.productName}>{item.ProductName}</Text>
          <Text
            style={[
              styles.availabilityText,
              {color: item.Available == 0 ? '#FF0000' : '#008000'},
            ]}>
            {item.Available == 0 ? 'Out of Stock' : 'In Stock'}
          </Text>
          <Text style={styles.productPrice}>₹{item.Price.toFixed(0)}</Text>

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
          <ActivityIndicator size="large" color="#300172FF" />
          <Text>Loading dishes...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.noOrdersContainer}>
          <Text style={styles.noOrdersText}>No dishes available.</Text>
        </View>
      ) : (
        <View>
          {/* Place Order Button */}
          <View style={styles.addOrderButtons}>
            <TouchableOpacity
              style={styles.placeOrderButton}
              onPress={placeOrder}>
              <Text style={styles.placeOrderButtonText}>Place Order</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.placeOrderButton}
              onPress={displayPreOrderOrder}>
              <Text style={styles.placeOrderButtonText}>ADD Pre-Order</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.placeOrderButton}
              onPress={() => navigation.replace('PreOrdersList')}>
              <Text style={styles.placeOrderButtonText}>Pre-Order List</Text>
            </TouchableOpacity>
          </View>
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

      {selectedProduct && (
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Image
                source={
                  selectedProduct.Image
                    ? {uri: `data:image/jpeg;base64,${selectedProduct.Image}`}
                    : require('./images/ankapur_chicken_logo.webp')
                }
                style={styles.modalProductImage}
              />
              <Text style={styles.modalTitle}>
                {selectedProduct.ProductName}
              </Text>
              <Text style={styles.modalText}>
                Price: ₹{selectedProduct.Price.toFixed(2)}
              </Text>
              <Text style={styles.modalText}>
                Tax: {selectedProduct.Tax.toFixed(2)}
              </Text>
              <Text style={styles.modalText}>
                Discounts: {selectedProduct.Discounts.toFixed(2)}
              </Text>
              <Text style={styles.modalText}>
                Quantity: {selectedProduct.Quanity}
              </Text>
              <Text style={styles.modalText}>
                Kitchen Description: {selectedProduct.KitchenDescription}
              </Text>
              <Text style={styles.selectedProductDes}>
                {selectedProduct.ShortDescription}
              </Text>
              <Text style={styles.selectedProductDes}>
                {selectedProduct.LongDescription}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
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

                  <Text style={styles.sectionHeader}>Select Meal Category</Text>
                  <View style={styles.mealCategoryContainer}>
                    <TouchableOpacity
                      style={[
                        styles.mealCategoryButton,
                        mealCategory[item.ProductID] === 'Breakfast' &&
                          styles.selectedButton,
                      ]}
                      onPress={() =>
                        handleMealCategorySelection(item.ProductID, 'Breakfast')
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
                        handleMealCategorySelection(item.ProductID, 'Lunch')
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
                        handleMealCategorySelection(item.ProductID, 'Dinner')
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
                onPress={submitPreOrder}>
                <Text style={styles.placeOrderButtonText}>
                  Submit Pre-Order
                </Text>
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
    backgroundColor: '#f0f0f5',
  },
  productList: {
    paddingVertical: 2,
    paddingHorizontal: 5,
  },
  productListContainer: {
    height: 562,
  },
  productItem: {
    flex: 1,
    margin: 6,
    padding: 7,
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
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  productPrice: {
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
  qtyContainerI: {
    flexDirection: 'row',
    justifyContent: 'start',
    alignItems: 'center',
    marginTop: 0,
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
  buttonText: {
    fontStyle: 'italic',
    fontWeight: '400',
    color: '#300172FF',
    textDecorationLine: 'underline',
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
  productImage: {
    width: 165,
    height: 180,
    borderRadius: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '90%',
    maxWidth: 500,
    alignItems: 'center',
  },
  modalProductImage: {
    width: 150,
    height: 150,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 5,
    textAlign: 'center',
    color: '#300172FF',
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    marginVertical: 2,
    alignSelf: 'flex-start',
  },
  selectedProductDes: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#300172FF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
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
  addOrderButtons: {
    marginTop: 1,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-evenly',
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
  },
});

export default MenuScreen;
