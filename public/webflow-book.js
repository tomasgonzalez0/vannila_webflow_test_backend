(function () {
  "use strict";

  var form = document.querySelector("[data-booking-form]");
  if (!form) return;
  var allowed = ["semipermanent", "soft-gel", "polygel", "rubber-base", "builder-gel", "dual-system", "nail-art"];
  var labels = { "semipermanent": "Semipermanente", "soft-gel": "Soft Gel", "polygel": "Polygel", "rubber-base": "Rubber Base", "builder-gel": "Builder Gel", "dual-system": "Dual System", "nail-art": "Nail Art" };
  var service = document.getElementById("booking-service");
  var date = document.getElementById("booking-date");
  var time = document.getElementById("booking-time");
  var slots = document.getElementById("booking-slots");
  var status = document.getElementById("booking-status");
  var submit = document.getElementById("booking-submit");
  var summary = document.getElementById("booking-errors");
  var success = document.getElementById("booking-success");
  var api = (form.getAttribute("data-api-base") || "").replace(/\/$/, "");
  var production = form.getAttribute("data-booking-mode") === "production" && /^https:\/\//.test(api);

  function bogotaToday() {
    var parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    var map = {};
    parts.forEach(function (part) { map[part.type] = part.value; });
    return map.year + "-" + map.month + "-" + map.day;
  }

  date.min = bogotaToday();
  var requested = new URLSearchParams(location.search).get("service");
  if (allowed.indexOf(requested) > -1) service.value = requested;

  function message(text, kind) {
    status.textContent = text;
    status.setAttribute("data-status", kind || "info");
  }
  function clearError(id) {
    var node = document.getElementById(id + "-error");
    var field = document.getElementById(id);
    if (node) node.textContent = "";
    if (field) field.removeAttribute("aria-invalid");
  }
  function fieldError(id, text) {
    var node = document.getElementById(id + "-error");
    var field = document.getElementById(id);
    if (node) node.textContent = text;
    if (field) {
      field.setAttribute("aria-invalid", "true");
      field.setAttribute("aria-describedby", id + "-error");
    }
  }
  function setBusy(busy) {
    submit.disabled = busy || !production || !time.value;
    submit.value = busy ? "Guardando…" : "Guardar cita";
  }
  function selectTime(value, button) {
    time.value = value;
    slots.querySelectorAll(".slot-button").forEach(function (item) {
      item.classList.remove("is-selected");
      item.setAttribute("aria-pressed", "false");
    });
    button.classList.add("is-selected");
    button.setAttribute("aria-pressed", "true");
    clearError("booking-time");
    setBusy(false);
  }
  function renderSlots(all, booked) {
    slots.innerHTML = "";
    if (!all.length) {
      slots.innerHTML = '<span class="slot-placeholder">No hay horarios configurados para esta fecha.</span>';
      message("No hay horarios disponibles para esta fecha. Prueba con otro día.", "empty");
      return;
    }
    all.forEach(function (value) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "slot-button";
      button.textContent = value + (booked.indexOf(value) > -1 ? " · Ocupado" : "");
      button.disabled = booked.indexOf(value) > -1;
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", function () { selectTime(value, button); });
      slots.appendChild(button);
    });
    message("Selecciona una hora disponible.", "ready");
  }
  async function loadAvailability() {
    time.value = "";
    setBusy(false);
    if (!production) {
      message("La agenda todavía está en configuración. Los horarios son solo una demostración.", "demo");
      return;
    }
    if (!date.value) {
      slots.innerHTML = '<span class="slot-placeholder">Selecciona una fecha para consultar disponibilidad.</span>';
      return;
    }
    if (date.value < bogotaToday()) {
      fieldError("booking-date", "Selecciona una fecha válida.");
      return;
    }
    clearError("booking-date");
    message("Consultando disponibilidad…", "loading");
    slots.innerHTML = '<span class="slot-placeholder">Consultando disponibilidad…</span>';
    try {
      var response = await fetch(api + "/api/appointments/availability?date=" + encodeURIComponent(date.value), { headers: { Accept: "application/json" } });
      var data = await response.json();
      if (!response.ok) throw new Error(data.error || "REQUEST_FAILED");
      renderSlots(Array.isArray(data.slots) ? data.slots : [], Array.isArray(data.bookedTimes) ? data.bookedTimes : []);
    } catch {
      slots.innerHTML = '<button class="slot-button" type="button" id="booking-retry">Reintentar</button>';
      message("No pudimos consultar la disponibilidad. Revisa tu conexión e intenta de nuevo.", "error");
      document.getElementById("booking-retry").addEventListener("click", loadAvailability);
    }
  }

  date.addEventListener("change", loadAvailability);
  ["booking-service", "booking-date", "booking-name", "booking-preferred-name", "booking-phone"].forEach(function (id) {
    var field = document.getElementById(id);
    if (field) field.addEventListener("input", function () { clearError(id); });
  });

  function validate() {
    var ok = true;
    summary.classList.add("is-hidden");
    if (!allowed.includes(service.value)) { fieldError("booking-service", "Selecciona un servicio."); ok = false; }
    if (!date.value || date.value < bogotaToday()) { fieldError("booking-date", "Selecciona una fecha válida."); ok = false; }
    if (!time.value) { fieldError("booking-time", "Selecciona una hora disponible."); ok = false; }
    if (!document.getElementById("booking-name").value.trim()) { fieldError("booking-name", "Escribe tu nombre completo."); ok = false; }
    if (!document.getElementById("booking-preferred-name").value.trim()) { fieldError("booking-preferred-name", "Cuéntanos cómo prefieres que te llamemos."); ok = false; }
    if (!/^\+?[\d\s()\-]{8,24}$/.test(document.getElementById("booking-phone").value.trim())) { fieldError("booking-phone", "Escribe un número de WhatsApp válido."); ok = false; }
    if (!ok) {
      summary.classList.remove("is-hidden");
      summary.focus();
    }
    return ok;
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (!production) {
      message("La agenda todavía está en configuración. No se guardó ninguna cita.", "demo");
      return;
    }
    if (!validate()) return;
    setBusy(true);
    message("Guardando tu cita…", "loading");
    var payload = {
      name: document.getElementById("booking-name").value.trim(),
      preferredName: document.getElementById("booking-preferred-name").value.trim(),
      phone: document.getElementById("booking-phone").value.trim(),
      instagram: document.getElementById("booking-instagram").value.trim() || undefined,
      service: service.value,
      date: date.value,
      time: time.value,
      designNotes: document.getElementById("booking-notes").value.trim() || undefined,
      turnstileToken: window.vannilaTurnstileToken || undefined,
    };
    try {
      var response = await fetch(api + "/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      var data = await response.json();
      if (response.status === 409) {
        time.value = "";
        message("Alguien acaba de reservar este horario. Selecciona otra hora disponible.", "error");
        await loadAvailability();
        return;
      }
      if (!response.ok) throw new Error(data.error || "REQUEST_FAILED");
      document.getElementById("success-service").textContent = labels[payload.service] || payload.service;
      document.getElementById("success-date").textContent = payload.date;
      document.getElementById("success-time").textContent = payload.time;
      var whatsapp = "Hola. Guardé una cita en el sitio de Vannila para " + (labels[payload.service] || payload.service) + " el " + payload.date + " a las " + payload.time + ".";
      document.getElementById("success-whatsapp").href = "https://api.whatsapp.com/send/?phone=573022859878&text=" + encodeURIComponent(whatsapp) + "&type=phone_number&app_absent=0";
      form.classList.add("is-hidden");
      success.classList.remove("is-hidden");
      success.focus();
    } catch {
      message("No pudimos guardar tu cita. Intenta de nuevo o contáctanos por WhatsApp.", "error");
    } finally {
      setBusy(false);
    }
  });

  message(production ? "Elige servicio, fecha y hora para continuar." : "La agenda todavía está en configuración. Los horarios son solo una demostración.", production ? "info" : "demo");
})();
