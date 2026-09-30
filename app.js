/* SAFA Quotation — app logic */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { buildPages, derive, money, fmtDate, OPTIONS, esc } = window.SQT;

  /* ---------- storage ---------- */
  const store = {
    get(k, fb) { try { const v = localStorage.getItem("sq_" + k); return v == null ? fb : JSON.parse(v); } catch { return fb; } },
    set(k, v) { try { localStorage.setItem("sq_" + k, JSON.stringify(v)); return true; } catch { toast("Storage is full — delete some saved quotations"); return false; } },
  };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  /* ---------- defaults ---------- */
  const DEFAULT_BRANDS = [
    { id: "fuji", name: "FUJI", code: "FUJI", company: "FUJI Elevator Co. Ltd", country: "China", address: "Address: No.688, Lianxi Avenue, Lianshi Town, Nanxun District, Huzhou City, Zhejiang, China" },
    { id: "sigma", name: "SIGMA", code: "SIGMA", company: "SIGMA Elevator and Building System Corporation", country: "China", address: "Head Office: 6F Two IFC, 10 Gukjegeumyung-ro, Yeongdeungpo-gu, Seoul 150-945" },
    { id: "shanghai", name: "Shanghai Mitsubishi", code: "SHANGHAI", company: "Shanghai Mitsubishi Elevator Co. Ltd.", country: "China", address: "" },
  ];
  const DEFAULT_PEOPLE = [
    { id: "rakib", name: "Rifatullah Rakib", designation: "Director", phone: "01742311865, 01611164296", email: "rifatullah6596@gmail.com" },
    { id: "mostak", name: "Kh.Mostak Ali", designation: "Managing Director", phone: "01742311865", email: "shuhashali@gmail.com" },
  ];
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  function defaultState(brandId) {
    const b = brands.find((x) => x.id === brandId) || brands[0];
    return {
      brandId: b.id, country: b.country, brandAddress: b.address,
      date: today(), refSuffix: "", ref: "",
      toLine: "", clientName: "", clientAddress: "", clientPhone: "", dear: "Dear Sir,",
      projectName: "", projectLocation: "", letterStyle: "auto", subject: "",
      qty: 1, liftName: "P1", capacity: 630, persons: "", speed: "1.6",
      basements: 0, topFloor: 9, stops: "", floors: "", unitPrice: 3000000, validity: 30,
      notes: "Extra price will be added for Design Selection: Cabin, Floor Door Panel & Others.\nThe Shaft Separator Beam / I-Beam / I-Joist will be made by the client.",
      payment: "75 % to be paid at the time of signing Contract/Agreement.\n20 % to be paid on presentation of B/L or shipping advice.\n5 % to be paid after testing and commissioning the lift.",
      t1: "1.5 months", t2: "1.0 month", t3: "1.5 months",
      warrantyType: "warranty", warrantyValue: 12, warrantyUnit: "months", spareYears: 40, maintYears: 1,
      cabinSize: "", shaftSize: "", cabinDesc: "Complete Cabin Grade 304, Sheet 1.5mm, Car Wall: SS Mirror Etching",
      machineRoom: "MR", model: "ELCOSMO-III", motor: "MonaDrive Gearless", power: "380V, 3 Phase, 50Hz", groove: "4",
      control: "Simplex", baseFloor: "", code: "EN-81",
      optAVR: true, optARD: true, optIC: false, optVoice: true, optQuake: false, optOther: true,
      cwMaterial: "Concrete (Local)", cwPosition: "Back Side Counterweight",
      people: ["rakib"],
    };
  }

  let brands = store.get("brands", null) || DEFAULT_BRANDS.slice();
  let people = store.get("people", null) || DEFAULT_PEOPLE.slice();
  let history = store.get("history", []);
  let letterhead = store.get("letterhead", null);
  let state = Object.assign(defaultState(brands[0]?.id), store.get("draft", {}));
  let currentId = store.get("currentId", null);
  const LH_DEFAULT = "assets/letterhead.jpg";
  const lhSrc = () => letterhead || LH_DEFAULT;

  const brand = () => brands.find((b) => b.id === state.brandId) || brands[0] || DEFAULT_BRANDS[0];
  const chosenPeople = () => state.people.map((id) => people.find((p) => p.id === id)).filter(Boolean);

  /* ---------- toast ---------- */
  let tt;
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 2600); }

  /* ---------- form binding ---------- */
  function fillForm() {
    $$("[data-k]").forEach((el) => {
      const k = el.dataset.k; const v = state[k];
      if (el.type === "checkbox") el.checked = !!v; else el.value = v ?? "";
    });
    renderBrandChips(); renderToggles(); renderPeoplePick(); refreshAuto();
  }
  function refreshAuto() {
    const d = derive(state, brand());
    const autos = { ref: d.ref, subject: d.subject, persons: d.persons, stops: d.stops, floors: d.floors, baseFloor: d.baseFloor };
    $$("[data-auto]").forEach((el) => { el.placeholder = String(autos[el.dataset.auto] ?? ""); });
    $("#out-total").textContent = "Tk. " + money(d.total);
    $("#out-words").textContent = d.words;
    $("#ab-total").textContent = "Tk. " + money(d.total);
    $("#ab-brand").textContent = `${brand().name} · ${d.qty} lift${d.qty > 1 ? "s" : ""}${state.clientName ? " · " + state.clientName : ""}`;
    $("#topbar-sub").textContent = currentId ? "Editing saved offer" : "New offer";
  }
  document.addEventListener("input", (e) => {
    const el = e.target.closest("[data-k]"); if (!el) return;
    const k = el.dataset.k;
    state[k] = el.type === "checkbox" ? el.checked : el.value;
    changed();
  });
  let saveT, renderT;
  function changed() {
    refreshAuto();
    clearTimeout(saveT); saveT = setTimeout(() => store.set("draft", state), 300);
    clearTimeout(renderT); renderT = setTimeout(renderPreview, 350);
  }

  /* ---------- brand chips ---------- */
  function renderBrandChips() {
    $("#brand-chips").innerHTML = brands.map((b) => `<button type="button" class="brand-chip ${b.id === state.brandId ? "on" : ""}" data-brand="${b.id}" aria-pressed="${b.id === state.brandId}"><b>${esc(b.name)}</b><small>${esc(b.country)}</small></button>`).join("");
  }
  $("#brand-chips").addEventListener("click", (e) => {
    const c = e.target.closest("[data-brand]"); if (!c) return;
    const b = brands.find((x) => x.id === c.dataset.brand);
    state.brandId = b.id; state.country = b.country; state.brandAddress = b.address;
    fillForm(); changed();
  });

  /* ---------- toggles ---------- */
  function renderToggles() {
    $("#opt-toggles").innerHTML = OPTIONS.map(([k, label]) => `<div class="tog"><span>${label}</span><span class="seg" data-opt="${k}"><button type="button" class="${state[k] ? "on" : ""}" data-v="1">YES</button><button type="button" class="${state[k] ? "" : "on"}" data-v="0">NO</button></span></div>`).join("");
  }
  $("#opt-toggles").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-v]"); if (!btn) return;
    const k = btn.parentElement.dataset.opt; state[k] = btn.dataset.v === "1";
    renderToggles(); changed();
  });

  /* ---------- people ---------- */
  function renderPeoplePick() {
    $("#people-pick").innerHTML = people.map((p) => {
      const on = state.people.includes(p.id);
      return `<label class="person ${on ? "on" : ""}"><input type="checkbox" data-person="${p.id}" ${on ? "checked" : ""}><div><b>${esc(p.name)}</b>${esc(p.designation)}<br>${esc(p.phone)}${p.email ? "<br>" + esc(p.email) : ""}</div></label>`;
    }).join("");
  }
  $("#people-pick").addEventListener("change", (e) => {
    const cb = e.target.closest("[data-person]"); if (!cb) return;
    const id = cb.dataset.person;
    state.people = cb.checked ? [...state.people.filter((x) => x !== id), id] : state.people.filter((x) => x !== id);
    // keep saved order (Director first, then added people)
    state.people.sort((a, b) => people.findIndex((p) => p.id === a) - people.findIndex((p) => p.id === b));
    renderPeoplePick(); changed();
  });
  $("#btn-add-person").onclick = () => { $("#person-form").hidden = false; $("#btn-add-person").hidden = true; $("#pf-name").focus(); };
  $("#pf-cancel").onclick = () => { $("#person-form").hidden = true; $("#btn-add-person").hidden = false; };
  $("#pf-save").onclick = () => {
    const p = { id: uid(), name: $("#pf-name").value.trim(), designation: $("#pf-des").value.trim(), phone: $("#pf-phone").value.trim(), email: $("#pf-email").value.trim() };
    if (!p.name) { toast("Enter a name first"); $("#pf-name").focus(); return; }
    people.push(p); store.set("people", people);
    state.people.push(p.id);
    ["#pf-name", "#pf-des", "#pf-phone", "#pf-email"].forEach((s) => ($(s).value = ""));
    $("#person-form").hidden = true; $("#btn-add-person").hidden = false;
    renderPeoplePick(); renderSettings(); changed(); toast(p.name + " added");
  };

  /* ---------- render + fit ---------- */
  const PAGE_W = 794, PAGE_H = 1123;
  function fitPage(pg) {
    const c = pg.querySelector(".c"); let fs = 14.4;
    pg.style.setProperty("--fs", fs + "px");
    while (c.scrollHeight > c.clientHeight + 1 && fs > 10.5) { fs -= 0.3; pg.style.setProperty("--fs", fs.toFixed(2) + "px"); }
  }
  function renderRoot() {
    const root = $("#render-root");
    root.innerHTML = buildPages(state, brand(), chosenPeople(), lhSrc()).join("");
    $$(".pg", root).forEach(fitPage);
    return $$(".pg", root);
  }
  function mountPreview(container, width) {
    const pages = renderRoot();
    const scale = Math.min(1, width / PAGE_W);
    container.innerHTML = "";
    pages.forEach((pg) => {
      const wrap = document.createElement("div");
      wrap.className = "pg-wrap";
      wrap.style.width = PAGE_W * scale + "px"; wrap.style.height = PAGE_H * scale + "px";
      const clone = pg.cloneNode(true); clone.style.transform = `scale(${scale})`;
      wrap.appendChild(clone); container.appendChild(wrap);
    });
  }
  const isDesk = () => window.matchMedia("(min-width:1080px)").matches;
  function renderPreview() {
    if (isDesk()) {
      const side = $("#side-preview");
      if (!side.firstElementChild) side.innerHTML = `<div class="preview-head"><strong>Live preview</strong><span>A4 · 5 pages</span></div><div class="preview-pages"></div>`;
      mountPreview($(".preview-pages", side), Math.min(side.clientWidth - 8, 620));
    } else if ($("#view-preview").classList.contains("on")) {
      const box = $("#preview-pages");
      mountPreview(box, box.clientWidth || window.innerWidth - 28);
      $("#preview-meta").textContent = `A4 · 5 pages · ${brand().name}`;
    }
  }
  window.addEventListener("resize", () => { document.body.classList.toggle("desk", isDesk()); clearTimeout(renderT); renderT = setTimeout(renderPreview, 200); });

  /* ---------- tabs ---------- */
  function showTab(name) {
    if (name === "preview" && isDesk()) name = "form";
    $$(".tabbar button").forEach((b) => b.classList.toggle("on", b.dataset.tab === name));
    $$(".view").forEach((v) => v.classList.toggle("on", v.dataset.view === name));
    $("#actionbar").classList.toggle("hide", !(name === "form" || name === "preview"));
    if (name === "preview") renderPreview();
    if (name === "history") renderHistory();
    if (name === "settings") renderSettings();
    window.scrollTo({ top: 0 });
  }
  $$(".tabbar button").forEach((b) => (b.onclick = () => showTab(b.dataset.tab)));

  /* ---------- PDF ---------- */
  let lastPdf = null;
  function fileName() {
    const clean = (s) => String(s || "").trim().replace(/[^\w\- ]+/g, "").replace(/\s+/g, "_");
    return [clean(brand().name), "Offer", clean(state.clientName || state.projectName || "Client"), state.date].filter(Boolean).join("_") + ".pdf";
  }
  async function makePdf() {
    const sheet = $("#sheet"), bar = $("#sheet-bar"), msg = $("#sheet-msg");
    sheet.hidden = false; $("#sheet-btns").hidden = true;
    $("#sheet-title").textContent = "Making PDF…"; bar.style.width = "4%";
    try {
      await document.fonts.ready;
      const pages = renderRoot();
      await Promise.all($$("#render-root img").map((im) => (im.complete ? 0 : new Promise((r) => { im.onload = im.onerror = r; }))));
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
      const scale = Math.min(2.5, Math.max(2, window.devicePixelRatio || 2));
      for (let i = 0; i < pages.length; i++) {
        msg.textContent = `Page ${i + 1} of ${pages.length}`;
        const canvas = await html2canvas(pages[i], {
          scale, useCORS: true, backgroundColor: "#ffffff", logging: false,
          width: PAGE_W, height: PAGE_H, windowWidth: PAGE_W, windowHeight: PAGE_H, scrollX: 0, scrollY: 0,
          onclone: (doc) => { const r = doc.getElementById("render-root"); r.style.left = "0px"; r.style.top = "0px"; },
        });
        if (i) pdf.addPage("a4", "portrait");
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.9), "JPEG", 0, 0, 210, 297, undefined, "FAST");
        bar.style.width = ((i + 1) / pages.length) * 100 + "%";
      }
      const d = derive(state, brand());
      pdf.setProperties({ title: `${brand().name} Offer — ${state.clientName || ""}`, subject: d.subject, author: "SAFA Electronics Ltd.", creator: "SAFA Quotation" });
      const blob = pdf.output("blob");
      lastPdf = { blob, name: fileName() };
      saveToHistory(d);
      $("#sheet-title").textContent = "PDF ready";
      msg.textContent = `${lastPdf.name} · ${(blob.size / 1024).toFixed(0)} KB`;
      $("#sh-share").hidden = !(navigator.canShare && navigator.canShare({ files: [new File([blob], lastPdf.name, { type: "application/pdf" })] }));
      $("#sheet-btns").hidden = false;
    } catch (err) {
      console.error(err);
      $("#sheet-title").textContent = "PDF could not be made";
      msg.textContent = (err && err.message ? err.message + ". " : "") + "Reload the app and try again.";
      $("#sheet-btns").hidden = false; $("#sh-download").hidden = $("#sh-share").hidden = $("#sh-open").hidden = true;
      return;
    }
    $("#sh-download").hidden = $("#sh-open").hidden = false;
  }
  $("#btn-generate").onclick = makePdf;
  $("#sh-close").onclick = () => ($("#sheet").hidden = true);
  $("#sh-download").onclick = () => {
    const url = URL.createObjectURL(lastPdf.blob);
    const a = document.createElement("a"); a.href = url; a.download = lastPdf.name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000); toast("Downloaded " + lastPdf.name);
  };
  $("#sh-open").onclick = () => { const url = URL.createObjectURL(lastPdf.blob); window.open(url, "_blank"); };
  $("#sh-share").onclick = async () => {
    const file = new File([lastPdf.blob], lastPdf.name, { type: "application/pdf" });
    try { await navigator.share({ files: [file], title: lastPdf.name }); } catch (e) { if (e.name !== "AbortError") toast("Sharing failed — use Download"); }
  };

  /* ---------- history ---------- */
  function saveToHistory(d) {
    const entry = { id: currentId || uid(), savedAt: Date.now(), state: JSON.parse(JSON.stringify(state)), summary: { brand: brand().name, client: state.clientName || state.projectName || "Unnamed client", ref: d.ref, total: d.total, qty: d.qty, date: state.date } };
    history = [entry, ...history.filter((h) => h.id !== entry.id)].slice(0, 300);
    currentId = entry.id; store.set("history", history); store.set("currentId", currentId); refreshAuto();
  }
  function renderHistory() {
    const q = $("#history-search").value.trim().toLowerCase();
    const list = history.filter((h) => !q || JSON.stringify(h.summary).toLowerCase().includes(q) || (h.state.clientAddress || "").toLowerCase().includes(q));
    $("#history-list").innerHTML = list.length ? list.map((h) => `
      <div class="item">
        <div class="item-main" data-load="${h.id}">
          <span class="tag">${esc(h.summary.brand)}</span>
          <b>${esc(h.summary.client)}</b>
          <small>${esc(h.summary.ref)} · ${fmtDate(h.summary.date)}<br>${h.summary.qty} lift${h.summary.qty > 1 ? "s" : ""} · Tk. ${money(h.summary.total)}</small>
        </div>
        <button class="icon-btn" data-copy="${h.id}" title="Duplicate as new" aria-label="Duplicate as new"><svg viewBox="0 0 24 24"><path d="M8 8h11v11H8z M5 16V5h11"/></svg></button>
        <button class="icon-btn" data-del="${h.id}" title="Delete" aria-label="Delete"><svg viewBox="0 0 24 24"><path d="M5 7h14 M10 7V4h4v3 M7 7l1 13h8l1-13"/></svg></button>
      </div>`).join("") : `<div class="empty">${q ? "No saved quotation matches that search." : "No saved quotations yet. Fill in the form and tap <b>Make PDF</b> — it is saved here automatically."}</div>`;
  }
  $("#history-search").addEventListener("input", renderHistory);
  $("#history-list").addEventListener("click", (e) => {
    const load = e.target.closest("[data-load]"), copy = e.target.closest("[data-copy]"), del = e.target.closest("[data-del]");
    if (load || copy) {
      const h = history.find((x) => x.id === (load || copy).dataset[load ? "load" : "copy"]);
      state = Object.assign(defaultState(h.state.brandId), JSON.parse(JSON.stringify(h.state)));
      if (copy) { state.date = today(); state.ref = ""; currentId = null; } else currentId = h.id;
      store.set("draft", state); store.set("currentId", currentId);
      fillForm(); showTab("form"); renderPreview();
      toast(copy ? "Copied — edit and make a new PDF" : "Loaded " + h.summary.client);
    }
    if (del) {
      if (!confirm("Delete this saved quotation?")) return;
      history = history.filter((x) => x.id !== del.dataset.del); store.set("history", history);
      if (currentId === del.dataset.del) { currentId = null; store.set("currentId", null); }
      renderHistory();
    }
  });
  $("#btn-new").onclick = () => {
    if (!confirm("Start a new quotation? The current form will be cleared (saved PDFs stay in Saved).")) return;
    const keepBrand = state.brandId; state = defaultState(keepBrand); currentId = null;
    store.set("draft", state); store.set("currentId", null); fillForm(); showTab("form"); renderPreview();
  };

  /* ---------- settings ---------- */
  function renderSettings() {
    $("#brand-list").innerHTML = brands.map((b) => `
      <div class="item"><div class="item-main" data-editbrand="${b.id}"><b>${esc(b.name)}</b><small>${esc(b.company)}, ${esc(b.country)}${b.address ? "<br>" + esc(b.address) : ""}</small></div>
      <button class="icon-btn" data-editbrand="${b.id}" aria-label="Edit ${esc(b.name)}"><svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg></button></div>`).join("");
    $("#person-list").innerHTML = people.map((p) => `
      <div class="item"><div class="item-main"><b>${esc(p.name)}</b><small>${esc(p.designation)} · ${esc(p.phone)}${p.email ? "<br>" + esc(p.email) : ""}</small></div>
      <button class="icon-btn" data-delperson="${p.id}" aria-label="Remove ${esc(p.name)}"><svg viewBox="0 0 24 24"><path d="M5 7h14 M10 7V4h4v3 M7 7l1 13h8l1-13"/></svg></button></div>`).join("");
    $("#lh-thumb").src = lhSrc();
  }
  let editingBrand = null;
  function openBrand(id) {
    editingBrand = id ? brands.find((b) => b.id === id) : null;
    const b = editingBrand || { name: "", code: "", company: "", country: "China", address: "" };
    $("#bd-title").textContent = editingBrand ? "Edit brand" : "New brand";
    $("#bd-name").value = b.name; $("#bd-code").value = b.code; $("#bd-company").value = b.company; $("#bd-country").value = b.country; $("#bd-address").value = b.address;
    $("#bd-delete").hidden = !editingBrand; $("#brand-dialog").hidden = false;
  }
  $("#brand-list").addEventListener("click", (e) => { const t = e.target.closest("[data-editbrand]"); if (t) openBrand(t.dataset.editbrand); });
  $("#btn-add-brand").onclick = () => openBrand(null);
  $("#bd-cancel").onclick = () => ($("#brand-dialog").hidden = true);
  $("#bd-save").onclick = () => {
    const v = { name: $("#bd-name").value.trim(), code: $("#bd-code").value.trim() || $("#bd-name").value.trim().toUpperCase(), company: $("#bd-company").value.trim(), country: $("#bd-country").value.trim(), address: $("#bd-address").value.trim() };
    if (!v.name || !v.company) { toast("Brand name and company name are needed"); return; }
    if (editingBrand) Object.assign(editingBrand, v); else brands.push({ id: uid(), ...v });
    store.set("brands", brands);
    if (editingBrand && editingBrand.id === state.brandId) { state.country = v.country; state.brandAddress = v.address; }
    $("#brand-dialog").hidden = true; renderSettings(); fillForm(); changed(); toast("Brand saved");
  };
  $("#bd-delete").onclick = () => {
    if (brands.length <= 1) { toast("Keep at least one brand"); return; }
    if (!confirm(`Delete ${editingBrand.name}?`)) return;
    brands = brands.filter((b) => b !== editingBrand); store.set("brands", brands);
    if (state.brandId === editingBrand.id) { state.brandId = brands[0].id; state.country = brands[0].country; state.brandAddress = brands[0].address; }
    $("#brand-dialog").hidden = true; renderSettings(); fillForm(); changed();
  };
  $("#person-list").addEventListener("click", (e) => {
    const t = e.target.closest("[data-delperson]"); if (!t) return;
    const p = people.find((x) => x.id === t.dataset.delperson);
    if (!confirm(`Remove ${p.name} from the saved list?`)) return;
    people = people.filter((x) => x !== p); store.set("people", people);
    state.people = state.people.filter((x) => x !== p.id); renderSettings(); renderPeoplePick(); changed();
  });
  $("#lh-file").onchange = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement("canvas"); cv.width = 1414; cv.height = 2000;
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      letterhead = cv.toDataURL("image/jpeg", 0.88);
      if (store.set("letterhead", letterhead)) { renderSettings(); renderPreview(); toast("Letterhead updated"); }
    };
    img.src = URL.createObjectURL(f);
  };
  $("#lh-reset").onclick = () => { letterhead = null; store.set("letterhead", null); renderSettings(); renderPreview(); toast("Original letterhead restored"); };
  $("#btn-export").onclick = () => {
    const data = JSON.stringify({ app: "safa-quotation", v: 1, brands, people, history }, null, 1);
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    a.download = `safa-quotation-backup-${today()}.json`; a.click();
  };
  $("#import-file").onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (d.app !== "safa-quotation") throw new Error("not a SAFA Quotation backup");
      brands = d.brands || brands; people = d.people || people; history = d.history || history;
      store.set("brands", brands); store.set("people", people); store.set("history", history);
      fillForm(); renderSettings(); toast("Backup imported");
    } catch (err) { toast("Import failed: " + err.message); }
  };

  /* ---------- PWA ---------- */
  if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
  let deferred;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e; $("#btn-install").hidden = false; });
  $("#btn-install").onclick = async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; $("#btn-install").hidden = true; };

  /* ---------- boot ---------- */
  document.body.classList.toggle("desk", isDesk());
  fillForm(); showTab("form");
  document.fonts.ready.then(renderPreview);
})();
