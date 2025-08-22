-- Função para criar perfil de usuário de forma segura
-- Esta função roda com privilégios elevados, evitando problemas de RLS

CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_full_name TEXT DEFAULT NULL,
  user_role TEXT DEFAULT 'customer'
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  -- Verificar se o perfil já existe
  IF EXISTS (SELECT 1 FROM user_profiles WHERE id = user_id) THEN
    RAISE EXCEPTION 'Profile already exists for user %', user_id;
  END IF;
  
  -- Validar role
  IF user_role NOT IN ('customer', 'admin') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be customer or admin', user_role;
  END IF;
  
  -- Inserir o perfil
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    user_email,
    user_full_name,
    user_role,
    NOW(),
    NOW()
  );
  
  -- Retornar sucesso
  SELECT json_build_object(
    'success', true,
    'user_id', user_id,
    'message', 'Profile created successfully'
  ) INTO result;
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Retornar erro
    SELECT json_build_object(
      'success', false,
      'error', SQLERRM,
      'user_id', user_id
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Dar permissões para usuários autenticados chamarem a função
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT, TEXT) TO anon;

-- Comentário da função
COMMENT ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT, TEXT) IS 
'Cria um perfil de usuário de forma segura, evitando problemas de RLS durante a criação inicial';