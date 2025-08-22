import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

// Schemas de validação usando Zod

// Schema para produto
export const produtoSchema = z.object({
  nome: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-_]+$/, 'Nome contém caracteres inválidos'),
  
  descricao: z.string()
    .min(10, 'Descrição deve ter pelo menos 10 caracteres')
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres'),
  
  preco: z.number()
    .positive('Preço deve ser positivo')
    .max(999999.99, 'Preço muito alto')
    .multipleOf(0.01, 'Preço deve ter no máximo 2 casas decimais'),
  
  categoria_id: z.string().uuid('ID da categoria inválido'),
  
  estoque: z.number()
    .int('Estoque deve ser um número inteiro')
    .min(0, 'Estoque não pode ser negativo')
    .max(999999, 'Estoque muito alto'),
  
  ativo: z.boolean(),
  
  imagens: z.array(z.string().url('URL da imagem inválida'))
    .max(10, 'Máximo 10 imagens por produto'),
  
  tags: z.array(z.string().max(50, 'Tag muito longa'))
    .max(20, 'Máximo 20 tags por produto'),
  
  peso: z.number().positive('Peso deve ser positivo').optional(),
  dimensoes: z.object({
    altura: z.number().positive(),
    largura: z.number().positive(),
    profundidade: z.number().positive(),
  }).optional(),
})

// Schema para usuário
export const usuarioSchema = z.object({
  nome: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),
  
  email: z.string()
    .email('Email inválido')
    .max(255, 'Email muito longo')
    .toLowerCase(),
  
  telefone: z.string()
    .regex(/^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/, 'Telefone inválido')
    .optional(),
  
  cpf: z.string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido')
    .refine(validarCPF, 'CPF inválido'),
  
  data_nascimento: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
    .refine(validarIdade, 'Deve ser maior de 16 anos'),
})

// Schema para endereço
export const enderecoSchema = z.object({
  cep: z.string()
    .regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
  
  logradouro: z.string()
    .min(5, 'Logradouro deve ter pelo menos 5 caracteres')
    .max(200, 'Logradouro muito longo'),
  
  numero: z.string()
    .min(1, 'Número é obrigatório')
    .max(10, 'Número muito longo'),
  
  complemento: z.string()
    .max(100, 'Complemento muito longo')
    .optional(),
  
  bairro: z.string()
    .min(2, 'Bairro deve ter pelo menos 2 caracteres')
    .max(100, 'Bairro muito longo'),
  
  cidade: z.string()
    .min(2, 'Cidade deve ter pelo menos 2 caracteres')
    .max(100, 'Cidade muito longa'),
  
  estado: z.string()
    .length(2, 'Estado deve ter 2 caracteres')
    .toUpperCase(),
})

// Schema para pedido
export const pedidoSchema = z.object({
  itens: z.array(z.object({
    produto_id: z.string().uuid('ID do produto inválido'),
    quantidade: z.number()
      .int('Quantidade deve ser um número inteiro')
      .positive('Quantidade deve ser positiva')
      .max(100, 'Quantidade muito alta'),
    preco_unitario: z.number().positive('Preço unitário deve ser positivo'),
  })).min(1, 'Pedido deve ter pelo menos 1 item'),
  
  endereco_entrega: enderecoSchema,
  
  metodo_pagamento: z.enum(['cartao_credito', 'cartao_debito', 'pix', 'boleto']),
  
  observacoes: z.string()
    .max(500, 'Observações muito longas')
    .optional(),
})

// Schema para busca
export const buscaSchema = z.object({
  q: z.string()
    .min(1, 'Termo de busca é obrigatório')
    .max(100, 'Termo de busca muito longo')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-_]+$/, 'Termo de busca contém caracteres inválidos'),
  
  categoria: z.string().uuid().optional(),
  
  preco_min: z.number().min(0).optional(),
  preco_max: z.number().min(0).optional(),
  
  ordenar: z.enum(['relevancia', 'preco_asc', 'preco_desc', 'nome', 'data']).optional(),
  
  pagina: z.number().int().min(1).max(1000).optional(),
  limite: z.number().int().min(1).max(100).optional(),
})

// Schema para contato
export const contatoSchema = z.object({
  nome: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  
  email: z.string().email('Email inválido'),
  
  assunto: z.string()
    .min(5, 'Assunto deve ter pelo menos 5 caracteres')
    .max(200, 'Assunto muito longo'),
  
  mensagem: z.string()
    .min(10, 'Mensagem deve ter pelo menos 10 caracteres')
    .max(2000, 'Mensagem muito longa'),
})

// Schema para avaliação
export const avaliacaoSchema = z.object({
  produto_id: z.string().uuid('ID do produto inválido'),
  
  nota: z.number()
    .int('Nota deve ser um número inteiro')
    .min(1, 'Nota mínima é 1')
    .max(5, 'Nota máxima é 5'),
  
  titulo: z.string()
    .min(5, 'Título deve ter pelo menos 5 caracteres')
    .max(100, 'Título muito longo'),
  
  comentario: z.string()
    .min(10, 'Comentário deve ter pelo menos 10 caracteres')
    .max(1000, 'Comentário muito longo'),
})

// Funções de validação customizadas

// Validar CPF
function validarCPF(cpf: string): boolean {
  const numeros = cpf.replace(/\D/g, '')
  
  if (numeros.length !== 11) return false
  if (/^(\d)\1{10}$/.test(numeros)) return false
  
  let soma = 0
  for (let i = 0; i < 9; i++) {
    soma += parseInt(numeros[i]) * (10 - i)
  }
  
  let resto = soma % 11
  const digito1 = resto < 2 ? 0 : 11 - resto
  
  if (parseInt(numeros[9]) !== digito1) return false
  
  soma = 0
  for (let i = 0; i < 10; i++) {
    soma += parseInt(numeros[i]) * (11 - i)
  }
  
  resto = soma % 11
  const digito2 = resto < 2 ? 0 : 11 - resto
  
  return parseInt(numeros[10]) === digito2
}

// Validar idade mínima
function validarIdade(data: string): boolean {
  const nascimento = new Date(data)
  const hoje = new Date()
  const idade = hoje.getFullYear() - nascimento.getFullYear()
  const mesAtual = hoje.getMonth()
  const diaAtual = hoje.getDate()
  const mesNascimento = nascimento.getMonth()
  const diaNascimento = nascimento.getDate()
  
  if (mesAtual < mesNascimento || (mesAtual === mesNascimento && diaAtual < diaNascimento)) {
    return idade - 1 >= 16
  }
  
  return idade >= 16
}

// Funções de sanitização

// Sanitizar HTML
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  })
}

// Sanitizar texto simples
export function sanitizeText(text: string): string {
  return text
    .replace(/[<>"'&]/g, '') // Remove caracteres HTML perigosos
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim()
}

// Sanitizar SQL (para queries dinâmicas)
export function sanitizeSql(input: string): string {
  return input
    .replace(/[';"\\]/g, '') // Remove caracteres SQL perigosos
    .replace(/\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|EXEC|UNION|SELECT)\b/gi, '') // Remove palavras SQL perigosas
    .trim()
}

// Sanitizar nome de arquivo
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Substitui caracteres especiais por underscore
    .replace(/_{2,}/g, '_') // Remove underscores duplos
    .replace(/^_+|_+$/g, '') // Remove underscores do início e fim
    .toLowerCase()
}

// Sanitizar URL
export function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    
    // Permitir apenas HTTP e HTTPS
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Protocolo não permitido')
    }
    
    return urlObj.toString()
  } catch {
    return ''
  }
}

// Validar e sanitizar entrada de API
export function validateAndSanitize<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  sanitize = true
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    // Sanitizar strings se solicitado
    if (sanitize && typeof data === 'object' && data !== null) {
      data = sanitizeObject(data)
    }
    
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      return { success: false, errors }
    }
    
    return { success: false, errors: ['Erro de validação desconhecido'] }
  }
}

// Sanitizar objeto recursivamente
function sanitizeObject(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return sanitizeText(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject)
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value)
    }
    return sanitized
  }
  
  return obj
}

// Rate limiting por IP
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  ip: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = `${ip}:${Math.floor(now / windowMs)}`
  
  const current = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs }
  
  if (current.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime,
    }
  }
  
  current.count++
  rateLimitStore.set(key, current)
  
  // Limpar entradas antigas
  for (const [k, v] of rateLimitStore.entries()) {
    if (v.resetTime < now) {
      rateLimitStore.delete(k)
    }
  }
  
  return {
    allowed: true,
    remaining: maxRequests - current.count,
    resetTime: current.resetTime,
  }
}

// Detectar tentativas de XSS
export function detectXSS(input: string): boolean {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>/gi,
    /expression\s*\(/gi,
    /vbscript:/gi,
  ]
  
  return xssPatterns.some(pattern => pattern.test(input))
}

// Detectar tentativas de SQL Injection
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /('|(\-\-)|(;)|(\||\|)|(\*|\*))/gi,
    /(union|select|insert|delete|update|drop|create|alter|exec|execute)/gi,
    /\b(or|and)\s+\d+\s*=\s*\d+/gi,
    /\b(or|and)\s+['"]\w+['"]\s*=\s*['"]\w+['"]/gi,
  ]
  
  return sqlPatterns.some(pattern => pattern.test(input))
}

// Middleware de validação para APIs
export function createValidationMiddleware<T>(
  schema: z.ZodSchema<T>,
  options: {
    sanitize?: boolean
    detectAttacks?: boolean
  } = {}
) {
  return (data: unknown) => {
    const { sanitize = true, detectAttacks = true } = options
    
    // Detectar ataques se habilitado
    if (detectAttacks && typeof data === 'string') {
      if (detectXSS(data) || detectSQLInjection(data)) {
        throw new Error('Tentativa de ataque detectada')
      }
    }
    
    // Validar e sanitizar
    const result = validateAndSanitize(data, schema, sanitize)
    
    if (!result.success) {
      throw new Error(`Dados inválidos: ${result.errors.join(', ')}`)
    }
    
    return result.data
  }
}

// Exportar schemas para uso em APIs
export const schemas = {
  produto: produtoSchema,
  usuario: usuarioSchema,
  endereco: enderecoSchema,
  pedido: pedidoSchema,
  busca: buscaSchema,
  contato: contatoSchema,
  avaliacao: avaliacaoSchema,
}