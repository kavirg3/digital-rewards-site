/* Digital Rewards v2 – extra behaviour on top of site.js */
(function () {
  var $all = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var num = function (n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); };
  var rand = function (n) { return "R" + num(n); };

  /* ROI calculator: monthly customers x % retained x spend x extra visits */
  $all("[data-roi]").forEach(function (box) {
    var ins = $all("[data-roi-in]", box);
    var fee = Number(box.getAttribute("data-roi-fee")) || 4995;
    var run = function () {
      var v = {};
      ins.forEach(function (i) { v[i.getAttribute("data-roi-in")] = Number(i.value); });
      var kept = Math.round(v.cust * v.share / 100);
      var month = kept * v.spend * v.visits;
      var out = {
        cust: num(v.cust), spend: rand(v.spend), visits: String(v.visits), share: v.share + "%",
        kept: num(kept), month: rand(month), year: rand(month * 12), extra: num(kept * v.visits),
        visitWord: v.visits === 1 ? "additional visit" : "additional visits",
        times: month >= fee ? (month / fee).toFixed(1).replace(/\.0$/, "") + "x" : "under 1x"
      };
      $all("[data-roi-out]", box).forEach(function (el) { el.textContent = out[el.getAttribute("data-roi-out")]; });
      var max = Math.max(month, fee) || 1;
      $all("[data-roi-bar]", box).forEach(function (el) {
        var k = el.getAttribute("data-roi-bar");
        el.style.width = Math.max(2, Math.round((k === "fee" ? fee : month) / max * 100)) + "%";
      });
    };
    ins.forEach(function (i) { i.addEventListener("input", run); });
    run();
  });

  /* Lead form: the proxy keeps only known fields, so fold "what do you want" into the challenge note */
  $all("form[data-lead-form]").forEach(function (form) {
    var interest = form.querySelector('[name="interest"]');
    var note = form.querySelector('[name="challenge_note"]');
    var hidden = form.querySelector('input[name="challenge"]');
    if (!interest || !hidden) return;
    var sync = function () {
      var parts = [];
      if (interest.value) parts.push("Wants: " + interest.value);
      if (note && note.value.trim()) parts.push(note.value.trim());
      hidden.value = parts.join(". ");
    };
    form.addEventListener("input", sync);
    form.addEventListener("change", sync);
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
    var MAP = [[/restaurant|caf/i, "cup", "#FF7A90"], [/cannabis/i, "leaf", "#7FE0A8"], [/butch|special/i, "tag", "#FFB86B"], [/shopping/i, "bag", "#38BDF8"], [/salon|barber/i, "cut", "#9E8BFF"], [/spa|beauty/i, "spark", "#F9A8D4"], [/hotel|hospital/i, "bed", "#7FCFEF"], [/gym|fit/i, "gym", "#FFE81F"], [/retail store/i, "store", "#60A5FA"], [/managed/i, "team", "#9E8BFF"], [/software/i, "screen", "#38BDF8"], [/not sure/i, "compass", "#FFE81F"], [/.*/, "dots", "#A9BDDF"]];
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
