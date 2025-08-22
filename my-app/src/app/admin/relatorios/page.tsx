'use client';

import React, { useState, useEffect } from 'react';
import { useReports } from '@/hooks/useReports';
import { Report } from '@/lib/supabase/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Search,
  Filter,
  Download,
  Play,
  Edit,
  Trash2,
  MoreHorizontal,
  BarChart3,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  Calendar,
  Clock,
  Settings,
  RefreshCw
} from 'lucide-react';
import { ReportModal } from '@/components/admin/Modals/ReportModal';
import { ReportViewModal } from '@/components/admin/Modals/ReportViewModal';
import { ReportSettingsModal } from '@/components/admin/Modals/ReportSettingsModal';

const REPORT_TYPES = {
  sales: { label: 'Vendas', icon: TrendingUp, color: 'bg-green-500' },
  products: { label: 'Produtos', icon: Package, color: 'bg-blue-500' },
  customers: { label: 'Clientes', icon: Users, color: 'bg-purple-500' },
  inventory: { label: 'Estoque', icon: Package, color: 'bg-orange-500' },
  financial: { label: 'Financeiro', icon: DollarSign, color: 'bg-emerald-500' },
  custom: { label: 'Personalizado', icon: BarChart3, color: 'bg-gray-500' }
};

export default function ReportsPage() {
  const {
    reports,
    reportSettings,
    loading,
    error,
    fetchReports,
    deleteReport,
    executeReport,
    clearCache,
    getSalesData,
    getTopProducts,
    getCustomersData,
    getSetting
  } = useReports();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
  const [executingReports, setExecutingReports] = useState<Set<string>>(new Set());
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Filter reports
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || report.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Load dashboard data
  const loadDashboardData = async () => {
    setLoadingDashboard(true);
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [salesData, topProducts, customersData] = await Promise.all([
        getSalesData(startDate, endDate, 'day'),
        getTopProducts(startDate, endDate, 5),
        getCustomersData(startDate, endDate)
      ]);

      setDashboardData({
        sales: salesData,
        topProducts,
        customers: customersData,
        totalReports: reports.length,
        publicReports: reports.filter(r => r.is_public).length,
        scheduledReports: reports.filter(r => r.is_scheduled).length
      });
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Handle report execution
  const handleExecuteReport = async (report: Report) => {
    setExecutingReports(prev => new Set(prev).add(report.id));
    try {
      const data = await executeReport(report.id);
      setSelectedReport(report);
      setViewModalOpen(true);
    } catch (err) {
      console.error('Erro ao executar relatório:', err);
    } finally {
      setExecutingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(report.id);
        return newSet;
      });
    }
  };

  // Handle report edit
  const handleEditReport = (report: Report) => {
    setSelectedReport(report);
    setReportModalOpen(true);
  };

  // Handle report delete
  const handleDeleteReport = (report: Report) => {
    setReportToDelete(report);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (reportToDelete) {
      await deleteReport(reportToDelete.id);
      setDeleteDialogOpen(false);
      setReportToDelete(null);
    }
  };

  // Handle new report
  const handleNewReport = () => {
    setSelectedReport(null);
    setReportModalOpen(true);
  };

  // Handle clear cache
  const handleClearCache = async (reportId?: string) => {
    await clearCache(reportId);
  };

  useEffect(() => {
    loadDashboardData();
  }, [reports]);

  if (loading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Gerencie e visualize relatórios de vendas, produtos e clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setSettingsModalOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
          <Button onClick={handleNewReport}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Relatório
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {/* Dashboard Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Relatórios</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.totalReports || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Relatórios Públicos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.publicReports || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Relatórios Agendados</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.scheduledReports || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData?.customers?.total_customers || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Vendas dos Últimos 30 Dias</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingDashboard ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">
                      R$ {dashboardData?.sales?.reduce((sum: number, item: any) => sum + item.total_revenue, 0)?.toFixed(2) || '0.00'}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {dashboardData?.sales?.reduce((sum: number, item: any) => sum + item.total_orders, 0) || 0} pedidos
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Produtos Mais Vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingDashboard ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dashboardData?.topProducts?.slice(0, 3).map((product: any, index: number) => (
                      <div key={product.product_id} className="flex justify-between items-center">
                        <span className="text-sm truncate">{product.product_name}</span>
                        <Badge variant="secondary">{product.total_quantity}</Badge>
                      </div>
                    )) || (
                      <p className="text-sm text-muted-foreground">Nenhum produto encontrado</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar relatórios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {Object.entries(REPORT_TYPES).map(([key, type]) => (
                  <SelectItem key={key} value={key}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => handleClearCache()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Limpar Cache
            </Button>
          </div>

          {/* Reports Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredReports.map((report) => {
              const reportType = REPORT_TYPES[report.type as keyof typeof REPORT_TYPES];
              const Icon = reportType.icon;
              const isExecuting = executingReports.has(report.id);

              return (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${reportType.color} text-white`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{report.name}</CardTitle>
                          <Badge variant="secondary" className="mt-1">
                            {reportType.label}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleExecuteReport(report)}>
                            <Play className="h-4 w-4 mr-2" />
                            Executar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditReport(report)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleClearCache(report.id)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Limpar Cache
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteReport(report)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">
                      {report.description || 'Sem descrição'}
                    </CardDescription>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        {report.is_public && (
                          <Badge variant="outline" className="text-xs">
                            Público
                          </Badge>
                        )}
                        {report.is_scheduled && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Agendado
                          </Badge>
                        )}
                      </div>
                      <span>{new Date(report.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleExecuteReport(report)}
                        disabled={isExecuting}
                        className="flex-1"
                      >
                        {isExecuting ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        {isExecuting ? 'Executando...' : 'Executar'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredReports.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum relatório encontrado</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm || typeFilter !== 'all' 
                    ? 'Tente ajustar os filtros de busca'
                    : 'Comece criando seu primeiro relatório'
                  }
                </p>
                {!searchTerm && typeFilter === 'all' && (
                  <Button onClick={handleNewReport}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Relatório
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ReportModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        report={selectedReport}
        onSuccess={() => {
          setReportModalOpen(false);
          setSelectedReport(null);
          fetchReports();
        }}
      />

      <ReportViewModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        report={selectedReport}
      />

      <ReportSettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        onSuccess={() => {
          setSettingsModalOpen(false);
          // Reload settings or show success message
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o relatório "{reportToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}