/**
 * Componente raíz de la aplicación
 * 
 * Este archivo configura la navegación principal de la aplicación y maneja:
 * - Verificación del estado de autenticación del usuario
 * - Configuración del contexto global de gastos (ExpenseProvider)
 * - Navegación entre pantallas usando React Navigation
 * - Pantalla de carga mientras se verifica el estado de autenticación
 * 
 * @component
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Contexto global para gestión de gastos
import { ExpenseProvider } from './ExpenseContext';

import LoginScreen from './LoginScreen';
import ExpenseDashboard from './ExpenseDashboard';
import AllReceiptsScreen from './AllReceiptsScreen';
import ManualEntryScreen from './ManualEntryScreen';
import ScanTicketScreen from './ScanTicketScreen';
import ReportScreen from './ReportScreen';
import ReceiptDetailsScreen from './ReceiptDetailsScreen';


const Stack = createNativeStackNavigator();

/**
 * Componente de navegación principal
 * 
 * Configura todas las rutas de la aplicación y determina la pantalla inicial
 * basándose en el estado de autenticación del usuario.
 * 
 * @param {boolean} isLoggedIn - Estado de autenticación del usuario
 * @returns {JSX.Element} Stack Navigator configurado
 */

function AppNavigator({ isLoggedIn }) {
  return (
    <Stack.Navigator initialRouteName={isLoggedIn ? "ExpenseDashboard" : "Login"}>
      {/* Pantalla de inicio de sesión */}
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ title: 'Iniciar sesión' }} 
      />
      
      {/* Dashboard principal de gastos */}
      <Stack.Screen 
        name="ExpenseDashboard" 
        component={ExpenseDashboard} 
        options={{ 
          title: 'Gastos',
          headerShown: false // Ocultar header para usar header personalizado
        }} 
      />
      
      {/* Pantalla de todos los recibos con filtros */}
      <Stack.Screen 
        name="AllReceipts" 
        component={AllReceiptsScreen} 
        options={{ 
          title: 'Todos los Recibos',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#111',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }} 
      />
      
      {/* Pantalla para entrada manual de gastos */}
      <Stack.Screen 
        name="ManualEntry" 
        component={ManualEntryScreen} 
        options={{ 
          title: 'Nueva Entrada',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#111',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }} 
      />
      
      {/* Pantalla para escanear tickets con la cámara */}
      <Stack.Screen 
        name="ScanTicket" 
        component={ScanTicketScreen} 
        options={{ 
          title: 'Escanear Ticket',
          headerShown: false // Header personalizado en la pantalla
        }} 
      />
      
      {/* Pantalla de generación de reportes */}
      <Stack.Screen 
        name="Report" 
        component={ReportScreen} 
        options={{ 
          title: 'Reporte de Gastos',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#111',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }} 
      />
      
      {/* Pantalla de detalles de un recibo específico */}
      <Stack.Screen 
        name="ReceiptDetails" 
        component={ReceiptDetailsScreen} 
        options={{ 
          title: 'Detalles del Recibo',
          headerShown: false, // Header personalizado
        }} 
      />
    </Stack.Navigator>
  );
}

/**
 * Componente principal de la aplicación
 * 
 * Funcionalidades:
 * 1. Verifica si el usuario está autenticado al iniciar
 * 2. Muestra un indicador de carga durante la verificación
 * 3. Envuelve la aplicación con el ExpenseProvider para gestión de estado global
 * 4. Configura el NavigationContainer para la navegación
 * 
 * @returns {JSX.Element} Aplicación completa con navegación y contexto
 */

export default function App() {
  /**
   * Estado de autenticación
   * null: Verificando autenticación (estado inicial)
   * true: Usuario autenticado
   * false: Usuario no autenticado
   */

  const [isLoggedIn, setIsLoggedIn] = useState(null); 

  /**
   * Efecto: Verificar estado de autenticación al iniciar la app
   * 
   * Busca en AsyncStorage si existe un 'username' guardado
   * para determinar si el usuario ya inició sesión previamente.
   */
  
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem('username');
        if(storedUsername) {
          setIsLoggedIn(true);
          console.log('Usuario autenticado:', storedUsername);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Error al verificar el estado de autenticación: ', error);
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();
  }, []);

  /**
   * Pantalla de carga
   * 
   * Se muestra mientras isLoggedIn es null (verificando autenticación)
   */
  if (isLoggedIn === null) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#F9FAFB' 
      }}>
        <ActivityIndicator size="large" color='#3B82F6'/>
      </View>
    );
  }

  /**
   * Renderizado principal de la aplicación
   * 
   * Estructura:
   * ExpenseProvider: Proporciona estado global de gastos a toda la app
   * └── NavigationContainer: Contenedor de navegación
   *     └── AppNavigator: Stack Navigator con todas las pantallas
   */
  return (
    <ExpenseProvider>
      <NavigationContainer>
        <AppNavigator isLoggedIn={isLoggedIn} />
      </NavigationContainer>
    </ExpenseProvider>
  );
}