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
    { y: 2026, t: "Гештальт II Ступень - Сертификат 1", c: "Психотерапия", f: "2026. Гештальт II Ступень - Сертификат 1.pdf" },
    { y: 2026, t: "Транзактный Анализ в клинической практике", c: "Психиатрия", f: "2026. Транзактный Анализ в клинической практике.pdf" },
    { y: 2025, t: "NLP-t", c: "НЛП", f: "2025. NLP-t.pdf" },
    { y: 2025, t: "Гештальт I Ступень - Сертификат", c: "Психотерапия", f: "2025. Гештальт I Ступень - Сертификат.pdf" },
    { y: 2025, t: "Групповая психотерапия - Ирвин Ялом", c: "Психотерапия", f: "2025. Групповая психотерапия - Ирвин Ялом.pdf" },
    { y: 2025, t: "Искусство психотерапии - Ирвин Ялом", c: "Психотерапия", f: "2025. Искусство психотерапии - Ирвин Ялом.pdf" },
    { y: 2025, t: "НЛП-Мастер - Высшая Школа НЛП", c: "НЛП", f: "2025. НЛП-Мастер - Высшая Школа НЛП.pdf" },
    { y: 2025, t: "Симбиоз 3.0", c: "Психотерапия", f: "2025. Симбиоз 3.0.pdf" },
    { y: 2024, t: "2-е Высшее Образование - Признание образования в Казахстане", c: "Образование", f: "2024. 2-е Высшее Образование - Признание образования в Казахстане.pdf" },
    { y: 2024, t: "Coach PCM", c: "Коучинг", f: "2024. Coach PCM.pdf" },
    { y: 2024, t: "Cексуальность - норма и дисфункция", c: "Сексология", f: "2024. Cексуальность - норма и дисфункция.pdf" },
    { y: 2024, t: "NLP-Practitioner - Чехия-Прага", c: "НЛП", f: "2024. NLP-Practitioner - Чехия-Прага.pdf" },
    { y: 2024, t: "Анатомия измены", c: "Сексология", f: "2024. Анатомия измены.pdf" },
    { y: 2024, t: "Зависимости и аддикции в практике психолога", c: "Психиатрия", f: "2024. Зависимости и аддикции в практике психолога.pdf" },
    { y: 2024, t: "Коучинг", c: "Коучинг", f: "2024. Коучинг.pdf" },
    { y: 2024, t: "МИП", c: "Психотерапия", f: "2024. МИП.pdf" },
    { y: 2024, t: "Начало психологической практики", c: "Психотерапия", f: "2024. Начало психологической практики.pdf" },
    { y: 2024, t: "НЛП-Практик - Европейский Тренинговый Центр НЛП «Берег Силы»", c: "НЛП", f: "2024. НЛП-Практик - Европейский Тренинговый Центр НЛП _Берег Силы_.pdf" },
    { y: 2024, t: "Переговоры с монстрами", c: "Переговоры", f: "2024. Переговоры с монстрами.pdf" },
    { y: 2024, t: "Психиатрия для психологов", c: "Психиатрия", f: "2024. Психиатрия для психологов.pdf" },
    { y: 2024, t: "Психотерапия наркологических пациентов и их родственников", c: "Психиатрия", f: "2024. Психотерапия наркологических пациентов и их родственников.pdf" },
    { y: 2024, t: "Психотерапия характера", c: "Психотерапия", f: "2024. Психотерапия характера.pdf" },
    { y: 2024, t: "Работа в терапии с детским эго-состоянием клиента с учётом циклов развития Памелы Левин", c: "Психотерапия", f: "2024. Работа в терапии с детским эго-состоянием клиента с учётом циклов развития Памелы Левин.pdf" },
    { y: 2024, t: "Сексология", c: "Сексология", f: "2024. Сексология.pdf" },
    { y: 2024, t: "Симбиоз 2.0", c: "Психотерапия", f: "2024. Симбиоз 2.0.pdf" },
    { y: 2024, t: "Транзактный Анализ в консультировании клиентов - Базовый уровень", c: "Психотерапия", f: "2024. Транзактный анализ в консультировании клиентов - Базовый уровень.pdf" },
    { y: 2024, t: "Эмоциональная регуляция в психотерапии", c: "Психотерапия", f: "2024. Эмоциональная регуляция в психотерапии.pdf" },
    { y: 2023, t: "NLP-Практик", c: "НЛП", f: "2023. NLP-Практик.pdf" },
    { y: 2023, t: "NLP-Практик - удостоверение", c: "НЛП", f: "2023. NLP-Практик - удостоверение.pdf" },
    { y: 2023, t: "PCM - Базовый", c: "Коучинг", f: "2023. PCM - Базовый.pdf" },
    { y: 2023, t: "PCM - Продвинутый", c: "Коучинг", f: "2023. PCM - Продвинутый.pdf" },
    { y: 2023, t: "Жёсткие переговоры", c: "Переговоры", f: "2023. Жёсткие переговоры.pdf" },
    { y: 2023, t: "Жесткие переговоры", c: "Переговоры", f: "2023. Жесткие переговоры.pdf" },
    { y: 2023, t: "Инструменты профайлинга и управления эмоциональным состоянием в переговорах", c: "Профайлинг", f: "2023. Инструменты профайлинга и управления эмоциональным состоянием в переговорах.pdf" },
    { y: 2023, t: "Краткосрочная психотерапия", c: "Психотерапия", f: "2023. Краткосрочная психотерапия.pdf" },
    { y: 2023, t: "Краткосрочная психотерапия тревожно-депрессивных и панических расстройств", c: "Психотерапия", f: "2023. Краткосрочная психотерапия тревожно-депрессивных и панических расстройств.pdf" },
    { y: 2023, t: "Переговорщик - специалист по ведению переговоров в сложных условиях", c: "Переговоры", f: "2023. Переговорщик - специалист по ведению переговоров в сложных условиях.pdf" },
    { y: 2023, t: "Перегорщик - консультант по межкультурной коммуникации", c: "Переговоры", f: "2023. Перегорщик - консультант по межкультурной коммуникации.pdf" },
    { y: 2023, t: "Практические подходы к пониманию и терапии суицидоопасных клиентов", c: "Психотерапия", f: "2023. Практические подходы к пониманию и терапии суицидоопасных клиентов.PDF" },
    { y: 2023, t: "Профайлинг", c: "Профайлинг", f: "2023. Профайлинг.pdf" },
    { y: 2023, t: "Психолог-Консультант", c: "Психотерапия", f: "2023. Психолог-Консультант.pdf" },
    { y: 2023, t: "Стратегии ведения переговоров", c: "Переговоры", f: "2023. Стратегии ведения переговоров.pdf" },
    { y: 2023, t: "Терапия Нового решения в Транзактном Анализе", c: "Психотерапия", f: "2023. Терапия Нового решения в Транзактном анализе.PDF" },
    { y: 2023, t: "Тренер PCM", c: "Коучинг", f: "2023. Тренер PCM.pdf" },
    { y: 2023, t: "Тренер по переговорам", c: "Переговоры", f: "2023. Тренер по переговорам.pdf" },
    { y: 2023, t: "Формирование и развитие патологического симбиоза", c: "Психотерапия", f: "2023. Формирование и развитие патологического симбиоза.pdf" },
    { y: 2023, t: "Эффективные продажи - стратегия и инструменты", c: "Переговоры", f: "2023. Эффективные продажи - стратегия и инструменты.pdf" },
    { y: 2023, t: "Я - Манипулятор - диагностика эмоций", c: "Влияние", f: "2023. Я - Манипулятор - диагностика эмоций.pdf" },
    { y: 2022, t: "Certificate - Coaching", c: "Коучинг", f: "2022. Certificate - Coaching.pdf" },
    { y: 2022, t: "Certificate of Completion ACSTH", c: "Коучинг", f: "2022. Certificate of Completion ACSTH.pdf" },
    { y: 2022, t: "Certificate of Completion ACTP", c: "Коучинг", f: "2022. Certificate of Completion ACTP.pdf" },
    { y: 2022, t: "Искусство речи", c: "Риторика", f: "2022. Искусство речи.pdf" },
    { y: 2022, t: "ТА 101", c: "Психотерапия", f: "2022. ТА 101.pdf" },
    { y: 2022, t: "Техника и искусство речи", c: "Риторика", f: "2022. Техника и искусство речи.pdf" },
    { y: 2021, t: "Scotwork", c: "Переговоры", f: "2021. Scotwork.pdf" },
    { y: 2021, t: "Szkola Negocjacji", c: "Переговоры", f: "2021. Szkola Negocjacji.pdf" },
    { y: 2021, t: "Боевое НЛП Новая Эра", c: "НЛП", f: "2021. Боевое НЛП Новая Эра.pdf" },
    { y: 2021, t: "Мастер коммуникации", c: "Коучинг", f: "2021. Мастер коммуникации копия.pdf" },
    { y: 2021, t: "Непобедимый - Negotiator", c: "Переговоры", f: "2021. Непобедимый - Negotiator копия.pdf" },
    { y: 2021, t: "НЛП Практик Новая Эра", c: "НЛП", f: "2021. НЛП Практик Новая Эра копия.pdf" },
    { y: 2021, t: "Профайлер-Верификатор", c: "Профайлинг", f: "2021. Профайлер-Верификатор.pdf" },
    { y: 2020, t: "Курс манипуляции людьми", c: "Влияние", f: "2020. Курс манипуляции людьми.pdf" },
    { y: 2020, t: "Переговоры о проблемах и противоречиях", c: "Переговоры", f: "2020. Переговоры о проблемах и противоречиях.pdf" },
    { y: 2020, t: "Профайлинг обучение", c: "Профайлинг", f: "2020. Профайлинг обучение.pdf" },
    { y: 2020, t: "Речевые техники влияния", c: "Влияние", f: "2020. Речевые техники влияния.pdf" },
    { y: 2020, t: "Убедитель - аргументация в статусных переговорах", c: "Переговоры", f: "2020. Убедитель - аргументация в статусных переговорах.pdf" },
    { y: 2020, t: "Школа профессионального переговорщика", c: "Переговоры", f: "2020. Школа профессионального переговорщика.pdf" },
    { y: 2019, t: "Кремлёвская Школа переговоров", c: "Переговоры", f: "2019. Кремлёвская Школа переговоров.pdf" },
    { y: 2019, t: "Профайлер-Верификатор", c: "Профайлинг", f: "2019. Профайлер-Верификатор.pdf" },
    { y: 2019, t: "Профайлер-Верификатор - Мастер", c: "Профайлинг", f: "2019. Профайлер-Верификатор - Мастер.pdf" },
    { y: 2019, t: "Профайлер-Верификатор - Мастерский курс", c: "Профайлинг", f: "2019. Профайлер-Верификатор - Мастерский курс.pdf" },
    { y: 2019, t: "Профайлер-Верификатор - удостоверение", c: "Профайлинг", f: "2019. 2019. Профайлер-Верификатор - удостоверение.pdf" },
    { y: 2019, t: "Руководство стрессом", c: "Влияние", f: "2019. Руководство стрессом.pdf" },
    { y: 2019, t: "Харизматичный оратор", c: "Риторика", f: "2019. Харизматичный оратор.pdf" },
    { y: 2019, t: "Школа профессионального переговорщика", c: "Переговоры", f: "2019. Школа профессионального переговорщика.pdf" },
    { y: 2018, t: "7 навыков высокоэффективных людей", c: "Влияние", f: "2018. 7 навыков высокоэффективных людей.pdf" },
    { y: 2018, t: "Авторитет и влияние", c: "Влияние", f: "2018. Авторитет и влияние.pdf" },
    { y: 2018, t: "Авторитет и мотивация", c: "Влияние", f: "2018. Авторитет и мотивация.pdf" },
    { y: 2018, t: "Бизнес - переговоры - продвинутый", c: "Переговоры", f: "2018. Бизнес - переговоры - продвинутый.pdf" },
    { y: 2018, t: "Бизнес - переговоры - уровень продвинутый", c: "Переговоры", f: "2018. Бизнес - переговоры - уровень продвинутый.pdf" },
    { y: 2018, t: "Бизнес выступления", c: "Риторика", f: "2018. Бизнес выступления.pdf" },
    { y: 2017, t: "Бизнес-тренинг. Основы эффективного общения и поведения", c: "Влияние", f: "2017. Бизнес-тренинг. Основы эффективного общения и поведения.pdf" },
    { y: 2010, t: "Медиации", c: "Переговоры", f: "2010. Медиации.pdf" },
    { y: 2009, t: "1-е Высшее Образование - Признание образования в Казахстане", c: "Образование", f: "2009. 1-е Высшее Образование - Признание образования в Казахстане.pdf" }
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
