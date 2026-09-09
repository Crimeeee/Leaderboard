let dashboard = window.DEMO_DATA;
let activeFilter = "all";
let activeSort = "score";
let searchTerm = "";
let currentPage = 1;
const pageSize = 25;
const typeLabels = { criminal: "Criminal", government: "Government", civilian: "Civilian" };

function totalScore(faction) { return faction.operations + faction.territory + faction.events + faction.support; }
function formatNumber(number) { return new Intl.NumberFormat("en-US").format(number || 0); }
function escapeHtml(value) { const el = document.createElement("span"); el.textContent = value || ""; return el.innerHTML; }
function factionFor(id) { return dashboard.factions.find((faction) => faction.id === Number(id)); }
function initials(name) { return name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase(); }
function safeColor(color) { return /^#[0-9a-f]{6}$/i.test(color) ? color : "#c8182a"; }

function showView(viewName) {
    document.querySelectorAll(".view").forEach((view) => { view.hidden = view.id !== viewName; view.classList.toggle("active", view.id === viewName); });
    document.querySelectorAll("[data-view-link]").forEach((link) => link.classList.toggle("active", link.dataset.viewLink === viewName));
    if (viewName === "faction-detail") { return; }
    window.location.hash = viewName === "overview" ? "overview" : viewName;
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderFactionCards() {
    const cards = document.getElementById("faction-cards");
    cards.innerHTML = [...dashboard.factions].sort((a, b) => totalScore(b) - totalScore(a)).slice(0, 3).map((faction, index) => `
        <article class="faction-card" style="--faction-color:${safeColor(faction.color)}">
            <div class="card-topline"><span>POWER RANK / 0${index + 1}</span><span>${typeLabels[faction.type]}</span></div>
            <div class="card-identity"><span class="faction-insignia">${escapeHtml(initials(faction.name))}</span><div><h3>${escapeHtml(faction.name)}</h3><p>Led by ${escapeHtml(faction.leader || "Faction Command")}</p></div></div>
            <div class="card-score"><span>Total influence</span><strong>${formatNumber(totalScore(faction))}<small>PTS</small></strong></div>
            <div class="mini-stats"><span><b>${faction.members || 0}</b>Members</span><span><b>${faction.wins || 0}</b>Wins</span><span><b>${faction.territory}</b>Control</span></div>
            <button class="dossier-button" type="button" data-faction-id="${faction.id}">View faction dossier <i>↗</i></button>
        </article>`).join("");
}

function visibleFactions() {
    return dashboard.factions.filter((faction) => activeFilter === "all" || faction.type === activeFilter)
        .filter((faction) => faction.name.toLowerCase().includes(searchTerm))
        .sort((a, b) => activeSort === "name" ? a.name.localeCompare(b.name) : activeSort === "activity" ? (b.operations + b.events) - (a.operations + a.events) : totalScore(b) - totalScore(a));
}

function cell(content, className) { const value = document.createElement("td"); value.textContent = content; value.className = className || ""; return value; }
function renderLeaderboard() {
    const factions = visibleFactions();
    const totalPages = Math.max(1, Math.ceil(factions.length / pageSize));
    currentPage = Math.min(currentPage, totalPages);
    const start = (currentPage - 1) * pageSize;
    const shown = factions.slice(start, start + pageSize);
    const body = document.getElementById("leaderboard-body");
    body.replaceChildren(...shown.map((faction, index) => {
        const row = document.createElement("tr");
        const name = document.createElement("td");
        name.className = "faction-name";
        name.innerHTML = `<strong>${escapeHtml(faction.name)}</strong><small>Led by ${escapeHtml(faction.leader || "Faction Command")}</small>`;
        const type = document.createElement("td");
        type.innerHTML = `<span class="type-badge ${faction.type}">${typeLabels[faction.type]}</span>`;
        row.append(cell(`#${start + index + 1}`, "rank"), name, type, cell(formatNumber(faction.operations)), cell(formatNumber(faction.territory)), cell(formatNumber(faction.events)), cell(formatNumber(faction.support)), cell(`${formatNumber(totalScore(faction))} pts`, "score"));
        row.addEventListener("click", () => openFaction(faction.id));
        return row;
    }));
    document.getElementById("empty-state").hidden = factions.length !== 0;
    document.getElementById("pagination").hidden = factions.length <= pageSize;
    document.getElementById("results-summary").textContent = factions.length ? `Showing ${start + 1}-${Math.min(start + pageSize, factions.length)} of ${factions.length} factions` : "No factions found";
    document.getElementById("page-status").textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById("previous-page").disabled = currentPage === 1;
    document.getElementById("next-page").disabled = currentPage === totalPages;
}

function renderStats() {
    const factions = [...dashboard.factions].sort((a, b) => totalScore(b) - totalScore(a));
    const categories = [["Operations", "operations"], ["Territory", "territory"], ["Events", "events"], ["Support", "support"]].map(([name, key]) => [name, factions.reduce((sum, faction) => sum + faction[key], 0)]).sort((a, b) => b[1] - a[1]);
    document.getElementById("faction-count").textContent = factions.length;
    document.getElementById("combined-score").textContent = formatNumber(factions.reduce((sum, faction) => sum + totalScore(faction), 0));
    document.getElementById("leading-faction").textContent = factions[0] ? factions[0].name : "—";
    document.getElementById("leading-score").textContent = factions[0] ? `${formatNumber(totalScore(factions[0]))} pts` : "0 pts";
    document.getElementById("top-activity").textContent = categories[0][0];
    document.getElementById("top-activity-score").textContent = `${formatNumber(categories[0][1])} completions`;
}

function renderPlayers() {
    const category = document.getElementById("player-category").value;
    document.getElementById("player-rankings").innerHTML = [...dashboard.players].sort((a, b) => b[category] - a[category]).map((player, index) => {
        const faction = factionFor(player.factionId);
        return `<li><b>#${index + 1}</b><span><strong>${escapeHtml(player.name)}</strong><small>${escapeHtml(faction ? faction.name : "Unaffiliated")}</small></span><em>${formatNumber(player[category])}</em></li>`;
    }).join("");
}

function renderActivity() {
    const activities = [
        ...dashboard.events.filter((event) => event.status === "complete").map((event) => ({ title: `${factionFor(event.winnerId)?.name || "Unknown"} won ${event.title}`, detail: `${event.format} · ${event.score}` })),
        ...dashboard.announcements.slice(0, 2).map((announcement) => ({ title: announcement.title, detail: `${announcement.tag} · ${announcement.date}` }))
    ];
    document.getElementById("activity-feed").innerHTML = activities.map((activity) => `<article><i></i><div><strong>${escapeHtml(activity.title)}</strong><small>${escapeHtml(activity.detail)}</small></div></article>`).join("");
}

function openFaction(id) {
    const faction = factionFor(id);
    if (!faction) { return; }
    const territories = dashboard.territories.filter((territory) => territory.factionId === faction.id);
    const events = dashboard.events.filter((event) => event.winnerId === faction.id).slice(0, 3);
    const members = dashboard.players.filter((player) => player.factionId === faction.id);
    const history = ["Established its current command structure", "Secured verified city influence", "Entered the seasonal power index"].map((text, index) => `<li><b>${["SEP 09", "SEP 05", "SEP 01"][index]}</b>${text}</li>`).join("");
    document.getElementById("faction-detail-content").innerHTML = `
        <section class="dossier-hero" style="--faction-color:${safeColor(faction.color)}"><span class="faction-insignia">${escapeHtml(initials(faction.name))}</span><div><p class="eyebrow">${typeLabels[faction.type]} · ${escapeHtml(faction.founded || "Season 01")}</p><h1>${escapeHtml(faction.name)}</h1><p>Commanded by <strong>${escapeHtml(faction.leader || "Faction Command")}</strong> · ${faction.members || 0} active members</p></div><strong class="dossier-score">${formatNumber(totalScore(faction))}<small>INFLUENCE</small></strong></section>
        <section class="detail-grid"><article class="panel"><h2>Season <em>record</em></h2><div class="metric-grid"><span><b>${faction.operations}</b>Operations</span><span><b>${faction.territory}</b>Territory</span><span><b>${faction.events}</b>Events</span><span><b>${faction.support}</b>Support</span><span><b>${faction.wins || 0}</b>Wins</span><span><b>${territories.length}</b>Districts</span></div></article><article class="panel"><h2>Command <em>roster</em></h2><div class="member-list">${members.length ? members.map((member) => `<p><b>${escapeHtml(member.name)}</b><span>${member.influence} influence</span></p>`).join("") : "<p>No public members listed.</p>"}</div></article></section>
        <section class="detail-grid"><article class="panel"><h2>Controlled <em>territories</em></h2><div class="tag-list">${territories.length ? territories.map((territory) => `<span>${escapeHtml(territory.name)} · ${territory.value} pts</span>`).join("") : "<p>No current districts.</p>"}</div></article><article class="panel"><h2>Recent <em>wins</em></h2><div class="member-list">${events.length ? events.map((event) => `<p><b>${escapeHtml(event.title)}</b><span>${escapeHtml(event.score)}</span></p>`).join("") : "<p>No recorded wins yet.</p>"}</div></article></section>
        <section class="panel"><h2>Faction <em>history</em></h2><ol class="history-list">${history}</ol></section>`;
    showView("faction-detail");
}

function renderTerritories() {
    const map = document.getElementById("territory-map");
    map.innerHTML = dashboard.territories.map((territory) => { const faction = factionFor(territory.factionId); return `<button class="${territory.contested ? "contested" : ""}" style="--territory-color:${safeColor(faction?.color)}" data-territory-id="${territory.id}"><b>${territory.id}</b><span>${escapeHtml(territory.name)}</span></button>`; }).join("");
    inspectTerritory(dashboard.territories[0].id);
}
function inspectTerritory(id) {
    const territory = dashboard.territories.find((item) => item.id === Number(id));
    const faction = territory && factionFor(territory.factionId);
    if (!territory || !faction) { return; }
    document.getElementById("territory-inspector").innerHTML = `<p class="eyebrow">${territory.contested ? "/// CONTESTED DISTRICT" : "/// SECURED DISTRICT"}</p><h2>${escapeHtml(territory.name)}</h2><p>Controlled by <strong>${escapeHtml(faction.name)}</strong></p><div class="metric-grid"><span><b>${territory.value}</b>Control value</span><span><b>${territory.lastContest}</b>Last contest</span></div><button class="dossier-button" data-faction-id="${faction.id}" type="button">Open dossier <i>↗</i></button>`;
}
function renderEvents() {
    const list = (events, upcoming) => events.map((event) => `<article><time>${new Date(event.startsAt).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}</time><div><strong>${escapeHtml(event.title)}</strong><small>${escapeHtml(event.location)} · ${escapeHtml(event.format)}</small></div><span>${upcoming ? escapeHtml(event.participants) : `${escapeHtml(factionFor(event.winnerId)?.name || "Unknown")} · ${escapeHtml(event.score)}`}</span></article>`).join("");
    document.getElementById("upcoming-events").innerHTML = list(dashboard.events.filter((event) => event.status === "upcoming"), true);
    document.getElementById("event-results").innerHTML = list(dashboard.events.filter((event) => event.status === "complete"), false);
}
function renderAnnouncements() { document.getElementById("announcements-list").innerHTML = dashboard.announcements.map((item) => `<article><time>${item.date}</time><div><span>${escapeHtml(item.tag)}</span><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.body)}</p></div></article>`).join(""); }
function renderSeasons() { document.getElementById("season-archive").innerHTML = dashboard.seasons.map((season) => `<article class="panel"><p class="eyebrow">${season.state}</p><h2>${escapeHtml(season.name)}</h2><strong>${escapeHtml(season.winner)}</strong><p>${escapeHtml(season.score)} · ${escapeHtml(season.note)}</p></article>`).join(""); }

function adminIsApiReady() { return !!sessionStorage.getItem("operationsBoardAdminToken") && location.protocol !== "file:"; }
function adminFactionList() {
    document.getElementById("admin-mode").textContent = adminIsApiReady() ? "Protected API mode" : "Browser demo mode";
    document.getElementById("admin-factions").innerHTML = [...dashboard.factions].sort((a, b) => totalScore(b) - totalScore(a)).map((faction) => `<button type="button" data-edit-id="${faction.id}"><i style="background:${safeColor(faction.color)}"></i><span><strong>${escapeHtml(faction.name)}</strong><small>${formatNumber(totalScore(faction))} points · ${faction.isActive === false ? "inactive" : "active"}</small></span><b>EDIT</b></button>`).join("");
}
function resetAdminForm() {
    document.getElementById("admin-form").reset(); document.getElementById("admin-id").value = ""; document.getElementById("admin-color").value = "#c8182a"; document.getElementById("admin-active").checked = true;
    document.getElementById("admin-form-title").innerHTML = "Manage <em>faction</em>";
}
function editFaction(id) {
    const faction = factionFor(id); if (!faction) { return; }
    ["id", "name", "type", "color", "operations", "territory", "events", "support", "logo"].forEach((key) => { const input = document.getElementById(`admin-${key}`); if (input) { input.value = faction[key] || (key === "color" ? "#c8182a" : ""); } });
    document.getElementById("admin-active").checked = faction.isActive !== false;
    document.getElementById("admin-form-title").innerHTML = `Edit <em>${escapeHtml(faction.name)}</em>`;
    document.getElementById("admin-form").scrollIntoView({ behavior: "smooth", block: "start" });
}
async function saveFaction(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = { name: form.querySelector("#admin-name").value.trim(), type: form.querySelector("#admin-type").value, color: form.querySelector("#admin-color").value, logo: form.querySelector("#admin-logo").value.trim(), isActive: form.querySelector("#admin-active").checked };
    ["operations", "territory", "events", "support"].forEach((key) => { data[key] = Number(form.querySelector(`#admin-${key}`).value); });
    const id = Number(form.querySelector("#admin-id").value);
    const message = document.getElementById("admin-message");
    if (!data.name || !/^#[\da-f]{6}$/i.test(data.color) || Object.values(data).some((value) => typeof value === "number" && (!Number.isSafeInteger(value) || value < 0))) { message.textContent = "Enter a faction name, valid scores, and a team color."; return; }
    try {
        if (adminIsApiReady()) {
            const response = await fetch(id ? `/api/admin/factions/${id}` : "/api/admin/factions", { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionStorage.getItem("operationsBoardAdminToken")}` }, body: JSON.stringify(data) });
            if (!response.ok) { throw new Error((await response.json()).error || "Save failed."); }
            if (!id) { data.id = (await response.json()).id; dashboard.factions.push(data); } else { Object.assign(factionFor(id), data); }
            message.textContent = "Faction saved through the protected API.";
        } else {
            if (id) { Object.assign(factionFor(id), data); } else { data.id = Math.max(0, ...dashboard.factions.map((faction) => faction.id)) + 1; data.leader = "Faction Command"; data.members = 0; data.wins = 0; dashboard.factions.push(data); }
            localStorage.setItem("operationsBoardDemoFactions", JSON.stringify(dashboard.factions));
            message.textContent = "Saved locally for this demo browser.";
        }
        refreshAll(); resetAdminForm();
    } catch (error) { message.textContent = error.message; }
}
function refreshAll() { renderStats(); renderFactionCards(); renderLeaderboard(); renderPlayers(); renderActivity(); adminFactionList(); }
function setupEvents() {
    document.querySelectorAll("[data-view-link]").forEach((link) => link.addEventListener("click", (event) => { event.preventDefault(); showView(link.dataset.viewLink); }));
    document.querySelectorAll(".filter").forEach((button) => button.addEventListener("click", () => { activeFilter = button.dataset.filter; currentPage = 1; document.querySelectorAll(".filter").forEach((item) => item.classList.toggle("active", item === button)); renderLeaderboard(); }));
    document.getElementById("faction-search").addEventListener("input", (event) => { searchTerm = event.target.value.trim().toLowerCase(); currentPage = 1; renderLeaderboard(); });
    document.getElementById("sort-by").addEventListener("change", (event) => { activeSort = event.target.value; currentPage = 1; renderLeaderboard(); });
    document.getElementById("player-category").addEventListener("change", renderPlayers);
    document.getElementById("previous-page").addEventListener("click", () => { currentPage--; renderLeaderboard(); });
    document.getElementById("next-page").addEventListener("click", () => { currentPage++; renderLeaderboard(); });
    document.addEventListener("click", (event) => { const dossier = event.target.closest("[data-faction-id]"); const territory = event.target.closest("[data-territory-id]"); const edit = event.target.closest("[data-edit-id]"); const back = event.target.closest("[data-back-to]"); if (dossier) { openFaction(dossier.dataset.factionId); } if (territory) { inspectTerritory(territory.dataset.territoryId); } if (edit) { editFaction(edit.dataset.editId); } if (back) { showView(back.dataset.backTo); } });
    document.getElementById("admin-form").addEventListener("submit", saveFaction);
    document.getElementById("admin-reset").addEventListener("click", resetAdminForm);
}
function setServerDetails() {
    document.title = `${dashboard.server.name} | Operations Board`;
    ["server-name", "footer-server-name"].forEach((id) => { document.getElementById(id).textContent = dashboard.server.name; });
    document.getElementById("season-name").textContent = dashboard.server.season;
    const discord = dashboard.server.discord || {};
    document.getElementById("discord-status").textContent = discord.oauthReady ? "DISCORD · OAUTH READY" : discord.enabled ? "DISCORD · WEBHOOK READY" : "DISCORD · DEMO";
    document.getElementById("last-updated").textContent = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date());
    document.getElementById("current-year").textContent = new Date().getFullYear();
}
async function loadDashboard() {
    if (location.protocol === "file:") { return; }
    try { const response = await fetch("/api/dashboard"); if (!response.ok) { throw new Error("Dashboard unavailable"); } dashboard = await response.json(); } catch (error) { console.warn("Using offline presentation data.", error); }
    try { const saved = JSON.parse(localStorage.getItem("operationsBoardDemoFactions")); if (Array.isArray(saved) && !adminIsApiReady()) { dashboard.factions = saved; } } catch (_error) { localStorage.removeItem("operationsBoardDemoFactions"); }
}
loadDashboard().then(() => { setServerDetails(); renderStats(); renderFactionCards(); renderLeaderboard(); renderPlayers(); renderActivity(); renderTerritories(); renderEvents(); renderAnnouncements(); renderSeasons(); adminFactionList(); setupEvents(); if (location.hash) { const target = location.hash.slice(1); if (document.getElementById(target)) { showView(target); } } });
