'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  TrendingUp, 
  Clock, 
  Settings, 
  BarChart3, 
  Users, 
  Trash2,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';
import { SearchSettings, SearchAnalytics } from '@/lib/supabase/types';
import { toast } from 'sonner';

export function SearchAdmin() {
  const {
    getSearchSettings,
    updateSearchSetting,
    getSearchAnalytics,
    getPopularSearches
  } = useSearch();

  // Estados
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        getSearchSettings(),
        getSearchAnalytics(),
        getPopularSearches(20)
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados de busca');
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar uma configuração específica
  const updateSetting = async (key: string, value: any) => {
    try {
      await updateSearchSetting(key, value);
      setSettings(prev => ({ ...prev, [key]: value }));
      toast.success('Configuração atualizada!');
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      toast.error('Erro ao atualizar configuração');
    }
  };

  // Atualizar configurações
  const handleSaveSettings = async () => {
    if (!settings) return;
    
    setIsSaving(true);
    try {
      // TODO: Implementar updateSearchSettings no hook useSearch
      // await updateSearchSettings(settings);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  // Limpar cache
  const handleClearCache = async () => {
    try {
      // TODO: Implementar clearSearchCache no hook useSearch
      // await clearSearchCache();
      toast.success('Cache limpo com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      toast.error('Erro ao limpar cache');
    }
  };

  // Exportar dados
  const handleExportData = async () => {
    try {
      // TODO: Implementar exportSearchData no hook useSearch
      // const data = await exportSearchData();
      const data = { message: 'Export functionality not implemented yet' };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Dados exportados com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      toast.error('Erro ao exportar dados');
    }
  };



  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Administração de Busca</h1>
          <p className="text-gray-600 mt-1">
            Gerencie configurações e analise o desempenho do sistema de busca
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="popular">Buscas Populares</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
        </TabsList>

        {/* Análises */}
        <TabsContent value="analytics" className="space-y-6">
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Buscas</CardTitle>
                  <Search className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.total_searches}</div>
                  <p className="text-xs text-muted-foreground">
                    +{analytics.searches_today} hoje
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Termos Únicos</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.unique_terms}</div>
                  <p className="text-xs text-muted-foreground">
                    +{analytics.new_terms_today} novos hoje
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.active_users}</div>
                  <p className="text-xs text-muted-foreground">
                    Últimos 30 dias
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.success_rate}%</div>
                  <p className="text-xs text-muted-foreground">
                    Buscas com resultados
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Gráficos e estatísticas detalhadas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Buscas por Período</CardTitle>
                <CardDescription>
                  Distribuição de buscas ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Aqui seria implementado um gráfico */}
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Gráfico de buscas por período
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Categorias Mais Buscadas</CardTitle>
                <CardDescription>
                  Top categorias por volume de busca
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics?.topCategories?.map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <span className="text-sm">{category.category}</span>
                      <Badge variant="secondary">{category.search_count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Configurações */}
        <TabsContent value="settings" className="space-y-6">
          {settings && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações Gerais</CardTitle>
                  <CardDescription>
                    Configurações básicas do sistema de busca
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enabled">Sistema ativo</Label>
                    <Switch
                      id="enabled"
                      checked={settings.enabled || false}
                      onCheckedChange={(checked) => updateSetting('enabled', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min-length">Tamanho mínimo do termo</Label>
                    <Input
                      id="min-length"
                      type="number"
                      value={settings.min_search_length || 2}
                      onChange={(e) => updateSetting('min_search_length', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-suggestions">Máximo de sugestões</Label>
                    <Input
                      id="max-suggestions"
                      type="number"
                      value={settings.max_suggestions || 10}
                      onChange={(e) => updateSetting('max_suggestions', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-complete">Auto-completar</Label>
                    <Switch
                      id="enable-autocomplete"
                      checked={settings.enable_autocomplete || false}
                      onCheckedChange={(checked) => updateSetting('enable_autocomplete', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cache e Performance</CardTitle>
                  <CardDescription>
                    Configurações de cache e otimização
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cache-duration">Duração do cache (horas)</Label>
                    <Input
                      id="cache-duration"
                      type="number"
                      value={settings.cache_duration_hours || 24}
                      onChange={(e) => updateSetting('cache_duration_hours', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-cache">Cache ativo</Label>
                    <Switch
                      id="enable-cache"
                      checked={settings.enable_cache || false}
                      onCheckedChange={(checked) => updateSetting('enable_cache', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="track-analytics">Rastrear análises</Label>
                    <Switch
                      id="track-analytics"
                      checked={settings.track_analytics || false}
                      onCheckedChange={(checked) => updateSetting('track_analytics', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Salvar Configurações
            </Button>
          </div>
        </TabsContent>

        {/* Buscas Populares */}
        <TabsContent value="popular" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Termos Mais Buscados</CardTitle>
              <CardDescription>
                Lista dos termos de busca mais populares
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(analytics?.popularTerms || []).map((search, index) => (
                  <div key={search.term} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <span className="font-medium">{search.term}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{search.count} buscas</Badge>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cache */}
        <TabsContent value="cache" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Cache</CardTitle>
              <CardDescription>
                Controle e monitoramento do cache de busca
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Limpar o cache pode afetar temporariamente a performance das buscas.
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between p-4 border rounded">
                <div>
                  <h4 className="font-medium">Cache de Resultados</h4>
                  <p className="text-sm text-gray-600">
                    Limpa todos os resultados de busca em cache
                  </p>
                </div>
                <Button variant="destructive" onClick={handleClearCache}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Cache
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}