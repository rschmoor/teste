import { NextRequest, NextResponse } from 'next/server'

// Interface para configuração de CORS
interface CORSConfig {
  origin?: string | string[] | boolean | ((origin: string) => boolean)
  methods?: string[]
  allowedHeaders?: string[]
  exposedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
  preflightContinue?: boolean
  optionsSuccessStatus?: number
}

// Configurações CORS por ambiente
const corsConfigs = {
  development: {
    origin: true, // Permitir qualquer origem em desenvolvimento
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-CSRF-Token',
      'X-API-Key'
    ],
    exposedHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'X-Total-Count',
      'X-Page-Count'
    ],
    credentials: true,
    maxAge: 86400 // 24 horas
  },
  
  production: {
    origin: [
      'https://boutique.com',
      'https://www.boutique.com',
      'https://app.boutique.com',
      'https://admin.boutique.com'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'X-CSRF-Token'
    ],
    exposedHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-Total-Count'
    ],
    credentials: true,
    maxAge: 3600 // 1 hora
  },
  
  test: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
    maxAge: 0
  }
} as const

// Obter configuração baseada no ambiente
function getCORSConfig(): CORSConfig {
  const env = process.env.NODE_ENV as keyof typeof corsConfigs
  return corsConfigs[env] || corsConfigs.development
}

// Verificar se origem é permitida
function isOriginAllowed(origin: string | null, allowedOrigin: CORSConfig['origin']): boolean {
  if (!origin) return false
  
  if (allowedOrigin === true) {
    return true
  }
  
  if (allowedOrigin === false) {
    return false
  }
  
  if (typeof allowedOrigin === 'string') {
    return origin === allowedOrigin
  }
  
  if (Array.isArray(allowedOrigin)) {
    return allowedOrigin.includes(origin)
  }
  
  if (typeof allowedOrigin === 'function') {
    return allowedOrigin(origin)
  }
  
  return false
}

// Middleware principal de CORS
export function createCORSMiddleware(customConfig?: Partial<CORSConfig>) {
  const config = { ...getCORSConfig(), ...customConfig }
  
  return (req: NextRequest): NextResponse => {
    const origin = req.headers.get('origin')
    const method = req.method
    
    // Criar response
    let response: NextResponse
    
    // Verificar se é uma requisição OPTIONS (preflight)
    if (method === 'OPTIONS') {
      response = new NextResponse(null, {
        status: config.optionsSuccessStatus || 204
      })
    } else {
      response = NextResponse.next()
    }
    
    // Configurar Access-Control-Allow-Origin
    if (origin && isOriginAllowed(origin, config.origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    } else if (config.origin === true) {
      response.headers.set('Access-Control-Allow-Origin', '*')
    }
    
    // Configurar Access-Control-Allow-Methods
    if (config.methods) {
      response.headers.set('Access-Control-Allow-Methods', config.methods.join(', '))
    }
    
    // Configurar Access-Control-Allow-Headers
    if (config.allowedHeaders) {
      response.headers.set('Access-Control-Allow-Headers', config.allowedHeaders.join(', '))
    }
    
    // Configurar Access-Control-Expose-Headers
    if (config.exposedHeaders) {
      response.headers.set('Access-Control-Expose-Headers', config.exposedHeaders.join(', '))
    }
    
    // Configurar Access-Control-Allow-Credentials
    if (config.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }
    
    // Configurar Access-Control-Max-Age
    if (config.maxAge !== undefined) {
      response.headers.set('Access-Control-Max-Age', config.maxAge.toString())
    }
    
    // Headers de segurança adicionais
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    // Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' https:",
      "connect-src 'self' https://www.google-analytics.com https://api.boutique.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ')
    
    response.headers.set('Content-Security-Policy', csp)
    
    // Strict Transport Security (apenas em HTTPS)
    if (req.nextUrl.protocol === 'https:') {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      )
    }
    
    return response
  }
}

// CORS específico para APIs públicas
export const publicAPICORS = createCORSMiddleware({
  origin: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Accept'],
  credentials: false
})

// CORS específico para APIs autenticadas
export const authenticatedAPICORS = createCORSMiddleware({
  origin: (origin: string) => {
    // Permitir origens específicas ou localhost em desenvolvimento
    const allowedOrigins = [
      'https://boutique.com',
      'https://www.boutique.com',
      'https://app.boutique.com'
    ]
    
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000')
    }
    
    return allowedOrigins.includes(origin)
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-CSRF-Token',
    'X-Requested-With'
  ],
  credentials: true
})

// CORS específico para webhooks
export const webhookCORS = createCORSMiddleware({
  origin: false, // Não permitir CORS para webhooks
  methods: ['POST'],
  allowedHeaders: ['Content-Type', 'X-Webhook-Signature'],
  credentials: false
})

// CORS específico para uploads
export const uploadCORS = createCORSMiddleware({
  origin: (origin: string) => {
    const allowedOrigins = ['https://boutique.com', 'https://www.boutique.com']
    
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000')
    }
    
    return allowedOrigins.includes(origin)
  },
  methods: ['POST', 'PUT'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Upload-Token',
    'X-File-Name',
    'X-File-Size'
  ],
  credentials: true,
  maxAge: 300 // 5 minutos para uploads
})

// Middleware para validar Content-Type
export function validateContentType(allowedTypes: string[]) {
  return (req: NextRequest): NextResponse | null => {
    const contentType = req.headers.get('content-type')
    
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      return null // Pular validação para métodos sem body
    }
    
    if (!contentType) {
      return NextResponse.json(
        { error: 'Content-Type header is required' },
        { status: 400 }
      )
    }
    
    const isAllowed = allowedTypes.some(type => 
      contentType.toLowerCase().includes(type.toLowerCase())
    )
    
    if (!isAllowed) {
      return NextResponse.json(
        {
          error: 'Invalid Content-Type',
          allowed: allowedTypes,
          received: contentType
        },
        { status: 415 }
      )
    }
    
    return null
  }
}

// Validadores de Content-Type específicos
export const validateJSONContentType = validateContentType(['application/json'])
export const validateFormContentType = validateContentType([
  'application/x-www-form-urlencoded',
  'multipart/form-data'
])
export const validateFileUploadContentType = validateContentType([
  'multipart/form-data',
  'application/octet-stream',
  'image/',
  'video/',
  'audio/'
])

// Middleware para validar User-Agent
export function validateUserAgent(req: NextRequest): NextResponse | null {
  const userAgent = req.headers.get('user-agent')
  
  if (!userAgent) {
    return NextResponse.json(
      { error: 'User-Agent header is required' },
      { status: 400 }
    )
  }
  
  // Bloquear user agents suspeitos
  const blockedPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i
  ]
  
  // Permitir bots legítimos
  const allowedBots = [
    /googlebot/i,
    /bingbot/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i
  ]
  
  const isBlockedBot = blockedPatterns.some(pattern => pattern.test(userAgent))
  const isAllowedBot = allowedBots.some(pattern => pattern.test(userAgent))
  
  if (isBlockedBot && !isAllowedBot) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    )
  }
  
  return null
}

// Middleware combinado de segurança
export function createSecurityMiddleware(config?: {
  cors?: Partial<CORSConfig>
  validateContentType?: string[]
  validateUserAgent?: boolean
  rateLimit?: boolean
}) {
  const corsMiddleware = createCORSMiddleware(config?.cors)
  const contentTypeValidator = config?.validateContentType 
    ? validateContentType(config.validateContentType)
    : null
  
  return (req: NextRequest): NextResponse => {
    // Aplicar CORS
    const corsResponse = corsMiddleware(req)
    
    // Se é OPTIONS, retornar resposta CORS
    if (req.method === 'OPTIONS') {
      return corsResponse
    }
    
    // Validar User-Agent se habilitado
    if (config?.validateUserAgent) {
      const userAgentResponse = validateUserAgent(req)
      if (userAgentResponse) {
        return userAgentResponse
      }
    }
    
    // Validar Content-Type se configurado
    if (contentTypeValidator) {
      const contentTypeResponse = contentTypeValidator(req)
      if (contentTypeResponse) {
        return contentTypeResponse
      }
    }
    
    return corsResponse
  }
}

// Middleware padrão para a aplicação
export const defaultSecurityMiddleware = createSecurityMiddleware({
  validateUserAgent: true,
  validateContentType: ['application/json', 'multipart/form-data']
})