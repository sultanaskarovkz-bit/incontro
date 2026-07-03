/* ============ INCONTRO - site interactions ============ */
// Graceful degradation: if any script error occurs, ensure all content is visible.
window.addEventListener('error', function () {
  try { document.documentElement.classList.remove('js'); } catch (e) {}
});
(function () {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---- Preloader ---- */
  window.addEventListener("load", () => {
    const pl = $("#preloader");
    if (pl) setTimeout(() => pl.classList.add("done"), 600);
  });

  /* ---- Year ---- */
  const y = $("#year"); if (y) y.textContent = new Date().getFullYear();

  /* ---- Header scroll + progress + sticky cta ---- */
  const header = $("#header");
  const progress = $("#scrollProgress");
  const sticky = $("#stickyCta");
  function onScroll() {
    const sc = window.scrollY || document.documentElement.scrollTop;
    header.classList.toggle("scrolled", sc > 40);
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (h > 0 ? (sc / h) * 100 : 0) + "%";
    if (sticky) sticky.classList.toggle("show", sc > 700);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Mobile menu ---- */
  const burger = $("#burger"), nav = $("#nav");
  if (burger && nav) {
    const toggle = (open) => {
      const isOpen = open ?? !nav.classList.contains("open");
      nav.classList.toggle("open", isOpen);
      burger.classList.toggle("open", isOpen);
      burger.setAttribute("aria-expanded", isOpen);
      document.body.style.overflow = isOpen ? "hidden" : "";
    };
    burger.addEventListener("click", () => toggle());
    $$(".nav__link", nav).forEach(a => a.addEventListener("click", () => toggle(false)));
  }

  /* ---- Reveal on scroll ---- */
  const reveals = $$(".reveal");
  const revealAll = () => reveals.forEach(el => el.classList.add("in"));
  if (navigator.webdriver) {
    // automated browser (screenshots/tests): show everything instantly
    document.documentElement.classList.remove("js");
    revealAll();
  } else if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((el, i) => {
      el.style.transitionDelay = (Math.min(i % 6, 5) * 60) + "ms";
      io.observe(el);
    });
    // failsafe: ensure everything is visible even if observer never fires
    setTimeout(revealAll, 2600);
  } else {
    revealAll();
  }

  /* ---- Count up stats ---- */
  const fmt = (n) => n.toLocaleString("ru-RU").replace(/,/g, " ");
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = +el.dataset.count;
      const dur = 1600; const start = performance.now();
      function tick(now) {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      countIO.unobserve(el);
    });
  }, { threshold: 0.5 });
  $$("[data-count]").forEach(el => countIO.observe(el));

  /* ---- Reviews slider ---- */
  const track = $("[data-track]");
  if (track) {
    const step = () => Math.min(track.clientWidth * 0.8, 460);
    $("[data-next]")?.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
    $("[data-prev]")?.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
  }

  /* ---- Analytics: lead event (works only if a pixel/counter is connected) ---- */
  function trackLead() {
    try { if (typeof gtag === "function") gtag("event", "generate_lead", { event_category: "lead", event_label: "site_form" }); } catch (e) {}
    try { if (typeof fbq === "function") fbq("track", "Lead"); } catch (e) {}
    try { if (typeof ym === "function" && window.__YM_ID) ym(window.__YM_ID, "reachGoal", "lead"); } catch (e) {}
    try { (window.dataLayer = window.dataLayer || []).push({ event: "lead_submit" }); } catch (e) {}
  }

  /* ---- Thank-you modal ---- */
  const modal = $("#thanks");
  function openModal() {
    if (!modal) return;
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add("show"));
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove("show");
    document.body.style.overflow = "";
    setTimeout(() => { modal.hidden = true; }, 350);
  }
  if (modal) {
    $$("[data-close]", modal).forEach(el => el.addEventListener("click", closeModal));
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !modal.hidden) closeModal(); });
  }

  /* ---- Lead forms -> thank-you modal + WhatsApp ---- */
  const WA = "77014310774";
  $$("[data-leadform]").forEach(form => {
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const data = new FormData(form);
      const name = (data.get("name") || "").toString().trim();
      const contact = (data.get("contact") || "").toString().trim();
      const message = (data.get("message") || "").toString().trim();
      if (!name || !contact) { showToast("Пожалуйста, заполните имя и контакт"); return; }
      let text = `Здравствуйте, Алексей! Хочу записаться на консультацию.\n\nИмя: ${name}\nКонтакт: ${contact}`;
      if (message) text += `\nЗапрос: ${message}`;
      text += `\n\n(заявка с сайта incontro)`;
      const waUrl = `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;
      const tgText = encodeURIComponent(`Здравствуйте, Алексей! Хочу записаться. Имя: ${name}` + (message ? `. Запрос: ${message}` : ""));
      const waBtn = $("#thanksWa"), tgBtn = $("#thanksTg");
      if (waBtn) waBtn.href = waUrl;
      if (tgBtn) tgBtn.href = `https://t.me/alosmits?text=${tgText}`;
      trackLead();
      form.reset();
      openModal();
    });
  });

  /* ---- Lite YouTube facade ---- */
  $$(".ytlite").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.yt;
      if (!id) return;
      const ifr = document.createElement("iframe");
      ifr.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
      ifr.title = "Видео с Алексеем Мицинским";
      ifr.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      ifr.allowFullscreen = true;
      ifr.className = "ytlite__iframe";
      btn.replaceWith(ifr);
    });
  });

  let toastT;
  function showToast(msg) {
    const t = $("#toast"); if (!t) return;
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("show"), 4200);
  }

  /* ---- Credentials data ---- */
  const CERTS = [
    { y: 2026, t: "Гештальт II Ступень - Сертификат 1", c: "Психотерапия", f: "diploma-01.pdf" },
    { y: 2026, t: "Транзактный Анализ в клинической практике", c: "Психиатрия", f: "diploma-02.pdf" },
    { y: 2025, t: "NLP-t", c: "НЛП", f: "diploma-03.pdf" },
    { y: 2025, t: "Гештальт I Ступень - Сертификат", c: "Психотерапия", f: "diploma-04.pdf" },
    { y: 2025, t: "Групповая психотерапия - Ирвин Ялом", c: "Психотерапия", f: "diploma-05.pdf" },
    { y: 2025, t: "Искусство психотерапии - Ирвин Ялом", c: "Психотерапия", f: "diploma-06.pdf" },
    { y: 2025, t: "НЛП-Мастер - Высшая Школа НЛП", c: "НЛП", f: "diploma-07.pdf" },
    { y: 2025, t: "Симбиоз 3.0", c: "Психотерапия", f: "diploma-08.pdf" },
    { y: 2024, t: "2-е Высшее Образование - Признание образования в Казахстане", c: "Образование", f: "diploma-09.pdf" },
    { y: 2024, t: "Coach PCM", c: "Коучинг", f: "diploma-10.pdf" },
    { y: 2024, t: "Cексуальность - норма и дисфункция", c: "Сексология", f: "diploma-11.pdf" },
    { y: 2024, t: "NLP-Practitioner - Чехия-Прага", c: "НЛП", f: "diploma-12.pdf" },
    { y: 2024, t: "Анатомия измены", c: "Сексология", f: "diploma-13.pdf" },
    { y: 2024, t: "Зависимости и аддикции в практике психолога", c: "Психиатрия", f: "diploma-14.pdf" },
    { y: 2024, t: "Коучинг", c: "Коучинг", f: "diploma-15.pdf" },
    { y: 2024, t: "МИП", c: "Психотерапия", f: "diploma-16.pdf" },
    { y: 2024, t: "Начало психологической практики", c: "Психотерапия", f: "diploma-17.pdf" },
    { y: 2024, t: "НЛП-Практик - Европейский Тренинговый Центр НЛП «Берег Силы»", c: "НЛП", f: "diploma-18.pdf" },
    { y: 2024, t: "Переговоры с монстрами", c: "Переговоры", f: "diploma-19.pdf" },
    { y: 2024, t: "Психиатрия для психологов", c: "Психиатрия", f: "diploma-20.pdf" },
    { y: 2024, t: "Психотерапия наркологических пациентов и их родственников", c: "Психиатрия", f: "diploma-21.pdf" },
    { y: 2024, t: "Психотерапия характера", c: "Психотерапия", f: "diploma-22.pdf" },
    { y: 2024, t: "Работа в терапии с детским эго-состоянием клиента с учётом циклов развития Памелы Левин", c: "Психотерапия", f: "diploma-23.pdf" },
    { y: 2024, t: "Сексология", c: "Сексология", f: "diploma-24.pdf" },
    { y: 2024, t: "Симбиоз 2.0", c: "Психотерапия", f: "diploma-25.pdf" },
    { y: 2024, t: "Транзактный Анализ в консультировании клиентов - Базовый уровень", c: "Психотерапия", f: "diploma-26.pdf" },
    { y: 2024, t: "Эмоциональная регуляция в психотерапии", c: "Психотерапия", f: "diploma-27.pdf" },
    { y: 2023, t: "NLP-Практик", c: "НЛП", f: "diploma-28.pdf" },
    { y: 2023, t: "NLP-Практик - удостоверение", c: "НЛП", f: "diploma-29.pdf" },
    { y: 2023, t: "PCM - Базовый", c: "Коучинг", f: "diploma-30.pdf" },
    { y: 2023, t: "PCM - Продвинутый", c: "Коучинг", f: "diploma-31.pdf" },
    { y: 2023, t: "Жёсткие переговоры", c: "Переговоры", f: "diploma-32.pdf" },
    { y: 2023, t: "Жесткие переговоры", c: "Переговоры", f: "diploma-33.pdf" },
    { y: 2023, t: "Инструменты профайлинга и управления эмоциональным состоянием в переговорах", c: "Профайлинг", f: "diploma-34.pdf" },
    { y: 2023, t: "Краткосрочная психотерапия", c: "Психотерапия", f: "diploma-35.pdf" },
    { y: 2023, t: "Краткосрочная психотерапия тревожно-депрессивных и панических расстройств", c: "Психотерапия", f: "diploma-36.pdf" },
    { y: 2023, t: "Переговорщик - специалист по ведению переговоров в сложных условиях", c: "Переговоры", f: "diploma-37.pdf" },
    { y: 2023, t: "Перегорщик - консультант по межкультурной коммуникации", c: "Переговоры", f: "diploma-38.pdf" },
    { y: 2023, t: "Практические подходы к пониманию и терапии суицидоопасных клиентов", c: "Психотерапия", f: "diploma-39.pdf" },
    { y: 2023, t: "Профайлинг", c: "Профайлинг", f: "diploma-40.pdf" },
    { y: 2023, t: "Психолог-Консультант", c: "Психотерапия", f: "diploma-41.pdf" },
    { y: 2023, t: "Стратегии ведения переговоров", c: "Переговоры", f: "diploma-42.pdf" },
    { y: 2023, t: "Терапия Нового решения в Транзактном Анализе", c: "Психотерапия", f: "diploma-43.pdf" },
    { y: 2023, t: "Тренер PCM", c: "Коучинг", f: "diploma-44.pdf" },
    { y: 2023, t: "Тренер по переговорам", c: "Переговоры", f: "diploma-45.pdf" },
    { y: 2023, t: "Формирование и развитие патологического симбиоза", c: "Психотерапия", f: "diploma-46.pdf" },
    { y: 2023, t: "Эффективные продажи - стратегия и инструменты", c: "Переговоры", f: "diploma-47.pdf" },
    { y: 2023, t: "Я - Манипулятор - диагностика эмоций", c: "Влияние", f: "diploma-48.pdf" },
    { y: 2022, t: "Certificate - Coaching", c: "Коучинг", f: "diploma-49.pdf" },
    { y: 2022, t: "Certificate of Completion ACSTH", c: "Коучинг", f: "diploma-50.pdf" },
    { y: 2022, t: "Certificate of Completion ACTP", c: "Коучинг", f: "diploma-51.pdf" },
    { y: 2022, t: "Искусство речи", c: "Риторика", f: "diploma-52.pdf" },
    { y: 2022, t: "ТА 101", c: "Психотерапия", f: "diploma-53.pdf" },
    { y: 2022, t: "Техника и искусство речи", c: "Риторика", f: "diploma-54.pdf" },
    { y: 2021, t: "Scotwork", c: "Переговоры", f: "diploma-55.pdf" },
    { y: 2021, t: "Szkola Negocjacji", c: "Переговоры", f: "diploma-56.pdf" },
    { y: 2021, t: "Боевое НЛП Новая Эра", c: "НЛП", f: "diploma-57.pdf" },
    { y: 2021, t: "Мастер коммуникации", c: "Коучинг", f: "diploma-58.pdf" },
    { y: 2021, t: "Непобедимый - Negotiator", c: "Переговоры", f: "diploma-59.pdf" },
    { y: 2021, t: "НЛП Практик Новая Эра", c: "НЛП", f: "diploma-60.pdf" },
    { y: 2021, t: "Профайлер-Верификатор", c: "Профайлинг", f: "diploma-61.pdf" },
    { y: 2020, t: "Курс манипуляции людьми", c: "Влияние", f: "diploma-62.pdf" },
    { y: 2020, t: "Переговоры о проблемах и противоречиях", c: "Переговоры", f: "diploma-63.pdf" },
    { y: 2020, t: "Профайлинг обучение", c: "Профайлинг", f: "diploma-64.pdf" },
    { y: 2020, t: "Речевые техники влияния", c: "Влияние", f: "diploma-65.pdf" },
    { y: 2020, t: "Убедитель - аргументация в статусных переговорах", c: "Переговоры", f: "diploma-66.pdf" },
    { y: 2020, t: "Школа профессионального переговорщика", c: "Переговоры", f: "diploma-67.pdf" },
    { y: 2019, t: "Кремлёвская Школа переговоров", c: "Переговоры", f: "diploma-68.pdf" },
    { y: 2019, t: "Профайлер-Верификатор", c: "Профайлинг", f: "diploma-69.pdf" },
    { y: 2019, t: "Профайлер-Верификатор - Мастер", c: "Профайлинг", f: "diploma-70.pdf" },
    { y: 2019, t: "Профайлер-Верификатор - Мастерский курс", c: "Профайлинг", f: "diploma-71.pdf" },
    { y: 2019, t: "Профайлер-Верификатор - удостоверение", c: "Профайлинг", f: "diploma-72.pdf" },
    { y: 2019, t: "Руководство стрессом", c: "Влияние", f: "diploma-73.pdf" },
    { y: 2019, t: "Харизматичный оратор", c: "Риторика", f: "diploma-74.pdf" },
    { y: 2019, t: "Школа профессионального переговорщика", c: "Переговоры", f: "diploma-75.pdf" },
    { y: 2018, t: "7 навыков высокоэффективных людей", c: "Влияние", f: "diploma-76.pdf" },
    { y: 2018, t: "Авторитет и влияние", c: "Влияние", f: "diploma-77.pdf" },
    { y: 2018, t: "Авторитет и мотивация", c: "Влияние", f: "diploma-78.pdf" },
    { y: 2018, t: "Бизнес - переговоры - продвинутый", c: "Переговоры", f: "diploma-79.pdf" },
    { y: 2018, t: "Бизнес - переговоры - уровень продвинутый", c: "Переговоры", f: "diploma-80.pdf" },
    { y: 2018, t: "Бизнес выступления", c: "Риторика", f: "diploma-81.pdf" },
    { y: 2017, t: "Бизнес-тренинг. Основы эффективного общения и поведения", c: "Влияние", f: "diploma-82.pdf" },
    { y: 2010, t: "Медиации", c: "Переговоры", f: "diploma-83.pdf" },
    { y: 2009, t: "1-е Высшее Образование - Признание образования в Казахстане", c: "Образование", f: "diploma-84.pdf" }
  ];

  const grid = $("#credGrid");
  const filtersBox = $("[data-cred-filters]");
  const moreBtn = $("#credMore");
  if (grid) {
    const LIMIT = 9;
    let activeCat = "Все";
    let collapsed = true;

    // build cards
    CERTS.forEach(c => {
      const a = document.createElement("a");
      a.className = "cred";
      a.dataset.cat = c.c;
      a.href = "assets/certs/" + encodeURIComponent(c.f);
      a.target = "_blank";
      a.rel = "noopener";
      a.innerHTML =
        `<span class="cred__year">${c.y}</span>
         <span class="cred__body">
           <h3>${c.t}</h3>
           <span>${c.c}</span>
           <span class="cred__link">Смотреть оригинал</span>
         </span>`;
      grid.appendChild(a);
    });
    const cards = $$(".cred", grid);

    function apply() {
      let count = 0;
      cards.forEach(card => {
        const match = activeCat === "Все" || card.dataset.cat === activeCat;
        let show = false;
        if (match) {
          show = collapsed ? count < LIMIT : true;
          count++;
        }
        card.classList.toggle("hide", !show);
      });
      if (moreBtn) {
        if (count > LIMIT) {
          moreBtn.hidden = false;
          moreBtn.textContent = collapsed ? `Показать все (${count})` : "Свернуть";
        } else {
          moreBtn.hidden = true;
        }
      }
    }

    // build filters
    const ORDER = ["Образование", "Психотерапия", "Психиатрия", "НЛП", "Сексология", "Коучинг", "Переговоры", "Профайлинг", "Влияние", "Риторика"];
    const present = [...new Set(CERTS.map(c => c.c))];
    const ordered = ORDER.filter(c => present.includes(c)).concat(present.filter(c => !ORDER.includes(c)));
    const cats = ["Все", ...ordered];
    cats.forEach((cat, i) => {
      const b = document.createElement("button");
      b.className = "cred-filter" + (i === 0 ? " active" : "");
      b.textContent = cat;
      b.dataset.cat = cat;
      b.addEventListener("click", () => {
        $$(".cred-filter").forEach(x => x.classList.remove("active"));
        b.classList.add("active");
        activeCat = cat;
        collapsed = true;
        apply();
      });
      filtersBox.appendChild(b);
      if (i === 0) {
        const brk = document.createElement("span");
        brk.className = "cred-filter__break";
        filtersBox.appendChild(brk);
      }
    });

    if (moreBtn) {
      moreBtn.addEventListener("click", () => {
        collapsed = !collapsed;
        apply();
        if (collapsed) document.getElementById("credentials").scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    apply();
  }
})();
