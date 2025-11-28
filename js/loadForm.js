// ==============================
// loadForm.js — AUTO-DETECT FORM VERSION (FINAL)
// ==============================

// ---------- ENVIRONMENT DETECTION ----------
const HOST = window.location.hostname;

// Advanced form ALWAYS loads from your Caddy server
const ADVANCED_FORM_URL = "https://app.apll.it/js/advancedForm.js";

// Decide fallback form based on location
let FALLBACK_FORM_URL;

// Local IP ranges (localhost, 127.*, 192.168.*, 10.*, 172.16-31.*)
const isLocalEnv =
  HOST === "localhost" ||
  HOST === "127.0.0.1" ||
  HOST.startsWith("192.168.") ||
  HOST.startsWith("10.") ||
  (HOST.startsWith("172.") && (parseInt(HOST.split(".")[1]) >= 16 && parseInt(HOST.split(".")[1]) <= 31));

// Apply rules
if (isLocalEnv) {
  // Local environment → use local fallback
  FALLBACK_FORM_URL = "/js/fallbackForm.js";
} else {
  // ANY public IP or ANY domain → use GitHub fallback
  FALLBACK_FORM_URL = "https://itsnowonline.github.io/js/fallbackForm.js";
}

console.log("[loadForm] HOST =", HOST);
console.log("[loadForm] ADVANCED =", ADVANCED_FORM_URL);
console.log("[loadForm] FALLBACK =", FALLBACK_FORM_URL);

// ---------- INTERNAL FLAGS ----------
let advancedFormLoaded = false;
let fallbackFormLoaded = false;

// Helper: page-based default service
function getPageService() {
  const el = document.querySelector("[data-page]");
  if (!el) return "Servizio";
  const page = (el.getAttribute("data-page") || "").toLowerCase();
  if (page === "caf") return "Servizio CAF";
  if (page === "patronato") return "Patronato";
  if (page === "legal") return "Assistenza Legale";
  return "Servizio";
}

// Helper: compute service name from button
function resolveServiceName(button) {
  const fromBtn = (button.getAttribute("data-service") || "").trim();
  if (fromBtn) return fromBtn;
  return getPageService();
}

// Load script only once
function loadExternalScriptOnce(url, type) {
  return new Promise((resolve, reject) => {

    if (type === "advanced" && advancedFormLoaded) return resolve();
    if (type === "fallback" && fallbackFormLoaded) return resolve();

    const s = document.createElement("script");
    s.src = url + "?v=" + Date.now(); // cache-bust

    s.onload = () => {
      console.log(`[loadForm] Loaded: ${url}`);
      if (type === "advanced") advancedFormLoaded = true;
      if (type === "fallback") fallbackFormLoaded = true;
      resolve();
    };

    s.onerror = () => {
      console.error(`[loadForm] FAILED to load: ${url}`);
      reject(new Error("Script load failed"));
    };

    document.body.appendChild(s);
  });
}

// ---------- MAIN CLICK HANDLER ----------
document.addEventListener("click", evt => {
  const btn = evt.target.closest(".js-reservation-btn");
  if (!btn) return;

  const serviceName = resolveServiceName(btn);

  const stateGetter = window.getApllServerState;
  const currentState = typeof stateGetter === "function" ? stateGetter() : "unknown";

  const useAdvanced = currentState === "online";
  const url = useAdvanced ? ADVANCED_FORM_URL : FALLBACK_FORM_URL;
  const type = useAdvanced ? "advanced" : "fallback";

  console.log(`[loadForm] Button click → State=${currentState}, type=${type}`);

  loadExternalScriptOnce(url, type)
    .then(() => {
      if (typeof window.apllOpenForm === "function") {
        window.apllOpenForm(serviceName);
      } else {
        console.error("[loadForm] ERROR: apllOpenForm() missing in form file.");
        alert("Form could not be opened. Please try again later.");
      }
    })
    .catch(() => {
      alert("Form could not be loaded. Please try again later.");
    });
});