/* =========================================================================
 * config/polo.js — Configuração do polo específico.
 *
 * Este arquivo contém as variáveis que MUDAM entre polos.
 * Os campos correspondem EXATAMENTE à planilha Google Sheets.
 *
 * Ordem de carga: config/uninter.js → config/polo.js →
 *                 js/data-source.js → js/tracking.js → js/app.js
 * ========================================================================= */

window.PoloConfig = {
  // ═══════════════════════════════════════════════════
  // IDENTIFICAÇÃO DO POLO (campos do Sheets)
  // ═══════════════════════════════════════════════════
  poloId: 85,
  poloSlug: "londrina-centro-calcadao",
  poloNome: "PAP LONDRINA (CENTRO CALÇADÃO) - PR",
  poloCidade: "Londrina",
  poloUf: "PR",
  habilitado: true,

  // ═══════════════════════════════════════════════════
  // DADOS DO POLO
  // ═══════════════════════════════════════════════════
  marca: "",
  nomeCompleto: "PAP LONDRINA (CENTRO CALÇADÃO) - PR",
  cidade: "Londrina",
  uf: "PR",

  // ═══════════════════════════════════════════════════
  // CONTATO
  // ═══════════════════════════════════════════════════
  whatsapp: 5543998540300,           // Número com código do país
  telefone: 4333612040,              // Telefone fixo
  email: "londrina@pap-uninter.com",
  endereco: "Av. Paraná, 646 - Centro, Londrina - PR, 86010-390",
  mapsUrl: "https://maps.app.goo.gl/PCukMkvgiDBn2mBLA",
  horarioAtendimento: "09 as 20h seg a sex",
  cnpj: 22797653000186,
  logoUrl: "",

  // ═══════════════════════════════════════════════════
  // ANALYTICS (cada polo tem os seus!)
  // ═══════════════════════════════════════════════════
  ga4: "G-EYWM8KFX3D",              // GA4 deste polo
  googleAdsId: "AW-18340100067",    // Google Ads deste polo
  googleAdsLabel: "",               // Label de conversão
  clarityId: "xqnghrws2k",         // Microsoft Clarity

  // ═══════════════════════════════════════════════════
  // REDES SOCIAIS
  // ═══════════════════════════════════════════════════
  instagram: "",
  facebook: "",

  // ═══════════════════════════════════════════════════
  // MENSAGEM PADRÃO WHATSAPP
  // ═══════════════════════════════════════════════════
  whatsappMsg: ""
};

// ═══════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════

/**
 * Gera link do WhatsApp com o número do polo
 * @param {string} msg - Mensagem personalizada (opcional)
 * @returns {string} URL do WhatsApp
 */
window.waLink = function (msg) {
  var numero = String(window.PoloConfig.whatsapp);
  var mensagem = msg || window.PoloConfig.whatsappMsg || "Olá! Tenho interesse nos cursos da Uninter.";
  return "https://wa.me/" + numero + "?text=" + encodeURIComponent(mensagem);
};

/**
 * Retorna o GA4 ID (polo ou global)
 * @returns {string} GA4 ID
 */
window.getGa4Id = function () {
  return window.PoloConfig.ga4 || window.UninterConfig.ga4Id;
};

/**
 * Retorna o Google Ads ID (polo ou global)
 * @returns {string} Google Ads ID
 */
window.getGoogleAdsId = function () {
  return window.PoloConfig.googleAdsId || window.UninterConfig.googleAdsId;
};

/**
 * Retorna o Google Ads Conversion Label (polo ou global)
 * @returns {string} Conversion Label
 */
window.getGoogleAdsLabel = function () {
  return window.PoloConfig.googleAdsLabel || window.UninterConfig.googleAdsConversionLabel;
};

/**
 * Retorna o Microsoft Clarity ID
 * @returns {string} Clarity ID ou null
 */
window.getClarityId = function () {
  return window.PoloConfig.clarityId || null;
};
