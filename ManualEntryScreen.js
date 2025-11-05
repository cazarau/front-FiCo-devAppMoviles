import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpense } from './ExpenseContext';

export default function ManualEntryScreen({ navigation, route }) {
  const { addReceipt, updateReceipt, receipts } = useExpense();
  const isEditing = route?.params?.receiptId;

  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [products, setProducts] = useState([
    { name: '', price: 0, quantity: 1 }
  ]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const categories = [
    'Alimentos',
    'Transporte',
    'Equipo de oficina',
    'Servicios',
    'Otros'
  ];

  const paymentMethods = [
    'Efectivo',
    'Tarjeta de crédito',
    'Tarjeta de débito',
    'Transferencia',
    'Otro'
  ];

  useEffect(() => {
    if (isEditing && route.params?.receipt) {
      const receipt = route.params.receipt;
      setMerchant(receipt.name || '');
      setDate(formatDateInput(receipt.date));
      setSelectedCategory(receipt.category || null);
      setPaymentMethod(receipt.paymentMethod || '');
      setProducts(receipt.products || [{ name: '', price: 0, quantity: 1 }]);
    }
  }, [isEditing, route.params]);

  const formatDateInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const calculateTotal = () => {
    return products.reduce((sum, product) => {
      const price = parseFloat(product.price) || 0;
      const quantity = parseFloat(product.quantity) || 1;
      return sum + (price * quantity);
    }, 0);
  };

  const handleAddProduct = () => {
    setProducts([...products, { name: '', price: 0, quantity: 1 }]);
  };

  const handleRemoveProduct = (index) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...products];
    updatedProducts[index] = {
      ...updatedProducts[index],
      [field]: field === 'name' ? value : (parseFloat(value) || 0)
    };
    setProducts(updatedProducts);
  };

  const handleSave = async () => {
    if (!merchant.trim()) {
      Alert.alert('Error', 'Por favor ingrese el nombre del comerciante/empresa');
      return;
    }

    if (!date.trim()) {
      Alert.alert('Error', 'Por favor ingrese la fecha');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Error', 'Por favor seleccione una categoría');
      return;
    }

    const validProducts = products.filter(p => p.name.trim());
    if (validProducts.length === 0) {
      Alert.alert('Error', 'Por favor ingrese al menos un producto');
      return;
    }

    const total = calculateTotal();
    if (total <= 0) {
      Alert.alert('Error', 'El monto total debe ser mayor a 0');
      return;
    }

    try {
      // Parse date
      const [day, month, year] = date.split('/');
      const receiptDate = new Date(year, month - 1, day);

      const receiptData = {
        name: merchant.trim(),
        amount: total,
        category: selectedCategory,
        date: receiptDate.toISOString(),
        paymentMethod: paymentMethod || undefined,
        products: validProducts.map(p => ({
          name: p.name.trim(),
          price: parseFloat(p.price) || 0,
          quantity: parseFloat(p.quantity) || 1
        })),
        type: 'Manual',
        status: 'Procesado'
      };

      if (isEditing) {
        await updateReceipt(route.params.receiptId, receiptData);
        Alert.alert('Éxito', 'Recibo actualizado correctamente', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await addReceipt(receiptData);
        Alert.alert('Éxito', 'Gasto guardado correctamente', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      Alert.alert('Error', 'No se pudo guardar el recibo');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.mainTitle}>Añadir gasto manualmente</Text>

          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informacion Basica</Text>

            {/* Merchant/Company */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Comerciante/Empresa <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Introduzca el nombre de la tienda"
                placeholderTextColor="#9CA3AF"
                value={merchant}
                onChangeText={setMerchant}
              />
            </View>

            {/* Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Fecha <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.dateContainer}>
                <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.dateInput}
                  placeholder="dd/mm/aaaa"
                  placeholderTextColor="#9CA3AF"
                  value={date}
                  onChangeText={setDate}
                />
              </View>
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Categoria <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowCategoryModal(true)}
              >
                <Text style={[
                  styles.dropdownText,
                  !selectedCategory && styles.placeholderText
                ]}>
                  {selectedCategory || 'Seleccionar categoria'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Payment Method */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Metodo de pago (Opcional)
              </Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowPaymentModal(true)}
              >
                <Text style={[
                  styles.dropdownText,
                  !paymentMethod && styles.placeholderText
                ]}>
                  {paymentMethod || 'Selecciona el metodo de pago'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Products */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Productos</Text>
            
            {products.map((product, index) => (
              <View key={index} style={styles.productRow}>
                <View style={styles.productNameContainer}>
                  <Text style={styles.productLabel}>Nombre del producto</Text>
                  <TextInput
                    style={styles.productNameInput}
                    placeholder="Nombre/Descripción"
                    placeholderTextColor="#9CA3AF"
                    value={product.name}
                    onChangeText={(value) => handleProductChange(index, 'name', value)}
                  />
                </View>

                <View style={styles.productPriceContainer}>
                  <Text style={styles.productLabel}>Precio</Text>
                  <TextInput
                    style={styles.productPriceInput}
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                    value={product.price.toString()}
                    onChangeText={(value) => handleProductChange(index, 'price', value)}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.productQuantityContainer}>
                  <Text style={styles.productLabel}>Cant.</Text>
                  <TextInput
                    style={styles.productQuantityInput}
                    placeholder="1"
                    placeholderTextColor="#9CA3AF"
                    value={product.quantity.toString()}
                    onChangeText={(value) => handleProductChange(index, 'quantity', value)}
                    keyboardType="numeric"
                  />
                </View>

                <TouchableOpacity
                  style={styles.deleteProductButton}
                  onPress={() => handleRemoveProduct(index)}
                >
                  <Ionicons name="trash-outline" size={20} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addProductButton}
              onPress={handleAddProduct}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addProductButtonText}>Agregar producto</Text>
            </TouchableOpacity>
          </View>

          {/* Total Calculation */}
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Calculo Total:</Text>
            <Text style={styles.totalAmount}>${calculateTotal().toFixed(2)}</Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="save-outline" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Categoría</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={styles.modalOption}
                onPress={() => {
                  setSelectedCategory(cat);
                  setShowCategoryModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Payment Method Modal */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Método de Pago</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method}
                style={styles.modalOption}
                onPress={() => {
                  setPaymentMethod(method);
                  setShowPaymentModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{method}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#DC2626',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  dateInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#111',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: '#111',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  productRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  productNameContainer: {
    flex: 2,
  },
  productPriceContainer: {
    flex: 1,
  },
  productQuantityContainer: {
    flex: 0.8,
  },
  productLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  productNameInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111',
  },
  productPriceInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111',
    textAlign: 'center',
  },
  productQuantityInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111',
    textAlign: 'center',
  },
  deleteProductButton: {
    padding: 12,
    justifyContent: 'center',
    marginTop: 20,
  },
  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  addProductButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3A8A',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  modalOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#111',
  },
});
