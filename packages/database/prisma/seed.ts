import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding templates...');

  // Create Category
  const category = await prisma.templateCategory.upsert({
    where: { slug: 'corporate' },
    update: {},
    create: {
      name: 'Corporativo',
      slug: 'corporate',
      description: 'Plantillas ideales para empresas, consultoras y agencias.',
      sortOrder: 1,
    },
  });

  console.log(`✅ Categoría "${category.name}" lista.`);

  // Create Template
  const template = await prisma.template.create({
    data: {
      name: 'Corporate Elite',
      description: 'Plantilla completa con secciones diseñadas para empresas B2B y servicios corporativos.',
      categoryId: category.id,
      thumbnail: 'https://placehold.co/600x400/2563EB/white?text=Corporate+Elite',
      tags: ['b2b', 'corporate', 'agency', 'consulting'],
      isPremium: false,
      isActive: true,
      globalStyles: {
        colors: {
          primary: '#1E40AF', // dark blue
          secondary: '#3B82F6', // blue
          accent: '#F59E0B', // amber
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter',
        },
      },
    },
  });

  console.log(`✅ Plantilla "${template.name}" creada con ID: ${template.id}`);

  // Create Page (Home)
  const homePage = await prisma.templatePage.create({
    data: {
      templateId: template.id,
      name: 'Inicio',
      slug: 'home',
      path: '/',
      isDefault: true,
      seoTitle: 'Corporate Elite - Soluciones de Clase Mundial',
      seoDesc: 'Somos líderes en consultoría corporativa y desarrollo de estrategias empresariales.',
      sortOrder: 0,
    },
  });

  console.log(`✅ Página "${homePage.name}" creada.`);

  // Define Blocks
  const blocks = [
    {
      type: 'header',
      content: {
        variant: 'classic',
        logoType: 'text',
        logoText: 'CorpElite',
        logoImage: '',
        links: [
          { label: 'Inicio', url: '#' },
          { label: 'Servicios', url: '#servicios' },
          { label: 'Nosotros', url: '#nosotros' },
          { label: 'Equipo', url: '#equipo' },
        ],
        ctaText: 'Contáctanos',
        ctaUrl: '#contacto',
      },
    },
    {
      type: 'hero',
      content: {
        bgType: 'gradient',
        backgroundImage: '',
        kicker: 'LÍDERES EN LA INDUSTRIA',
        title: 'Soluciones Corporativas de Clase Mundial',
        subtitle: 'Transformamos tu visión en realidad con estrategias innovadoras y ejecución impecable.',
        buttonText: 'Agendar Asesoría',
        buttonUrl: '#contacto',
        secondaryButtonText: 'Nuestros Servicios',
        secondaryButtonUrl: '#servicios',
      },
    },
    {
      type: 'features',
      content: {
        title: '¿Por qué elegirnos?',
        subtitle: 'Ofrecemos ventajas competitivas reales',
        items: [
          { icon: '🚀', title: 'Innovación', desc: 'Implementamos las últimas tecnologías y metodologías ágiles del mercado.' },
          { icon: '🔒', title: 'Seguridad', desc: 'Tus datos y operaciones protegidos con estándares de nivel bancario.' },
          { icon: '📈', title: 'Crecimiento', desc: 'Estrategias diseñadas para escalar tus resultados de forma sostenible.' },
        ],
      },
    },
    {
      type: 'about',
      content: {
        title: 'Sobre Nosotros',
        description: 'En CorpElite nos dedicamos a empoderar empresas. Con más de una década de experiencia, hemos ayudado a cientos de organizaciones a superar sus desafíos más complejos y alcanzar sus metas estratégicas.',
        buttonText: 'Conoce nuestra historia',
        buttonUrl: '#',
        imageUrl: 'https://placehold.co/800x600/e2e8f0/64748b?text=Corporate+Team',
      },
    },
    {
      type: 'services',
      content: {
        title: 'Nuestros Servicios',
        subtitle: 'Soluciones integrales para tu negocio',
        items: [
          { title: 'Consultoría Estratégica', desc: 'Análisis profundo y diseño de hojas de ruta para el crecimiento.', icon: '' },
          { title: 'Transformación Digital', desc: 'Digitalizamos tus procesos para maximizar la eficiencia y rentabilidad.', icon: '' },
          { title: 'Gestión Financiera', desc: 'Optimización de recursos y planificación financiera avanzada.', icon: '' },
        ],
      },
    },
    {
      type: 'team',
      content: {
        title: 'Nuestro Liderazgo',
        subtitle: 'Expertos comprometidos con tu éxito',
        members: [
          { name: 'Elena Ramírez', role: 'CEO & Fundadora', image: 'https://placehold.co/400x400/e2e8f0/64748b?text=ER', bio: 'Visionaria con 15 años de experiencia corporativa.' },
          { name: 'Carlos Mendoza', role: 'CTO', image: 'https://placehold.co/400x400/e2e8f0/64748b?text=CM', bio: 'Experto en arquitectura tecnológica empresarial.' },
          { name: 'Laura Torres', role: 'CFO', image: 'https://placehold.co/400x400/e2e8f0/64748b?text=LT', bio: 'Estratega financiera con enfoque en rentabilidad.' },
        ],
      },
    },
    {
      type: 'testimonials',
      content: {
        title: 'Casos de Éxito',
        subtitle: 'Lo que dicen quienes confían en nosotros',
        columns: 2,
        carousel: false,
        items: [
          { name: 'Roberto Gómez', role: 'Director de Operaciones, GlobalCorp', quote: 'Gracias a CorpElite, redujimos nuestros costos operativos en un 30% en el primer año.' },
          { name: 'Ana Silva', role: 'VP de Innovación, TechGroup', quote: 'La transformación digital que implementaron fue clave para nuestra expansión internacional.' },
        ],
      },
    },
    {
      type: 'cta',
      content: {
        title: '¿Listo para llevar tu empresa al siguiente nivel?',
        subtitle: 'Agenda una llamada con nuestros expertos y descubre cómo podemos ayudarte.',
        buttonText: 'Empezar ahora',
        buttonUrl: '#contacto',
      },
    },
    {
      type: 'contact',
      content: {
        title: 'Contacto',
        subtitle: 'Estamos aquí para ayudarte. Déjanos tus datos y un asesor se comunicará contigo.',
        buttonText: 'Enviar mensaje',
        fields: [
          { label: 'Nombre completo', type: 'text', name: 'name', required: true },
          { label: 'Correo corporativo', type: 'email', name: 'email', required: true },
          { label: 'Empresa', type: 'text', name: 'company', required: false },
          { label: '¿En qué podemos ayudarte?', type: 'textarea', name: 'message', required: true },
        ],
      },
    },
    {
      type: 'footer',
      content: {
        companyName: 'CorpElite',
        description: 'Transformamos tu presencia corporativa y digital.',
        columns: [
          {
            title: 'Navegación',
            links: [
              { label: 'Inicio', url: '#' },
              { label: 'Servicios', url: '#servicios' },
              { label: 'Nosotros', url: '#nosotros' },
            ],
          },
          {
            title: 'Contacto',
            links: [
              { label: 'info@corpelite.com', url: 'mailto:info@corpelite.com' },
              { label: '+1 234 567 890', url: 'tel:+1234567890' },
            ],
          },
        ],
        copyright: '© 2026 CorpElite. Todos los derechos reservados.',
      },
    },
    {
      type: 'whatsapp',
      content: {
        phone: '1234567890',
        message: 'Hola, me interesa recibir asesoría para mi empresa.',
        position: 'bottom-right',
        size: 56,
        color: '#25D366',
        tooltip: 'Asesoría inmediata',
      },
    },
  ];

  // Insert Blocks
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    await prisma.templateBlock.create({
      data: {
        templatePageId: homePage.id,
        type: b.type,
        content: b.content,
        sortOrder: i,
      },
    });
  }

  console.log(`✅ Se insertaron ${blocks.length} bloques en la página.`);
  console.log('🎉 Seeding completado exitosamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
