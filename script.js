(function () {
  var root = document.documentElement;
  var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Theme toggle, remembered per browser.
  var toggle = document.getElementById("theme-toggle");
  toggle.addEventListener("click", function () {
    var dark = root.dataset.theme === "dark";
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
  });

  document.getElementById("year").textContent = String(new Date().getFullYear());

  // Reveal on scroll.
  var revealed = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealed.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealed.forEach(function (el) { io.observe(el); });
    // Safety net: nothing stays invisible if the observer never fires (background tab, odd browsers).
    setTimeout(function () { revealed.forEach(function (el) { el.classList.add("in"); }); }, 1500);
  }

  // Scroll-spy for the nav.
  var links = Array.prototype.slice.call(document.querySelectorAll(".nav a"));
  var sections = links.map(function (a) { return document.querySelector(a.getAttribute("href")); }).filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id); });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }

  // Project filters.
  var chips = document.querySelectorAll(".filters .chip");
  var projects = document.querySelectorAll(".project[data-tags]");
  var empty = document.querySelector(".filter-empty");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      chips.forEach(function (c) { c.classList.toggle("active", c === chip); });
      var f = chip.dataset.filter;
      var shown = 0;
      projects.forEach(function (p) {
        var match = f === "all" || (" " + p.dataset.tags + " ").indexOf(" " + f + " ") !== -1;
        p.hidden = !match;
        if (match) shown++;
      });
      empty.hidden = shown > 0;
    });
  });

  // Copy email.
  var copy = document.getElementById("copy-email");
  copy.addEventListener("click", function () {
    var original = copy.textContent;
    navigator.clipboard.writeText(copy.dataset.email).then(function () {
      copy.textContent = "Copied";
      setTimeout(function () { copy.textContent = original; }, 1600);
    }).catch(function () {});
  });

  // Live GitHub data: per-card language, stars and last push; profile-wide repo count, stars and last push.
  function relative(iso) {
    var days = Math.round((Date.now() - new Date(iso)) / 86400000);
    if (days <= 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 30) return days + " days ago";
    return new Date(iso).toLocaleDateString(undefined, { month: "short", year: "numeric" });
  }

  fetch("https://api.github.com/users/Sukirti08/repos?per_page=100")
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (repos) {
      if (!repos) return;
      var byName = {};
      var stars = 0, latest = null;
      repos.forEach(function (repo) {
        byName[repo.full_name.toLowerCase()] = repo;
        stars += repo.stargazers_count;
        if (!latest || repo.pushed_at > latest) latest = repo.pushed_at;
      });
      var facts = document.getElementById("github-facts");
      facts.querySelector('[data-stat="repos"]').textContent = String(repos.length);
      if (latest) facts.querySelector('[data-stat="pushed"]').textContent = relative(latest);

      document.querySelectorAll("[data-repo]").forEach(function (card) {
        var repo = byName[card.dataset.repo.toLowerCase()];
        var slot = card.querySelector(".repo-meta");
        if (!repo || !slot) return;
        var parts = [];
        if (repo.language) parts.push(repo.language);
        if (repo.stargazers_count > 0) parts.push("★ " + repo.stargazers_count);
        parts.push("updated " + relative(repo.pushed_at));
        slot.textContent = parts.join("  ·  ");
      });
    })
    .catch(function () {});
})();
