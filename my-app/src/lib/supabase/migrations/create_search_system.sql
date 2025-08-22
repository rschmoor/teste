-- Criação do sistema de busca inteligente

-- Tabela para armazenar termos de busca e suas estatísticas
CREATE TABLE search_terms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  term TEXT NOT NULL,
  normalized_term TEXT NOT NULL, -- termo normalizado para busca
  search_count INTEGER DEFAULT 1,
  result_count INTEGER DEFAULT 0,
  last_searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para sugestões de busca
CREATE TABLE search_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  suggestion TEXT NOT NULL,
  normalized_suggestion TEXT NOT NULL,
  category VARCHAR(50), -- 'product', 'brand', 'category', 'tag'
  priority INTEGER DEFAULT 0, -- maior prioridade = mais relevante
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para histórico de buscas dos usuários
CREATE TABLE user_search_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  search_term TEXT NOT NULL,
  normalized_term TEXT NOT NULL,
  result_count INTEGER DEFAULT 0,
  clicked_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  session_id TEXT, -- para usuários não logados
  ip_address INET,
  user_agent TEXT,
  searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para cache de resultados de busca
CREATE TABLE search_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  search_hash TEXT NOT NULL UNIQUE, -- hash dos parâmetros de busca
  search_term TEXT NOT NULL,
  filters JSONB DEFAULT '{}',
  results JSONB NOT NULL,
  result_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para configurações de busca
CREATE TABLE search_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para otimização
CREATE INDEX idx_search_terms_normalized ON search_terms(normalized_term);
CREATE INDEX idx_search_terms_count ON search_terms(search_count DESC);
CREATE INDEX idx_search_terms_last_searched ON search_terms(last_searched_at DESC);

CREATE INDEX idx_search_suggestions_normalized ON search_suggestions(normalized_suggestion);
CREATE INDEX idx_search_suggestions_category ON search_suggestions(category);
CREATE INDEX idx_search_suggestions_priority ON search_suggestions(priority DESC);
CREATE INDEX idx_search_suggestions_active ON search_suggestions(is_active);

CREATE INDEX idx_user_search_history_user ON user_search_history(user_id);
CREATE INDEX idx_user_search_history_session ON user_search_history(session_id);
CREATE INDEX idx_user_search_history_term ON user_search_history(normalized_term);
CREATE INDEX idx_user_search_history_date ON user_search_history(searched_at DESC);

CREATE INDEX idx_search_cache_hash ON search_cache(search_hash);
CREATE INDEX idx_search_cache_expires ON search_cache(expires_at);

CREATE INDEX idx_search_settings_key ON search_settings(key);

-- Índices de texto completo para produtos
CREATE INDEX idx_products_search_name ON products USING gin(to_tsvector('portuguese', name));
CREATE INDEX idx_products_search_description ON products USING gin(to_tsvector('portuguese', description));
CREATE INDEX idx_products_search_tags ON products USING gin(tags);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_search_terms_updated_at BEFORE UPDATE ON search_terms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_search_suggestions_updated_at BEFORE UPDATE ON search_suggestions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_search_settings_updated_at BEFORE UPDATE ON search_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para normalizar termos de busca
CREATE OR REPLACE FUNCTION normalize_search_term(term TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(trim(regexp_replace(unaccent(term), '[^a-zA-Z0-9\s]', '', 'g')));
END;
$$ LANGUAGE plpgsql;

-- Função para busca inteligente de produtos
CREATE OR REPLACE FUNCTION search_products(
  search_term TEXT DEFAULT '',
  category_filter TEXT DEFAULT NULL,
  brand_filter TEXT DEFAULT NULL,
  min_price DECIMAL DEFAULT NULL,
  max_price DECIMAL DEFAULT NULL,
  in_stock_only BOOLEAN DEFAULT false,
  sort_by TEXT DEFAULT 'relevance', -- 'relevance', 'price_asc', 'price_desc', 'name', 'created_at'
  page_limit INTEGER DEFAULT 20,
  page_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  price DECIMAL,
  sale_price DECIMAL,
  image_url TEXT,
  category TEXT,
  brand TEXT,
  stock_quantity INTEGER,
  tags TEXT[],
  relevance_score REAL
) AS $$
DECLARE
  normalized_term TEXT;
  search_query TEXT;
BEGIN
  normalized_term := normalize_search_term(search_term);
  
  -- Construir query de busca
  IF search_term = '' THEN
    search_query := '';
  ELSE
    search_query := plainto_tsquery('portuguese', search_term)::text;
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.sale_price,
    p.image_url,
    p.category,
    p.brand,
    p.stock_quantity,
    p.tags,
    CASE 
      WHEN search_term = '' THEN 1.0
      ELSE (
        -- Pontuação baseada em relevância
        COALESCE(ts_rank(to_tsvector('portuguese', p.name), plainto_tsquery('portuguese', search_term)), 0) * 2.0 +
        COALESCE(ts_rank(to_tsvector('portuguese', p.description), plainto_tsquery('portuguese', search_term)), 0) * 1.0 +
        CASE WHEN p.name ILIKE '%' || search_term || '%' THEN 1.5 ELSE 0 END +
        CASE WHEN search_term = ANY(p.tags) THEN 2.0 ELSE 0 END +
        CASE WHEN p.brand ILIKE '%' || search_term || '%' THEN 1.0 ELSE 0 END +
        CASE WHEN p.category ILIKE '%' || search_term || '%' THEN 1.0 ELSE 0 END
      )
    END::REAL AS relevance_score
  FROM products p
  WHERE 
    p.is_active = true
    AND (search_term = '' OR (
      to_tsvector('portuguese', p.name) @@ plainto_tsquery('portuguese', search_term) OR
      to_tsvector('portuguese', p.description) @@ plainto_tsquery('portuguese', search_term) OR
      p.name ILIKE '%' || search_term || '%' OR
      p.description ILIKE '%' || search_term || '%' OR
      search_term = ANY(p.tags) OR
      p.brand ILIKE '%' || search_term || '%' OR
      p.category ILIKE '%' || search_term || '%'
    ))
    AND (category_filter IS NULL OR p.category = category_filter)
    AND (brand_filter IS NULL OR p.brand = brand_filter)
    AND (min_price IS NULL OR p.price >= min_price)
    AND (max_price IS NULL OR p.price <= max_price)
    AND (NOT in_stock_only OR p.stock_quantity > 0)
  ORDER BY
    CASE 
      WHEN sort_by = 'relevance' THEN relevance_score
      WHEN sort_by = 'price_desc' THEN p.price
      ELSE 0
    END DESC,
    CASE 
      WHEN sort_by = 'price_asc' THEN p.price
      ELSE 0
    END ASC,
    CASE 
      WHEN sort_by = 'name' THEN p.name
      ELSE ''
    END ASC,
    CASE 
      WHEN sort_by = 'created_at' THEN p.created_at
      ELSE '1970-01-01'::timestamp
    END DESC,
    p.created_at DESC
  LIMIT page_limit
  OFFSET page_offset;
END;
$$ LANGUAGE plpgsql;

-- Função para obter sugestões de busca
CREATE OR REPLACE FUNCTION get_search_suggestions(
  partial_term TEXT,
  suggestion_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  suggestion TEXT,
  category TEXT,
  priority INTEGER
) AS $$
DECLARE
  normalized_partial TEXT;
BEGIN
  normalized_partial := normalize_search_term(partial_term);
  
  RETURN QUERY
  (
    -- Sugestões da tabela search_suggestions
    SELECT 
      s.suggestion,
      s.category,
      s.priority
    FROM search_suggestions s
    WHERE 
      s.is_active = true
      AND s.normalized_suggestion LIKE normalized_partial || '%'
    ORDER BY s.priority DESC, s.suggestion ASC
    LIMIT suggestion_limit / 2
  )
  UNION ALL
  (
    -- Sugestões baseadas em produtos
    SELECT DISTINCT
      p.name as suggestion,
      'product'::TEXT as category,
      0 as priority
    FROM products p
    WHERE 
      p.is_active = true
      AND normalize_search_term(p.name) LIKE normalized_partial || '%'
    ORDER BY p.name ASC
    LIMIT suggestion_limit / 4
  )
  UNION ALL
  (
    -- Sugestões baseadas em categorias
    SELECT DISTINCT
      p.category as suggestion,
      'category'::TEXT as category,
      1 as priority
    FROM products p
    WHERE 
      p.is_active = true
      AND normalize_search_term(p.category) LIKE normalized_partial || '%'
    ORDER BY p.category ASC
    LIMIT suggestion_limit / 4
  )
  ORDER BY priority DESC, suggestion ASC
  LIMIT suggestion_limit;
END;
$$ LANGUAGE plpgsql;

-- Função para registrar busca
CREATE OR REPLACE FUNCTION register_search(
  search_term TEXT,
  user_id_param UUID DEFAULT NULL,
  session_id_param TEXT DEFAULT NULL,
  result_count_param INTEGER DEFAULT 0,
  ip_address_param INET DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  normalized_term TEXT;
BEGIN
  normalized_term := normalize_search_term(search_term);
  
  -- Inserir no histórico de busca do usuário
  INSERT INTO user_search_history (
    user_id, search_term, normalized_term, result_count, 
    session_id, ip_address, user_agent
  ) VALUES (
    user_id_param, search_term, normalized_term, result_count_param,
    session_id_param, ip_address_param, user_agent_param
  );
  
  -- Atualizar ou inserir termo de busca
  INSERT INTO search_terms (term, normalized_term, search_count, result_count)
  VALUES (search_term, normalized_term, 1, result_count_param)
  ON CONFLICT (normalized_term) DO UPDATE SET
    search_count = search_terms.search_count + 1,
    result_count = EXCLUDED.result_count,
    last_searched_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Função para limpar cache expirado
CREATE OR REPLACE FUNCTION cleanup_expired_search_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM search_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Políticas RLS
ALTER TABLE search_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para search_terms (público para leitura)
CREATE POLICY "search_terms_select_policy" ON search_terms
  FOR SELECT USING (true);

CREATE POLICY "search_terms_insert_policy" ON search_terms
  FOR INSERT WITH CHECK (true);

CREATE POLICY "search_terms_update_policy" ON search_terms
  FOR UPDATE USING (true);

-- Políticas para search_suggestions (público para leitura)
CREATE POLICY "search_suggestions_select_policy" ON search_suggestions
  FOR SELECT USING (true);

CREATE POLICY "search_suggestions_admin_policy" ON search_suggestions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Políticas para user_search_history
CREATE POLICY "user_search_history_select_policy" ON user_search_history
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "user_search_history_insert_policy" ON user_search_history
  FOR INSERT WITH CHECK (true);

-- Políticas para search_cache (público para leitura)
CREATE POLICY "search_cache_select_policy" ON search_cache
  FOR SELECT USING (true);

CREATE POLICY "search_cache_insert_policy" ON search_cache
  FOR INSERT WITH CHECK (true);

CREATE POLICY "search_cache_update_policy" ON search_cache
  FOR UPDATE USING (true);

CREATE POLICY "search_cache_delete_policy" ON search_cache
  FOR DELETE USING (true);

-- Políticas para search_settings (apenas admin)
CREATE POLICY "search_settings_admin_policy" ON search_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Inserir configurações padrão
INSERT INTO search_settings (key, value, description) VALUES
('cache_duration_minutes', '30', 'Duração do cache de busca em minutos'),
('max_suggestions', '10', 'Número máximo de sugestões a exibir'),
('min_search_length', '2', 'Comprimento mínimo para iniciar busca'),
('enable_typo_tolerance', 'true', 'Habilitar tolerância a erros de digitação'),
('enable_search_analytics', 'true', 'Habilitar análise de buscas'),
('popular_searches_limit', '20', 'Limite de buscas populares a exibir')
ON CONFLICT (key) DO NOTHING;

-- Inserir algumas sugestões padrão
INSERT INTO search_suggestions (suggestion, normalized_suggestion, category, priority) VALUES
('vestidos', 'vestidos', 'category', 10),
('blusas', 'blusas', 'category', 9),
('calças', 'calcas', 'category', 8),
('saias', 'saias', 'category', 7),
('acessórios', 'acessorios', 'category', 6),
('sapatos', 'sapatos', 'category', 5),
('bolsas', 'bolsas', 'category', 4),
('jóias', 'joias', 'category', 3),
('maquiagem', 'maquiagem', 'category', 2),
('perfumes', 'perfumes', 'category', 1)
ON CONFLICT DO NOTHING;

-- Criar job para limpeza automática do cache (se suportado)
-- SELECT cron.schedule('cleanup-search-cache', '0 */6 * * *', 'SELECT cleanup_expired_search_cache();');

COMMIT;