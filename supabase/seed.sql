-- ============================================
-- Dados Iniciais - Cardápio Cantim
-- ============================================
-- Execute este arquivo APÓS executar o schema.sql
-- para popular o banco com dados de exemplo
-- ============================================

-- Limpar dados existentes (opcional - descomente se necessário)
-- DELETE FROM menu_items;

-- ============================================
-- COQUETÉIS
-- ============================================
INSERT INTO menu_items (name, description, price, category, image, ingredients, preparation, abv, is_popular, is_new) VALUES
('Old Fashioned', 'Um clássico atemporal com bourbon, bitters e um toque de doçura. Decorado com casca de laranja.', 32.00, 'cocktails', 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400', ARRAY['Bourbon', 'Angostura Bitters', 'Cubo de Açúcar', 'Casca de Laranja'], 'Macere o açúcar com bitters, adicione bourbon e gelo, mexa até gelar. Decore com casca de laranja.', 32.00, TRUE, FALSE),
('Espresso Martini', 'Vodka batida com espresso fresco e licor de café. O coquetel perfeito para te animar.', 36.00, 'cocktails', 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400', ARRAY['Vodka', 'Kahlua', 'Espresso Fresco', 'Xarope Simples'], 'Bata todos os ingredientes vigorosamente com gelo. Coe duplamente em uma taça gelada.', 24.00, FALSE, TRUE),
('Negroni', 'Partes iguais de gin, Campari e vermute doce. Amargo, ousado e lindamente equilibrado.', 30.00, 'cocktails', 'https://images.unsplash.com/photo-1551751299-1b51cab2694c?w=400', ARRAY['Gin', 'Campari', 'Vermute Doce'], 'Mexa todos os ingredientes com gelo, coe em copo rocks com gelo fresco. Decore com casca de laranja.', 28.00, FALSE, FALSE),
('Whiskey Sour', 'Bourbon com suco de limão fresco e espuma sedosa de clara de ovo. Perfeitamente equilibrado entre doce e azedo.', 30.00, 'cocktails', 'https://images.unsplash.com/photo-1560512823-829485b8bf24?w=400', ARRAY['Bourbon', 'Suco de Limão Fresco', 'Xarope Simples', 'Clara de Ovo'], 'Bata todos os ingredientes sem gelo, depois com gelo. Coe em taça, decore com bitters.', 22.00, TRUE, FALSE),
('Mojito', 'Hortelã fresca, limão, rum e água com gás. Um clássico cubano refrescante para noites quentes.', 28.00, 'cocktails', 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400', ARRAY['Rum Branco', 'Hortelã Fresca', 'Suco de Limão', 'Açúcar', 'Água com Gás'], 'Macere hortelã e açúcar, adicione rum e limão, complete com água com gás. Sirva com gelo pilado.', 18.00, FALSE, FALSE);

-- ============================================
-- CERVEJAS
-- ============================================
INSERT INTO menu_items (name, description, price, category, image, abv, is_popular, is_new) VALUES
('IPA Artesanal', 'India Pale Ale produzida localmente com notas cítricas e de pinho. Lupulada e refrescante.', 18.00, 'beers', 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?w=400', 6.50, TRUE, FALSE),
('Witbier Belga', 'Cerveja de trigo leve e turva com sutil coentro e casca de laranja.', 16.00, 'beers', 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400', 5.20, FALSE, FALSE),
('Stout', 'Rica e cremosa com notas de café, chocolate e malte torrado.', 20.00, 'beers', 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400', 6.80, FALSE, TRUE);

-- ============================================
-- VINHOS
-- ============================================
INSERT INTO menu_items (name, description, price, category, image, abv, is_popular, is_new) VALUES
('Cabernet Sauvignon', 'Tinto encorpado com groselha negra, cedro e um toque de baunilha do envelhecimento em carvalho.', 28.00, 'wines', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400', 14.00, TRUE, FALSE),
('Chardonnay', 'Vinho branco amanteigado com notas de maçã, pera e carvalho sutil.', 26.00, 'wines', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 13.50, FALSE, FALSE),
('Prosecco', 'Espumante italiano leve e efervescente. Perfeito para celebrações.', 24.00, 'wines', 'https://images.unsplash.com/photo-1578911373434-0cb395d2cbfb?w=400', 11.00, FALSE, TRUE);

-- ============================================
-- DESTILADOS
-- ============================================
INSERT INTO menu_items (name, description, price, category, image, abv, is_popular, is_new) VALUES
('Single Malt Scotch', 'Envelhecido 12 anos com notas de mel, fumaça e frutas secas.', 38.00, 'spirits', 'https://images.unsplash.com/photo-1527281400683-1aefee6bfc70?w=400', 43.00, TRUE, FALSE),
('Tequila Premium', 'Tequila Añejo envelhecida 18 meses. Suave com caramelo e baunilha.', 34.00, 'spirits', 'https://images.unsplash.com/photo-1516535794938-6063878f08cc?w=400', 40.00, FALSE, FALSE);

-- ============================================
-- ENTRADAS
-- ============================================
INSERT INTO menu_items (name, description, price, category, image, is_popular, is_new) VALUES
('Batata Frita Trufada', 'Batatas crocantes com óleo de trufa, parmesão e ervas frescas.', 28.00, 'appetizers', 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400', TRUE, FALSE),
('Tábua de Frios', 'Seleção de carnes curadas, queijos artesanais, azeitonas e pão crocante.', 58.00, 'appetizers', 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=400', FALSE, TRUE),
('Lula Crocante', 'Lula levemente empanada servida com aioli de alho e limão.', 36.00, 'appetizers', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400', FALSE, FALSE);

-- ============================================
-- PRATOS PRINCIPAIS
-- ============================================
INSERT INTO menu_items (name, description, price, category, image, is_popular, is_new) VALUES
('Hambúrguer Wagyu', 'Hambúrguer de carne Wagyu premium com cheddar maturado, cebola caramelizada e molho especial.', 68.00, 'mains', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', TRUE, FALSE),
('Salmão Grelhado', 'Salmão do Atlântico com manteiga de limão, legumes da estação e arroz selvagem.', 78.00, 'mains', 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400', FALSE, FALSE),
('Costela Braseada', 'Costela bovina braseada lentamente com polenta cremosa e redução de vinho tinto.', 82.00, 'mains', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400', FALSE, TRUE);

-- ============================================
-- Verificar dados inseridos
-- ============================================
-- Execute esta query para verificar se os dados foram inseridos corretamente:
-- SELECT category, COUNT(*) as total FROM menu_items GROUP BY category ORDER BY category;

