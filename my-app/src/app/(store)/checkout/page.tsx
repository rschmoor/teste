'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { useOrders } from '@/hooks/useOrders'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
// import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
// import { Badge } from '@/components/ui/badge'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, ArrowRight, Check, CreditCard, MapPin, Package, User } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'
import { CheckoutTrustElements } from '@/components/ui/TrustElements'
import { TouchButton, TouchInput } from '@/components/ui/TouchTargets'
import { ComponentErrorBoundary } from '@/providers/ErrorBoundaryProvider'

// Schemas de validação
const personalDataSchema = z.object({
  firstName: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),
  lastName: z.string()
    .min(2, 'Sobrenome deve ter pelo menos 2 caracteres')
    .max(50, 'Sobrenome deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Sobrenome deve conter apenas letras'),
  email: z.string()
    .email('Email inválido')
    .max(100, 'Email deve ter no máximo 100 caracteres'),
  phone: z.string()
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .max(15, 'Telefone deve ter no máximo 15 dígitos')
    .regex(/^[\d\s\(\)\-\+]+$/, 'Telefone deve conter apenas números e símbolos válidos'),
  cpf: z.string()
    .length(11, 'CPF deve ter exatamente 11 dígitos')
    .regex(/^\d{11}$/, 'CPF deve conter apenas números')
    .refine((cpf) => {
      // Validação básica de CPF
      if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
      
      let sum = 0
      for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i)
      }
      let remainder = (sum * 10) % 11
      if (remainder === 10 || remainder === 11) remainder = 0
      if (remainder !== parseInt(cpf.charAt(9))) return false
      
      sum = 0
      for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i)
      }
      remainder = (sum * 10) % 11
      if (remainder === 10 || remainder === 11) remainder = 0
      return remainder === parseInt(cpf.charAt(10))
    }, 'CPF inválido')
})

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
    .regex(/^[A-Z]{2}$/, 'Estado deve ser uma sigla válida (ex: SP, RJ)')
})

const paymentSchema = z.object({
  method: z.enum(['credit', 'debit', 'pix', 'boleto']),
  cardNumber: z.string().optional(),
  cardName: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvv: z.string().optional(),
  installments: z.string().optional()
}).superRefine((data, ctx) => {
  // Validações condicionais para cartão
  if (data.method === 'credit' || data.method === 'debit') {
    if (!data.cardNumber || data.cardNumber.length < 16) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Número do cartão é obrigatório e deve ter 16 dígitos',
        path: ['cardNumber']
      })
    }
    
    if (!data.cardName || data.cardName.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nome no cartão é obrigatório',
        path: ['cardName']
      })
    }
    
    if (!data.cardExpiry || !/^\d{2}\/\d{2}$/.test(data.cardExpiry)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Data de validade deve estar no formato MM/AA',
        path: ['cardExpiry']
      })
    }
    
    if (!data.cardCvv || data.cardCvv.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CVV deve ter pelo menos 3 dígitos',
        path: ['cardCvv']
      })
    }
  }
})

type PersonalData = z.infer<typeof personalDataSchema>
type Address = z.infer<typeof addressSchema>
type Payment = z.infer<typeof paymentSchema>

interface CheckoutData {
  personalData: PersonalData
  address: Address
  payment: Payment
}

const steps = [
  { id: 1, title: 'Dados Pessoais', icon: User },
  { id: 2, title: 'Endereço', icon: MapPin },
  { id: 3, title: 'Pagamento', icon: CreditCard },
  { id: 4, title: 'Confirmação', icon: Package }
]

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, clearCart } = useCart()
  const { createOrder, loading: isCreatingOrder } = useOrders()
  const [currentStep, setCurrentStep] = useState(1)
  const [checkoutData, setCheckoutData] = useState<Partial<CheckoutData>>({})
  const [isProcessing, setIsProcessing] = useState(false)

  const personalForm = useForm<PersonalData>({
    resolver: zodResolver(personalDataSchema),
    defaultValues: checkoutData.personalData
  })

  const addressForm = useForm<Address>({
    resolver: zodResolver(addressSchema),
    defaultValues: checkoutData.address
  })

  const paymentForm = useForm<Payment>({
    resolver: zodResolver(paymentSchema),
    defaultValues: checkoutData.payment
  })

  const totalAmount = total
  const shipping = 15.90
  const finalTotal = totalAmount + shipping

  if (items.length === 0) {
    router.push('/carrinho')
    return null
  }

  const handlePersonalDataSubmit = (data: PersonalData) => {
    setCheckoutData(prev => ({ ...prev, personalData: data }))
    setCurrentStep(2)
  }

  const handleAddressSubmit = (data: Address) => {
    setCheckoutData(prev => ({ ...prev, address: data }))
    setCurrentStep(3)
  }

  const handlePaymentSubmit = (data: Payment) => {
    setCheckoutData(prev => ({ ...prev, payment: data }))
    setCurrentStep(4)
  }

  const handleFinalSubmit = async () => {
    if (!checkoutData.personalData || !checkoutData.address || !checkoutData.payment) {
      toast.error('Dados incompletos. Verifique todas as etapas.')
      return
    }

    setIsProcessing(true)
    
    try {
      const orderData = {
         customerData: {
           name: `${checkoutData.personalData.firstName} ${checkoutData.personalData.lastName}`,
           email: checkoutData.personalData.email,
           phone: checkoutData.personalData.phone,
           cpf: checkoutData.personalData.cpf
         },
         shippingAddress: {
           cep: checkoutData.address.zipCode,
           street: checkoutData.address.street,
           number: checkoutData.address.number,
           complement: checkoutData.address.complement || '',
           neighborhood: checkoutData.address.neighborhood,
           city: checkoutData.address.city,
           state: checkoutData.address.state
         },
         paymentMethod: checkoutData.payment.method,
         items: items.map(item => ({
           id: item.productId,
           sku: item.sku,
           name: item.name,
           price: item.price,
           quantity: item.quantity,
           selectedSize: item.size,
            selectedColor: item.color,
           image: item.image,
           trackQuantity: true,
            currentStock: item.stock || 0
         })),
         subtotal: totalAmount,
         shippingCost: shipping,
         discountAmount: 0,
         totalAmount: finalTotal
       }
      
      const order = await createOrder(orderData)
      
      clearCart()
      toast.success('Pedido realizado com sucesso!')
      if (order?.id) {
        router.push(`/pedido-confirmado?id=${order.id}`)
      } else {
        router.push('/pedido-confirmado')
      }
    } catch (error) {
      console.error('Erro ao criar pedido:', error)
      toast.error('Erro ao processar pedido. Tente novamente.')
    } finally {
      setIsProcessing(false)
    }
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => {
        const Icon = step.icon
        const isActive = currentStep === step.id
        const isCompleted = currentStep > step.id
        
        return (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              isCompleted 
                ? 'bg-primary border-primary text-primary-foreground'
                : isActive
                ? 'border-primary text-primary'
                : 'border-muted-foreground text-muted-foreground'
            }`}>
              {isCompleted ? (
                <Check className="h-5 w-5" />
              ) : (
                <Icon className="h-5 w-5" />
              )}
            </div>
            
            <div className="ml-2 mr-4">
              <p className={`text-sm font-medium ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {step.title}
              </p>
            </div>
            
            {index < steps.length - 1 && (
              <div className={`w-12 h-0.5 ${
                currentStep > step.id ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )

  const renderPersonalDataStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Dados Pessoais</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...personalForm}>
          <form onSubmit={personalForm.handleSubmit(handlePersonalDataSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={personalForm.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <TouchInput placeholder="Seu nome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={personalForm.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sobrenome</FormLabel>
                    <FormControl>
                      <TouchInput placeholder="Seu sobrenome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={personalForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <TouchInput type="email" placeholder="seu@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={personalForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <TouchInput placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={personalForm.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <TouchInput placeholder="000.000.000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end">
              <TouchButton>
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </TouchButton>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )

  const renderAddressStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Endereço de Entrega</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...addressForm}>
          <form onSubmit={addressForm.handleSubmit(handleAddressSubmit)} className="space-y-4">
            <FormField
              control={addressForm.control}
              name="zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP</FormLabel>
                  <FormControl>
                    <TouchInput placeholder="00000-000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <FormField
                  control={addressForm.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <TouchInput placeholder="Rua, Avenida, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={addressForm.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <TouchInput placeholder="123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={addressForm.control}
              name="complement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complemento (opcional)</FormLabel>
                  <FormControl>
                    <TouchInput placeholder="Apartamento, bloco, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={addressForm.control}
                name="neighborhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <TouchInput placeholder="Bairro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addressForm.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <TouchInput placeholder="Cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addressForm.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="UF" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SP">SP</SelectItem>
                          <SelectItem value="RJ">RJ</SelectItem>
                          <SelectItem value="MG">MG</SelectItem>
                          <SelectItem value="RS">RS</SelectItem>
                          <SelectItem value="PR">PR</SelectItem>
                          <SelectItem value="SC">SC</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-between">
              <TouchButton variant="secondary" onClick={() => setCurrentStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </TouchButton>
              <TouchButton>
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </TouchButton>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )

  const renderPaymentStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Forma de Pagamento</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...paymentForm}>
          <form onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)} className="space-y-6">
            <FormField
              control={paymentForm.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Pagamento</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      <div className="flex items-center space-x-2 border rounded-lg p-4">
                        <RadioGroupItem value="credit" id="credit" />
                        <Label htmlFor="credit" className="flex-1 cursor-pointer">
                          <div>
                            <p className="font-medium">Cartão de Crédito</p>
                            <p className="text-sm text-muted-foreground">Parcelamento em até 12x</p>
                          </div>
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2 border rounded-lg p-4">
                        <RadioGroupItem value="debit" id="debit" />
                        <Label htmlFor="debit" className="flex-1 cursor-pointer">
                          <div>
                            <p className="font-medium">Cartão de Débito</p>
                            <p className="text-sm text-muted-foreground">À vista</p>
                          </div>
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2 border rounded-lg p-4">
                        <RadioGroupItem value="pix" id="pix" />
                        <Label htmlFor="pix" className="flex-1 cursor-pointer">
                          <div>
                            <p className="font-medium">PIX</p>
                            <p className="text-sm text-muted-foreground">Aprovação imediata</p>
                          </div>
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2 border rounded-lg p-4">
                        <RadioGroupItem value="boleto" id="boleto" />
                        <Label htmlFor="boleto" className="flex-1 cursor-pointer">
                          <div>
                            <p className="font-medium">Boleto Bancário</p>
                            <p className="text-sm text-muted-foreground">Vencimento em 3 dias</p>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {(paymentForm.watch('method') === 'credit' || paymentForm.watch('method') === 'debit') && (
              <div className="space-y-4 border-t pt-4">
                <FormField
                  control={paymentForm.control}
                  name="cardNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do Cartão</FormLabel>
                      <FormControl>
                        <TouchInput placeholder="0000 0000 0000 0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={paymentForm.control}
                  name="cardName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome no Cartão</FormLabel>
                      <FormControl>
                        <TouchInput placeholder="Nome como está no cartão" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={paymentForm.control}
                    name="cardExpiry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Validade</FormLabel>
                        <FormControl>
                          <TouchInput placeholder="MM/AA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={paymentForm.control}
                    name="cardCvv"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CVV</FormLabel>
                        <FormControl>
                          <TouchInput placeholder="000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {paymentForm.watch('method') === 'credit' && (
                  <FormField
                    control={paymentForm.control}
                    name="installments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parcelamento</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1x de {formatPrice(finalTotal)} sem juros</SelectItem>
                              <SelectItem value="2">2x de {formatPrice(finalTotal / 2)} sem juros</SelectItem>
                              <SelectItem value="3">3x de {formatPrice(finalTotal / 3)} sem juros</SelectItem>
                              <SelectItem value="6">6x de {formatPrice(finalTotal / 6)} sem juros</SelectItem>
                              <SelectItem value="12">12x de {formatPrice(finalTotal / 12)} sem juros</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}
            
            <div className="flex justify-between">
              <TouchButton variant="secondary" onClick={() => setCurrentStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </TouchButton>
              <TouchButton>
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </TouchButton>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )

  const renderConfirmationStep = () => (
    <div className="space-y-6">
      {/* Resumo dos Dados */}
      <Card>
        <CardHeader>
          <CardTitle>Confirmação do Pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dados Pessoais */}
          <div>
            <h3 className="font-semibold mb-2">Dados Pessoais</h3>
            <div className="text-sm space-y-1">
              <p>{checkoutData.personalData?.firstName} {checkoutData.personalData?.lastName}</p>
              <p>{checkoutData.personalData?.email}</p>
              <p>{checkoutData.personalData?.phone}</p>
            </div>
          </div>
          
          <Separator />
          
          {/* Endereço */}
          <div>
            <h3 className="font-semibold mb-2">Endereço de Entrega</h3>
            <div className="text-sm space-y-1">
              <p>{checkoutData.address?.street}, {checkoutData.address?.number}</p>
              {checkoutData.address?.complement && <p>{checkoutData.address.complement}</p>}
              <p>{checkoutData.address?.neighborhood}</p>
              <p>{checkoutData.address?.city} - {checkoutData.address?.state}</p>
              <p>CEP: {checkoutData.address?.zipCode}</p>
            </div>
          </div>
          
          <Separator />
          
          {/* Pagamento */}
          <div>
            <h3 className="font-semibold mb-2">Forma de Pagamento</h3>
            <div className="text-sm">
              {checkoutData.payment?.method === 'credit' && (
                <p>Cartão de Crédito - {checkoutData.payment.installments}x</p>
              )}
              {checkoutData.payment?.method === 'debit' && <p>Cartão de Débito</p>}
              {checkoutData.payment?.method === 'pix' && <p>PIX</p>}
              {checkoutData.payment?.method === 'boleto' && <p>Boleto Bancário</p>}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Itens do Pedido */}
      <Card>
        <CardHeader>
          <CardTitle>Itens do Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={`${item.id}-${item.size}-${item.color}`} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Qtd: {item.quantity} | {item.size} | {item.color}
                  </p>
                </div>
                <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Frete</span>
                <span>{formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatPrice(finalTotal)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <TouchButton variant="secondary" onClick={() => setCurrentStep(3)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </TouchButton>
        <TouchButton 
          onClick={handleFinalSubmit}
          disabled={isProcessing || isCreatingOrder}
          size="lg"
          className="min-w-[200px]"
        >
          {(isProcessing || isCreatingOrder) ? 'Processando...' : 'Finalizar Pedido'}
        </TouchButton>
      </div>
    </div>
  )

  return (
    <ComponentErrorBoundary>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Checkout</h1>
          <p className="text-muted-foreground">Finalize sua compra em poucos passos</p>
        </div>
        
        {renderStepIndicator()}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {currentStep === 1 && renderPersonalDataStep()}
            {currentStep === 2 && renderAddressStep()}
            {currentStep === 3 && renderPaymentStep()}
            {currentStep === 4 && renderConfirmationStep()}
          </div>
          
          {/* Resumo do Pedido - Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    {items.slice(0, 3).map((item) => (
                      <div key={`${item.id}-${item.size}-${item.color}`} className="flex justify-between text-sm">
                        <span className="truncate">{item.name} x{item.quantity}</span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    {items.length > 3 && (
                      <p className="text-sm text-muted-foreground">+{items.length - 3} outros itens</p>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatPrice(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frete</span>
                      <span>{formatPrice(shipping)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-base">
                      <span>Total</span>
                      <span>{formatPrice(finalTotal)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Trust Elements */}
            <CheckoutTrustElements className="mt-4" />
          </div>
        </div>
      </div>
    </ComponentErrorBoundary>
  )
}