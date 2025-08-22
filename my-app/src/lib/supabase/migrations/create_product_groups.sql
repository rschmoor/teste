-- Migração para sistema de agrupamento de produtos

-- Tabela para definir grupos de produtos
CREATE TABLE IF NOT EXISTS product_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  group_type VARCHAR(50) NOT NULL CHECK (group_type IN ('category', 'brand', 'price_range', 'style', 'collection', 'seasonal', 'custom')),
  criteria JSONB NOT NULL, -- Critérios para agrupamento automático
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de relacionamento entre produtos e grupos
CREATE TABLE IF NOT EXISTS product_group_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES product_groups(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, group_id)
);

-- Tabela para regras de agrupamento automático
CREATE TABLE IF NOT EXISTS grouping_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('category_match', 'price_range', 'brand_match', 'tag_similarity', 'attribute_match')),
  conditions JSONB NOT NULL, -- Condições para aplicar a regra
  target_group_id UUID REFERENCES product_groups(id) ON DELETE CASCADE,
  auto_create_group BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para métricas de similaridade entre produtos
CREATE TABLE IF NOT EXISTS product_similarity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_a_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_b_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  similarity_score DECIMAL(3,2) NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
  similarity_factors JSONB, -- Fatores que contribuem para a similaridade
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_a_id, product_b_id),
  CHECK (product_a_id != product_b_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_product_groups_type ON product_groups(group_type);
CREATE INDEX IF NOT EXISTS idx_product_groups_active ON product_groups(is_active);
CREATE INDEX IF NOT EXISTS idx_product_group_items_product ON product_group_items(product_id);
CREATE INDEX IF NOT EXISTS idx_product_group_items_group ON product_group_items(group_id);
CREATE INDEX IF NOT EXISTS idx_product_group_items_featured ON product_group_items(is_featured);
CREATE INDEX IF NOT EXISTS idx_grouping_rules_active ON grouping_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_grouping_rules_priority ON grouping_rules(priority);
CREATE INDEX IF NOT EXISTS idx_product_similarity_score ON product_similarity(similarity_score);
CREATE INDEX IF NOT EXISTS idx_product_similarity_product_a ON product_similarity(product_a_id);
CREATE INDEX IF NOT EXISTS idx_product_similarity_product_b ON product_similarity(product_b_id);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_groups_updated_at BEFORE UPDATE ON product_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grouping_rules_updated_at BEFORE UPDATE ON grouping_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular similaridade entre produtos
CREATE OR REPLACE FUNCTION calculate_product_similarity(product_a_id UUID, product_b_id UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    product_a products%ROWTYPE;
    product_b products%ROWTYPE;
    similarity_score DECIMAL(3,2) := 0;
    category_weight DECIMAL(3,2) := 0.4;
    price_weight DECIMAL(3,2) := 0.3;
    brand_weight DECIMAL(3,2) := 0.2;
    tag_weight DECIMAL(3,2) := 0.1;
BEGIN
    -- Buscar produtos
    SELECT * INTO product_a FROM products WHERE id = product_a_id;
    SELECT * INTO product_b FROM products WHERE id = product_b_id;
    
    IF product_a.id IS NULL OR product_b.id IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Similaridade por categoria
    IF product_a.category_id = product_b.category_id THEN
        similarity_score := similarity_score + category_weight;
    END IF;
    
    -- Similaridade por faixa de preço (±20%)
    IF ABS(product_a.price - product_b.price) <= (GREATEST(product_a.price, product_b.price) * 0.2) THEN
        similarity_score := similarity_score + price_weight;
    END IF;
    
    -- Similaridade por marca (se houver campo brand)
    -- IF product_a.brand = product_b.brand THEN
    --     similarity_score := similarity_score + brand_weight;
    -- END IF;
    
    RETURN LEAST(similarity_score, 1.0);
END;
$$ LANGUAGE plpgsql;

-- Função para aplicar regras de agrupamento automático
CREATE OR REPLACE FUNCTION apply_grouping_rules()
RETURNS VOID AS $$
DECLARE
    rule_record grouping_rules%ROWTYPE;
    product_record products%ROWTYPE;
BEGIN
    -- Iterar sobre regras ativas ordenadas por prioridade
    FOR rule_record IN 
        SELECT * FROM grouping_rules 
        WHERE is_active = true 
        ORDER BY priority DESC
    LOOP
        -- Aplicar regra baseada no tipo
        CASE rule_record.rule_type
            WHEN 'category_match' THEN
                -- Agrupar produtos da mesma categoria
                INSERT INTO product_group_items (product_id, group_id)
                SELECT p.id, rule_record.target_group_id
                FROM products p
                WHERE p.category_id = (rule_record.conditions->>'category_id')::UUID
                AND NOT EXISTS (
                    SELECT 1 FROM product_group_items pgi 
                    WHERE pgi.product_id = p.id AND pgi.group_id = rule_record.target_group_id
                )
                ON CONFLICT (product_id, group_id) DO NOTHING;
                
            WHEN 'price_range' THEN
                -- Agrupar produtos por faixa de preço
                INSERT INTO product_group_items (product_id, group_id)
                SELECT p.id, rule_record.target_group_id
                FROM products p
                WHERE p.price >= (rule_record.conditions->>'min_price')::DECIMAL
                AND p.price <= (rule_record.conditions->>'max_price')::DECIMAL
                AND NOT EXISTS (
                    SELECT 1 FROM product_group_items pgi 
                    WHERE pgi.product_id = p.id AND pgi.group_id = rule_record.target_group_id
                )
                ON CONFLICT (product_id, group_id) DO NOTHING;
        END CASE;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security)
ALTER TABLE product_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_group_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE grouping_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_similarity ENABLE ROW LEVEL SECURITY;

-- Políticas para product_groups
CREATE POLICY "Todos podem visualizar grupos ativos" ON product_groups
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins podem gerenciar grupos" ON product_groups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Políticas para product_group_items
CREATE POLICY "Todos podem visualizar itens de grupos" ON product_group_items
    FOR SELECT USING (true);

CREATE POLICY "Admins podem gerenciar itens de grupos" ON product_group_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Políticas para grouping_rules
CREATE POLICY "Admins podem gerenciar regras" ON grouping_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Políticas para product_similarity
CREATE POLICY "Todos podem visualizar similaridades" ON product_similarity
    FOR SELECT USING (true);

CREATE POLICY "Sistema pode gerenciar similaridades" ON product_similarity
    FOR ALL USING (true);

-- Inserir alguns grupos padrão
INSERT INTO product_groups (name, description, group_type, criteria) VALUES
('Produtos em Destaque', 'Produtos selecionados para destaque na loja', 'custom', '{"manual": true}'),
('Novidades', 'Produtos recém-chegados', 'custom', '{"days_since_created": 30}'),
('Mais Vendidos', 'Produtos com maior volume de vendas', 'custom', '{"min_sales": 10}'),
('Promoções', 'Produtos em promoção', 'custom', '{"has_promotion": true}');

-- Inserir algumas regras padrão
INSERT INTO grouping_rules (name, description, rule_type, conditions, auto_create_group, priority) VALUES
('Agrupar por Categoria', 'Agrupa automaticamente produtos da mesma categoria', 'category_match', '{"auto_group": true}', true, 1),
('Faixa de Preço Baixo', 'Produtos até R$ 100', 'price_range', '{"min_price": 0, "max_price": 100}', true, 2),
('Faixa de Preço Médio', 'Produtos de R$ 100 a R$ 500', 'price_range', '{"min_price": 100, "max_price": 500}', true, 2),
('Faixa de Preço Alto', 'Produtos acima de R$ 500', 'price_range', '{"min_price": 500, "max_price": 999999}', true, 2);

COMMIT;