import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ExpenseProvider } from './ExpenseContext';

import LoginScreen from './LoginScreen';
import ExpenseDashboard from './ExpenseDashboard';
import AllReceiptsScreen from './AllReceiptsScreen';
import ManualEntryScreen from './ManualEntryScreen';
import ScanTicketScreen from './ScanTicketScreen';
import ReportScreen from './ReportScreen';
import ReceiptDetailsScreen from './ReceiptDetailsScreen';

const Stack = createNativeStackNavigator();

function AppNavigator({ isLoggedIn }) {
  return (
    <Stack.Navigator initialRouteName={isLoggedIn ? "ExpenseDashboard" : "Login"}>
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ title: 'Iniciar sesión' }} 
      />
      <Stack.Screen 
        name="ExpenseDashboard" 
        component={ExpenseDashboard} 
        options={{ 
          title: 'Gastos',
          headerShown: false 
        }} 
      />
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
      <Stack.Screen 
        name="ScanTicket" 
        component={ScanTicketScreen} 
        options={{ 
          title: 'Escanear Ticket',
          headerShown: false
        }} 
      />
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
      <Stack.Screen 
        name="ReceiptDetails" 
        component={ReceiptDetailsScreen} 
        options={{ 
          title: 'Detalles del Recibo',
          headerShown: false,
        }} 
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(null); 

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

  if (isLoggedIn === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color='#3B82F6'/>
      </View>
    );
  }

  return (
    <ExpenseProvider>
      <NavigationContainer>
        <AppNavigator isLoggedIn={isLoggedIn} />
      </NavigationContainer>
    </ExpenseProvider>
  );
}