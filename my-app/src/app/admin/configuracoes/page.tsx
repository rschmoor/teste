'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Store, 
  CreditCard, 
  Truck, 
  Mail, 
  Shield, 
  Palette, 
  Globe,
  Save,
  Upload,
  AlertTriangle
} from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { toast } from 'sonner'
import Image from 'next/image'

export default function SettingsPage() {
  const {
    settings,
    loading,
    error,
    updateSettings,
    uploadLogo,
    testEmailSettings,
    resetToDefaults
  } = useSettings()

  const [formData, setFormData] = useState(settings || {})
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  const handleSave = async (section?: string) => {
    setSaving(true)
    try {
      await updateSettings(section ? { [section]: (formData as any)[section] } : formData)
      toast.success('Configurações salvas com sucesso!')
    } catch (error) {
      toast.error('Erro ao salvar configurações')
      console.error('Erro ao salvar:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const logoUrl = await uploadLogo(file)
      setFormData(prev => ({
        ...prev,
        general: {
          ...prev.general,
          logo_url: logoUrl
        }
      }))
      toast.success('Logo atualizado com sucesso!')
    } catch (error) {
      toast.error('Erro ao fazer upload do logo')
    }
  }

  const handleTestEmail = async () => {
    try {
      await testEmailSettings()
      toast.success('Email de teste enviado com sucesso!')
    } catch (error) {
      toast.error('Erro ao enviar email de teste')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Erro ao carregar configurações: {error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Tentar Novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie as configurações gerais da sua loja
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetToDefaults}>
            Restaurar Padrões
          </Button>
          <Button onClick={() => handleSave()} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Tudo'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Pagamentos
          </TabsTrigger>
          <TabsTrigger value="shipping" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Entrega
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Aparência
          </TabsTrigger>
        </TabsList>

        {/* Configurações Gerais */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Loja</CardTitle>
              <CardDescription>
                Configure as informações básicas da sua loja
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="store_name">Nome da Loja</Label>
                  <Input
                    id="store_name"
                    value={formData.general?.store_name || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      general: { ...prev.general, store_name: e.target.value }
                    }))}
                    placeholder="Minha Boutique"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store_url">URL da Loja</Label>
                  <Input
                    id="store_url"
                    value={formData.general?.store_url || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      general: { ...prev.general, store_url: e.target.value }
                    }))}
                    placeholder="https://minhalboutique.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="store_description">Descrição da Loja</Label>
                <Textarea
                  id="store_description"
                  value={formData.general?.store_description || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    general: { ...prev.general, store_description: e.target.value }
                  }))}
                  placeholder="Descrição da sua loja..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Logo da Loja</Label>
                <div className="flex items-center gap-4">
                  {formData.general?.logo_url && (
                    <Image 
                      src={formData.general.logo_url} 
                      alt="Logo" 
                      width={64}
                      height={64}
                      className="object-contain border rounded"
                      unoptimized
                    />
                  )}
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Label htmlFor="logo-upload" className="cursor-pointer">
                      <Button variant="outline" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Fazer Upload
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>
              </div>

              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email de Contato</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.general?.contact_email || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      general: { ...prev.general, contact_email: e.target.value }
                    }))}
                    placeholder="contato@minhalboutique.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Telefone de Contato</Label>
                  <Input
                    id="contact_phone"
                    value={formData.general?.contact_phone || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      general: { ...prev.general, contact_phone: e.target.value }
                    }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Textarea
                  id="address"
                  value={formData.general?.address || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    general: { ...prev.general, address: e.target.value }
                  }))}
                  placeholder="Endereço completo da loja..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave('general')} disabled={saving}>
                  Salvar Configurações Gerais
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações de Pagamento */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pagamento</CardTitle>
              <CardDescription>
                Configure os métodos de pagamento aceitos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>PIX</Label>
                    <p className="text-sm text-muted-foreground">Pagamento via PIX</p>
                  </div>
                  <Switch
                    checked={formData.payments?.pix_enabled || false}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      payments: { ...prev.payments, pix_enabled: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Cartão de Crédito</Label>
                    <p className="text-sm text-muted-foreground">Pagamento via cartão</p>
                  </div>
                  <Switch
                    checked={formData.payments?.credit_card_enabled || false}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      payments: { ...prev.payments, credit_card_enabled: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Boleto Bancário</Label>
                    <p className="text-sm text-muted-foreground">Pagamento via boleto</p>
                  </div>
                  <Switch
                    checked={formData.payments?.boleto_enabled || false}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      payments: { ...prev.payments, boleto_enabled: checked }
                    }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_gateway">Gateway de Pagamento</Label>
                  <Select
                    value={formData.payments?.gateway || ''}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      payments: { ...prev.payments, gateway: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o gateway" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                      <SelectItem value="pagseguro">PagSeguro</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="api_key">Chave da API</Label>
                    <Input
                      id="api_key"
                      type="password"
                      value={formData.payments?.api_key || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        payments: { ...prev.payments, api_key: e.target.value }
                      }))}
                      placeholder="Chave da API do gateway"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="api_secret">Chave Secreta</Label>
                    <Input
                      id="api_secret"
                      type="password"
                      value={formData.payments?.api_secret || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        payments: { ...prev.payments, api_secret: e.target.value }
                      }))}
                      placeholder="Chave secreta do gateway"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave('payments')} disabled={saving}>
                  Salvar Configurações de Pagamento
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações de Entrega */}
        <TabsContent value="shipping" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Entrega</CardTitle>
              <CardDescription>
                Configure as opções de entrega e frete
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Frete Grátis</Label>
                    <p className="text-sm text-muted-foreground">Ativar frete grátis</p>
                  </div>
                  <Switch
                    checked={formData.shipping?.free_shipping_enabled || false}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      shipping: { ...prev.shipping, free_shipping_enabled: checked }
                    }))}
                  />
                </div>

                {formData.shipping?.free_shipping_enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="free_shipping_min">Valor Mínimo para Frete Grátis</Label>
                    <Input
                      id="free_shipping_min"
                      type="number"
                      value={formData.shipping?.free_shipping_minimum || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        shipping: { ...prev.shipping, free_shipping_minimum: parseFloat(e.target.value) }
                      }))}
                      placeholder="100.00"
                    />
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shipping_origin">CEP de Origem</Label>
                  <Input
                    id="shipping_origin"
                    value={formData.shipping?.origin_zipcode || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      shipping: { ...prev.shipping, origin_zipcode: e.target.value }
                    }))}
                    placeholder="00000-000"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="processing_time">Tempo de Processamento (dias)</Label>
                    <Input
                      id="processing_time"
                      type="number"
                      value={formData.shipping?.processing_time || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        shipping: { ...prev.shipping, processing_time: parseInt(e.target.value) }
                      }))}
                      placeholder="2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shipping_methods">Métodos de Entrega</Label>
                    <Select
                      value={formData.shipping?.default_method || ''}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        shipping: { ...prev.shipping, default_method: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Método padrão" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="correios">Correios</SelectItem>
                        <SelectItem value="transportadora">Transportadora</SelectItem>
                        <SelectItem value="retirada">Retirada na Loja</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave('shipping')} disabled={saving}>
                  Salvar Configurações de Entrega
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações de Email */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Email</CardTitle>
              <CardDescription>
                Configure o servidor SMTP para envio de emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_host">Servidor SMTP</Label>
                  <Input
                    id="smtp_host"
                    value={formData.email?.smtp_host || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      email: { ...prev.email, smtp_host: e.target.value }
                    }))}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_port">Porta SMTP</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    value={formData.email?.smtp_port || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      email: { ...prev.email, smtp_port: parseInt(e.target.value) }
                    }))}
                    placeholder="587"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_user">Usuário SMTP</Label>
                  <Input
                    id="smtp_user"
                    value={formData.email?.smtp_user || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      email: { ...prev.email, smtp_user: e.target.value }
                    }))}
                    placeholder="seu-email@gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_password">Senha SMTP</Label>
                  <Input
                    id="smtp_password"
                    type="password"
                    value={formData.email?.smtp_password || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      email: { ...prev.email, smtp_password: e.target.value }
                    }))}
                    placeholder="sua-senha"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>SSL/TLS</Label>
                  <p className="text-sm text-muted-foreground">Usar conexão segura</p>
                </div>
                <Switch
                  checked={formData.email?.smtp_secure || false}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    email: { ...prev.email, smtp_secure: checked }
                  }))}
                />
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleTestEmail}>
                  Testar Configurações
                </Button>
                <Button onClick={() => handleSave('email')} disabled={saving}>
                  Salvar Configurações de Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações de Segurança */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
              <CardDescription>
                Configure as opções de segurança do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Autenticação de Dois Fatores</Label>
                    <p className="text-sm text-muted-foreground">Exigir 2FA para admins</p>
                  </div>
                  <Switch
                    checked={formData.security?.require_2fa || false}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      security: { ...prev.security, require_2fa: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Modo de Manutenção</Label>
                    <p className="text-sm text-muted-foreground">Ativar modo de manutenção</p>
                  </div>
                  <Switch
                    checked={formData.security?.maintenance_mode || false}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      security: { ...prev.security, maintenance_mode: checked }
                    }))}
                  />
                </div>

                {formData.security?.maintenance_mode && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Modo de Manutenção Ativo</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Apenas administradores podem acessar a loja
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="session_timeout">Timeout de Sessão (minutos)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    value={formData.security?.session_timeout || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      security: { ...prev.security, session_timeout: parseInt(e.target.value) }
                    }))}
                    placeholder="30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_login_attempts">Máximo de Tentativas de Login</Label>
                  <Input
                    id="max_login_attempts"
                    type="number"
                    value={formData.security?.max_login_attempts || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      security: { ...prev.security, max_login_attempts: parseInt(e.target.value) }
                    }))}
                    placeholder="5"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave('security')} disabled={saving}>
                  Salvar Configurações de Segurança
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações de Aparência */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Aparência</CardTitle>
              <CardDescription>
                Personalize a aparência da sua loja
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Tema</Label>
                  <Select
                    value={formData.appearance?.theme || 'light'}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, theme: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="dark">Escuro</SelectItem>
                      <SelectItem value="auto">Automático</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primary_color">Cor Primária</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={formData.appearance?.primary_color || '#000000'}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        appearance: { ...prev.appearance, primary_color: e.target.value }
                      }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.appearance?.primary_color || '#000000'}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        appearance: { ...prev.appearance, primary_color: e.target.value }
                      }))}
                      placeholder="#000000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="font_family">Fonte</Label>
                  <Select
                    value={formData.appearance?.font_family || 'inter'}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, font_family: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inter">Inter</SelectItem>
                      <SelectItem value="roboto">Roboto</SelectItem>
                      <SelectItem value="opensans">Open Sans</SelectItem>
                      <SelectItem value="poppins">Poppins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mostrar Preços</Label>
                    <p className="text-sm text-muted-foreground">Exibir preços na loja</p>
                  </div>
                  <Switch
                    checked={formData.appearance?.show_prices !== false}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, show_prices: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mostrar Estoque</Label>
                    <p className="text-sm text-muted-foreground">Exibir quantidade em estoque</p>
                  </div>
                  <Switch
                    checked={formData.appearance?.show_stock || false}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, show_stock: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mostrar Avaliações</Label>
                    <p className="text-sm text-muted-foreground">Exibir avaliações dos produtos</p>
                  </div>
                  <Switch
                    checked={formData.appearance?.show_reviews !== false}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, show_reviews: checked }
                    }))}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave('appearance')} disabled={saving}>
                  Salvar Configurações de Aparência
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}