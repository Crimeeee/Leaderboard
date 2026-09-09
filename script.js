let serverConfig = { name: "CITY OF CRIME", season: "SEASON 01", factions: [] };

const typeLabels = {
    criminal: "Criminal",
    government: "Government",
    civilian: "Civilian"
};

let activeFilter = "all";
let activeSort = "score";
let searchTerm = "";
let currentPage = 1;
const pageSize = 25;

function totalScore(faction) {
    return faction.operations + faction.territory + faction.events + faction.support;
}

function formatNumber(number) {
    return new Intl.NumberFormat("en-US").format(number);
}

function escapeHtml(value) {
    const element = document.createElement("span");
    element.textContent = value;
    return element.innerHTML;
}

function factionInitials(name) {
    return name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

function renderFactionCards() {
    const cards = document.getElementById("faction-cards");
    const topFactions = [...serverConfig.factions]
        .sort((first, second) => totalScore(second) - totalScore(first))
        .slice(0, 3);
    const fragment = document.createDocumentFragment();

    topFactions.forEach((faction, index) => {
        const card = document.createElement("article");
        const color = /^#[0-9a-fA-F]{6}$/.test(faction.color) ? faction.color : "#c8182a";

        card.className = "faction-card";
        card.style.setProperty("--faction-color", color);
        card.innerHTML = `
            <div class="card-topline"><span>POWER RANK / 0${index + 1}</span><span>${typeLabels[faction.type]}</span></div>
            <div class="card-identity">
                <span class="faction-insignia" aria-hidden="true">${escapeHtml(factionInitials(faction.name))}</span>
                <div><h3>${escapeHtml(faction.name)}</h3><p>${typeLabels[faction.type]} organization</p></div>
            </div>
            <div class="card-score"><span>Total influence</span><strong>${formatNumber(totalScore(faction))}<small>PTS</small></strong></div>
            <div class="mini-stats">
                <span><b>${formatNumber(faction.operations)}</b>Operations</span>
                <span><b>${formatNumber(faction.territory)}</b>Territory</span>
                <span><b>${formatNumber(faction.events)}</b>Events</span>
            </div>
            <button class="dossier-button" type="button" data-faction="${escapeHtml(faction.name)}">View faction dossier <i>↗</i></button>
        `;
        fragment.append(card);
    });

    cards.replaceChildren(fragment);
}

function getVisibleFactions() {
    return serverConfig.factions
        .filter((faction) => activeFilter === "all" || faction.type === activeFilter)
        .filter((faction) => faction.name.toLowerCase().includes(searchTerm))
        .sort((first, second) => {
            if (activeSort === "name") {
                return first.name.localeCompare(second.name);
            }
            if (activeSort === "activity") {
                return (second.operations + second.events) - (first.operations + first.events);
            }
            return totalScore(second) - totalScore(first);
        });
}

function createCell(content, className) {
    const cell = document.createElement("td");
    cell.textContent = content;
    if (className) {
        cell.className = className;
    }
    return cell;
}

function renderLeaderboard() {
    const factions = getVisibleFactions();
    const tbody = document.getElementById("leaderboard-body");
    const emptyState = document.getElementById("empty-state");
    const pagination = document.getElementById("pagination");
    const totalPages = Math.max(1, Math.ceil(factions.length / pageSize));
    currentPage = Math.min(currentPage, totalPages);
    const firstFactionIndex = (currentPage - 1) * pageSize;
    const displayedFactions = factions.slice(firstFactionIndex, firstFactionIndex + pageSize);

    tbody.replaceChildren();
    const rows = document.createDocumentFragment();

    displayedFactions.forEach((faction, index) => {
        const row = document.createElement("tr");
        const rank = document.createElement("td");
        const factionCell = document.createElement("td");
        const factionName = document.createElement("strong");
        const factionDetail = document.createElement("small");
        const badge = document.createElement("span");

        rank.className = "rank";
        rank.textContent = `#${firstFactionIndex + index + 1}`;
        factionName.textContent = faction.name;
        factionDetail.textContent = "Faction standings";
        factionCell.className = "faction-name";
        factionCell.append(factionName, factionDetail);
        badge.className = `type-badge ${faction.type}`;
        badge.textContent = typeLabels[faction.type];

        row.append(
            rank,
            factionCell,
            createCell("", "type-cell"),
            createCell(formatNumber(faction.operations)),
            createCell(formatNumber(faction.territory)),
            createCell(formatNumber(faction.events)),
            createCell(formatNumber(faction.support)),
            createCell(`${formatNumber(totalScore(faction))} pts`, "score")
        );
        row.querySelector(".type-cell").append(badge);
        rows.append(row);
    });

    tbody.append(rows);
    emptyState.hidden = factions.length !== 0;
    pagination.hidden = factions.length <= pageSize;
    document.getElementById("results-summary").textContent = factions.length === 0
        ? "No factions found"
        : `Showing ${firstFactionIndex + 1}-${Math.min(firstFactionIndex + pageSize, factions.length)} of ${factions.length} factions`;
    document.getElementById("page-status").textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById("previous-page").disabled = currentPage === 1;
    document.getElementById("next-page").disabled = currentPage === totalPages;
}

function renderStats() {
    const factions = [...serverConfig.factions].sort((first, second) => totalScore(second) - totalScore(first));
    const total = factions.reduce((score, faction) => score + totalScore(faction), 0);
    const activities = [
        ["Operations", factions.reduce((sum, faction) => sum + faction.operations, 0)],
        ["Territory", factions.reduce((sum, faction) => sum + faction.territory, 0)],
        ["Events", factions.reduce((sum, faction) => sum + faction.events, 0)],
        ["Support", factions.reduce((sum, faction) => sum + faction.support, 0)]
    ].sort((first, second) => second[1] - first[1]);

    document.getElementById("faction-count").textContent = factions.length;
    document.getElementById("combined-score").textContent = formatNumber(total);
    document.getElementById("leading-faction").textContent = factions[0] ? factions[0].name : "—";
    document.getElementById("leading-score").textContent = factions[0] ? `${formatNumber(totalScore(factions[0]))} pts` : "0 pts";
    document.getElementById("top-activity").textContent = activities[0][0];
    document.getElementById("top-activity-score").textContent = `${formatNumber(activities[0][1])} completions`;
}

function setServerDetails() {
    document.title = `${serverConfig.name} | Operations Board`;
    document.getElementById("server-name").textContent = serverConfig.name;
    document.getElementById("footer-server-name").textContent = serverConfig.name;
    document.getElementById("season-name").textContent = serverConfig.season;
    document.getElementById("last-updated").textContent = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date());
    document.getElementById("current-year").textContent = new Date().getFullYear();
}

async function loadLeaderboard() {
    const response = await fetch("/api/leaderboard");
    if (!response.ok) {
        throw new Error(`Leaderboard request failed with status ${response.status}`);
    }

    const data = await response.json();
    if (!data.server || !Array.isArray(data.factions)) {
        throw new Error("Leaderboard API returned an invalid response.");
    }

    serverConfig = { ...data.server, factions: data.factions };
}

document.querySelectorAll(".filter").forEach((button) => {
    button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;
        currentPage = 1;
        document.querySelectorAll(".filter").forEach((filter) => filter.classList.toggle("active", filter === button));
        renderLeaderboard();
    });
});

document.getElementById("faction-search").addEventListener("input", (event) => {
    searchTerm = event.target.value.trim().toLowerCase();
    currentPage = 1;
    renderLeaderboard();
});

document.getElementById("sort-by").addEventListener("change", (event) => {
    activeSort = event.target.value;
    currentPage = 1;
    renderLeaderboard();
});

document.getElementById("previous-page").addEventListener("click", () => {
    currentPage -= 1;
    renderLeaderboard();
});

document.getElementById("next-page").addEventListener("click", () => {
    currentPage += 1;
    renderLeaderboard();
});

document.getElementById("faction-cards").addEventListener("click", (event) => {
    const button = event.target.closest(".dossier-button");
    if (!button) {
        return;
    }

    const searchInput = document.getElementById("faction-search");
    activeFilter = "all";
    searchTerm = button.dataset.faction.toLowerCase();
    currentPage = 1;
    searchInput.value = button.dataset.faction;
    document.querySelectorAll(".filter").forEach((filter) => filter.classList.toggle("active", filter.dataset.filter === "all"));
    renderLeaderboard();
    document.querySelector(".board-panel").scrollIntoView({ behavior: "smooth", block: "start" });
});

loadLeaderboard()
    .then(() => {
        setServerDetails();
        renderStats();
        renderFactionCards();
        renderLeaderboard();
    })
    .catch((error) => {
        console.error(error);
        document.getElementById("empty-state").textContent = "Leaderboard data is currently unavailable.";
        document.getElementById("empty-state").hidden = false;
    });
