/**
 * Compatibilidad de JavaScript para plantillas importadas desde ZIP.
 *
 * Al importar se eliminan los `<script>` (por seguridad) y con ellos se pierden
 * menús móviles, carruseles, modales, tabs y animaciones de librerías comunes.
 * Aquí detectamos esas librerías/comportamientos a partir del HTML original y
 * devolvemos un runtime vainilla que reproduce los casos más habituales.
 */

export interface TemplateJsFeatures {
  /** Librerías detectadas en el HTML original. */
  libraries: string[];
  /** Librerías cuya funcionalidad no se puede reproducir con JS vainilla. */
  unsupported: string[];
  /** Comportamientos que el runtime puede sustituir. */
  shims: string[];
}

export function emptyTemplateJsFeatures(): TemplateJsFeatures {
  return { libraries: [], unsupported: [], shims: [] };
}

function uniq(list: string[]): string[] {
  return Array.from(new Set(list));
}

export function mergeTemplateJsFeatures(
  a: TemplateJsFeatures,
  b: TemplateJsFeatures,
): TemplateJsFeatures {
  return {
    libraries: uniq([...a.libraries, ...b.libraries]),
    unsupported: uniq([...a.unsupported, ...b.unsupported]),
    shims: uniq([...a.shims, ...b.shims]),
  };
}

interface LibSignature {
  name: string;
  re: RegExp;
  shim?: string;
  unsupported?: boolean;
}

const LIB_SIGNATURES: LibSignature[] = [
  { name: "Bootstrap", re: /\bbootstrap(?:\.bundle)?(?:\.min)?\.js|data-bs-|navbar-toggler|carousel-item|modal-dialog|accordion-button/i, shim: "bootstrap" },
  { name: "jQuery", re: /jquery(?:-\d[\d.]*)?(?:\.min)?\.js|\$\(document\)|jQuery\(/i },
  { name: "Swiper", re: /\bswiper(?:-bundle)?(?:\.min)?\.(?:js|css)|\bswiper-slide\b/i, shim: "carousel" },
  { name: "Owl Carousel", re: /owl[.\-]?carousel/i, shim: "carousel" },
  { name: "Slick", re: /\bslick(?:\.min)?\.(?:js|css)|\bslick-slider\b/i, shim: "carousel" },
  { name: "Splide", re: /\bsplide\b/i, shim: "carousel" },
  { name: "Glide.js", re: /glide(?:\.min)?\.(?:js|css)|\bglide__slide\b/i, shim: "carousel" },
  { name: "AOS", re: /aos(?:\.min)?\.(?:js|css)|data-aos\b/i, shim: "reveal" },
  { name: "WOW.js", re: /wow(?:\.min)?\.js|data-wow-/i, shim: "reveal" },
  { name: "GSAP", re: /\bgsap\b|TweenMax|ScrollTrigger/i, unsupported: true },
  { name: "Glightbox", re: /glightbox/i, shim: "lightbox" },
  { name: "Fancybox", re: /fancybox/i, shim: "lightbox" },
  { name: "Lightbox2", re: /lightbox(?:\.min)?\.(?:js|css)/i, shim: "lightbox" },
  { name: "Magnific Popup", re: /magnific/i, shim: "lightbox" },
  { name: "CountUp", re: /countup(?:\.min)?\.js|data-count\b|class=["'][^"']*\bcounter\b/i, shim: "counters" },
  { name: "Chart.js", re: /chart(?:\.min)?\.js|new\s+Chart\s*\(|canvas[^>]+data-chart/i, unsupported: true },
  { name: "Typed.js", re: /typed(?:\.min)?\.js|new\s+Typed\s*\(/i, unsupported: true },
  { name: "Particles.js", re: /particles(?:\.min)?\.js|particlesJS/i, unsupported: true },
  { name: "Three.js", re: /three(?:\.min)?\.js|\bWebGLRenderer\b/i, unsupported: true },
  { name: "Isotope/Masonry", re: /isotope|masonry/i, unsupported: true },
];

const MARKUP_SHIMS: Array<{ shim: string; re: RegExp }> = [
  { shim: "menu", re: /navbar-toggler|menu-toggle|nav-toggle|hamburger|mobile-menu|data-(?:bs-)?toggle=["']?collapse|data-(?:bs-)?target=["']?[#.]?collapse/i },
  { shim: "carousel", re: /data-(?:bs-)?ride=["']?carousel|class=["'][^"']*\b(?:carousel|swiper|owl-carousel|slick-slider|splide|glide)\b/i },
  { shim: "modal", re: /data-(?:bs-)?toggle=["']?modal|class=["'][^"']*\bmodal\b/i },
  { shim: "tabs", re: /data-(?:bs-)?toggle=["']?(?:tab|pill)|nav-tabs|tab-content/i },
  { shim: "dropdown", re: /data-(?:bs-)?toggle=["']?dropdown|class=["'][^"']*\bdropdown\b/i },
  { shim: "accordion", re: /data-bs-parent|class=["'][^"']*\baccordion\b/i },
  { shim: "reveal", re: /data-aos\b|data-wow-|class=["'][^"']*\bwow\b/i },
  { shim: "lightbox", re: /data-lightbox|glightbox|data-fancybox|magnific|class=["'][^"']*\blightbox\b/i },
];

/** Analiza el HTML crudo (scripts + markup) y deduce librerías y shims. */
export function detectTemplateJsFeatures(html: string): TemplateJsFeatures {
  const source = String(html || "");
  const features = emptyTemplateJsFeatures();
  for (const sig of LIB_SIGNATURES) {
    if (!sig.re.test(source)) continue;
    if (!features.libraries.includes(sig.name)) features.libraries.push(sig.name);
    if (sig.unsupported) {
      if (!features.unsupported.includes(sig.name)) features.unsupported.push(sig.name);
    } else if (sig.shim && !features.shims.includes(sig.shim)) {
      features.shims.push(sig.shim);
    }
  }
  for (const { shim, re } of MARKUP_SHIMS) {
    if (!re.test(source)) continue;
    if (!features.shims.includes(shim)) features.shims.push(shim);
  }
  return features;
}

/**
 * Runtime vainilla (autocontenido). Se ejecuta en `DOMContentLoaded` o de
 * inmediato, usa delegación de eventos y un `MutationObserver` para funcionar
 * tanto en el sitio publicado como en las vistas previas de React.
 */
export const TEMPLATE_COMPAT_SCRIPT = `(function(){
  if (typeof document === "undefined") return;
  function init(){
    if (window.__edTplCompat) return;
    window.__edTplCompat = true;
    function qsa(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
    function selTarget(el, attr){
      var sel = el.getAttribute(attr); if(!sel) return null; sel = sel.trim();
      try { return sel.charAt(0) === "#" ? document.getElementById(sel.slice(1)) : document.querySelector(sel); }
      catch(e){ return null; }
    }
    function toggleCollapse(el){
      var target = selTarget(el,"data-bs-target") || selTarget(el,"data-target");
      if(!target){ var c = el.getAttribute("aria-controls"); if(c) target = document.getElementById(c); }
      if(!target){
        var scope = el.closest(".navbar, header, nav, .menu, .accordion, .accordion-item") || document;
        target = scope.querySelector(".navbar-collapse, .collapse, .nav-menu, .menu, nav ul, ul.nav, .accordion-collapse");
      }
      if(!target) return;
      var open = target.classList.contains("show") || target.classList.contains("open");
      target.classList.toggle("show", !open); target.classList.toggle("open", !open);
      if(target.style) target.style.display = (!open && getComputedStyle(target).display === "none") ? "block" : "";
      el.setAttribute("aria-expanded", String(!open));
      var item = el.closest(".accordion-item");
      if(item && !open){
        qsa(".accordion-item", item.parentElement || document).forEach(function(it){
          if(it === item) return;
          var c = it.querySelector(".accordion-collapse, .collapse");
          if(c){ c.classList.remove("show"); c.classList.remove("open"); }
          var b = it.querySelector(".accordion-button, [data-bs-toggle=collapse]");
          if(b) b.setAttribute("aria-expanded","false");
        });
      }
    }
    function toggleDropdown(el){
      var parent = el.closest(".dropdown, li") || el.parentElement;
      var menu = parent ? parent.querySelector(".dropdown-menu") : null;
      if(!menu) return;
      var open = menu.classList.contains("show");
      qsa(".dropdown-menu.show").forEach(function(m){ m.classList.remove("show"); });
      menu.classList.toggle("show", !open);
      el.setAttribute("aria-expanded", String(!open));
    }
    function activateTab(el){
      var target = selTarget(el,"data-bs-target") || selTarget(el,"data-target");
      if(!target){ var h = el.getAttribute("href"); if(h && h.charAt(0) === "#") target = document.getElementById(h.slice(1)); }
      if(!target) return;
      var container = el.closest(".nav, ul") || document;
      qsa(".nav-link, [data-bs-toggle=tab], [data-bs-toggle=pill], [data-toggle=tab]", container).forEach(function(t){
        t.classList.remove("active"); t.classList.remove("show"); t.setAttribute("aria-selected","false");
      });
      el.classList.add("active"); el.setAttribute("aria-selected","true");
      if(target.parentElement) qsa(".tab-pane", target.parentElement).forEach(function(p){ p.classList.remove("active"); p.classList.remove("show"); });
      target.classList.add("active"); target.classList.add("show");
    }
    function openModal(selector){
      var m = typeof selector === "string" ? document.querySelector(selector) : selector;
      if(!m) return;
      m.classList.add("show"); m.style.display = "block";
      m.removeAttribute("aria-hidden"); m.setAttribute("aria-modal","true");
      document.body.classList.add("modal-open");
    }
    function closeModal(m){
      if(!m) m = document.querySelector(".modal.show");
      if(!m) return;
      m.classList.remove("show"); m.style.display = "none";
      m.setAttribute("aria-hidden","true"); document.body.classList.remove("modal-open");
    }
    function openLightbox(src){
      if(!src) return;
      var ov = document.getElementById("__ed_lightbox");
      if(!ov){
        ov = document.createElement("div");
        ov.id = "__ed_lightbox";
        ov.style.cssText = "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;cursor:zoom-out";
        ov.innerHTML = '<img style="max-width:92vw;max-height:92vh;box-shadow:0 10px 40px rgba(0,0,0,.5)">';
        ov.addEventListener("click", function(){ ov.style.display = "none"; });
        document.body.appendChild(ov);
      }
      var img = ov.querySelector("img"); if(img) img.src = src;
      ov.style.display = "flex";
    }
    function initCarousels(){
      qsa(".carousel, [data-ride=carousel], [data-bs-ride=carousel]").forEach(function(car){
        if(car.getAttribute("data-ed-init") === "1") return;
        var items = qsa(".carousel-item, .carousel > *", car);
        if(items.length < 2) return;
        car.setAttribute("data-ed-init","1");
        var idx = 0;
        for(var k=0;k<items.length;k++){ if(items[k].classList.contains("active")){ idx = k; break; } }
        function go(i){
          idx = (i + items.length) % items.length;
          items.forEach(function(it,j){
            it.classList.toggle("active", j === idx);
            it.style.transition = "opacity .6s ease";
            it.style.opacity = j === idx ? "1" : "0";
            it.style.display = "";
          });
          qsa(".carousel-indicators li, .carousel-indicators button, .carousel-indicators [data-bs-target]", car).forEach(function(d,j){ d.classList.toggle("active", j === idx); });
        }
        go(idx);
        var interval = parseInt(car.getAttribute("data-bs-interval") || car.getAttribute("data-interval") || "", 10);
        if(interval) setInterval(function(){ go(idx + 1); }, interval);
        car.addEventListener("click", function(e){
          var t = e.target.closest ? e.target.closest("[data-bs-slide], [data-slide]") : null;
          if(!t) return;
          var d = (t.getAttribute("data-bs-slide") || t.getAttribute("data-slide") || "").toLowerCase();
          if(d === "prev") go(idx - 1); else if(d === "next") go(idx + 1);
        });
      });
      qsa(".swiper, .owl-carousel, .slick-slider, .splide, .glide").forEach(function(slider){
        if(slider.getAttribute("data-ed-init") === "1") return;
        var slides = qsa(".swiper-slide, .item, .slick-slide, .splide__slide, .glide__slide", slider);
        if(slides.length < 2) return;
        slider.setAttribute("data-ed-init","1");
        var idx = 0;
        slides.forEach(function(s,j){ s.style.transition = "opacity .6s ease"; s.style.opacity = j === 0 ? "1" : "0"; if(j !== 0) s.style.display = "none"; });
        function go(n){
          slides[idx].style.display = "none"; slides[idx].style.opacity = "0";
          idx = (n + slides.length) % slides.length;
          slides[idx].style.display = ""; slides[idx].style.opacity = "1";
        }
        var auto = parseInt(slider.getAttribute("data-autoplay") || slider.getAttribute("data-swiper-autoplay") || "", 10);
        if(auto) setInterval(function(){ go(idx + 1); }, auto > 100 ? auto : 4000);
        slider.addEventListener("click", function(e){
          var t = e.target.closest ? e.target.closest(".swiper-button-next, .owl-next, .slick-next, .swiper-button-prev, .owl-prev, .slick-prev") : null;
          if(!t) return;
          e.preventDefault();
          go(t.className.indexOf("prev") > -1 ? idx - 1 : idx + 1);
        });
      });
    }
    function initReveal(){
      var els = qsa("[data-aos], [data-wow-delay], .wow, .reveal, .reveal-left, .reveal-right");
      if(!els.length) return;
      var reveal = function(el){
        el.classList.add("aos-animate"); el.classList.add("animated"); el.classList.add("in-view");
        el.style.opacity = "1"; el.style.visibility = "visible";
      };
      if(typeof IntersectionObserver === "undefined"){ els.forEach(reveal); return; }
      if(!window.__edRevealObserver){
        window.__edRevealObserver = new IntersectionObserver(function(entries){
          entries.forEach(function(en){ if(en.isIntersecting){ reveal(en.target); window.__edRevealObserver.unobserve(en.target); } });
        }, { threshold: 0.1 });
      }
      els.forEach(function(el){
        if(el.getAttribute("data-ed-reveal") === "1") return;
        el.setAttribute("data-ed-reveal","1");
        window.__edRevealObserver.observe(el);
      });
    }
    function initCounters(){
      qsa("[data-count], .counter-value, .count-up").forEach(function(el){
        if(el.getAttribute("data-ed-init") === "1") return;
        var target = parseFloat(el.getAttribute("data-count") || el.textContent.replace(/[^0-9.]/g,""));
        if(isNaN(target)) return;
        el.setAttribute("data-ed-init","1");
        var suffix = (el.textContent.match(/[^0-9.]+$/) || [""])[0];
        var t0 = null;
        function step(ts){
          if(!t0) t0 = ts;
          var p = Math.min((ts - t0) / 1200, 1);
          el.textContent = Math.floor(target * p) + suffix;
          if(p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }
    document.addEventListener("click", function(e){
      var el = e.target && e.target.closest ? e.target.closest("[data-bs-toggle], [data-toggle], .navbar-toggler, .menu-toggle, .nav-toggle, .hamburger, [data-collapse-toggle], [data-bs-dismiss], .modal .close, [data-lightbox], .glightbox, [data-fancybox]") : null;
      if(!el) return;
      var toggle = el.getAttribute("data-bs-toggle") || el.getAttribute("data-toggle") || "";
      if(el.matches(".navbar-toggler, .menu-toggle, .nav-toggle, .hamburger") || toggle === "collapse"){ e.preventDefault(); toggleCollapse(el); return; }
      if(toggle === "dropdown"){ e.preventDefault(); toggleDropdown(el); return; }
      if(toggle === "tab" || toggle === "pill"){ e.preventDefault(); activateTab(el); return; }
      if(toggle === "modal"){ e.preventDefault(); openModal(selTarget(el,"data-bs-target") || selTarget(el,"data-target") || el.getAttribute("href")); return; }
      if(el.getAttribute("data-bs-dismiss") === "modal" || (el.matches(".modal .close") && el.closest(".modal"))){ closeModal(el.closest(".modal")); return; }
      var lb = el.getAttribute("data-lightbox") ? el.getAttribute("href") : (el.matches(".glightbox, [data-fancybox]") ? el.getAttribute("href") : "");
      if(lb){ e.preventDefault(); openLightbox(lb); }
    });
    document.addEventListener("keydown", function(e){ if(e.key === "Escape") closeModal(null); });
    function refresh(){ initCarousels(); initReveal(); initCounters(); }
    refresh();
    if(typeof MutationObserver !== "undefined"){
      var timer = null;
      new MutationObserver(function(){ if(timer) clearTimeout(timer); timer = setTimeout(refresh, 150); }).observe(document.body, { childList: true, subtree: true });
    }
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();`;

/** Devuelve el runtime solo si hay algo que sustituir. */
export function buildTemplateCompatScript(features: TemplateJsFeatures): string {
  return features.shims.length > 0 ? TEMPLATE_COMPAT_SCRIPT : "";
}
