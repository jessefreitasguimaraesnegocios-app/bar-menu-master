export type Category = 'cocktails' | 'beers' | 'wines' | 'spirits' | 'appetizers' | 'mains';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  image: string;
  ingredients?: string[];
  preparation?: string;
  abv?: number;
  isPopular?: boolean;
  isNew?: boolean;
}

export const categories: { id: Category; label: string; icon: string }[] = [
  { id: 'cocktails', label: 'Coquetéis', icon: '🍸' },
  { id: 'beers', label: 'Cervejas', icon: '🍺' },
  { id: 'wines', label: 'Vinhos', icon: '🍷' },
  { id: 'spirits', label: 'Destilados', icon: '🥃' },
  { id: 'appetizers', label: 'Entradas', icon: '🍢' },
  { id: 'mains', label: 'Pratos Principais', icon: '🍽️' },
];

export const menuItems: MenuItem[] = [
  // Coquetéis
  {
    id: '1',
    name: 'Old Fashioned',
    description: 'Um clássico atemporal com bourbon, bitters e um toque de doçura. Decorado com casca de laranja.',
    price: 32,
    category: 'cocktails',
    image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400',
    ingredients: ['Bourbon', 'Angostura Bitters', 'Cubo de Açúcar', 'Casca de Laranja'],
    preparation: 'Macere o açúcar com bitters, adicione bourbon e gelo, mexa até gelar. Decore com casca de laranja.',
    abv: 32,
    isPopular: true,
  },
  {
    id: '2',
    name: 'Espresso Martini',
    description: 'Vodka batida com espresso fresco e licor de café. O coquetel perfeito para te animar.',
    price: 36,
    category: 'cocktails',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400',
    ingredients: ['Vodka', 'Kahlua', 'Espresso Fresco', 'Xarope Simples'],
    preparation: 'Bata todos os ingredientes vigorosamente com gelo. Coe duplamente em uma taça gelada.',
    abv: 24,
    isNew: true,
  },
  {
    id: '3',
    name: 'Negroni',
    description: 'Partes iguais de gin, Campari e vermute doce. Amargo, ousado e lindamente equilibrado.',
    price: 30,
    category: 'cocktails',
    image: 'https://images.unsplash.com/photo-1551751299-1b51cab2694c?w=400',
    ingredients: ['Gin', 'Campari', 'Vermute Doce'],
    preparation: 'Mexa todos os ingredientes com gelo, coe em copo rocks com gelo fresco. Decore com casca de laranja.',
    abv: 28,
  },
  {
    id: '4',
    name: 'Whiskey Sour',
    description: 'Bourbon com suco de limão fresco e espuma sedosa de clara de ovo. Perfeitamente equilibrado entre doce e azedo.',
    price: 30,
    category: 'cocktails',
    image: 'https://images.unsplash.com/photo-1560512823-829485b8bf24?w=400',
    ingredients: ['Bourbon', 'Suco de Limão Fresco', 'Xarope Simples', 'Clara de Ovo'],
    preparation: 'Bata todos os ingredientes sem gelo, depois com gelo. Coe em taça, decore com bitters.',
    abv: 22,
    isPopular: true,
  },
  {
    id: '5',
    name: 'Mojito',
    description: 'Hortelã fresca, limão, rum e água com gás. Um clássico cubano refrescante para noites quentes.',
    price: 28,
    category: 'cocktails',
    image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400',
    ingredients: ['Rum Branco', 'Hortelã Fresca', 'Suco de Limão', 'Açúcar', 'Água com Gás'],
    preparation: 'Macere hortelã e açúcar, adicione rum e limão, complete com água com gás. Sirva com gelo pilado.',
    abv: 18,
  },
  // Cervejas
  {
    id: '6',
    name: 'IPA Artesanal',
    description: 'India Pale Ale produzida localmente com notas cítricas e de pinho. Lupulada e refrescante.',
    price: 18,
    category: 'beers',
    image: 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?w=400',
    abv: 6.5,
    isPopular: true,
  },
  {
    id: '7',
    name: 'Witbier Belga',
    description: 'Cerveja de trigo leve e turva com sutil coentro e casca de laranja.',
    price: 16,
    category: 'beers',
    image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400',
    abv: 5.2,
  },
  {
    id: '8',
    name: 'Stout',
    description: 'Rica e cremosa com notas de café, chocolate e malte torrado.',
    price: 20,
    category: 'beers',
    image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400',
    abv: 6.8,
    isNew: true,
  },
  // Vinhos
  {
    id: '9',
    name: 'Cabernet Sauvignon',
    description: 'Tinto encorpado com groselha negra, cedro e um toque de baunilha do envelhecimento em carvalho.',
    price: 28,
    category: 'wines',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400',
    abv: 14,
    isPopular: true,
  },
  {
    id: '10',
    name: 'Chardonnay',
    description: 'Vinho branco amanteigado com notas de maçã, pera e carvalho sutil.',
    price: 26,
    category: 'wines',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    abv: 13.5,
  },
  {
    id: '11',
    name: 'Prosecco',
    description: 'Espumante italiano leve e efervescente. Perfeito para celebrações.',
    price: 24,
    category: 'wines',
    image: 'https://images.unsplash.com/photo-1578911373434-0cb395d2cbfb?w=400',
    abv: 11,
    isNew: true,
  },
  // Destilados
  {
    id: '12',
    name: 'Single Malt Scotch',
    description: 'Envelhecido 12 anos com notas de mel, fumaça e frutas secas.',
    price: 38,
    category: 'spirits',
    image: 'https://images.unsplash.com/photo-1527281400683-1aefee6bfc70?w=400',
    abv: 43,
    isPopular: true,
  },
  {
    id: '13',
    name: 'Tequila Premium',
    description: 'Tequila Añejo envelhecida 18 meses. Suave com caramelo e baunilha.',
    price: 34,
    category: 'spirits',
    image: 'https://images.unsplash.com/photo-1516535794938-6063878f08cc?w=400',
    abv: 40,
  },
  // Entradas
  {
    id: '14',
    name: 'Batata Frita Trufada',
    description: 'Batatas crocantes com óleo de trufa, parmesão e ervas frescas.',
    price: 28,
    category: 'appetizers',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
    isPopular: true,
  },
  {
    id: '15',
    name: 'Tábua de Frios',
    description: 'Seleção de carnes curadas, queijos artesanais, azeitonas e pão crocante.',
    price: 58,
    category: 'appetizers',
    image: 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=400',
    isNew: true,
  },
  {
    id: '16',
    name: 'Lula Crocante',
    description: 'Lula levemente empanada servida com aioli de alho e limão.',
    price: 36,
    category: 'appetizers',
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400',
  },
  // Pratos Principais
  {
    id: '17',
    name: 'Hambúrguer Wagyu',
    description: 'Hambúrguer de carne Wagyu premium com cheddar maturado, cebola caramelizada e molho especial.',
    price: 68,
    category: 'mains',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    isPopular: true,
  },
  {
    id: '18',
    name: 'Salmão Grelhado',
    description: 'Salmão do Atlântico com manteiga de limão, legumes da estação e arroz selvagem.',
    price: 78,
    category: 'mains',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
  },
  {
    id: '19',
    name: 'Costela Braseada',
    description: 'Costela bovina braseada lentamente com polenta cremosa e redução de vinho tinto.',
    price: 82,
    category: 'mains',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
    isNew: true,
  },
];
