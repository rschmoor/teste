-- Criação das tabelas para sistema de relatórios

-- Tabela para relatórios salvos
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('sales', 'products', 'customers', 'inventory', 'financial', 'custom')),
  config JSONB NOT NULL DEFAULT '{}',
  filters JSONB DEFAULT '{}',
  chart_config JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  is_scheduled BOOLEAN DEFAULT false,
  schedule_config JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para cache de dados de relatórios
CREATE TABLE IF NOT EXISTS report_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  cache_key VARCHAR(255) NOT NULL,
  data JSONB NOT NULL,
  filters_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para execuções de relatórios agendados
CREATE TABLE IF NOT EXISTS report_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  result JSONB,
  error_message TEXT,
  execution_time_ms INTEGER,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela para configurações globais de relatórios
CREATE TABLE IF NOT EXISTS report_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_created_by ON reports(created_by);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_is_public ON reports(is_public);
CREATE INDEX IF NOT EXISTS idx_reports_is_scheduled ON reports(is_scheduled);

CREATE INDEX IF NOT EXISTS idx_report_cache_report_id ON report_cache(report_id);
CREATE INDEX IF NOT EXISTS idx_report_cache_key ON report_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_report_cache_expires_at ON report_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_report_cache_filters_hash ON report_cache(filters_hash);

CREATE INDEX IF NOT EXISTS idx_report_executions_report_id ON report_executions(report_id);
CREATE INDEX IF NOT EXISTS idx_report_executions_status ON report_executions(status);
CREATE INDEX IF NOT EXISTS idx_report_executions_started_at ON report_executions(started_at);

CREATE INDEX IF NOT EXISTS idx_report_settings_key ON report_settings(key);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_settings_updated_at BEFORE UPDATE ON report_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para limpar cache expirado
CREATE OR REPLACE FUNCTION clean_expired_report_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM report_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar hash de filtros
CREATE OR REPLACE FUNCTION generate_filters_hash(filters JSONB)
RETURNS VARCHAR(64) AS $$
BEGIN
  RETURN encode(digest(filters::text, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Função para obter dados de vendas
CREATE OR REPLACE FUNCTION get_sales_report_data(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  group_by VARCHAR(20) DEFAULT 'day'
)
RETURNS TABLE (
  period TEXT,
  total_orders BIGINT,
  total_revenue DECIMAL,
  avg_order_value DECIMAL,
  total_items BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN group_by = 'day' THEN TO_CHAR(o.created_at, 'YYYY-MM-DD')
      WHEN group_by = 'week' THEN TO_CHAR(DATE_TRUNC('week', o.created_at), 'YYYY-MM-DD')
      WHEN group_by = 'month' THEN TO_CHAR(DATE_TRUNC('month', o.created_at), 'YYYY-MM')
      WHEN group_by = 'year' THEN TO_CHAR(DATE_TRUNC('year', o.created_at), 'YYYY')
      ELSE TO_CHAR(o.created_at, 'YYYY-MM-DD')
    END as period,
    COUNT(o.id)::BIGINT as total_orders,
    COALESCE(SUM(o.total), 0)::DECIMAL as total_revenue,
    COALESCE(AVG(o.total), 0)::DECIMAL as avg_order_value,
    COALESCE(SUM(oi.quantity), 0)::BIGINT as total_items
  FROM orders o
  LEFT JOIN order_items oi ON o.id = oi.order_id
  WHERE 
    (start_date IS NULL OR o.created_at::date >= start_date)
    AND (end_date IS NULL OR o.created_at::date <= end_date)
    AND o.status != 'cancelled'
  GROUP BY 
    CASE 
      WHEN group_by = 'day' THEN DATE_TRUNC('day', o.created_at)
      WHEN group_by = 'week' THEN DATE_TRUNC('week', o.created_at)
      WHEN group_by = 'month' THEN DATE_TRUNC('month', o.created_at)
      WHEN group_by = 'year' THEN DATE_TRUNC('year', o.created_at)
      ELSE DATE_TRUNC('day', o.created_at)
    END
  ORDER BY 
    CASE 
      WHEN group_by = 'day' THEN DATE_TRUNC('day', o.created_at)
      WHEN group_by = 'week' THEN DATE_TRUNC('week', o.created_at)
      WHEN group_by = 'month' THEN DATE_TRUNC('month', o.created_at)
      WHEN group_by = 'year' THEN DATE_TRUNC('year', o.created_at)
      ELSE DATE_TRUNC('day', o.created_at)
    END;
END;
$$ LANGUAGE plpgsql;

-- Função para obter dados de produtos mais vendidos
CREATE OR REPLACE FUNCTION get_top_products_report(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  product_id UUID,
  product_name VARCHAR,
  total_quantity BIGINT,
  total_revenue DECIMAL,
  order_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as product_id,
    p.name as product_name,
    SUM(oi.quantity)::BIGINT as total_quantity,
    SUM(oi.price * oi.quantity)::DECIMAL as total_revenue,
    COUNT(DISTINCT oi.order_id)::BIGINT as order_count
  FROM products p
  INNER JOIN order_items oi ON p.id = oi.product_id
  INNER JOIN orders o ON oi.order_id = o.id
  WHERE 
    (start_date IS NULL OR o.created_at::date >= start_date)
    AND (end_date IS NULL OR o.created_at::date <= end_date)
    AND o.status != 'cancelled'
  GROUP BY p.id, p.name
  ORDER BY total_quantity DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Função para obter dados de clientes
CREATE OR REPLACE FUNCTION get_customers_report_data(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_customers BIGINT,
  new_customers BIGINT,
  active_customers BIGINT,
  avg_orders_per_customer DECIMAL,
  avg_revenue_per_customer DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT u.id)::BIGINT as total_customers,
    COUNT(DISTINCT CASE WHEN u.created_at::date >= COALESCE(start_date, CURRENT_DATE - INTERVAL '30 days') THEN u.id END)::BIGINT as new_customers,
    COUNT(DISTINCT CASE WHEN o.created_at::date >= COALESCE(start_date, CURRENT_DATE - INTERVAL '30 days') THEN u.id END)::BIGINT as active_customers,
    COALESCE(AVG(customer_stats.order_count), 0)::DECIMAL as avg_orders_per_customer,
    COALESCE(AVG(customer_stats.total_spent), 0)::DECIMAL as avg_revenue_per_customer
  FROM auth.users u
  LEFT JOIN (
    SELECT 
      o.user_id,
      COUNT(o.id) as order_count,
      SUM(o.total) as total_spent
    FROM orders o
    WHERE 
      (start_date IS NULL OR o.created_at::date >= start_date)
      AND (end_date IS NULL OR o.created_at::date <= end_date)
      AND o.status != 'cancelled'
    GROUP BY o.user_id
  ) customer_stats ON u.id = customer_stats.user_id
  LEFT JOIN orders o ON u.id = o.user_id
  WHERE u.email IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para reports
CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT USING (created_by = auth.uid() OR is_public = true);

CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own reports" ON reports
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own reports" ON reports
  FOR DELETE USING (created_by = auth.uid());

-- Políticas RLS para report_cache
CREATE POLICY "Users can view cache for accessible reports" ON report_cache
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reports r 
      WHERE r.id = report_cache.report_id 
      AND (r.created_by = auth.uid() OR r.is_public = true)
    )
  );

CREATE POLICY "Users can manage cache for their reports" ON report_cache
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM reports r 
      WHERE r.id = report_cache.report_id 
      AND r.created_by = auth.uid()
    )
  );

-- Políticas RLS para report_executions
CREATE POLICY "Users can view executions for accessible reports" ON report_executions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reports r 
      WHERE r.id = report_executions.report_id 
      AND (r.created_by = auth.uid() OR r.is_public = true)
    )
  );

CREATE POLICY "Users can manage executions for their reports" ON report_executions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM reports r 
      WHERE r.id = report_executions.report_id 
      AND r.created_by = auth.uid()
    )
  );

-- Políticas RLS para report_settings (apenas admins)
CREATE POLICY "Only admins can manage report settings" ON report_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Inserir configurações padrão
INSERT INTO report_settings (key, value, description) VALUES
  ('cache_ttl_minutes', '60', 'Tempo de vida do cache em minutos'),
  ('max_cache_size_mb', '100', 'Tamanho máximo do cache em MB'),
  ('default_date_range_days', '30', 'Período padrão para relatórios em dias'),
  ('max_export_rows', '10000', 'Número máximo de linhas para exportação'),
  ('enable_scheduled_reports', 'true', 'Habilitar relatórios agendados')
ON CONFLICT (key) DO NOTHING;

-- Inserir relatórios padrão
INSERT INTO reports (name, description, type, config, is_public) VALUES
  ('Vendas Diárias', 'Relatório de vendas agrupadas por dia', 'sales', 
   '{"group_by": "day", "metrics": ["total_orders", "total_revenue", "avg_order_value"]}', true),
  ('Produtos Mais Vendidos', 'Top 10 produtos mais vendidos', 'products', 
   '{"limit": 10, "sort_by": "quantity", "metrics": ["total_quantity", "total_revenue"]}', true),
  ('Resumo de Clientes', 'Estatísticas gerais de clientes', 'customers', 
   '{"metrics": ["total_customers", "new_customers", "active_customers"]}', true)
ON CONFLICT DO NOTHING;