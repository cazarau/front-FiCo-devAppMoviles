/**
 * Pantalla de Todos los Recibos
 * 
 * Esta pantalla muestra una lista completa de todos los recibos registrados
 * con funcionalidades avanzadas de búsqueda y filtrado:
 * - Búsqueda por nombre de establecimiento
 * - Filtros por categoría
 * - Filtros por tipo (Factura/Manual)
 * - Filtros por rango de fechas
 * - Filtros por rango de montos
 * - Botón para agregar nuevos recibos manualmente
 * - Navegación a detalles de cada recibo
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
  StatusBar,
  TextInput,
  Alert,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useExpense } from './ExpenseContext';

export default function AllReceiptsScreen({ navigation }) {
  // Obtener funciones del contexto global
  const { receipts, deleteReceipt } = useExpense();
  
  // === Estados de búsqueda y filtros ===
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedType, setSelectedType] = useState('Todas');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  /**
   * Opciones de categorías disponibles para filtrar
   * 'Todas' significa sin filtro de categoría
   */
  const categories = ['Todas', 'Alimentos', 'Transporte', 'Equipo de oficina', 'Servicios', 'Otros'];
  
  /**
   * Tipos de recibos disponibles para filtrar
   * 'Todas' significa sin filtro de tipo
   */
  const types = ['Todas', 'Factura', 'Manual'];

  /**
   * Recibos filtrados según los criterios activos
   * 
   * Aplica múltiples filtros en cascada:
   * 1. Filtro de búsqueda (por nombre)
   * 2. Filtro de categoría
   * 3. Filtro de tipo
   * 4. Filtro de rango de fechas
   * 5. Filtro de rango de montos
   */
  const filteredReceipts = receipts.filter(receipt => {
    // Filtro 1: Búsqueda por nombre de establecimiento
    if (searchQuery && !receipt.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Filtro 2: Categoría
    if (selectedCategory !== 'Todas' && receipt.category !== selectedCategory) {
      return false;
    }

    // Filtro 3: Tipo (Factura/Manual)
    const receiptType = receipt.type || 'Manual';
    if (selectedType !== 'Todas' && receiptType !== selectedType) {
      return false;
    }

    // Filtro 4: Rango de fechas
    if (startDate || endDate) {
      const receiptDate = new Date(receipt.date);
      if (startDate) {
        const start = new Date(startDate);
        if (receiptDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59); // Incluir todo el día final
        if (receiptDate > end) return false;
      }
    }

    // Filtro 5: Rango de montos
    if (minAmount && receipt.amount < parseFloat(minAmount)) {
      return false;
    }
    if (maxAmount && receipt.amount > parseFloat(maxAmount)) {
      return false;
    }

    return true; // Pasa todos los filtros
  });

  /**
   * Formatear fecha a formato local español
   * 
   * @param {string} dateString - Fecha en formato ISO
   * @returns {string} Fecha formateada como dd/mm/yyyy
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  /**
   * Navegar a los detalles de un recibo específico
   * 
   * @param {Object} receipt - Objeto del recibo a ver
   */
  const handleViewDetails = (receipt) => {
    navigation.navigate('ReceiptDetails', { receiptId: receipt.id });
  };

  /**
   * Navegar a la pantalla de entrada manual
   */
  const handleAddManually = () => {
    navigation.navigate('ManualEntry');
  };

  /**
   * Limpiar todos los filtros activos
   * 
   * Reinicia todos los estados de filtros a sus valores por defecto.
   */
  const clearFilters = () => {
    setSelectedCategory('Todas');
    setSelectedType('Todas');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="dark-content" />
      
      {/* === Header === */}
      {/* Barra superior con navegación y botón de agregar */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#111" />
          <Text style={styles.backText}>Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Recibos</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddManually}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Agregar Manualmente</Text>
        </TouchableOpacity>
      </View>

      {/* === Barra de Búsqueda === */}
      {/* Input para buscar por nombre de establecimiento */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre del establecimiento"
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* === Botón de Filtros === */}
      {/* Toggle para mostrar/ocultar panel de filtros avanzados */}
      <TouchableOpacity 
        style={styles.filterButton}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Ionicons name="filter" size={20} color="#6B7280" />
        <Text style={styles.filterButtonText}>Filtros</Text>
        <Ionicons 
          name={showFilters ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#6B7280" 
        />
      </TouchableOpacity>

      {/* === Panel de Filtros === */}
      {/* Renderizado condicional: solo visible cuando showFilters es true */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          {/* Filtro por Categoría */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Categoría</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    selectedCategory === cat && styles.categoryChipSelected
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    selectedCategory === cat && styles.categoryChipTextSelected
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Filtro por Tipo */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Tipo</Text>
            <View style={styles.typeButtonsContainer}>
              {types.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    selectedType === type && styles.typeButtonSelected
                  ]}
                  onPress={() => setSelectedType(type)}
                >
                  <Text style={[
                    styles.typeButtonText,
                    selectedType === type && styles.typeButtonTextSelected
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Filtro por Rango de Monto */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Rango por monto total</Text>
            <View style={styles.amountRangeContainer}>
              {/* Input de monto mínimo */}
              <View style={styles.amountInputWrapper}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="Mínimo"
                  placeholderTextColor="#9CA3AF"
                  value={minAmount}
                  onChangeText={setMinAmount}
                  keyboardType="decimal-pad"
                />
              </View>
              <Text style={styles.amountDash}>-</Text>
              {/* Input de monto máximo */}
              <View style={styles.amountInputWrapper}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="Máximo"
                  placeholderTextColor="#9CA3AF"
                  value={maxAmount}
                  onChangeText={setMaxAmount}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          {/* Botón para limpiar todos los filtros */}
          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* === Contador de Resultados === */}
      {/* Muestra cuántos recibos cumplen con los filtros actuales */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredReceipts.length} recibo{filteredReceipts.length !== 1 ? 's' : ''} encontrado{filteredReceipts.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* === Lista de Recibos === */}
      <ScrollView style={styles.receiptsList} showsVerticalScrollIndicator={false}>
        {filteredReceipts.length === 0 ? (
          // === Estado Vacío ===
          // Se muestra cuando no hay recibos que coincidan con los filtros
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No se encontraron recibos</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || selectedCategory !== 'Todas' || minAmount || maxAmount
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Agrega tu primer recibo para comenzar'}
            </Text>
          </View>
        ) : (
          // === Lista de Recibos Filtrados ===
          // Mapea cada recibo a una tarjeta interactiva
          filteredReceipts.map((receipt) => (
            <TouchableOpacity 
              key={receipt.id} 
              style={styles.receiptCard}
              onPress={() => handleViewDetails(receipt)}
              activeOpacity={0.7}
            >
              {/* Información del lado izquierdo */}
              <View style={styles.receiptLeft}>
                <View style={styles.receiptHeader}>
                  <Text style={styles.receiptName}>{receipt.name}</Text>
                  {/* Badge del tipo de recibo */}
                  <View style={[
                    styles.typeBadge,
                    (receipt.type || 'Manual') === 'Factura' ? styles.facturaBadge : styles.manualBadge
                  ]}>
                    <Text style={styles.typeBadgeText}>
                      {receipt.type || 'Manual'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.receiptCategory}>{receipt.category}</Text>
                <Text style={styles.receiptDate}>{formatDate(receipt.date)}</Text>
              </View>
              {/* Información del lado derecho */}
              <View style={styles.receiptRight}>
                <Text style={styles.receiptAmount}>
                  ${receipt.amount.toFixed(2)}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          ))
        )}
        {/* Espaciado inferior */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Estilos del componente AllReceiptsScreen
 * 
 * Organización:
 * - Contenedores principales
 * - Header
 * - Búsqueda
 * - Filtros
 * - Lista de recibos
 * - Estados y variaciones
 */
const styles = StyleSheet.create({
  // === Contenedor principal ===
  container: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
  
  // === Header ===
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
    zIndex: -1, // Para que no interfiera con los botones
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // === Búsqueda ===
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111',
  },
  
  // === Botón de filtros ===
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  // === Panel de filtros ===
  filtersPanel: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    marginBottom: 8,
  },
  
  // Filtro de categorías (horizontal scroll)
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#fff',
  },
  
  // Filtro de tipos (botones)
  typeButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  typeButtonTextSelected: {
    color: '#fff',
  },
  
  // Filtro de rango de montos
  amountRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amountInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  currencySymbol: {
    fontSize: 16,
    color: '#6B7280',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    color: '#111',
  },
  amountDash: {
    fontSize: 16,
    color: '#6B7280',
  },
  clearFiltersButton: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  clearFiltersText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // === Contador de resultados ===
  resultsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  // === Lista de recibos ===
  receiptsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  receiptCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  receiptLeft: {
    flex: 1,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  receiptName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    flex: 1,
  },
  receiptCategory: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  receiptDate: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  receiptRight: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  
  // Badges de tipo
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  facturaBadge: {
    backgroundColor: '#1E3A8A',
  },
  manualBadge: {
    backgroundColor: '#10B981',
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  receiptAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  
  // === Estado vacío ===
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});