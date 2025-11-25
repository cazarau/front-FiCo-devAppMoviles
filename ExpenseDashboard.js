/**
 * Pantalla Principal del Dashboard de Gastos
 * 
 * Este componente es la pantalla principal de la aplicación después del login.
 * Muestra un resumen completo de los gastos del usuario incluyendo:
 * - Total de gastos con cambio porcentual
 * - Acciones rápidas (ver recibos, generar reportes, agregar gastos)
 * - Promedio por recibo
 * - Distribución de gastos por categoría
 * - Lista de recibos recientes
 * 
 * Características:
 * - Pull-to-refresh para actualizar datos
 * - Navegación a todas las pantallas secundarias
 * - Cierre de sesión
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
  Alert,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useExpense } from './ExpenseContext';

export default function ExpenseDashboard({ navigation }) {

  // === Estados del componente ===
  const [username, setUsername] = useState('Usuario');
  const [refreshing, setRefreshing] = useState(false);
  
  /**
   * Porcentaje de cambio respecto al mes anterior
   * TODO: Este valor es estático, debería calcularse comparando con datos históricos
   */
  const [percentageChange] = useState(12.5);

  // Obtener datos y funciones del contexto global
  const {
    receipts,
    categories,
    getTotalExpenses,
    getAveragePerReceipt,
    loading,
    refreshReceipts
  } = useExpense();

  /**
   * Efecto: Cargar datos del usuario al montar el componente
   */
  useEffect(() => {
    loadUserData();
  }, []);

  /**
   * Cargar nombre de usuario desde AsyncStorage
   * 
   * Recupera el username guardado en el login y actualiza el estado.
   * Si no existe username, mantiene el valor por defecto 'Usuario'.
   */
  const loadUserData = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem('username');
      if (storedUsername) {
        setUsername(storedUsername);
      }
    } catch (error) {
      console.error('Error al cargar usuario:', error);
    }
  };

  /**
   * Manejador del pull-to-refresh
   * 
   * Actualiza los datos de recibos desde AsyncStorage cuando
   * el usuario hace un gesto de "jalar hacia abajo" en la pantalla.
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshReceipts();
    setRefreshing(false);
  };

  /**
   * Manejador de cierre de sesión
   * 
   * Muestra un diálogo de confirmación antes de cerrar sesión.
   * Si el usuario confirma:
   * - Elimina el username de AsyncStorage
   * - Navega a la pantalla de Login (replace para no poder volver)
   */
  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('username');
            navigation.replace('Login');
          }
        }
      ]
    );
  };

  // === Cálculos de datos para mostrar ===
  
  /**
   * Obtener solo los 3 recibos más recientes para mostrar en el dashboard
   */
  const recentReceipts = receipts.slice(0, 3);
  
  /**
   * Total de gastos (suma de todos los montos)
   */
  const totalExpenses = getTotalExpenses();
  
  /**
   * Promedio de gasto por recibo
   */
  const averagePerReceipt = getAveragePerReceipt();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* === Header === */}
        {/* Barra superior con logo, bienvenida y botones de usuario */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Logo de la aplicación (teléfono estilizado) */}
            <View style={styles.phoneIcon}>
              <View style={styles.phoneScreen}>
                <View style={styles.phoneBar} />
                <View style={styles.phoneBar} />
                <View style={styles.phoneBar} />
              </View>
            </View>
            <Text style={styles.welcomeText}>Bienvenido, {username}</Text>
          </View>
          <View style={styles.headerRight}>
            {/* Botón de cerrar sesión */}
            <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#666" />
            </TouchableOpacity>
            {/* Avatar con inicial del usuario */}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {username.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* === Tarjeta de Total de Gastos === */}
        {/* Muestra el monto total y el porcentaje de cambio */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Total de gastos</Text>
            <Text style={styles.currencySymbol}>$</Text>
          </View>
          <Text style={styles.totalAmount}>${totalExpenses.toFixed(2)}</Text>
          <Text style={styles.changeText}>
            +{percentageChange}% desde el mes pasado
          </Text>
        </View>

        {/* === Tarjeta de Acciones === */}
        {/* Botones de navegación a las funcionalidades principales */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Acciones</Text>
          
          {/* Botón: Ver todos los recibos */}
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => navigation.navigate('AllReceipts')}
          >
            <Ionicons name="document-text-outline" size={20} color="#333" />
            <Text style={styles.actionButtonText}>Ver todos los recibos</Text>
          </TouchableOpacity>

          {/* Botón: Generar reporte */}
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => navigation.navigate('Report')}
          >
            <Ionicons name="bar-chart-outline" size={20} color="#333" />
            <Text style={styles.actionButtonText}>Generar reporte</Text>
          </TouchableOpacity>

          {/* Botón: Entrada manual (estilo destacado en verde) */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.manualEntryButton]} 
            onPress={() => navigation.navigate('ManualEntry')}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={[styles.actionButtonText, styles.whiteText]}>
              Entrada manual
            </Text>
          </TouchableOpacity>

          {/* Botón: Escanear ticket (estilo destacado en azul) */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.scanButton]} 
            onPress={() => navigation.navigate('ScanTicket')}
          >
            <Ionicons name="camera-outline" size={20} color="#fff" />
            <Text style={[styles.actionButtonText, styles.whiteText]}>
              Escanear ticket
            </Text>
          </TouchableOpacity>
        </View>

        {/* === Tarjeta de Promedio por Recibo === */}
        {/* Muestra el gasto promedio calculado */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Promedio por recibo</Text>
            <Ionicons name="trending-up" size={20} color="#666" />
          </View>
          <Text style={styles.averageAmount}>
            ${averagePerReceipt.toFixed(2)}
          </Text>
          <Text style={styles.subtitle}>Por compra</Text>
        </View>

        {/* === Tarjeta de Gastos por Categoría === */}
        {/* Lista de categorías con sus montos y porcentajes */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Gastos por categoría</Text>
          <Text style={styles.subtitle}>Tu distribución de gastos en el mes</Text>
          
          <View style={styles.categoriesList}>
            {categories.map((category, index) => (
              <View key={index} style={styles.categoryItem}>
                {/* Lado izquierdo: punto de color y nombre de categoría */}
                <View style={styles.categoryLeft}>
                  <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                  <Text style={styles.categoryName}>{category.name}</Text>
                </View>
                {/* Lado derecho: porcentaje y monto */}
                <View style={styles.categoryRight}>
                  <Text style={styles.categoryPercentage}>{category.percentage}%</Text>
                  <Text style={styles.categoryAmount}>
                    ${category.amount.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* === Tarjeta de Recibos Recientes === */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recibos recientes</Text>
          <Text style={styles.subtitle}>Los últimos recibos procesados</Text>
          
          {/* Contador de tickets procesados este mes */}
          <View style={styles.ticketsCounter}>
            <Text style={styles.ticketsNumber}>{receipts.length}</Text>
            <View style={{ flex: 1 }}>
              <View style={styles.ticketsBadge}>
                <Ionicons name="checkmark" size={10} color="#fff" />
                <Text style={styles.ticketsBadgeText}>Este mes</Text>
              </View>
              <Text style={styles.ticketsLabel}>Tickets procesados</Text>
            </View>
            <View style={styles.ticketsIcon}>
              <Ionicons name="document-text-outline" size={20} color="#666" />
            </View>
          </View>

          {/* Contenido condicional: Estado vacío o lista de recibos */}
          {recentReceipts.length === 0 ? (
            // === Estado Vacío ===
            // Se muestra cuando no hay recibos registrados
            <View style={styles.emptyReceipts}>
              <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No hay recibos aún</Text>
              <TouchableOpacity 
                style={styles.addFirstButton}
                onPress={() => navigation.navigate('ManualEntry')}
              >
                <Text style={styles.addFirstButtonText}>Agregar primer gasto</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // === Lista de Recibos Recientes ===
            <>
              {recentReceipts.map((receipt) => (
                <View key={receipt.id} style={styles.receiptItem}>
                  {/* Icono del recibo */}
                  <View style={styles.receiptIcon}>
                    <Ionicons name="document-text-outline" size={24} color="#666" />
                  </View>
                  {/* Información del recibo */}
                  <View style={styles.receiptInfo}>
                    <Text style={styles.receiptName}>{receipt.name}</Text>
                    <Text style={styles.receiptCategory}>{receipt.category}</Text>
                  </View>
                  {/* Monto y estado */}
                  <View style={styles.receiptRight}>
                    <Text style={styles.receiptAmount}>
                      ${receipt.amount.toFixed(2)}
                    </Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>{receipt.status}</Text>
                    </View>
                  </View>
                </View>
              ))}

              {/* Botón para ver todos los recibos */}
              <TouchableOpacity 
                style={styles.viewAllButton} 
                onPress={() => navigation.navigate('AllReceipts')}
              >
                <Text style={styles.viewAllText}>Ver todos</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Espaciado inferior */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Estilos del componente ExpenseDashboard
 * 
 * Organización:
 * - Contenedores principales
 * - Header y navegación
 * - Tarjetas (cards)
 * - Botones de acción
 * - Categorías
 * - Recibos
 * - Estados y variaciones
 */
const styles = StyleSheet.create({
  // === Contenedores principales ===
  container: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
  
  // === Header ===
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  phoneIcon: {
    width: 40,
    height: 48,
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    padding: 4,
    justifyContent: 'center',
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 4,
    padding: 6,
    gap: 3,
  },
  phoneBar: {
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#86EFAC',
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  
  // === Tarjetas (Cards) ===
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  currencySymbol: {
    fontSize: 24,
    color: '#9CA3AF',
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  changeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  
  // === Botones de acción ===
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  manualEntryButton: {
    backgroundColor: '#4ADE80',
  },
  scanButton: {
    backgroundColor: '#1E3A8A',
  },
  whiteText: {
    color: '#fff',
  },
  
  // === Promedio ===
  averageAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111',
    marginTop: 8,
    marginBottom: 4,
  },
  
  // === Categorías ===
  categoriesList: {
    gap: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    fontSize: 15,
    color: '#333',
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  categoryPercentage: {
    fontSize: 15,
    color: '#6B7280',
    width: 40,
    textAlign: 'right',
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    width: 80,
    textAlign: 'right',
  },
  
  // === Contador de tickets ===
  ticketsCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  ticketsNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111',
  },
  ticketsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9CA3AF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
    gap: 4,
    alignSelf: 'flex-start',
  },
  ticketsBadgeText: {
    color: '#fff',
    fontSize: 12,
  },
  ticketsLabel: {
    fontSize: 14,
    color: '#111',
    fontWeight: '500',
  },
  ticketsIcon: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  
  // === Estado vacío ===
  emptyReceipts: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 16,
  },
  addFirstButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // === Items de recibo ===
  receiptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  receiptIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptInfo: {
    flex: 1,
  },
  receiptName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  receiptCategory: {
    fontSize: 14,
    color: '#6B7280',
  },
  receiptRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  receiptAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  statusBadge: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  viewAllButton: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginTop: 4,
  },
  viewAllText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});