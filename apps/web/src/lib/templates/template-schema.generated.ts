// ARCHIVO GENERADO desde packages/shared/src/templates — no editar aquí.
// Ejecuta `npm run sync:templates -w apps/web` tras cambiar la fuente.

// ARCHIVO GENERADO por scripts/extract-template-schema.js — no editar a mano.
// Campos de contenido y valores por defecto de cada plantilla y tipo de sección.

export interface TemplateFieldSchema {
  default?: unknown;
  list?: boolean;
  /** Nombre alternativo de otro campo (p. ej. description → desc): se oculta salvo que tenga valor. */
  aliasOf?: string;
  /** Campos de cada elemento (si es una lista). Pueden ser a su vez listas (submenús). */
  items?: Record<string, TemplateFieldSchema>;
}

export const TEMPLATE_SCHEMA: Record<string, Record<string, Record<string, TemplateFieldSchema>>> = {
  "prestige": {
    "header": {
      "logoType": {
        "default": "text"
      },
      "logoImage": {},
      "logoText": {
        "default": "PRESTIGE CORP"
      },
      "links": {
        "list": true,
        "default": [],
        "items": {
          "url": {},
          "label": {}
        }
      },
      "ctaText": {
        "default": "Consultoría"
      }
    },
    "hero": {
      "backgroundImage": {
        "default": ""
      },
      "kicker": {
        "default": "Consultoría Estratégica"
      },
      "title": {
        "default": ""
      },
      "subtitle": {
        "default": ""
      },
      "buttonText": {},
      "secondaryButtonText": {
        "default": "Nuestros Casos de Éxito"
      }
    },
    "services": {
      "title": {
        "default": ""
      },
      "subtitle": {
        "default": ""
      },
      "items": {
        "list": true,
        "default": [],
        "items": {
          "icon": {
            "default": "insights"
          },
          "title": {
            "default": ""
          },
          "description": {
            "aliasOf": "desc"
          },
          "desc": {
            "default": ""
          },
          "url": {
            "default": "#"
          }
        }
      },
      "linkText": {
        "default": "Conocer más"
      }
    },
    "about": {
      "kicker": {
        "default": "Nuestra Misión"
      },
      "title": {
        "default": ""
      },
      "description": {
        "default": ""
      },
      "imageUrl": {
        "default": ""
      }
    },
    "contact": {
      "title": {
        "default": ""
      },
      "subtitle": {
        "default": ""
      },
      "fields": {
        "list": true,
        "default": [],
        "items": {
          "label": {},
          "type": {
            "default": "text"
          },
          "name": {},
          "required": {}
        }
      },
      "buttonText": {
        "default": "Enviar"
      }
    },
    "footer": {
      "companyName": {
        "default": "PRESTIGE CORP"
      },
      "copyright": {
        "default": ""
      },
      "columns": {},
      "reviewLinkText": {
        "default": "Dejar una reseña"
      }
    }
  },
  "art-culinaire": {
    "header": {
      "logoType": {
        "default": "text"
      },
      "logoImage": {},
      "logoText": {
        "default": "L'ART CULINAIRE"
      },
      "links": {
        "list": true,
        "default": [],
        "items": {
          "url": {},
          "label": {}
        }
      },
      "buttonText": {
        "default": "Reservations"
      }
    },
    "hero": {
      "backgroundImage": {
        "default": ""
      },
      "title": {
        "default": "L'Art de Vivre"
      },
      "subtitle": {
        "default": ""
      },
      "buttonText": {
        "default": "Book a Table"
      }
    },
    "about": {
      "title": {
        "default": "Craftsmanship & Terroir"
      },
      "description1": {
        "default": ""
      },
      "description2": {
        "default": ""
      },
      "linkText": {
        "default": "Discover our story"
      },
      "imageUrl": {
        "default": ""
      }
    },
    "services": {
      "title": {
        "default": "La Carte"
      },
      "categories": {
        "list": true,
        "default": [],
        "items": {
          "title": {},
          "items": {
            "list": true,
            "default": [],
            "items": {
              "title": {},
              "description": {},
              "price": {}
            }
          }
        }
      }
    },
    "location": {
      "title": {
        "default": "Ubicación"
      },
      "name": {
        "default": "L'Art Culinaire"
      },
      "address": {
        "default": ""
      },
      "hoursTitle": {
        "default": "Hours"
      },
      "hours": {
        "default": ""
      }
    },
    "form": {
      "title": {
        "default": "Formulario de Contacto"
      },
      "subtitle": {
        "default": ""
      },
      "fields": {
        "list": true,
        "default": [],
        "items": {
          "name": {},
          "label": {},
          "required": {},
          "type": {
            "default": "text"
          }
        }
      },
      "buttonText": {
        "default": "Send Inquiry"
      }
    },
    "contact": {
      "title": {
        "default": "Formulario de Contacto"
      },
      "subtitle": {
        "default": ""
      },
      "fields": {
        "list": true,
        "default": [],
        "items": {
          "name": {},
          "label": {},
          "required": {},
          "type": {
            "default": "text"
          }
        }
      },
      "buttonText": {
        "default": "Send Inquiry"
      }
    },
    "footer": {
      "companyName": {
        "default": "L'ART CULINAIRE"
      },
      "columns": {},
      "reviewLinkText": {
        "default": "Dejar una reseña"
      },
      "copyright": {
        "default": "© 2024 L'ART CULINAIRE. ALL RIGHTS RESERVED."
      }
    }
  },
  "rodriplast": {
    "header": {
      "links": {
        "list": true,
        "default": [
          {
            "label": "Inicio",
            "url": "#inicio"
          },
          {
            "label": "Nosotros",
            "url": "#nosotros"
          },
          {
            "label": "Productos",
            "url": "#productos"
          },
          {
            "label": "Testimonios",
            "url": "#clientes"
          },
          {
            "label": "Contacto",
            "url": "#contacto"
          }
        ],
        "items": {
          "label": {
            "default": "Inicio"
          },
          "url": {
            "default": "#inicio"
          }
        }
      },
      "ctaText": {
        "default": "Solicitar cotización"
      },
      "ctaUrl": {
        "default": "#contacto"
      },
      "logoImage": {
        "default": "https://placehold.co/200x80/ffffff/0f172a?text=Logo"
      },
      "logoScrolled": {
        "default": ""
      },
      "logoText": {
        "default": "Rodriplast"
      }
    },
    "hero": {
      "slides": {
        "list": true,
        "items": {
          "url": {
            "aliasOf": "backgroundImage"
          },
          "backgroundImage": {}
        }
      },
      "backgroundImage": {
        "default": "https://placehold.co/1920x1080/0f172a/ffffff"
      },
      "kicker": {
        "default": "Fabricado en Ecuador · 100% reciclado"
      },
      "title": {
        "default": "Mangueras del futuro, <span class=\"bg-gradient-to-r from-rodri-primary-glow to-rodri-accent bg-clip-text text-transparent\">hechas del plástico de ayer.</span>"
      },
      "subtitle": {
        "default": "Fabricamos y distribuimos mangueras industriales, agrícolas y domésticas a partir de materiales 100% reciclados. Calidad certificada, compromiso real."
      },
      "buttonUrl": {
        "default": "#contacto"
      },
      "buttonText": {
        "default": "Solicitar cotización"
      },
      "secondaryButtonText": {},
      "secondaryButtonUrl": {
        "default": "#contacto"
      },
      "scrollText": {
        "default": "Descubre más"
      }
    },
    "about": {
      "imageUrl": {
        "default": "https://placehold.co/800x1000/4fad33/ffffff"
      },
      "badgeTitle": {
        "default": "Compromiso ambiental"
      },
      "badgeSubtitle": {
        "default": ""
      },
      "kicker": {
        "default": "Nosotros"
      },
      "title": {
        "default": "Una industria ecuatoriana que <span class=\"text-gradient\">transforma residuos en soluciones</span>."
      },
      "description": {
        "default": "En Rodriplast creemos que la industria puede ser motor de cambio ambiental. Recolectamos, procesamos y transformamos plástico reciclado en mangueras de alto rendimiento para los sectores agrícola, doméstico e industrial del país."
      },
      "features": {
        "list": true,
        "default": [
          "Planta industrial certificada en Ecuador",
          "Materias primas 100% de origen reciclado",
          "Distribución nacional e internacional",
          "Equipo técnico con más de 15 años de experiencia"
        ],
        "items": {
          "title": {
            "aliasOf": "text"
          },
          "text": {
            "default": ""
          }
        }
      },
      "buttonText": {},
      "linkText": {},
      "linkUrl": {
        "aliasOf": "buttonUrl"
      },
      "buttonUrl": {
        "default": "#contacto"
      }
    },
    "stats": {
      "items": {
        "list": true,
        "default": [
          {
            "value": "15",
            "label": "Años de experiencia",
            "suffix": "+"
          },
          {
            "value": "2500",
            "label": "Plástico reciclado al año",
            "suffix": " Tn"
          },
          {
            "value": "480",
            "label": "Clientes activos",
            "suffix": "+"
          },
          {
            "value": "98",
            "label": "Índice de satisfacción",
            "suffix": "%"
          }
        ],
        "items": {
          "value": {
            "default": "15"
          },
          "label": {
            "default": "Años de experiencia"
          },
          "suffix": {
            "default": "+"
          },
          "icon": {
            "default": "bi-star"
          },
          "desc": {
            "aliasOf": "label"
          }
        }
      }
    },
    "services": {
      "kicker": {
        "default": "Productos"
      },
      "title": {
        "default": "Soluciones que se adaptan a <span class=\"text-gradient\">cada industria</span>"
      },
      "subtitle": {},
      "items": {
        "list": true,
        "default": [
          {
            "image": "https://placehold.co/800x600/4fad33/ffffff",
            "tag": "Agrícola",
            "title": "Mangueras agrícolas",
            "icon": "bi-crosshair",
            "desc": "Para riego eficiente y sistemas de goteo en cultivos de todo tamaño."
          },
          {
            "image": "https://placehold.co/800x600/3d8f29/ffffff",
            "tag": "Industrial",
            "title": "Mangueras industriales",
            "icon": "bi-sun",
            "desc": "Alta resistencia para aplicaciones exigentes en fábricas y plantas."
          }
        ],
        "items": {
          "image": {
            "default": "https://placehold.co/800x600/4fad33/ffffff"
          },
          "tag": {
            "default": "Agrícola"
          },
          "title": {
            "default": "Mangueras agrícolas"
          },
          "icon": {
            "default": "bi-crosshair"
          },
          "desc": {
            "default": "Para riego eficiente y sistemas de goteo en cultivos de todo tamaño."
          },
          "link": {
            "default": "#contacto"
          }
        }
      }
    },
    "portfolio": {
      "kicker": {
        "default": "Productos"
      },
      "title": {
        "default": "Soluciones que se adaptan a <span class=\"text-gradient\">cada industria</span>"
      },
      "subtitle": {},
      "items": {
        "list": true,
        "default": [
          {
            "image": "https://placehold.co/800x600/4fad33/ffffff",
            "tag": "Agrícola",
            "title": "Mangueras agrícolas",
            "icon": "bi-crosshair",
            "desc": "Para riego eficiente y sistemas de goteo en cultivos de todo tamaño."
          },
          {
            "image": "https://placehold.co/800x600/3d8f29/ffffff",
            "tag": "Industrial",
            "title": "Mangueras industriales",
            "icon": "bi-sun",
            "desc": "Alta resistencia para aplicaciones exigentes en fábricas y plantas."
          }
        ],
        "items": {
          "image": {
            "default": "https://placehold.co/800x600/4fad33/ffffff"
          },
          "tag": {
            "default": "Agrícola"
          },
          "title": {
            "default": "Mangueras agrícolas"
          },
          "icon": {
            "default": "bi-crosshair"
          },
          "desc": {
            "default": "Para riego eficiente y sistemas de goteo en cultivos de todo tamaño."
          },
          "link": {
            "default": "#contacto"
          }
        }
      }
    },
    "process": {
      "backgroundImage": {},
      "kicker": {
        "default": "Proceso"
      },
      "title": {
        "default": "De residuo a manguera: <span class=\"bg-gradient-to-r from-rodri-primary-glow to-rodri-accent bg-clip-text text-transparent\">cuatro pasos con propósito</span>"
      },
      "items": {
        "list": true,
        "default": [
          {
            "icon": "bi-arrow-repeat",
            "title": "Recolección",
            "desc": "Recuperamos plásticos reciclables de industrias y centros de acopio del país."
          },
          {
            "icon": "bi-gear",
            "title": "Procesamiento",
            "desc": "Lavado, triturado y peletizado bajo estrictos controles de calidad."
          },
          {
            "icon": "bi-shield-check",
            "title": "Fabricación",
            "desc": "Extrusión de precisión con maquinaria de última generación."
          },
          {
            "icon": "bi-people",
            "title": "Distribución",
            "desc": "Logística nacional e internacional con trazabilidad completa."
          }
        ],
        "items": {
          "icon": {
            "default": "bi-arrow-repeat"
          },
          "title": {
            "default": "Recolección"
          },
          "desc": {
            "default": "Recuperamos plásticos reciclables de industrias y centros de acopio del país."
          }
        }
      }
    },
    "features": {
      "backgroundImage": {},
      "kicker": {
        "default": "Proceso"
      },
      "title": {
        "default": "De residuo a manguera: <span class=\"bg-gradient-to-r from-rodri-primary-glow to-rodri-accent bg-clip-text text-transparent\">cuatro pasos con propósito</span>"
      },
      "items": {
        "list": true,
        "default": [
          {
            "icon": "bi-arrow-repeat",
            "title": "Recolección",
            "desc": "Recuperamos plásticos reciclables de industrias y centros de acopio del país."
          },
          {
            "icon": "bi-gear",
            "title": "Procesamiento",
            "desc": "Lavado, triturado y peletizado bajo estrictos controles de calidad."
          },
          {
            "icon": "bi-shield-check",
            "title": "Fabricación",
            "desc": "Extrusión de precisión con maquinaria de última generación."
          },
          {
            "icon": "bi-people",
            "title": "Distribución",
            "desc": "Logística nacional e internacional con trazabilidad completa."
          }
        ],
        "items": {
          "icon": {
            "default": "bi-arrow-repeat"
          },
          "title": {
            "default": "Recolección"
          },
          "desc": {
            "default": "Recuperamos plásticos reciclables de industrias y centros de acopio del país."
          }
        }
      }
    },
    "benefits": {
      "kicker": {
        "default": "Beneficios"
      },
      "title": {
        "default": "Ventajas que marcan la <span class=\"text-gradient\">diferencia</span>"
      },
      "items": {
        "list": true,
        "default": [
          {
            "icon": "bi-shield-check",
            "title": "Máxima durabilidad",
            "desc": "Resistencia a rayos UV, presión y temperaturas extremas."
          },
          {
            "icon": "bi-flower1",
            "title": "100% ecológicas",
            "desc": "Fabricadas exclusivamente con material reciclado certificado."
          },
          {
            "icon": "bi-gear",
            "title": "Alto rendimiento",
            "desc": "Diseñadas para exigencias industriales y agrícolas modernas."
          },
          {
            "icon": "bi-crosshair",
            "title": "Precio competitivo",
            "desc": "Mayor eficiencia productiva se traduce en mejor precio para ti."
          },
          {
            "icon": "bi-clock",
            "title": "Calidad certificada",
            "desc": "Cumplimos normas internacionales ISO y controles nacionales."
          },
          {
            "icon": "bi-geo-alt",
            "title": "Entrega oportuna",
            "desc": "Logística confiable a nivel nacional e internacional."
          }
        ],
        "items": {
          "icon": {
            "default": "bi-shield-check"
          },
          "title": {
            "default": "Máxima durabilidad"
          },
          "desc": {
            "default": "Resistencia a rayos UV, presión y temperaturas extremas."
          }
        }
      }
    },
    "testimonials": {
      "kicker": {
        "default": "Testimonios"
      },
      "title": {
        "default": "Lo que dicen nuestros <span class=\"text-gradient\">clientes</span>"
      },
      "items": {
        "list": true,
        "default": [
          {
            "name": "María Fernanda C.",
            "role": "Gerente de Operaciones",
            "quote": "El cambio a mangueras Rodriplast nos permitió reducir costos operativos y reforzar nuestra política ambiental. Producto confiable y equipo atento."
          },
          {
            "name": "Luis Ramírez",
            "role": "Jefe Técnico",
            "quote": "Excelente durabilidad en condiciones exigentes de campo. Llevamos tres años trabajando con ellos y la calidad es constante."
          },
          {
            "name": "Carla Mendoza",
            "role": "Compras",
            "quote": "Cumplen los plazos, la documentación técnica es impecable y el soporte postventa marca la diferencia. Muy recomendados."
          }
        ],
        "items": {
          "name": {
            "default": "María Fernanda C."
          },
          "role": {
            "default": "Gerente de Operaciones"
          },
          "quote": {
            "default": "El cambio a mangueras Rodriplast nos permitió reducir costos operativos y reforzar nuestra política ambiental. Producto confiable y equipo atento."
          },
          "description": {
            "aliasOf": "quote"
          }
        }
      }
    },
    "contact": {
      "kicker": {
        "default": "Contacto"
      },
      "title": {
        "default": "Solicita tu <span class=\"text-gradient\">cotización</span>"
      },
      "subtitle": {},
      "fields": {
        "list": true,
        "default": [
          {
            "label": "Nombre completo",
            "name": "nombre",
            "type": "text",
            "required": true
          },
          {
            "label": "Empresa",
            "name": "empresa",
            "type": "text",
            "required": false
          },
          {
            "label": "Correo electrónico",
            "name": "email",
            "type": "email",
            "required": true
          },
          {
            "label": "Teléfono",
            "name": "telefono",
            "type": "tel",
            "required": false
          }
        ],
        "items": {
          "label": {
            "default": "Nombre completo"
          },
          "name": {
            "default": "nombre"
          },
          "type": {
            "default": "text"
          },
          "required": {
            "default": true
          },
          "placeholder": {
            "default": ""
          },
          "value": {
            "default": ""
          }
        }
      },
      "productLabel": {
        "default": "Tipo de producto"
      },
      "messageLabel": {
        "default": "Mensaje"
      },
      "buttonText": {
        "default": "Enviar solicitud"
      },
      "addressLabel": {
        "default": "Dirección"
      },
      "address": {
        "default": "Parque Industrial · Guayaquil, Ecuador"
      },
      "phoneLabel": {
        "default": "Teléfono"
      },
      "phone": {
        "default": "+593 4 000 0000"
      },
      "emailLabel": {
        "default": "Correo"
      },
      "email": {
        "default": "ventas@rodriplast.com"
      },
      "mapUrl": {}
    },
    "gallery": {
      "kicker": {
        "default": "Detrás de escena"
      },
      "title": {
        "default": "Así nace <span class=\"text-gradient\">cada manguera</span>"
      },
      "subtitle": {},
      "images": {
        "list": true,
        "default": [
          {
            "url": "https://placehold.co/800x600/4fad33/ffffff?text=Foto+1"
          },
          {
            "url": "https://placehold.co/800x600/3d8f29/ffffff?text=Foto+2"
          },
          {
            "url": "https://placehold.co/800x600/84cc16/ffffff?text=Foto+3"
          },
          {
            "url": "https://placehold.co/800x600/0f172a/ffffff?text=Foto+4"
          },
          {
            "url": "https://placehold.co/800x600/65a30d/ffffff?text=Foto+5"
          },
          {
            "url": "https://placehold.co/800x600/16a34a/ffffff?text=Foto+6"
          }
        ],
        "items": {
          "url": {
            "default": "https://placehold.co/800x600/4fad33/ffffff?text=Foto+1"
          },
          "src": {
            "aliasOf": "url"
          },
          "alt": {
            "default": "Galería"
          }
        }
      }
    },
    "footer": {
      "companyName": {
        "default": "Rodriplast"
      },
      "logoImage": {
        "default": "https://placehold.co/200x80/ffffff/0f172a?text=Logo"
      },
      "address": {
        "default": "Parque Industrial · Guayaquil, Ecuador"
      },
      "phone": {
        "default": "+593 4 000 0000"
      },
      "email": {
        "default": "ventas@rodriplast.com"
      },
      "columns": {
        "list": true,
        "default": [
          {
            "title": "Navegación",
            "links": [
              {
                "label": "Inicio",
                "url": "#inicio"
              },
              {
                "label": "Nosotros",
                "url": "#nosotros"
              },
              {
                "label": "Proceso",
                "url": "#proceso"
              },
              {
                "label": "Productos",
                "url": "#productos"
              }
            ]
          }
        ],
        "items": {
          "title": {
            "default": "Navegación"
          },
          "links": {
            "default": [
              {
                "label": "Inicio",
                "url": "#inicio"
              },
              {
                "label": "Nosotros",
                "url": "#nosotros"
              },
              {
                "label": "Proceso",
                "url": "#proceso"
              },
              {
                "label": "Productos",
                "url": "#productos"
              }
            ]
          }
        }
      },
      "navLinks": {
        "list": true,
        "items": {
          "url": {
            "default": "#"
          },
          "label": {}
        }
      },
      "social": {
        "list": true,
        "default": [
          {
            "icon": "bi-facebook",
            "url": "#",
            "label": "Facebook"
          },
          {
            "icon": "bi-instagram",
            "url": "#",
            "label": "Instagram"
          },
          {
            "icon": "bi-linkedin",
            "url": "#",
            "label": "LinkedIn"
          },
          {
            "icon": "bi-youtube",
            "url": "#",
            "label": "YouTube"
          }
        ],
        "items": {
          "icon": {
            "default": "bi-facebook"
          },
          "url": {
            "default": "#"
          },
          "label": {
            "default": "Facebook"
          }
        }
      },
      "copyright": {},
      "floatingImage": {},
      "floatingImageAlt": {
        "default": ""
      },
      "description": {
        "default": "Fabricantes ecuatorianos de mangueras elaboradas 100% con materiales reciclados. Calidad, innovación y compromiso ambiental."
      },
      "contactTitle": {
        "default": "Contacto"
      },
      "schedule": {
        "default": "Lun – Vie · 8:00 – 17:00"
      },
      "privacyText": {
        "default": "Política de privacidad"
      },
      "termsText": {
        "default": "Términos y condiciones"
      },
      "reviewLinkText": {
        "default": "Dejar una reseña"
      }
    }
  },
  "indigo": {
    "header": {
      "links": {
        "list": true,
        "default": [
          {
            "label": "Agencia",
            "url": "#agencia"
          },
          {
            "label": "Letras 3D",
            "url": "#letras3d"
          },
          {
            "label": "Branding",
            "url": "#branding"
          },
          {
            "label": "Portafolio",
            "url": "#portafolio"
          },
          {
            "label": "Contacto",
            "url": "#contacto"
          }
        ],
        "items": {
          "label": {
            "default": "Agencia"
          },
          "url": {
            "default": "#agencia"
          },
          "active": {}
        }
      },
      "navLinks": {
        "aliasOf": "links"
      },
      "logoImage": {
        "default": "https://placehold.co/200x60/050505/fdcb0c?text=INDIGO"
      },
      "navbarStyle": {},
      "logoUrl": {},
      "companyName": {
        "default": "Indigo Publicidad"
      }
    },
    "page-hero": {
      "title": {
        "default": "NUESTRA <span style='color:#fdcb0c'>AGENCIA</span>"
      },
      "description": {
        "default": "Llevamos más de una década transformando ideas locas en marcas sólidas. Indigo no es una agencia, es tu brazo creativo."
      },
      "background": {},
      "marqueeOpacity": {},
      "marqueeText": {
        "default": "HABLEMOS"
      },
      "marqueeSize": {
        "default": "18rem"
      },
      "titleShadow": {}
    },
    "hero": {
      "title": {
        "default": "Publicidad"
      },
      "subtitle": {
        "default": "Creativa."
      },
      "description": {
        "default": "Rompemos las reglas del diseño. Transformamos marcas convencionales en experiencias visuales inolvidables con letras 3D y estrategias de branding disruptivas."
      },
      "backgroundImage": {
        "default": ""
      },
      "buttonText": {},
      "buttonUrl": {
        "default": "#contacto"
      },
      "scrollText": {
        "default": "Scroll para descubrir"
      }
    },
    "marquee": {
      "words": {
        "list": true,
        "default": [
          "INDIGO PUBLICIDAD",
          "LETRAS 3D",
          "BRANDING",
          "DISEÑO DISRUPTIVO"
        ]
      },
      "marqueeWords": {
        "aliasOf": "words"
      }
    },
    "about": {
      "title": {
        "default": "NUESTRA <span style='color:#fdcb0c'>VISIÓN</span>"
      },
      "description": {
        "default": "No somos una agencia tradicional. Somos un laboratorio de ideas donde el diseño se encuentra con la rebeldía. Creemos que lo normal es aburrido y nos especializamos en hacer que las marcas resalten en la jungla de asfalto y en el entorno digital."
      },
      "imageUrl": {
        "default": "https://placehold.co/800x500/fdcb0c/050505?text=AGENCIA"
      },
      "stats": {
        "list": true,
        "default": [
          {
            "value": "10+",
            "label": "Años de exp."
          },
          {
            "value": "500",
            "label": "Proyectos"
          }
        ],
        "items": {
          "value": {
            "default": "10+"
          },
          "label": {
            "default": "Años de exp."
          },
          "title": {
            "aliasOf": "value"
          },
          "desc": {
            "aliasOf": "label"
          }
        }
      },
      "items": {
        "aliasOf": "stats"
      },
      "imageStyle": {},
      "features": {
        "list": true,
        "default": [],
        "items": {
          "name": {
            "aliasOf": "label"
          },
          "label": {}
        }
      },
      "reverse": {}
    },
    "agency": {
      "title": {
        "default": "NUESTRA <span style='color:#fdcb0c'>VISIÓN</span>"
      },
      "description": {
        "default": "No somos una agencia tradicional. Somos un laboratorio de ideas donde el diseño se encuentra con la rebeldía. Creemos que lo normal es aburrido y nos especializamos en hacer que las marcas resalten en la jungla de asfalto y en el entorno digital."
      },
      "imageUrl": {
        "default": "https://placehold.co/800x500/fdcb0c/050505?text=AGENCIA"
      },
      "stats": {
        "list": true,
        "default": [
          {
            "value": "10+",
            "label": "Años de exp."
          },
          {
            "value": "500",
            "label": "Proyectos"
          }
        ],
        "items": {
          "value": {
            "default": "10+"
          },
          "label": {
            "default": "Años de exp."
          },
          "title": {
            "aliasOf": "value"
          },
          "desc": {
            "aliasOf": "label"
          }
        }
      },
      "items": {
        "aliasOf": "stats"
      },
      "imageStyle": {},
      "features": {
        "list": true,
        "default": [],
        "items": {
          "name": {
            "aliasOf": "label"
          },
          "label": {}
        }
      },
      "reverse": {}
    },
    "features": {
      "layout": {},
      "title": {
        "default": "NUESTRA <span style='color:#fdcb0c'>FILOSOFÍA</span>"
      },
      "subtitle": {
        "default": "El diseño no solo debe verse bien, debe funcionar, impactar y quedarse en la memoria."
      },
      "items": {
        "list": true,
        "default": [
          {
            "number": "01",
            "title": "Disrupción",
            "desc": "No seguimos tendencias, las creamos. Buscamos siempre el ángulo inesperado para que tu marca se desmarque de la competencia."
          },
          {
            "number": "02",
            "title": "Calidad",
            "desc": "Materiales premium y acabados meticulosos. Desde un logotipo vectorial hasta un letrero monumental en acero, la excelencia no es negociable."
          },
          {
            "number": "03",
            "title": "Compromiso",
            "desc": "Tu éxito es nuestro éxito. Nos involucramos en cada proyecto como si fuera nuestra propia marca, de principio a fin."
          }
        ],
        "items": {
          "number": {
            "default": "01"
          },
          "title": {
            "default": "Disrupción"
          },
          "desc": {
            "default": "No seguimos tendencias, las creamos. Buscamos siempre el ángulo inesperado para que tu marca se desmarque de la competencia."
          },
          "name": {
            "aliasOf": "title"
          },
          "description": {
            "aliasOf": "desc"
          }
        }
      },
      "kicker": {
        "default": "01"
      },
      "description": {
        "default": "Dale volumen a tu identidad. Fabricamos letreros en 3D que capturan miradas y dominan el espacio. Materiales de primera, acabados surrealistas e iluminación impactante para que tu marca nunca pase desapercibida."
      },
      "imageUrl": {
        "default": "https://placehold.co/800x600/fdcb0c/050505?text=LETRAS+3D"
      },
      "features": {
        "list": true,
        "default": [
          "Acero inoxidable y acrílico.",
          "Iluminación LED Neon de alto brillo.",
          "Instalación profesional interior y exterior."
        ]
      },
      "bullets": {
        "aliasOf": "features"
      },
      "buttonText": {
        "default": "Cotizar Letras 3D"
      },
      "buttonUrl": {
        "default": "#contacto"
      }
    },
    "services": {
      "layout": {},
      "title": {
        "default": "NUESTRA <span style='color:#fdcb0c'>FILOSOFÍA</span>"
      },
      "subtitle": {
        "default": "El diseño no solo debe verse bien, debe funcionar, impactar y quedarse en la memoria."
      },
      "items": {
        "list": true,
        "default": [
          {
            "number": "01",
            "title": "Disrupción",
            "desc": "No seguimos tendencias, las creamos. Buscamos siempre el ángulo inesperado para que tu marca se desmarque de la competencia."
          },
          {
            "number": "02",
            "title": "Calidad",
            "desc": "Materiales premium y acabados meticulosos. Desde un logotipo vectorial hasta un letrero monumental en acero, la excelencia no es negociable."
          },
          {
            "number": "03",
            "title": "Compromiso",
            "desc": "Tu éxito es nuestro éxito. Nos involucramos en cada proyecto como si fuera nuestra propia marca, de principio a fin."
          }
        ],
        "items": {
          "number": {
            "default": "01"
          },
          "title": {
            "default": "Disrupción"
          },
          "desc": {
            "default": "No seguimos tendencias, las creamos. Buscamos siempre el ángulo inesperado para que tu marca se desmarque de la competencia."
          },
          "name": {
            "aliasOf": "title"
          },
          "description": {
            "aliasOf": "desc"
          }
        }
      },
      "kicker": {
        "default": "01"
      },
      "description": {
        "default": "Dale volumen a tu identidad. Fabricamos letreros en 3D que capturan miradas y dominan el espacio. Materiales de primera, acabados surrealistas e iluminación impactante para que tu marca nunca pase desapercibida."
      },
      "imageUrl": {
        "default": "https://placehold.co/800x600/fdcb0c/050505?text=LETRAS+3D"
      },
      "features": {
        "list": true,
        "default": [
          "Acero inoxidable y acrílico.",
          "Iluminación LED Neon de alto brillo.",
          "Instalación profesional interior y exterior."
        ]
      },
      "bullets": {
        "aliasOf": "features"
      },
      "buttonText": {
        "default": "Cotizar Letras 3D"
      },
      "buttonUrl": {
        "default": "#contacto"
      }
    },
    "portfolio": {
      "title": {
        "default": "NUESTRO <span style='-webkit-text-stroke:1px #050505;color:transparent'>TRABAJO</span>"
      },
      "description": {
        "default": "Una selección de nuestros proyectos más audaces. Casos de éxito donde la creatividad no tuvo límites."
      },
      "image": {
        "aliasOf": "imageUrl"
      },
      "imageUrl": {
        "default": "https://placehold.co/1200x600/fdcb0c/050505?text=PORTAFOLIO"
      },
      "linkUrl": {},
      "exploreText": {
        "default": "Explorar<br>Galería"
      }
    },
    "testimonials": {
      "title": {
        "default": "LO QUE <span style='color:#fdcb0c'>DICEN</span>"
      },
      "items": {
        "list": true,
        "default": [
          {
            "quote": "Indigo transformó nuestra fachada por completo. Las letras 3D le dieron una presencia corporativa brutal que atrajo muchas más miradas.",
            "name": "Carlos M.",
            "role": "TechCorp"
          },
          {
            "quote": "Rompieron los esquemas con nuestro branding. Entendieron que queríamos algo disruptivo y superaron las expectativas. ¡Increíble trabajo!",
            "name": "Laura S.",
            "role": "Urban Studio"
          },
          {
            "quote": "Buscábamos salir de lo común y encontramos al socio ideal. El rediseño de identidad nos posicionó como líderes creativos en el sector.",
            "name": "Diego R.",
            "role": "Krypton Labs"
          }
        ],
        "items": {
          "quote": {
            "default": "Indigo transformó nuestra fachada por completo. Las letras 3D le dieron una presencia corporativa brutal que atrajo muchas más miradas."
          },
          "name": {
            "default": "Carlos M."
          },
          "role": {
            "default": "TechCorp"
          },
          "description": {
            "aliasOf": "quote"
          },
          "image": {}
        }
      }
    },
    "awareness": {
      "title": {
        "default": "¿Estás compitiendo solo por <span style=\"color:#fdcb0c\">precio?</span>"
      },
      "description": {
        "default": "Cuando tu marca se ve igual a todas las demás en tu industria, el cliente no encuentra una razón para elegirte a ti, excepto si eres más barato. Un branding débil te hace invisible y reemplazable."
      },
      "highlight": {
        "default": "Es momento de subir el nivel."
      },
      "highlightStyle": {}
    },
    "benefits": {
      "title": {
        "default": "EL PODER DEL <span style='color:#fdcb0c'>BRANDING</span>"
      },
      "items": {
        "list": true,
        "default": [
          {
            "number": "01",
            "title": "Autoridad Inmediata",
            "desc": "Un diseño profesional y cohesivo proyecta experiencia y tamaño. Las personas confían instintivamente en lo que se ve bien estructurado."
          },
          {
            "number": "02",
            "title": "Valor Percibido",
            "desc": "Una marca fuerte te permite salir de la guerra de precios. Cuando conectas a nivel visual y emocional, puedes cobrar lo que realmente vales."
          },
          {
            "number": "03",
            "title": "Lealtad del Cliente",
            "desc": "Las personas no solo compran productos, compran identidades con las que se alinean. Te ayudamos a crear una tribu alrededor de tu marca."
          }
        ],
        "items": {
          "number": {
            "default": "01"
          },
          "title": {
            "default": "Autoridad Inmediata"
          },
          "desc": {
            "default": "Un diseño profesional y cohesivo proyecta experiencia y tamaño. Las personas confían instintivamente en lo que se ve bien estructurado."
          },
          "name": {
            "aliasOf": "title"
          },
          "description": {
            "aliasOf": "desc"
          }
        }
      },
      "accent": {}
    },
    "portfolio-grid": {
      "title": {
        "default": "TU MARCA ES EL <br> PRÓXIMO CASO DE ÉXITO."
      },
      "ctaText": {
        "default": "EMPECEMOS AHORA"
      },
      "ctaUrl": {
        "default": "#contacto"
      },
      "projects": {
        "list": true,
        "default": [
          {
            "number": "01",
            "colSpan": "12",
            "type": "slide",
            "title": "Campaña Rebel",
            "sub": "Branding & Letras 3D",
            "img": "https://placehold.co/1600x900/fdcb0c/050505?text=PROYECTO+1",
            "url": "#",
            "imgHeight": "h-[500px] md:h-[700px]",
            "hover": "slide",
            "numberStyle": "brand"
          },
          {
            "number": "02",
            "colSpan": "7",
            "type": "overlay",
            "title": "Nexus Synthesis",
            "sub": "Identidad Visual",
            "img": "https://placehold.co/800x900/fdcb0c/050505?text=PROYECTO+2",
            "url": "#",
            "imgHeight": "h-[400px] md:h-[600px]",
            "hover": "overlay-brand",
            "numberStyle": "dark",
            "mt": "mt-12 md:mt-24"
          },
          {
            "number": "03",
            "colSpan": "5",
            "type": "overlay",
            "title": "Create Studio",
            "sub": "Letras 3D Neón",
            "img": "https://placehold.co/600x900/fdcb0c/050505?text=PROYECTO+3",
            "url": "#",
            "imgHeight": "h-[400px] md:h-[500px]",
            "hover": "overlay-dark",
            "numberStyle": "dark",
            "mt": "mt-12 md:mt-8"
          }
        ],
        "items": {
          "number": {
            "default": "01"
          },
          "colSpan": {
            "default": "12"
          },
          "type": {
            "default": "slide"
          },
          "title": {
            "default": "Campaña Rebel"
          },
          "sub": {
            "default": "Branding & Letras 3D"
          },
          "img": {
            "default": "https://placehold.co/1600x900/fdcb0c/050505?text=PROYECTO+1"
          },
          "url": {
            "default": "#"
          },
          "imgHeight": {
            "default": "h-[500px] md:h-[700px]"
          },
          "hover": {
            "default": "slide"
          },
          "numberStyle": {
            "default": "brand"
          },
          "mt": {
            "default": "mt-12 md:mt-24"
          }
        }
      },
      "items": {
        "aliasOf": "projects"
      },
      "shadow": {
        "default": true
      },
      "projectLinkText": {
        "default": "Ver Proyecto"
      }
    },
    "contact-section": {
      "title": {
        "default": "Información"
      },
      "email": {
        "default": "hola@indigopublicidad.com"
      },
      "emailLabel": {
        "default": "Email"
      },
      "phone": {
        "default": "+1 (555) 123-4567"
      },
      "phoneLabel": {
        "default": "Teléfono"
      },
      "address": {
        "default": "Distrito de Diseño 0987<br>Ciudad Creativa<br>CP 10010"
      },
      "addressLabel": {
        "default": "Estudio"
      },
      "formTitle": {
        "default": "Escríbenos"
      },
      "submitText": {
        "default": "ENVIAR MENSAJE"
      },
      "serviceOptions": {
        "list": true,
        "default": [
          "Letras 3D",
          "Branding Estratégico",
          "Diseño Corporativo",
          "Otro"
        ]
      },
      "serviceLabel": {
        "default": "Servicio de interés"
      },
      "nameLabel": {
        "default": "Nombre"
      },
      "namePlaceholder": {
        "default": "TU NOMBRE"
      },
      "emailFieldLabel": {
        "default": "Email"
      },
      "emailPlaceholder": {
        "default": "TU@EMAIL.COM"
      },
      "messageLabel": {
        "default": "Mensaje"
      },
      "messagePlaceholder": {
        "default": "CUÉNTANOS SOBRE TU PROYECTO..."
      }
    },
    "cta": {
      "style": {},
      "title": {
        "default": "DOMINA TU <span style='color:#fdcb0c'>MERCADO.</span>"
      },
      "description": {
        "default": "Deja de ser uno más del montón. Cuéntanos sobre tu negocio y diseñemos una identidad que nadie pueda ignorar."
      },
      "buttonText": {
        "default": "INICIAR REBRANDING"
      },
      "buttonUrl": {
        "default": "#contacto"
      },
      "kicker": {
        "default": "¿Listo para"
      },
      "email": {
        "default": "hola@indigopublicidad.com"
      },
      "phone": {
        "default": ""
      },
      "address": {
        "default": ""
      },
      "submitText": {
        "default": "ENVIAR"
      },
      "fields": {
        "list": true,
        "default": [
          {
            "label": "Nombre",
            "name": "nombre",
            "type": "text",
            "required": true
          },
          {
            "label": "Email",
            "name": "email",
            "type": "email",
            "required": true
          },
          {
            "label": "Mensaje",
            "name": "mensaje",
            "type": "textarea",
            "required": true
          }
        ],
        "items": {
          "label": {
            "default": "Nombre"
          },
          "name": {
            "default": "nombre"
          },
          "type": {
            "default": "text"
          },
          "required": {
            "default": true
          },
          "placeholder": {
            "default": ""
          },
          "value": {
            "default": ""
          }
        }
      },
      "messageLabel": {
        "default": "Mensaje"
      },
      "messagePlaceholder": {
        "default": "Cuéntanos tu proyecto..."
      }
    },
    "contact": {
      "style": {},
      "title": {
        "default": "DOMINA TU <span style='color:#fdcb0c'>MERCADO.</span>"
      },
      "description": {
        "default": "Deja de ser uno más del montón. Cuéntanos sobre tu negocio y diseñemos una identidad que nadie pueda ignorar."
      },
      "buttonText": {
        "default": "INICIAR REBRANDING"
      },
      "buttonUrl": {
        "default": "#contacto"
      },
      "kicker": {
        "default": "¿Listo para"
      },
      "email": {
        "default": "hola@indigopublicidad.com"
      },
      "phone": {
        "default": ""
      },
      "address": {
        "default": ""
      },
      "submitText": {
        "default": "ENVIAR"
      },
      "fields": {
        "list": true,
        "default": [
          {
            "label": "Nombre",
            "name": "nombre",
            "type": "text",
            "required": true
          },
          {
            "label": "Email",
            "name": "email",
            "type": "email",
            "required": true
          },
          {
            "label": "Mensaje",
            "name": "mensaje",
            "type": "textarea",
            "required": true
          }
        ],
        "items": {
          "label": {
            "default": "Nombre"
          },
          "name": {
            "default": "nombre"
          },
          "type": {
            "default": "text"
          },
          "required": {
            "default": true
          },
          "placeholder": {
            "default": ""
          },
          "value": {
            "default": ""
          }
        }
      },
      "messageLabel": {
        "default": "Mensaje"
      },
      "messagePlaceholder": {
        "default": "Cuéntanos tu proyecto..."
      }
    },
    "process": {
      "title": {
        "default": "NUESTRO <br><span style='-webkit-text-stroke:1px #fdcb0c;color:transparent'>PROCESO</span>"
      },
      "imageUrl": {
        "default": "https://placehold.co/800x600/fdcb0c/050505?text=PROCESO"
      },
      "items": {
        "list": true,
        "default": [
          {
            "number": "01",
            "title": "Descubrimiento",
            "desc": "Sumergirnos en el ADN de tu marca. Entender el mercado, la competencia y el objetivo final para trazar un plan de ataque."
          },
          {
            "number": "02",
            "title": "Concepto",
            "desc": "Lluvia de ideas sin filtros. Creamos propuestas abstractas que luego moldeamos hasta conseguir un diseño sólido y disruptivo."
          },
          {
            "number": "03",
            "title": "Ejecución",
            "desc": "Manos a la obra. Ya sea la fabricación de letras 3D o el desarrollo de una identidad, pulimos cada detalle a la perfección."
          }
        ],
        "items": {
          "number": {
            "default": "01"
          },
          "title": {
            "default": "Descubrimiento"
          },
          "desc": {
            "default": "Sumergirnos en el ADN de tu marca. Entender el mercado, la competencia y el objetivo final para trazar un plan de ataque."
          },
          "name": {
            "aliasOf": "title"
          },
          "description": {
            "aliasOf": "desc"
          }
        }
      }
    },
    "stats": {
      "items": {
        "list": true,
        "default": [
          {
            "value": "10+",
            "label": "Años de exp."
          },
          {
            "value": "500",
            "label": "Proyectos"
          },
          {
            "value": "50+",
            "label": "Clientes"
          },
          {
            "value": "99%",
            "label": "Satisfacción"
          }
        ],
        "items": {
          "value": {
            "default": "10+"
          },
          "label": {
            "default": "Años de exp."
          },
          "title": {
            "aliasOf": "value"
          },
          "desc": {
            "aliasOf": "label"
          }
        }
      },
      "style": {}
    },
    "gallery": {
      "title": {
        "default": "GALERÍA"
      },
      "images": {
        "list": true,
        "default": [
          {
            "url": "https://placehold.co/600x400/fdcb0c/050505?text=1"
          },
          {
            "url": "https://placehold.co/600x400/050505/fdcb0c?text=2"
          },
          {
            "url": "https://placehold.co/600x400/fdcb0c/050505?text=3"
          }
        ],
        "items": {
          "url": {
            "default": "https://placehold.co/600x400/fdcb0c/050505?text=1"
          },
          "src": {
            "aliasOf": "url"
          },
          "alt": {
            "default": "Galería"
          }
        }
      }
    },
    "footer": {
      "companyName": {
        "default": "Indigo Publicidad"
      },
      "logoImage": {
        "default": "https://placehold.co/200x60/050505/fdcb0c?text=INDIGO"
      },
      "links": {
        "list": true,
        "default": [
          {
            "label": "Nosotros",
            "url": "#agencia"
          },
          {
            "label": "Letras 3D & Neón",
            "url": "#letras3d"
          },
          {
            "label": "Branding Estratégico",
            "url": "#branding"
          },
          {
            "label": "Portafolio",
            "url": "#portafolio"
          }
        ],
        "items": {
          "label": {
            "default": "Nosotros"
          },
          "url": {
            "default": "#agencia"
          }
        }
      },
      "navLinks": {
        "aliasOf": "links"
      },
      "social": {
        "list": true,
        "default": [
          {
            "label": "Instagram",
            "url": "#"
          },
          {
            "label": "Behance",
            "url": "#"
          },
          {
            "label": "LinkedIn",
            "url": "#"
          }
        ],
        "items": {
          "label": {
            "default": "Instagram"
          },
          "url": {
            "default": "#"
          }
        }
      },
      "copyright": {},
      "email": {
        "default": "hola@indigopublicidad.com"
      },
      "phone": {
        "default": "+1 (555) 123-4567"
      },
      "address": {
        "default": "Ciudad Creativa, Distrito de Diseño 0987"
      },
      "footerText": {
        "default": "Laboratorio de ideas creativas. Rompemos moldes con Letras 3D y Branding disruptivo."
      },
      "col1Title": {
        "default": "Agencia"
      },
      "col2Title": {
        "default": "Estudio"
      },
      "col3Title": {
        "default": "Redes"
      },
      "privacyUrl": {
        "default": "#"
      },
      "privacyText": {
        "default": "Privacidad"
      },
      "termsUrl": {
        "default": "#"
      },
      "termsText": {
        "default": "Términos"
      },
      "reviewLinkText": {
        "default": "Dejar una reseña"
      },
      "bigText": {
        "default": "INDIGO AGENCY"
      }
    },
    "video": {
      "videoUrl": {},
      "imageUrl": {
        "aliasOf": "thumbnail"
      },
      "thumbnail": {
        "default": "https://placehold.co/1280x720/fdcb0c/050505?text=VIDEO"
      },
      "title": {
        "default": "Video"
      }
    },
    "image": {
      "background": {},
      "link": {},
      "imageUrl": {
        "default": "https://placehold.co/1200x600/fdcb0c/050505?text=IMAGEN"
      },
      "alt": {
        "aliasOf": "title"
      },
      "title": {
        "default": "Imagen"
      }
    },
    "form": {
      "kicker": {
        "default": "FORMULARIO"
      },
      "title": {
        "default": "Contáctanos"
      },
      "submitText": {
        "default": "ENVIAR"
      },
      "background": {},
      "fields": {
        "list": true,
        "default": [
          {
            "label": "Nombre",
            "name": "nombre",
            "type": "text",
            "required": true
          },
          {
            "label": "Email",
            "name": "email",
            "type": "email",
            "required": true
          },
          {
            "label": "Mensaje",
            "name": "mensaje",
            "type": "textarea",
            "required": true
          }
        ],
        "items": {
          "label": {
            "default": "Nombre"
          },
          "name": {
            "default": "nombre"
          },
          "type": {
            "default": "text"
          },
          "required": {
            "default": true
          },
          "placeholder": {
            "default": ""
          },
          "value": {
            "default": ""
          }
        }
      }
    },
    "whatsapp": {
      "phoneNumber": {
        "aliasOf": "phone"
      },
      "phone": {
        "default": ""
      },
      "message": {
        "default": "Hola, me interesa su servicio"
      }
    },
    "sorteo-form": {
      "kicker": {
        "default": "SORTEO"
      },
      "title": {
        "default": "Participa y gana"
      },
      "description": {}
    }
  },
  "dishora": {
    "header": {
      "links": {
        "list": true,
        "default": [],
        "items": {
          "label": {
            "default": "Home"
          },
          "url": {
            "default": "#"
          },
          "dropdown": {
            "default": true
          }
        }
      },
      "topLeft": {
        "default": "Mon-Wed: 11a-9p"
      },
      "topMiddle": {
        "default": "Thurs-Sat: 11a-10p"
      },
      "email": {
        "default": "reservations@disora.com"
      },
      "phone": {
        "default": "123 456 7899"
      },
      "address": {
        "default": "296 Ridao Avenie Mor Berlin 251584"
      },
      "logoUrl": {
        "default": "#"
      },
      "brand": {
        "default": "DISHORA"
      },
      "ctaUrl": {
        "default": "#reservation"
      },
      "ctaIcon": {
        "default": "calendar"
      },
      "ctaText": {
        "default": "Make a Reservation Online"
      }
    },
    "hero": {
      "backgroundImage": {
        "default": "https://images.unsplash.com/photo-1414235077428-338988a2e8c0?q=80&w=2940&auto=format&fit=crop"
      },
      "heroLeftTag": {
        "default": "SERVING CENTRAL FLORIDA"
      },
      "title": {
        "default": "FLAVOURS<br/>THAT STAY"
      },
      "heroRightTag": {
        "default": "ESTABLISHED 1996"
      },
      "subtitle": {
        "default": "Experience delicious cuisine crafted with fresh ingredients and authentic recipes. Enjoy a welcoming atmosphere."
      }
    },
    "hero-story": {
      "storyImgBack": {
        "default": "https://lh3.googleusercontent.com/aida-public/AB6AXuDD2v0O0947ybqAAR3SPYtOXNC5kjWvQj8t_XhCb6QEWUFRQkqQ6bDzv8I0xtjFvBdzqkvFBMxBJ2yK46E-geZysNo68ljzW9maK57Njgjks52r4WjxOf0HfGhKvL0QlMTYrp-zsP43Pc9vgMNalDnyQRcTWfJMltXkOBfHcd6QsiLKGOrxGXAp_QFZ50cNig1CfZBOvjjaqaGaUbCDpiuJt1TkGFLcU85estMlFa2gljRLU5n0WU02"
      },
      "storyImgFront": {
        "default": "https://lh3.googleusercontent.com/aida-public/AB6AXuC5EzMmXP1SC6cpD12qOujiBcR2O4V2lKPyJgNfocHshhdn9P-jktKUng1rT2VMjJw5V5UqdD8-YbnRn9aIAXxuKQhhgtBZM2-1-ktchL-qCLMfxCcdPjyMxhkZK62D7mS2ZKi9aHe9AV86xQYtlXYq76legbSw5mZ965qyGigUpox2a3Jl8N-8AXkdnYW4VpL_1iI3S2PecvDf5dQpgPHBxXQHtOE0Ng0dKuCP8glwTXefMEiHe2_w"
      },
      "chefsWords": {
        "default": "CHEF'S WORDS"
      },
      "storyTitle": {
        "default": "Restaurant History"
      },
      "storyP1": {
        "default": "Dinero is more than just fine dining—it's a celebration of craftsmanship, taste, &amp; timeless style. Since our inception, we've redefined luxury by delivering curated gastronomic experiences."
      },
      "storyP2": {
        "default": "The 25,000 or so visitors who descend on Spitalfields Market every week are greeted warmly by the artists."
      },
      "visitTitle": {
        "default": "Visit Us"
      },
      "visitLines": {
        "list": true,
        "default": [
          "PIAZZA DELLA SIGNORIA, 12",
          "21562 . FIRENZE . ITALY"
        ]
      },
      "hoursTitle": {
        "default": "Opening Hours"
      },
      "hoursLines": {
        "list": true,
        "default": [
          "MON – FRI : 7:00 AM – 22:00 PM",
          "SAT-SUN: 8:00 AM – 23:00 PM"
        ]
      },
      "followTitle": {
        "default": "Follow Us"
      },
      "featurePreviewImg": {
        "default": "https://lh3.googleusercontent.com/aida-public/AB6AXuDnZk8dyi8yyL0ngbYLqbWWVbQ8X7M7sNsew1niUs6M8ftzfpWFjsAFoARRz1EEEmfGD27PlhU1_Y63xJ0Aix3iFi045WTY7fAWrFcpbudW-Zh1jU5mk3G4fDRq4QsCdjw62sd74h4g2JJbgzAhDeN8rd41P8IYQKiKrOnGsxt1_wlayeUEFWm-OOBMfAH5ZYjIKtNAmRzICQHBE2sgUGc2wwK_SuP8obX1ByIwmre-OYjZEbev7hvG"
      }
    },
    "stats": {
      "stats": {
        "list": true,
        "default": [
          {
            "value": "180+",
            "label": "PROJECTS LAUNCHED"
          },
          {
            "value": "95%",
            "label": "CLIENT SATISFACTION"
          },
          {
            "value": "50+",
            "label": "WORKSHOPS HOSTED"
          },
          {
            "value": "12",
            "label": "AWARDS WON"
          }
        ],
        "items": {
          "value": {
            "default": "180+"
          },
          "label": {
            "default": "PROJECTS LAUNCHED"
          },
          "title": {
            "aliasOf": "value"
          },
          "desc": {
            "aliasOf": "label"
          }
        }
      }
    },
    "video-banner": {
      "videoUrl": {
        "default": ""
      },
      "videoBg": {
        "default": "https://lh3.googleusercontent.com/aida-public/AB6AXuAbBBd_nZgoQA-RmV2_Wba86yznp09I3ihn1Xc_DwVjJ-zJ_09oY1ci9Qhgsj5PghCtPXy-lm17yMxgYhCQqWeArc4SEUMBcZXeEBaVNj5ksMngQSJSWRGaTwR1Y2w4q81PVjNA_sTmk9_c4RaDvTGzkC3SrTvJ-MF_FK6PqoxrLqFsOa2BA4fIdiliXCArjs69-szAi4xG-Xy9LCu9BtzYoZvx7SoT6R2x6ZzwQAw4UVcqP9yFj0R7ZdhlC5YsEVYAwQ"
      }
    },
    "features": {
      "featuresEyebrow": {
        "default": "FEATURES"
      },
      "featuresTitle": {
        "default": "DISCOVER OUR UNIQUE FEATURES"
      },
      "features": {
        "list": true,
        "default": [
          {
            "icon": "check",
            "category": "CHEF'S WORDS",
            "title": "Pineapple Bliss Crush",
            "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuCWAYmKsD42yxaGWMokM8py3U-TMT2USgBO1N3uZQLwh3FMfPIe2aIyZgednDK-Z0Yn94ZxYp8WVH9QkPrxIH233KLPqPihw9N8oHiP3Xga0bGEiHPTlPYMUBAjufQCjZFGTcXf-cwBi3-s2Q-K5oLyrkrXI8O0f6xlaE7rkJASMkMrGpQfK8V5-uxygutggqq1I_j_qLKnx2Aw6BxA2RBEsN2VKhIlwBW3fG-SYJjwb2tVF4LSOBZL"
          },
          {
            "icon": "check",
            "category": "CULINARY INSIGHTS",
            "title": "A Burst of Tropical Goodness",
            "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuAwqSbmgzqfJ6qjmGZLU8Mk7Bne9Ujla7rMz-MrNimlqIN3IKiO3HPIfuOR1oicfH63zY9g2eGI4VUz4K7JIVncAOEdUjlyuHfzhMLPP6gKpsrJjsj6MKmREC5d8C0CkLX8-NE6kvwJkBp8Q3q8-MH7cqGEIgvO8DnSpy7HrwDDUWknNwt1cBdHAJ84v6sAVYxlc-JCB8q7EsKrIlw01URBUkkwDd72KTkoGp6AlEAHxS71LeEBc3hG"
          },
          {
            "icon": "check",
            "category": "CULINARY INSIGHTS",
            "title": "Tropical Flavor Sensation",
            "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuBlr8qjBOE1oCeQ5PMYiTIpgVJsows_Mhqrq5ZNoI-06AcjH4hPOQjzlzXHh4Wvx0g698jIQ3q1b_ZDKWhdGYbF4PllXw7890E1M3ByXgD0w7WcXdNs2UMD2TwWT3QrfKzzkt82X3jQv_2Gd5LXvfwXv0htn7TjNJAXFVm6DQLViKFwbJqnlIA70fnny_N--d4LOPB2HRVGirjB49DYBbMkUwfHU2eUiXqZxb15_bAcrovUhNztsy2C"
          }
        ],
        "items": {
          "icon": {
            "default": "check"
          },
          "category": {
            "default": "CHEF'S WORDS"
          },
          "title": {
            "default": "Pineapple Bliss Crush"
          },
          "image": {
            "default": "https://lh3.googleusercontent.com/aida-public/AB6AXuCWAYmKsD42yxaGWMokM8py3U-TMT2USgBO1N3uZQLwh3FMfPIe2aIyZgednDK-Z0Yn94ZxYp8WVH9QkPrxIH233KLPqPihw9N8oHiP3Xga0bGEiHPTlPYMUBAjufQCjZFGTcXf-cwBi3-s2Q-K5oLyrkrXI8O0f6xlaE7rkJASMkMrGpQfK8V5-uxygutggqq1I_j_qLKnx2Aw6BxA2RBEsN2VKhIlwBW3fG-SYJjwb2tVF4LSOBZL"
          },
          "label": {
            "aliasOf": "category"
          },
          "name": {
            "aliasOf": "title"
          },
          "url": {
            "aliasOf": "image"
          }
        }
      }
    },
    "menu": {
      "menuEyebrow": {
        "default": "Chef's Words"
      },
      "menuTitle": {
        "default": "What's On The Menu"
      },
      "dishes": {
        "list": true,
        "default": [
          {
            "name": "Coconut Curry Spicy<br/>Delight",
            "price": "$13.75",
            "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuAUhNHkol0t-FoHGlEy-8OgRt97OawMoTFBOSJ_j9hdW70MZGfcWEacT9qcIQn9BdxVXRIiaYZO_z8Ibm30lhB5A7Trqxj0LFup2XmqQ_ZPYwQftqfkgMWSvt80afGkIolndMgzsN8CH2LsgpBGriyTuQ6hl9f-aVlykz_IPBIZVzpYUwZclKMDZh7mlAejpTMVG1vQuAjkRQyyiIEdm-ztqnP9qI8wnlchsQWcbvYTt7e7QXyNuBYM"
          },
          {
            "name": "Crushed Pineapple<br/>Sriracha",
            "price": "$12.00",
            "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuDWm_vbZnpcWp1BVj1nFOeVQ52UpWFBWCOJmFOBO57hpYDNPS9MWHoFnHjVh4nTK9vFqF5548PmQQ0OYkBbOZZhu5KZFPz30y3tmX9WszsRgZFui50gpg5sCPXZenYTTmlswK6kbQy_ZAXG6l3Be-cnlIn0SZYCQnX1vWSnqEb6UOtuxyVVcdNVgR1jlQ_6elRgptmHghDZemymYhv3EqjAKepU9o-cmeGReump_yoGtW7RzUIIRRb5"
          },
          {
            "name": "Roasted Beet Salad Feta<br/>&amp; Walnuts",
            "price": "$8.50",
            "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuDt9UKPk0Nc-0EBljjxMqlR4fCg_UmNkU6ntBGQCSF07oX_pfWqZOuGOu0ehxph6XisXZ9L_TGNzcBZfA2SIxY8NiRQ83MHrqIjNQecMU35aisj3WATwuZwAIrbQd0jemqi_K_tfhvdTgGhK331OT3-AzmtOSucx9dZnZp6AoyUr07OlQY7OF8_AnJM-UhTw_JgYdLbTzxsi1_-XnSETToaTdfYMcB7ZmTPQXrBc-qNTwgDjDhlXRUE"
          },
          {
            "name": "Crispy Kale Caesar<br/>Parmesan Crisp",
            "price": "$12.50",
            "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuCG4sCuLDWv6gOD5U9J6K6HP3CpGgWHv86N4kpntThYHtB3TyQEcg1UERLxZ37WytPwNUiQwAsAZmPvVL_93i9r1KGVyLpYWX17XQRAgWMJSjMz9L7G749QqO-w87q6xYRHv96QqnwoAEP8uQJs128khr-9R3mT_wmJbah8Fke4MtbC90Bdz7DxuRnUnovxUcxrWSA137ElkCj2ltgMpZ9GdDsqXAdi6hOGJPKl452rZk9Axo0qXSpZ"
          },
          {
            "name": "Spicy Saffron Shrimp<br/>Garlic Butter",
            "price": "$20.75",
            "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuB2FY7WmJBqTnfAos0_M8rtIGa-MPTTLDzwfIgqsy_ezMzCYjCwtmd9gTwQ0gaRfxrmUUDov6bxJ9U7OWje8e0AvQMU5th-XfAncjhHyPn-GtvVrb5wun1MfsdXHhdbZwMOvDAHL76uOm-ieLMzrMNr24Zrigwxfa3RuEnZ_3s0_kvKCUN6HTVZiMJdGacfB5xrAWTKvO_liTl_orY-OAxsufm9QkiNJ4x6M_Aw5JZfD6KB15eZhuhw"
          },
          {
            "name": "Tandoori Chicken Skewers<br/>Mint Yogurt Dip",
            "price": "$16.50",
            "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuBinZ1NgseDcctjl7EUky2onYJ5hxSjtBVu8zxkbUAZPhwlN6zr-_Lcl6kTpwJRqRsiUWLx-BA9bag0T7xhoMAIAHm_Bxm9VIgXKCoCdy1_hwvAwOTndfvbuyLtq5kGd0SyK3mW7FvFXKIEkkKKUQgUhWlmgDUDVS9cOEy7Qy0qyeJpxaaaqUCS3VMIkVB-NYRQIOqDbdQUwl5GAjXQDGr0eqzBxcG_JRHa4WWA62ROf9espul_RBok"
          },
          {
            "name": "Coconut Passion<br/>Sorbet",
            "price": "$14.00",
            "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuBPi-8iH_WKyoi4W193rE30ryPRuODVZvvPu8FZUbaLoTLQ1FgYSjCkEK8iN3gXzkuSPo85qUgTFbrkElK-H08OU_J-ZzSlyDuFEVtxDGEf6fMocw9Z77yxkzzTKJUbHLCxmN91H0dOSTlmCujpqCD8hqCtYkpBaFK6ixno4ZC8m8c3ZnKRD9aRVN0X6jib9I3nyNj_k_89tR22Klg21QrVHKR5LjFL4H1p6EallXtSYkH7QnG2l_Ne"
          }
        ],
        "items": {
          "name": {
            "default": "Coconut Curry Spicy<br/>Delight"
          },
          "price": {
            "default": "$13.75"
          },
          "image": {
            "default": "https://lh3.googleusercontent.com/aida-public/AB6AXuAUhNHkol0t-FoHGlEy-8OgRt97OawMoTFBOSJ_j9hdW70MZGfcWEacT9qcIQn9BdxVXRIiaYZO_z8Ibm30lhB5A7Trqxj0LFup2XmqQ_ZPYwQftqfkgMWSvt80afGkIolndMgzsN8CH2LsgpBGriyTuQ6hl9f-aVlykz_IPBIZVzpYUwZclKMDZh7mlAejpTMVG1vQuAjkRQyyiIEdm-ztqnP9qI8wnlchsQWcbvYTt7e7QXyNuBYM"
          },
          "url": {
            "aliasOf": "image"
          }
        }
      },
      "menuCtaUrl": {
        "default": "#full-menu"
      },
      "menuCtaIcon": {
        "default": "calendar"
      },
      "menuCtaText": {
        "default": "Explore The Full Menu"
      }
    },
    "lunch-menu": {
      "lunchEyebrow": {
        "default": "CHEF'S WORDS"
      },
      "lunchTitle": {
        "default": "LUNCH MENU"
      },
      "lunchItems": {
        "list": true,
        "default": [
          {
            "name": "Tropical Acai Delight",
            "desc": "Pure Unsweetened Acai Puree, Toppings, Yogurt",
            "price": "$56.00",
            "thumb": "https://lh3.googleusercontent.com/aida-public/AB6AXuDMQFVYMzxzsWVoX1lb0-ocygyhr642U2He0YMHujwxBRk6wNnZ1bWeuOXlurZPYT4N3A0rhU_W6O0iIc8lkgiaMhUJrzxaT9GwXWtaTn4bzrGMMR8_F0CN61ctV3jOPXA3qs9H6n1J6C1LwpXdZcvNXqfWCdLii9LCOmZLcYkNsZYX3cnNzncsE-TVHLW1V9IJPZoBYJ0RXApelAru8lAUjUOipKZrazYgyUDsECuyraeGzce97G6WLqtFY7TPrNDwhA",
            "pos": "20.5% 36.5%",
            "size": "1950%"
          },
          {
            "name": "Berry Bliss Acai Bowl",
            "desc": "Pure Unsweetened Acai Puree, Toppings, Yogurt",
            "price": "$66.00",
            "thumb": "https://lh3.googleusercontent.com/aida-public/AB6AXuDGAa2hR94TJIG2HnRqDO9dp2idVtF3o7Bc1uWCK6IDWr0f4ZJiyp9rNK0kmh2HcdBuRHl90u0-2u9GnglKKhm25ZKxhMF1KDXJRhbjNUn7Rtry70dULEinMiR_omvOa-Oqz4k20I0K2mzU66fyX_7KwvjopxYe2dNpaoTL86Xeyj91Kl23s6DF5UIrKPQHOjU7P6OE56tcUWnkIbg2q0QgWLw2tLRB8Ar3Rhf5vGv9WJf4IMYDCLoIQRoS99BIOmSQxQ",
            "pos": "20.5% 53.5%",
            "size": "1950%"
          },
          {
            "name": "Coconut Dream Acai Bowl",
            "desc": "Pure Unsweetened Acai Puree, Toppings, Yogurt",
            "price": "$62.00",
            "thumb": "https://lh3.googleusercontent.com/aida-public/AB6AXuAoKNkEX-lnQsi3JfAzVbi790gMlbBUrfLBwolE-7UgY615VgPkpeRZWC393F5JSQNHXe6Rih5J1qgTxSymGH6LsehGNWL0ulmQGdVisb_P-lSJZily0cOQq6bXHZuZJySI--UXwHsLwAAzI-QIIAYxceeSwRqsJt4miSAN2Q94RYKxBkXbXJ26b4b2c0Hgp7Vyg9Bd8NcqkhkZF_we69fqJQ-61ZPg_owu4GiQepDrntodfGnWcL9eM7Z6hLI8xrsjwg",
            "pos": "20.5% 72.5%",
            "size": "1950%"
          },
          {
            "name": "Nutty Banana Acai Bowl",
            "desc": "Pure Unsweetened Acai Puree, Toppings, Yogurt",
            "price": "$60.00",
            "thumb": "https://lh3.googleusercontent.com/aida-public/AB6AXuDoZEhvqyPPSlrQiaJMoPfGquQtmwAoNccR0E6Meu0wnkV5_Aoy5g9DtwjMpV7pzO_bskPowlwsLVPUn1eXb4zCoUN0F8zHvoCNFvc9Qh_iEKeWIjFLbj2xcuwn8Zg_7oytMwa3m6yCzgC0gw8uER1q1cupwLEIz4-hIRZuERISfTQY-n2-_8oBQAzLwdinXw8bBshnPdfZB-xB6m3rKuuk1x9aR5SiJOim7WsdSZazANOedhdGKegvWrVUUeCEUmNw",
            "pos": "20.5% 90.5%",
            "size": "1950%"
          }
        ],
        "items": {
          "name": {
            "default": "Tropical Acai Delight"
          },
          "desc": {
            "default": "Pure Unsweetened Acai Puree, Toppings, Yogurt"
          },
          "price": {
            "default": "$56.00"
          },
          "thumb": {
            "default": "https://lh3.googleusercontent.com/aida-public/AB6AXuDMQFVYMzxzsWVoX1lb0-ocygyhr642U2He0YMHujwxBRk6wNnZ1bWeuOXlurZPYT4N3A0rhU_W6O0iIc8lkgiaMhUJrzxaT9GwXWtaTn4bzrGMMR8_F0CN61ctV3jOPXA3qs9H6n1J6C1LwpXdZcvNXqfWCdLii9LCOmZLcYkNsZYX3cnNzncsE-TVHLW1V9IJPZoBYJ0RXApelAru8lAUjUOipKZrazYgyUDsECuyraeGzce97G6WLqtFY7TPrNDwhA"
          },
          "pos": {
            "default": "20.5% 36.5%"
          },
          "size": {
            "default": "1950%"
          },
          "description": {
            "aliasOf": "desc"
          }
        }
      },
      "diningBg": {
        "default": "https://lh3.googleusercontent.com/aida-public/AB6AXuDoeLuQNgrdeN3767l-YCeSsA6ckroxBn9zy-AWNm83FW5PCUWUvtdb1voXtP0eCUpE13LuYlpQ41lRcbKFqaMadol59xUaNW9mz8A4FhWv1YsewlGvGmEZtjUo7oVGOd-GW_JTT7L7c4TcOlOIWij8ZCQcXfvDuiivdwvxPHtI0Kd_nFqVzH1Q2ftIttqWyF7Fjf2WHpVqETBYDn3-vJFGNnnohxcaECkkoZNxc8fEkW9djzBrjh9Y1I2Y6tY8nFrl7A"
      },
      "diningBgPos": {
        "default": "80% 50%"
      },
      "diningBgSize": {
        "default": "215%"
      },
      "dishOverlapImg": {
        "default": "https://lh3.googleusercontent.com/aida-public/AB6AXuCPj8DWfbb7H33mzCSClO1GbuAmQbSTY3PUMkwWM9YLkuPvJ0qpbGiMuYWGeRXeJlGgiQgECOxusns72CofAxDJanViqI07PhVvwzjzteoOsY2Ezs2wEX3M8KvkhHRkUg7x_GR4CP-HfnZLIK9GZtgjlzffrQu6em45gr9dGCPIXYFhZOCjBk8XbWlWGcM_A3y5Aua5kMhed_asxFSp3zL_ldIw7QpAozTkphDhW5dnaIYEjbr82hDfLm_CvdgDYdDx5g"
      },
      "dishOverlapPos": {
        "default": "59% 58%"
      },
      "dishOverlapSize": {
        "default": "320%"
      }
    },
    "footer": {
      "brand": {
        "default": "DISHORA"
      },
      "brandDesc": {
        "default": "Our master chefs craft each dish as a masterpiece, blending traditional culinary techniques with modern innovation. Whether it's an intimate dinner or a grand celebration,."
      },
      "socials": {
        "list": true,
        "default": [
          {
            "label": "Dishora on Facebook",
            "href": "#facebook",
            "icon": "<path d=\"M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z\"></path>"
          },
          {
            "label": "Dishora on X",
            "href": "#twitter",
            "icon": "<path d=\"M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z\"></path>"
          },
          {
            "label": "Dishora on YouTube",
            "href": "#youtube",
            "icon": "<path d=\"M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z\"></path>"
          },
          {
            "label": "Dishora on Instagram",
            "href": "#instagram",
            "icon": "<path d=\"M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z\"></path>"
          }
        ],
        "items": {
          "label": {
            "default": "Dishora on Facebook"
          },
          "href": {
            "default": "#facebook"
          },
          "icon": {
            "default": "<path d=\"M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z\"></path>"
          }
        }
      },
      "contactTitle": {
        "default": "CONTACT WITH US"
      },
      "contactPhone": {
        "default": "+1 (555) 019-2834"
      },
      "contactEmail": {
        "default": "booking@classicrest.com"
      },
      "openTitle": {
        "default": "OPENING HOURS"
      },
      "openLines": {
        "list": true,
        "default": [
          "Sun-Thurs: 11:30am – 11pm",
          "Every Fri-Sat (8pm onwards)"
        ]
      },
      "locTitle": {
        "default": "OUR LOCATION"
      },
      "locLines": {
        "list": true,
        "default": [
          "5232 SW College Rd",
          "Ocala, FL 54654"
        ]
      },
      "newsletterTitle": {
        "default": "SIGN UP FOR UPDATES, OFFERS, AND DELICIOUS SURPRISES"
      },
      "newsletterLabel": {
        "default": "Email address"
      },
      "newsletterPlaceholder": {
        "default": "Your Email...."
      },
      "copyright": {
        "default": "© 2026 Dishora. All Rights Reserved."
      },
      "reviewLinkText": {
        "default": "Dejar una reseña"
      }
    }
  },
  "graduate": {
    "header": {
      "links": {
        "list": true,
        "default": [],
        "items": {
          "label": {
            "default": "Inicio"
          },
          "url": {
            "default": "#inicio"
          }
        }
      },
      "topbarPhone": {
        "default": "+593 99 123 4567"
      },
      "topbarEmail": {
        "default": "hola@graduate.ec"
      },
      "topbarSocials": {
        "list": true,
        "default": [
          {
            "icon": "fa-brands fa-facebook-f",
            "url": "#"
          },
          {
            "icon": "fa-brands fa-instagram",
            "url": "#"
          },
          {
            "icon": "fa-brands fa-whatsapp",
            "url": "#"
          },
          {
            "icon": "fa-brands fa-tiktok",
            "url": "#"
          }
        ],
        "items": {
          "icon": {
            "default": "fa-brands fa-facebook-f"
          },
          "url": {
            "default": "#"
          }
        }
      },
      "brandUrl": {
        "default": "#"
      },
      "logo": {
        "default": ""
      },
      "brand": {
        "default": "Graduate."
      },
      "brandInitial": {
        "default": "G"
      },
      "ctaUrl": {
        "default": "#contacto"
      },
      "ctaText": {
        "default": "Hablemos"
      }
    },
    "hero": {
      "heroStyle": {
        "default": "carousel"
      },
      "tag": {
        "default": "Agencia & Academia Digital"
      },
      "titleLine1": {
        "default": "Revoluciona el"
      },
      "titleHighlight": {
        "default": "Crecimiento"
      },
      "titleLine2": {
        "default": "de tu negocio."
      },
      "subtitle": {
        "default": "Construimos ecosistemas digitales que venden. Si no estás aprovechando la publicidad digital y las redes sociales, tu competencia sí lo está haciendo."
      },
      "primaryButtonUrl": {
        "default": "#servicios"
      },
      "primaryButtonText": {
        "default": "Escalar mi negocio"
      },
      "secondaryButtonUrl": {
        "default": "#contacto"
      },
      "secondaryButtonText": {
        "default": "Asesoría Gratuita"
      },
      "heroImage": {
        "default": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=900&auto=format&fit=crop"
      },
      "badgeIcon": {
        "default": "fa-solid fa-graduation-cap"
      },
      "badgeValue": {
        "default": "+500 Alumnos"
      },
      "badgeLabel": {
        "default": "Comunidad"
      },
      "backgroundImage": {
        "default": "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070&auto=format&fit=crop"
      },
      "cards": {
        "list": true,
        "default": [
          {
            "badge": "Emprendedor",
            "color": "#fa7202",
            "image": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=600&auto=format&fit=crop",
            "title": "Agencia Digital",
            "alt": "Graduado Emprendedor"
          },
          {
            "badge": "Ventas Online",
            "color": "#21b1fe",
            "image": "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=600&auto=format&fit=crop",
            "title": "E-commerce Manager",
            "alt": "Graduada E-commerce"
          },
          {
            "badge": "Caso de Éxito",
            "color": "#7dd958",
            "image": "https://images.unsplash.com/photo-1552581234-26160f608093?q=80&w=600&auto=format&fit=crop",
            "title": "Agencia Creativa",
            "alt": "Equipo Creativo"
          }
        ],
        "items": {
          "badge": {
            "default": "Emprendedor"
          },
          "color": {
            "default": "#fa7202"
          },
          "image": {
            "default": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=600&auto=format&fit=crop"
          },
          "title": {
            "default": "Agencia Digital"
          },
          "alt": {
            "default": "Graduado Emprendedor"
          }
        }
      }
    },
    "clients": {
      "clients": {
        "list": true,
        "default": [],
        "items": {
          "image": {},
          "alt": {
            "default": "Logo"
          }
        }
      },
      "clientsTitle": {
        "default": "Formación de calidad"
      }
    },
    "stats": {
      "stats": {
        "list": true,
        "default": [
          {
            "value": "+5",
            "label": "Años de Experiencia",
            "color": "text-[#fa7202]",
            "icon": "fa-solid fa-medal"
          },
          {
            "value": "+500",
            "label": "Marcas Impulsadas",
            "color": "text-[#21b1fe]",
            "icon": "fa-solid fa-rocket"
          },
          {
            "value": "40%",
            "label": "Crecimiento Promedio",
            "color": "text-[#7dd958]",
            "icon": "fa-solid fa-arrow-trend-up"
          },
          {
            "value": "24/7",
            "label": "Acompañamiento",
            "color": "text-[#fa7202]",
            "icon": "fa-solid fa-headset"
          }
        ],
        "items": {
          "value": {
            "default": "+5"
          },
          "label": {
            "default": "Años de Experiencia"
          },
          "color": {
            "default": "text-[#fa7202]"
          },
          "icon": {
            "default": "fa-solid fa-medal"
          }
        }
      }
    },
    "timeline": {
      "timeline": {
        "list": true,
        "default": [
          {
            "year": "2019",
            "icon": "fa-solid fa-lightbulb",
            "color": "text-[#fa7202]",
            "borderColor": "border-[#fa7202]",
            "title": "El inicio",
            "desc": "Nacemos como un pequeño estudio de redes sociales para negocios locales de Quito."
          },
          {
            "year": "2021",
            "icon": "fa-solid fa-users",
            "color": "text-[#21b1fe]",
            "borderColor": "border-[#21b1fe]",
            "title": "Primer gran equipo",
            "desc": "Sumamos estrategas, creativos y community managers. Superamos los 100 clientes activos."
          },
          {
            "year": "2023",
            "icon": "fa-solid fa-graduation-cap",
            "color": "text-[#7dd958]",
            "borderColor": "border-[#7dd958]",
            "title": "Nace la Academia",
            "desc": "Lanzamos los primeros cursos de Meta Ads y marketing digital con metodología 100% práctica."
          },
          {
            "year": "2026",
            "icon": "fa-solid fa-rocket",
            "color": "text-[#2d2e81]",
            "borderColor": "border-[#2d2e81]",
            "title": "Hoy, hacia el futuro",
            "desc": "Una comunidad de +500 marcas y miles de alumnos creciendo junto a nosotros."
          }
        ],
        "items": {
          "year": {
            "default": "2019"
          },
          "icon": {
            "default": "fa-solid fa-lightbulb"
          },
          "color": {
            "default": "text-[#fa7202]"
          },
          "borderColor": {
            "default": "border-[#fa7202]"
          },
          "title": {
            "default": "El inicio"
          },
          "desc": {
            "default": "Nacemos como un pequeño estudio de redes sociales para negocios locales de Quito."
          }
        }
      },
      "timelineEyebrowIcon": {
        "default": "fa-solid fa-route"
      },
      "timelineEyebrow": {
        "default": "Nuestra Historia"
      },
      "timelineTitleLine1": {
        "default": "El camino que nos ha"
      },
      "timelineHighlight": {
        "default": "traído aquí."
      }
    },
    "team": {
      "members": {
        "list": true,
        "default": [
          {
            "name": "Alejandro Flores",
            "role": "Fundador & CEO",
            "image": "https://i.pravatar.cc/150?img=68",
            "roleColor": "text-[#fa7202]",
            "socials": [
              {
                "icon": "fa-brands fa-linkedin-in",
                "url": "#"
              },
              {
                "icon": "fa-brands fa-instagram",
                "url": "#"
              }
            ]
          },
          {
            "name": "Valentina Paz",
            "role": "Directora Creativa",
            "image": "https://i.pravatar.cc/150?img=47",
            "roleColor": "text-[#21b1fe]",
            "socials": [
              {
                "icon": "fa-brands fa-linkedin-in",
                "url": "#"
              },
              {
                "icon": "fa-brands fa-x-twitter",
                "url": "#"
              }
            ]
          },
          {
            "name": "Mateo Andrade",
            "role": "Estratega Meta Ads",
            "image": "https://i.pravatar.cc/150?img=59",
            "roleColor": "text-[#7dd958]",
            "socials": [
              {
                "icon": "fa-brands fa-linkedin-in",
                "url": "#"
              },
              {
                "icon": "fa-brands fa-tiktok",
                "url": "#"
              }
            ]
          },
          {
            "name": "Camila Ruiz",
            "role": "Head de Academia",
            "image": "https://i.pravatar.cc/150?img=45",
            "roleColor": "text-[#2d2e81]",
            "socials": [
              {
                "icon": "fa-brands fa-linkedin-in",
                "url": "#"
              },
              {
                "icon": "fa-brands fa-instagram",
                "url": "#"
              }
            ]
          }
        ],
        "items": {
          "name": {
            "default": "Alejandro Flores"
          },
          "role": {
            "default": "Fundador & CEO"
          },
          "image": {
            "default": "https://i.pravatar.cc/150?img=68"
          },
          "roleColor": {
            "default": "text-[#fa7202]"
          },
          "socials": {
            "default": [
              {
                "icon": "fa-brands fa-linkedin-in",
                "url": "#"
              },
              {
                "icon": "fa-brands fa-instagram",
                "url": "#"
              }
            ],
            "list": true,
            "items": {
              "icon": {
                "default": "fa-brands fa-twitter"
              },
              "url": {
                "default": "#"
              }
            }
          }
        }
      },
      "teamEyebrow": {
        "default": "Conócenos"
      },
      "teamTitleLine1": {
        "default": "El talento detrás de"
      },
      "teamTitleHighlight": {
        "default": "Graduate."
      }
    },
    "about": {
      "features": {
        "list": true,
        "default": [
          {
            "icon": "fa-solid fa-bullseye",
            "color": "#7dd958",
            "title": "Estrategia Local",
            "desc": "Conocemos el mercado ecuatoriano y cómo conectar con tu audiencia."
          },
          {
            "icon": "fa-solid fa-handshake",
            "color": "#21b1fe",
            "title": "Acompañamiento",
            "desc": "No te dejamos solo. Te educamos mientras crecemos juntos."
          }
        ],
        "items": {
          "icon": {
            "default": "fa-solid fa-bullseye"
          },
          "color": {
            "default": "#7dd958"
          },
          "title": {
            "default": "Estrategia Local"
          },
          "desc": {
            "default": "Conocemos el mercado ecuatoriano y cómo conectar con tu audiencia."
          }
        }
      },
      "eyebrow": {
        "default": "Nuestra Esencia"
      },
      "aboutTitleLine1": {
        "default": "Transformamos"
      },
      "aboutTitleHighlight1": {
        "default": "seguidores en"
      },
      "aboutTitleHighlight2": {
        "default": "clientes reales."
      },
      "description": {
        "default": "En <strong>Academia Graduate</strong> no somos una agencia tradicional. Somos tu equipo de crecimiento estratégico. Olvídate de los \"likes\" vacíos; nos enfocamos en el <strong>ROI (Retorno de Inversión)</strong> y en enseñar metodologías 100% prácticas."
      },
      "mainImage": {
        "default": "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      },
      "mainImageAlt": {
        "default": "Equipo"
      },
      "secondaryImage": {
        "default": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
      },
      "secondaryImageAlt": {
        "default": "Trabajo en equipo"
      },
      "badgeValue": {
        "default": "+5"
      },
      "badgeLabel": {
        "default": "Años de<br/>Experiencia"
      }
    },
    "services": {
      "servicesId": {
        "default": "servicios"
      },
      "servicesEyebrowIcon": {
        "default": "fa-solid fa-fire"
      },
      "servicesEyebrow": {
        "default": "Lo que hacemos por ti"
      },
      "servicesTitleLine1": {
        "default": "Soluciones Integrales"
      },
      "servicesTitleLine2": {
        "default": "de"
      },
      "servicesHighlight": {
        "default": "Marketing"
      },
      "servicesSubtitle": {
        "default": "No ofrecemos paquetes genéricos. Diseñamos ecosistemas digitales a medida para escalar las ventas de tu negocio."
      },
      "cards": {
        "list": true,
        "default": [
          {
            "colSpan": "lg:col-span-2",
            "dark": false,
            "icon": "fa-solid fa-bullhorn",
            "iconBg": "from-[#2d2e81] to-blue-600",
            "iconShadow": "shadow-blue-500/30",
            "title": "Tráfico y Captación (Ads)",
            "titleSize": "text-3xl",
            "desc": "Campañas de alta conversión en Meta (Facebook/Instagram) y Google Ads. Llevamos a tu cliente ideal directamente a tu WhatsApp o página web.",
            "blob": "from-blue-100",
            "checks": [
              "Segmentación avanzada",
              "Optimización de presupuesto",
              "Retargeting estratégico",
              "Reportes de rendimiento"
            ]
          },
          {
            "icon": "fa-solid fa-pen-nib",
            "iconBg": "from-[#fa7202] to-[#ffb347]",
            "iconShadow": "shadow-orange-500/30",
            "title": "Contenido que Vende",
            "titleSize": "text-2xl",
            "desc": "Estrategias orgánicas, guiones para Reels/TikToks y diseño de posts que construyen autoridad y educan a tu cliente.",
            "blob": "from-orange-100",
            "linkColor": "text-[#fa7202]",
            "linkText": "Saber más",
            "linkUrl": "#contacto"
          },
          {
            "icon": "fa-solid fa-laptop-code",
            "iconBg": "from-[#21b1fe] to-sky-400",
            "iconShadow": "shadow-sky-500/30",
            "title": "Digitalización Web",
            "titleSize": "text-2xl",
            "desc": "Diseño de landing pages, embudos de venta y tiendas virtuales optimizadas específicamente para maximizar conversiones.",
            "blob": "from-sky-100",
            "linkColor": "text-[#21b1fe]",
            "linkText": "Saber más",
            "linkUrl": "#contacto"
          },
          {
            "colSpan": "lg:col-span-2",
            "dark": true,
            "badge": "Para Equipos y Empresas",
            "icon": "fa-solid fa-users-gear",
            "title": "Capacitación In-House",
            "desc": "No solo te damos el pescado, te enseñamos a pescar. Entrenamos a tu equipo comercial o de marketing con tácticas modernas de cierre de ventas, atención por WhatsApp y gestión digital.",
            "buttonText": "Agendar Entrenamiento",
            "buttonUrl": "#contacto"
          }
        ],
        "items": {
          "colSpan": {
            "default": "lg:col-span-2"
          },
          "dark": {
            "default": false
          },
          "icon": {
            "default": "fa-solid fa-bullhorn"
          },
          "iconBg": {
            "default": "from-[#2d2e81] to-blue-600"
          },
          "iconShadow": {
            "default": "shadow-blue-500/30"
          },
          "title": {
            "default": "Tráfico y Captación (Ads)"
          },
          "titleSize": {
            "default": "text-3xl"
          },
          "desc": {
            "default": "Campañas de alta conversión en Meta (Facebook/Instagram) y Google Ads. Llevamos a tu cliente ideal directamente a tu WhatsApp o página web."
          },
          "blob": {
            "default": "from-blue-100"
          },
          "checks": {
            "default": [
              "Segmentación avanzada",
              "Optimización de presupuesto",
              "Retargeting estratégico",
              "Reportes de rendimiento"
            ],
            "list": true
          },
          "linkColor": {
            "default": "text-[#fa7202]"
          },
          "linkText": {
            "default": "Saber más"
          },
          "linkUrl": {
            "default": "#contacto"
          },
          "badge": {
            "default": "Para Equipos y Empresas"
          },
          "buttonText": {
            "default": "Agendar Entrenamiento"
          },
          "buttonUrl": {
            "default": "#contacto"
          }
        }
      }
    },
    "features": {
      "courses": {
        "list": true,
        "default": [
          {
            "number": "01",
            "numberColor": "group-hover:text-[#2d2e81]",
            "title": "Master en Meta Ads",
            "titleColor": "group-hover:text-[#21b1fe]",
            "desc": "Domina campañas rentables en Facebook e Instagram. Segmentación y Pixel.",
            "badges": [
              {
                "text": "Online / Presencial"
              },
              {
                "icon": "fa-regular fa-clock",
                "text": "12 Horas"
              }
            ],
            "circleColor": "group-hover:bg-[#2d2e81] group-hover:border-[#2d2e81]"
          },
          {
            "number": "02",
            "numberColor": "group-hover:text-[#7dd958]",
            "title": "Cierre por WhatsApp",
            "titleColor": "group-hover:text-[#7dd958]",
            "desc": "Convierte chats en ventas. WhatsApp Business, automatizaciones y scripts persuasivos.",
            "badges": [
              {
                "text": "Online"
              },
              {
                "icon": "fa-regular fa-clock",
                "text": "8 Horas"
              }
            ],
            "circleColor": "group-hover:bg-[#7dd958] group-hover:border-[#7dd958]"
          },
          {
            "number": "03",
            "numberColor": "group-hover:text-pink-500",
            "title": "Contenido Viral & TikTok",
            "titleColor": "group-hover:text-pink-500",
            "desc": "Fórmula para videos cortos que enganchen y generen visualizaciones orgánicas.",
            "badges": [
              {
                "text": "Próximamente",
                "highlight": true
              },
              {
                "icon": "fa-regular fa-clock",
                "text": "10 Horas"
              }
            ],
            "circleColor": "group-hover:bg-pink-500 group-hover:border-pink-500"
          }
        ],
        "items": {
          "number": {
            "default": "01"
          },
          "numberColor": {
            "default": "group-hover:text-[#2d2e81]"
          },
          "title": {
            "default": "Master en Meta Ads"
          },
          "titleColor": {
            "default": "group-hover:text-[#21b1fe]"
          },
          "desc": {
            "default": "Domina campañas rentables en Facebook e Instagram. Segmentación y Pixel."
          },
          "badges": {
            "default": [
              {
                "text": "Online / Presencial"
              },
              {
                "icon": "fa-regular fa-clock",
                "text": "12 Horas"
              }
            ]
          },
          "circleColor": {
            "default": "group-hover:bg-[#2d2e81] group-hover:border-[#2d2e81]"
          },
          "image": {
            "default": "https://placehold.co/600x400/f97316/white?text=Curso"
          },
          "badge": {},
          "duration": {},
          "buttonUrl": {},
          "buttonText": {
            "default": "Inscríbete"
          }
        }
      },
      "academiaEyebrowIcon": {
        "default": "fa-solid fa-graduation-cap"
      },
      "academiaEyebrow": {
        "default": "Nuestra Academia"
      },
      "academiaTitleLine1": {
        "default": "Aprende con los"
      },
      "academiaHighlight": {
        "default": "mejores."
      },
      "academiaRightText": {
        "default": "Capacítate tú mismo para dominar el ecosistema digital de tu negocio. Metodología 100% práctica y aplicable."
      },
      "academiaLinkUrl": {
        "default": "#contacto"
      },
      "academiaLinkText": {
        "default": "Explorar todos los programas"
      }
    },
    "testimonials": {
      "testimonials": {
        "list": true,
        "default": [
          {
            "large": true,
            "gradient": "from-[#2d2e81] to-[#0a0b2e]",
            "starColor": "text-[#fa7202]",
            "quote": "\"Antes sentía que gastaba dinero en redes sociales sin ver retorno. Desde que aplicaron su estrategia y tomé su taller de ventas, nuestra facturación en la tienda física creció un 40% en apenas dos meses.\"",
            "name": "María Fernanda L.",
            "role": "Dueña de Boutique (Quito)",
            "roleColor": "text-blue-200",
            "avatar": "https://i.pravatar.cc/150?img=32",
            "online": true
          },
          {
            "starColor": "text-[#21b1fe]",
            "borderHover": "hover:border-[#21b1fe]/30",
            "quote": "\"El curso de Meta Ads fue un antes y un después. Por fin entiendo cómo funciona el Pixel y mis campañas ahora sí son rentables.\"",
            "name": "Carlos M.",
            "role": "Emprendedor E-commerce",
            "avatar": "https://i.pravatar.cc/150?img=11"
          },
          {
            "starColor": "text-[#fa7202]",
            "borderHover": "hover:border-[#fa7202]/30",
            "quote": "\"La paciencia y el conocimiento del equipo Graduate es increíble. Nuestra clínica dental duplicó sus pacientes en 3 meses.\"",
            "name": "Dra. Andrea V.",
            "role": "Centro Odontológico",
            "avatar": "https://i.pravatar.cc/150?img=47"
          }
        ],
        "items": {
          "large": {
            "default": true
          },
          "gradient": {
            "default": "from-[#2d2e81] to-[#0a0b2e]"
          },
          "starColor": {
            "default": "text-[#fa7202]"
          },
          "quote": {
            "default": "\"Antes sentía que gastaba dinero en redes sociales sin ver retorno. Desde que aplicaron su estrategia y tomé su taller de ventas, nuestra facturación en la tienda física creció un 40% en apenas dos meses.\""
          },
          "name": {
            "default": "María Fernanda L."
          },
          "role": {
            "default": "Dueña de Boutique (Quito)"
          },
          "roleColor": {
            "default": "text-blue-200"
          },
          "avatar": {
            "default": "https://i.pravatar.cc/150?img=32"
          },
          "online": {
            "default": true
          },
          "borderHover": {
            "default": "hover:border-[#21b1fe]/30"
          }
        }
      },
      "testiEyebrow": {
        "default": "Casos de Éxito"
      },
      "testiTitleLine1": {
        "default": "Resultados que hablan por"
      },
      "testiHighlight": {
        "default": "sí solos."
      },
      "testiSubtitle": {
        "default": "Únete a las decenas de emprendedores y empresas en Ecuador que ya escalaron sus ventas con nosotros."
      },
      "clientsHeading": {
        "default": "Marcas que confían en nosotros"
      },
      "clientsSubheading": {
        "default": "Agencia avalada por cientos de casos reales."
      },
      "brands": {
        "list": true,
        "default": [
          {
            "classes": "text-xl md:text-2xl font-black font-serif",
            "title": "BRAND",
            "accent": "ONE",
            "color": "#2d2e81"
          },
          {
            "classes": "text-xl md:text-2xl font-black tracking-tighter",
            "title": "STUDIO",
            "accent": ".",
            "color": "#fa7202"
          },
          {
            "classes": "text-xl md:text-2xl font-bold italic text-gray-600",
            "title": "NaturaEcuador",
            "accent": "",
            "color": "#2d2e81"
          },
          {
            "classes": "text-xl md:text-2xl font-black font-mono",
            "title": "Tech",
            "accent": "Corp",
            "color": "#7dd958"
          }
        ],
        "items": {
          "classes": {
            "default": "text-xl md:text-2xl font-black font-serif"
          },
          "title": {
            "default": "BRAND"
          },
          "accent": {
            "default": "ONE"
          },
          "color": {
            "default": "#2d2e81"
          }
        }
      }
    },
    "cta": {
      "ctaBadge": {
        "default": "Disponibilidad Inmediata"
      },
      "ctaTitleLine1": {
        "default": "¿Listo para dar el"
      },
      "ctaHighlight": {
        "default": "siguiente paso?"
      },
      "ctaSubtitle": {
        "default": "Digitaliza y promociona tu negocio hoy mismo. No dejes que tu competencia se quede con los clientes que te buscan."
      },
      "cardTitle": {
        "default": "Hablemos ahora"
      },
      "cardSubtitle": {
        "default": "Te asesoramos sin compromiso sobre la mejor estrategia para ti."
      },
      "whatsappNumber": {
        "default": "593000000000"
      },
      "whatsappButtonText": {
        "default": "Iniciar chat"
      }
    },
    "footer": {
      "brandUrl": {
        "default": "#"
      },
      "brandInitial": {
        "default": "G"
      },
      "brand": {
        "default": "Graduate."
      },
      "brandDesc": {
        "default": "Agencia y academia de marketing digital. Transformamos la manera en que los negocios crecen y se comunican en Ecuador."
      },
      "socials": {
        "list": true,
        "default": [
          {
            "icon": "fa-brands fa-facebook-f",
            "url": "#",
            "hover": "hover:bg-[#2d2e81] hover:border-[#2d2e81]"
          },
          {
            "icon": "fa-brands fa-instagram",
            "url": "#",
            "hover": "hover:bg-gradient-to-tr hover:from-orange-500 hover:to-pink-500 hover:border-transparent"
          },
          {
            "icon": "fa-brands fa-whatsapp text-lg",
            "url": "#",
            "hover": "hover:bg-[#7dd958] hover:border-[#7dd958]"
          },
          {
            "icon": "fa-brands fa-tiktok",
            "url": "#",
            "hover": "hover:bg-black hover:border-black"
          }
        ],
        "items": {
          "icon": {
            "default": "fa-brands fa-facebook-f"
          },
          "url": {
            "default": "#"
          },
          "hover": {
            "default": "hover:bg-[#2d2e81] hover:border-[#2d2e81]"
          },
          "label": {
            "default": "social"
          }
        }
      },
      "navTitle": {
        "default": "Navegación"
      },
      "navLinks": {
        "list": true,
        "default": [
          {
            "label": "Inicio",
            "url": "#inicio"
          },
          {
            "label": "Nuestra Esencia",
            "url": "#nosotros"
          },
          {
            "label": "Servicios",
            "url": "#servicios"
          },
          {
            "label": "Academia",
            "url": "#academia"
          }
        ],
        "items": {
          "label": {
            "default": "Inicio"
          },
          "url": {
            "default": "#inicio"
          }
        }
      },
      "contactTitle": {
        "default": "Contacto"
      },
      "locationTitle": {
        "default": "Quito, Ecuador"
      },
      "locationSub": {
        "default": "Servicio remoto a nivel nacional."
      },
      "phoneTel": {
        "default": "+593000000000"
      },
      "phone": {
        "default": "+593 99 999 9999"
      },
      "email": {
        "default": "hola@graduate.com.ec"
      },
      "copyright": {
        "default": "© 2026 Academia Graduate. Todos los derechos reservados."
      },
      "legalLinks": {
        "list": true,
        "default": [
          {
            "label": "Términos de Servicio",
            "url": "#"
          },
          {
            "label": "Privacidad",
            "url": "#"
          }
        ],
        "items": {
          "label": {
            "default": "Términos de Servicio"
          },
          "url": {
            "default": "#"
          }
        }
      },
      "reviewLinkText": {
        "default": "Dejar una reseña"
      },
      "giantText": {
        "default": "GRADUATE"
      }
    }
  },
  "urban-noir": {
    "checkout": {
      "coTitle": {
        "default": "Checkout"
      },
      "coSubtitle": {
        "default": "Revisa tu pedido, completa tus datos y elige cómo pagar."
      },
      "coEmptyText": {
        "default": "Tu carrito está vacío"
      },
      "coBackText": {
        "default": "Volver a la tienda"
      },
      "coTotalLabel": {
        "default": "Total a pagar"
      },
      "coDeliveryTitle": {
        "default": "Datos de entrega"
      },
      "coPaymentTitle": {
        "default": "Método de pago"
      },
      "coCodTitle": {
        "default": "Pago contra entrega"
      },
      "coCodDesc": {
        "default": "Abona en efectivo cuando recibas tu pedido en la dirección indicada."
      },
      "coPaypalDesc": {
        "default": "Pago seguro con tu cuenta de PayPal."
      },
      "coPayphoneDesc": {
        "default": "Paga con tarjeta (Visa, Mastercard, Diners, Discover) o Saldo Payphone sin salir de la página."
      },
      "coConfirmText": {
        "default": "Confirmar pedido"
      },
      "coPaypalTitle": {
        "default": "Pago con PayPal"
      },
      "coPaypalNote": {
        "default": "Se abrirá PayPal para completar el pago de forma segura."
      },
      "coPayphoneTitle": {
        "default": "Pago con Payphone"
      },
      "coPayphoneNote": {
        "default": "Paga con tarjeta de crédito, débito o Saldo Payphone. No saldrás de la página."
      },
      "coSuccessTitle": {
        "default": "Pedido recibido"
      },
      "coRegisteredText": {
        "default": "fue registrado con éxito."
      },
      "coCodSuccess": {
        "default": "Pagarás en efectivo al recibirlo. Te contactaremos en breve para coordinar la entrega."
      },
      "coContinueText": {
        "default": "Seguir comprando"
      }
    },
    "header": {
      "links": {
        "list": true,
        "default": [
          {
            "label": "Inicio",
            "url": "/"
          },
          {
            "label": "Catálogo",
            "url": "#catalogo"
          },
          {
            "label": "Promos",
            "url": "#promociones"
          },
          {
            "label": "Nosotros",
            "url": "#beneficios"
          }
        ],
        "items": {
          "label": {
            "default": "Inicio"
          },
          "url": {
            "default": "/"
          },
          "children": {
            "list": true,
            "default": [],
            "items": {
              "label": {},
              "url": {}
            }
          },
          "highlight": {}
        }
      },
      "layout": {
        "default": ""
      },
      "headerStyle": {
        "default": ""
      },
      "sticky": {},
      "logoSize": {},
      "showCart": {},
      "showSearch": {},
      "searchUrl": {
        "default": "#catalogo"
      },
      "logoImage": {},
      "logoText": {
        "default": "URBAN NOIR"
      },
      "hideLogoText": {},
      "announcement": {},
      "announcementStyle": {},
      "announcementUrl": {}
    },
    "hero": {
      "backgroundImage": {
        "default": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2048&auto=format&fit=crop"
      },
      "kicker": {},
      "title": {
        "default": "REDEFINE YOUR STREETS"
      },
      "subtitle": {},
      "buttonText": {},
      "buttonUrl": {
        "default": "#catalogo"
      },
      "slides": {
        "list": true,
        "default": [],
        "items": {
          "backgroundImage": {},
          "kicker": {},
          "title": {
            "default": ""
          },
          "subtitle": {},
          "buttonText": {},
          "buttonUrl": {
            "default": "#catalogo"
          }
        }
      },
      "autoplaySeconds": {
        "default": 6
      },
      "imageColor": {},
      "imageOpacity": {
        "default": 60
      }
    },
    "features": {
      "items": {
        "list": true,
        "default": [],
        "items": {
          "image": {},
          "link": {
            "default": "#"
          },
          "title": {},
          "desc": {}
        }
      },
      "layout": {},
      "title": {
        "default": "Catálogo"
      },
      "linkText": {},
      "linkUrl": {
        "default": "#"
      },
      "subtitle": {}
    },
    "cta": {
      "newsletter": {},
      "title": {
        "default": "ÚNETE AL CLUB"
      },
      "subtitle": {},
      "placeholder": {
        "default": "TU CORREO ELECTRÓNICO"
      },
      "buttonText": {
        "default": "Suscribirse"
      },
      "watermark": {
        "default": "SALE SALE SALE"
      },
      "kicker": {},
      "buttonUrl": {
        "default": "#"
      },
      "backgroundImage": {},
      "imageAlt": {
        "default": "Promociones"
      }
    },
    "portfolio": {
      "items": {
        "list": true,
        "default": [],
        "items": {
          "tag": {
            "default": ""
          },
          "image": {},
          "title": {},
          "id": {},
          "price": {},
          "link": {},
          "desc": {},
          "compareAt": {}
        }
      },
      "currency": {
        "default": "$"
      },
      "title": {
        "default": "MÁS BUSCADOS"
      },
      "subtitle": {},
      "addToCartText": {
        "default": "Añadir al carrito"
      },
      "buttonText": {},
      "buttonUrl": {
        "default": "#"
      }
    },
    "benefits": {
      "items": {
        "list": true,
        "default": [
          {
            "icon": "🚚",
            "title": "Envío Gratis",
            "desc": "En todas las órdenes superiores a $100. Entregas express disponibles globalmente."
          },
          {
            "icon": "🛡️",
            "title": "Calidad Premium",
            "desc": "Materiales seleccionados meticulosamente para garantizar durabilidad y confort."
          },
          {
            "icon": "💳",
            "title": "Pagos Seguros",
            "desc": "Procesamiento cifrado y múltiples opciones de pago internacional para tu tranquilidad."
          }
        ],
        "items": {
          "icon": {
            "default": "🚚"
          },
          "title": {
            "default": "Envío Gratis"
          },
          "desc": {
            "default": "En todas las órdenes superiores a $100. Entregas express disponibles globalmente."
          }
        }
      }
    },
    "footer": {
      "companyName": {
        "default": "URBAN NOIR"
      },
      "columns": {
        "list": true,
        "default": [
          {
            "title": "Tienda",
            "links": [
              {
                "label": "Hombres",
                "url": "#"
              },
              {
                "label": "Mujeres",
                "url": "#"
              },
              {
                "label": "Accesorios",
                "url": "#"
              },
              {
                "label": "Novedades",
                "url": "#"
              },
              {
                "label": "Ofertas",
                "url": "#"
              }
            ]
          },
          {
            "title": "Ayuda",
            "links": [
              {
                "label": "FAQ",
                "url": "#"
              },
              {
                "label": "Envíos y Devoluciones",
                "url": "#"
              },
              {
                "label": "Rastreo de Pedido",
                "url": "#"
              },
              {
                "label": "Guía de Tallas",
                "url": "#"
              },
              {
                "label": "Contacto",
                "url": "#"
              }
            ]
          }
        ],
        "items": {
          "title": {
            "default": "Tienda"
          },
          "links": {
            "default": [
              {
                "label": "Hombres",
                "url": "#"
              },
              {
                "label": "Mujeres",
                "url": "#"
              },
              {
                "label": "Accesorios",
                "url": "#"
              },
              {
                "label": "Novedades",
                "url": "#"
              },
              {
                "label": "Ofertas",
                "url": "#"
              }
            ],
            "list": true,
            "items": {
              "url": {},
              "label": {}
            }
          }
        }
      },
      "social": {
        "list": true,
        "default": [
          {
            "label": "Instagram",
            "url": "#"
          },
          {
            "label": "Twitter",
            "url": "#"
          }
        ],
        "items": {
          "label": {
            "default": "Instagram"
          },
          "url": {
            "default": "#"
          },
          "network": {}
        }
      },
      "copyright": {},
      "logoImage": {},
      "description": {
        "default": "Definiendo la estética de la calle contemporánea. Menos ruido, más actitud. Diseñado para el individuo moderno."
      },
      "socialTitle": {
        "default": "Síguenos"
      },
      "legalLinks": {
        "list": true,
        "default": [
          {
            "label": "Privacidad",
            "url": "#"
          },
          {
            "label": "Términos",
            "url": "#"
          }
        ],
        "items": {
          "label": {
            "default": "Privacidad"
          },
          "url": {
            "default": "#"
          }
        }
      }
    }
  },
  "generic": {
    "hero": {
      "backgroundImage": {},
      "kicker": {},
      "title": {
        "default": ""
      },
      "subtitle": {},
      "buttonText": {},
      "buttonUrl": {
        "default": "#"
      },
      "secondaryButtonText": {},
      "secondaryButtonUrl": {
        "default": "#"
      }
    },
    "services": {
      "title": {
        "default": "Servicios"
      },
      "items": {
        "list": true,
        "default": [],
        "items": {
          "title": {
            "default": ""
          },
          "desc": {
            "default": ""
          }
        }
      }
    },
    "faq": {
      "title": {
        "default": "Preguntas Frecuentes"
      },
      "items": {
        "list": true,
        "default": [],
        "items": {
          "question": {
            "default": ""
          },
          "answer": {
            "default": ""
          }
        }
      }
    },
    "cta": {
      "title": {
        "default": ""
      },
      "subtitle": {
        "default": ""
      },
      "buttonText": {},
      "buttonUrl": {
        "default": "#"
      }
    },
    "testimonials": {
      "items": {
        "list": true,
        "default": [],
        "items": {
          "role": {
            "default": ""
          },
          "quote": {
            "default": ""
          },
          "name": {
            "default": ""
          }
        }
      },
      "source": {},
      "emptyTitle": {
        "default": "No hay testimonios"
      },
      "emptyText": {
        "default": "Aún no hay reseñas publicadas."
      },
      "columns": {
        "default": 3
      },
      "carousel": {},
      "title": {
        "default": "Testimonios"
      },
      "subtitle": {}
    },
    "review-form": {
      "title": {
        "default": "Déjanos tu opinión"
      },
      "subtitle": {
        "default": "Valoramos tu experiencia con nosotros"
      },
      "ratingLabel": {
        "default": "Calificación"
      },
      "nameLabel": {
        "default": "Tu nombre"
      },
      "emailLabel": {
        "default": "Tu correo (Opcional)"
      },
      "commentLabel": {
        "default": "Comentario"
      },
      "submitText": {
        "default": "Enviar opinión"
      }
    },
    "gallery": {
      "images": {
        "list": true,
        "default": [],
        "items": {
          "url": {
            "default": ""
          },
          "alt": {
            "default": ""
          }
        }
      },
      "title": {
        "default": "Galería"
      }
    },
    "header": {
      "logoType": {
        "default": "text"
      },
      "logoImage": {},
      "logoText": {
        "default": "Logo"
      },
      "ctaText": {},
      "ctaUrl": {
        "default": "#"
      },
      "links": {
        "list": true,
        "default": [],
        "items": {
          "url": {
            "default": "#"
          },
          "label": {
            "default": ""
          }
        }
      }
    },
    "footer": {
      "companyName": {
        "default": ""
      },
      "description": {
        "default": ""
      },
      "columns": {
        "list": true,
        "default": [],
        "items": {
          "title": {
            "default": ""
          },
          "links": {
            "list": true,
            "default": [],
            "items": {
              "url": {
                "default": "#"
              },
              "label": {
                "default": ""
              }
            }
          }
        }
      },
      "copyright": {
        "default": ""
      },
      "reviewLinkText": {
        "default": "Dejar una reseña"
      }
    },
    "about": {
      "title": {
        "default": ""
      },
      "description": {
        "default": ""
      },
      "buttonText": {},
      "buttonUrl": {
        "default": "#"
      },
      "imageUrl": {}
    },
    "contact": {
      "fields": {
        "list": true,
        "default": [
          {
            "label": "Nombre",
            "type": "text",
            "name": "name"
          },
          {
            "label": "Email",
            "type": "email",
            "name": "email"
          },
          {
            "label": "Mensaje",
            "type": "textarea",
            "name": "message"
          }
        ],
        "items": {
          "label": {
            "default": "Nombre"
          },
          "type": {
            "default": "text"
          },
          "name": {
            "default": "name"
          },
          "required": {}
        }
      },
      "title": {
        "default": "Contacto"
      },
      "subtitle": {},
      "buttonText": {
        "default": "Enviar"
      }
    },
    "whatsapp": {
      "phone": {
        "default": "521234567890"
      },
      "message": {
        "default": "Hola"
      },
      "position": {},
      "size": {
        "default": 56
      },
      "color": {
        "default": "#25D366"
      },
      "tooltip": {
        "default": "Chatea con nosotros"
      }
    },
    "pricing": {
      "title": {
        "default": "Nuestros planes"
      },
      "subtitle": {},
      "plans": {
        "list": true,
        "default": [],
        "items": {
          "features": {
            "list": true,
            "default": []
          },
          "highlighted": {},
          "name": {
            "default": "Plan"
          },
          "price": {
            "default": "$0"
          },
          "description": {},
          "buttonText": {},
          "buttonUrl": {
            "default": "#"
          }
        }
      }
    },
    "team": {
      "title": {
        "default": "Nuestro equipo"
      },
      "subtitle": {},
      "members": {
        "list": true,
        "default": [],
        "items": {
          "image": {},
          "name": {
            "default": ""
          },
          "role": {
            "default": ""
          },
          "bio": {}
        }
      }
    },
    "features": {
      "kicker": {},
      "title": {
        "default": "¿Por qué elegirnos?"
      },
      "subtitle": {},
      "items": {
        "list": true,
        "default": [],
        "items": {
          "icon": {},
          "title": {
            "default": ""
          },
          "desc": {
            "default": ""
          }
        }
      }
    },
    "benefits": {
      "kicker": {},
      "title": {
        "default": "¿Por qué elegirnos?"
      },
      "subtitle": {},
      "items": {
        "list": true,
        "default": [],
        "items": {
          "icon": {},
          "title": {
            "default": ""
          },
          "desc": {
            "default": ""
          }
        }
      }
    },
    "process": {
      "kicker": {},
      "title": {
        "default": "¿Por qué elegirnos?"
      },
      "subtitle": {},
      "items": {
        "list": true,
        "default": [],
        "items": {
          "icon": {},
          "title": {
            "default": ""
          },
          "desc": {
            "default": ""
          }
        }
      }
    },
    "form": {
      "fields": {
        "list": true,
        "default": [],
        "items": {
          "type": {
            "default": "text"
          },
          "name": {
            "default": "message"
          },
          "label": {},
          "required": {}
        }
      },
      "title": {
        "default": "Contáctanos"
      },
      "subtitle": {},
      "buttonText": {
        "default": "Enviar"
      }
    },
    "image": {
      "alignment": {
        "default": "center"
      },
      "url": {
        "default": ""
      },
      "alt": {
        "default": ""
      },
      "link": {},
      "caption": {}
    },
    "video": {
      "autoplay": {},
      "aspectRatio": {
        "default": "16/9"
      },
      "title": {
        "default": "Video"
      },
      "url": {
        "default": ""
      }
    },
    "stats": {
      "subtitle": {},
      "title": {},
      "items": {
        "list": true,
        "default": [],
        "items": {
          "value": {
            "default": ""
          },
          "suffix": {
            "default": ""
          },
          "label": {
            "default": ""
          },
          "desc": {}
        }
      }
    },
    "portfolio": {
      "kicker": {},
      "title": {
        "default": "Portafolio"
      },
      "subtitle": {},
      "items": {
        "list": true,
        "default": [],
        "items": {
          "tag": {
            "aliasOf": "category"
          },
          "category": {
            "default": ""
          },
          "link": {
            "default": "#"
          },
          "image": {},
          "title": {
            "default": ""
          },
          "desc": {}
        }
      }
    },
    "timeline": {
      "eyebrow": {
        "aliasOf": "timelineEyebrow"
      },
      "timelineEyebrow": {
        "default": ""
      },
      "titleLine1": {
        "aliasOf": "timelineTitleLine1"
      },
      "title": {
        "aliasOf": "timelineTitleLine1"
      },
      "timelineTitleLine1": {
        "default": ""
      },
      "titleHighlight": {
        "aliasOf": "timelineHighlight"
      },
      "timelineHighlight": {
        "default": ""
      },
      "items": {
        "list": true,
        "default": [],
        "items": {
          "year": {},
          "title": {
            "default": ""
          },
          "desc": {}
        }
      }
    },
    "clients": {
      "items": {
        "list": true,
        "items": {
          "image": {},
          "alt": {
            "default": ""
          }
        }
      },
      "clients": {},
      "clientsTitle": {
        "aliasOf": "title"
      },
      "title": {
        "default": ""
      }
    }
  }
};
