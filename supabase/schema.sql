-- ============================================
-- Schema do Banco de Dados - Cardápio Cantim
-- ============================================
-- Este arquivo cria todas as tabelas, políticas de segurança
-- e configurações necessárias para o sistema de cardápio
-- ============================================

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM: Categorias do Cardápio
-- ============================================
CREATE TYPE category_type AS ENUM (
  'cocktails',
  'beers',
  'wines',
  'spirits',
  'appetizers',
  'mains'
);

-- ============================================
-- TABELA: menu_items
-- ============================================
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  category category_type NOT NULL,
  image TEXT NOT NULL,
  ingredients TEXT[] DEFAULT '{}',
  preparation TEXT,
  abv DECIMAL(5, 2) CHECK (abv >= 0 AND abv <= 100),
  is_popular BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- ÍNDICES para Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_active ON menu_items(is_active);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_popular ON menu_items(is_popular);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_new ON menu_items(is_new);
CREATE INDEX IF NOT EXISTS idx_menu_items_created_at ON menu_items(created_at DESC);

-- ============================================
-- FUNÇÃO: Atualizar updated_at automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS na tabela
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer pessoa pode ler itens ativos
CREATE POLICY "Menu items are viewable by everyone"
  ON menu_items
  FOR SELECT
  USING (is_active = TRUE);

-- Política: Apenas usuários autenticados podem inserir
CREATE POLICY "Authenticated users can insert menu items"
  ON menu_items
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Política: Apenas usuários autenticados podem atualizar
CREATE POLICY "Authenticated users can update menu items"
  ON menu_items
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Política: Apenas usuários autenticados podem deletar (soft delete)
CREATE POLICY "Authenticated users can delete menu items"
  ON menu_items
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- FUNÇÃO: Soft Delete (marcar como inativo)
-- ============================================
CREATE OR REPLACE FUNCTION soft_delete_menu_item(item_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE menu_items
  SET is_active = FALSE, updated_at = NOW()
  WHERE id = item_id AND is_active = TRUE;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VIEW: Menu items ativos (para facilitar consultas)
-- ============================================
CREATE OR REPLACE VIEW active_menu_items AS
SELECT 
  id,
  name,
  description,
  price,
  category,
  image,
  ingredients,
  preparation,
  abv,
  is_popular,
  is_new,
  created_at,
  updated_at
FROM menu_items
WHERE is_active = TRUE
ORDER BY 
  category,
  is_popular DESC,
  is_new DESC,
  name;

-- ============================================
-- DADOS INICIAIS (Opcional - descomente para inserir)
-- ============================================

/*
-- Coquetéis
INSERT INTO menu_items (name, description, price, category, image, ingredients, preparation, abv, is_popular) VALUES
('Old Fashioned', 'Um clássico atemporal com bourbon, bitters e um toque de doçura. Decorado com casca de laranja.', 32.00, 'cocktails', 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400', ARRAY['Bourbon', 'Angostura Bitters', 'Cubo de Açúcar', 'Casca de Laranja'], 'Macere o açúcar com bitters, adicione bourbon e gelo, mexa até gelar. Decore com casca de laranja.', 32.00, TRUE),
('Espresso Martini', 'Vodka batida com espresso fresco e licor de café. O coquetel perfeito para te animar.', 36.00, 'cocktails', 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400', ARRAY['Vodka', 'Kahlua', 'Espresso Fresco', 'Xarope Simples'], 'Bata todos os ingredientes vigorosamente com gelo. Coe duplamente em uma taça gelada.', 24.00, FALSE),
('Negroni', 'Partes iguais de gin, Campari e vermute doce. Amargo, ousado e lindamente equilibrado.', 30.00, 'cocktails', 'https://images.unsplash.com/photo-1551751299-1b51cab2694c?w=400', ARRAY['Gin', 'Campari', 'Vermute Doce'], 'Mexa todos os ingredientes com gelo, coe em copo rocks com gelo fresco. Decore com casca de laranja.', 28.00, FALSE),
('Whiskey Sour', 'Bourbon com suco de limão fresco e espuma sedosa de clara de ovo. Perfeitamente equilibrado entre doce e azedo.', 30.00, 'cocktails', 'https://images.unsplash.com/photo-1560512823-829485b8bf24?w=400', ARRAY['Bourbon', 'Suco de Limão Fresco', 'Xarope Simples', 'Clara de Ovo'], 'Bata todos os ingredientes sem gelo, depois com gelo. Coe em taça, decore com bitters.', 22.00, TRUE),
('Mojito', 'Hortelã fresca, limão, rum e água com gás. Um clássico cubano refrescante para noites quentes.', 28.00, 'cocktails', 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400', ARRAY['Rum Branco', 'Hortelã Fresca', 'Suco de Limão', 'Açúcar', 'Água com Gás'], 'Macere hortelã e açúcar, adicione rum e limão, complete com água com gás. Sirva com gelo pilado.', 18.00, FALSE);

-- Cervejas
INSERT INTO menu_items (name, description, price, category, image, abv, is_popular) VALUES
('IPA Artesanal', 'India Pale Ale produzida localmente com notas cítricas e de pinho. Lupulada e refrescante.', 18.00, 'beers', 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?w=400', 6.50, TRUE),
('Witbier Belga', 'Cerveja de trigo leve e turva com sutil coentro e casca de laranja.', 16.00, 'beers', 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400', 5.20, FALSE),
('Stout', 'Rica e cremosa com notas de café, chocolate e malte torrado.', 20.00, 'beers', 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400', 6.80, FALSE);

-- Vinhos
INSERT INTO menu_items (name, description, price, category, image, abv, is_popular) VALUES
('Cabernet Sauvignon', 'Tinto encorpado com groselha negra, cedro e um toque de baunilha do envelhecimento em carvalho.', 28.00, 'wines', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400', 14.00, TRUE),
('Chardonnay', 'Vinho branco amanteigado com notas de maçã, pera e carvalho sutil.', 26.00, 'wines', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 13.50, FALSE),
('Prosecco', 'Espumante italiano leve e efervescente. Perfeito para celebrações.', 24.00, 'wines', 'https://images.unsplash.com/photo-1578911373434-0cb395d2cbfb?w=400', 11.00, FALSE);

-- Destilados
INSERT INTO menu_items (name, description, price, category, image, abv, is_popular) VALUES
('Single Malt Scotch', 'Envelhecido 12 anos com notas de mel, fumaça e frutas secas.', 38.00, 'spirits', 'https://images.unsplash.com/photo-1527281400683-1aefee6bfc70?w=400', 43.00, TRUE),
('Tequila Premium', 'Tequila Añejo envelhecida 18 meses. Suave com caramelo e baunilha.', 34.00, 'spirits', 'https://images.unsplash.com/photo-1516535794938-6063878f08cc?w=400', 40.00, FALSE);

-- Entradas
INSERT INTO menu_items (name, description, price, category, image, is_popular) VALUES
('Batata Frita Trufada', 'Batatas crocantes com óleo de trufa, parmesão e ervas frescas.', 28.00, 'appetizers', 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400', TRUE),
('Tábua de Frios', 'Seleção de carnes curadas, queijos artesanais, azeitonas e pão crocante.', 58.00, 'appetizers', 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=400', FALSE),
('Lula Crocante', 'Lula levemente empanada servida com aioli de alho e limão.', 36.00, 'appetizers', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400', FALSE);

-- Pratos Principais
INSERT INTO menu_items (name, description, price, category, image, is_popular) VALUES
('Hambúrguer Wagyu', 'Hambúrguer de carne Wagyu premium com cheddar maturado, cebola caramelizada e molho especial.', 68.00, 'mains', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', TRUE),
('Salmão Grelhado', 'Salmão do Atlântico com manteiga de limão, legumes da estação e arroz selvagem.', 78.00, 'mains', 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400', FALSE),
('Costela Braseada', 'Costela bovina braseada lentamente com polenta cremosa e redução de vinho tinto.', 82.00, 'mains', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400', FALSE);
*/

-- ============================================
-- COMENTÁRIOS FINAIS
-- ============================================
-- Para usar este schema:
-- 1. Acesse o SQL Editor no painel do Supabase
-- 2. Cole e execute este script completo
-- 3. (Opcional) Descomente a seção de dados iniciais se quiser popular o banco
--
-- Políticas de Segurança:
-- - Leitura: Pública (qualquer pessoa pode ver itens ativos)
-- - Escrita: Apenas usuários autenticados
-- - Soft Delete: Itens são marcados como inativos, não deletados
--
-- Para autenticação de proprietários:
-- - Configure autenticação no Supabase (Email/Password ou OAuth)
-- - Crie uma tabela de roles/permissões se necessário
-- - Ajuste as políticas RLS conforme sua necessidade de segurança

