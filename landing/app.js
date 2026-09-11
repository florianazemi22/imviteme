/* Imvite landing page — progressive enhancement only.
   Everything here is optional: with JavaScript disabled the nav is visible,
   the FAQ opens natively (<details>), and the sign-up form submits as a
   plain POST to its action. Nothing below is loaded from a third party. */
(function () {
  "use strict";

  /* --- mobile nav ------------------------------------------------------ */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  if (toggle && nav) {
    toggle.hidden = false;
    nav.setAttribute("data-open", "false");

    toggle.addEventListener("click", function () {
      var open = nav.getAttribute("data-open") === "true";
      nav.setAttribute("data-open", open ? "false" : "true");
      toggle.setAttribute("aria-expanded", open ? "false" : "true");
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* --- sign-up forms --------------------------------------------------- */
  var forms = document.querySelectorAll("form[data-signup]");

  Array.prototype.forEach.call(forms, function (form) {
    var status = form.querySelector("[data-status]");
    var button = form.querySelector("button[type=submit]");

    form.addEventListener("submit", function (e) {
      if (!form.checkValidity()) { return; }        /* let the browser complain */
      if (typeof window.fetch !== "function") { return; } /* plain POST fallback */

      e.preventDefault();
      var label = button ? button.innerHTML : "";
      if (button) { button.disabled = true; }
      say("Sending…", "");

      fetch(form.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form)
      }).then(function (res) {
        if (!res.ok) { throw new Error(String(res.status)); }
        form.reset();
        say("Thank you. You are on the list, and you will hear from us before we open.", "ok");
        if (button) { button.disabled = false; button.innerHTML = label; }
      }).catch(function () {
        if (button) { button.disabled = false; button.innerHTML = label; }
        say("That did not go through. Please try again, or write to us.", "error");
      });
    });

    function say(text, state) {
      if (!status) { return; }
      status.textContent = text;
      if (state) { status.setAttribute("data-state", state); }
      else { status.removeAttribute("data-state"); }
    }
  });
})();
