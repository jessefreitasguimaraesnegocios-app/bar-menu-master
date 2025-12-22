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
  { id: 'cocktails', label: 'Cocktails', icon: '🍸' },
  { id: 'beers', label: 'Beers', icon: '🍺' },
  { id: 'wines', label: 'Wines', icon: '🍷' },
  { id: 'spirits', label: 'Spirits', icon: '🥃' },
  { id: 'appetizers', label: 'Appetizers', icon: '🍢' },
  { id: 'mains', label: 'Main Courses', icon: '🍽️' },
];

export const menuItems: MenuItem[] = [
  // Cocktails
  {
    id: '1',
    name: 'Old Fashioned',
    description: 'A timeless classic featuring bourbon, bitters, and a touch of sweetness. Garnished with an orange twist.',
    price: 14,
    category: 'cocktails',
    image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400',
    ingredients: ['Bourbon', 'Angostura Bitters', 'Sugar Cube', 'Orange Peel'],
    preparation: 'Muddle sugar and bitters, add bourbon and ice, stir until chilled. Garnish with orange peel.',
    abv: 32,
    isPopular: true,
  },
  {
    id: '2',
    name: 'Espresso Martini',
    description: 'Vodka shaken with fresh espresso and coffee liqueur. The perfect pick-me-up cocktail.',
    price: 15,
    category: 'cocktails',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400',
    ingredients: ['Vodka', 'Kahlua', 'Fresh Espresso', 'Simple Syrup'],
    preparation: 'Shake all ingredients vigorously with ice. Double strain into a chilled coupe glass.',
    abv: 24,
    isNew: true,
  },
  {
    id: '3',
    name: 'Negroni',
    description: 'Equal parts gin, Campari, and sweet vermouth. Bitter, bold, and beautifully balanced.',
    price: 13,
    category: 'cocktails',
    image: 'https://images.unsplash.com/photo-1551751299-1b51cab2694c?w=400',
    ingredients: ['Gin', 'Campari', 'Sweet Vermouth'],
    preparation: 'Stir all ingredients with ice, strain into rocks glass over fresh ice. Garnish with orange peel.',
    abv: 28,
  },
  {
    id: '4',
    name: 'Whiskey Sour',
    description: 'Bourbon with fresh lemon juice and a silky egg white foam. Perfectly balanced sweet and sour.',
    price: 13,
    category: 'cocktails',
    image: 'https://images.unsplash.com/photo-1560512823-829485b8bf24?w=400',
    ingredients: ['Bourbon', 'Fresh Lemon Juice', 'Simple Syrup', 'Egg White'],
    preparation: 'Dry shake all ingredients, then shake with ice. Strain into coupe, garnish with bitters.',
    abv: 22,
    isPopular: true,
  },
  {
    id: '5',
    name: 'Mojito',
    description: 'Fresh mint, lime, rum, and soda. A refreshing Cuban classic for warm evenings.',
    price: 12,
    category: 'cocktails',
    image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400',
    ingredients: ['White Rum', 'Fresh Mint', 'Lime Juice', 'Sugar', 'Soda Water'],
    preparation: 'Muddle mint and sugar, add rum and lime, top with soda. Serve over crushed ice.',
    abv: 18,
  },
  // Beers
  {
    id: '6',
    name: 'Craft IPA',
    description: 'Locally brewed India Pale Ale with citrus and pine notes. Hoppy and refreshing.',
    price: 8,
    category: 'beers',
    image: 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?w=400',
    abv: 6.5,
    isPopular: true,
  },
  {
    id: '7',
    name: 'Belgian Wheat',
    description: 'Light and cloudy wheat beer with subtle coriander and orange peel.',
    price: 7,
    category: 'beers',
    image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400',
    abv: 5.2,
  },
  {
    id: '8',
    name: 'Stout',
    description: 'Rich and creamy with notes of coffee, chocolate, and roasted barley.',
    price: 9,
    category: 'beers',
    image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400',
    abv: 6.8,
    isNew: true,
  },
  // Wines
  {
    id: '9',
    name: 'Cabernet Sauvignon',
    description: 'Full-bodied red with blackcurrant, cedar, and a hint of vanilla from oak aging.',
    price: 12,
    category: 'wines',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400',
    abv: 14,
    isPopular: true,
  },
  {
    id: '10',
    name: 'Chardonnay',
    description: 'Buttery white wine with notes of apple, pear, and subtle oak.',
    price: 11,
    category: 'wines',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    abv: 13.5,
  },
  {
    id: '11',
    name: 'Prosecco',
    description: 'Light and effervescent Italian sparkling wine. Perfect for celebrations.',
    price: 10,
    category: 'wines',
    image: 'https://images.unsplash.com/photo-1578911373434-0cb395d2cbfb?w=400',
    abv: 11,
    isNew: true,
  },
  // Spirits
  {
    id: '12',
    name: 'Single Malt Scotch',
    description: 'Aged 12 years with notes of honey, smoke, and dried fruit.',
    price: 16,
    category: 'spirits',
    image: 'https://images.unsplash.com/photo-1527281400683-1aefee6bfc70?w=400',
    abv: 43,
    isPopular: true,
  },
  {
    id: '13',
    name: 'Premium Tequila',
    description: 'Añejo tequila aged 18 months. Smooth with caramel and vanilla.',
    price: 14,
    category: 'spirits',
    image: 'https://images.unsplash.com/photo-1516535794938-6063878f08cc?w=400',
    abv: 40,
  },
  // Appetizers
  {
    id: '14',
    name: 'Truffle Fries',
    description: 'Crispy fries tossed in truffle oil, parmesan, and fresh herbs.',
    price: 12,
    category: 'appetizers',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
    isPopular: true,
  },
  {
    id: '15',
    name: 'Charcuterie Board',
    description: 'Selection of cured meats, artisan cheeses, olives, and crusty bread.',
    price: 24,
    category: 'appetizers',
    image: 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=400',
    isNew: true,
  },
  {
    id: '16',
    name: 'Crispy Calamari',
    description: 'Lightly battered calamari served with garlic aioli and lemon.',
    price: 15,
    category: 'appetizers',
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400',
  },
  // Mains
  {
    id: '17',
    name: 'Wagyu Burger',
    description: 'Premium Wagyu beef patty with aged cheddar, caramelized onions, and special sauce.',
    price: 28,
    category: 'mains',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    isPopular: true,
  },
  {
    id: '18',
    name: 'Grilled Salmon',
    description: 'Atlantic salmon with lemon butter, seasonal vegetables, and wild rice.',
    price: 32,
    category: 'mains',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
  },
  {
    id: '19',
    name: 'Braised Short Ribs',
    description: 'Slow-braised beef short ribs with creamy polenta and red wine reduction.',
    price: 34,
    category: 'mains',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
    isNew: true,
  },
];
