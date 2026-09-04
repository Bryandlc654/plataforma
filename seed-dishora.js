require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const IMG = {
  hero: "https://images.unsplash.com/photo-1414235077428-338988a2e8c0?q=80&w=2940&auto=format&fit=crop",
  storyBack: "https://lh3.googleusercontent.com/aida-public/AB6AXuDD2v0O0947ybqAAR3SPYtOXNC5kjWvQj8t_XhCb6QEWUFRQkqQ6bDzv8I0xtjFvBdzqkvFBMxBJ2yK46E-geZysNo68ljzW9maK57Njgjks52r4WjxOf0HfGhKvL0QlMTYrp-zsP43Pc9vgMNalDnyQRcTWfJMltXkOBfHcd6QsiLKGOrxGXAp_QFZ50cNig1CfZBOvjjaqaGaUbCDpiuJt1TkGFLcU85estMlFa2gljRLU5n0WU02",
  storyFront: "https://lh3.googleusercontent.com/aida-public/AB6AXuC5EzMmXP1SC6cpD12qOujiBcR2O4V2lKPyJgNfocHshhdn9P-jktKUng1rT2VMjJw5V5UqdD8-YbnRn9aIAXxuKQhhgtBZM2-1-ktchL-qCLMfxCcdPjyMxhkZK62D7mS2ZKi9aHe9AV86xQYtlXYq76legbSw5mZ965qyGigUpox2a3Jl8N-8AXkdnYW4VpL_1iI3S2PecvDf5dQpgPHBxXQHtOE0Ng0dKuCP8glwTXefMEiHe2_w",
  videoBg: "https://lh3.googleusercontent.com/aida-public/AB6AXuAbBBd_nZgoQA-RmV2_Wba86yznp09I3ihn1Xc_DwVjJ-zJ_09oY1ci9Qhgsj5PghCtPXy-lm17yMxgYhCQqWeArc4SEUMBcZXeEBaVNj5ksMngQSJSWRGaTwR1Y2w4q81PVjNA_sTmk9_c4RaDvTGzkC3SrTvJ-MF_FK6PqoxrLqFsOa2BA4fIdiliXCArjs69-szAi4xG-Xy9LCu9BtzYoZvx7SoT6R2x6ZzwQAw4UVcqP9yFj0R7ZdhlC5YsEVYAwQ",
  diningBg: "https://lh3.googleusercontent.com/aida-public/AB6AXuDoeLuQNgrdeN3767l-YCeSsA6ckroxBn9zy-AWNm83FW5PCUWUvtdb1voXtP0eCUpE13LuYlpQ41lRcbKFqaMadol59xUaNW9mz8A4FhWv1YsewlGvGmEZtjUo7oVGOd-GW_JTT7L7c4TcOlOIWij8ZCQcXfvDuiivdwvxPHtI0Kd_nFqVzH1Q2ftIttqWyF7Fjf2WHpVqETBYDn3-vJFGNnnohxcaECkkoZNxc8fEkW9djzBrjh9Y1I2Y6tY8nFrl7A",
  dishOverlap: "https://lh3.googleusercontent.com/aida-public/AB6AXuCPj8DWfbb7H33mzCSClO1GbuAmQbSTY3PUMkwWM9YLkuPvJ0qpbGiMuYWGeRXeJlGgiQgECOxusns72CofAxDJanViqI07PhVvwzjzteoOsY2Ezs2wEX3M8KvkhHRkUg7x_GR4CP-HfnZLIK9GZtgjlzffrQu6em45gr9dGCPIXYFhZOCjBk8XbWlWGcM_A3y5Aua5kMhed_asxFSp3zL_ldIw7QpAozTkphDhW5dnaIYEjbr82hDfLm_CvdgDYdDx5g",
  preview: "https://lh3.googleusercontent.com/aida-public/AB6AXuDnZk8dyi8yyL0ngbYLqbWWVbQ8X7M7sNsew1niUs6M8ftzfpWFjsAFoARRz1EEEmfGD27PlhU1_Y63xJ0Aix3iFi045WTY7fAWrFcpbudW-Zh1jU5mk3G4fDRq4QsCdjw62sd74h4g2JJbgzAhDeN8rd41P8IYQKiKrOnGsxt1_wlayeUEFWm-OOBMfAH5ZYjIKtNAmRzICQHBE2sgUGc2wwK_SuP8obX1ByIwmre-OYjZEbev7hvG",
};

const navLinks = [
  { label: "Home", url: "#", dropdown: true },
  { label: "Menu", url: "#", dropdown: true },
  { label: "Pages", url: "#", dropdown: true },
  { label: "News", url: "#", dropdown: true },
  { label: "Contact", url: "#contact", dropdown: false },
];

const tpl = {
  name: "Dishora Restaurant",
  description: "Plantilla premium para restaurantes y alta cocina con hero cinematográfico, estadísticas, carta, menú del día y footer completo con newsletter.",
  category: "Restaurantes",
  pages: [
    {
      name: "Inicio", slug: "home", path: "/", isDefault: true, sortOrder: 0,
      blocks: [
        { type: "header", content: { variant: "dishora", brand: "DISHORA", links: navLinks, topLeft: "Mon-Wed: 11a-9p", topMiddle: "Thurs-Sat: 11a-10p", email: "reservations@disora.com", phone: "123 456 7899", address: "296 Ridao Avenie Mor Berlin 251584", ctaText: "Make a Reservation Online", ctaUrl: "#reservation" }, sortOrder: 0 },
        { type: "hero", content: { variant: "dishora", backgroundImage: IMG.hero, heroLeftTag: "SERVING CENTRAL FLORIDA", heroRightTag: "ESTABLISHED 1996", title: "FLAVOURS<br/>THAT STAY", subtitle: "Experience delicious cuisine crafted with fresh ingredients and authentic recipes. Enjoy a welcoming atmosphere." }, sortOrder: 1 },
        { type: "hero-story", content: { variant: "dishora", chefsWords: "CHEF'S WORDS", storyTitle: "Restaurant History", storyP1: "Dinero is more than just fine dining—it's a celebration of craftsmanship, taste, &amp; timeless style. Since our inception, we've redefined luxury by delivering curated gastronomic experiences.", storyP2: "The 25,000 or so visitors who descend on Spitalfields Market every week are greeted warmly by the artists.", storyImgBack: IMG.storyBack, storyImgFront: IMG.storyFront }, sortOrder: 2 },
        { type: "stats", content: { variant: "dishora", stats: [{ value: "180+", label: "PROJECTS LAUNCHED" }, { value: "95%", label: "CLIENT SATISFACTION" }, { value: "50+", label: "WORKSHOPS HOSTED" }, { value: "12", label: "AWARDS WON" }] }, sortOrder: 3 },
        { type: "video-banner", content: { variant: "dishora", videoBg: IMG.videoBg, videoUrl: "" }, sortOrder: 4 },
        { type: "features", content: { variant: "dishora", featuresEyebrow: "FEATURES", featuresTitle: "DISCOVER OUR UNIQUE FEATURES", features: [
          { category: "CHEF'S WORDS", title: "Pineapple Bliss Crush", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCWAYmKsD42yxaGWMokM8py3U-TMT2USgBO1N3uZQLwh3FMfPIe2aIyZgednDK-Z0Yn94ZxYp8WVH9QkPrxIH233KLPqPihw9N8oHiP3Xga0bGEiHPTlPYMUBAjufQCjZFGTcXf-cwBi3-s2Q-K5oLyrkrXI8O0f6xlaE7rkJASMkMrGpQfK8V5-uxygutggqq1I_j_qLKnx2Aw6BxA2RBEsN2VKhIlwBW3fG-SYJjwb2tVF4LSOBZL" },
          { category: "CULINARY INSIGHTS", title: "A Burst of Tropical Goodness", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAwqSbmgzqfJ6qjmGZLU8Mk7Bne9Ujla7rMz-MrNimlqIN3IKiO3HPIfuOR1oicfH63zY9g2eGI4VUz4K7JIVncAOEdUjlyuHfzhMLPP6gKpsrJjsj6MKmREC5d8C0CkLX8-NE6kvwJkBp8Q3q8-MH7cqGEIgvO8DnSpy7HrwDDUWknNwt1cBdHAJ84v6sAVYxlc-JCB8q7EsKrIlw01URBUkkwDd72KTkoGp6AlEAHxS71LeEBc3hG" },
          { category: "CULINARY INSIGHTS", title: "Tropical Flavor Sensation", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBlr8qjBOE1oCeQ5PMYiTIpgVJsows_Mhqrq5ZNoI-06AcjH4hPOQjzlzXHh4Wvx0g698jIQ3q1b_ZDKWhdGYbF4PllXw7890E1M3ByXgD0w7WcXdNs2UMD2TwWT3QrfKzzkt82X3jQv_2Gd5LXvfwXv0htn7TjNJAXFVm6DQLViKFwbJqnlIA70fnny_N--d4LOPB2HRVGirjB49DYBbMkUwfHU2eUiXqZxb15_bAcrovUhNztsy2C" },
        ] }, sortOrder: 5 },
        { type: "menu", content: { variant: "dishora", menuEyebrow: "Chef's Words", menuTitle: "What's On The Menu", menuCtaText: "Explore The Full Menu", menuCtaUrl: "#full-menu", dishes: [
          { name: "Coconut Curry Spicy<br/>Delight", price: "$13.75", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAUhNHkol0t-FoHGlEy-8OgRt97OawMoTFBOSJ_j9hdW70MZGfcWEacT9qcIQn9BdxVXRIiaYZO_z8Ibm30lhB5A7Trqxj0LFup2XmqQ_ZPYwQftqfkgMWSvt80afGkIolndMgzsN8CH2LsgpBGriyTuQ6hl9f-aVlykz_IPBIZVzpYUwZclKMDZh7mlAejpTMVG1vQuAjkRQyyiIEdm-ztqnP9qI8wnlchsQWcbvYTt7e7QXyNuBYM" },
          { name: "Crushed Pineapple<br/>Sriracha", price: "$12.00", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDWm_vbZnpcWp1BVj1nFOeVQ52UpWFBWCOJmFOBO57hpYDNPS9MWHoFnHjVh4nTK9vFqF5548PmQQ0OYkBbOZZhu5KZFPz30y3tmX9WszsRgZFui50gpg5sCPXZenYTTmlswK6kbQy_ZAXG6l3Be-cnlIn0SZYCQnX1vWSnqEb6UOtuxyVVcdNVgR1jlQ_6elRgptmHghDZemymYhv3EqjAKepU9o-cmeGReump_yoGtW7RzUIIRRb5" },
          { name: "Roasted Beet Salad Feta<br/>&amp; Walnuts", price: "$8.50", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDt9UKPk0Nc-0EBljjxMqlR4fCg_UmNkU6ntBGQCSF07oX_pfWqZOuGOu0ehxph6XisXZ9L_TGNzcBZfA2SIxY8NiRQ83MHrqIjNQecMU35aisj3WATwuZwAIrbQd0jemqi_K_tfhvdTgGhK331OT3-AzmtOSucx9dZnZp6AoyUr07OlQY7OF8_AnJM-UhTw_JgYdLbTzxsi1_-XnSETToaTdfYMcB7ZmTPQXrBc-qNTwgDjDhlXRUE" },
          { name: "Crispy Kale Caesar<br/>Parmesan Crisp", price: "$12.50", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCG4sCuLDWv6gOD5U9J6K6HP3CpGgWHv86N4kpntThYHtB3TyQEcg1UERLxZ37WytPwNUiQwAsAZmPvVL_93i9r1KGVyLpYWX17XQRAgWMJSjMz9L7G749QqO-w87q6xYRHv96QqnwoAEP8uQJs128khr-9R3mT_wmJbah8Fke4MtbC90Bdz7DxuRnUnovxUcxrWSA137ElkCj2ltgMpZ9GdDsqXAdi6hOGJPKl452rZk9Axo0qXSpZ" },
          { name: "Spicy Saffron Shrimp<br/>Garlic Butter", price: "$20.75", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB2FY7WmJBqTnfAos0_M8rtIGa-MPTTLDzwfIgqsy_ezMzCYjCwtmd9gTwQ0gaRfxrmUUDov6bxJ9U7OWje8e0AvQMU5th-XfAncjhHyPn-GtvVrb5wun1MfsdXHhdbZwMOvDAHL76uOm-ieLMzrMNr24Zrigwxfa3RuEnZ_3s0_kvKCUN6HTVZiMJdGacfB5xrAWTKvO_liTl_orY-OAxsufm9QkiNJ4x6M_Aw5JZfD6KB15eZhuhw" },
          { name: "Tandoori Chicken Skewers<br/>Mint Yogurt Dip", price: "$16.50", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBinZ1NgseDcctjl7EUky2onYJ5hxSjtBVu8zxkbUAZPhwlN6zr-_Lcl6kTpwJRqRsiUWLx-BA9bag0T7xhoMAIAHm_Bxm9VIgXKCoCdy1_hwvAwOTndfvbuyLtq5kGd0SyK3mW7FvFXKIEkkKKUQgUhWlmgDUDVS9cOEy7Qy0qyeJpxaaaqUCS3VMIkVB-NYRQIOqDbdQUwl5GAjXQDGr0eqzBxcG_JRHa4WWA62ROf9espul_RBok" },
          { name: "Coconut Passion<br/>Sorbet", price: "$14.00", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBPi-8iH_WKyoi4W193rE30ryPRuODVZvvPu8FZUbaLoTLQ1FgYSjCkEK8iN3gXzkuSPo85qUgTFbrkElK-H08OU_J-ZzSlyDuFEVtxDGEf6fMocw9Z77yxkzzTKJUbHLCxmN91H0dOSTlmCujpqCD8hqCtYkpBaFK6ixno4ZC8m8c3ZnKRD9aRVN0X6jib9I3nyNj_k_89tR22Klg21QrVHKR5LjFL4H1p6EallXtSYkH7QnG2l_Ne" },
        ] }, sortOrder: 6 },
        { type: "lunch-menu", content: { variant: "dishora", lunchEyebrow: "CHEF'S WORDS", lunchTitle: "LUNCH MENU", diningBg: IMG.diningBg, dishOverlapImg: IMG.dishOverlap, lunchItems: [
          { name: "Tropical Acai Delight", desc: "Pure Unsweetened Acai Puree, Toppings, Yogurt", price: "$56.00", thumb: "https://lh3.googleusercontent.com/aida-public/AB6AXuDMQFVYMzxzsWVoX1lb0-ocygyhr642U2He0YMHujwxBRk6wNnZ1bWeuOXlurZPYT4N3A0rhU_W6O0iIc8lkgiaMhUJrzxaT9GwXWtaTn4bzrGMMR8_F0CN61ctV3jOPXA3qs9H6n1J6C1LwpXdZcvNXqfWCdLii9LCOmZLcYkNsZYX3cnNzncsE-TVHLW1V9IJPZoBYJ0RXApelAru8lAUjUOipKZrazYgyUDsECuyraeGzce97G6WLqtFY7TPrNDwhA", pos: "20.5% 36.5%", size: "1950%" },
          { name: "Berry Bliss Acai Bowl", desc: "Pure Unsweetened Acai Puree, Toppings, Yogurt", price: "$66.00", thumb: "https://lh3.googleusercontent.com/aida-public/AB6AXuDGAa2hR94TJIG2HnRqDO9dp2idVtF3o7Bc1uWCK6IDWr0f4ZJiyp9rNK0kmh2HcdBuRHl90u0-2u9GnglKKhm25ZKxhMF1KDXJRhbjNUn7Rtry70dULEinMiR_omvOa-Oqz4k20I0K2mzU66fyX_7KwvjopxYe2dNpaoTL86Xeyj91Kl23s6DF5UIrKPQHOjU7P6OE56tcUWnkIbg2q0QgWLw2tLRB8Ar3Rhf5vGv9WJf4IMYDCLoIQRoS99BIOmSQxQ", pos: "20.5% 53.5%", size: "1950%" },
          { name: "Coconut Dream Acai Bowl", desc: "Pure Unsweetened Acai Puree, Toppings, Yogurt", price: "$62.00", thumb: "https://lh3.googleusercontent.com/aida-public/AB6AXuAoKNkEX-lnQsi3JfAzVbi790gMlbBUrfLBwolE-7UgY615VgPkpeRZWC393F5JSQNHXe6Rih5J1qgTxSymGH6LsehGNWL0ulmQGdVisb_P-lSJZily0cOQq6bXHZuZJySI--UXwHsLwAAzI-QIIAYxceeSwRqsJt4miSAN2Q94RYKxBkXbXJ26b4b2c0Hgp7Vyg9Bd8NcqkhkZF_we69fqJQ-61ZPg_owu4GiQepDrntodfGnWcL9eM7Z6hLI8xrsjwg", pos: "20.5% 72.5%", size: "1950%" },
          { name: "Nutty Banana Acai Bowl", desc: "Pure Unsweetened Acai Puree, Toppings, Yogurt", price: "$60.00", thumb: "https://lh3.googleusercontent.com/aida-public/AB6AXuDoZEhvqyPPSlrQiaJMoPfGquQtmwAoNccR0E6Meu0wnkV5_Aoy5g9DtwjMpV7pzO_bskPowlwsLVPUn1eXb4zCoUN0F8zHvoCNFvc9Qh_iEKeWIjFLbj2xcuwn8Zg_7oytMwa3m6yCzgC0gw8uER1q1cupwLEIz4-hIRZuERISfTQY-n2-_8oBQAzLwdinXw8bBshnPdfZB-xB6m3rKuuk1x9aR5SiJOim7WsdSZazANOedhdGKegvWrVUUeCEUmNw", pos: "20.5% 90.5%", size: "1950%" },
        ] }, sortOrder: 7 },
        { type: "footer", content: { variant: "dishora", brand: "DISHORA", brandDesc: "Our master chefs craft each dish as a masterpiece, blending traditional culinary techniques with modern innovation. Whether it's an intimate dinner or a grand celebration,.", contactTitle: "CONTACT WITH US", contactPhone: "+1 (555) 019-2834", contactEmail: "booking@classicrest.com", openTitle: "OPENING HOURS", openLines: ["Sun-Thurs: 11:30am – 11pm", "Every Fri-Sat (8pm onwards)"], locTitle: "OUR LOCATION", locLines: ["5232 SW College Rd", "Ocala, FL 54654"], newsletterTitle: "SIGN UP FOR UPDATES, OFFERS, AND DELICIOUS SURPRISES", copyright: "© 2026 Dishora. All Rights Reserved." }, sortOrder: 8 },
      ]
    }
  ]
};

async function main() {
  console.log("Inyectando plantilla Dishora Restaurant con variante...");

  const existing = await p.template.findFirst({ where: { name: tpl.name } });
  if (existing) {
    console.log("Eliminando plantilla existente para regenerarla...");
    await p.template.delete({ where: { id: existing.id } });
  }

  let cat = await p.templateCategory.findUnique({ where: { slug: tpl.category.toLowerCase().replace(/\s+/g, "-") } });
  if (!cat) {
    cat = await p.templateCategory.create({
      data: {
        name: tpl.category,
        slug: tpl.category.toLowerCase().replace(/\s+/g, "-"),
        sortOrder: 0,
      },
    });
  }

  const template = await p.template.create({
    data: {
      name: tpl.name,
      description: tpl.description,
      categoryId: cat.id,
      isActive: true,
      tags: JSON.stringify([tpl.category.toLowerCase(), "restaurante", "alta-cocina", "menu"]),
    },
  });

  for (const page of tpl.pages) {
    const tp = await p.templatePage.create({
      data: {
        templateId: template.id,
        name: page.name,
        slug: page.slug,
        path: page.path,
        isDefault: page.isDefault,
        sortOrder: page.sortOrder,
      },
    });

    if (page.blocks.length > 0) {
      await p.templateBlock.createMany({
        data: page.blocks.map((b) => ({
          templatePageId: tp.id,
          type: b.type,
          content: b.content,
          sortOrder: b.sortOrder,
        })),
      });
    }
  }

  console.log("Plantilla Dishora Restaurant variante añadida exitosamente!");
}

main().catch(console.error).finally(() => p.$disconnect());
