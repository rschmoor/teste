import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'Nenhuma imagem foi enviada' },
        { status: 400 }
      )
    }

    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'O arquivo deve ser uma imagem' },
        { status: 400 }
      )
    }

    // Converter para base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const mimeType = file.type
    const dataUrl = `data:${mimeType};base64,${base64}`

    // Chamar GPT-4 Vision
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analise esta imagem de produto de moda e forneça uma descrição detalhada em português brasileiro seguindo exatamente este formato JSON:

{
  "tipo_peca": "tipo da peça (ex: camiseta, vestido, calça, etc.)",
  "cores_identificadas": ["cor1", "cor2", "cor3"],
  "material_aparente": "material que parece ser feito",
  "estilo": "estilo da peça (casual, formal, esportivo, etc.)",
  "detalhes_especiais": "detalhes únicos, estampas, bordados, etc.",
  "publico_alvo": "público-alvo (masculino, feminino, unissex, infantil)",
  "descricao_completa": "descrição detalhada para e-commerce"
}

Seja preciso e detalhado na análise.`
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    })

    const content = response.choices[0]?.message?.content
    
    if (!content) {
      return NextResponse.json(
        { error: 'Não foi possível gerar a descrição' },
        { status: 500 }
      )
    }

    // Tentar extrair JSON da resposta
    let description
    try {
      // Procurar por JSON na resposta
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        description = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('JSON não encontrado na resposta')
      }
    } catch (parseError) {
      // Se não conseguir parsear, criar estrutura padrão
      description = {
        tipo_peca: "Produto de moda",
        cores_identificadas: ["Não identificado"],
        material_aparente: "Não identificado",
        estilo: "Não identificado",
        detalhes_especiais: "Não identificado",
        publico_alvo: "Não identificado",
        descricao_completa: content
      }
    }

    return NextResponse.json({
      success: true,
      description
    })

  } catch (error) {
    console.error('Erro ao processar imagem:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

// Configuração para permitir uploads maiores
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}