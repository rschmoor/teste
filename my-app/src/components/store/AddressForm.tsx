'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { MapPin, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const addressSchema = z.object({
  zipCode: z.string()
    .length(8, 'CEP deve ter exatamente 8 dígitos')
    .regex(/^\d{8}$/, 'CEP deve conter apenas números'),
  street: z.string()
    .min(5, 'Endereço deve ter pelo menos 5 caracteres')
    .max(100, 'Endereço deve ter no máximo 100 caracteres'),
  number: z.string()
    .min(1, 'Número é obrigatório')
    .max(10, 'Número deve ter no máximo 10 caracteres'),
  complement: z.string()
    .max(50, 'Complemento deve ter no máximo 50 caracteres')
    .optional(),
  neighborhood: z.string()
    .min(2, 'Bairro é obrigatório')
    .max(50, 'Bairro deve ter no máximo 50 caracteres'),
  city: z.string()
    .min(2, 'Cidade é obrigatória')
    .max(50, 'Cidade deve ter no máximo 50 caracteres'),
  state: z.string()
    .length(2, 'Estado deve ter exatamente 2 caracteres')
    .regex(/^[A-Z]{2}$/, 'Estado deve ser uma sigla válida (ex: SP, RJ)'),
  isDefault: z.boolean().optional()
})

export type AddressFormData = z.infer<typeof addressSchema>

interface AddressFormProps {
  onSubmit: (data: AddressFormData) => void
  defaultValues?: Partial<AddressFormData>
  isLoading?: boolean
  showDefaultCheckbox?: boolean
  submitButtonText?: string
  className?: string
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

export function AddressForm({
  onSubmit,
  defaultValues,
  isLoading = false,
  showDefaultCheckbox = false,
  submitButtonText = 'Salvar Endereço',
  className
}: AddressFormProps) {
  const [isSearchingCep, setIsSearchingCep] = useState(false)

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      zipCode: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      isDefault: false,
      ...defaultValues
    }
  })

  const searchCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '')
    
    if (cleanCep.length !== 8) {
      return
    }

    setIsSearchingCep(true)
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()
      
      if (data.erro) {
        toast.error('CEP não encontrado')
        return
      }
      
      // Preenche os campos automaticamente
      form.setValue('street', data.logradouro || '')
      form.setValue('neighborhood', data.bairro || '')
      form.setValue('city', data.localidade || '')
      form.setValue('state', data.uf || '')
      
      // Foca no campo número
      const numberField = document.querySelector('input[name="number"]') as HTMLInputElement
      if (numberField) {
        numberField.focus()
      }
      
      toast.success('Endereço preenchido automaticamente')
    } catch (error) {
      toast.error('Erro ao buscar CEP')
    } finally {
      setIsSearchingCep(false)
    }
  }

  const handleCepChange = (value: string) => {
    // Formatar CEP automaticamente
    const formatted = value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 9)
    
    form.setValue('zipCode', formatted)
    
    // Buscar CEP quando tiver 8 dígitos
    const cleanCep = formatted.replace(/\D/g, '')
    if (cleanCep.length === 8) {
      searchCep(cleanCep)
    }
  }

  return (
    <div className={className}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* CEP */}
          <FormField
            control={form.control}
            name="zipCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  CEP
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="00000-000"
                      value={field.value}
                      onChange={(e) => handleCepChange(e.target.value)}
                      maxLength={9}
                    />
                    {isSearchingCep && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Endereço e Número */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, Avenida, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número</FormLabel>
                  <FormControl>
                    <Input placeholder="123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Complemento */}
          <FormField
            control={form.control}
            name="complement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Complemento (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Apartamento, bloco, etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Bairro, Cidade e Estado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="neighborhood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bairro</FormLabel>
                  <FormControl>
                    <Input placeholder="Bairro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade</FormLabel>
                  <FormControl>
                    <Input placeholder="Cidade" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
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
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Checkbox de endereço padrão */}
          {showDefaultCheckbox && (
            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal">
                      Definir como endereço padrão
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
          )}
          
          {/* Botão de Submit */}
          <Button 
            type="submit" 
            disabled={isLoading || isSearchingCep}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitButtonText}
          </Button>
        </form>
      </Form>
    </div>
  )
}

export default AddressForm