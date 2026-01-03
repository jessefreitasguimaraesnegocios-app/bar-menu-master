-- ============================================
-- Schema para Roles de Usuários
-- ============================================
-- Implementa sistema de roles seguro para admin
-- ============================================

-- Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'owner', 'user');

-- Tabela de roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função para verificar role (SECURITY DEFINER para evitar recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- Políticas RLS para user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Only admins can insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- ============================================
-- Atualizar políticas do Admin
-- ============================================

-- Atualizar políticas de bars para apenas admins
DROP POLICY IF EXISTS "Authenticated users can insert bars" ON bars;
DROP POLICY IF EXISTS "Authenticated users can update bars" ON bars;
DROP POLICY IF EXISTS "Authenticated users can delete bars" ON bars;

CREATE POLICY "Admins can insert bars"
  ON bars
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update bars"
  ON bars
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete bars"
  ON bars
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Atualizar políticas de platform_settings para apenas admins
DROP POLICY IF EXISTS "Authenticated users can update platform settings" ON platform_settings;

CREATE POLICY "Admins can manage platform settings"
  ON platform_settings
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================
-- Tabela: bar_menu_items (Itens por Bar)
-- ============================================
CREATE TABLE IF NOT EXISTS public.bar_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id UUID NOT NULL REFERENCES bars(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  category category_type NOT NULL,
  image TEXT,
  ingredients TEXT[] DEFAULT '{}',
  is_popular BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_bar_menu_items_bar_id ON bar_menu_items(bar_id);
CREATE INDEX IF NOT EXISTS idx_bar_menu_items_category ON bar_menu_items(category);
CREATE INDEX IF NOT EXISTS idx_bar_menu_items_active ON bar_menu_items(is_active);

-- Trigger para updated_at
CREATE TRIGGER update_bar_menu_items_updated_at
  BEFORE UPDATE ON bar_menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS para bar_menu_items
ALTER TABLE bar_menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bar menu items are viewable by everyone"
  ON bar_menu_items
  FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can insert bar menu items"
  ON bar_menu_items
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update bar menu items"
  ON bar_menu_items
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete bar menu items"
  ON bar_menu_items
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- ============================================
-- NOTA: Para criar o primeiro admin
-- Execute este SQL substituindo pelo user_id real:
-- ============================================
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('UUID-DO-USUARIO-AQUI', 'admin');
