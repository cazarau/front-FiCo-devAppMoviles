/**
 * Pantalla de Detalles del Recibo
 * 
 * Muestra información detallada de un recibo específico incluyendo:
 * - Imagen del recibo (si existe)
 * - Información general (tienda, monto, fecha, categoría, método de pago)
 * - Lista de productos con cantidades y precios
 * - Opciones para editar o eliminar el recibo
 * - Función para compartir/descargar la imagen
 * 
 * @component
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpense } from './ExpenseContext';
import * as Sharing from 'expo-sharing';

export default function ReceiptDetailsScreen({ route, navigation }) {
  // Obtener el ID del recibo desde los parámetros de navegación
  const { receiptId } = route.params;
  const { receipts, deleteReceipt, updateReceipt } = useExpense();
  const [receipt, setReceipt] = useState(null);

  /**
   * Efecto: Buscar y cargar el recibo cuando cambie el ID o la lista de recibos
   */
  useEffect(() => {
    const foundReceipt = receipts.find(r => r.id === receiptId);
    setReceipt(foundReceipt);
  }, [receiptId, receipts]);

  // Pantalla de carga mientras se busca el recibo
  if (!receipt) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  /**
   * Formatear fecha a formato legible en español
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  /**
   * Navegar a la pantalla de edición con los datos del recibo
   */
  const handleEdit = () => {
    navigation.navigate('ManualEntry', { receiptId: receipt.id, receipt });
  };

  /**
   * Eliminar recibo con confirmación
   */
  const handleDelete = () => {
    Alert.alert(
      'Eliminar Recibo',
      '¿Estás seguro de que deseas eliminar este recibo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteReceipt(receipt.id);
            navigation.goBack();
          }
        }
      ]
    );
  };

  /**
   * Compartir o descargar la imagen del recibo
   */
  const handleDownloadImage = async () => {
    if (receipt.imageUri) {
      try {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable && receipt.imageUri) {
          await Sharing.shareAsync(receipt.imageUri);
        } else {
          Alert.alert('Error', 'No se puede compartir la imagen');
        }
      } catch (error) {
        console.error('Error al compartir imagen:', error);
        Alert.alert('Error', 'No se pudo compartir la imagen');
      }
    } else {
      Alert.alert('Información', 'Este recibo no tiene imagen asociada');
    }
  };

  // Extraer datos del recibo
  const products = receipt.products || [];
  const receiptType = receipt.type || 'Manual';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* === Header === */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#111" />
          <Text style={styles.backText}>Recibos</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Detalles</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* === Tarjeta de Imagen === */}
        <View style={styles.imageCard}>
          <Text style={styles.sectionTitle}>Imagen del recibo</Text>
          <View style={styles.imageContainer}>
            {receipt.imageUri ? (
              <Image 
                source={{ uri: receipt.imageUri }} 
                style={styles.receiptImage}
                resizeMode="contain"
              />
            ) : (
              // Placeholder cuando no hay imagen
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={48} color="#9CA3AF" />
              </View>
            )}
            {/* Botón de descarga superpuesto */}
            <TouchableOpacity 
              style={styles.downloadButton}
              onPress={handleDownloadImage}
            >
              <Ionicons name="download-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* === Tarjeta de Información === */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.sectionTitle}>Información</Text>
            {/* Badge del tipo de recibo */}
            <View style={[
              styles.typeBadge,
              receiptType === 'Factura' ? styles.facturaBadge : styles.manualBadge
            ]}>
              <Text style={styles.typeBadgeText}>{receiptType}</Text>
            </View>
          </View>

          {/* Filas de información */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tienda</Text>
            <Text style={styles.infoValue}>{receipt.name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Monto total</Text>
            <Text style={styles.infoValue}>${receipt.amount.toFixed(2)}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoRowLeft}>
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>Fecha</Text>
            </View>
            <Text style={styles.infoValue}>{formatDate(receipt.date)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Categoría</Text>
            <Text style={styles.infoValue}>{receipt.category}</Text>
          </View>

          {receipt.paymentMethod && (
            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <Ionicons name="wallet-outline" size={20} color="#6B7280" />
                <Text style={styles.infoLabel}>Método de pago</Text>
              </View>
              <Text style={styles.infoValue}>{receipt.paymentMethod}</Text>
            </View>
          )}
        </View>

        {/* === Tarjeta de Productos === */}
        {/* Solo se muestra si hay productos */}
        {products.length > 0 && (
          <View style={styles.productsCard}>
            <Text style={styles.sectionTitle}>Productos</Text>
            <View style={styles.productsTable}>
              {/* Encabezado de la tabla */}
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderText}>Cantidad</Text>
                <Text style={styles.tableHeaderText}>Precio Unitario</Text>
                <Text style={styles.tableHeaderText}>Precio</Text>
              </View>
              {/* Filas de productos */}
              {products.map((product, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{product.quantity || 1}</Text>
                  <Text style={styles.tableCell}>
                    ${(product.price || 0).toFixed(2)}
                  </Text>
                  <Text style={styles.tableCell}>
                    ${((product.price || 0) * (product.quantity || 1)).toFixed(2)}
                  </Text>
                </View>
              ))}
              {/* Fila del total */}
              <View style={[styles.tableRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>
                  ${receipt.amount.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* === Botones de Acción === */}
        <View style={styles.actionsContainer}>
          {/* Botón Editar */}
          <TouchableOpacity 
            style={styles.editButton}
            onPress={handleEdit}
          >
            <Ionicons name="pencil-outline" size={20} color="#fff" />
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>

          {/* Botón Eliminar */}
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.deleteButtonText}>Eliminar</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Estilos del componente ReceiptDetailsScreen
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: {
    fontSize: 16,
    color: '#111',
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 80,
  },
  scrollView: {
    flex: 1,
  },
  imageCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  receiptImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#1E3A8A',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  facturaBadge: {
    backgroundColor: '#1E3A8A',
  },
  manualBadge: {
    backgroundColor: '#10B981',
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  productsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
  },
  productsTable: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    color: '#111',
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    flex: 2,
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  totalAmount: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    textAlign: 'right',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3A8A',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});