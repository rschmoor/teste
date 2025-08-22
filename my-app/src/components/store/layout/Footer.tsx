'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TouchButton, TouchInput, TouchOptimized } from '@/components/ui/TouchTargets'
import { Facebook, Instagram, Twitter, Youtube, Phone, Mail, MessageCircle } from 'lucide-react'

export function Footer() {
  const [email, setEmail] = useState('')

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implementar lógica de newsletter
    console.log('Newsletter signup:', email)
    setEmail('')
  }

  return (
    <footer className="bg-gray-900 text-white">
      {/* Newsletter Section */}
      <div className="bg-gray-800 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold mb-2">Ganhe 10% OFF na primeira compra!</h3>
              <p className="text-gray-300">Cadastre-se e receba ofertas exclusivas</p>
            </div>
            <TouchOptimized>
              <form onSubmit={handleNewsletterSubmit} className="flex w-full md:w-auto">
                <TouchInput
                  type="email"
                  placeholder="Seu melhor e-mail"
                  value={email}
                  onChange={(value: string) => setEmail(value)}
                  className="bg-white text-black border-0 rounded-r-none w-full md:w-80"
                />
                <TouchButton
                  type="submit"
                  className="bg-rose-500 hover:bg-rose-600 rounded-l-none px-6"
                >
                  Cadastrar
                </TouchButton>
              </form>
            </TouchOptimized>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Institucional */}
          <div>
            <h4 className="font-bold text-lg mb-4">Institucional</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/sobre" className="text-gray-300 hover:text-white transition-colors">
                  Sobre a Boutique Style
                </Link>
              </li>
              <li>
                <Link href="/trabalhe-conosco" className="text-gray-300 hover:text-white transition-colors">
                  Trabalhe Conosco
                </Link>
              </li>
              <li>
                <Link href="/termos" className="text-gray-300 hover:text-white transition-colors">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="text-gray-300 hover:text-white transition-colors">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="/sustentabilidade" className="text-gray-300 hover:text-white transition-colors">
                  Sustentabilidade
                </Link>
              </li>
            </ul>
          </div>

          {/* Ajuda */}
          <div>
            <h4 className="font-bold text-lg mb-4">Ajuda</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/trocas-devolucoes" className="text-gray-300 hover:text-white transition-colors">
                  Trocas e Devoluções
                </Link>
              </li>
              <li>
                <Link href="/entregas" className="text-gray-300 hover:text-white transition-colors">
                  Entregas e Prazos
                </Link>
              </li>
              <li>
                <Link href="/pagamento" className="text-gray-300 hover:text-white transition-colors">
                  Formas de Pagamento
                </Link>
              </li>
              <li>
                <Link href="/guia-tamanhos" className="text-gray-300 hover:text-white transition-colors">
                  Guia de Tamanhos
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-300 hover:text-white transition-colors">
                  Perguntas Frequentes
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="font-bold text-lg mb-4">Contato</h4>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4 text-green-500" />
                <span className="text-gray-300">WhatsApp: (11) 99999-9999</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-blue-500" />
                <span className="text-gray-300">contato@boutiquestyle.com.br</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300">SAC: 0800 123 4567</span>
              </li>
              <li className="text-gray-300 text-sm">
                <p>Seg a Sex: 8h às 18h</p>
                <p>Sáb: 8h às 14h</p>
              </li>
            </ul>
          </div>

          {/* Redes Sociais */}
          <div>
            <h4 className="font-bold text-lg mb-4">Siga-nos</h4>
            <div className="flex space-x-4 mb-6">
              <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                <Facebook className="h-6 w-6" />
              </Link>
              <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                <Instagram className="h-6 w-6" />
              </Link>
              <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                <Twitter className="h-6 w-6" />
              </Link>
              <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                <Youtube className="h-6 w-6" />
              </Link>
            </div>

            {/* Formas de Pagamento */}
            <div>
              <h5 className="font-semibold mb-3">Formas de Pagamento</h5>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white rounded p-1 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">VISA</span>
                </div>
                <div className="bg-white rounded p-1 flex items-center justify-center">
                  <span className="text-xs font-bold text-red-600">MASTER</span>
                </div>
                <div className="bg-white rounded p-1 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-800">AMEX</span>
                </div>
                <div className="bg-white rounded p-1 flex items-center justify-center">
                  <span className="text-xs font-bold text-yellow-600">ELO</span>
                </div>
                <div className="bg-white rounded p-1 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">PIX</span>
                </div>
                <div className="bg-white rounded p-1 flex items-center justify-center">
                  <span className="text-xs font-bold text-orange-600">BOLETO</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-400 text-sm">
                © 2024 Boutique Style. Todos os direitos reservados.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-400 text-sm">CNPJ: 12.345.678/0001-90</span>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-5 bg-green-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">SSL</span>
                </div>
                <span className="text-gray-400 text-xs">Site Seguro</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}