'use client';

import React, { useState, useEffect } from 'react';
import { useReports } from '@/hooks/useReports';
import { Report, ReportExecution } from '@/lib/supabase/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Download,
  RefreshCw,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: Report | null;
  execution?: ReportExecution | null;
}

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

export function ReportViewModal({ open, onOpenChange, report, execution }: ReportViewModalProps) {
  const { executeReport, exportReport } = useReports();
  
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load report data
  useEffect(() => {
    if (open && report) {
      if (execution?.result) {
        setReportData(execution.result);
      } else {
        loadReportData();
      }
    }
  }, [open, report, execution]);

  const loadReportData = async () => {
    if (!report) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await executeReport(report.id);
      setReportData(result.data);
    } catch (err) {
      console.error('Erro ao carregar dados do relatório:', err);
      setError('Erro ao carregar dados do relatório');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!report || !reportData) return;
    
    setExporting(true);
    try {
      await exportReport(report.id, 'csv');
    } catch (err) {
      console.error('Erro ao exportar relatório:', err);
    } finally {
      setExporting(false);
    }
  };

  const renderChart = () => {
    if (!reportData || !report) return null;

    switch (report.type) {
      case 'sales':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reportData.chart_data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  typeof value === 'number' ? value.toLocaleString('pt-BR') : value,
                  name === 'revenue' ? 'Receita' : name === 'orders' ? 'Pedidos' : name
                ]}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Receita" />
              <Line type="monotone" dataKey="orders" stroke="#82ca9d" name="Pedidos" />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'products':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.chart_data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  typeof value === 'number' ? value.toLocaleString('pt-BR') : value,
                  name === 'quantity' ? 'Quantidade' : name === 'revenue' ? 'Receita' : name
                ]}
              />
              <Bar dataKey="quantity" fill="#8884d8" name="Quantidade" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'customers':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportData.chart_data || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {(reportData.chart_data || []).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <BarChart className="h-12 w-12 mx-auto mb-2" />
              <p>Gráfico não disponível para este tipo de relatório</p>
            </div>
          </div>
        );
    }
  };

  const renderMetrics = () => {
    if (!reportData?.metrics) return null;

    const metrics = reportData.metrics;
    
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(metrics).map(([key, value]) => {
          const getMetricInfo = (key: string) => {
            switch (key) {
              case 'total_revenue':
                return { label: 'Receita Total', icon: DollarSign, format: 'currency' };
              case 'total_orders':
                return { label: 'Total de Pedidos', icon: Package, format: 'number' };
              case 'avg_order_value':
                return { label: 'Ticket Médio', icon: TrendingUp, format: 'currency' };
              case 'total_customers':
                return { label: 'Total de Clientes', icon: Users, format: 'number' };
              case 'new_customers':
                return { label: 'Novos Clientes', icon: Users, format: 'number' };
              case 'total_products':
                return { label: 'Total de Produtos', icon: Package, format: 'number' };
              default:
                return { label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), icon: TrendingUp, format: 'number' };
            }
          };

          const metricInfo = getMetricInfo(key);
          const Icon = metricInfo.icon;
          
          const formatValue = (value: any, format: string) => {
            if (typeof value !== 'number') return value;
            
            switch (format) {
              case 'currency':
                return new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(value);
              case 'number':
                return value.toLocaleString('pt-BR');
              default:
                return value;
            }
          };

          return (
            <Card key={key}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {metricInfo.label}
                  </p>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">
                  {formatValue(value, metricInfo.format)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderTable = () => {
    if (!reportData?.table_data || !Array.isArray(reportData.table_data)) return null;

    const data = reportData.table_data;
    if (data.length === 0) return null;

    const columns = Object.keys(data[0]);

    return (
      <Card>
        <CardHeader>
          <CardTitle>Dados Detalhados</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map(column => (
                    <TableHead key={column}>
                      {column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row: any, index: number) => (
                  <TableRow key={index}>
                    {columns.map(column => (
                      <TableCell key={column}>
                        {typeof row[column] === 'number' && column.includes('price') || column.includes('revenue') || column.includes('value')
                          ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row[column])
                          : typeof row[column] === 'number'
                          ? row[column].toLocaleString('pt-BR')
                          : row[column]
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                {report.name}
                {execution && (
                  <Badge variant={execution.status === 'completed' ? 'default' : execution.status === 'failed' ? 'destructive' : 'secondary'}>
                    {getStatusIcon(execution.status)}
                    {execution.status === 'completed' ? 'Concluído' : 
                     execution.status === 'failed' ? 'Falhou' : 
                     execution.status === 'running' ? 'Executando' : execution.status}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-4 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {execution?.started_at 
                    ? format(new Date(execution.started_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : 'Não executado'
                  }
                </span>
                {execution?.execution_time_ms && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {execution.execution_time_ms}ms
                  </span>
                )}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadReportData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={!reportData || exporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting ? 'Exportando...' : 'Exportar CSV'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Carregando dados...</span>
            </div>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="flex items-center gap-2 p-4">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-red-700">{error}</span>
              </CardContent>
            </Card>
          )}

          {reportData && !loading && (
            <>
              {/* Métricas */}
              {renderMetrics()}

              {/* Gráfico */}
              <Card>
                <CardHeader>
                  <CardTitle>Visualização</CardTitle>
                  <CardDescription>
                    Representação gráfica dos dados do relatório
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderChart()}
                </CardContent>
              </Card>

              {/* Tabela de dados */}
              {renderTable()}

              {/* Informações da execução */}
              {execution && (
                <Card>
                  <CardHeader>
                    <CardTitle>Informações da Execução</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(execution.status)}
                          <span className="capitalize">{execution.status}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Tempo de Execução</p>
                        <p className="mt-1">{execution.execution_time_ms || 0}ms</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Executado em</p>
                        <p className="mt-1">
                          {format(new Date(execution.started_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      {execution.error_message && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Erro</p>
                          <p className="mt-1 text-red-600">{execution.error_message}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}