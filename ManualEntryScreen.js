/**
 * Pantalla de Entrada Manual de Gastos
 * 
 * Este componente permite al usuario crear o editar gastos manualmente.
 * Características principales:
 * - Formulario completo para datos del recibo (comerciante, fecha, categoría, método de pago)
 * - Gestión dinámica de productos (agregar/eliminar múltiples productos)
 * - Cálculo automático del total basado en productos
 * - Validación de campos obligatorios
 * - Modales para selección de categoría y método de pago
 * - Modo edición: permite actualizar recibos existentes
 * 
 * @component
 */

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
  // Obtener funciones del contexto global
  const { addReceipt, updateReceipt, receipts } = useExpense();
  
  /**
   * Determinar si estamos en modo edición
   * Si route.params contiene receiptId, estamos editando un recibo existente
   */
  const isEditing = route?.params?.receiptId;

  // === Estados del formulario ===
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  
  /**
   * Array de productos
   * Cada producto tiene: name, price, quantity
   * Se inicializa con un producto vacío por defecto
   */
  const [products, setProducts] = useState([
    { name: '', price: 0, quantity: 1 }
  ]);
  
  // Estados para controlar la visibilidad de los modales
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  /**
   * Categorías disponibles para clasificar gastos
   * Estas deben coincidir con las categorías definidas en ExpenseContext
   */
  const categories = [
    'Alimentos',
    'Transporte',
    'Equipo de oficina',
    'Servicios',
    'Otros'
  ];

  /**
   * Métodos de pago disponibles
   */
  const paymentMethods = [
    'Efectivo',
    'Tarjeta de crédito',
    'Tarjeta de débito',
    'Transferencia',
    'Otro'
  ];

  /**
   * Efecto: Cargar datos del recibo si estamos en modo edición
   * 
   * Cuando se recibe un receiptId en los parámetros de navegación,
   * se cargan todos los datos del recibo para pre-llenar el formulario.
   */
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

  /**
   * Formatear fecha de ISO a formato dd/mm/yyyy
   * 
   * Convierte la fecha almacenada en formato ISO (usado internamente)
   * al formato esperado por el usuario en el input.
   * 
   * @param {string} dateString - Fecha en formato ISO
   * @returns {string} Fecha en formato dd/mm/yyyy
   */
  const formatDateInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  /**
   * Calcular el total del recibo
   * 
   * Suma el precio * cantidad de todos los productos.
   * Maneja valores no numéricos convirtiéndolos a 0.
   * 
   * @returns {number} Total calculado
   */
  const calculateTotal = () => {
    return products.reduce((sum, product) => {
      const price = parseFloat(product.price) || 0;
      const quantity = parseFloat(product.quantity) || 1;
      return sum + (price * quantity);
    }, 0);
  };

  /**
   * Agregar un nuevo producto vacío a la lista
   * 
   * Permite al usuario agregar múltiples productos al recibo.
   * El nuevo producto se inicializa con valores por defecto.
   */
  const handleAddProduct = () => {
    setProducts([...products, { name: '', price: 0, quantity: 1 }]);
  };

  /**
   * Eliminar un producto de la lista
   * 
   * Remueve el producto en el índice especificado.
   * No permite eliminar si solo hay un producto (mínimo requerido).
   * 
   * @param {number} index - Índice del producto a eliminar
   */
  const handleRemoveProduct = (index) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  /**
   * Actualizar un campo específico de un producto
   * 
   * Permite actualizar name, price o quantity de un producto.
   * Los valores numéricos se parsean automáticamente.
   * 
   * @param {number} index - Índice del producto a actualizar
   * @param {string} field - Campo a actualizar ('name', 'price', 'quantity')
   * @param {string|number} value - Nuevo valor
   */
  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...products];
    updatedProducts[index] = {
      ...updatedProducts[index],
      [field]: field === 'name' ? value : (parseFloat(value) || 0)
    };
    setProducts(updatedProducts);
  };

  /**
   * Guardar el recibo (crear o actualizar)
   * 
   * Valida todos los campos requeridos antes de guardar:
   * 1. Nombre del comerciante no vacío
   * 2. Fecha ingresada
   * 3. Categoría seleccionada
   * 4. Al menos un producto con nombre
   * 5. Total mayor a 0
   * 
   * Si todas las validaciones pasan:
   * - En modo edición: actualiza el recibo existente
   * - En modo creación: agrega un nuevo recibo
   */
  const handleSave = async () => {
    // Validación 1: Nombre del comerciante
    if (!merchant.trim()) {
      Alert.alert('Error', 'Por favor ingrese el nombre del comerciante/empresa');
      return;
    }

    // Validación 2: Fecha
    if (!date.trim()) {
      Alert.alert('Error', 'Por favor ingrese la fecha');
      return;
    }

    // Validación 3: Categoría
    if (!selectedCategory) {
      Alert.alert('Error', 'Por favor seleccione una categoría');
      return;
    }

    // Validación 4: Al menos un producto con nombre
    const validProducts = products.filter(p => p.name.trim());
    if (validProducts.length === 0) {
      Alert.alert('Error', 'Por favor ingrese al menos un producto');
      return;
    }

    // Validación 5: Total mayor a 0
    const total = calculateTotal();
    if (total <= 0) {
      Alert.alert('Error', 'El monto total debe ser mayor a 0');
      return;
    }

    try {
      // Parsear fecha de formato dd/mm/yyyy a objeto Date
      const [day, month, year] = date.split('/');
      const receiptDate = new Date(year, month - 1, day);

      // Construir objeto de datos del recibo
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

      // Guardar según el modo (edición o creación)
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

          {/* === Sección: Información Básica === */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informacion Basica</Text>

            {/* Campo: Comerciante/Empresa */}
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

            {/* Campo: Fecha */}
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

            {/* Campo: Categoría (con modal) */}
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

            {/* Campo: Método de Pago (opcional, con modal) */}
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

          {/* === Sección: Productos === */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Productos</Text>
            
            {/* Lista dinámica de productos */}
            {products.map((product, index) => (
              <View key={index} style={styles.productRow}>
                {/* Nombre del producto */}
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

                {/* Precio */}
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

                {/* Cantidad */}
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

                {/* Botón para eliminar producto */}
                <TouchableOpacity
                  style={styles.deleteProductButton}
                  onPress={() => handleRemoveProduct(index)}
                >
                  <Ionicons name="trash-outline" size={20} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))}

            {/* Botón para agregar más productos */}
            <TouchableOpacity
              style={styles.addProductButton}
              onPress={handleAddProduct}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addProductButtonText}>Agregar producto</Text>
            </TouchableOpacity>
          </View>

          {/* === Sección: Cálculo Total === */}
          {/* Muestra el total calculado en tiempo real */}
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Calculo Total:</Text>
            <Text style={styles.totalAmount}>${calculateTotal().toFixed(2)}</Text>
          </View>

          {/* === Botón de Guardar === */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="save-outline" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* === Modal de Selección de Categoría === */}
      {/* Modal tipo bottom sheet para seleccionar categoría */}
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

      {/* === Modal de Selección de Método de Pago === */}
      {/* Modal tipo bottom sheet para seleccionar método de pago */}
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

/**
 * Estilos del componente ManualEntryScreen
 * 
 * Organización:
 * - Contenedores principales
 * - Secciones del formulario
 * - Campos de entrada
 * - Productos
 * - Modales
 * - Botones
 */
const styles = StyleSheet.create({
  // === Contenedores principales ===
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
  
  // === Secciones ===
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
  
  // === Campos de entrada ===
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
    color: '#DC2626', // Asterisco rojo para campos obligatorios
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
  
  // === Productos ===
  productRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  productNameContainer: {
    flex: 2, // Ocupa más espacio para el nombre
  },
  productPriceContainer: {
    flex: 1,
  },
  productQuantityContainer: {
    flex: 0.8, // Menos espacio para cantidad
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
    marginTop: 20, // Alineado con los inputs
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
  
  // === Total ===
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
  
  // === Botón guardar ===
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
  
  // === Modales ===
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // Fondo oscuro semi-transparente
    justifyContent: 'flex-end', // Bottom sheet style
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%', // Máximo 50% de la pantalla
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