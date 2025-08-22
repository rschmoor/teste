'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useCustomerArea } from '@/hooks/useCustomerArea'
import type { Database } from '@/lib/supabase/types'
import { MapPin, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type Address = Database['public']['Tables']['addresses']['Row']
type AddressInsert = Database['public']['Tables']['addresses']['Insert']
type AddressUpdate = Database['public']['Tables']['addresses']['Update']

interface AddressModalProps {
  isOpen: boolean
  onClose: () => void
  address?: Address | null
  onSuccess?: () => void
}

const brazilianStates = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' }
]

export function AddressModal({ isOpen, onClose, address, onSuccess }: AddressModalProps) {
  const { createAddress, updateAddress, loading } = useCustomerArea()
  const [formData, setFormData] = useState<AddressInsert>({
    user_id: '',
    type: 'shipping',
    recipient_name: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Brasil',
    phone: '',
    is_default: false,
    is_active: true,
    label: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)

  const isEditing = !!address

  useEffect(() => {
    if (address) {
      setFormData({
        user_id: address.user_id,
        type: address.type,
        recipient_name: address.recipient_name,
        street: address.street,
        number: address.number,
        complement: address.complement || '',
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
        country: address.country,
        phone: address.phone || '',
        is_default: address.is_default,
        is_active: address.is_active,
        label: address.label || ''
      })
    } else {
      setFormData({
        user_id: '',
        type: 'shipping',
        recipient_name: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'Brasil',
        phone: '',
        is_default: false,
        is_active: true,
        label: ''
      })
    }
  }, [address, isOpen])

  const handleInputChange = (field: keyof AddressInsert, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2')
  }

  const handleCEPChange = async (value: string) => {
    const formattedCEP = formatCEP(value)
    handleInputChange('postal_code', formattedCEP)

    // Buscar endereço pelo CEP se tiver 8 dígitos
    const numbers = value.replace(/\D/g, '')
    if (numbers.length === 8) {
      setCepLoading(true)
      try {
        const response = await fetch(`https://viacep.com.br/ws/${numbers}/json/`)
        const data = await response.json()
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            street: data.logradouro || prev.street,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state
          }))
          toast.success('Endereço encontrado pelo CEP!')
        } else {
          toast.error('CEP não encontrado')
        }
      } catch (error) {
        toast.error('Erro ao buscar CEP')
      } finally {
        setCepLoading(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validações
    if (!formData.recipient_name.trim()) {
      toast.error('Nome do destinatário é obrigatório')
      return
    }
    if (!formData.street.trim()) {
      toast.error('Rua é obrigatória')
      return
    }
    if (!formData.number.trim()) {
      toast.error('Número é obrigatório')
      return
    }
    if (!formData.neighborhood.trim()) {
      toast.error('Bairro é obrigatório')
      return
    }
    if (!formData.city.trim()) {
      toast.error('Cidade é obrigatória')
      return
    }
    if (!formData.state.trim()) {
      toast.error('Estado é obrigatório')
      return
    }
    if (!formData.postal_code.trim()) {
      toast.error('CEP é obrigatório')
      return
    }

    setIsSubmitting(true)
    try {
      if (isEditing && address) {
        await updateAddress(address.id, formData as AddressUpdate)
        toast.success('Endereço atualizado com sucesso!')
      } else {
        await createAddress(formData)
        toast.success('Endereço criado com sucesso!')
      }
      
      onSuccess?.()
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar endereço')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {isEditing ? 'Editar Endereço' : 'Novo Endereço'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="label">Rótulo (opcional)</Label>
              <Input
                id="label"
                placeholder="Ex: Casa, Trabalho, Mãe..."
                value={formData.label}
                onChange={(e) => handleInputChange('label', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Endereço</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shipping">Entrega</SelectItem>
                  <SelectItem value="billing">Cobrança</SelectItem>
                  <SelectItem value="both">Entrega e Cobrança</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipient_name">Nome do Destinatário *</Label>
            <Input
              id="recipient_name"
              placeholder="Nome completo"
              value={formData.recipient_name}
              onChange={(e) => handleInputChange('recipient_name', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="postal_code">CEP *</Label>
              <div className="relative">
                <Input
                  id="postal_code"
                  placeholder="00000-000"
                  value={formData.postal_code}
                  onChange={(e) => handleCEPChange(e.target.value)}
                  maxLength={9}
                  required
                />
                {cepLoading && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                placeholder="(11) 99999-9999"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3 space-y-2">
              <Label htmlFor="street">Rua *</Label>
              <Input
                id="street"
                placeholder="Nome da rua"
                value={formData.street}
                onChange={(e) => handleInputChange('street', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="number">Número *</Label>
              <Input
                id="number"
                placeholder="123"
                value={formData.number}
                onChange={(e) => handleInputChange('number', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="complement">Complemento</Label>
            <Input
              id="complement"
              placeholder="Apartamento, bloco, etc."
              value={formData.complement}
              onChange={(e) => handleInputChange('complement', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro *</Label>
              <Input
                id="neighborhood"
                placeholder="Nome do bairro"
                value={formData.neighborhood}
                onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Cidade *</Label>
              <Input
                id="city"
                placeholder="Nome da cidade"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Estado *</Label>
              <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {brazilianStates.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_default"
              checked={formData.is_default}
              onCheckedChange={(checked) => handleInputChange('is_default', checked as boolean)}
            />
            <Label htmlFor="is_default" className="text-sm">
              Definir como endereço padrão
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || loading}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                isEditing ? 'Atualizar' : 'Criar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}