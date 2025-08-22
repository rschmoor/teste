-- Migração para sistema de newsletter
-- Tabela: newsletter_subscriptions

-- Tabela de inscrições na newsletter
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  source VARCHAR(50) DEFAULT 'website',
  preferences JSONB DEFAULT '{}',
  confirmed_at TIMESTAMP WITH TIME ZONE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_created_at ON newsletter_subscriptions(created_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_newsletter_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_newsletter_updated_at
  BEFORE UPDATE ON newsletter_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_newsletter_updated_at();

-- RLS (Row Level Security)
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção de qualquer usuário (para inscrições públicas)
CREATE POLICY "Allow public newsletter subscription" ON newsletter_subscriptions
  FOR INSERT
  WITH CHECK (true);

-- Política para permitir que usuários vejam apenas suas próprias inscrições
CREATE POLICY "Users can view own newsletter subscription" ON newsletter_subscriptions
  FOR SELECT
  USING (email = auth.jwt() ->> 'email');

-- Política para permitir que usuários atualizem apenas suas próprias inscrições
CREATE POLICY "Users can update own newsletter subscription" ON newsletter_subscriptions
  FOR UPDATE
  USING (email = auth.jwt() ->> 'email');

-- Política para admins (assumindo que existe uma função is_admin)
CREATE POLICY "Admins can manage all newsletter subscriptions" ON newsletter_subscriptions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Comentários para documentação
COMMENT ON TABLE newsletter_subscriptions IS 'Tabela para gerenciar inscrições na newsletter';
COMMENT ON COLUMN newsletter_subscriptions.email IS 'Email do inscrito (único)';
COMMENT ON COLUMN newsletter_subscriptions.status IS 'Status da inscrição: active, unsubscribed, bounced';
COMMENT ON COLUMN newsletter_subscriptions.source IS 'Origem da inscrição (website, popup, etc.)';
COMMENT ON COLUMN newsletter_subscriptions.preferences IS 'Preferências do usuário em formato JSON';
COMMENT ON COLUMN newsletter_subscriptions.confirmed_at IS 'Data de confirmação da inscrição';
COMMENT ON COLUMN newsletter_subscriptions.unsubscribed_at IS 'Data de cancelamento da inscrição';