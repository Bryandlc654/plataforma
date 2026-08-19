import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Rodriplast template...');

  // Create or get Category
  let category = await prisma.templateCategory.findUnique({
    where: { slug: 'industrial' },
  });

  if (!category) {
    category = await prisma.templateCategory.create({
      data: {
        name: 'Industrial',
        slug: 'industrial',
        description: 'Plantillas ideales para empresas industriales, fábricas y manufactura.',
        sortOrder: 2,
      },
    });
    console.log(`✅ Categoría "${category.name}" creada.`);
  } else {
    console.log(`✅ Categoría "${category.name}" existente.`);
  }

  // Create or update Template
  let template = await prisma.template.findFirst({
    where: { name: 'Rodriplast' },
  });

  if (!template) {
    template = await prisma.template.create({
      data: {
        name: 'Rodriplast',
        description: 'Plantilla ecológica e industrial con enfoque en sustentabilidad.',
        categoryId: category.id,
        thumbnail: 'https://placehold.co/600x400/4fad33/white?text=Rodriplast',
        tags: ['industrial', 'eco', 'sustainability', 'manufacturing'],
        isPremium: false,
        isActive: true,
        globalStyles: {
          colors: {
            primary: '#4fad33',
            secondary: '#f8fafc',
            accent: '#84cc16',
          },
          fonts: {
            heading: 'Inter',
            body: 'Inter',
          },
        },
      },
    });
    console.log(`✅ Plantilla "${template.name}" creada con ID: ${template.id}`);
  } else {
    await prisma.template.update({
      where: { id: template.id },
      data: {
        description: 'Plantilla ecológica e industrial con enfoque en sustentabilidad.',
        categoryId: category.id,
        thumbnail: 'https://placehold.co/600x400/4fad33/white?text=Rodriplast',
        tags: ['industrial', 'eco', 'sustainability', 'manufacturing'],
        isPremium: false,
        isActive: true,
        globalStyles: {
          colors: {
            primary: '#4fad33',
            secondary: '#f8fafc',
            accent: '#84cc16',
          },
          fonts: {
            heading: 'Inter',
            body: 'Inter',
          },
        },
      },
    });
    console.log(`✅ Plantilla "${template.name}" actualizada con ID: ${template.id}`);
  }

  // Create or update Page (Home)
  const homePage = await prisma.templatePage.upsert({
    where: { templateId_slug: { templateId: template.id, slug: 'home' } },
    update: {
      name: 'Inicio',
      path: '/',
      isDefault: true,
      seoTitle: 'Rodriplast - Mangueras del futuro',
      seoDesc: 'Cada manguera es una declaración ambiental.',
      sortOrder: 0,
    },
    create: {
      templateId: template.id,
      name: 'Inicio',
      slug: 'home',
      path: '/',
      isDefault: true,
      seoTitle: 'Rodriplast - Mangueras del futuro',
      seoDesc: 'Cada manguera es una declaración ambiental.',
      sortOrder: 0,
    },
  });

  console.log(`✅ Página "${homePage.name}" lista.`);

  // Create or update Page (Nosotros)
  const nosotrosPage = await prisma.templatePage.upsert({
    where: { templateId_slug: { templateId: template.id, slug: 'nosotros' } },
    update: {
      name: 'Nosotros',
      path: '/nosotros',
      isDefault: false,
      seoTitle: 'Nosotros - Rodriplast',
      seoDesc: 'Conoce a Rodriplast: una industria ecuatoriana que transforma residuos en soluciones.',
      sortOrder: 1,
    },
    create: {
      templateId: template.id,
      name: 'Nosotros',
      slug: 'nosotros',
      path: '/nosotros',
      isDefault: false,
      seoTitle: 'Nosotros - Rodriplast',
      seoDesc: 'Conoce a Rodriplast: una industria ecuatoriana que transforma residuos en soluciones.',
      sortOrder: 1,
    },
  });

  console.log(`✅ Página "${nosotrosPage.name}" lista.`);

  // Create or update Page (Contacto)
  const contactoPage = await prisma.templatePage.upsert({
    where: { templateId_slug: { templateId: template.id, slug: 'contacto' } },
    update: {
      name: 'Contacto',
      path: '/contacto',
      isDefault: false,
      seoTitle: 'Contacto - Rodriplast',
      seoDesc: 'Contáctanos para cotizar mangueras industriales, agrícolas y domésticas fabricadas con material reciclado.',
      sortOrder: 2,
    },
    create: {
      templateId: template.id,
      name: 'Contacto',
      slug: 'contacto',
      path: '/contacto',
      isDefault: false,
      seoTitle: 'Contacto - Rodriplast',
      seoDesc: 'Contáctanos para cotizar mangueras industriales, agrícolas y domésticas fabricadas con material reciclado.',
      sortOrder: 2,
    },
  });

  console.log(`✅ Página "${contactoPage.name}" lista.`);

  // Create or update Page (Productos)
  const productosPage = await prisma.templatePage.upsert({
    where: { templateId_slug: { templateId: template.id, slug: 'productos' } },
    update: {
      name: 'Productos',
      path: '/productos',
      isDefault: false,
      seoTitle: 'Productos - Rodriplast',
      seoDesc: 'Catálogo de mangueras agrícolas, industriales, domésticas y especiales fabricadas con material 100% reciclado.',
      sortOrder: 3,
    },
    create: {
      templateId: template.id,
      name: 'Productos',
      slug: 'productos',
      path: '/productos',
      isDefault: false,
      seoTitle: 'Productos - Rodriplast',
      seoDesc: 'Catálogo de mangueras agrícolas, industriales, domésticas y especiales fabricadas con material 100% reciclado.',
      sortOrder: 3,
    },
  });

  console.log(`✅ Página "${productosPage.name}" lista.`);

  // Blocks shared between pages (variant: 'rodriplast')
  const sharedHeader = {
    type: 'header',
    content: {
      variant: 'rodriplast',
      logoText: 'Rodriplast',
      logoImage: 'https://placehold.co/200x80/ffffff/0f172a?text=Rodriplast',
      links: [
        { label: 'Inicio', url: '/#inicio' },
        { label: 'Nosotros', url: '/nosotros' },
        { label: 'Productos', url: '/productos' },
        { label: 'Contacto', url: '/contacto' },
      ],
      ctaText: 'Solicitar cotización',
      ctaUrl: '#contacto',
    },
  };

  const sharedStats = {
    type: 'stats',
    content: {
      variant: 'rodriplast',
      items: [
        { icon: 'bi-award', value: '15', suffix: '+', label: 'Años de experiencia' },
        { icon: 'bi-arrow-repeat', value: '2500', suffix: ' tn', label: 'Plástico reciclado al año' },
        { icon: 'bi-people', value: '480', suffix: '+', label: 'Clientes activos' },
        { icon: 'bi-shield-check', value: '98', suffix: '%', label: 'Índice de satisfacción' },
      ],
    },
  };

  const sharedPortfolio = {
    type: 'portfolio',
    content: {
      variant: 'rodriplast',
      anchor: 'productos',
      kicker: 'Catálogo',
      title: 'Soluciones que se adaptan a <span class="text-gradient">cada industria</span>',
      subtitle: 'Fabricamos una línea completa de mangueras según especificaciones técnicas, longitudes y presiones de trabajo. Diseñadas en Ecuador para el mundo.',
      items: [
        { title: 'Mangueras agrícolas', desc: 'Para riego eficiente y sistemas de goteo en cultivos de todo tamaño.', tag: 'Agrícola', icon: 'bi-crosshair', category: 'Agricultura', link: '/productos', image: 'https://placehold.co/800x600/4fad33/ffffff?text=Agrícola' },
        { title: 'Mangueras industriales', desc: 'Alta resistencia para aplicaciones exigentes en fábricas y plantas.', tag: 'Industrial', icon: 'bi-sun', category: 'Industrial', link: '/productos', image: 'https://placehold.co/800x600/3d8f29/ffffff?text=Industrial' },
        { title: 'Mangueras domésticas', desc: 'Prácticas y duraderas para el hogar y jardines.', tag: 'Doméstico', icon: 'bi-house', category: 'Doméstico', link: '/productos', image: 'https://placehold.co/800x600/84cc16/ffffff?text=Doméstico' },
      ],
    },
  };

  const sharedProcess = {
    type: 'process',
    content: {
      variant: 'rodriplast',
      anchor: 'proceso',
      kicker: 'Proceso',
      title: 'De residuo a manguera: <span class="bg-gradient-to-r from-rodri-primary-glow to-rodri-accent bg-clip-text text-transparent">cuatro pasos con propósito</span>',
      items: [
        { icon: 'bi-arrow-repeat', title: 'Recolección', desc: 'Recuperamos plásticos reciclables de industrias y centros de acopio del país.' },
        { icon: 'bi-gear', title: 'Procesamiento', desc: 'Lavado, triturado y peletizado bajo estrictos controles de calidad.' },
        { icon: 'bi-shield-check', title: 'Fabricación', desc: 'Extrusión de precisión con maquinaria de última generación.' },
        { icon: 'bi-people', title: 'Distribución', desc: 'Logística nacional e internacional con trazabilidad completa.' },
      ],
    },
  };

  const sharedBenefits = {
    type: 'benefits',
    content: {
      variant: 'rodriplast',
      anchor: 'beneficios',
      kicker: 'Beneficios',
      title: 'Ventajas que marcan la <span class="text-gradient">diferencia</span>',
      items: [
        { icon: 'bi-shield-check', title: 'Máxima durabilidad', desc: 'Resistencia a rayos UV, presión y temperaturas extremas.' },
        { icon: 'bi-flower1', title: '100% ecológicas', desc: 'Fabricadas exclusivamente con material reciclado certificado.' },
        { icon: 'bi-gear', title: 'Alto rendimiento', desc: 'Diseñadas para exigencias industriales y agrícolas modernas.' },
        { icon: 'bi-crosshair', title: 'Precio competitivo', desc: 'Mayor eficiencia productiva se traduce en mejor precio para ti.' },
        { icon: 'bi-clock', title: 'Calidad certificada', desc: 'Cumplimos normas internacionales ISO y controles nacionales.' },
        { icon: 'bi-geo-alt', title: 'Entrega oportuna', desc: 'Logística confiable a nivel nacional e internacional.' },
      ],
    },
  };

  const sharedTestimonials = {
    type: 'testimonials',
    content: {
      variant: 'rodriplast',
      anchor: 'clientes',
      kicker: 'Testimonios',
      title: 'Lo que dicen nuestros clientes',
      items: [
        { name: 'María Fernanda C.', role: 'Gerente de Operaciones', quote: 'El cambio a mangueras Rodriplast nos permitió reducir costos operativos y reforzar nuestra política ambiental. Producto confiable y equipo atento.' },
        { name: 'Luis Ramírez', role: 'Jefe Técnico', quote: 'Excelente durabilidad en condiciones exigentes de campo. Llevamos tres años trabajando con ellos y la calidad es constante.' },
        { name: 'Carla Mendoza', role: 'Compras', quote: 'Cumplen los plazos, la documentación técnica es impecable y el soporte postventa marca la diferencia. Muy recomendados.' },
      ],
    },
  };

  const sharedContact = {
    type: 'contact',
    content: {
      variant: 'rodriplast',
      anchor: 'contacto',
      kicker: 'Contacto',
      title: 'Solicita tu cotización',
      subtitle: 'Cuéntanos sobre tu proyecto. Nuestro equipo comercial te responderá en menos de 24 horas hábiles.',
      buttonText: 'Enviar solicitud',
      address: 'Parque Industrial · Guayaquil, Ecuador',
      phone: '+593 4 000 0000',
      email: 'ventas@rodriplast.ec',
      mapUrl: 'https://www.openstreetmap.org/export/embed.html?bbox=-79.95%2C-2.20%2C-79.85%2C-2.10&layer=mapnik',
      fields: [
        { label: 'Nombre completo', type: 'text', name: 'nombre', required: true },
        { label: 'Empresa', type: 'text', name: 'empresa', required: false },
        { label: 'Correo electrónico', type: 'email', name: 'email', required: true },
        { label: 'Teléfono', type: 'tel', name: 'telefono', required: false },
        { label: 'Tipo de producto', type: 'text', name: 'producto', required: false },
        { label: 'Mensaje', type: 'textarea', name: 'mensaje', required: true },
      ],
    },
  };

  const sharedFooter = {
    type: 'footer',
    content: {
      variant: 'rodriplast',
      logoText: 'Rodriplast',
      logoImage: 'https://placehold.co/200x80/ffffff/0f172a?text=Rodriplast',
      companyName: 'Rodriplast',
      description: 'Fabricantes ecuatorianos de mangueras elaboradas 100% con materiales reciclados. Calidad, innovación y compromiso ambiental.',
      address: 'Parque Industrial · Guayaquil, Ecuador',
      phone: '+593 4 000 0000',
      email: 'ventas@rodriplast.ec',
      social: [
        { icon: 'bi-facebook', url: 'https://www.facebook.com/rodriplast', label: 'Facebook' },
        { icon: 'bi-instagram', url: 'https://www.instagram.com/rodriplast', label: 'Instagram' },
        { icon: 'bi-linkedin', url: 'https://www.linkedin.com/company/rodriplast', label: 'LinkedIn' },
        { icon: 'bi-youtube', url: 'https://www.youtube.com/@rodriplast', label: 'YouTube' },
      ],
      columns: [
        {
          title: 'Navegación',
          links: [
            { label: 'Inicio', url: '/#inicio' },
            { label: 'Nosotros', url: '/nosotros' },
            { label: 'Productos', url: '/productos' },
            { label: 'Contacto', url: '/contacto' },
          ],
        }
      ],
      navLinks: [
        { label: 'Inicio', url: '/#inicio' },
        { label: 'Nosotros', url: '/nosotros' },
        { label: 'Productos', url: '/productos' },
        { label: 'Contacto', url: '/contacto' },
      ],
    },
  };

  // Define Blocks for Home page
  const homeBlocks = [
    sharedHeader,
    {
      type: 'hero',
      content: {
        variant: 'rodriplast',
        anchor: 'inicio',
        backgroundImage: 'https://placehold.co/1920x1080/0f172a/ffffff?text=Fondo+Rodriplast',
        kicker: 'MANGUERAS DEL FUTURO',
        title: 'Mangueras del futuro, <span class="bg-gradient-to-r from-rodri-primary-glow to-rodri-accent bg-clip-text text-transparent">hechas del plástico de ayer.</span>',
        subtitle: 'Fabricamos y distribuimos mangueras industriales, agrícolas y domésticas a partir de materiales 100% reciclados. Calidad certificada, compromiso real.',
        buttonText: 'Solicitar Cotización',
        buttonUrl: '#contacto',
        secondaryButtonText: 'Ver productos',
        secondaryButtonUrl: '/productos',
        slides: [
            { backgroundImage: 'https://placehold.co/1920x1080/0f172a/ffffff?text=Fondo+1' },
            { backgroundImage: 'https://placehold.co/1920x1080/0f172a/ffffff?text=Fondo+2' }
        ]
      },
    },
    {
      type: 'about',
      content: {
        variant: 'rodriplast',
        anchor: 'nosotros',
        kicker: 'Compromiso ambiental',
        title: 'Cada manguera es una declaración ambiental',
        description: 'En los últimos años hemos evitado que toneladas de plástico terminen en ríos, playas y rellenos sanitarios del Ecuador. Nuestro modelo demuestra que es posible unir industria, calidad y responsabilidad ambiental.',
        badgeTitle: 'ISO 9001',
        badgeSubtitle: 'Certificado',
        imageUrl: 'https://placehold.co/800x1000/0f172a/ffffff?text=Planta',
        features: [
          { text: 'Planta industrial certificada en Ecuador' },
          { text: 'Materias primas 100% de origen reciclado' },
          { text: 'Distribución nacional e internacional' },
          { text: 'Equipo técnico con más de 15 años de experiencia' },
        ],
      },
    },
    sharedStats,
    sharedPortfolio,
    sharedProcess,
    {
      type: 'gallery',
      content: {
        variant: 'rodriplast',
        anchor: 'galeria',
        kicker: 'Detrás de escena',
        title: 'Así nace <span class="text-gradient">cada manguera</span>',
        subtitle: 'Un recorrido por nuestra planta: de la fibra reciclada al producto final.',
        images: [
          { url: 'https://placehold.co/800x600/4fad33/ffffff?text=Foto+1', alt: 'Planta 1' },
          { url: 'https://placehold.co/800x600/3d8f29/ffffff?text=Foto+2', alt: 'Planta 2' },
          { url: 'https://placehold.co/800x600/84cc16/ffffff?text=Foto+3', alt: 'Planta 3' },
          { url: 'https://placehold.co/800x600/0f172a/ffffff?text=Foto+4', alt: 'Planta 4' },
          { url: 'https://placehold.co/800x600/65a30d/ffffff?text=Foto+5', alt: 'Planta 5' },
          { url: 'https://placehold.co/800x600/16a34a/ffffff?text=Foto+6', alt: 'Planta 6' },
        ],
      },
    },
    sharedBenefits,
    sharedTestimonials,
    sharedContact,
    sharedFooter,
  ];

  // Define Blocks for Nosotros page (distinct sections, reuses only some home blocks)
  const nosotrosBlocks = [
    sharedHeader,
    {
      type: 'hero',
      content: {
        variant: 'rodriplast',
        anchor: 'inicio',
        backgroundImage: 'https://placehold.co/1920x1080/0f172a/ffffff?text=Rodriplast',
        kicker: 'Nosotros',
        title: 'La industria ecuatoriana que <span class="bg-gradient-to-r from-rodri-primary-glow to-rodri-accent bg-clip-text text-transparent">convierte residuos en soluciones</span>',
        subtitle: 'Desde Guayaquil transformamos plástico reciclado en mangueras de alto rendimiento. Conoce nuestra historia, nuestros valores y las cifras que respaldan nuestro compromiso ambiental.',
        buttonText: 'Solicitar Cotización',
        buttonUrl: '#contacto',
        secondaryButtonText: 'Nuestros valores',
        secondaryButtonUrl: '#valores',
        slides: [
            { backgroundImage: 'https://placehold.co/1920x1080/0f172a/ffffff?text=Rodriplast' }
        ]
      },
    },
    {
      type: 'about',
      content: {
        variant: 'rodriplast',
        anchor: 'nosotros',
        kicker: 'Quiénes somos',
        title: 'Industria con propósito, <span class="text-gradient">calidad ecuatoriana</span>',
        description: 'Rodriplast nació en Guayaquil con una convicción clara: la industria puede ser parte de la solución ambiental. Recolectamos plástico reciclado y lo transformamos en mangueras industriales, agrícolas y domésticas con tecnología de extrusión de última generación y certificaciones internacionales.',
        badgeTitle: 'ISO 9001',
        badgeSubtitle: 'Calidad certificada',
        imageUrl: 'https://placehold.co/800x1000/0f172a/ffffff?text=Planta',
        features: [
          { text: 'Misión: transformar residuos plásticos en productos industriales de alto valor' },
          { text: 'Visión: ser referente en manufactura sostenible a nivel regional al 2030' },
          { text: 'Compromiso: operar con trazabilidad, ética y transparencia total' },
          { text: 'Impacto: mantener toneladas de plástico fuera de ríos, playas y rellenos' },
        ],
      },
    },
    {
      type: 'stats',
      content: {
        variant: 'rodriplast',
        items: [
          { icon: 'bi-calendar-check', value: '15', suffix: '+', label: 'Años de experiencia' },
          { icon: 'bi-box-seam', value: '120', suffix: ' Tn', label: 'Producción mensual' },
          { icon: 'bi-map', value: '24', suffix: '', label: 'Provincias atendidas' },
          { icon: 'bi-award', value: '98', suffix: '%', label: 'Clientes satisfechos' },
        ],
      },
    },
    {
      type: 'process',
      content: {
        variant: 'rodriplast',
        anchor: 'historia',
        kicker: 'Nuestra historia',
        title: 'Un camino de <span class="bg-gradient-to-r from-rodri-primary-glow to-rodri-accent bg-clip-text text-transparent">crecimiento con propósito</span>',
        items: [
          { icon: 'bi-flag', title: '2010 · Nuestros inicios', desc: 'Rodriplast nace en Guayaquil como un taller familiar de transformación de plásticos.' },
          { icon: 'bi-patch-check', title: '2015 · Calidad certificada', desc: 'Obtenemos la certificación ISO 9001 y automatizamos nuestra línea de extrusión.' },
          { icon: 'bi-geo-alt', title: '2020 · Expansión nacional', desc: 'Distribuimos a todo el país y creamos alianzas con centros de acopio locales.' },
          { icon: 'bi-rocket-takeoff', title: '2024 · Proyección internacional', desc: 'Iniciamos exportaciones a la región y superamos las 120 toneladas mensuales.' },
        ],
      },
    },
    {
      type: 'benefits',
      content: {
        variant: 'rodriplast',
        anchor: 'valores',
        kicker: 'Nuestros valores',
        title: 'Principios que guían <span class="text-gradient">nuestro trabajo</span>',
        items: [
          { icon: 'bi-globe-americas', title: 'Responsabilidad ambiental', desc: 'Cada decisión considera su impacto en el entorno y en las futuras generaciones.' },
          { icon: 'bi-lightbulb', title: 'Innovación constante', desc: 'Invertimos en tecnología y procesos que elevan la calidad y reducen desperdicios.' },
          { icon: 'bi-people', title: 'Compromiso social', desc: 'Trabajamos con centros de acopio y comunidades locales que viven del reciclaje.' },
          { icon: 'bi-shield-check', title: 'Excelencia', desc: 'Controles rigurosos y certificaciones internacionales en cada lote producido.' },
          { icon: 'bi-arrow-repeat', title: 'Economía circular', desc: 'Cerramos el ciclo: el plástico vuelve a la industria como producto de valor.' },
          { icon: 'bi-heart', title: 'Cercanía al cliente', desc: 'Acompañamos cada proyecto con asesoría técnica y soporte oportuno.' },
        ],
      },
    },
    sharedContact,
    sharedFooter,
  ];

  // Define Blocks for Contacto page
  const contactoBlocks = [
    sharedHeader,
    {
      type: 'hero',
      content: {
        variant: 'rodriplast',
        anchor: 'inicio',
        backgroundImage: 'https://placehold.co/1920x1080/0f172a/ffffff?text=Contacto',
        kicker: 'Contacto',
        title: 'Hablemos de tu <span class="bg-gradient-to-r from-rodri-primary-glow to-rodri-accent bg-clip-text text-transparent">próximo proyecto</span>',
        subtitle: 'Cuéntanos qué necesitas y nuestro equipo comercial te responderá en menos de 24 horas hábiles. Cotizamos mangueras industriales, agrícolas y domésticas a la medida de tu negocio.',
        buttonText: 'Enviar solicitud',
        buttonUrl: '#contacto',
        secondaryButtonText: 'Conoce nuestra historia',
        secondaryButtonUrl: '/nosotros#historia',
        slides: [
            { backgroundImage: 'https://placehold.co/1920x1080/0f172a/ffffff?text=Contacto' }
        ]
      },
    },
    {
      type: 'contact',
      content: {
        variant: 'rodriplast',
        anchor: 'contacto',
        kicker: 'Cotización',
        title: 'Solicita tu <span class="text-gradient">cotización</span>',
        subtitle: 'Completa el formulario y recibe atención personalizada. Sin compromiso.',
        buttonText: 'Enviar solicitud',
        address: 'Parque Industrial · Guayaquil, Ecuador',
        phone: '+593 4 000 0000',
        email: 'ventas@rodriplast.ec',
        mapUrl: 'https://www.openstreetmap.org/export/embed.html?bbox=-79.95%2C-2.20%2C-79.85%2C-2.10&layer=mapnik',
        fields: [
          { label: 'Nombre completo', type: 'text', name: 'nombre', required: true },
          { label: 'Empresa', type: 'text', name: 'empresa', required: false },
          { label: 'Correo electrónico', type: 'email', name: 'email', required: true },
          { label: 'Teléfono', type: 'tel', name: 'telefono', required: false },
          { label: 'Tipo de producto', type: 'text', name: 'producto', required: false },
          { label: 'Mensaje', type: 'textarea', name: 'mensaje', required: true },
        ],
      },
    },
    sharedFooter,
  ];

  // Define Blocks for Productos page
  const productosBlocks = [
    sharedHeader,
    {
      type: 'hero',
      content: {
        variant: 'rodriplast',
        anchor: 'inicio',
        backgroundImage: 'https://placehold.co/1920x1080/0f172a/ffffff?text=Productos',
        kicker: 'Productos',
        title: 'Mangueras para cada <span class="bg-gradient-to-r from-rodri-primary-glow to-rodri-accent bg-clip-text text-transparent">necesidad</span>',
        subtitle: 'Explora nuestra línea completa de mangueras fabricadas 100% con material reciclado. Calidad certificada para la industria, el campo y el hogar.',
        buttonText: 'Solicitar cotización',
        buttonUrl: '#contacto',
        secondaryButtonText: 'Conoce nuestra historia',
        secondaryButtonUrl: '/nosotros#historia',
        slides: [
            { backgroundImage: 'https://placehold.co/1920x1080/0f172a/ffffff?text=Productos' }
        ]
      },
    },
    {
      type: 'portfolio',
      content: {
        variant: 'rodriplast',
        anchor: 'productos',
        kicker: 'Catálogo',
        title: 'Nuestra línea completa de <span class="text-gradient">mangueras</span>',
        subtitle: 'Fabricamos cada manguera según especificaciones técnicas, longitudes y presiones de trabajo. Diseñadas en Ecuador para el mundo.',
        items: [
          { title: 'Mangueras agrícolas', desc: 'Riego eficiente y sistemas de goteo en cultivos de todo tamaño.', tag: 'Agrícola', icon: 'bi-crosshair', link: '/contacto', image: 'https://placehold.co/800x600/4fad33/ffffff?text=Agrícola' },
          { title: 'Mangueras industriales', desc: 'Alta resistencia para aplicaciones exigentes en fábricas y plantas.', tag: 'Industrial', icon: 'bi-sun', link: '/contacto', image: 'https://placehold.co/800x600/3d8f29/ffffff?text=Industrial' },
          { title: 'Mangueras domésticas', desc: 'Prácticas y duraderas para el hogar y jardines.', tag: 'Doméstico', icon: 'bi-house', link: '/contacto', image: 'https://placehold.co/800x600/84cc16/ffffff?text=Doméstico' },
          { title: 'Mangueras de alta presión', desc: 'Para aplicaciones hidráulicas y sistemas que exigen presión elevada.', tag: 'Alta presión', icon: 'bi-speedometer2', link: '/contacto', image: 'https://placehold.co/800x600/0f172a/ffffff?text=Alta+presión' },
          { title: 'Mangueras para jardín', desc: 'Flexibles, ligeras y resistentes a rayos UV para exteriores.', tag: 'Jardinería', icon: 'bi-flower1', link: '/contacto', image: 'https://placehold.co/800x600/65a30d/ffffff?text=Jardín' },
          { title: 'Mangueras alimentarias', desc: 'Seguridad certificada para uso en la industria de alimentos y bebidas.', tag: 'Alimentaria', icon: 'bi-cup-straw', link: '/contacto', image: 'https://placehold.co/800x600/16a34a/ffffff?text=Alimentaria' },
        ],
      },
    },
    sharedContact,
    sharedFooter,
  ];

  // Insert Blocks for a page (replace existing ones to keep the seed idempotent)
  const insertBlocks = async (pageId: string, blocksList: any[]) => {
    await prisma.templateBlock.deleteMany({ where: { templatePageId: pageId } });
    for (let i = 0; i < blocksList.length; i++) {
      const b = blocksList[i];
      await prisma.templateBlock.create({
        data: {
          templatePageId: pageId,
          type: b.type,
          content: b.content,
          sortOrder: i,
        },
      });
    }
  };

  await insertBlocks(homePage.id, homeBlocks);
  console.log(`✅ Se insertaron ${homeBlocks.length} bloques en "${homePage.name}".`);

  await insertBlocks(nosotrosPage.id, nosotrosBlocks);
  console.log(`✅ Se insertaron ${nosotrosBlocks.length} bloques en "${nosotrosPage.name}".`);

  await insertBlocks(contactoPage.id, contactoBlocks);
  console.log(`✅ Se insertaron ${contactoBlocks.length} bloques en "${contactoPage.name}".`);

  await insertBlocks(productosPage.id, productosBlocks);
  console.log(`✅ Se insertaron ${productosBlocks.length} bloques en "${productosPage.name}".`);

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
