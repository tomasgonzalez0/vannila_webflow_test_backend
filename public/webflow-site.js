(function () {
  "use strict";

  document.documentElement.setAttribute("lang", "es");

  var style = document.createElement("style");
  style.textContent = [
    ":focus-visible{outline:3px solid #A87F79;outline-offset:3px}",
    ".eyebrow{color:#6B403C!important}",
    ".section-dark .eyebrow{color:#E9E1D9!important}",
    ".section-rose .body-copy{color:#231F20!important}",
    ".whatsapp-float{bottom:56px!important}",
    ".nav-toggle.is-open .nav-toggle-line:nth-child(1){transform:translateY(7px) rotate(45deg)}",
    ".nav-toggle.is-open .nav-toggle-line:nth-child(2){opacity:0}",
    ".nav-toggle.is-open .nav-toggle-line:nth-child(3){transform:translateY(-7px) rotate(-45deg)}",
    ".faq-item[open] .faq-icon{transform:rotate(45deg)}",
    ".slot-button{min-height:48px;padding:12px;border:1px solid #171514;background:#fff;color:#171514;font:700 15px Arial,sans-serif;cursor:pointer}",
    ".slot-button:hover,.slot-button:focus-visible{background:#E9E1D9}",
    ".slot-button.is-selected{background:#171514;color:#fff}",
    ".slot-button:disabled{cursor:not-allowed;opacity:.55;text-decoration:line-through}",
    "@keyframes vannila-reveal{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}",
    "@media (prefers-reduced-motion:no-preference){.site-header{animation:vannila-reveal .42s ease-out both}main>section:first-child{animation:vannila-reveal .5s .06s ease-out both}.button-primary,.button-secondary,.service-card,.faq-icon,.nav-toggle-line{transition:transform .2s ease,opacity .2s ease,background-color .2s ease,color .2s ease}.button-primary:hover,.button-secondary:hover{transform:translateY(-2px)}.service-card:hover{transform:translateY(-4px)}[data-reveal]{opacity:0;transform:translateY(14px)}[data-reveal].is-visible{opacity:1;transform:none;transition:opacity .45s ease,transform .45s ease}}",
    "@media (prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto;animation-duration:.01ms;animation-iteration-count:1;transition-duration:.01ms}}",
  ].join("");
  document.head.appendChild(style);

  function setMenu(root, open) {
    var toggle = root.querySelector(".nav-toggle");
    var menu = root.querySelector(".nav-menu");
    if (!toggle || !menu) return;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    toggle.classList.toggle("is-open", open);
    menu.classList.toggle("is-open", open);
  }

  document.querySelectorAll("[data-nav-root]").forEach(function (root) {
    var toggle = root.querySelector(".nav-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", function (event) {
      event.preventDefault();
      setMenu(root, toggle.getAttribute("aria-expanded") !== "true");
    });
    toggle.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle.click();
      }
    });
    root.querySelectorAll(".nav-menu a").forEach(function (link) {
      link.addEventListener("click", function () { setMenu(root, false); });
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      document.querySelectorAll("[data-nav-root]").forEach(function (root) { setMenu(root, false); });
    }
  });
  document.addEventListener("click", function (event) {
    document.querySelectorAll("[data-nav-root]").forEach(function (root) {
      if (!root.contains(event.target)) setMenu(root, false);
    });
  });

  document.querySelectorAll("details.faq-item").forEach(function (item) {
    var summary = item.querySelector("summary");
    var icon = item.querySelector(".faq-icon");
    function sync() {
      if (summary) summary.setAttribute("aria-expanded", String(item.open));
      if (icon) icon.textContent = item.open ? "−" : "+";
    }
    item.addEventListener("toggle", sync);
    sync();
  });

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
    var targets = document.querySelectorAll(".service-card,.faq-item");
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    targets.forEach(function (target) {
      target.setAttribute("data-reveal", "");
      observer.observe(target);
    });
  }
})();
