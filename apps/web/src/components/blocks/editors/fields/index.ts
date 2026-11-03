import type { ReactElement } from "react";
import type { FieldProps } from "./shared";
import { PageHeroFields } from "./page-hero";
import { MarqueeFields } from "./marquee";
import { AwarenessFields } from "./awareness";
import { HeroFields } from "./hero";
import { ServicesFields } from "./services";
import { FaqFields } from "./faq";
import { PortfolioGridFields } from "./portfolio-grid";
import { ContactSectionFields } from "./contact-section";
import { CtaFields } from "./cta";
import { ReviewFormFields } from "./review-form";
import { TestimonialsFields } from "./testimonials";
import { GalleryFields } from "./gallery";
import { HeaderFields } from "./header";
import { MenuFields } from "./menu";
import { LunchMenuFields } from "./lunch-menu";
import { FooterFields } from "./footer";
import { WhatsappFields } from "./whatsapp";
import { PricingFields } from "./pricing";
import { TimelineFields } from "./timeline";
import { TeamFields } from "./team";
import { FeaturesFields } from "./features";
import { ImageFields } from "./image";
import { VideoFields } from "./video";
import { AboutFields } from "./about";
import { ClientsFields } from "./clients";
import { StatsFields } from "./stats";
import { PortfolioFields } from "./portfolio";
import { BenefitsFields } from "./benefits";
import { ProcessFields } from "./process";
import { SorteoFormFields } from "./sorteo-form";
import { FormFields } from "./form";

/** Formulario de edición de cada tipo de bloque (un archivo por bloque). */
export const BLOCK_FIELDS: Record<string, (props: FieldProps) => ReactElement | null> = {
  "page-hero": PageHeroFields,
  "marquee": MarqueeFields,
  "awareness": AwarenessFields,
  "hero": HeroFields,
  "services": ServicesFields,
  "faq": FaqFields,
  "portfolio-grid": PortfolioGridFields,
  "contact-section": ContactSectionFields,
  "cta": CtaFields,
  "review-form": ReviewFormFields,
  "testimonials": TestimonialsFields,
  "gallery": GalleryFields,
  "header": HeaderFields,
  "menu": MenuFields,
  "lunch-menu": LunchMenuFields,
  "footer": FooterFields,
  "whatsapp": WhatsappFields,
  "pricing": PricingFields,
  "timeline": TimelineFields,
  "team": TeamFields,
  "features": FeaturesFields,
  "image": ImageFields,
  "video": VideoFields,
  "about": AboutFields,
  "agency": AboutFields,
  "clients": ClientsFields,
  "stats": StatsFields,
  "portfolio": PortfolioFields,
  "benefits": BenefitsFields,
  "process": ProcessFields,
  "sorteo-form": SorteoFormFields,
  "form": FormFields,
  "contact": FormFields,
};
