import { NextRequest, NextResponse } from 'next/server'
// import { headers } from 'next/headers'

// Interface para configuração de rate limiting
interface RateLimitConfig {
  windowMs: number // Janela de tempo em ms
  maxRequests: number // Máximo de requests por janela
  message?: string // Mensagem de erro customizada
  skipSuccessfulRequests?: boolean // Pular requests bem-sucedidos
  skipFailedRequests?: boolean // Pular requests com erro
  keyGenerator?: (req: NextRequest) => string // Função para gerar chave única
}

// Store em memória para rate limiting (em produção, usar Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

// Configurações padrão para diferentes endpoints
export const rateLimitConfigs = {
  // APIs públicas - mais restritivo
  public: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 100, // 100 requests por 15 min
    message: 'Muitas tentativas. Tente novamente em 15 minutos.'
  },
  
  // APIs de autenticação - muito restritivo
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 5, // 5 tentativas por 15 min
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    skipSuccessfulRequests: true
  },
  
  // APIs de busca - moderado
  search: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    maxRequests: 30, // 30 buscas por minuto
    message: 'Muitas buscas. Aguarde um momento.'
  },
  
  // APIs de carrinho - liberal
  cart: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    maxRequests: 60, // 60 requests por minuto
    message: 'Muitas operações no carrinho. Aguarde um momento.'
  },
  
  // APIs de contato/feedback - restritivo
  contact: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 3, // 3 mensagens por hora
    message: 'Limite de mensagens atingido. Tente novamente em 1 hora.'
  },
  
  // Upload de arquivos - muito restritivo
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 10, // 10 uploads por hora
    message: 'Limite de uploads atingido. Tente novamente em 1 hora.'
  }
} as const

// Função para obter IP do cliente
function getClientIP(req: NextRequest): string {
  // Verificar headers de proxy
  const forwarded = req.headers.get('x-forwarded-for')
  const realIP = req.headers.get('x-real-ip')
  const cfConnectingIP = req.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  // Fallback para IP do Next.js
  return req.ip || 'unknown'
}

// Função para gerar chave única do rate limit
function generateKey(req: NextRequest, config: RateLimitConfig): string {
  if (config.keyGenerator) {
    return config.keyGenerator(req)
  }
  
  const ip = getClientIP(req)
  // const userAgent = req.headers.get('user-agent') || 'unknown'
  const endpoint = req.nextUrl.pathname
  
  // Combinar IP + endpoint para chave única
  return `${ip}:${endpoint}`
}

// Middleware principal de rate limiting
export function createRateLimit(config: RateLimitConfig) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const key = generateKey(req, config)
    const now = Date.now()
    
    // Obter ou criar entrada para esta chave
    let entry = requestCounts.get(key)
    
    // Se não existe ou expirou, criar nova entrada
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs
      }
      requestCounts.set(key, entry)
    }
    
    // Incrementar contador
    entry.count++
    
    // Verificar se excedeu o limite
    if (entry.count > config.maxRequests) {
      const resetTime = Math.ceil((entry.resetTime - now) / 1000)
      
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: config.message || 'Muitas tentativas. Tente novamente mais tarde.',
          retryAfter: resetTime
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString(),
            'Retry-After': resetTime.toString()
          }
        }
      )
    }
    
    // Adicionar headers informativos
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', (config.maxRequests - entry.count).toString())
    response.headers.set('X-RateLimit-Reset', entry.resetTime.toString())
    
    return null // Continuar processamento
  }
}

// Rate limiters específicos
export const publicRateLimit = createRateLimit(rateLimitConfigs.public)
export const authRateLimit = createRateLimit(rateLimitConfigs.auth)
export const searchRateLimit = createRateLimit(rateLimitConfigs.search)
export const cartRateLimit = createRateLimit(rateLimitConfigs.cart)
export const contactRateLimit = createRateLimit(rateLimitConfigs.contact)
export const uploadRateLimit = createRateLimit(rateLimitConfigs.upload)

// Função para limpar entradas expiradas (executar periodicamente)
export function cleanupExpiredEntries() {
  const now = Date.now()
  
  for (const [key, entry] of requestCounts.entries()) {
    if (now > entry.resetTime) {
      requestCounts.delete(key)
    }
  }
}

// Rate limiting baseado em usuário autenticado
export function createUserRateLimit(config: RateLimitConfig) {
  return createRateLimit({
    ...config,
    keyGenerator: (req: NextRequest) => {
      // Tentar obter ID do usuário do token/session
      const authHeader = req.headers.get('authorization')
      const sessionCookie = req.cookies.get('session')?.value
      
      if (authHeader || sessionCookie) {
        // Em uma implementação real, decodificar o token para obter o user ID
        // Por agora, usar um hash do token como identificador
        const identifier = authHeader || sessionCookie || ''
        return `user:${identifier.slice(-10)}:${req.nextUrl.pathname}`
      }
      
      // Fallback para IP se não autenticado
      return `ip:${getClientIP(req)}:${req.nextUrl.pathname}`
    }
  })
}

// Rate limiting adaptativo baseado na carga do servidor
export function createAdaptiveRateLimit(baseConfig: RateLimitConfig) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    // Simular verificação de carga do servidor
    const serverLoad = getServerLoad()
    
    // Ajustar limites baseado na carga
    const adjustedConfig = { ...baseConfig }
    
    if (serverLoad > 0.8) {
      // Alta carga - reduzir limites em 50%
      adjustedConfig.maxRequests = Math.floor(baseConfig.maxRequests * 0.5)
    } else if (serverLoad > 0.6) {
      // Carga média - reduzir limites em 25%
      adjustedConfig.maxRequests = Math.floor(baseConfig.maxRequests * 0.75)
    }
    
    const rateLimit = createRateLimit(adjustedConfig)
    return rateLimit(req)
  }
}

// Função simulada para obter carga do servidor
function getServerLoad(): number {
  // Em uma implementação real, isso verificaria:
  // - CPU usage
  // - Memory usage
  // - Active connections
  // - Response times
  
  // Por agora, simular baseado no número de entradas ativas
  const activeEntries = requestCounts.size
  return Math.min(activeEntries / 1000, 1) // Normalizar para 0-1
}

// Whitelist de IPs (para desenvolvimento/admin)
const whitelistedIPs = new Set([
  '127.0.0.1',
  '::1',
  'localhost'
])

// Rate limiting com whitelist
export function createWhitelistedRateLimit(config: RateLimitConfig) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const clientIP = getClientIP(req)
    
    // Pular rate limiting para IPs na whitelist
    if (whitelistedIPs.has(clientIP)) {
      return null
    }
    
    const rateLimit = createRateLimit(config)
    return rateLimit(req)
  }
}

// Função para adicionar IP à whitelist
export function addToWhitelist(ip: string) {
  whitelistedIPs.add(ip)
}

// Função para remover IP da whitelist
export function removeFromWhitelist(ip: string) {
  whitelistedIPs.delete(ip)
}

// Estatísticas de rate limiting
export function getRateLimitStats() {
  const now = Date.now()
  const activeEntries = Array.from(requestCounts.entries())
    .filter(([, entry]) => now <= entry.resetTime)
  
  const stats = {
    totalActiveKeys: activeEntries.length,
    totalRequests: activeEntries.reduce((sum, [, entry]) => sum + entry.count, 0),
    averageRequestsPerKey: activeEntries.length > 0 
      ? activeEntries.reduce((sum, [, entry]) => sum + entry.count, 0) / activeEntries.length 
      : 0,
    topKeys: activeEntries
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([key, entry]) => ({ key, count: entry.count }))
  }
  
  return stats
}

// Executar limpeza a cada 5 minutos
if (typeof window === 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000)
}