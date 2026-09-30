/* SAFA Quotation — document templates.
   Every page is 794×1123 px (A4 @96dpi) with the letterhead image behind it. */
(function (global) {
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nl = (v) => esc(v).replace(/\n/g, "<br>");

  /* ---------- numbers ---------- */
  const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (n) => (n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : ""));
  const three = (n) => {
    const h = Math.floor(n / 100), r = n % 100;
    return [h ? ONES[h] + " Hundred" : "", r ? two(r) : ""].filter(Boolean).join(" ");
  };
  /** Bangladeshi system: Crore / Lac / Thousand */
  function inWords(num) {
    let n = Math.round(Math.abs(Number(num) || 0));
    if (n === 0) return "Zero";
    const crore = Math.floor(n / 1e7); n %= 1e7;
    const lac = Math.floor(n / 1e5); n %= 1e5;
    const th = Math.floor(n / 1e3); n %= 1e3;
    const parts = [];
    if (crore) parts.push(inWords(crore) + " Crore");
    if (lac) parts.push(two(lac) + " Lac");
    if (th) parts.push(two(th) + " Thousand");
    if (n) parts.push(three(n));
    return parts.join(" ");
  }
  function money(num) {
    const v = Number(num) || 0;
    const [i, d] = Math.abs(v).toFixed(2).split(".");
    let head = i.slice(0, -3), tail = i.slice(-3);
    if (head) head = head.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + ",";
    return (v < 0 ? "-" : "") + head + tail + "." + d;
  }
  const pad2 = (n) => String(n).padStart(2, "0");
  const countWord = (n) => `${pad2(n)} (${inWords(n)})`;
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function fmtDate(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-").map(Number);
    return `${MONTHS[m - 1]} ${pad2(d)}, ${y}`;
  }

  /* ---------- derived values ---------- */
  function floorsList(s) {
    const b = Math.max(0, parseInt(s.basements) || 0);
    const top = Math.max(0, parseInt(s.topFloor) || 0);
    const out = [];
    if (b === 1) out.push("B");
    else for (let i = b; i >= 1; i--) out.push("B" + i);
    out.push("G");
    for (let i = 1; i <= top; i++) out.push(String(i));
    return out;
  }
  function derive(s, brand) {
    const qty = Math.max(1, parseInt(s.qty) || 1);
    const fl = floorsList(s);
    const floors = (s.floors || "").trim() || fl.join(", ");
    const stops = (s.stops !== "" && s.stops != null) ? s.stops : floors.split(",").filter((x) => x.trim()).length;
    const persons = (s.persons !== "" && s.persons != null) ? s.persons : Math.floor((parseFloat(s.capacity) || 0) / 75);
    const baseFloor = (s.baseFloor || "").trim() || (parseInt(s.basements) > 0 ? floors.split(",")[0].trim() : "G");
    const total = (parseFloat(s.unitPrice) || 0) * qty;
    const year = (s.date || "").slice(0, 4) || new Date().getFullYear();
    const code = (brand.code || brand.name || "").toUpperCase().replace(/\s+/g, "");
    const ref = (s.ref || "").trim() || ["SAFA", code, "OFFER", (s.refSuffix || "").trim().toUpperCase(), year].filter(Boolean).join("/");
    const style = s.letterStyle === "auto" ? (s.projectName ? "project" : "intro") : s.letterStyle;
    const nos = qty === 1 ? "no." : "Nos.";
    const proj = (s.projectName || "").trim();
    const subject = (s.subject || "").trim() ||
      `Offer for Supply, Installation, Testing and Commissioning of ${countWord(qty)} ${nos} of ${brand.name} Brand ${proj || qty > 1 ? (qty > 1 ? "Passenger Lifts" : "Passenger Lift") : "Elevator Lift"} for Your Prestigious ${proj ? "“" + proj + "” " : ""}Project.`;
    return { qty, floors, stops, persons, baseFloor, total, ref, style, nos, proj, subject, words: inWords(total) + " Taka Only" };
  }

  /* ---------- pages ---------- */
  const OFFER_POINTS = [
    "The Affordable, Technological Revolution by introducing special microprocessor base AC-VVVF inverter control – a 32-bit microprocessor-based system with the latest machine.",
    "Offering a well-structured range of various car designs.",
    "Spanning the key architectural modes in the residential building, office, shopping center, hospital, hotel, and commercial sector.",
    "We are committed to ensuring quick and safe movement of passengers by hassle-free vertical transportation.",
    "With us you will experience a minimum of maintenance interruption due to highly reliable equipment, which can be maintained mostly without downtime.",
    "Long-term guarantee of uninterrupted supply of genuine spare parts from the manufacturer.",
    "A group of management, engineers, and technical persons being widely and properly trained to meet all aspects of Installation, Testing, Commissioning, Maintenance, and after-sales service along with a wide range of Installation and Maintenance instruments.",
  ];

  function page(lh, inner, cls = "") {
    return `<div class="pg ${cls}"><img class="lh" src="${lh}" alt=""><div class="c">${inner}</div></div>`;
  }

  function coverLetter(s, b, d, people) {
    const country = s.country || b.country;
    const toLines = [];
    if (s.toLine) toLines.push(esc(s.toLine));
    if (s.clientName) toLines.push(`<b>${esc(s.clientName)}${s.toLine ? "" : ","}</b>`);
    if (s.clientAddress) toLines.push(nl(s.clientAddress));
    if (s.clientPhone) toLines.push("Phone: " + esc(s.clientPhone));

    const lifts = `${countWord(d.qty)} ${d.nos} of ${esc(b.name)} Brand Passenger ${d.qty > 1 ? "Lifts" : "Lift"}`;
    const intro = d.style === "project"
      ? `<p>It is our pleasure to submit our offer for the supply, installation, testing and commissioning of ${lifts} for your esteemed ${d.proj ? `project “${esc(d.proj)}”${s.projectLocation ? ", " + esc(s.projectLocation) : ""}` : "project"}.<br>We appreciate your trust in our company and are pleased to present this proposal based on your shared technical and commercial requirements.</p>`
      : `<p>It is our pleasure for giving us the opportunity to introduce ourselves as a Joint Venture Company in the Elevator and Escalator Sector. We have a long-term vision to ascertain a dedicated, skilled professional and 24 hours’ available maintenance service house in this sector.</p>`;

    const signs = people.map((p) => `<div><b>${esc(p.name)}</b><br>${esc(p.designation)}${p.phone ? `<br>Phone #: ${esc(p.phone)}` : ""}${p.email ? `<br>E-mail: <span class="mail">${esc(p.email)}</span>` : ""}</div>`).join("");

    return `
      <div class="between"><span>Ref. No: ${esc(d.ref)}</span><span>Date: ${fmtDate(s.date)}</span></div>
      <div class="to"><b>To,</b><br>${toLines.join("<br>")}</div>
      <p class="subject"><b>Subject: ${esc(d.subject)}</b></p>
      <p><b>${esc(s.dear || "Dear Sir,")}</b></p>
      ${intro}
      <p style="margin-bottom:.35em">We are the Authorized distributor of <b>${esc(b.company)}, ${esc(country)}</b> in the territory of Bangladesh. The combination of Asian high technologies and reliable Machines result in an innovative, modular concept in creative, architectural flexibility by combining elements from all key areas of the lift.</p>
      <ol>${OFFER_POINTS.map((t) => `<li>${t}</li>`).join("")}</ol>
      <p>We are confident and hope that <b>${esc(b.name)} Elevator Lift</b> will match your requirements in all respects. It will be our great pleasure to hear from you soon.</p>
      <p>Thanking you.</p>
      <p style="margin-top:1.6em"><b>Very sincerely yours,</b></p>
      <div class="signs ${people.length === 1 ? "one" : ""}">${signs}</div>
      <p><b>Encl.: Offer Sheet</b></p>`;
  }

  function offerSheet(s, b, d) {
    const country = s.country || b.country;
    const mrText = s.machineRoom === "MRL" ? "Gear-less Motor &amp; Machine Room-less system" : "Gear-less Motor &amp; Machine Room system";
    const lines = (t) => String(t || "").split("\n").map((x) => x.trim()).filter(Boolean);
    const notes = lines(s.notes);
    const pay = lines(s.payment);
    const offerFor = `${countWord(d.qty)} ${d.nos} ${d.qty > 1 ? "Elevators" : "Elevator"}`;
    return `
      <h3 class="center" style="margin-top:6px">OFFER SHEET</h3>
      <p class="center"><b>We are pleased to submit our best offer for ${offerFor} under the following terms and conditions:</b></p>
      <div class="kv">
        <b>Brand &amp; Origin</b><b>: ${esc(b.name)}, ${esc(country.toUpperCase())}</b>
        <span>Country of Manufacturing</span><b>: ${esc(country)}</b>
        <span>Series</span><span>: Modern and latest technology based <b>${esc(s.model)}</b> (${mrText})</span>
        <b>Validity of Offer</b><b>: ${esc(s.validity)} days from offer submission date</b>
      </div>
      <p><b>${esc(b.name)} Passenger Lift</b> — AC-VVVF Gear-less drive (Minimum Power Consumption Control) with modern facilities, complete from our principal and all other as per enclosed including custom duty, Tax, insurance, L/C opening charge, clearing, forwarding, transportation, and all related charges up to project site. Including installation, testing, commissioning up to handover. <b>${esc(s.model)} Series</b> and eco-style compliance technology. <b>Including ${esc(b.name)} Landing Device (SLANDER), ARD</b>, and Fireman Switch.</p>
      <div class="h-u" style="margin-top:2.2em">PRICE SUMMARY FOR THE LIFT MATERIALS:</div>
      <table class="price">
        <tr><th style="width:52px">Lift</th><th>Commodity &amp; Specification</th><th style="width:66px">Qty</th><th style="width:140px">Unit Price</th><th style="width:150px">Total Amount</th></tr>
        <tr><td>${esc(s.liftName)}</td>
          <td>Kg-${esc(s.capacity)}, Persons-${esc(d.persons)}, Stop-${esc(d.stops)}, Speed-${esc(s.speed)} m/s<br>Serving Floors: ${esc(d.floors)}</td>
          <td>${d.qty}</td><td>Tk. ${money(s.unitPrice)}</td><td>Tk. ${money(d.total)}</td></tr>
      </table>
      <div class="words">In Words: (${esc(d.words)})</div>
      ${notes.length ? `<b>Note</b><ol class="notes">${notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ol>` : ""}
      <div class="h-u">PAYMENT TERMS OF LOCAL AMOUNT:</div>
      <p class="plain">${pay.map((p, i) => `${"abcdefgh"[i] || i + 1}. ${esc(p)}`).join("<br>")}</p>
      <div class="h-u" style="margin-top:3.2em">PROJECT COMPLETION PERIOD</div>
      <p class="plain">Total completion period for supply, installation, testing &amp; commissioning of lift from the date of work order and subsequently opening L/C, as mentioned below:</p>
      <div class="timeline">
        <span>i)</span><span>Manufacturing time</span><span>${esc(s.t1)}</span>
        <span>ii)</span><span>Shipping period &amp; delivery at site</span><span>${esc(s.t2)}</span>
        <span>iii)</span><span>Installation, testing, commissioning &amp; handover</span><span>${esc(s.t3)}</span>
      </div>`;
  }

  function termsPage(s, b) {
    const country = s.country || b.country;
    const wv = parseInt(s.warrantyValue) || 0;
    const unit = s.warrantyUnit === "years" ? (wv === 1 ? "Year" : "Years") : (wv === 1 ? "month" : "months");
    const wtxt = `${s.warrantyType === "replacement" ? "replacement warranty" : "warranty"} period of ${wv} ${unit}`;
    const my = parseInt(s.maintYears) || 1;
    return `<div class="sec">
      <div class="h-u first">WARRANTY</div>
      <p>Our principal will provide a <span class="${s.warrantyType === "replacement" ? "orange" : ""}"><b>${wtxt}</b></span> from the date of commissioning and handover of the lift.</p>
      <div class="h-u">SPARE PARTS</div>
      <p>We confirm smooth and continuous supply of <b>spare parts for at least ${esc(s.spareYears)} years</b>. Spares can be imported by your good self through L/C or supplied directly by us, with payment to be made by the client.</p>
      <div class="h-u">FREE MAINTENANCE PERIOD</div>
      <p>We offer a <b>free maintenance period of ${countWord(my)} ${my === 1 ? "year" : "years"}</b> from the date of commissioning.</p>
      <div class="h-u">ERECTION WORKS</div>
      <p>We shall complete the erection of the elevator based on a detailed schedule mutually agreed upon at the time of contract signing.</p>
      <p>The installation period shall commence from the date of receipt of materials at your project site, provided that the <b>Hoist Way${s.machineRoom === "MRL" ? "" : " and Machine Room"}</b> ${s.machineRoom === "MRL" ? "is" : "are"} fully completed, and <b>3-phase power supply</b> has been handed over to us for uninterrupted work.</p>
      <div class="h-u">FORCE MAJEURE CLAUSE</div>
      <p>We shall not be liable for any loss, damage, or delays due to causes beyond our reasonable control, including but not limited to:</p>
      <p>embargoes, government actions, strikes, lockouts, fire, accidents, theft, explosion, earthquakes, floods, bad weather, natural disasters, civil commotions, unforeseen technical breakdowns, malicious acts, wars, or acts of third parties.</p>
      <p>We shall also not be liable for any <b>indirect or consequential losses or damages</b> arising from such events.</p>
      <div class="h-u">WORKS TO BE DONE BY OTHERS</div>
      <p>A brief list of related works that must be done by the client (not included within our scope) will be enclosed.</p>
      <p>It is also necessary for the client to provide <b>sufficient weatherproof, lockable storage space</b> at the ground floor near the elevator shafts free of cost for safe storage until handover.</p>
      <div class="h-u">OTHER FEATURES</div>
      <p>The equipment supplied by us will comply with <b>Global Standards (GB)</b> and <b>${esc(b.name)} Standard Codes</b>.</p>
      <div class="h-u">INTERNATIONAL SERVICE SUPPORT</div>
      <p>The <b>${esc(b.name)} Elevator Division, ${esc(country)}</b>, dispatches their engineers to visit and inspect installation and running lifts in Bangladesh several times per year for <b>Quality Control Review (QCR)</b>.</p>
      <p>This means that <b>SAFA ELECTRONICS LTD</b> is not only responsible for ensuring quality service of <b>${esc(b.name)}</b> products, but <b>${esc(b.company.toUpperCase())} (${esc(country)})</b> itself takes direct responsibility for the ongoing performance and reliability of their products.</p>
    </div>`;
  }

  function techPage(s, b, d) {
    const country = s.country || b.country;
    const addr = (s.brandAddress || "").trim();
    const remark = addr ? (addr.toLowerCase().endsWith(country.toLowerCase()) ? addr : `${addr}, ${country}`) : country;
    const row = (n, label, desc, rem = "") => `<tr><td>${n}</td><td>${label}</td><td></td><td>${desc}</td><td>${rem}</td></tr>`;
    return `
      <h3 class="center" style="font-size:1.28em;margin:14px 0 12px">ELEVATOR TECHNICAL DATA</h3>
      <table class="tech">
        <tr><th>No</th><th>Project</th><th>Content</th><th>Description</th><th>Remark</th></tr>
        <tr class="band"><td colspan="5">Basic Specification</td></tr>
        ${row(1, "Cabin" + (s.cabinSize ? "<br>" + esc(s.cabinSize) : ""), nl(s.cabinDesc), "Shaft Size" + (s.shaftSize ? "<br>" + esc(s.shaftSize) : ""))}
        ${row(2, "Lift Name", esc(s.liftName))}
        ${row(3, "Brand Name", esc(b.name), nl(remark))}
        ${row(4, "Machine Room", esc(s.machineRoom))}
        ${row(5, "Elevator Motor", esc(s.motor))}
        ${row(6, "Power", esc(s.power))}
        ${row(7, "Model", esc(s.model))}
        ${row(8, "Groove", esc(s.groove))}
        ${row(9, "Capacity", esc(s.capacity) + " KG")}
        ${row(10, "Speed", esc(s.speed) + " m/s")}
        ${row(11, "Quantity", d.qty)}
        ${row(12, "Control Type", esc(s.control))}
        ${row(13, "Stops / Floors / Doors", esc(d.stops))}
        ${row(14, "Serving Floors", "Floors: " + esc(d.floors))}
        ${row(15, "Base Floor", esc(d.baseFloor))}
        ${row(16, "Code", esc(s.code))}
      </table>`;
  }

  const OPTIONS = [
    ["optAVR", "Automatic Voltage Regulator (AVR)"],
    ["optARD", "ARD"],
    ["optIC", "IC Control System"],
    ["optVoice", "Voice Announcer"],
    ["optQuake", "Earthquake Sensor"],
    ["optOther", "Other Demand"],
  ];
  function optPage(s) {
    let n = 17;
    const rows = OPTIONS.map(([k, label]) => `<tr><td>${n++}</td><td>${label}</td><td></td><td>${s[k] ? "YES" : "NO"}</td><td></td></tr>`).join("");
    return `
      <table class="tech opt">
        <tr><th style="padding:10px 6px">No</th><th>Project</th><th>Content</th><th>Description</th><th>Remark</th></tr>
        <tr class="band"><td colspan="5" style="padding:10px">Optional Function</td></tr>
        ${rows}
        <tr><td>${n++}</td><td>Counter Weight Materials</td><td></td><td>${esc(s.cwMaterial)}</td><td></td></tr>
        <tr><td>${n++}</td><td>Counter Weight Position</td><td></td><td>${esc(s.cwPosition)}</td><td></td></tr>
      </table>
      <div class="dots">……………………………………..</div>`;
  }

  function buildPages(s, brand, people, lh) {
    const d = derive(s, brand);
    return [
      page(lh, coverLetter(s, brand, d, people), "p-letter"),
      page(lh, offerSheet(s, brand, d), "p-offer"),
      page(lh, termsPage(s, brand), "p-terms"),
      page(lh, techPage(s, brand, d), "p-tech"),
      page(lh, optPage(s), "p-opt"),
    ];
  }

  global.SQT = { buildPages, derive, inWords, money, fmtDate, countWord, OPTIONS, esc };
})(window);
