/* =========================================================================
 * js/tracking.js — Sistema de tracking nativo da LP Uninter.
 * Zero dependências externas. 100% vanilla JS.
 *
 * Captura: UTMs, cliques WhatsApp (posição + curso), scroll depth,
 * seções vistas, buscas, filtros, cursos clicados, tempo na página.
 *
 * Expõe window.Track para app.js usar.
 *
 * Ordem de carga: config/uninter.js → config/polo.js →
 *                 js/data-source.js → js/tracking.js → js/app.js
 * ========================================================================= */
(function () {
  "use strict";

  // Lê configurações dos arquivos de config
  var CFG = window.UninterConfig || {};
  var POLO = window.PoloConfig || {};

  var SESSION_KEY = CFG.sessionKey || "uninter_session";
  var UTM_KEY = CFG.utmKey || "uninter_utm";
  var UTM_TTL_MS = (CFG.utmTtlDays || 30) * 24 * 60 * 60 * 1000;

  // ═══════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════

  function getOrCreateSession() {
    try {
      var raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return {
      pageViewAt: new Date().toISOString(),
      pagina: location.pathname,
      poloId: POLO.poloId || null,
      poloSlug: POLO.poloSlug || null,
      poloNome: POLO.poloNome || null,
      poloCidade: POLO.poloCidade || null,
      poloUf: POLO.poloUf || null,
      waClicks: [],
      secoesVistas: [],
      buscas: [],
      filtrosUsados: [],
      cursosVistos: [],
      scrollDepth: 0
    };
  }

  function saveSession(data) {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
    } catch (_) {}
  }

  // ═══════════════════════════════════════════════════
  // CAMADA 1: UTM CAPTURE
  // ═══════════════════════════════════════════════════

  function captureUTMs() {
    var params = new URLSearchParams(window.location.search);
    var utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
    var utm = {};
    var hasNew = false;

    utmKeys.forEach(function (key) {
      var val = params.get(key);
      if (val) {
        utm[key] = val;
        hasNew = true;
      }
    });

    utm.referrer = document.referrer || "";

    if (hasNew) {
      utm.capturedAt = new Date().toISOString();
      try {
        localStorage.setItem(UTM_KEY, JSON.stringify(utm));
      } catch (_) {}
    }

    try {
      var saved = localStorage.getItem(UTM_KEY);
      if (saved) {
        var parsed = JSON.parse(saved);
        if (parsed.capturedAt && Date.now() - new Date(parsed.capturedAt).getTime() > UTM_TTL_MS) {
          localStorage.removeItem(UTM_KEY);
          return utm;
        }
        return parsed;
      }
    } catch (_) {}

    return utm;
  }

  function getUTMs() {
    try {
      var raw = localStorage.getItem(UTM_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  // ═══════════════════════════════════════════════════
  // CAMADA 2: WHATSAPP TRACKING
  // ═══════════════════════════════════════════════════

  function trackWhatsApp(pos, curso) {
    var data = getOrCreateSession();

    var click = { pos: pos, ts: new Date().toISOString() };
    if (curso) click.curso = curso;

    data.waClicks.push(click);
    saveSession(data);

    // dataLayer para GTM / GA4 / Google Ads
    if (window.dataLayer) {
      window.dataLayer.push({
        event: "whatsapp_click",
        wa_position: pos,
        wa_curso: curso || null,
        polo_id: POLO.poloId || null,
        polo_slug: POLO.poloSlug || null,
        polo_cidade: POLO.poloCidade || null
      });
    }

    return click;
  }

  // ═══════════════════════════════════════════════════
  // CAMADA 3: JOURNEY TRACKING
  // ═══════════════════════════════════════════════════

  function initScrollObserver() {
    var sections = document.querySelectorAll("[data-track]");
    if (!sections.length) return;

    var data = getOrCreateSession();

    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var tag = entry.target.getAttribute("data-track");
            if (tag && data.secoesVistas.indexOf(tag) === -1) {
              data.secoesVistas.push(tag);
              saveSession(data);
            }
          }
        });
      },
      { threshold: 0.3 }
    );

    sections.forEach(function (el) {
      obs.observe(el);
    });
  }

  function initScrollDepth() {
    var maxDepth = 0;
    var ticking = false;

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(function () {
            var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            var docHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (docHeight > 0) {
              var depth = Math.round((scrollTop / docHeight) * 100);
              if (depth > maxDepth) {
                maxDepth = depth;
                var data = getOrCreateSession();
                data.scrollDepth = maxDepth;
                saveSession(data);
              }
            }
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  function trackSearch(termo) {
    if (!termo || termo.length < 2) return;
    var data = getOrCreateSession();
    if (!data.buscas) data.buscas = [];
    if (data.buscas.indexOf(termo) === -1) {
      data.buscas.push(termo);
      saveSession(data);
    }
  }

  function trackFilter(filtro) {
    var data = getOrCreateSession();
    if (!data.filtrosUsados) data.filtrosUsados = [];
    if (data.filtrosUsados.indexOf(filtro) === -1) {
      data.filtrosUsados.push(filtro);
      saveSession(data);
    }
  }

  function trackCursoVisto(slug) {
    var data = getOrCreateSession();
    if (!data.cursosVistos) data.cursosVistos = [];
    if (data.cursosVistos.indexOf(slug) === -1) {
      data.cursosVistos.push(slug);
      saveSession(data);
    }
  }

  // ═══════════════════════════════════════════════════
  // CAMADA 4: PAYLOAD COMPLETO
  // ═══════════════════════════════════════════════════

  function getData() {
    var data = getOrCreateSession();
    var utms = getUTMs();

    var tempoNaPagina = 0;
    if (data.pageViewAt) {
      tempoNaPagina = Math.round(
        (Date.now() - new Date(data.pageViewAt).getTime()) / 1000
      );
    }

    return {
      // Identificação do polo (campos do Sheets)
      poloId: POLO.poloId || null,
      poloSlug: POLO.poloSlug || null,
      poloNome: POLO.poloNome || null,
      poloCidade: POLO.poloCidade || null,
      poloUf: POLO.poloUf || null,
      habilitado: POLO.habilitado || false,

      // Contato do polo
      email: POLO.email || null,
      telefone: POLO.telefone || null,
      endereco: POLO.endereco || null,
      cnpj: POLO.cnpj || null,

      // UTMs
      utm_source: utms.utm_source || null,
      utm_medium: utms.utm_medium || null,
      utm_campaign: utms.utm_campaign || null,
      utm_content: utms.utm_content || null,
      utm_term: utms.utm_term || null,
      referrer: utms.referrer || null,

      // WhatsApp
      wa_clicks: data.waClicks || [],

      // Journey
      scroll_depth: data.scrollDepth || 0,
      buscas: data.buscas || [],
      cursos_vistos: data.cursosVistos || [],
      filtros_usados: data.filtrosUsados || [],
      secoes_vistas: data.secoesVistas || [],
      tempo_na_pagina: tempoNaPagina
    };
  }

  // ═══════════════════════════════════════════════════
  // INICIALIZAÇÃO
  // ═══════════════════════════════════════════════════

  function init() {
    captureUTMs();
    initScrollObserver();
    initScrollDepth();

    var data = getOrCreateSession();
    saveSession(data);

    if (window.dataLayer) {
      window.dataLayer.push({
        event: "page_view_custom",
        pagina: location.pathname,
        polo_id: POLO.poloId || null,
        polo_slug: POLO.poloSlug || null,
        polo_cidade: POLO.poloCidade || null,
        polo_uf: POLO.poloUf || null
      });
    }
  }

  // Expõe API pública para app.js
  window.Track = {
    whatsapp: trackWhatsApp,
    search: trackSearch,
    filter: trackFilter,
    cursoVisto: trackCursoVisto,
    getData: getData,
    getUTMs: getUTMs,
    getPolo: function () { return POLO; },
    getConfig: function () { return CFG; }
  };

  // Auto-inicializa
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
