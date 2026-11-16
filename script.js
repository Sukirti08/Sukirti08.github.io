(function () {
  // Theme toggle, remembered per browser.
  var root = document.documentElement;
  var toggle = document.getElementById("theme-toggle");
  toggle.addEventListener("click", function () {
    var dark = root.dataset.theme === "dark";
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
  });

  document.getElementById("year").textContent = String(new Date().getFullYear());

  // Live stars and primary language from the GitHub API. Fails quietly when offline or rate-limited.
  var cards = document.querySelectorAll("[data-repo]");
  cards.forEach(function (card) {
    var slot = card.querySelector(".repo-meta");
    if (!slot) return;
    fetch("https://api.github.com/repos/" + card.dataset.repo)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (repo) {
        if (!repo) return;
        var parts = [];
        if (repo.language) parts.push(repo.language);
        parts.push("★ " + repo.stargazers_count);
        if (repo.pushed_at) {
          var days = Math.round((Date.now() - new Date(repo.pushed_at)) / 86400000);
          parts.push(days <= 1 ? "updated today" : days < 30 ? "updated " + days + "d ago" : "updated " + new Date(repo.pushed_at).toLocaleDateString(undefined, { month: "short", year: "numeric" }));
        }
        slot.textContent = parts.join("  ·  ");
      })
      .catch(function () {});
  });
})();
