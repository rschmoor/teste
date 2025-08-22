'use client';

import React, { useState, useEffect } from 'react';
import { useReports } from '@/hooks/useReports';
import { Report } from '@/lib/supabase/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Package,
  Users,
  DollarSign,
  BarChart3,
  Calendar,
  Clock,
  Settings,
  Info
} from 'lucide-react';

// Tipagem auxiliar para objetos de configuração
type JsonObject = Record<string, unknown>;

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report?: Report | null;
  onSuccess: () => void;
}

const REPORT_TYPES = {
  sales: {
    label: 'Vendas',
    icon: TrendingUp,
    description: 'Relatórios de vendas, receita e performance comercial',
    defaultConfig: {
      group_by: 'day',
      metrics: ['total_orders', 'total_revenue', 'avg_order_value']
    }
  },
  products: {
    label: 'Produtos',
    icon: Package,
    description: 'Análise de produtos, estoque e performance de vendas',
    defaultConfig: {
      limit: 10,
      sort_by: 'quantity',
      metrics: ['total_quantity', 'total_revenue']
    }
  },
  customers: {
    label: 'Clientes',
    icon: Users,
    description: 'Dados de clientes, comportamento e segmentação',
    defaultConfig: {
      metrics: ['total_customers', 'new_customers', 'active_customers']
    }
  },
  inventory: {
    label: 'Estoque',
    icon: Package,
    description: 'Controle de estoque, movimentações e alertas',
    defaultConfig: {
      include_variants: true,
      show_low_stock: true
    }
  },
  financial: {
    label: 'Financeiro',
    icon: DollarSign,
    description: 'Relatórios financeiros, fluxo de caixa e análises',
    defaultConfig: {
      include_taxes: true,
      group_by: 'month'
    }
  },
  custom: {
    label: 'Personalizado',
    icon: BarChart3,
    description: 'Relatórios customizados com consultas específicas',
    defaultConfig: {} as JsonObject
  }
};

const SALES_GROUP_BY_OPTIONS = [
  { value: 'day', label: 'Por Dia' },
  { value: 'week', label: 'Por Semana' },
  { value: 'month', label: 'Por Mês' },
  { value: 'year', label: 'Por Ano' }
];

const PRODUCTS_SORT_OPTIONS = [
  { value: 'quantity', label: 'Quantidade Vendida' },
  { value: 'revenue', label: 'Receita' },
  { value: 'orders', label: 'Número de Pedidos' }
];

export function ReportModal({ open, onOpenChange, report, onSuccess }: ReportModalProps) {
  const { createReport, updateReport, validateReportConfig } = useReports();
  
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    type: keyof typeof REPORT_TYPES;
    config: JsonObject;
    filters: JsonObject;
    chart_config: JsonObject;
    is_public: boolean;
    is_scheduled: boolean;
    schedule_config: JsonObject;
  }>({
    name: '',
    description: '',
    type: 'sales',
    config: REPORT_TYPES.sales.defaultConfig as JsonObject,
    filters: {} as JsonObject,
    chart_config: {} as JsonObject,
    is_public: false,
    is_scheduled: false,
    schedule_config: {} as JsonObject
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data
  useEffect(() => {
    if (report) {
      setFormData({
        name: report.name,
        description: report.description || '',
        type: report.type as keyof typeof REPORT_TYPES,
        config: (report.config ?? {}) as JsonObject,
        filters: (report.filters ?? {}) as JsonObject,
        chart_config: (report.chart_config ?? {}) as JsonObject,
        is_public: report.is_public,
        is_scheduled: report.is_scheduled,
        schedule_config: (report.schedule_config ?? {}) as JsonObject
      });
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'sales',
        config: REPORT_TYPES.sales.defaultConfig as JsonObject,
        filters: {} as JsonObject,
        chart_config: {} as JsonObject,
        is_public: false,
        is_scheduled: false,
        schedule_config: {} as JsonObject
      });
    }
    setErrors({});
  }, [report, open]);

  // Handle type change
  const handleTypeChange = (type: keyof typeof REPORT_TYPES) => {
    setFormData(prev => ({
      ...prev,
      type,
      config: REPORT_TYPES[type].defaultConfig as JsonObject
    }));
  };

  // Handle config change
  const handleConfigChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...(prev.config as JsonObject),
        [key]: value
      }
    }));
  };

  // Handle schedule config change
  const handleScheduleConfigChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      schedule_config: {
        ...(prev.schedule_config as JsonObject),
        [key]: value
      }
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!validateReportConfig(formData.type, formData.config)) {
      newErrors.config = 'Configuração inválida para este tipo de relatório';
    }

    if (formData.is_scheduled) {
      if (!formData.schedule_config || !(formData.schedule_config as any).frequency) {
        newErrors.schedule_frequency = 'Frequência é obrigatória para relatórios agendados';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (report) {
        await updateReport(report.id, formData);
      } else {
        await createReport(formData);
      }
      onSuccess();
    } catch (err) {
      console.error('Erro ao salvar relatório:', err);
    } finally {
      setLoading(false);
    }
  };

  // Render type-specific config
  const renderTypeConfig = () => {
    switch (formData.type) {
      case 'sales':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="groupBy">Agrupar Por</Label>
              <Select
                value={(formData.config as any).group_by || 'day'}
                onValueChange={(value) => handleConfigChange('group_by', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SALES_GROUP_BY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Métricas Incluídas</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['total_orders', 'total_revenue', 'avg_order_value', 'total_items'].map(metric => (
                  <Badge
                    key={metric}
                    variant={(formData.config as any).metrics?.includes(metric) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      const metrics = (formData.config as any).metrics || [];
                      const newMetrics = metrics.includes(metric)
                        ? metrics.filter((m: string) => m !== metric)
                        : [...metrics, metric];
                      handleConfigChange('metrics', newMetrics);
                    }}
                  >
                    {metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case 'products':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="limit">Limite de Produtos</Label>
              <Input
                id="limit"
                type="number"
                min="1"
                max="100"
                value={(formData.config as any).limit || 10}
                onChange={(e) => handleConfigChange('limit', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="sortBy">Ordenar Por</Label>
              <Select
                value={(formData.config as any).sort_by || 'quantity'}
                onValueChange={(value) => handleConfigChange('sort_by', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCTS_SORT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'customers':
        return (
          <div className="space-y-4">
            <div>
              <Label>Métricas de Clientes</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['total_customers', 'new_customers', 'active_customers', 'avg_orders_per_customer', 'avg_revenue_per_customer'].map(metric => (
                  <Badge
                    key={metric}
                    variant={(formData.config as any).metrics?.includes(metric) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      const metrics = (formData.config as any).metrics || [];
                      const newMetrics = metrics.includes(metric)
                        ? metrics.filter((m: string) => m !== metric)
                        : [...metrics, metric];
                      handleConfigChange('metrics', newMetrics);
                    }}
                  >
                    {metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <Info className="h-8 w-8 mx-auto mb-2" />
            <p>Configurações específicas para este tipo de relatório serão adicionadas em breve.</p>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {report ? 'Editar Relatório' : 'Novo Relatório'}
          </DialogTitle>
          <DialogDescription>
            {report ? 'Edite as configurações do relatório' : 'Crie um novo relatório personalizado'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="config">Configuração</TabsTrigger>
              <TabsTrigger value="schedule">Agendamento</TabsTrigger>
              <TabsTrigger value="advanced">Avançado</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="name">Nome do Relatório</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Vendas Mensais"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o objetivo deste relatório..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Tipo de Relatório</Label>
                  <div className="grid gap-3 mt-2">
                    {Object.entries(REPORT_TYPES).map(([key, type]) => {
                      const Icon = type.icon;
                      const isSelected = formData.type === key;
                      
                      return (
                        <Card
                          key={key}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                          }`}
                          onClick={() => handleTypeChange(key as keyof typeof REPORT_TYPES)}
                        >
                          <CardContent className="flex items-center gap-3 p-4">
                            <Icon className="h-5 w-5" />
                            <div className="flex-1">
                              <h4 className="font-medium">{type.label}</h4>
                              <p className="text-sm text-muted-foreground">{type.description}</p>
                            </div>
                            {isSelected && (
                              <div className="h-2 w-2 bg-primary rounded-full" />
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_public"
                    checked={formData.is_public}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
                  />
                  <Label htmlFor="is_public">Relatório Público</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="config" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configurações do Relatório
                  </CardTitle>
                  <CardDescription>
                    Configure os parâmetros específicos para o tipo de relatório selecionado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderTypeConfig()}
                  {errors.config && (
                    <p className="text-sm text-red-500 mt-2">{errors.config}</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Agendamento
                  </CardTitle>
                  <CardDescription>
                    Configure a execução automática do relatório
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_scheduled"
                      checked={formData.is_scheduled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_scheduled: checked }))}
                    />
                    <Label htmlFor="is_scheduled">Habilitar Agendamento</Label>
                  </div>

                  {formData.is_scheduled && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="frequency">Frequência</Label>
                        <Select
                          value={(formData.schedule_config as any).frequency || ''}
                          onValueChange={(value) => handleScheduleConfigChange('frequency', value)}
                        >
                          <SelectTrigger className={errors.schedule_frequency ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Selecione a frequência" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Diário</SelectItem>
                            <SelectItem value="weekly">Semanal</SelectItem>
                            <SelectItem value="monthly">Mensal</SelectItem>
                            <SelectItem value="quarterly">Trimestral</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.schedule_frequency && (
                          <p className="text-sm text-red-500 mt-1">{errors.schedule_frequency}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="time">Horário de Execução</Label>
                        <Input
                          id="time"
                          type="time"
                          value={(formData.schedule_config as any).time || '09:00'}
                          onChange={(e) => handleScheduleConfigChange('time', e.target.value)}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="email_notification"
                          checked={(formData.schedule_config as any).email_notification || false}
                          onCheckedChange={(checked) => handleScheduleConfigChange('email_notification', checked)}
                        />
                        <Label htmlFor="email_notification">Enviar por Email</Label>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações Avançadas</CardTitle>
                  <CardDescription>
                    Configurações adicionais e filtros personalizados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-8 w-8 mx-auto mb-2" />
                    <p>Configurações avançadas serão implementadas em breve.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (report ? 'Atualizar' : 'Criar Relatório')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}