'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Report,
  ReportExecution,
  ReportSettings,
  SalesReportData,
  TopProductsReportData,
  CustomersReportData
} from '@/lib/supabase/types';

// Interfaces para tipagem
interface ReportData {
  [key: string]: unknown
}

interface ReportFilters {
  [key: string]: unknown
}

interface ReportConfig {
  [key: string]: unknown
}

interface UseReportsReturn {
  // State
  reports: Report[];
  reportSettings: ReportSettings[];
  executions: ReportExecution[];
  loading: boolean;
  error: string | null;

  // Report CRUD
  fetchReports: () => Promise<void>;
  createReport: (report: Omit<Report, 'id' | 'created_at' | 'updated_at'>) => Promise<Report | null>;
  updateReport: (id: string, updates: Partial<Report>) => Promise<Report | null>;
  deleteReport: (id: string) => Promise<boolean>;
  getReport: (id: string) => Promise<Report | null>;

  // Report execution
  executeReport: (reportId: string, filters?: ReportFilters) => Promise<ReportData>;
  getReportData: (type: string, filters?: ReportFilters) => Promise<ReportData>;
  
  // Cache management
  getCachedData: (reportId: string, filtersHash: string) => Promise<ReportData | null>;
  setCachedData: (reportId: string, data: ReportData, filters: ReportFilters, ttlMinutes?: number) => Promise<void>;
  clearCache: (reportId?: string) => Promise<void>;
  
  // Executions
  fetchExecutions: (reportId?: string) => Promise<void>;
  getExecutionStatus: (executionId: string) => Promise<ReportExecution | null>;
  
  // Settings
  fetchSettings: () => Promise<void>;
  updateSetting: (key: string, value: unknown) => Promise<boolean>;
  getSetting: (key: string, defaultValue?: unknown) => unknown;
  
  // Data functions
  getSalesData: (startDate?: string, endDate?: string, groupBy?: string) => Promise<SalesReportData[]>;
  getTopProducts: (startDate?: string, endDate?: string, limit?: number) => Promise<TopProductsReportData[]>;
  getCustomersData: (startDate?: string, endDate?: string) => Promise<CustomersReportData>;
  
  // Export
  exportReport: (reportId: string, format: 'csv' | 'xlsx' | 'pdf') => Promise<Blob | null>;
  
  // Utilities
  generateFiltersHash: (filters: ReportFilters) => string;
  validateReportConfig: (type: string, config: ReportConfig) => boolean;
}

export function useReports(): UseReportsReturn {
  const [reports, setReports] = useState<Report[]>([]);
  const [reportSettings, setReportSettings] = useState<ReportSettings[]>([]);
  const [executions, setExecutions] = useState<ReportExecution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch reports
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setReports(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar relatórios');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create report
  const createReport = useCallback(async (reportData: Omit<Report, 'id' | 'created_at' | 'updated_at'>): Promise<Report | null> => {
    try {
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error: createError } = await supabase
        .from('reports')
        .insert({
          ...reportData,
          created_by: user.id
        })
        .select()
        .single();

      if (createError) throw createError;

      setReports(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar relatório');
      return null;
    }
  }, []);

  // Update report
  const updateReport = useCallback(async (id: string, updates: Partial<Report>): Promise<Report | null> => {
    try {
      setError(null);

      const { data, error: updateError } = await supabase
        .from('reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setReports(prev => prev.map(report => 
        report.id === id ? data : report
      ));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar relatório');
      return null;
    }
  }, []);

  // Delete report
  const deleteReport = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('reports')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setReports(prev => prev.filter(report => report.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir relatório');
      return false;
    }
  }, []);

  // Get single report
  const getReport = useCallback(async (id: string): Promise<Report | null> => {
    try {
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar relatório');
      return null;
    }
  }, []);

  // Execute report
  const executeReport = useCallback(async (reportId: string, filters: ReportFilters = {}): Promise<ReportData> => {
    try {
      setError(null);

      // Check cache first
      const filtersHash = generateFiltersHash(filters);
      const cachedData = await getCachedData(reportId, filtersHash);
      if (cachedData) {
        return cachedData;
      }

      // Get report config
      const report = await getReport(reportId);
      if (!report) throw new Error('Relatório não encontrado');

      // Execute based on type
      let data;
      switch (report.type) {
        case 'sales':
          data = await getSalesData(
            filters.startDate,
            filters.endDate,
            report.config.group_by || 'day'
          );
          break;
        case 'products':
          data = await getTopProducts(
            filters.startDate,
            filters.endDate,
            report.config.limit || 10
          );
          break;
        case 'customers':
          data = await getCustomersData(
            filters.startDate,
            filters.endDate
          );
          break;
        default:
          throw new Error(`Tipo de relatório não suportado: ${report.type}`);
      }

      // Cache the result
      await setCachedData(reportId, data, filters);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao executar relatório');
      return null;
    }
  }, [generateFiltersHash, getCachedData, getReport, getSalesData, getTopProducts, getCustomersData, setCachedData]);

  // Get report data by type
  const getReportData = useCallback(async (type: string, filters: ReportFilters = {}): Promise<ReportData> => {
    try {
      setError(null);

      switch (type) {
        case 'sales':
          return await getSalesData(
            filters.startDate,
            filters.endDate,
            filters.groupBy || 'day'
          );
        case 'products':
          return await getTopProducts(
            filters.startDate,
            filters.endDate,
            filters.limit || 10
          );
        case 'customers':
          return await getCustomersData(
            filters.startDate,
            filters.endDate
          );
        default:
          throw new Error(`Tipo de relatório não suportado: ${type}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao obter dados do relatório');
      return null;
    }
  }, [getSalesData, getTopProducts, getCustomersData]);

  // Get cached data
  const getCachedData = useCallback(async (reportId: string, filtersHash: string): Promise<ReportData | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('report_cache')
        .select('data')
        .eq('report_id', reportId)
        .eq('filters_hash', filtersHash)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (fetchError) return null;
      return data?.data;
    } catch {
      return null;
    }
  }, []);

  // Set cached data
  const setCachedData = useCallback(async (
    reportId: string, 
    data: ReportData,
    filters: ReportFilters, 
    ttlMinutes: number = 60
  ): Promise<void> => {
    try {
      const filtersHash = generateFiltersHash(filters);
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
      const cacheKey = `${reportId}_${filtersHash}`;

      await supabase
        .from('report_cache')
        .upsert({
          report_id: reportId,
          cache_key: cacheKey,
          data,
          filters_hash: filtersHash,
          expires_at: expiresAt
        });
    } catch (err) {
      console.error('Erro ao salvar cache:', err);
    }
  }, [generateFiltersHash]);

  // Clear cache
  const clearCache = useCallback(async (reportId?: string): Promise<void> => {
    try {
      let query = supabase.from('report_cache').delete();
      
      if (reportId) {
        query = query.eq('report_id', reportId);
      }

      await query;
    } catch (err) {
      console.error('Erro ao limpar cache:', err);
    }
  }, []);

  // Fetch executions
  const fetchExecutions = useCallback(async (reportId?: string): Promise<void> => {
    try {
      setError(null);

      let query = supabase
        .from('report_executions')
        .select('*')
        .order('started_at', { ascending: false });

      if (reportId) {
        query = query.eq('report_id', reportId);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      
      setExecutions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar execuções');
    }
  }, []);

  // Get execution status
  const getExecutionStatus = useCallback(async (executionId: string): Promise<ReportExecution | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('report_executions')
        .select('*')
        .eq('id', executionId)
        .single();

      if (fetchError) throw fetchError;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar status da execução');
      return null;
    }
  }, []);

  // Fetch settings
  const fetchSettings = useCallback(async (): Promise<void> => {
    try {
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('report_settings')
        .select('*')
        .order('key');

      if (fetchError) throw fetchError;
      setReportSettings(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar configurações');
    }
  }, []);

  // Update setting
  const updateSetting = useCallback(async (key: string, value: unknown): Promise<boolean> => {
    try {
      setError(null);

      const { error: updateError } = await supabase
        .from('report_settings')
        .upsert({ key, value });

      if (updateError) throw updateError;

      setReportSettings(prev => {
        const existing = prev.find(s => s.key === key);
        if (existing) {
          return prev.map(s => s.key === key ? { ...s, value } : s);
        } else {
          return [...prev, { 
            id: '', 
            key, 
            value, 
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }];
        }
      });
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar configuração');
      return false;
    }
  }, []);

  // Get setting
  const getSetting = useCallback((key: string, defaultValue: unknown = null): unknown => {
    const setting = reportSettings.find(s => s.key === key);
    return setting ? setting.value : defaultValue;
  }, [reportSettings]);

  // Get sales data
  const getSalesData = useCallback(async (
    startDate?: string, 
    endDate?: string, 
    groupBy: string = 'day'
  ): Promise<SalesReportData[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .rpc('get_sales_report_data', {
          start_date: startDate || null,
          end_date: endDate || null,
          group_by: groupBy
        });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar dados de vendas');
      return [];
    }
  }, []);

  // Get top products
  const getTopProducts = useCallback(async (
    startDate?: string, 
    endDate?: string, 
    limit: number = 10
  ): Promise<TopProductsReportData[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .rpc('get_top_products_report', {
          start_date: startDate || null,
          end_date: endDate || null,
          limit_count: limit
        });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar produtos mais vendidos');
      return [];
    }
  }, []);

  // Get customers data
  const getCustomersData = useCallback(async (
    startDate?: string, 
    endDate?: string
  ): Promise<CustomersReportData> => {
    try {
      const { data, error: fetchError } = await supabase
        .rpc('get_customers_report_data', {
          start_date: startDate || null,
          end_date: endDate || null
        });

      if (fetchError) throw fetchError;
      return data?.[0] || {
        total_customers: 0,
        new_customers: 0,
        active_customers: 0,
        avg_orders_per_customer: 0,
        avg_revenue_per_customer: 0
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar dados de clientes');
      return {
        total_customers: 0,
        new_customers: 0,
        active_customers: 0,
        avg_orders_per_customer: 0,
        avg_revenue_per_customer: 0
      };
    }
  }, []);

  // Export report
  const exportReport = useCallback(async (reportId: string, format: 'csv' | 'xlsx' | 'pdf'): Promise<Blob | null> => {
    try {
      setError(null);

      // Get report data
      const data = await executeReport(reportId);
      if (!data) throw new Error('Não foi possível obter dados do relatório');

      // Convert to requested format
      switch (format) {
        case 'csv':
          return new Blob([convertToCSV(data)], { type: 'text/csv' });
        case 'xlsx':
          // Would need a library like xlsx for this
          throw new Error('Formato XLSX não implementado');
        case 'pdf':
          // Would need a library like jsPDF for this
          throw new Error('Formato PDF não implementado');
        default:
          throw new Error(`Formato não suportado: ${format}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar relatório');
      return null;
    }
  }, [executeReport]);

  // Generate filters hash
  const generateFiltersHash = useCallback((filters: ReportFilters): string => {
    const sortedFilters = Object.keys(filters)
      .sort()
      .reduce((result, key) => {
        result[key] = filters[key];
        return result;
      }, {} as ReportFilters);
    
    return btoa(JSON.stringify(sortedFilters));
  }, []);

  // Validate report config
  const validateReportConfig = useCallback((type: string, config: ReportConfig): boolean => {
    switch (type) {
      case 'sales':
        return config.group_by && ['day', 'week', 'month', 'year'].includes(config.group_by);
      case 'products':
        return typeof config.limit === 'number' && config.limit > 0;
      case 'customers':
        return true; // No specific validation needed
      default:
        return false;
    }
  }, []);

  // Helper function to convert data to CSV
  const convertToCSV = (data: ReportData[]): string => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  };

  // Load initial data
  useEffect(() => {
    fetchReports();
    fetchSettings();
  }, [fetchReports, fetchSettings]);

  return {
    // State
    reports,
    reportSettings,
    executions,
    loading,
    error,

    // Report CRUD
    fetchReports,
    createReport,
    updateReport,
    deleteReport,
    getReport,

    // Report execution
    executeReport,
    getReportData,
    
    // Cache management
    getCachedData,
    setCachedData,
    clearCache,
    
    // Executions
    fetchExecutions,
    getExecutionStatus,
    
    // Settings
    fetchSettings,
    updateSetting,
    getSetting,
    
    // Data functions
    getSalesData,
    getTopProducts,
    getCustomersData,
    
    // Export
    exportReport,
    
    // Utilities
    generateFiltersHash,
    validateReportConfig
  };
}