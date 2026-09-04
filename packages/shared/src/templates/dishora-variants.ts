/* eslint-disable */

// Shared head: fonts + custom CSS that the template relies on.
// Injected once via the header block so it also works in the editor build.
const DISHORA_FONTS =
  '<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=Cormorant+Garamond:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700&family=Inter:wght@400;500;600&family=Prata&display=swap" rel="stylesheet" />';

const DISHORA_STYLE = `<style>
  .hero-title {
    font-family: 'Playfair Display', Georgia, serif;
    letter-spacing: 0.04em;
    line-height: 1.08;
  }
  .brand-logo {
    font-family: 'Playfair Display', Georgia, serif;
    letter-spacing: 0.08em;
  }
  .font-serif-heading {
    font-family: 'Cormorant Garamond', serif;
    letter-spacing: 0.04em;
  }
  .stat-number {
    font-feature-settings: 'lnum' 1;
    line-height: 1.05;
  }
  .stat-label {
    letter-spacing: 0.08em;
  }
  .play-button-btn {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease;
  }
  .play-button-btn:hover {
    transform: scale(1.08);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6), 0 0 25px rgba(255, 255, 255, 0.4);
  }
  .play-button-btn:active {
    transform: scale(0.96);
  }
  .features-heading {
    letter-spacing: 0.05em;
  }
  .badge-shadow {
    box-shadow: 0 4px 10px rgba(211, 65, 27, 0.2);
  }
  .font-dish-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    line-height: 1.25;
  }
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  .font-menu-title {
    font-family: 'Cormorant Garamond', serif;
    letter-spacing: 0.05em;
  }
  .font-dish-name {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 500;
  }
  .brand-title {
    font-family: 'Prata', serif;
    letter-spacing: 0.08em;
  }
  input::placeholder { color: #9c8e84 !important; font-weight: 400; }
  .menu-item-row:not(:last-child) { border-bottom: 1px solid #EFEFEF; }
</style>`;

// Reusable CSS classes for images that need background-position cropping.
// Each is defined below; they receive their URL via inline style so they are
// fully editable. We pre-declare the class to pin the crop values.
const dishImg = (url: string, cls: string, position: string, size: string) => {
  if (!url) return "";
  return url ? `background-image:url('${url}');background-position:${position};background-size:${size};background-repeat:no-repeat;` : "";
};

export function getDishoraHtml(type: string, c: any, apiBaseUrl?: string, site?: any): string | null {
  if (c.variant !== "dishora") return null;

  // Editable head/personalisation. We only emit fonts + style on the header
  // block so they appear once for the editor and published page.
  const head = type === "header" ? DISHORA_FONTS + DISHORA_STYLE : "";

  const C = {
    // Brand
    brand: c.brand || c.logoText || c.companyName || "DISHORA",
    brandUrl: c.logoUrl || "#",
    links: c.links || [],

    // Hero
    heroBg: c.backgroundImage || "https://images.unsplash.com/photo-1414235077428-338988a2e8c0?q=80&w=2940&auto=format&fit=crop",
    heroLeftTag: c.heroLeftTag || "SERVING CENTRAL FLORIDA",
    heroRightTag: c.heroRightTag || "ESTABLISHED 1996",
    heroTitle: c.title || "FLAVOURS<br/>THAT STAY",
    heroSubtitle: c.subtitle || "Experience delicious cuisine crafted with fresh ingredients and authentic recipes. Enjoy a welcoming atmosphere.",

    // Top bar
    topLeft: c.topLeft || "Mon-Wed: 11a-9p",
    topMiddle: c.topMiddle || "Thurs-Sat: 11a-10p",
    email: c.email || "reservations@disora.com",
    phone: c.phone || "123 456 7899",
    address: c.address || "296 Ridao Avenie Mor Berlin 251584",
    ctaText: c.ctaText || "Make a Reservation Online",
    ctaUrl: c.ctaUrl || "#reservation",
    ctaIcon: c.ctaIcon || "calendar",

    // Hero story
    chefsWords: c.chefsWords || "CHEF'S WORDS",
    storyTitle: c.storyTitle || "Restaurant History",
    storyP1: c.storyP1 || "Dinero is more than just fine dining—it's a celebration of craftsmanship, taste, &amp; timeless style. Since our inception, we've redefined luxury by delivering curated gastronomic experiences.",
    storyP2: c.storyP2 || "The 25,000 or so visitors who descend on Spitalfields Market every week are greeted warmly by the artists.",
    storyImgBack: c.storyImgBack || "https://lh3.googleusercontent.com/aida-public/AB6AXuDD2v0O0947ybqAAR3SPYtOXNC5kjWvQj8t_XhCb6QEWUFRQkqQ6bDzv8I0xtjFvBdzqkvFBMxBJ2yK46E-geZysNo68ljzW9maK57Njgjks52r4WjxOf0HfGhKvL0QlMTYrp-zsP43Pc9vgMNalDnyQRcTWfJMltXkOBfHcd6QsiLKGOrxGXAp_QFZ50cNig1CfZBOvjjaqaGaUbCDpiuJt1TkGFLcU85estMlFa2gljRLU5n0WU02",
    storyImgFront: c.storyImgFront || "https://lh3.googleusercontent.com/aida-public/AB6AXuC5EzMmXP1SC6cpD12qOujiBcR2O4V2lKPyJgNfocHshhdn9P-jktKUng1rT2VMjJw5V5UqdD8-YbnRn9aIAXxuKQhhgtBZM2-1-ktchL-qCLMfxCcdPjyMxhkZK62D7mS2ZKi9aHe9AV86xQYtlXYq76legbSw5mZ965qyGigUpox2a3Jl8N-8AXkdnYW4VpL_1iI3S2PecvDf5dQpgPHBxXQHtOE0Ng0dKuCP8glwTXefMEiHe2_w",

    // Info columns
    visitTitle: c.visitTitle || "Visit Us",
    visitLines: c.visitLines || ["PIAZZA DELLA SIGNORIA, 12", "21562 . FIRENZE . ITALY"],
    hoursTitle: c.hoursTitle || "Opening Hours",
    hoursLines: c.hoursLines || ["MON – FRI : 7:00 AM – 22:00 PM", "SAT-SUN: 8:00 AM – 23:00 PM"],
    followTitle: c.followTitle || "Follow Us",
    featurePreviewImg: c.featurePreviewImg || "https://lh3.googleusercontent.com/aida-public/AB6AXuDnZk8dyi8yyL0ngbYLqbWWVbQ8X7M7sNsew1niUs6M8ftzfpWFjsAFoARRz1EEEmfGD27PlhU1_Y63xJ0Aix3iFi045WTY7fAWrFcpbudW-Zh1jU5mk3G4fDRq4QsCdjw62sd74h4g2JJbgzAhDeN8rd41P8IYQKiKrOnGsxt1_wlayeUEFWm-OOBMfAH5ZYjIKtNAmRzICQHBE2sgUGc2wwK_SuP8obX1ByIwmre-OYjZEbev7hvG",

    // Stats
    stats: c.stats || [
      { value: "180+", label: "PROJECTS LAUNCHED" },
      { value: "95%", label: "CLIENT SATISFACTION" },
      { value: "50+", label: "WORKSHOPS HOSTED" },
      { value: "12", label: "AWARDS WON" },
    ],

    // Video banner
    videoBg: c.videoBg || "https://lh3.googleusercontent.com/aida-public/AB6AXuAbBBd_nZgoQA-RmV2_Wba86yznp09I3ihn1Xc_DwVjJ-zJ_09oY1ci9Qhgsj5PghCtPXy-lm17yMxgYhCQqWeArc4SEUMBcZXeEBaVNj5ksMngQSJSWRGaTwR1Y2w4q81PVjNA_sTmk9_c4RaDvTGzkC3SrTvJ-MF_FK6PqoxrLqFsOa2BA4fIdiliXCArjs69-szAi4xG-Xy9LCu9BtzYoZvx7SoT6R2x6ZzwQAw4UVcqP9yFj0R7ZdhlC5YsEVYAwQ",
    videoUrl: c.videoUrl || "",

    // Features
    featuresEyebrow: c.featuresEyebrow || "FEATURES",
    featuresTitle: c.featuresTitle || "DISCOVER OUR UNIQUE FEATURES",
    features: c.features || c.items || [
      { icon: "check", category: "CHEF'S WORDS", title: "Pineapple Bliss Crush",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCWAYmKsD42yxaGWMokM8py3U-TMT2USgBO1N3uZQLwh3FMfPIe2aIyZgednDK-Z0Yn94ZxYp8WVH9QkPrxIH233KLPqPihw9N8oHiP3Xga0bGEiHPTlPYMUBAjufQCjZFGTcXf-cwBi3-s2Q-K5oLyrkrXI8O0f6xlaE7rkJASMkMrGpQfK8V5-uxygutggqq1I_j_qLKnx2Aw6BxA2RBEsN2VKhIlwBW3fG-SYJjwb2tVF4LSOBZL" },
      { icon: "check", category: "CULINARY INSIGHTS", title: "A Burst of Tropical Goodness",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAwqSbmgzqfJ6qjmGZLU8Mk7Bne9Ujla7rMz-MrNimlqIN3IKiO3HPIfuOR1oicfH63zY9g2eGI4VUz4K7JIVncAOEdUjlyuHfzhMLPP6gKpsrJjsj6MKmREC5d8C0CkLX8-NE6kvwJkBp8Q3q8-MH7cqGEIgvO8DnSpy7HrwDDUWknNwt1cBdHAJ84v6sAVYxlc-JCB8q7EsKrIlw01URBUkkwDd72KTkoGp6AlEAHxS71LeEBc3hG" },
      { icon: "check", category: "CULINARY INSIGHTS", title: "Tropical Flavor Sensation",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBlr8qjBOE1oCeQ5PMYiTIpgVJsows_Mhqrq5ZNoI-06AcjH4hPOQjzlzXHh4Wvx0g698jIQ3q1b_ZDKWhdGYbF4PllXw7890E1M3ByXgD0w7WcXdNs2UMD2TwWT3QrfKzzkt82X3jQv_2Gd5LXvfwXv0htn7TjNJAXFVm6DQLViKFwbJqnlIA70fnny_N--d4LOPB2HRVGirjB49DYBbMkUwfHU2eUiXqZxb15_bAcrovUhNztsy2C" },
    ],

    // Menu carousel
    menuEyebrow: c.menuEyebrow || "Chef's Words",
    menuTitle: c.menuTitle || "What's On The Menu",
    dishes: c.dishes || [
      { name: "Coconut Curry Spicy<br/>Delight", price: "$13.75", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAUhNHkol0t-FoHGlEy-8OgRt97OawMoTFBOSJ_j9hdW70MZGfcWEacT9qcIQn9BdxVXRIiaYZO_z8Ibm30lhB5A7Trqxj0LFup2XmqQ_ZPYwQftqfkgMWSvt80afGkIolndMgzsN8CH2LsgpBGriyTuQ6hl9f-aVlykz_IPBIZVzpYUwZclKMDZh7mlAejpTMVG1vQuAjkRQyyiIEdm-ztqnP9qI8wnlchsQWcbvYTt7e7QXyNuBYM" },
      { name: "Crushed Pineapple<br/>Sriracha", price: "$12.00", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDWm_vbZnpcWp1BVj1nFOeVQ52UpWFBWCOJmFOBO57hpYDNPS9MWHoFnHjVh4nTK9vFqF5548PmQQ0OYkBbOZZhu5KZFPz30y3tmX9WszsRgZFui50gpg5sCPXZenYTTmlswK6kbQy_ZAXG6l3Be-cnlIn0SZYCQnX1vWSnqEb6UOtuxyVVcdNVgR1jlQ_6elRgptmHghDZemymYhv3EqjAKepU9o-cmeGReump_yoGtW7RzUIIRRb5" },
      { name: "Roasted Beet Salad Feta<br/>&amp; Walnuts", price: "$8.50", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDt9UKPk0Nc-0EBljjxMqlR4fCg_UmNkU6ntBGQCSF07oX_pfWqZOuGOu0ehxph6XisXZ9L_TGNzcBZfA2SIxY8NiRQ83MHrqIjNQecMU35aisj3WATwuZwAIrbQd0jemqi_K_tfhvdTgGhK331OT3-AzmtOSucx9dZnZp6AoyUr07OlQY7OF8_AnJM-UhTw_JgYdLbTzxsi1_-XnSETToaTdfYMcB7ZmTPQXrBc-qNTwgDjDhlXRUE" },
      { name: "Crispy Kale Caesar<br/>Parmesan Crisp", price: "$12.50", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCG4sCuLDWv6gOD5U9J6K6HP3CpGgWHv86N4kpntThYHtB3TyQEcg1UERLxZ37WytPwNUiQwAsAZmPvVL_93i9r1KGVyLpYWX17XQRAgWMJSjMz9L7G749QqO-w87q6xYRHv96QqnwoAEP8uQJs128khr-9R3mT_wmJbah8Fke4MtbC90Bdz7DxuRnUnovxUcxrWSA137ElkCj2ltgMpZ9GdDsqXAdi6hOGJPKl452rZk9Axo0qXSpZ" },
      { name: "Spicy Saffron Shrimp<br/>Garlic Butter", price: "$20.75", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB2FY7WmJBqTnfAos0_M8rtIGa-MPTTLDzwfIgqsy_ezMzCYjCwtmd9gTwQ0gaRfxrmUUDov6bxJ9U7OWje8e0AvQMU5th-XfAncjhHyPn-GtvVrb5wun1MfsdXHhdbZwMOvDAHL76uOm-ieLMzrMNr24Zrigwxfa3RuEnZ_3s0_kvKCUN6HTVZiMJdGacfB5xrAWTKvO_liTl_orY-OAxsufm9QkiNJ4x6M_Aw5JZfD6KB15eZhuhw" },
      { name: "Tandoori Chicken Skewers<br/>Mint Yogurt Dip", price: "$16.50", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBinZ1NgseDcctjl7EUky2onYJ5hxSjtBVu8zxkbUAZPhwlN6zr-_Lcl6kTpwJRqRsiUWLx-BA9bag0T7xhoMAIAHm_Bxm9VIgXKCoCdy1_hwvAwOTndfvbuyLtq5kGd0SyK3mW7FvFXKIEkkKKUQgUhWlmgDUDVS9cOEy7Qy0qyeJpxaaaqUCS3VMIkVB-NYRQIOqDbdQUwl5GAjXQDGr0eqzBxcG_JRHa4WWA62ROf9espul_RBok" },
      { name: "Coconut Passion<br/>Sorbet", price: "$14.00", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBPi-8iH_WKyoi4W193rE30ryPRuODVZvvPu8FZUbaLoTLQ1FgYSjCkEK8iN3gXzkuSPo85qUgTFbrkElK-H08OU_J-ZzSlyDuFEVtxDGEf6fMocw9Z77yxkzzTKJUbHLCxmN91H0dOSTlmCujpqCD8hqCtYkpBaFK6ixno4ZC8m8c3ZnKRD9aRVN0X6jib9I3nyNj_k_89tR22Klg21QrVHKR5LjFL4H1p6EallXtSYkH7QnG2l_Ne" },
    ],
    menuCtaText: c.menuCtaText || "Explore The Full Menu",
    menuCtaUrl: c.menuCtaUrl || "#full-menu",
    menuCtaIcon: c.menuCtaIcon || "calendar",

    // Lunch menu
    lunchEyebrow: c.lunchEyebrow || "CHEF'S WORDS",
    lunchTitle: c.lunchTitle || "LUNCH MENU",
    lunchItems: c.lunchItems || [
      { name: "Tropical Acai Delight", desc: "Pure Unsweetened Acai Puree, Toppings, Yogurt", price: "$56.00", thumb: "https://lh3.googleusercontent.com/aida-public/AB6AXuDMQFVYMzxzsWVoX1lb0-ocygyhr642U2He0YMHujwxBRk6wNnZ1bWeuOXlurZPYT4N3A0rhU_W6O0iIc8lkgiaMhUJrzxaT9GwXWtaTn4bzrGMMR8_F0CN61ctV3jOPXA3qs9H6n1J6C1LwpXdZcvNXqfWCdLii9LCOmZLcYkNsZYX3cnNzncsE-TVHLW1V9IJPZoBYJ0RXApelAru8lAUjUOipKZrazYgyUDsECuyraeGzce97G6WLqtFY7TPrNDwhA", pos: "20.5% 36.5%", size: "1950%" },
      { name: "Berry Bliss Acai Bowl", desc: "Pure Unsweetened Acai Puree, Toppings, Yogurt", price: "$66.00", thumb: "https://lh3.googleusercontent.com/aida-public/AB6AXuDGAa2hR94TJIG2HnRqDO9dp2idVtF3o7Bc1uWCK6IDWr0f4ZJiyp9rNK0kmh2HcdBuRHl90u0-2u9GnglKKhm25ZKxhMF1KDXJRhbjNUn7Rtry70dULEinMiR_omvOa-Oqz4k20I0K2mzU66fyX_7KwvjopxYe2dNpaoTL86Xeyj91Kl23s6DF5UIrKPQHOjU7P6OE56tcUWnkIbg2q0QgWLw2tLRB8Ar3Rhf5vGv9WJf4IMYDCLoIQRoS99BIOmSQxQ", pos: "20.5% 53.5%", size: "1950%" },
      { name: "Coconut Dream Acai Bowl", desc: "Pure Unsweetened Acai Puree, Toppings, Yogurt", price: "$62.00", thumb: "https://lh3.googleusercontent.com/aida-public/AB6AXuAoKNkEX-lnQsi3JfAzVbi790gMlbBUrfLBwolE-7UgY615VgPkpeRZWC393F5JSQNHXe6Rih5J1qgTxSymGH6LsehGNWL0ulmQGdVisb_P-lSJZily0cOQq6bXHZuZJySI--UXwHsLwAAzI-QIIAYxceeSwRqsJt4miSAN2Q94RYKxBkXbXJ26b4b2c0Hgp7Vyg9Bd8NcqkhkZF_we69fqJQ-61ZPg_owu4GiQepDrntodfGnWcL9eM7Z6hLI8xrsjwg", pos: "20.5% 72.5%", size: "1950%" },
      { name: "Nutty Banana Acai Bowl", desc: "Pure Unsweetened Acai Puree, Toppings, Yogurt", price: "$60.00", thumb: "https://lh3.googleusercontent.com/aida-public/AB6AXuDoZEhvqyPPSlrQiaJMoPfGquQtmwAoNccR0E6Meu0wnkV5_Aoy5g9DtwjMpV7pzO_bskPowlwsLVPUn1eXb4zCoUN0F8zHvoCNFvc9Qh_iEKeWIjFLbj2xcuwn8Zg_7oytMwa3m6yCzgC0gw8uER1q1cupwLEIz4-hIRZuERISfTQY-n2-_8oBQAzLwdinXw8bBshnPdfZB-xB6m3rKuuk1x9aR5SiJOim7WsdSZazANOedhdGKegvWrVUUeCEUmNw", pos: "20.5% 90.5%", size: "1950%" },
    ],
    diningBg: c.diningBg || "https://lh3.googleusercontent.com/aida-public/AB6AXuDoeLuQNgrdeN3767l-YCeSsA6ckroxBn9zy-AWNm83FW5PCUWUvtdb1voXtP0eCUpE13LuYlpQ41lRcbKFqaMadol59xUaNW9mz8A4FhWv1YsewlGvGmEZtjUo7oVGOd-GW_JTT7L7c4TcOlOIWij8ZCQcXfvDuiivdwvxPHtI0Kd_nFqVzH1Q2ftIttqWyF7Fjf2WHpVqETBYDn3-vJFGNnnohxcaECkkoZNxc8fEkW9djzBrjh9Y1I2Y6tY8nFrl7A",
    diningBgPos: c.diningBgPos || "80% 50%",
    diningBgSize: c.diningBgSize || "215%",
    dishOverlapImg: c.dishOverlapImg || "https://lh3.googleusercontent.com/aida-public/AB6AXuCPj8DWfbb7H33mzCSClO1GbuAmQbSTY3PUMkwWM9YLkuPvJ0qpbGiMuYWGeRXeJlGgiQgECOxusns72CofAxDJanViqI07PhVvwzjzteoOsY2Ezs2wEX3M8KvkhHRkUg7x_GR4CP-HfnZLIK9GZtgjlzffrQu6em45gr9dGCPIXYFhZOCjBk8XbWlWGcM_A3y5Aua5kMhed_asxFSp3zL_ldIw7QpAozTkphDhW5dnaIYEjbr82hDfLm_CvdgDYdDx5g",
    dishOverlapPos: c.dishOverlapPos || "59% 58%",
    dishOverlapSize: c.dishOverlapSize || "320%",

    // Footer
    brandDesc: c.brandDesc || "Our master chefs craft each dish as a masterpiece, blending traditional culinary techniques with modern innovation. Whether it's an intimate dinner or a grand celebration,.",
    socials: c.socials || [
      { label: "Dishora on Facebook", href: "#facebook", icon: "<path d=\"M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z\"></path>" },
      { label: "Dishora on X", href: "#twitter", icon: "<path d=\"M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z\"></path>" },
      { label: "Dishora on YouTube", href: "#youtube", icon: "<path d=\"M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z\"></path>" },
      { label: "Dishora on Instagram", href: "#instagram", icon: "<path d=\"M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z\"></path>" },
    ],
    contactTitle: c.contactTitle || "CONTACT WITH US",
    contactPhone: c.contactPhone || "+1 (555) 019-2834",
    contactEmail: c.contactEmail || "booking@classicrest.com",
    openTitle: c.openTitle || "OPENING HOURS",
    openLines: c.openLines || ["Sun-Thurs: 11:30am – 11pm", "Every Fri-Sat (8pm onwards)"],
    locTitle: c.locTitle || "OUR LOCATION",
    locLines: c.locLines || ["5232 SW College Rd", "Ocala, FL 54654"],
    newsletterTitle: c.newsletterTitle || "SIGN UP FOR UPDATES, OFFERS, AND DELICIOUS SURPRISES",
    newsletterPlaceholder: c.newsletterPlaceholder || "Your Email....",
    copyright: c.copyright || "© 2026 Dishora. All Rights Reserved.",
  };

  const checkIcon = '<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round"></path></svg>';

  // Icons selectable for the reservation CTA button in the menu block.
  const reservationIcons: Record<string, string> = {
    calendar: '<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M4 18v3h2v-3h12v3h2v-3a2 2 0 00-2-2H6a2 2 0 00-2 2zm16-7h-1V6a2 2 0 00-2-2H7a2 2 0 00-2 2v5H4a2 2 0 00-2 2v2h20v-2a2 2 0 00-2-2zM7 6h10v5H7V6z"></path></svg>',
    "calendar-check": '<svg class="w-4 h-4 fill-none stroke-current" stroke-width="2" viewBox="0 0 24 24" fill="none"><path d="M8 2v4M16 2v4M3 8h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" stroke-linecap="round" stroke-linejoin="round"></path><path d="M9 15l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
    "arrow-right": '<svg class="w-4 h-4 fill-none stroke-current" stroke-width="2" viewBox="0 0 24 24" fill="none"><path d="M13 7l5 5m0 0l-5 5m5-5H6" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
    phone: '<svg class="w-4 h-4 fill-none stroke-current" stroke-width="2" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
    clock: '<svg class="w-4 h-4 fill-none stroke-current" stroke-width="2" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
    cutlery: '<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M11 2a1 1 0 011 1v5.5a1 1 0 01-2 0V3a1 1 0 011-1zm1 6.5V20a1 1 0 01-2 0V8.5a1 1 0 012 0zM7 3a1 1 0 012 0v7H7V3zm-3 8h8v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9zM17 4a3 3 0 013 3v14a1 1 0 01-2 0v-6h-2V7a3 3 0 011-3z"></path></svg>',
    "book-open": '<svg class="w-4 h-4 fill-none stroke-current" stroke-width="2" viewBox="0 0 24 24" fill="none"><path d="M4 19.5A2.5 2.5 0 016.5 17H20V4H6.5A2.5 2.5 0 004 6.5v13z" stroke-linecap="round" stroke-linejoin="round"></path><path d="M4 19.5A2.5 2.5 0 006.5 22H20v-5" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
    users: '<svg class="w-4 h-4 fill-none stroke-current" stroke-width="2" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
  };

  switch (type) {
    case "header": {
      const navLinks = C.links.length ? C.links : [
        { label: "Home", url: "#", dropdown: true },
        { label: "Menu", url: "#", dropdown: true },
        { label: "Pages", url: "#", dropdown: true },
        { label: "News", url: "#", dropdown: true },
        { label: "Contact", url: "#contact", dropdown: false },
      ];
      return `${head}
<header class="bg-white">
  <div class="w-full max-w-[1400px] mx-auto px-6 lg:px-12 pt-3 flex flex-wrap justify-between items-center gap-4 text-xs font-normal text-neutral-800">
    <div class="bg-white px-5 py-2.5 shadow-sm flex items-center space-x-2 tracking-wide text-[13px]">
      <span>${C.topLeft}</span>
      <span class="text-[#DA370D] text-[9px]">◆</span>
      <span>${C.topMiddle}</span>
    </div>
    <div class="bg-white px-6 py-2.5 shadow-sm flex flex-wrap items-center space-x-3 text-[13px] tracking-wide">
      <a class="hover:text-[#DA370D] transition-colors" href="mailto:${C.email}">${C.email}</a>
      <span class="text-[#DA370D] text-[9px]">◆</span>
      <a class="hover:text-[#DA370D] transition-colors" href="tel:${C.phone}">${C.phone}</a>
      <span class="text-[#DA370D] text-[9px]">◆</span>
      <span>${C.address}</span>
    </div>
  </div>
  <div class="w-full max-w-[1400px] mx-auto px-6 lg:px-12 mt-2.5">
    <div class="bg-white px-8 lg:px-10 py-4 shadow-md flex items-center justify-between">
      <a class="brand-logo text-3xl md:text-4xl font-black text-black tracking-wider uppercase" href="${C.brandUrl}">
        ${C.brand}
      </a>
      <nav class="hidden md:flex items-center space-x-8 text-[13px] font-semibold uppercase tracking-wider text-neutral-800">
        ${navLinks.map((l: any) => l.dropdown ? `
        <div class="relative group cursor-pointer flex items-center space-x-1 hover:text-[#DA370D] transition-colors">
          <span>${l.label}</span>
          <svg class="w-3.5 h-3.5 text-neutral-600 group-hover:text-[#DA370D] transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
        </div>` : `
        <a class="hover:text-[#DA370D] transition-colors" href="${l.url}">${l.label}</a>`).join("")}
      </nav>
      <div>
        <a class="inline-flex items-center space-x-2.5 bg-[#DA370D] hover:bg-[#c43009] text-white px-6 py-3 text-sm font-semibold tracking-wide transition duration-200 shadow-sm" href="${C.ctaUrl}">
          ${reservationIcons[C.ctaIcon] || reservationIcons.calendar}
          <span>${C.ctaText}</span>
        </a>
      </div>
    </div>
  </div>
</header>
<div class="bg-neutral-900"></div>`;
    }

    case "hero":
      return `
<section class="relative min-h-[850px] w-full flex flex-col justify-between overflow-hidden bg-neutral-900 text-white font-sans">
  <div class="absolute inset-0 z-0">
    <img alt="Dining ambiance" class="w-full h-full object-cover object-center transform scale-105 filter brightness-[0.78] contrast-[1.05]" src="${C.heroBg}"/>
    <div class="absolute inset-0 bg-black/35 backdrop-blur-[0.5px]"></div>
    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>
  </div>
  <div class="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-12 pt-28 pb-32 flex flex-col items-center text-center select-none">
    <div class="w-full flex items-center justify-center relative">
      <div class="hidden lg:flex items-center flex-1 justify-end pr-10">
        <span class="text-white text-sm font-bold tracking-[0.2em] whitespace-nowrap uppercase">${C.heroLeftTag}</span>
        <div class="w-16 h-[1.5px] bg-white/70 ml-4"></div>
      </div>
      <div class="px-4">
        <h1 class="hero-title text-white text-6xl sm:text-7xl md:text-8xl lg:text-[104px] font-normal tracking-tight uppercase leading-none drop-shadow-md">${C.heroTitle}</h1>
      </div>
      <div class="hidden lg:flex items-center flex-1 justify-start pl-10">
        <div class="w-16 h-[1.5px] bg-white/70 mr-4"></div>
        <span class="text-white text-sm font-bold tracking-[0.2em] whitespace-nowrap uppercase">${C.heroRightTag}</span>
      </div>
    </div>
    <div class="flex lg:hidden items-center justify-center space-x-6 mt-6 text-xs font-semibold tracking-widest text-neutral-300">
      <span>${C.heroLeftTag}</span><span>•</span><span>${C.heroRightTag}</span>
    </div>
    <p class="mt-8 text-neutral-200 text-base md:text-lg max-w-xl font-normal leading-relaxed tracking-wide px-4 drop-shadow">${C.heroSubtitle}</p>
  </div>
</section>`;

    case "hero-story":
      return `
<section class="bg-white text-[#4A4A4A] font-['Montserrat',sans-serif] antialiased py-16 px-6 sm:px-12 lg:px-20 flex flex-col justify-center items-center">
  <main class="w-full max-w-[1360px] mx-auto space-y-20 lg:space-y-28">
    <section class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
      <div class="lg:col-span-6 relative w-full h-[450px] sm:h-[500px]">
        <div class="absolute right-4 sm:right-12 top-0 w-[56%] h-[72%] overflow-hidden shadow-xl z-0">
          <img alt="Dining room" class="w-full h-full object-cover" src="${C.storyImgBack}"/>
        </div>
        <div class="absolute left-0 bottom-0 w-[65%] h-[78%] overflow-hidden shadow-2xl z-10">
          <img alt="Signature dish" class="w-full h-full object-cover" src="${C.storyImgFront}"/>
        </div>
      </div>
      <div class="lg:col-span-6 flex flex-col justify-center lg:pl-10 space-y-6">
        <div class="space-y-3">
          <span class="text-xs font-bold tracking-[0.2em] text-[#DE4B26] uppercase">${C.chefsWords}</span>
          <div class="w-[1.5px] h-9 bg-gray-300 ml-[1px]"></div>
        </div>
        <h1 class="text-4xl sm:text-5xl lg:text-[3.25rem] font-serif-heading font-normal uppercase text-black tracking-wide leading-tight">${C.storyTitle}</h1>
        <div class="space-y-5 text-sm sm:text-base leading-relaxed text-[#555555] font-light max-w-xl">
          <p>${C.storyP1}</p>
          <p>${C.storyP2}</p>
        </div>
      </div>
    </section>
    <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 items-start pt-6">
      <div class="lg:col-span-3 space-y-4">
        <div class="pb-3 border-b border-gray-200"><h2 class="text-xs font-bold uppercase tracking-wider text-black">${C.visitTitle}</h2></div>
        <address class="not-italic text-xs sm:text-[13px] text-[#555555] leading-relaxed tracking-wider uppercase font-medium space-y-1">
          ${C.visitLines.map((l: string) => `<p>${l}</p>`).join("")}
        </address>
      </div>
      <div class="lg:col-span-3 space-y-4">
        <div class="pb-3 border-b border-gray-200"><h2 class="text-xs font-bold uppercase tracking-wider text-black">${C.hoursTitle}</h2></div>
        <div class="text-xs sm:text-[13px] text-[#555555] leading-relaxed tracking-wider uppercase font-medium space-y-1">
          ${C.hoursLines.map((l: string) => `<p>${l}</p>`).join("")}
        </div>
      </div>
      <div class="lg:col-span-2 space-y-4">
        <div class="pb-3 border-b border-gray-200"><h2 class="text-xs font-bold uppercase tracking-wider text-black">${C.followTitle}</h2></div>
        <div class="flex items-center space-x-4 text-sm text-black">
          <a aria-label="Facebook" class="hover:text-neutral-500 transition-colors" href="#"><i class="fa-brands fa-facebook-f"></i></a>
          <a aria-label="Twitter" class="hover:text-neutral-500 transition-colors" href="#"><i class="fa-brands fa-twitter"></i></a>
          <a aria-label="Instagram" class="hover:text-neutral-500 transition-colors" href="#"><i class="fa-brands fa-instagram"></i></a>
          <a aria-label="LinkedIn" class="hover:text-neutral-500 transition-colors" href="#"><i class="fa-brands fa-linkedin-in"></i></a>
        </div>
      </div>
      <div class="md:col-span-2 lg:col-span-4">
        <div class="w-full h-48 sm:h-52 overflow-hidden shadow-sm">
          <img alt="Fine dining" class="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-700" src="${C.featurePreviewImg}"/>
        </div>
      </div>
    </section>
  </main>
</section>`;

    case "stats":
      return `
<section class="bg-white py-16 px-6 md:px-12 font-['Inter',sans-serif] antialiased">
  <div class="w-full max-w-7xl mx-auto">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 items-stretch justify-center">
      ${(C.stats || []).map((s: any) => `
      <div class="bg-[#F5F5F5] px-8 py-10 sm:py-12 flex flex-col justify-center min-h-[175px]">
        <div class="stat-number font-serif-heading text-[56px] lg:text-[64px] text-[#D44424] font-normal tracking-tight mb-3">${s.value || s.title}</div>
        <div class="stat-label text-xs md:text-[13px] font-medium text-[#1A1A1A] uppercase tracking-wider">${s.label || s.desc}</div>
      </div>`).join("")}
    </div>
  </div>
</section>`;

    case "video-banner": {
      const play = C.videoUrl
        ? `<a href="${C.videoUrl}" aria-label="Play dining experience video" target="_blank" rel="noopener" class="play-button-btn flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-white text-black rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.45),0_0_15px_rgba(255,255,255,0.2)]">
          <svg aria-hidden="true" class="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 translate-x-0.5 fill-black" viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20"></polygon></svg>
        </a>`
        : `<button aria-label="Play dining experience video" class="play-button-btn flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-white text-black rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.45),0_0_15px_rgba(255,255,255,0.2)]">
          <svg aria-hidden="true" class="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 translate-x-0.5 fill-black" viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20"></polygon></svg>
        </button>`;
      return `
<section class="bg-white text-stone-800 antialiased py-16 flex flex-col justify-center items-center">
  <main class="w-full flex justify-center items-center overflow-hidden">
    <div class="relative w-full max-w-[1920px] mx-auto overflow-hidden group select-none">
      <div class="relative w-full aspect-[1917/718] overflow-hidden bg-black flex items-center justify-center">
        <img alt="Private dining booth" class="w-full h-full object-cover object-center block" src="${C.videoBg}"/>
        <div aria-hidden="true" class="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/30 pointer-events-none"></div>
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          ${play}
        </div>
      </div>
    </div>
  </main>
</section>`;
    }

    case "features":
      return `
<section class="w-full bg-white py-16 md:py-24">
  <div class="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
    <div class="flex flex-col items-center justify-center text-center mb-14 md:mb-20">
      <span class="text-[#D3411B] font-semibold text-xs sm:text-sm tracking-[0.2em] uppercase mb-4 inline-block">${C.featuresEyebrow}</span>
      <div aria-hidden="true" class="w-[1px] h-8 bg-zinc-300 mb-6"></div>
      <h2 class="features-heading font-serifHeading text-2xl sm:text-3xl md:text-[2.6rem] font-normal text-zinc-900 tracking-wider uppercase">${C.featuresTitle}</h2>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch justify-center">
      ${(C.features || []).map((f: any) => `
      <div class="bg-[#F9F9F9] border border-[#E5E5E5] p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-md">
        <div>
          <div class="w-12 h-12 bg-[#D3411B] flex items-center justify-center text-white mb-8">${checkIcon}</div>
          <span class="text-[#D3411B] text-xs font-bold tracking-wider uppercase block mb-3">${f.category || f.label || ""}</span>
          <h3 class="font-serifTitle text-xl sm:text-[1.35rem] font-normal text-zinc-900 mb-6 leading-snug">${f.title || f.name || ""}</h3>
        </div>
        <div class="w-full aspect-[4/3] overflow-hidden bg-zinc-200 mt-2">
          <img alt="${f.title || 'feature'}" class="w-full h-full object-cover object-center transform hover:scale-105 transition duration-500" src="${f.image || f.url || ""}"/>
        </div>
      </div>`).join("")}
    </div>
  </div>
</section>`;

    case "menu":
      return `
<section class="w-full pt-14 pb-20 relative overflow-hidden bg-[#F3EFE7] text-[#191514]">
  <div class="text-center px-4 mb-10">
    <span class="text-[#DF4622] tracking-[0.2em] text-xs md:text-sm font-semibold uppercase block">${C.menuEyebrow}</span>
    <div aria-hidden="true" class="w-[1px] h-7 bg-stone-300 mx-auto my-3"></div>
    <h2 class="font-serif-heading text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] text-[#1E1917] uppercase font-normal tracking-[0.14em] mt-2">${C.menuTitle}</h2>
  </div>
  <div class="w-full relative px-0">
    <div class="flex items-start gap-4 sm:gap-6 overflow-x-auto no-scrollbar px-6 sm:px-10 lg:px-12 2xl:justify-center">
      ${(C.dishes || []).map((d: any) => `
      <article class="flex-none w-[260px] sm:w-[280px] text-center group cursor-pointer">
        <div class="w-full aspect-square overflow-hidden bg-[#E5DFD4] shadow-sm transition-transform duration-500 ease-out group-hover:shadow-md">
          <img alt="${d.name || 'dish'}" class="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105" loading="lazy" src="${d.image || d.url || ""}"/>
        </div>
        <div class="mt-4 px-2">
          <p class="text-xs font-semibold text-stone-800 tracking-wider mb-1.5 font-sans">${d.price || ""}</p>
          <h3 class="font-dish-title text-xl text-[#261D1A] font-medium leading-snug">${d.name || ""}</h3>
        </div>
      </article>`).join("")}
    </div>
  </div>
  <div class="mt-14 flex flex-col items-center justify-center text-center px-4">
    <div aria-hidden="true" class="w-[1.5px] h-12 bg-[#D96B4C] mb-6"></div>
    <a class="inline-flex items-center gap-2.5 bg-[#261D1A] hover:bg-[#17110F] text-white px-9 py-4 text-xs tracking-[0.18em] uppercase font-medium transition-colors duration-300 shadow-md hover:shadow-lg" href="${C.menuCtaUrl}">
      ${reservationIcons[C.menuCtaIcon] || reservationIcons.calendar}
      ${C.menuCtaText}
    </a>
  </div>
</section>`;

    case "lunch-menu":
      return `
<section class="w-full max-w-[1920px] mx-auto relative overflow-hidden flex flex-col justify-center py-10 lg:py-16 bg-white">
  <div class="grid grid-cols-1 lg:grid-cols-12 w-full">
    <section class="lg:col-span-6 pl-8 sm:pl-16 md:pl-24 lg:pl-32 pr-6 md:pr-12 flex flex-col justify-center z-10">
      <div class="mb-4">
        <span class="text-[#E64A19] font-medium text-xs md:text-[13px] tracking-wider uppercase font-sans block mb-3">${C.lunchEyebrow}</span>
        <div class="w-[1.5px] h-9 bg-zinc-300 ml-[1px]"></div>
      </div>
      <h1 class="font-menu-title text-4xl sm:text-5xl lg:text-[54px] text-zinc-900 tracking-wide font-normal mb-8 lg:mb-10 leading-none uppercase">${C.lunchTitle}</h1>
      <div class="space-y-0 w-full max-w-[560px]">
        ${(C.lunchItems || []).map((it: any) => `
        <article class="menu-item-row flex items-center justify-between py-5 group transition-colors duration-200">
          <div class="flex items-center space-x-5">
            <div class="w-[68px] h-[68px] flex-shrink-0 bg-stone-100 shadow-inner" style="${dishImg(it.thumb, "", it.pos || "20.5% 50%", it.size || "1950%")}"></div>
            <div>
              <h3 class="font-dish-name text-[21px] text-zinc-900 leading-snug">${it.name || ""}</h3>
              <p class="text-xs text-zinc-500 font-sans mt-1 tracking-normal">${it.desc || it.description || ""}</p>
            </div>
          </div>
          <span class="font-sans text-[15px] font-medium text-zinc-900 ml-4 flex-shrink-0">${it.price || ""}</span>
        </article>`).join("")}
      </div>
    </section>
    <section class="lg:col-span-6 relative mt-12 lg:mt-0 min-h-[480px] lg:min-h-[720px] flex items-center justify-end">
      <div class="w-full lg:w-[94%] h-[480px] lg:h-[720px] ml-auto relative" style="${dishImg(C.diningBg, "", C.diningBgPos, C.diningBgSize)}">
        <div aria-label="Signature plated dish" class="absolute -left-6 sm:-left-12 lg:-left-24 top-1/2 -translate-y-1/2 w-[280px] sm:w-[320px] lg:w-[380px] h-[340px] sm:h-[390px] lg:h-[460px] shadow-2xl z-20" style="${dishImg(C.dishOverlapImg, "", C.dishOverlapPos, C.dishOverlapSize)}"></div>
      </div>
    </section>
  </div>
</section>`;

    case "footer":
      return `
<footer class="w-full bg-[#1e1814] text-white border-t border-white/5 relative">
  <div class="max-w-[1720px] mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[380px]">
    <section class="lg:col-span-4 px-8 md:px-12 lg:px-16 py-14 flex flex-col justify-between border-b lg:border-b-0 border-white/10">
      <div>
        <h2 class="brand-title text-4xl lg:text-[42px] tracking-[0.14em] text-white font-normal uppercase mb-7 select-none">${C.brand}</h2>
        <p class="text-[#9e9287] text-[15px] leading-[1.68] max-w-[390px] font-normal font-sans">${C.brandDesc}</p>
      </div>
      <div class="flex items-center gap-3.5 mt-8 lg:mt-0">
        ${(C.socials || []).map((s: any) => `
        <a aria-label="${s.label || 'social'}" class="w-11 h-11 rounded-[4px] border border-white/15 hover:border-white/40 flex items-center justify-center text-[#c2b6ac] hover:text-white transition-colors duration-200" href="${s.href || "#"}">
          <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">${s.icon || ""}</svg>
        </a>`).join("")}
      </div>
    </section>
    <section class="lg:col-span-4 border-b lg:border-b-0 lg:border-l lg:border-r border-white/10 flex flex-col justify-between">
      <div class="px-8 md:px-10 py-8 flex items-center justify-between border-b border-white/10 flex-1">
        <h3 class="font-bold text-[14px] text-white uppercase tracking-wider font-sans">${C.contactTitle}</h3>
        <div class="text-right text-[#9e9287] text-[14px] leading-relaxed">
          <p class="hover:text-white transition-colors cursor-pointer">${C.contactPhone}</p>
          <p class="hover:text-white transition-colors cursor-pointer">${C.contactEmail}</p>
        </div>
      </div>
      <div class="px-8 md:px-10 py-8 flex items-center justify-between border-b border-white/10 flex-1">
        <h3 class="font-bold text-[14px] text-white uppercase tracking-wider font-sans">${C.openTitle}</h3>
        <div class="text-right text-[#9e9287] text-[14px] leading-relaxed">
          ${C.openLines.map((l: string) => `<p>${l}</p>`).join("")}
        </div>
      </div>
      <div class="px-8 md:px-10 py-8 flex items-center justify-between flex-1">
        <h3 class="font-bold text-[14px] text-white uppercase tracking-wider font-sans">${C.locTitle}</h3>
        <div class="text-right text-[#9e9287] text-[14px] leading-relaxed">
          ${C.locLines.map((l: string) => `<p>${l}</p>`).join("")}
        </div>
      </div>
    </section>
    <section class="lg:col-span-4 px-8 md:px-12 lg:px-14 py-14 flex flex-col justify-between">
      <div class="max-w-[420px] mx-auto lg:mx-0 w-full">
        <h3 class="font-bold text-[15px] md:text-[16px] leading-[1.4] text-white uppercase tracking-wide text-center lg:text-left mb-7 font-sans">${C.newsletterTitle}</h3>
        <div class="flex justify-center lg:justify-start">
          <div class="h-14 w-[1px] bg-white/20 ml-20 lg:ml-48"></div>
        </div>
      </div>
      <div class="mt-8 max-w-[420px] mx-auto lg:mx-0 w-full">
        <form class="relative flex items-center" onsubmit="event.preventDefault();">
          <label class="sr-only" for="dh-newsletter-email">Email address</label>
          <input class="w-full bg-[#40352c]/70 hover:bg-[#40352c]/90 focus:bg-[#483c32] text-white text-[14px] py-3.5 pl-5 pr-12 rounded-[4px] border-none outline-none ring-0 focus:ring-1 focus:ring-white/30 transition-all" id="dh-newsletter-email" placeholder="${C.newsletterPlaceholder}" required="" type="email"/>
          <button aria-label="Submit newsletter subscription" class="absolute right-3.5 text-[#d5cbc3] hover:text-white transition-colors p-1" type="submit">
            <svg class="w-4 h-4 stroke-current stroke-2 fill-none -rotate-12 transform" viewBox="0 0 24 24"><line x1="22" x2="11" y1="2" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
      </div>
    </section>
  </div>
  <div class="w-full border-t border-white/10 relative">
    <div class="max-w-[1720px] mx-auto px-8 md:px-12 lg:px-16 py-6 flex items-center justify-between">
      <p class="text-[14px] font-medium text-white/90 font-sans tracking-wide">${C.copyright}</p>
      <button aria-label="Scroll to top" class="w-11 h-11 rounded-full bg-[#d0451b] hover:bg-[#b83b14] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 flex-shrink-0" onclick="window.scrollTo({ top: 0, behavior: 'smooth' })">
        <svg class="w-5 h-5 stroke-current stroke-[2.4] fill-none" viewBox="0 0 24 24"><path d="M5 10l7-7m0 0l7 7m-7-7v18" stroke-linecap="round" stroke-linejoin="round"></path></svg>
      </button>
    </div>
  </div>
</footer>`;

    default:
      return null;
  }
}
