import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpense } from './ExpenseContext';
import * as Sharing from 'expo-sharing';

export default function ReportScreen({ navigation }) {
  const { receipts, getReceiptsByDateRange } = useExpense();
  const [reportType, setReportType] = useState('basic');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(['Todas']);
  const [reportPreview, setReportPreview] = useState(null);

  const categories = ['Todas', 'Alimentos', 'Transporte', 'Equipo de oficina', 'Servicios', 'Otros'];

  const filteredReceipts = receipts.filter(receipt => {
    // Date range filter
    if (startDate && endDate) {
      const receiptDate = new Date(receipt.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      if (receiptDate < start || receiptDate > end) {
        return false;
      }
    }

    // Category filter
    if (!selectedCategories.includes('Todas') && !selectedCategories.includes(receipt.category)) {
      return false;
    }

    return true;
  });

  const calculateReportData = () => {
    const totalSpent = filteredReceipts.reduce((sum, r) => sum + r.amount, 0);
    const entries = filteredReceipts.length;
    
    // Calculate deposits (positive amounts or separate deposits field)
    const deposits = filteredReceipts
      .filter(r => r.amount > 0 && (r.type === 'Deposit' || false))
      .reduce((sum, r) => sum + r.amount, 0);
    
    const average = entries > 0 ? totalSpent / entries : 0;

    // Calculate expenses by category
    const categoryTotals = {};
    filteredReceipts.forEach(receipt => {
      const cat = receipt.category || 'Otros';
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = 0;
      }
      categoryTotals[cat] += receipt.amount;
    });

    const expensesByCategory = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalSpent,
      entries,
      deposits,
      average,
      expensesByCategory,
      startDate,
      endDate
    };
  };

  const generateReport = () => {
    if (!startDate || !endDate) {
      Alert.alert('Error', 'Por favor seleccione un rango de fechas');
      return;
    }

    const reportData = calculateReportData();
    setReportPreview(reportData);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatDateRange = () => {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startFormatted = start.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
    const endFormatted = end.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${startFormatted} - ${endFormatted}`;
  };

  const handleExportPDF = async () => {
    Alert.alert(
      'Exportar PDF',
      'Funcionalidad de exportación a PDF en desarrollo',
      [{ text: 'OK' }]
    );
  };

  const handleExportExcel = async () => {
    Alert.alert(
      'Exportar Excel',
      'Funcionalidad de exportación a Excel en desarrollo',
      [{ text: 'OK' }]
    );
  };

  const toggleCategory = (category) => {
    if (category === 'Todas') {
      setSelectedCategories(['Todas']);
    } else {
      setSelectedCategories(prev => {
        const newCategories = prev.includes('Todas') 
          ? [category]
          : prev.includes(category)
          ? prev.filter(c => c !== category)
          : [...prev.filter(c => c !== 'Todas'), category];
        return newCategories.length === 0 ? ['Todas'] : newCategories;
      });
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Alimentos': '#6B7FED',
      'Transporte': '#A855F7',
      'Equipo de oficina': '#EC4899',
      'Servicios': '#F59E0B',
      'Otros': '#10B981'
    };
    return colors[category] || '#6B7280';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#111" />
          <Text style={styles.backText}>Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Reportes</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Report Type Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categoria</Text>
        <Text style={styles.sectionSubtitle}>Elige el tipo de reporte a generar</Text>
        
        <TouchableOpacity
          style={[styles.reportTypeCard, reportType === 'basic' && styles.reportTypeCardSelected]}
          onPress={() => setReportType('basic')}
        >
          <Ionicons name="document-text-outline" size={24} color={reportType === 'basic' ? '#3B82F6' : '#6B7280'} />
          <View style={styles.reportTypeContent}>
            <Text style={styles.reportTypeTitle}>Informe contable básico</Text>
            <Text style={styles.reportTypeSubtitle}>Formato contable simple para la contabilidad</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.reportTypeCard, styles.reportTypeCardDisabled]}
          disabled={true}
        >
          <Ionicons name="document-text-outline" size={24} color="#9CA3AF" />
          <View style={styles.reportTypeContent}>
            <Text style={styles.reportTypeTitle}>Proximamente (Deducibles)</Text>
            <Text style={styles.reportTypeSubtitle}>XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Date Range */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rango de fechas</Text>
        <Text style={styles.sectionSubtitle}>Selecciona el periodo para tu reporte</Text>
        
        <View style={styles.dateRangeContainer}>
          <TouchableOpacity style={styles.dateInput}>
            <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
            <Text style={[styles.dateInputText, !startDate && styles.placeholderText]}>
              {startDate ? formatDate(startDate) : 'Fecha inicial'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.dateInput}>
            <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
            <Text style={[styles.dateInputText, !endDate && styles.placeholderText]}>
              {endDate ? formatDate(endDate) : 'Fecha final'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Categories Filter */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categorias</Text>
        <Text style={styles.sectionSubtitle}>Filtrar por categorías</Text>
        
        <View style={styles.categoriesList}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={styles.categoryCheckbox}
              onPress={() => toggleCategory(category)}
            >
              <View style={[
                styles.checkbox,
                selectedCategories.includes(category) && styles.checkboxChecked
              ]}>
                {selectedCategories.includes(category) && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <Text style={styles.categoryLabel}>{category}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Generate Button */}
      <TouchableOpacity style={styles.generateButton} onPress={generateReport}>
        <Ionicons name="document-text-outline" size={20} color="#fff" />
        <Text style={styles.generateButtonText}>Generar Reporte</Text>
      </TouchableOpacity>

      {/* Preview Section */}
      <View style={styles.previewSection}>
        <Text style={styles.previewTitle}>Vista previa</Text>
        
        {!reportPreview ? (
          <View style={styles.emptyPreview}>
            <Text style={styles.emptyPreviewText}>XXXXXXXXXXXXXXXXXX</Text>
            <Ionicons name="document-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyPreviewTitle}>Vista previa</Text>
            <Text style={styles.emptyPreviewSubtitle}>
              Configure los ajustes de su informe y haga clic en «Generar informe» para ver una vista previa.
            </Text>
          </View>
        ) : (
          <View style={styles.previewContent}>
            <View style={styles.previewHeader}>
              <View>
                <Text style={styles.previewReportTitle}>Vista previa</Text>
                <Text style={styles.previewReportSubtitle}>
                  Informe contable básico {formatDateRange()}
                </Text>
              </View>
              <View style={styles.exportButtons}>
                <TouchableOpacity style={styles.exportButton} onPress={handleExportPDF}>
                  <Ionicons name="download-outline" size={16} color="#3B82F6" />
                  <Text style={styles.exportButtonText}>PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.exportButton} onPress={handleExportExcel}>
                  <Ionicons name="download-outline" size={16} color="#3B82F6" />
                  <Text style={styles.exportButtonText}>Excel</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.reportMainTitle}>Informe contable básico</Text>
            <Text style={styles.reportPeriod}>
              Periodo: {formatDate(reportPreview.startDate)} - {formatDate(reportPreview.endDate)}
            </Text>
            <Text style={styles.reportGenerated}>
              Generado el {new Date().toLocaleDateString('es-MX', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </Text>

            {/* Summary Cards */}
            <View style={styles.summaryCards}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total Gastado</Text>
                <Text style={styles.summaryValue}>
                  ${reportPreview.totalSpent.toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Entradas</Text>
                <Text style={styles.summaryValue}>{reportPreview.entries}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Depositos</Text>
                <Text style={styles.summaryValue}>
                  ${reportPreview.deposits.toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Promedio</Text>
                <Text style={styles.summaryValue}>
                  ${reportPreview.average.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Expenses by Category */}
            <View style={styles.expensesByCategory}>
              <Text style={styles.expensesByCategoryTitle}>Gastos por categoría</Text>
              {reportPreview.expensesByCategory.map((item, index) => (
                <View key={index} style={styles.categoryExpenseRow}>
                  <View style={styles.categoryExpenseLeft}>
                    <View style={[
                      styles.categoryDot,
                      { backgroundColor: getCategoryColor(item.category) }
                    ]} />
                    <Text style={styles.categoryExpenseName}>{item.category}</Text>
                  </View>
                  <View style={styles.categoryExpenseRight}>
                    <Text style={styles.categoryExpensePercentage}>
                      {item.percentage}% del total
                    </Text>
                    <Text style={styles.categoryExpenseAmount}>
                      ${item.amount.toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E7EB',
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
    width: 100,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  reportTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  reportTypeCardSelected: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  reportTypeCardDisabled: {
    opacity: 0.6,
  },
  reportTypeContent: {
    flex: 1,
  },
  reportTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  reportTypeSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  dateInputText: {
    fontSize: 16,
    color: '#111',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  categoriesList: {
    gap: 12,
  },
  categoryCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryLabel: {
    fontSize: 16,
    color: '#111',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3A8A',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  previewSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 16,
  },
  emptyPreview: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyPreviewText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  emptyPreviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyPreviewSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  previewContent: {
    marginTop: 8,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  previewReportTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  previewReportSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  exportButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  exportButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  reportMainTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  reportPeriod: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  reportGenerated: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  summaryCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  expensesByCategory: {
    marginTop: 8,
  },
  expensesByCategoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 16,
  },
  categoryExpenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryExpenseLeft: {
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
  categoryExpenseName: {
    fontSize: 16,
    color: '#111',
    fontWeight: '500',
  },
  categoryExpenseRight: {
    alignItems: 'flex-end',
  },
  categoryExpensePercentage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  categoryExpenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
});
