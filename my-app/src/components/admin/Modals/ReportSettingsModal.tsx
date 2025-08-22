'use client';

import React, { useState, useEffect } from 'react';
import { useReports } from '@/hooks/useReports';
import { ReportSettings } from '@/lib/supabase/types';
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
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Database,
  Clock,
  Mail,
  Shield,
  Trash2,
  AlertTriangle,
  Info
} from 'lucide-react';

interface ReportSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ReportSettingsModal({ open, onOpenChange, onSuccess }: ReportSettingsModalProps) {
  const { reportSettings, fetchSettings, updateSetting, clearCache } = useReports();
  
  const [settings, setSettings] = useState<ReportSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load settings
  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      await fetchSettings();
      // Use the reportSettings from the hook
      if (reportSettings.length > 0) {
        setSettings(reportSettings[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle setting change
  const handleSettingChange = (key: string, value: any) => {
    if (!settings) return;
    
    setSettings(prev => ({
      ...prev!,
      value: {
        ...prev!.value,
        [key]: value
      }
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!settings?.value) {
      newErrors.general = 'Configurações não carregadas';
      setErrors(newErrors);
      return false;
    }

    const config = settings.value;

    if (config.cache_ttl_hours && (config.cache_ttl_hours < 1 || config.cache_ttl_hours > 168)) {
      newErrors.cache_ttl = 'TTL do cache deve estar entre 1 e 168 horas';
    }

    if (config.max_execution_time_seconds && (config.max_execution_time_seconds < 30 || config.max_execution_time_seconds > 3600)) {
      newErrors.max_execution_time = 'Tempo máximo deve estar entre 30 e 3600 segundos';
    }

    if (config.max_rows_per_report && (config.max_rows_per_report < 100 || config.max_rows_per_report > 100000)) {
      newErrors.max_rows = 'Máximo de linhas deve estar entre 100 e 100.000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!settings || !validateForm()) return;

    setSaving(true);
    try {
      // Update each setting individually
      for (const [key, value] of Object.entries(settings.value)) {
        await updateSetting(key, value);
      }
      onSuccess();
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
    } finally {
      setSaving(false);
    }
  };

  // Handle clear cache
  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      await clearCache();
      // Show success message or notification
    } catch (err) {
      console.error('Erro ao limpar cache:', err);
    } finally {
      setClearingCache(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Settings className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Carregando configurações...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!settings) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p>Erro ao carregar configurações</p>
              <Button onClick={loadSettings} className="mt-4">
                Tentar Novamente
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações de Relatórios
          </DialogTitle>
          <DialogDescription>
            Configure o comportamento do sistema de relatórios
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="notifications">Notificações</TabsTrigger>
              <TabsTrigger value="security">Segurança</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Configurações Gerais
                  </CardTitle>
                  <CardDescription>
                    Configurações básicas do sistema de relatórios
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="default_date_range">Período Padrão</Label>
                      <Select
                        value={settings.value.default_date_range || '30'}
                        onValueChange={(value) => handleSettingChange('default_date_range', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">Últimos 7 dias</SelectItem>
                          <SelectItem value="30">Últimos 30 dias</SelectItem>
                          <SelectItem value="90">Últimos 90 dias</SelectItem>
                          <SelectItem value="365">Último ano</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="default_timezone">Fuso Horário Padrão</Label>
                      <Select
                        value={settings.value.default_timezone || 'America/Sao_Paulo'}
                        onValueChange={(value) => handleSettingChange('default_timezone', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/Sao_Paulo">São Paulo (UTC-3)</SelectItem>
                          <SelectItem value="America/New_York">Nova York (UTC-5)</SelectItem>
                          <SelectItem value="Europe/London">Londres (UTC+0)</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto_refresh"
                      checked={settings.value.auto_refresh_enabled || false}
                      onCheckedChange={(checked) => handleSettingChange('auto_refresh_enabled', checked)}
                    />
                    <Label htmlFor="auto_refresh">Atualização Automática</Label>
                  </div>

                  {settings.value.auto_refresh_enabled && (
                    <div>
                      <Label htmlFor="refresh_interval">Intervalo de Atualização (minutos)</Label>
                      <Input
                        id="refresh_interval"
                        type="number"
                        min="1"
                        max="60"
                        value={settings.value.auto_refresh_interval_minutes || 5}
                        onChange={(e) => handleSettingChange('auto_refresh_interval_minutes', parseInt(e.target.value))}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Performance e Cache
                  </CardTitle>
                  <CardDescription>
                    Configurações de performance e cache do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="cache_enabled"
                      checked={settings.value.cache_enabled !== false}
                      onCheckedChange={(checked) => handleSettingChange('cache_enabled', checked)}
                    />
                    <Label htmlFor="cache_enabled">Habilitar Cache</Label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="cache_ttl">TTL do Cache (horas)</Label>
                      <Input
                        id="cache_ttl"
                        type="number"
                        min="1"
                        max="168"
                        value={settings.value.cache_ttl_hours || 24}
                        onChange={(e) => handleSettingChange('cache_ttl_hours', parseInt(e.target.value))}
                        className={errors.cache_ttl ? 'border-red-500' : ''}
                      />
                      {errors.cache_ttl && (
                        <p className="text-sm text-red-500 mt-1">{errors.cache_ttl}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="max_execution_time">Tempo Máximo de Execução (segundos)</Label>
                      <Input
                        id="max_execution_time"
                        type="number"
                        min="30"
                        max="3600"
                        value={settings.value.max_execution_time_seconds || 300}
                        onChange={(e) => handleSettingChange('max_execution_time_seconds', parseInt(e.target.value))}
                        className={errors.max_execution_time ? 'border-red-500' : ''}
                      />
                      {errors.max_execution_time && (
                        <p className="text-sm text-red-500 mt-1">{errors.max_execution_time}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="max_rows">Máximo de Linhas por Relatório</Label>
                    <Input
                      id="max_rows"
                      type="number"
                      min="100"
                      max="100000"
                      value={settings.value.max_rows_per_report || 10000}
                      onChange={(e) => handleSettingChange('max_rows_per_report', parseInt(e.target.value))}
                      className={errors.max_rows ? 'border-red-500' : ''}
                    />
                    {errors.max_rows && (
                      <p className="text-sm text-red-500 mt-1">{errors.max_rows}</p>
                    )}
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Limpar Cache</h4>
                      <p className="text-sm text-muted-foreground">
                        Remove todos os dados em cache para forçar regeneração
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClearCache}
                      disabled={clearingCache}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {clearingCache ? 'Limpando...' : 'Limpar Cache'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Notificações
                  </CardTitle>
                  <CardDescription>
                    Configurações de notificações e alertas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="email_notifications"
                      checked={settings.value.email_notifications_enabled || false}
                      onCheckedChange={(checked) => handleSettingChange('email_notifications_enabled', checked)}
                    />
                    <Label htmlFor="email_notifications">Notificações por Email</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="error_notifications"
                      checked={settings.value.error_notifications_enabled !== false}
                      onCheckedChange={(checked) => handleSettingChange('error_notifications_enabled', checked)}
                    />
                    <Label htmlFor="error_notifications">Notificar Erros de Execução</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="completion_notifications"
                      checked={settings.value.completion_notifications_enabled || false}
                      onCheckedChange={(checked) => handleSettingChange('completion_notifications_enabled', checked)}
                    />
                    <Label htmlFor="completion_notifications">Notificar Conclusão de Relatórios</Label>
                  </div>

                  {settings.value.email_notifications_enabled && (
                    <div>
                      <Label htmlFor="notification_email">Email para Notificações</Label>
                      <Input
                        id="notification_email"
                        type="email"
                        value={settings.value.notification_email || ''}
                        onChange={(e) => handleSettingChange('notification_email', e.target.value)}
                        placeholder="admin@exemplo.com"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Segurança
                  </CardTitle>
                  <CardDescription>
                    Configurações de segurança e controle de acesso
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="require_auth"
                      checked={settings.value.require_authentication !== false}
                      onCheckedChange={(checked) => handleSettingChange('require_authentication', checked)}
                    />
                    <Label htmlFor="require_auth">Exigir Autenticação</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="audit_log"
                      checked={settings.value.audit_log_enabled !== false}
                      onCheckedChange={(checked) => handleSettingChange('audit_log_enabled', checked)}
                    />
                    <Label htmlFor="audit_log">Log de Auditoria</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="data_anonymization"
                      checked={settings.value.data_anonymization_enabled || false}
                      onCheckedChange={(checked) => handleSettingChange('data_anonymization_enabled', checked)}
                    />
                    <Label htmlFor="data_anonymization">Anonimização de Dados Sensíveis</Label>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Sobre a Segurança</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          As configurações de segurança ajudam a proteger dados sensíveis e
                          garantir que apenas usuários autorizados tenham acesso aos relatórios.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}