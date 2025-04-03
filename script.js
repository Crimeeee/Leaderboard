// TODO: MAKE JAVASCRIPT TAKE INFO FROM LUA SCRIPT
const leaderboardData = [
    { team: "SERBIAN_MAFIA", houseRobbery: 0, mission: 0, bankShopRobberies: 0, hitAndRun: 0, crates: 0, cargo: 0, vangelico: 0, drugs: 0, craft: 0, siege: 0 },
    { team: "THE_CRIMES", houseRobbery: 0, mission: 0, bankShopRobberies: 0, hitAndRun: 0, crates: 0, cargo: 0, vangelico: 0, drugs: 0, craft: 0, siege: 0 },
    { team: "HACKERBOY", houseRobbery: 0, mission: 0, bankShopRobberies: 0, hitAndRun: 0, crates: 0, cargo: 0, vangelico: 0, drugs: 0, craft: 0, siege: 0 },
    { team: "ITALIANS", houseRobbery: 0, mission: 0, bankShopRobberies: 0, hitAndRun: 0, crates: 0, cargo: 0, vangelico: 0, drugs: 0, craft: 0, siege: 0 },
    { team: "PP", houseRobbery: 0, mission: 0, bankShopRobberies: 0, hitAndRun: 0, crates: 0, cargo: 0, vangelico: 0, drugs: 0, craft: 0, siege: 0 },
    { team: "TWINS", houseRobbery: 0, mission: 0, bankShopRobberies: 0, hitAndRun: 0, crates: 0, cargo: 0, vangelico: 0, drugs: 0, craft: 0, siege: 0 },
    { team: "FAMILIES", houseRobbery: 0, mission: 0, bankShopRobberies: 0, hitAndRun: 0, crates: 0, cargo: 0, vangelico: 0, drugs: 0, craft: 0, siege: 0 },
    { team: "PEAKY_BLINDERS", houseRobbery: 0, mission: 0, bankShopRobberies: 0, hitAndRun: 0, crates: 0, cargo: 0, vangelico: 0, drugs: 0, craft: 0, siege: 0 },
    { team: "BROTHERHOOD", houseRobbery: 0, mission: 0, bankShopRobberies: 0, hitAndRun: 0, crates: 0, cargo: 0, vangelico: 0, drugs: 0, craft: 0, siege: 0 },
    { team: "GANG_666", houseRobbery: 0, mission: 0, bankShopRobberies: 0, hitAndRun: 0, crates: 0, cargo: 0, vangelico: 0, drugs: 0, craft: 0, siege: 0 },
    { team: "TEST", houseRobbery: 0, mission: 0, bankShopRobberies: 0, hitAndRun: 0, crates: 0, cargo: 0, vangelico: 0, drugs: 0, craft: 0, siege: 0 },
    { team: "TEST_GANG", houseRobbery: 0, mission: 0, bankShopRobberies: 0, hitAndRun: 0, crates: 0, cargo: 0, vangelico: 0, drugs: 0, craft: 0, siege: 0 },
    { team: "TEST2", houseRobbery: 0, mission: 0, bankShopRobberies: 0, hitAndRun: 0, crates: 0, cargo: 0, vangelico: 0, drugs: 0, craft: 0, siege: 0 },
    { team: "LEGENDS", houseRobbery: 0, mission: 0, bankShopRobberies: 0, hitAndRun: 0, crates: 0, cargo: 0, vangelico: 0, drugs: 0, craft: 0, siege: 0 },
    { team: "WESTSIDERAPERS", houseRobbery: 0, mission: 0, bankShopRobberies: 0, hitAndRun: 0, crates: 0, cargo: 0, vangelico: 0, drugs: 0, craft: 0, siege: 0 },
    { team: "TEST4", houseRobbery: 0, mission: 0, bankShopRobberies: 0, hitAndRun: 0, crates: 0, cargo: 0, vangelico: 0, drugs: 0, craft: 0, siege: 0 },
    { team: "TEST3", houseRobbery: 0, mission: 0, bankShopRobberies: 0, hitAndRun: 0, crates: 0, cargo: 0, vangelico: 0, drugs: 0, craft: 0, siege: 0 },
    { team: "TEST5", houseRobbery: 0, mission: 0, bankShopRobberies: 0, hitAndRun: 0, crates: 0, cargo: 0, vangelico: 0, drugs: 0, craft: 0, siege: 0 },
    { team: "BALKAN_MAFIA", houseRobbery: 0, mission: 0, bankShopRobberies: 0, hitAndRun: 0, crates: 0, cargo: 0, vangelico: 0, drugs: 0, craft: 0, siege: 0 },
    { team: "NO_FACE", houseRobbery: 0, mission: 0, bankShopRobberies: 0, hitAndRun: 0, crates: 0, cargo: 0, vangelico: 0, drugs: 0, craft: 0, siege: 0 },
];

// Function to calculate total points for each team
function calculateTotalPoints(entry) {
    return entry.houseRobbery + entry.mission + entry.bankShopRobberies + entry.hitAndRun + entry.crates + entry.cargo + entry.vangelico + entry.drugs + entry.craft + entry.siege;
}

// Function to populate the leaderboard
function populateLeaderboard() {

    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = ''; // Clear existing rows

    leaderboardData.forEach((entry, index) => {
        const row = document.createElement('tr');
        
        // Add class to first, second, and third place teams
        let rowClass = '';
        switch (index) {
            case 0: 
                rowClass = 'first-team';
                break;
            case 1: 
                rowClass = 'second-team';
                break;
            case 2:
                rowClass = 'third-team';
                break;
            default: 
                rowClass = 'normal-team';
        }
        row.className = rowClass;
        // Populate row with data
        row.innerHTML = `
            <td>${index + 1}.</td>
            <td>${entry.team}</td>
            <td>${entry.houseRobbery}</td>
            <td>${entry.mission}</td>
            <td>${entry.bankShopRobberies}</td>
            <td>${entry.hitAndRun}</td>
            <td>${entry.crates}</td>
            <td>${entry.cargo}</td>
            <td>${entry.vangelico}</td>
            <td>${entry.drugs}</td>
            <td>${entry.craft}</td>
            <td>${entry.siege}</td>
            <td>${calculateTotalPoints(entry)}</td>
        `;
        tbody.appendChild(row);
    });
}
// Call the function to populate the leaderboard
populateLeaderboard();