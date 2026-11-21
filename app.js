const CONFIG = {
  graduateName: "Minh",
  ceremonyAt: "2026-11-26T08:00:00+07:00",
  fallbackGuest: "my dear friend",
};

const params = new URLSearchParams(window.location.search);
const rawGuest = params.get("guest") || params.get("name") || params.get("to");
const guest = rawGuest?.trim().slice(0, 80) || CONFIG.fallbackGuest;

document.querySelectorAll("[data-guest]").forEach((node) => { node.textContent = guest; });
document.title = rawGuest ? `${guest}, you're invited!` : `${CONFIG.graduateName}'s Graduation Invitation`;

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

const routeCopy = {
  lhp: { distance: "Recommended parking", description: "Park at Lê Hồng Phong, then follow Nguyễn Văn Cừ to the University of Science main entrance." },
  hcmus: { distance: "Closest alternative", description: "Enter the university parking area, then walk across campus toward the Main Hall." },
};
function selectRoute(route) {
  document.querySelectorAll(".route-tab").forEach((tab) => {
    const selected = tab.dataset.route === route;
    tab.classList.toggle("active", selected);
    tab.setAttribute("aria-selected", String(selected));
  });
  document.querySelectorAll(".route-path").forEach((path) => path.classList.toggle("active", path.id === `route-path-${route}`));
  const campusMap = document.querySelector("#campus-map");
  campusMap.dataset.activeRoute = route;
  document.querySelector("#map-route-label").textContent = route === "lhp"
    ? "Bãi xe ngầm LHP → đi về phía nam → Cổng chính HCMUS → Hội trường I"
    : "Cổng bãi xe HCMUS (đầu phía nam) → lối nội bộ → Hội trường I";
  document.querySelector("#route-distance").textContent = routeCopy[route].distance;
  document.querySelector("#route-description").textContent = routeCopy[route].description;
}
document.querySelectorAll(".route-tab").forEach((tab) => tab.addEventListener("click", () => selectRoute(tab.dataset.route)));
selectRoute("lhp");

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add("visible"); });
}, { threshold: .12 });
document.querySelectorAll(".reveal").forEach((node) => revealObserver.observe(node));

const shareButton = document.querySelector("#share-button");
shareButton.addEventListener("click", async () => {
  const data = { title: document.title, text: `${guest}, join me for my graduation!`, url: window.location.href };
  try {
    if (navigator.share) await navigator.share(data);
    else { await navigator.clipboard.writeText(window.location.href); shareButton.textContent = "Link copied"; }
  } catch (error) { if (error.name !== "AbortError") shareButton.textContent = "Copy the URL above"; }
});

const musicButton = document.querySelector("#music-toggle");
let audioContext;
let ambience;
musicButton.addEventListener("click", () => {
  if (ambience) {
    ambience.forEach((oscillator) => oscillator.stop());
    ambience = null;
    musicButton.textContent = "Ambient sound: off";
    musicButton.setAttribute("aria-pressed", "false");
    return;
  }
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  const gain = audioContext.createGain();
  gain.gain.value = .018;
  gain.connect(audioContext.destination);
  ambience = [196, 246.94, 293.66].map((frequency) => {
    const oscillator = audioContext.createOscillator();
    oscillator.type = "sine"; oscillator.frequency.value = frequency; oscillator.connect(gain); oscillator.start(); return oscillator;
  });
  musicButton.textContent = "Ambient sound: on";
  musicButton.setAttribute("aria-pressed", "true");
});

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
  event.currentTarget.textContent = "Copied";
});
