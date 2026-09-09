window.DEMO_DATA = (() => {
    const rawFactions = [
        ["Serbian Mafia", "criminal", "#c8182a", 1280, 740, 420, 190], ["Los Santos Police", "government", "#3b75c9", 1160, 690, 510, 245],
        ["The Families", "criminal", "#5f9d4e", 1050, 630, 350, 165], ["Los Santos EMS", "government", "#df4d57", 900, 470, 390, 320],
        ["Italian Syndicate", "criminal", "#b68a42", 840, 530, 290, 110], ["Downtown Customs", "civilian", "#8c57b8", 710, 380, 260, 205],
        ["Peaky Blinders", "criminal", "#a6684a", 690, 450, 170, 95], ["San Andreas News", "civilian", "#329ba8", 510, 240, 330, 180],
        ["Ballas", "criminal", "#8655d6", 620, 395, 220, 82], ["Vagos", "criminal", "#d0a622", 585, 408, 180, 91],
        ["Lost MC", "criminal", "#a9a9a9", 560, 370, 190, 65], ["Marabunta Grande", "criminal", "#35a2c7", 535, 340, 155, 78],
        ["The Triads", "criminal", "#cd4338", 510, 320, 175, 80], ["Los Santos Sheriff", "government", "#af8753", 490, 285, 230, 165],
        ["Department of Justice", "government", "#e0bf72", 440, 260, 270, 215], ["San Andreas Dispatch", "government", "#77a7bd", 430, 210, 240, 195],
        ["Los Santos Fire Rescue", "government", "#e75a3e", 405, 185, 215, 205], ["City Hall", "government", "#4d97be", 360, 150, 295, 180],
        ["Weazel News", "civilian", "#c73c43", 350, 160, 280, 172], ["Premium Deluxe Motorsport", "civilian", "#e38a38", 330, 190, 155, 200],
        ["Benny's Original Motor Works", "civilian", "#d75b39", 315, 185, 145, 187], ["Los Santos Taxi", "civilian", "#deb839", 300, 115, 175, 180],
        ["The Vanilla Unicorn", "civilian", "#d25191", 285, 120, 195, 145], ["Bahama Mamas", "civilian", "#b54c93", 270, 110, 180, 150],
        ["Galaxy Nightclub", "civilian", "#624fb3", 260, 135, 170, 128], ["Redline Racing", "civilian", "#cf3c31", 245, 150, 160, 105],
        ["The Cartel", "criminal", "#bc4b37", 440, 285, 120, 68], ["Yakuza", "criminal", "#b64749", 415, 270, 110, 64],
        ["The Brotherhood", "criminal", "#7e6b58", 390, 240, 130, 72], ["Gruppe Sechs", "government", "#526f8a", 265, 95, 135, 190],
        ["Los Santos Tow", "civilian", "#d39336", 220, 100, 150, 155], ["Pacific Bluffs Security", "civilian", "#4f8491", 205, 80, 130, 172]
    ];
    const factions = rawFactions.map((row, index) => ({
        id: index + 1, name: row[0], type: row[1], color: row[2], operations: row[3], territory: row[4], events: row[5], support: row[6],
        logo: "", leader: ["Milan Petrovic", "Chief Maya Torres", "Dre Wallace", "Dr. Harper Quinn"][index] || "Faction Command",
        members: Math.max(8, 34 - index), wins: Math.max(1, 18 - Math.floor(index / 2)), founded: "Season 01"
    }));
    const territoryNames = ["Vespucci Canals", "Little Seoul", "Mirror Park", "La Mesa", "Rancho", "Strawberry", "Del Perro", "Pillbox Hill", "Cypress Flats", "Rockford Hills", "Davis", "Terminal"];
    const territories = territoryNames.map((name, index) => ({
        id: index + 1, name, factionId: [1, 3, 2, 9, 10, 1, 6, 2, 11, 5, 8, 4][index],
        value: 50 + index * 10, contested: index === 3 || index === 10, lastContest: index % 2 ? "2h ago" : "Yesterday"
    }));
    return {
        server: { name: "CITY OF CRIME", season: "SEASON 01", discord: { enabled: false, oauthReady: false } },
        factions,
        territories,
        players: [
            { name: "Milan Petrovic", factionId: 1, influence: 988, operations: 78, territories: 6, events: 8 },
            { name: "Maya Torres", factionId: 2, influence: 915, operations: 65, territories: 5, events: 11 },
            { name: "Dre Wallace", factionId: 3, influence: 867, operations: 70, territories: 5, events: 6 },
            { name: "Iris Vale", factionId: 4, influence: 742, operations: 54, territories: 3, events: 9 },
            { name: "Enzo Romano", factionId: 5, influence: 700, operations: 52, territories: 4, events: 5 },
            { name: "Jules Mercer", factionId: 6, influence: 641, operations: 44, territories: 3, events: 7 }
        ],
        events: [
            { id: 1, title: "Dockyard Arms Run", startsAt: "2026-09-12T20:00:00", status: "upcoming", location: "Terminal", format: "Faction operation", participants: "Open to criminal factions" },
            { id: 2, title: "City Council Security Detail", startsAt: "2026-09-14T18:30:00", status: "upcoming", location: "City Hall", format: "Public event", participants: "Government & civilian" },
            { id: 3, title: "Vespucci Street Race", startsAt: "2026-09-16T21:00:00", status: "upcoming", location: "Vespucci", format: "Race", participants: "All registered drivers" },
            { id: 4, title: "Rancho Takeover", startsAt: "2026-09-08T21:00:00", status: "complete", winnerId: 1, score: "3–1", location: "Rancho", format: "Territory war" },
            { id: 5, title: "Emergency Response Drill", startsAt: "2026-09-07T19:00:00", status: "complete", winnerId: 2, score: "1,240 pts", location: "Pillbox Hill", format: "Response event" },
            { id: 6, title: "Little Seoul Block Party", startsAt: "2026-09-05T20:00:00", status: "complete", winnerId: 3, score: "860 pts", location: "Little Seoul", format: "Community event" }
        ],
        announcements: [
            { date: "SEP 09", tag: "LIVE", title: "Territory scoring refresh is active", body: "District control now updates after verified contests. Staff retain final review before scores publish." },
            { date: "SEP 07", tag: "PATCH 1.2", title: "Event result ledger added", body: "Completed events now record winners, format, and final score on the Operations Board." },
            { date: "SEP 01", tag: "SEASON 01", title: "The city power index opens", body: "Every approved faction begins its campaign for city control and the Season 01 crown." }
        ],
        seasons: [
            { name: "Season 01", state: "LIVE", winner: "In progress", score: "—", note: "Current city campaign" },
            { name: "Preseason Trials", state: "ARCHIVED", winner: "Serbian Mafia", score: "2,410 pts", note: "Founders' Cup winner" },
            { name: "Founders' Week", state: "ARCHIVED", winner: "Los Santos Police", score: "1,980 pts", note: "Public safety champion" }
        ]
    };
})();
