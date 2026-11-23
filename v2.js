/* Digital Rewards v2 – extra behaviour on top of site.js */
(function () {
  var $all = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var num = function (n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); };
  var rand = function (n) { return "R" + num(n); };

  /* ROI calculator: customers x % who come back more x spend x extra visits (option 1, 23 Nov) */
  $all("[data-roi]").forEach(function (box) {
    var fee = Number(box.getAttribute("data-roi-fee")) || 2495;
    var v = { cust: 500, spend: 250, share: 20, visits: 1 };
    var lim = { cust: [10, 20000], spend: [10, 20000], share: [1, 100], visits: [1, 8] };
    var ins = $all("input[data-roi-in]", box);
    var run = function (typing) {
      var kept = Math.round(v.cust * v.share / 100);
      var month = kept * v.spend * v.visits;
      var out = {
        month: rand(month), year: rand(month * 12), kept: num(kept), extra: num(kept * v.visits), spend: rand(v.spend),
        shareHint: num(kept) + " of your " + num(v.cust) + " customers",
        visitsTxt: v.visits === 1 ? "1 more time" : v.visits + " more times",
        times: month >= fee ? (month / fee).toFixed(1).replace(/\.0$/, "") + "x" : "under 1x"
      };
      $all("[data-roi-out]", box).forEach(function (el) { var k = el.getAttribute("data-roi-out"); if (k in out) el.textContent = out[k]; });
      ins.forEach(function (el) {
        if (el === typing) return;
        el.value = v[el.getAttribute("data-roi-in")];
        if (el.type === "range") el.style.setProperty("--p", Math.min(100, Math.max(0, (el.value - el.min) / (el.max - el.min) * 100)) + "%");
      });
      $all("[data-roi-pick]", box).forEach(function (g) {
        var k = g.getAttribute("data-roi-pick");
        $all("button", g).forEach(function (b) { b.setAttribute("aria-pressed", Number(b.getAttribute("data-v")) === v[k] ? "true" : "false"); });
      });
    };
    var set = function (k, val, typing) {
      val = Number(val);
      if (!isFinite(val)) return;
      v[k] = Math.min(lim[k][1], Math.max(lim[k][0], Math.round(val)));
      run(typing);
    };
    ins.forEach(function (el) {
      var k = el.getAttribute("data-roi-in");
      el.addEventListener("input", function () { if (el.value !== "") set(k, el.value, el.type === "range" ? null : el); });
      el.addEventListener("blur", function () { run(null); });
      if (el.type === "number") el.addEventListener("focus", function () { el.select(); });
    });
    $all("[data-roi-pick] button", box).forEach(function (b) {
      b.addEventListener("click", function () { set(b.parentNode.getAttribute("data-roi-pick"), b.getAttribute("data-v")); });
    });
    /* Google Analytics (only loads after cookie Accept): send the numbers once the visitor stops changing them for 2 s */
    var sent = "", timer = null;
    var report = function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        var key = [v.cust, v.spend, v.share, v.visits].join("|");
        if (key === sent || !window.gtag) return;
        sent = key;
        var kept = Math.round(v.cust * v.share / 100);
        window.gtag("event", "calculator_use", {
          customers: v.cust, avg_spend: v.spend, come_back_pct: v.share, extra_visits: v.visits,
          monthly_value: kept * v.spend * v.visits, page_section: location.pathname
        });
      }, 2000);
    };
    /* Remember the owner's numbers for this visit so the assessment form can send them with the lead */
    var remember = function () {
      var kept = Math.round(v.cust * v.share / 100);
      var txt = "Calculator: " + num(v.cust) + " customers a month, " + rand(v.spend) + " average spend, " + v.share +
        "% come back more, +" + v.visits + (v.visits === 1 ? " visit" : " visits") + " each = " + rand(kept * v.spend * v.visits) + " extra a month";
      try { sessionStorage.setItem("dr-calc", txt); } catch (e) {}
      try { document.dispatchEvent(new CustomEvent("dr-calc")); } catch (e) {}
    };
    box.addEventListener("input", function () { report(); remember(); });
    box.addEventListener("click", function (e) { if (e.target.closest("[data-roi-pick] button")) { report(); remember(); } });
    run(null);
  });

  /* Lead form: the proxy keeps only known fields, so fold "what do you want" into the challenge note */
  $all("form[data-lead-form]").forEach(function (form) {
    var interest = form.querySelector('[name="interest"]');
    var note = form.querySelector('[name="challenge_note"]');
    var hidden = form.querySelector('input[name="challenge"]');
    if (!interest || !hidden) return;
    var sync = function () {
      var parts = [], calc = "";
      try { calc = sessionStorage.getItem("dr-calc") || ""; } catch (e) {}
      if (interest.value) parts.push("Wants: " + interest.value);
      if (calc) parts.push(calc);
      if (note && note.value.trim()) parts.push(note.value.trim());
      hidden.value = parts.join(". ");
    };
    form.addEventListener("input", sync);
    form.addEventListener("change", sync);
    form.addEventListener("submit", sync, true);
    document.addEventListener("dr-calc", sync);
    sync();
  });

  /* Form dropdowns: glass icon list (style B). Mouse/trackpad only; phones keep the native picker.
     The real <select> stays in the form (hidden) so the same value is sent and required still works. */
  (function () {
    if (!window.matchMedia || !matchMedia("(pointer: fine)").matches) return;
    var P = {
      cup: "M4 8h13v5a6 6 0 01-6 6h-1a6 6 0 01-6-6V8zM17 10h1.5a2.5 2.5 0 010 5H17M8 2.5v3M12 2.5v3",
      leaf: "M5 19C5 10 10 5 19 5c0 9-5 14-14 14zM5 19l8-8",
      tag: "M3 12V4h8l10 10-8 8L3 12zM7.5 8.5h.01",
      bag: "M5 8h14l-1 13H6L5 8zM9 8V6a3 3 0 016 0v2",
      cut: "M6 9a3 3 0 100-6 3 3 0 000 6zM6 21a3 3 0 100-6 3 3 0 000 6zM8.1 7.9L20 20M8.1 16.1L20 4",
      spark: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",
      bed: "M3 18V7M3 13h18v5M21 13a3 3 0 00-3-3h-7v3M7 12h.01",
      gym: "M6 6v12M18 6v12M3 9v6M21 9v6M6 12h12",
      store: "M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6",
      dots: "M5 12h.01M12 12h.01M19 12h.01",
      team: "M9 11a4 4 0 100-8 4 4 0 000 8zM2 21a7 7 0 0114 0M17 11a3 3 0 100-6M22 21a6 6 0 00-5-5.9",
      screen: "M3 4h18v12H3zM8 20h8M12 16v4",
      compass: "M12 21a9 9 0 100-18 9 9 0 000 18zM15.5 8.5l-2 5-5 2 2-5 5-2z"
    };
    var MAP = [[/restaurant|caf/i, "cup", "#FF7A90"], [/butch|special/i, "tag", "#FFB86B"], [/shopping/i, "bag", "#38BDF8"], [/salon|barber/i, "cut", "#9E8BFF"], [/spa|beauty/i, "spark", "#F9A8D4"], [/hotel|hospital/i, "bed", "#7FCFEF"], [/gym|fit/i, "gym", "#FFE81F"], [/retail store/i, "store", "#60A5FA"], [/managed/i, "team", "#9E8BFF"], [/software/i, "screen", "#38BDF8"], [/not sure/i, "compass", "#FFE81F"], [/.*/, "dots", "#A9BDDF"]];
    var icon = function (text) {
      var m = MAP.filter(function (r) { return r[0].test(text); })[0];
      return '<span class="dsel-ic" style="--c:' + m[2] + '"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (m[1] === "dots" ? 3 : 1.8) + '" stroke-linecap="round" stroke-linejoin="round"><path d="' + P[m[1]] + '"/></svg></span>';
    };
    var CHEV = '<svg class="dsel-chev" aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
    var isPh = function (o) { return !o || (o.hasAttribute("value") && o.value === ""); };
    var n = 0;
    $all("form[data-lead-form] select").forEach(function (sel) {
      var id = (sel.id || "dsel") + "-d" + (++n);
      var wrap = document.createElement("div"); wrap.className = "dsel";
      sel.parentNode.insertBefore(wrap, sel); wrap.appendChild(sel);
      sel.classList.add("dsel-native"); sel.tabIndex = -1; sel.setAttribute("aria-hidden", "true");
      var btn = document.createElement("button"); btn.type = "button"; btn.className = "dsel-btn"; btn.id = id + "-btn";
      btn.setAttribute("role", "combobox"); btn.setAttribute("aria-haspopup", "listbox"); btn.setAttribute("aria-expanded", "false"); btn.setAttribute("aria-controls", id + "-list");
      var list = document.createElement("ul"); list.className = "dsel-list"; list.id = id + "-list"; list.setAttribute("role", "listbox"); list.hidden = true;
      var lab = sel.id && document.querySelector('label[for="' + sel.id + '"]');
      if (lab) {
        lab.id = lab.id || id + "-lbl";
        btn.setAttribute("aria-labelledby", lab.id + " " + btn.id); list.setAttribute("aria-labelledby", lab.id);
        lab.addEventListener("click", function (e) { e.preventDefault(); btn.focus(); });
      }
      var opts = Array.prototype.filter.call(sel.options, function (o) { return !isPh(o); });
      var items = opts.map(function (o, i) {
        var li = document.createElement("li"); li.setAttribute("role", "option"); li.id = id + "-o" + i; li.setAttribute("data-i", i);
        li.innerHTML = icon(o.text) + "<span></span>"; li.lastChild.textContent = o.text;
        list.appendChild(li); return li;
      });
      wrap.appendChild(btn); wrap.appendChild(list);
      var open = false, active = -1, buf = "", bt;
      var render = function () {
        var o = sel.options[sel.selectedIndex], ph = isPh(o);
        btn.innerHTML = (ph ? "" : icon(o.text)) + '<span class="dsel-val"></span>' + CHEV;
        btn.querySelector(".dsel-val").textContent = o ? o.text : "";
        btn.classList.toggle("is-ph", ph);
        items.forEach(function (li, i) { li.setAttribute("aria-selected", opts[i].selected ? "true" : "false"); });
      };
      var setActive = function (i, scroll) {
        active = Math.max(0, Math.min(items.length - 1, i));
        items.forEach(function (li, k) { li.classList.toggle("is-active", k === active); });
        btn.setAttribute("aria-activedescendant", items[active].id);
        if (scroll !== false) items[active].scrollIntoView({ block: "nearest" });
      };
      var outside = function (e) { if (!wrap.contains(e.target)) closeL(); };
      var openL = function () {
        if (open) return; open = true; list.hidden = false; btn.setAttribute("aria-expanded", "true"); wrap.classList.add("is-open");
        list.style.maxHeight = "";
        var r = btn.getBoundingClientRect(), h = list.offsetHeight, below = innerHeight - r.bottom - 16, above = r.top - 16;
        var up = h > below && above > below;
        wrap.classList.toggle("up", up);
        if (h > (up ? above : below)) list.style.maxHeight = Math.max(160, up ? above : below) + "px";
        var cur = -1; opts.forEach(function (o, i) { if (o.selected) cur = i; }); setActive(cur >= 0 ? cur : 0);
        document.addEventListener("pointerdown", outside, true);
      };
      var closeL = function () {
        if (!open) return; open = false; list.hidden = true; btn.setAttribute("aria-expanded", "false"); btn.removeAttribute("aria-activedescendant");
        wrap.classList.remove("is-open"); document.removeEventListener("pointerdown", outside, true);
      };
      var choose = function (i) {
        sel.value = opts[i].value;
        sel.dispatchEvent(new Event("input", { bubbles: true })); sel.dispatchEvent(new Event("change", { bubbles: true }));
        btn.classList.remove("is-bad"); closeL(); btn.focus();
      };
      btn.addEventListener("click", function () { if (open) closeL(); else openL(); });
      list.addEventListener("click", function (e) { var li = e.target.closest("[role=option]"); if (li) choose(+li.getAttribute("data-i")); });
      list.addEventListener("pointermove", function (e) { var li = e.target.closest("[role=option]"); if (li && +li.getAttribute("data-i") !== active) setActive(+li.getAttribute("data-i"), false); });
      btn.addEventListener("keydown", function (e) {
        var k = e.key;
        if (k.length === 1 && /\S/.test(k) && !e.metaKey && !e.ctrlKey && !e.altKey) {
          buf += k.toLowerCase(); clearTimeout(bt); bt = setTimeout(function () { buf = ""; }, 700);
          for (var j = 0; j < opts.length; j++) if (opts[j].text.toLowerCase().indexOf(buf) === 0) { if (!open) openL(); setActive(j); break; }
          return;
        }
        if (!open) { if (k === "ArrowDown" || k === "ArrowUp" || k === "Enter" || k === " ") { e.preventDefault(); openL(); } return; }
        if (k === "ArrowDown") { e.preventDefault(); setActive(active + 1); }
        else if (k === "ArrowUp") { e.preventDefault(); setActive(active - 1); }
        else if (k === "Home") { e.preventDefault(); setActive(0); }
        else if (k === "End") { e.preventDefault(); setActive(items.length - 1); }
        else if (k === "Enter" || k === " ") { e.preventDefault(); choose(active); }
        else if (k === "Escape") { e.preventDefault(); closeL(); }
        else if (k === "Tab") closeL();
      });
      sel.addEventListener("invalid", function () { btn.classList.add("is-bad"); });
      sel.addEventListener("focus", function () { btn.focus(); });
      sel.addEventListener("change", render);
      if (sel.form) sel.form.addEventListener("reset", function () { setTimeout(render, 0); });
      render();
    });
  })();

  /* Mark the current page in the main nav */
  var here = location.pathname.replace(/\.html$/, "").split("/").pop();
  $all('header nav a.pill').forEach(function (a) {
    var h = (a.getAttribute("href") || "").split("#")[0];
    if (h && h === here) a.classList.add("on");
  });
})();

/* Pricing: monthly / yearly switch */
(function () {
  Array.prototype.forEach.call(document.querySelectorAll("[data-pr]"), function (root) {
    function set(yr) {
      root.classList.toggle("yr", yr);
      Array.prototype.forEach.call(root.querySelectorAll(".pr-sw"), function (s) { s.setAttribute("aria-checked", yr ? "true" : "false"); });
      Array.prototype.forEach.call(root.querySelectorAll(".pr-lm"), function (e) { e.classList.toggle("on", !yr); });
      Array.prototype.forEach.call(root.querySelectorAll(".pr-ly"), function (e) { e.classList.toggle("on", yr); });
    }
    Array.prototype.forEach.call(root.querySelectorAll(".pr-sw"), function (s) { s.addEventListener("click", function () { set(s.getAttribute("aria-checked") !== "true"); }); });
    Array.prototype.forEach.call(root.querySelectorAll(".pr-lm"), function (e) { e.addEventListener("click", function () { set(false); }); });
    Array.prototype.forEach.call(root.querySelectorAll(".pr-ly"), function (e) { e.addEventListener("click", function () { set(true); }); });
  });
})();

/* Area Partner earnings calculator: goal → clients needed (50% own / 30% booked, half each) */
(function () {
  var root = document.querySelector("[data-apcalc]");
  if (!root) return;
  var OWN = 0.5, BK = 0.3, RING = 590.6, MAXGOAL = 50000;
  var st = { goal: 20000, pace: 3, fee: 2495 };
  var R = function (n, cents) {
    var s = (cents ? n.toFixed(2) : String(Math.round(n))).split(".");
    var whole = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return "R" + whole + (s[1] && s[1] !== "00" ? "." + s[1] : "");
  };
  var set = function (k, v) { Array.prototype.forEach.call(root.querySelectorAll('[data-apc="' + k + '"]'), function (e) { e.textContent = v; }); };
  var render = function () {
    var per = st.fee * (OWN + BK) / 2;
    var need = Math.ceil(st.goal / per), months = Math.ceil(need / st.pace);
    set("pace", st.pace); set("per", R(per, true)); set("need", need); set("goal", R(st.goal));
    set("months", months); set("raise", "+" + R(per, true));
    var wk = Math.round(st.pace / 4.33);
    set("every", st.pace >= 4.3 ? wk + " new client" + (wk === 1 ? "" : "s") + " a week" : "1 new client every " + Math.round(30 / st.pace) + " days");
    var ring = root.querySelector("[data-apc-ring]");
    if (ring) ring.style.strokeDashoffset = String(RING * (1 - Math.min(1, st.goal / MAXGOAL)));
  };
  var group = function (sel, key, attr) {
    var btns = root.querySelectorAll(sel);
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener("click", function () {
        Array.prototype.forEach.call(btns, function (x) { var on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-checked", on ? "true" : "false"); });
        st[key] = +b.getAttribute(attr); render();
      });
    });
  };
  group("[data-goal]", "goal", "data-goal");
  group("[data-fee]", "fee", "data-fee");
  var pace = root.querySelector("[data-apc-pace]");
  if (pace) pace.addEventListener("input", function () { st.pace = +pace.value; render(); });
  render();
})();

/* Refer a business page: get a personal share link, then share it (23 Nov 2026).
   The proxy gives the same code for the same number, so the link is kept in this browser too. */
(function () {
  var box = document.querySelector("[data-ref-box]");
  if (!box) return;
  var C = window.DR_CONFIG || {};
  var form = box.querySelector("[data-ref-form]"), out = box.querySelector("[data-ref-out]");
  var err = box.querySelector("[data-ref-error]"), submit = form.querySelector('button[type="submit"]');
  var linkOf = function (code) { return "https://digitalrewards.co.za/?ref=" + code; };
  var msgOf = function (code) { return "Hi! Your place should have a rewards card for regulars like me. Digital Rewards sets it up on Apple and Google Wallet, and the assessment is free: " + linkOf(code); };
  var ev = function (name, p) { try { if (window.gtag) window.gtag("event", name, p || {}); } catch (e) {} };
  var show = function (code, name) {
    box.querySelector("[data-ref-url]").textContent = linkOf(code).replace(/^https:\/\//, "");
    box.querySelector("[data-ref-name]").textContent = name ? ", " + name.split(" ")[0] : "";
    box.querySelector("[data-ref-wa]").href = "https://wa.me/?text=" + encodeURIComponent(msgOf(code));
    box.setAttribute("data-code", code);
    form.hidden = true; out.hidden = false;
  };
  var fail = function (m) { err.textContent = m; err.hidden = false; submit.disabled = false; };
  var copy = function (text, btn) {
    var done = function () { var t = btn.textContent; btn.textContent = "Copied"; setTimeout(function () { btn.textContent = t; }, 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
    else { var ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (e) {} ta.remove(); }
  };
  try { var saved = JSON.parse(localStorage.getItem("dr-my-ref") || "null"); if (saved && /^[A-Z0-9]{6}$/.test(saved.code)) show(saved.code, saved.name); } catch (e) {}

  var hp = document.createElement("input");
  hp.type = "text"; hp.name = "website"; hp.tabIndex = -1; hp.autocomplete = "off"; hp.setAttribute("aria-hidden", "true");
  hp.style.cssText = "position:absolute;left:-9999px;width:1px;height:1px;opacity:0";
  form.appendChild(hp);

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    err.hidden = true;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var d = {}; new FormData(form).forEach(function (v, k) { d[k] = String(v).trim(); });
    if (d.website) return;
    d.page = location.pathname;
    if (!C.referrerEndpoint) return fail("This is not switched on yet. Please check back soon.");
    submit.disabled = true;
    fetch(C.referrerEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok || !j.code) return fail(r.status === 400 && j.error ? j.error : (j.error || "Sorry, that did not work. Please try again."));
          try { localStorage.setItem("dr-my-ref", JSON.stringify({ code: j.code, name: d.name })); localStorage.removeItem("dr-ref"); } catch (e2) {}
          submit.disabled = false;
          show(j.code, d.name);
          ev("referral_link", { returning: !!j.back });
        });
      })
      .catch(function () { fail("Sorry, that did not work. Please try again."); });
  });
  box.querySelector("[data-ref-copy]").addEventListener("click", function () { copy(linkOf(box.getAttribute("data-code")), this); ev("share", { method: "copy", content_type: "referral" }); });
  box.querySelector("[data-ref-wa]").addEventListener("click", function () { ev("share", { method: "whatsapp", content_type: "referral" }); });
  box.querySelector("[data-ref-more]").addEventListener("click", function () {
    var code = box.getAttribute("data-code"), btn = this;
    ev("share", { method: "more", content_type: "referral" });
    if (navigator.share) navigator.share({ text: msgOf(code) }).catch(function () {});
    else copy(msgOf(code), btn);
  });
  box.querySelector("[data-ref-reset]").addEventListener("click", function () {
    try { localStorage.removeItem("dr-my-ref"); } catch (e) {}
    form.reset(); out.hidden = true; form.hidden = false; form.querySelector("input").focus();
  });
})();

/* Refer a business: strip above the top bar (option 5) + card on the "thanks" screen of the
   assessment forms (option 2), 23 Nov 2026. Wording lives here so it changes in one place. */
(function () {
  var T = {
    strip: 'Refer a business, get <b>R1,000</b> to spend there',
    head: 'Know another owner? Get <b>R1,000</b> to spend at their place.',
    sub: 'Send them your link. If they join, the R1,000 goes on their loyalty card in your phone.',
    btn: 'Get my share link'
  };
  var here = location.pathname.replace(/\.html$/, "").split("/").pop();
  if (here === "refer") return;
  var hidden = false;
  // × hides it for this visit only (until the tab is closed); before 24 Nov it hid it for good, so clear that old note.
  try { localStorage.removeItem("dr-refstrip-off"); } catch (e) {}
  try { hidden = sessionStorage.getItem("dr-refstrip-off") === "1"; } catch (e) {}
  var header = document.querySelector("header");
  if (header && !hidden) {
    var bar = document.createElement("div");
    bar.className = "rs-strip";
    bar.innerHTML = '<a href="refer" class="rs-go"><span class="rs-ic" aria-hidden="true">🎁</span><span class="rs-t">' + T.strip + '</span><span class="rs-arrow" aria-hidden="true">→</span></a>' +
      '<button type="button" class="rs-x" aria-label="Hide this message">×</button>';
    header.parentNode.insertBefore(bar, header);
    bar.querySelector(".rs-go").addEventListener("click", function () { try { if (window.gtag) window.gtag("event", "referral_strip_click"); } catch (e) {} });
    bar.querySelector(".rs-x").addEventListener("click", function () { bar.remove(); try { sessionStorage.setItem("dr-refstrip-off", "1"); } catch (e) {} });
  }
  Array.prototype.forEach.call(document.querySelectorAll('form[data-lead-form]:not([data-lead-form="partner"])'), function (form) {
    var box = form.closest("[data-lead-box], .glass") || form.parentNode;
    var st = box.querySelector('[data-if="sent"] [role="status"]');
    if (!st || st.querySelector(".rs-thanks")) return;
    var c = document.createElement("div");
    c.className = "rs-thanks";
    c.innerHTML = "<b>" + T.head + "</b><span>" + T.sub + '</span><a class="rs-btn" href="refer#get-link">' + T.btn + "</a>";
    c.querySelector("a").addEventListener("click", function () { try { if (window.gtag) window.gtag("event", "referral_thanks_click"); } catch (e) {} });
    st.appendChild(c);
  });
})();
