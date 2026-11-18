/* ============================================================
   FUSD Foundation — Winter Food Drive
   Simple static page. Item metadata lives here; live "ordered"
   counts live in Supabase (see README.md). If Supabase is not
   configured yet, the page runs in local PREVIEW mode so you can
   still see and click through everything.
   ============================================================ */

/* ---- 1. CONFIG — fill these in after creating the Supabase project ---- */
const CONFIG = {
  SUPABASE_URL: "https://yupryoyykdjrxyhhnezb.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1cHJ5b3l5a2Rqcnh5aGhuZXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUwMTQ5ODEsImV4cCI6MjExMDU5MDk4MX0.nw1ILHi7ajsPyFuDCjQ4ab-WmWVdzLxcZEkysriON4c",
  CONTACT_EMAIL: "ameebyers@hotmail.com",
  SHARE_URL: "https://tinyurl.com/FUSDwinterfooddrive",
  SHARE_TEXT: "Help stock the FUSD Foundation Winter Food Drive — pick an item, buy it on Walmart, and ship it to us.",
  // Shipping address — one line per array entry.
  SHIP_ADDRESS: [
    "Taryn Lykins",
    "FUSD Foundation — Winter Food Drive",
    "5400 E Railhead Ave",
    "Flagstaff, AZ 86004"
  ]
};

/* ---- 2. ITEMS — the registry. Edit names, goals, and Walmart links here. ----
   id        : stable slug, must match the Supabase row id
   name      : shown on the card
   goal      : target quantity
   walmart   : DIRECT Walmart product URL (opens in new tab)
   image     : file in /img, or leave "" for a "photo coming soon" tile      */
const ITEMS = [
  { id: "cup-noodles",  name: "Nissin Cup Noodles, Chicken — 24-count",                goal: 328, walmart: "https://www.walmart.com/ip/Nissin-Cup-Noodles-Chicken-24-count/660106077", image: "cup-noodles.jpg" },
  { id: "oatmeal",      name: "Quaker Instant Oatmeal Variety Pack — 52 packets",      goal: 302, walmart: "https://www.walmart.com/ip/Quaker-Instant-Oatmeal-Variety-Pack-52-Pk-1-46-oz/188248116", image: "oatmeal.jpg" },
  { id: "crackers",     name: "Lance ToastChee Peanut Butter Crackers — pack of 40",   goal: 194, walmart: "https://www.walmart.com/ip/Lance-ToastChee-Peanut-Butter-Crackers-1-52-Ounce-Pack-of-40/19692860137", image: "crackers.jpg" },
  { id: "chewy-bars",   name: "Quaker Chewy Bars Variety Pack — 60 ct",                goal: 131, walmart: "https://www.walmart.com/ip/Quaker-Chewy-Bars-Variety-Pack-60-Ct/186570364", image: "chewy-bars.jpg" },
  { id: "fruity-snacks",name: "Member's Mark Holiday Fruity Snacks — 100 count",       goal: 77,  walmart: "https://www.walmart.com/ip/M-M-Holiday-Fruity-Snacks-Variety-Pack-0-8-oz-Pouches-100-Count/21310573273", image: "fruity-snacks.jpg" }
];

/* ============================================================
   Below here is wiring — you normally do not need to edit it.
   ============================================================ */

const hasSupabase = CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY;
const sb = hasSupabase ? supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY) : null;

const LS_KEY = "fusd_preview_pledged";   // preview-mode fallback store
const state = {};                         // id -> { ...meta, pledged }

/* ---------- data ---------- */
async function loadCounts() {
  // seed from local metadata
  ITEMS.forEach(it => { state[it.id] = { ...it, pledged: 0 }; });

  if (sb) {
    const { data, error } = await sb.from("items").select("id,name,goal,pledged,walmart_url,image_file");
    if (error) { console.error(error); return; }
    data.forEach(row => {
      const cur = state[row.id] || { id: row.id };
      state[row.id] = {
        id: row.id,
        name: row.name || cur.name,
        goal: row.goal ?? cur.goal,
        walmart: row.walmart_url || cur.walmart,
        image: row.image_file || cur.image,
        pledged: row.pledged ?? 0
      };
    });
  } else {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    Object.keys(state).forEach(id => { state[id].pledged = saved[id] || 0; });
  }
}

async function addPledge(id, qty) {
  if (sb) {
    const { error } = await sb.rpc("increment_pledge", { p_id: id, p_qty: qty });
    if (error) throw error;
    const { data } = await sb.from("items").select("pledged").eq("id", id).single();
    state[id].pledged = data ? data.pledged : state[id].pledged + qty;
  } else {
    state[id].pledged += qty;
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    saved[id] = state[id].pledged;
    localStorage.setItem(LS_KEY, JSON.stringify(saved));
  }
}

/* ---------- render ---------- */
function pct(p, g) { return g > 0 ? Math.min(100, Math.round((p / g) * 100)) : 0; }

function renderOverall() {
  const items = Object.values(state);
  const goal = items.reduce((s, i) => s + (i.goal || 0), 0);
  const pledged = items.reduce((s, i) => s + (i.pledged || 0), 0);
  document.getElementById("overall-goal").textContent = goal.toLocaleString();
  document.getElementById("overall-pledged").textContent = pledged.toLocaleString();
  document.getElementById("overall-pct").textContent = pct(pledged, goal);
  document.getElementById("overall-fill").style.width = pct(pledged, goal) + "%";
}

function renderCard(item) {
  const tpl = document.getElementById("card-tpl").content.cloneNode(true);
  const card = tpl.querySelector(".card");
  card.dataset.id = item.id;

  const img = tpl.querySelector(".card-img img");
  if (item.image) { img.src = "img/" + item.image; img.alt = item.name; }
  else { tpl.querySelector(".card-img").classList.add("card-img--missing"); }

  tpl.querySelector(".card-name").textContent = item.name;
  tpl.querySelector(".c-goal").textContent = item.goal.toLocaleString();

  const buy = tpl.querySelector(".btn-buy");
  if (item.walmart) { buy.href = item.walmart; }
  else { buy.setAttribute("aria-disabled", "true"); buy.href = "#"; buy.textContent = "Link coming soon"; buy.style.opacity = ".55"; buy.style.pointerEvents = "none"; }

  updateCardCount(card, item);

  // stepper
  const qty = tpl.querySelector(".qty");
  tpl.querySelector(".step-dn").addEventListener("click", () => { qty.value = Math.max(1, (+qty.value || 1) - 1); });
  tpl.querySelector(".step-up").addEventListener("click", () => { qty.value = Math.min(500, (+qty.value || 1) + 1); });

  // report
  const reportBtn = tpl.querySelector(".btn-report");
  const thanks = tpl.querySelector(".report-thanks");
  reportBtn.addEventListener("click", async () => {
    const n = Math.max(1, Math.min(500, parseInt(qty.value, 10) || 1));
    reportBtn.disabled = true;
    try {
      await addPledge(item.id, n);
      updateCardCount(card, state[item.id]);
      renderOverall();
      thanks.hidden = false;
      setTimeout(() => { thanks.hidden = true; }, 3500);
      qty.value = 1;
    } catch (e) {
      console.error(e);
      alert("Sorry — could not record that just now. Please try again.");
    } finally {
      reportBtn.disabled = false;
    }
  });

  return tpl;
}

function updateCardCount(card, item) {
  card.querySelector(".c-pledged").textContent = item.pledged.toLocaleString();
  card.querySelector(".bar-fill").style.width = pct(item.pledged, item.goal) + "%";
}

function renderGrid() {
  const grid = document.getElementById("item-grid");
  grid.innerHTML = "";
  Object.values(state)
    .sort((a, b) => (b.goal || 0) - (a.goal || 0))
    .forEach(item => grid.appendChild(renderCard(item)));
}

/* ---------- static bits ---------- */
function renderStatic() {
  document.getElementById("ship-address").innerHTML = CONFIG.SHIP_ADDRESS.join("<br />");
  const link = document.getElementById("contact-link");
  link.href = "mailto:" + CONFIG.CONTACT_EMAIL;

  const shareBtn = document.getElementById("share-btn");
  shareBtn.addEventListener("click", async () => {
    const payload = {
      title: "FUSD Foundation Winter Food Drive",
      text: CONFIG.SHARE_TEXT,
      url: CONFIG.SHARE_URL
    };
    // Native share sheet (phones); fall back to copying the link.
    if (navigator.share) {
      try { await navigator.share(payload); } catch { /* user cancelled */ }
      return;
    }
    try { await navigator.clipboard.writeText(CONFIG.SHARE_URL); } catch { /* blocked */ }
    const label = shareBtn.textContent;
    shareBtn.textContent = "Link copied ✓";
    shareBtn.classList.add("copied");
    setTimeout(() => { shareBtn.textContent = label; shareBtn.classList.remove("copied"); }, 2200);
  });

  document.getElementById("copy-address").addEventListener("click", async (e) => {
    const text = CONFIG.SHIP_ADDRESS.join("\n");
    try { await navigator.clipboard.writeText(text); }
    catch { /* clipboard blocked */ }
    const btn = e.currentTarget;
    const label = btn.textContent;
    btn.textContent = "Copied ✓";
    btn.classList.add("copied");
    setTimeout(() => { btn.textContent = label; btn.classList.remove("copied"); }, 2000);
  });
}

/* ---------- boot ---------- */
(async function init() {
  renderStatic();
  await loadCounts();
  document.getElementById("loading")?.remove();
  renderGrid();
  renderOverall();
})();
