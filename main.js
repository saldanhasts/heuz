/* =================================================================
   THE HEUZ CLUB: main.js (JavaScript puro, sem dependências)
   ================================================================= */

/**
 * CONFIGURAÇÃO DE CONTATO
 * - whatsappNumber: número internacional só com dígitos (ex.: "5531999999999").
 *   PENDENTE: não é público no Instagram. Enquanto estiver vazio, os botões usam
 *   o link oficial de mensagem do WhatsApp Business da bio (já escrito no HTML).
 * - whatsappMessage: mensagem inicial usada quando o número estiver preenchido.
 */
const CONFIG = {
  whatsappNumber: "",
  whatsappMessage:
    "Olá! Conheci a THE HEUZ CLUB pelo site e gostaria de saber mais sobre como funciona uma aula experimental.",
};

(function () {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.__heuzMotion = true;
  root.classList.add("js");

  /* ------------------------------------------------------------ Contato */
  if (CONFIG.whatsappNumber) {
    const url =
      "https://wa.me/" +
      CONFIG.whatsappNumber.replace(/\D/g, "") +
      "?text=" +
      encodeURIComponent(CONFIG.whatsappMessage);
    document.querySelectorAll("a[data-contact]").forEach((a) => (a.href = url));
  }

  /* ------------------------------------------------------------ Header */
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.getElementById("mobile-menu");

  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  function setMenu(open, returnFocus) {
    menu.hidden = !open;
    header.classList.toggle("is-open", open);
    root.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    if (open) {
      const first = menu.querySelector("a");
      if (first) first.focus();
    } else if (returnFocus) {
      toggle.focus();
    }
  }
  toggle.addEventListener("click", () => setMenu(menu.hidden));
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.hidden) setMenu(false, true);
  });
  window.matchMedia("(min-width: 1024px)").addEventListener("change", (e) => {
    if (e.matches && !menu.hidden) setMenu(false);
  });

  // Link da seção atual
  const navLinks = Array.from(document.querySelectorAll(".header-nav .nav-link"));
  const sections = navLinks
    .map((a) => document.getElementById(a.getAttribute("href").slice(1)))
    .filter(Boolean);
  if ("IntersectionObserver" in window) {
    const navIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          navLinks.forEach((a) => {
            const on = a.getAttribute("href") === "#" + e.target.id;
            a.classList.toggle("is-active", on);
            if (on) a.setAttribute("aria-current", "true");
            else a.removeAttribute("aria-current");
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => navIO.observe(s));
  }

  /* ------------------------------------------------------------ Animações
     [data-reveal]   → recebe .is-in ao entrar na tela
     [data-parallax] → translateY proporcional ao scroll (só transform)
     [data-progress] → expõe --p (0→1) conforme atravessa a tela       */
  const revealEls = Array.from(document.querySelectorAll("[data-reveal]"));
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  const moving = Array.from(document.querySelectorAll("[data-parallax], [data-progress]"));
  const visible = new Set();
  let ticking = false;

  // Rede de segurança: rolagens muito rápidas (ou saltos por âncora) podem pular
  // o IntersectionObserver; qualquer elemento que já passou da tela é revelado.
  let pending = revealEls.slice();
  function sweep(vh) {
    if (!pending.length) return;
    pending = pending.filter((el) => {
      if (el.classList.contains("is-in")) return false;
      if (el.getBoundingClientRect().top < vh) {
        el.classList.add("is-in");
        return false;
      }
      return true;
    });
  }

  function update() {
    ticking = false;
    const vh = window.innerHeight;
    sweep(vh * 0.9);
    visible.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (el.hasAttribute("data-parallax") && !reduceMotion) {
        const speed = parseFloat(el.getAttribute("data-parallax") || "0.12");
        const center = r.top + r.height / 2 - vh / 2;
        el.style.transform = "translate3d(0," + (-center * speed).toFixed(1) + "px,0)";
      }
      if (el.hasAttribute("data-progress")) {
        const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height * 0.6)));
        el.style.setProperty("--p", p.toFixed(3));
      }
    });
  }
  function schedule() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }
  if ("IntersectionObserver" in window) {
    const vio = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
      schedule();
    });
    moving.forEach((el) => vio.observe(el));
  }
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);

  /* ------------------------------------------------------------ Galeria / lightbox */
  const dialog = document.querySelector(".lightbox");
  const triggers = Array.from(document.querySelectorAll(".gi-btn"));
  if (dialog && triggers.length && typeof dialog.showModal === "function") {
    const lbImg = dialog.querySelector(".lightbox-img");
    const lbCount = dialog.querySelector(".lightbox-count");
    const lbCaption = dialog.querySelector(".lightbox-caption");
    const lbFigure = dialog.querySelector(".lightbox-figure");
    const total = triggers.length;
    let index = 0;
    let lastTrigger = null;
    const pad = (n) => String(n).padStart(2, "0");

    function show(i) {
      index = (i + total) % total;
      const src = triggers[index].querySelector("img");
      lbImg.srcset = src.getAttribute("srcset") || "";
      lbImg.src = src.getAttribute("src");
      lbImg.alt = src.alt;
      lbCaption.textContent = src.alt;
      lbCount.textContent = pad(index + 1) + " / " + pad(total);
      lbFigure.style.animation = "none";
      void lbFigure.offsetWidth; // reinicia a animação de entrada
      lbFigure.style.animation = "";
    }

    triggers.forEach((btn, i) =>
      btn.addEventListener("click", () => {
        lastTrigger = btn;
        show(i);
        dialog.showModal();
        root.classList.add("menu-open");
        dialog.querySelector(".lb-close").focus();
      })
    );
    dialog.querySelector(".lb-prev").addEventListener("click", () => show(index - 1));
    dialog.querySelector(".lb-next").addEventListener("click", () => show(index + 1));
    dialog.querySelector(".lb-close").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    });
    dialog.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") show(index + 1);
      if (e.key === "ArrowLeft") show(index - 1);
    });
    dialog.addEventListener("close", () => {
      root.classList.remove("menu-open");
      if (lastTrigger) lastTrigger.focus();
    });

    let touchX = null;
    dialog.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
    dialog.addEventListener("touchend", (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
      touchX = null;
    });
  }


  /* ------------------------------------------------------------ Hero: fotos alternando */
  const slideWrap = document.querySelector("[data-hero-slides]");
  if (slideWrap) {
    const slides = Array.from(slideWrap.querySelectorAll(".hero-img"));
    const num = document.querySelector("[data-hero-num]");
    const bar = document.querySelector("[data-hero-bar]");
    const meter = document.querySelector(".hero-slide-meter");
    const INTERVAL = 4700;
    let current = 0;
    let timer = null;
    let heroVisible = true;
    const pad2 = (n) => String(n).padStart(2, "0");

    function load(img) {
      if (img.dataset.src) {
        img.srcset = img.dataset.srcset || "";
        img.src = img.dataset.src;
        delete img.dataset.src;
        delete img.dataset.srcset;
      }
      return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
    }
    function runBar() {
      if (!bar) return;
      bar.style.setProperty("--slide-ms", INTERVAL + "ms");
      bar.classList.remove("is-running");
      void bar.offsetWidth;
      bar.classList.add("is-running");
    }
    function go(next) {
      const img = slides[next];
      load(img).then(() => {
        slides[current].classList.remove("is-active");
        img.classList.add("is-active");
        current = next;
        if (num) num.textContent = pad2(current + 1);
        runBar();
        load(slides[(current + 1) % slides.length]); // pré-carrega a próxima
      });
    }
    function start() {
      stop();
      runBar();
      timer = setInterval(() => go((current + 1) % slides.length), INTERVAL);
    }
    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
      if (bar) bar.classList.remove("is-running");
    }

    if (reduceMotion || slides.length < 2) {
      if (meter) meter.hidden = true;
    } else {
      window.addEventListener("load", () => {
        load(slides[1]);
        start();
      });
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) stop();
        else if (heroVisible) start();
      });
      if ("IntersectionObserver" in window) {
        new IntersectionObserver((entries) => {
          heroVisible = entries[0].isIntersecting;
          if (heroVisible && !document.hidden) start();
          else stop();
        }).observe(slideWrap);
      }
    }
  }

  /* ------------------------------------------------------------ Filosofia: relógio de WOD */
  const wod = document.querySelector("[data-wod]");
  if (wod && !reduceMotion) {
    const digits = Array.from(wod.querySelectorAll("[data-wod-digits] .seg"));
    const roundEl = wod.querySelector("[data-wod-round]");
    const wodBar = wod.querySelector("[data-wod-bar]");
    const rounds = Array.from(wod.querySelectorAll(".wod-round"));
    const TOTAL = 60 * 60; // aula de 60 minutos, em segundos
    wod.classList.add("is-scrub");
    let lastKey = "";

    function render() {
      const r = wod.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 1;
      const secs = Math.round(p * TOTAL);
      const mm = Math.floor(secs / 60);
      const ss = secs % 60;
      const str = String(mm).padStart(2, "0") + String(ss).padStart(2, "0");
      if (str !== lastKey) {
        lastKey = str;
        digits.forEach((d, i) => d.setAttribute("data-d", str[i]));
      }
      const round = Math.min(2, Math.floor(p * 3));
      rounds.forEach((li, i) => {
        li.classList.toggle("is-active", i === round && p < 0.995);
        li.classList.toggle("is-done", i < round || p >= 0.995);
      });
      if (roundEl) roundEl.textContent = String(round + 1);
      if (wodBar) wodBar.style.setProperty("--p", p.toFixed(4));
      wod.classList.toggle("is-finished", p >= 0.995);
    }
    let wodTick = false;
    const onWod = () => {
      if (wodTick) return;
      wodTick = true;
      requestAnimationFrame(() => {
        wodTick = false;
        render();
      });
    };
    window.addEventListener("scroll", onWod, { passive: true });
    window.addEventListener("resize", onWod);
    render();
  }

  /* ------------------------------------------------------------ Ano do rodapé */
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();
