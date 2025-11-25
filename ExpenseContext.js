/**
 * Contexto Global de Gestión de Gastos
 * 
 * Este archivo implementa un Context de React para gestionar el estado global
 * de los recibos y gastos en toda la aplicación. Proporciona funciones para:
 * - Agregar, actualizar y eliminar recibos
 * - Calcular estadísticas de gastos por categoría
 * - Persistir datos en AsyncStorage
 * - Consultar recibos por diferentes criterios
 * 
 * @module ExpenseContext
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Crear el contexto
const ExpenseContext = createContext();

/**
 * Hook personalizado para acceder al contexto de gastos
 * 
 * Este hook debe ser usado dentro de componentes envueltos por ExpenseProvider.
 * Lanza un error si se intenta usar fuera del provider.
 * 
 * @returns {Object} Objeto con el estado y funciones del contexto
 * @throws {Error} Si se usa fuera de ExpenseProvider
 * 
 * @example
 * function MiComponente() {
 *   const { receipts, addReceipt } = useExpense();
 *   // ...
 * }
 */
export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense debe usarse dentro de ExpenseProvider');
  }
  return context;
};

/**
 * Provider del Contexto de Gastos
 * 
 * Componente que envuelve la aplicación y proporciona el estado global
 * de gastos y recibos a todos los componentes hijos.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componentes hijos
 * @returns {JSX.Element} Provider con estado de gastos
 */
export const ExpenseProvider = ({ children }) => {
  // === Estados principales ===
  
  /**
   * Array de todos los recibos/gastos
   * @type {Array<Object>}
   */
  const [receipts, setReceipts] = useState([]);
  
  /**
   * Array de categorías con sus montos y porcentajes calculados
   * @type {Array<Object>}
   */
  const [categories, setCategories] = useState([
    { name: 'Alimentos', percentage: 0, amount: 0, color: '#6B7FED' },
    { name: 'Transporte', percentage: 0, amount: 0, color: '#A855F7' },
    { name: 'Equipo de oficina', percentage: 0, amount: 0, color: '#EC4899' },
    { name: 'Servicios', percentage: 0, amount: 0, color: '#F59E0B' },
    { name: 'Otros', percentage: 0, amount: 0, color: '#10B981' }
  ]);
  
  /**
   * Estado de carga para operaciones asíncronas
   * @type {boolean}
   */
  const [loading, setLoading] = useState(true);

  /**
   * Efecto: Cargar recibos desde AsyncStorage al montar el componente
   */
  useEffect(() => {
    loadReceipts();
  }, []);

  /**
   * Efecto: Recalcular categorías cuando los recibos cambien
   * 
   * Cada vez que se agregan, actualizan o eliminan recibos,
   * se recalculan automáticamente los totales y porcentajes por categoría.
   */
  useEffect(() => {
    calculateCategories();
  }, [receipts]);

  /**
   * Cargar recibos desde AsyncStorage
   * 
   * Lee los recibos almacenados localmente y los carga en el estado.
   * Si no hay datos almacenados, el array de recibos queda vacío.
   */
  const loadReceipts = async () => {
    try {
      const storedReceipts = await AsyncStorage.getItem('receipts');
      if (storedReceipts) {
        setReceipts(JSON.parse(storedReceipts));
      }
    } catch (error) {
      console.error('Error al cargar recibos:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Guardar recibos en AsyncStorage
   * 
   * Persiste el array de recibos en el almacenamiento local y actualiza el estado.
   * Esta función es privada y es llamada por las funciones públicas del contexto.
   * 
   * @param {Array<Object>} newReceipts - Array de recibos a guardar
   * @throws {Error} Si falla el guardado en AsyncStorage
   */
  const saveReceipts = async (newReceipts) => {
    try {
      await AsyncStorage.setItem('receipts', JSON.stringify(newReceipts));
      setReceipts(newReceipts);
    } catch (error) {
      console.error('Error al guardar recibos:', error);
      throw error;
    }
  };

  /**
   * Agregar un nuevo recibo
   * 
   * Crea un nuevo recibo con ID único basado en timestamp,
   * fecha actual y estado 'Procesado' por defecto.
   * El nuevo recibo se agrega al inicio del array.
   * 
   * @param {Object} receipt - Datos del recibo a agregar
   * @param {string} receipt.name - Nombre del comerciante
   * @param {number} receipt.amount - Monto total
   * @param {string} receipt.category - Categoría del gasto
   * @param {string} [receipt.paymentMethod] - Método de pago (opcional)
   * @param {Array} [receipt.products] - Lista de productos (opcional)
   * 
   * @example
   * await addReceipt({
   *   name: 'Supermercado',
   *   amount: 150.50,
   *   category: 'Alimentos',
   *   paymentMethod: 'Tarjeta de crédito'
   * });
   */
  const addReceipt = async (receipt) => {
    const newReceipt = {
      ...receipt,
      id: Date.now(), // ID único basado en timestamp
      date: new Date().toISOString(), // Fecha actual en formato ISO
      status: 'Procesado'
    };
    const updatedReceipts = [newReceipt, ...receipts]; // Agregar al inicio
    await saveReceipts(updatedReceipts);
  };

  /**
   * Eliminar un recibo por ID
   * 
   * Filtra el recibo especificado del array y guarda el resultado.
   * 
   * @param {number} id - ID del recibo a eliminar
   * 
   * @example
   * await deleteReceipt(1234567890);
   */
  const deleteReceipt = async (id) => {
    const updatedReceipts = receipts.filter(r => r.id !== id);
    await saveReceipts(updatedReceipts);
  };

  /**
   * Actualizar un recibo existente
   * 
   * Busca el recibo por ID y actualiza sus datos con los proporcionados.
   * Los datos no especificados en updatedData se mantienen sin cambios.
   * 
   * @param {number} id - ID del recibo a actualizar
   * @param {Object} updatedData - Datos a actualizar (spread sobre el recibo existente)
   * 
   * @example
   * await updateReceipt(1234567890, {
   *   amount: 200,
   *   category: 'Transporte'
   * });
   */
  const updateReceipt = async (id, updatedData) => {
    const updatedReceipts = receipts.map(r => 
      r.id === id ? { ...r, ...updatedData } : r
    );
    await saveReceipts(updatedReceipts);
  };

  /**
   * Calcular totales y porcentajes por categoría
   * 
   * Recorre todos los recibos y calcula:
   * - Monto total por categoría
   * - Porcentaje de cada categoría respecto al total
   * 
   * Actualiza el estado 'categories' con los valores calculados.
   */
  const calculateCategories = () => {
    // Calcular monto total de todos los recibos
    const total = receipts.reduce((sum, r) => sum + r.amount, 0);
    
    // Objeto para acumular totales por categoría
    const categoryTotals = {};

    // Sumar montos por cada categoría
    receipts.forEach(receipt => {
      if (!categoryTotals[receipt.category]) {
        categoryTotals[receipt.category] = 0;
      }
      categoryTotals[receipt.category] += receipt.amount;
    });

    // Actualizar categorías con montos y porcentajes calculados
    const updatedCategories = categories.map(cat => ({
      ...cat,
      amount: categoryTotals[cat.name] || 0,
      percentage: total > 0 
        ? Math.round((categoryTotals[cat.name] || 0) / total * 100) 
        : 0
    }));

    setCategories(updatedCategories);
  };

  /**
   * Obtener el total de todos los gastos
   * 
   * @returns {number} Suma total de todos los montos de recibos
   * 
   * @example
   * const total = getTotalExpenses(); // 1234.56
   */
  const getTotalExpenses = () => {
    return receipts.reduce((sum, r) => sum + r.amount, 0);
  };

  /**
   * Obtener el promedio de gasto por recibo
   * 
   * Calcula el monto promedio dividiendo el total entre el número de recibos.
   * Retorna 0 si no hay recibos para evitar división por cero.
   * 
   * @returns {number} Promedio de gasto por recibo
   * 
   * @example
   * const avg = getAveragePerReceipt(); // 123.45
   */
  const getAveragePerReceipt = () => {
    const total = getTotalExpenses();
    return receipts.length > 0 ? total / receipts.length : 0;
  };

  /**
   * Obtener recibos filtrados por categoría
   * 
   * @param {string} category - Nombre de la categoría a filtrar
   * @returns {Array<Object>} Array de recibos de la categoría especificada
   * 
   * @example
   * const foodReceipts = getReceiptsByCategory('Alimentos');
   */
  const getReceiptsByCategory = (category) => {
    return receipts.filter(r => r.category === category);
  };

  /**
   * Obtener recibos en un rango de fechas
   * 
   * Filtra recibos cuya fecha esté entre startDate y endDate (inclusive).
   * 
   * @param {Date} startDate - Fecha inicial del rango
   * @param {Date} endDate - Fecha final del rango
   * @returns {Array<Object>} Array de recibos en el rango especificado
   * 
   * @example
   * const start = new Date('2024-01-01');
   * const end = new Date('2024-01-31');
   * const januaryReceipts = getReceiptsByDateRange(start, end);
   */
  const getReceiptsByDateRange = (startDate, endDate) => {
    return receipts.filter(r => {
      const receiptDate = new Date(r.date);
      return receiptDate >= startDate && receiptDate <= endDate;
    });
  };

  /**
   * Eliminar todos los recibos
   * 
   * Limpia completamente el array de recibos tanto en estado como en AsyncStorage.
   * Útil para funcionalidades de "reset" o "borrar todo".
   * 
   * @example
   * await clearAllReceipts();
   */
  const clearAllReceipts = async () => {
    await saveReceipts([]);
  };

  /**
   * Valor del contexto
   * 
   * Este objeto contiene todo el estado y funciones que estarán disponibles
   * para los componentes que consuman este contexto.
   */
  const value = {
    // Estado
    receipts,
    categories,
    loading,
    
    // Funciones CRUD
    addReceipt,
    deleteReceipt,
    updateReceipt,
    
    // Funciones de consulta
    getTotalExpenses,
    getAveragePerReceipt,
    getReceiptsByCategory,
    getReceiptsByDateRange,
    
    // Funciones de utilidad
    clearAllReceipts,
    refreshReceipts: loadReceipts // Alias para recargar recibos
  };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
};