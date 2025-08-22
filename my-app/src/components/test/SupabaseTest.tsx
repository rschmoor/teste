'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// Definições de tipos para o resultado do teste e dados de produto
interface ProductData {
  id: string | number
  name: string
  sku: string
  sale_price: number
}

interface TestResult {
  success: true
  count: number
  data: ProductData[] | null
}

export default function SupabaseTest() {
  const [result, setResult] = useState<TestResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const supabase = createClient()
      
      console.log('Testing Supabase connection...')
      
      // Teste 1: Consulta simples
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, sale_price')
        .limit(3)
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }
      
      setResult({
        success: true,
        count: data?.length || 0,
        data: (data || null) as ProductData[] | null
      })
      
    } catch (err: unknown) {
      console.error('Test error:', err)
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Teste de Conexão Supabase</h3>
      
      <button 
        onClick={testConnection}
        disabled={loading}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testando...' : 'Testar Conexão'}
      </button>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Erro:</strong> {error}
        </div>
      )}
      
      {result && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          <strong>Sucesso!</strong> Encontrados {result.count} produtos.
          <pre className="mt-2 text-sm">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}