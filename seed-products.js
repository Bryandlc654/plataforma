require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const TENANT_ID = "8769d266-af49-4e94-8726-421e10a3f144";

const products = [
  {
    slug: "camiseta-oversize",
    name: "Camiseta Oversize",
    description: "Algodón Heavyweight",
    price: 45.0,
    comparePrice: null,
    stock: 12,
    isActive: true,
    isFeatured: false,
    images: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=600&auto=format&fit=crop",
  },
  {
    slug: "hoodie-esencial",
    name: "Hoodie Esencial",
    description: "Negro Intenso",
    price: 89.0,
    comparePrice: null,
    stock: 8,
    isActive: true,
    isFeatured: true,
    images: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop",
  },
  {
    slug: "chaqueta-utility",
    name: "Chaqueta Utility",
    description: "Resistente al agua",
    price: 120.0,
    comparePrice: null,
    stock: 5,
    isActive: true,
    isFeatured: false,
    images: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop",
  },
  {
    slug: "pantalon-cargo",
    name: "Pantalón Cargo",
    description: "Ajuste relajado",
    price: 75.0,
    comparePrice: 95.0,
    stock: 15,
    isActive: true,
    isFeatured: false,
    images: "https://images.unsplash.com/photo-1582552938357-32b906df40cb?q=80&w=600&auto=format&fit=crop",
  },
];

(async () => {
  for (const prod of products) {
    const existing = await p.product.findUnique({
      where: { tenantId_slug: { tenantId: TENANT_ID, slug: prod.slug } },
      select: { id: true },
    });
    if (existing) {
      await p.product.update({ where: { id: existing.id }, data: prod });
      console.log("actualizado:", prod.name);
    } else {
      await p.product.create({ data: { ...prod, tenantId: TENANT_ID, slug: prod.slug } });
      console.log("creado:", prod.name);
    }
  }
  const count = await p.product.count({ where: { tenantId: TENANT_ID } });
  console.log("TOTAL productos del tenant:", count);
  await p.$disconnect();
})();