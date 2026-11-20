/**
 * Menús de ejemplo para arrancar rápido según el tipo de negocio. Son un punto de
 * partida editable: nombres y precios genéricos, sin fotos.
 */

type StarterOption = { name: string; price?: number };
type StarterGroup = { name: string; required?: boolean; max?: number; options: StarterOption[] };
type StarterProduct = { name: string; price: number; description?: string; featured?: boolean; groups?: StarterGroup[] };
type StarterMenu = Array<{ category: string; products: StarterProduct[] }>;

const drinks: StarterProduct[] = [
  { name: "Gaseosa", price: 1.5, description: "Personal, bien fría.", groups: [{ name: "Sabor", required: true, options: [{ name: "Cola" }, { name: "Naranja" }, { name: "Limón" }] }] },
  { name: "Limonada natural", price: 2.5, description: "Recién hecha." },
  { name: "Agua", price: 1 },
];

const burgerExtras: StarterGroup = {
  name: "Agrega extras",
  max: 3,
  options: [
    { name: "Tocino", price: 1.5 },
    { name: "Queso extra", price: 1 },
    { name: "Huevo frito", price: 1 },
  ],
};

export const STARTER_MENUS: Record<string, StarterMenu> = {
  burgers: [
    {
      category: "Hamburguesas",
      products: [
        { name: "Clásica", price: 7.5, description: "Carne de res, queso cheddar, lechuga, tomate y salsa de la casa.", featured: true, groups: [burgerExtras] },
        { name: "Doble queso", price: 9, description: "Doble carne y doble cheddar.", featured: true, groups: [burgerExtras] },
        { name: "BBQ bacon", price: 9.5, description: "Tocino crocante, cebolla caramelizada y salsa BBQ.", groups: [burgerExtras] },
        { name: "Pollo crispy", price: 8, description: "Pechuga apanada, coleslaw y mayonesa picante." },
      ],
    },
    {
      category: "Acompañantes",
      products: [
        { name: "Papas fritas", price: 2.5, groups: [{ name: "Tamaño", required: true, options: [{ name: "Mediana" }, { name: "Grande", price: 1 }] }] },
        { name: "Aros de cebolla", price: 3 },
      ],
    },
    { category: "Combos", products: [{ name: "Combo clásico", price: 10.5, description: "Clásica + papas + gaseosa.", featured: true }] },
    { category: "Bebidas", products: drinks },
  ],
  pizza: [
    {
      category: "Pizzas",
      products: [
        { name: "Margarita", price: 9, description: "Salsa de tomate, mozzarella y albahaca.", featured: true, groups: [{ name: "Tamaño", required: true, options: [{ name: "Mediana" }, { name: "Familiar", price: 5 }] }] },
        { name: "Pepperoni", price: 10.5, description: "Mozzarella y pepperoni.", featured: true, groups: [{ name: "Tamaño", required: true, options: [{ name: "Mediana" }, { name: "Familiar", price: 5 }] }] },
        { name: "Hawaiana", price: 10.5, description: "Jamón y piña.", groups: [{ name: "Tamaño", required: true, options: [{ name: "Mediana" }, { name: "Familiar", price: 5 }] }] },
      ],
    },
    { category: "Entradas", products: [{ name: "Pan de ajo", price: 3.5 }, { name: "Alitas", price: 6.5, groups: [{ name: "Salsa", required: true, options: [{ name: "BBQ" }, { name: "Búfalo" }, { name: "Miel mostaza" }] }] }] },
    { category: "Bebidas", products: drinks },
  ],
  cafe: [
    {
      category: "Cafés",
      products: [
        { name: "Americano", price: 1.8, groups: [{ name: "Tamaño", required: true, options: [{ name: "Pequeño" }, { name: "Grande", price: 0.7 }] }] },
        { name: "Capuchino", price: 2.8, featured: true, groups: [{ name: "Leche", options: [{ name: "Entera" }, { name: "Deslactosada" }, { name: "Avena", price: 0.5 }] }] },
        { name: "Latte", price: 3 },
      ],
    },
    {
      category: "Para comer",
      products: [
        { name: "Croissant de jamón y queso", price: 3.5, featured: true },
        { name: "Sánduche de pollo", price: 4.5 },
        { name: "Tostadas con aguacate", price: 4 },
      ],
    },
    { category: "Postres", products: [{ name: "Cheesecake", price: 3.5 }, { name: "Brownie", price: 2.5 }] },
    { category: "Bebidas frías", products: [{ name: "Jugo natural", price: 2.5 }, { name: "Frappé", price: 3.5 }] },
  ],
  fastfood: [
    { category: "Lo más pedido", products: [
      { name: "Salchipapa", price: 3.5, featured: true },
      { name: "Hot dog", price: 3, groups: [{ name: "Salsas", max: 3, options: [{ name: "Mayonesa" }, { name: "Kétchup" }, { name: "Mostaza" }] }] },
      { name: "Alitas", price: 6, groups: [{ name: "Salsa", required: true, options: [{ name: "BBQ" }, { name: "Búfalo" }] }] },
    ] },
    { category: "Combos", products: [{ name: "Combo personal", price: 6, description: "Plato + bebida.", featured: true }] },
    { category: "Bebidas", products: drinks },
  ],
  bar: [
    { category: "Cócteles", products: [
      { name: "Mojito", price: 6, featured: true },
      { name: "Margarita", price: 6.5 },
      { name: "Gin tonic", price: 7, groups: [{ name: "Gin", required: true, options: [{ name: "De la casa" }, { name: "Premium", price: 3 }] }] },
    ] },
    { category: "Cervezas", products: [{ name: "Cerveza nacional", price: 2.5 }, { name: "Cerveza artesanal", price: 4.5 }] },
    { category: "Para picar", products: [{ name: "Nachos con queso", price: 5.5, featured: true }, { name: "Papas con cheddar", price: 4.5 }] },
  ],
  restaurant: [
    { category: "Entradas", products: [{ name: "Empanadas (3 u.)", price: 4 }, { name: "Ceviche", price: 7.5 }] },
    {
      category: "Platos fuertes",
      products: [
        { name: "Lomo saltado", price: 9.5, featured: true },
        { name: "Pollo a la plancha", price: 8, description: "Con arroz, ensalada y papas.", groups: [{ name: "Acompañante", required: true, options: [{ name: "Arroz" }, { name: "Papas fritas" }, { name: "Ensalada" }] }] },
        { name: "Pescado frito", price: 9 },
      ],
    },
    { category: "Postres", products: [{ name: "Flan de la casa", price: 2.5 }, { name: "Tres leches", price: 3 }] },
    { category: "Bebidas", products: drinks },
  ],
};

/** Alias de los tipos que se eligen en la bienvenida. */
export function starterFor(type: string): StarterMenu {
  const alias: Record<string, string> = { foodtruck: "fastfood", other: "restaurant" };
  return STARTER_MENUS[alias[type] || type] || STARTER_MENUS.restaurant;
}
