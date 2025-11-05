import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ExpenseContext = createContext();

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense debe usarse dentro de ExpenseProvider');
  }
  return context;
};

export const ExpenseProvider = ({ children }) => {
  const [receipts, setReceipts] = useState([]);
  const [categories, setCategories] = useState([
    { name: 'Alimentos', percentage: 0, amount: 0, color: '#6B7FED' },
    { name: 'Transporte', percentage: 0, amount: 0, color: '#A855F7' },
    { name: 'Equipo de oficina', percentage: 0, amount: 0, color: '#EC4899' },
    { name: 'Servicios', percentage: 0, amount: 0, color: '#F59E0B' },
    { name: 'Otros', percentage: 0, amount: 0, color: '#10B981' }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReceipts();
  }, []);

  useEffect(() => {
    calculateCategories();
  }, [receipts]);

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

  const saveReceipts = async (newReceipts) => {
    try {
      await AsyncStorage.setItem('receipts', JSON.stringify(newReceipts));
      setReceipts(newReceipts);
    } catch (error) {
      console.error('Error al guardar recibos:', error);
      throw error;
    }
  };

  const addReceipt = async (receipt) => {
    const newReceipt = {
      ...receipt,
      id: Date.now(),
      date: new Date().toISOString(),
      status: 'Procesado'
    };
    const updatedReceipts = [newReceipt, ...receipts];
    await saveReceipts(updatedReceipts);
  };

  const deleteReceipt = async (id) => {
    const updatedReceipts = receipts.filter(r => r.id !== id);
    await saveReceipts(updatedReceipts);
  };

  const updateReceipt = async (id, updatedData) => {
    const updatedReceipts = receipts.map(r => 
      r.id === id ? { ...r, ...updatedData } : r
    );
    await saveReceipts(updatedReceipts);
  };

  const calculateCategories = () => {
    const total = receipts.reduce((sum, r) => sum + r.amount, 0);
    const categoryTotals = {};

    receipts.forEach(receipt => {
      if (!categoryTotals[receipt.category]) {
        categoryTotals[receipt.category] = 0;
      }
      categoryTotals[receipt.category] += receipt.amount;
    });

    const updatedCategories = categories.map(cat => ({
      ...cat,
      amount: categoryTotals[cat.name] || 0,
      percentage: total > 0 
        ? Math.round((categoryTotals[cat.name] || 0) / total * 100) 
        : 0
    }));

    setCategories(updatedCategories);
  };

  const getTotalExpenses = () => {
    return receipts.reduce((sum, r) => sum + r.amount, 0);
  };

  const getAveragePerReceipt = () => {
    const total = getTotalExpenses();
    return receipts.length > 0 ? total / receipts.length : 0;
  };

  const getReceiptsByCategory = (category) => {
    return receipts.filter(r => r.category === category);
  };

  const getReceiptsByDateRange = (startDate, endDate) => {
    return receipts.filter(r => {
      const receiptDate = new Date(r.date);
      return receiptDate >= startDate && receiptDate <= endDate;
    });
  };

  const clearAllReceipts = async () => {
    await saveReceipts([]);
  };

  const value = {
    receipts,
    categories,
    loading,
    addReceipt,
    deleteReceipt,
    updateReceipt,
    getTotalExpenses,
    getAveragePerReceipt,
    getReceiptsByCategory,
    getReceiptsByDateRange,
    clearAllReceipts,
    refreshReceipts: loadReceipts
  };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
};