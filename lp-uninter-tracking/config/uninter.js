/* =========================================================================
 * config/uninter.js — Configuração global da LP Uninter.
 *
 * Este arquivo contém as variáveis que são COMUNS a todos os polos.
 * Não muda entre polos. Cada polo pode sobrescrever via config/polo.js.
 *
 * Ordem de carga: config/uninter.js → config/polo.js →
 *                 js/data-source.js → js/tracking.js → js/app.js
 * ========================================================================= */

window.UninterConfig = {
  // ═══════════════════════════════════════════════════
  // IDENTIFICAÇÃO
  // ═══════════════════════════════════════════════════
  marca: "Uninter",
  nomeCompleto: "Universidade Interamericana",
  slug: "uninter",

  // ═══════════════════════════════════════════════════
  // GOOGLE (fallbacks — cada polo pode sobrescrever)
  // ═══════════════════════════════════════════════════
  gtmId: "GTM-52XTDH8D",
  googleAdsId: "AW-18340100067",
  googleAdsConversionLabel: "WHATSAPP_CONVERSION_LABEL",
  ga4Id: "G-EYWM8KFX3D",
  clarityId: null,

  // ═══════════════════════════════════════════════════
  // WEBHOOKS / APIs
  // ═══════════════════════════════════════════════════
  webhookLead: "https://api.opp4s.com/webhook/leads_lp_polos_uninter_tenant",
  webhookTracking: "https://api.opp4s.com/webhook/uninter-tracking",

  // ═══════════════════════════════════════════════════
  // TRACKING
  // ═══════════════════════════════════════════════════
  utmTtlDays: 30,
  sessionKey: "uninter_session",
  utmKey: "uninter_utm",

  // ═══════════════════════════════════════════════════
  // CURSOS POR NÍVEL (comuns a todos os polos)
  // ═══════════════════════════════════════════════════
  niveis: [
    { id: "graduacao", nome: "Graduação" },
    { id: "pos-graduacao", nome: "Pós-Graduação" },
    { id: "tecnico", nome: "Técnico" },
    { id: "eja", nome: "EJA" }
  ],

  // ═══════════════════════════════════════════════════
  // MODALIDADES
  // ═══════════════════════════════════════════════════
  modalidades: [
    { id: "ead", nome: "EAD" },
    { id: "presencial", nome: "Presencial" },
    { id: "semipresencial", nome: "Semipresencial" }
  ]
};
