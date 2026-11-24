const CONFIG = {
  graduateName: "Quang Minh",
  ceremonyAt: "2026-11-26T08:00:00+07:00",
  fallbackGuest: "bạn",
};

function calendarDays(year, month) {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
}

console.assert(calendarDays(2026, 10).length === 36 && calendarDays(2026, 10)[6] === 1, "Calendar layout failed");

function vietnamToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());
  return Object.fromEntries(parts.filter(({ type }) => type !== "literal").map(({ type, value }) => [type, Number(value)]));
}

function renderEventCalendar() {
  const calendar = document.querySelector("#event-calendar");
  const [year, eventMonth, eventDay] = CONFIG.ceremonyAt.slice(0, 10).split("-").map(Number);
  const month = eventMonth - 1;
  const today = vietnamToday();
  const header = document.createElement("strong");
  header.className = "calendar-month";
  const monthLabel = document.createElement("span");
  monthLabel.textContent = `${eventDay} · Tháng ${month + 1} / ${year}`;
  header.append(monthLabel);
  if (today.year === year && today.month === month + 1) {
    const todayLabel = document.createElement("span");
    todayLabel.className = "calendar-today-note";
    todayLabel.textContent = `${today.day} · today`;
    header.append(todayLabel);
  }
  const grid = document.createElement("div");
  grid.className = "calendar-grid";
  ["T2", "T3", "T4", "T5", "T6", "T7", "CN"].forEach((label) => {
    const weekday = document.createElement("span");
    weekday.className = "calendar-weekday";
    weekday.textContent = label;
    grid.append(weekday);
  });
  calendarDays(year, month).forEach((day) => {
    const cell = document.createElement("span");
    cell.className = "calendar-day";
    if (day) {
      cell.textContent = day;
      cell.classList.toggle("today", today.year === year && today.month === month + 1 && today.day === day);
      cell.classList.toggle("event-day", day === eventDay);
      if (day === eventDay) {
        cell.setAttribute("aria-label", `${day} tháng ${month + 1}, ngày lễ tốt nghiệp`);
      }
    } else {
      cell.setAttribute("aria-hidden", "true");
    }
    grid.append(cell);
  });
  calendar.replaceChildren(header, grid);
}

renderEventCalendar();
setInterval(renderEventCalendar, 60000);

const params = new URLSearchParams(window.location.search);
const rawGuest = params.get("guest") || params.get("name") || params.get("to");
const guest = rawGuest?.trim().slice(0, 80) || CONFIG.fallbackGuest;

document.querySelectorAll("[data-guest]").forEach((node) => { node.textContent = guest; });
document.title = rawGuest ? `${guest}, Quang Minh mời bạn đến lễ tốt nghiệp!` : `Thiệp mời tốt nghiệp của ${CONFIG.graduateName}`;

const card = document.querySelector("#invitation-card");
function toggleCard() {
  const isOpen = card.classList.toggle("open");
  card.setAttribute("aria-expanded", String(isOpen));
}
card.addEventListener("click", toggleCard);
card.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleCard(); }
});

function updateCountdown() {
  const remaining = Math.max(0, new Date(CONFIG.ceremonyAt).getTime() - Date.now());
  const values = {
    days: Math.floor(remaining / 86400000),
    hours: Math.floor((remaining / 3600000) % 24),
    minutes: Math.floor((remaining / 60000) % 60),
    seconds: Math.floor((remaining / 1000) % 60),
  };
  Object.entries(values).forEach(([id, value]) => {
    document.querySelector(`#${id}`).textContent = String(value).padStart(2, "0");
  });
}
updateCountdown();
setInterval(updateCountdown, 1000);

let campusMap;
let campusMapPromise;
function showCampusMap(route) {
  const container = document.querySelector("#campus-map");
  if (!campusMapPromise) {
    campusMapPromise = import("./campus-map.js")
      .then(({ createCampusMap }) => {
        campusMap = createCampusMap(container);
        return campusMap;
      })
      .catch(() => {
        container.querySelector(".map-loading").textContent = "Không tải được bản đồ 3D.";
        return null;
      });
  }
  campusMapPromise.then((map) => {
    if (!map) return;
    map.setRoute(route);
  });
}

function selectRoute(route) {
  const rideMode = route === "ride";
  document.querySelectorAll(".route-tab").forEach((tab) => {
    const selected = tab.dataset.route === route;
    tab.classList.toggle("active", selected);
    tab.setAttribute("aria-selected", String(selected));
  });
  document.querySelector("#ride-destination").hidden = !rideMode;
  document.querySelector(".map-shell").hidden = rideMode;
  document.querySelector("#journey").classList.toggle("ride-mode", rideMode);
  if (!rideMode) requestAnimationFrame(() => showCampusMap(route));
}
document.querySelectorAll(".route-tab").forEach((tab) => tab.addEventListener("click", () => selectRoute(tab.dataset.route)));
document.querySelector("#copy-destination").addEventListener("click", async (event) => {
  const destination = "HCMUS VNUHCM - University of Science";
  event.currentTarget.textContent = "Đã sao chép";
  try {
    await navigator.clipboard.writeText(destination);
  } catch {
    const input = document.createElement("textarea");
    input.value = destination;
    document.body.append(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  }
});
selectRoute("ride");

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add("visible"); });
}, { threshold: .12 });
document.querySelectorAll(".reveal").forEach((node) => revealObserver.observe(node));

const studio = document.querySelector("#link-studio");
if (params.get("admin") === "1") studio.hidden = false;
const output = document.querySelector("#generated-links");
function generateLinks() {
  const names = document.querySelector("#guest-list").value.split(/\r?\n/).map((name) => name.trim()).filter(Boolean).slice(0, 100);
  output.replaceChildren(...names.map((name) => {
    const url = new URL(window.location.href); url.search = ""; url.searchParams.set("guest", name);
    const row = document.createElement("a"); row.href = url; row.textContent = `${name}: ${url}`; return row;
  }));
}
document.querySelector("#generate-links").addEventListener("click", generateLinks);
document.querySelector("#copy-links").addEventListener("click", async (event) => {
  if (!output.children.length) generateLinks();
  await navigator.clipboard.writeText([...output.children].map((link) => link.href).join("\n"));
  event.currentTarget.textContent = "Đã sao chép";
});
