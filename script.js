
const $ = id => document.getElementById(id);
const KEY = "disaArenaState";

const initialTournaments = [
    ["CS2", "DisaArena CS2 Cup", "5 на 5", 10, 16, 7],
    ["PUBG", "PUBG Squad Clash", "Squad", 25, 32, 18],
    ["Valorant", "Valorant Night Series", "5 на 5", 15, 16, 9],
    ["Dota 2", "Dota Arena Open", "5 на 5", 20, 16, 6],
    ["Apex Legends", "Apex Trio Cup", "Squad", 12, 20, 13],
    ["Mobile Legends", "MLBB Showdown", "5 на 5", 8, 16, 5]
].map((x, i) => ({
    id: "t" + i,
    game: x[0],
    name: x[1],
    format: x[2],
    prize: x[3],
    teams: x[4],
    registered: x[5],
    status: "Регистрация открыта"
}));

let state;

try {
    state = JSON.parse(localStorage.getItem(KEY)) || {
        tournaments: initialTournaments,
        registrations: [],
        rewards: [],
        nickname: "D1AS"
    };
} catch {
    state = {
        tournaments: initialTournaments,
        registrations: [],
        rewards: [],
        nickname: "D1AS"
    };
}

let wallet = null;
let currentFilter = "Все";

function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"]/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;"
    })[char]);
}

function showMessage(message) {
    $("toast").textContent = message;
    $("toast").style.display = "block";

    setTimeout(() => {
        $("toast").style.display = "none";
    }, 3000);
}

// Игровые дисциплины
const games = [
    "CS2", "PUBG", "Valorant", "Dota 2",
    "Apex Legends", "Mobile Legends", "Fortnite", "Rainbow Six"
];

$("gameGrid").innerHTML = games.map(game => `
    <div class="game" onclick="setFilter('${game}')">
        <b>${game}</b>
        <small>Открыть турниры ↗</small>
    </div>
`).join("");

// Фильтр игр
function setFilter(game) {
    currentFilter = game;

    document.querySelectorAll(".filters button").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.filter === game
        );
    });

    renderTournaments();
    $("tournaments").scrollIntoView({ behavior: "smooth" });
}

// Турниры
function renderTournaments() {
    const tournaments = state.tournaments.filter(tournament =>
        currentFilter === "Все" || tournament.game === currentFilter
    );

    $("tournamentList").innerHTML = tournaments.map(tournament => `
        <article class="card">
            <div class="cardtop">
                <span class="tag">${escapeHTML(tournament.game)}</span>
                <span class="pill">${escapeHTML(tournament.status)}</span>
            </div>

            <h3>${escapeHTML(tournament.name)}</h3>
            <p>${escapeHTML(tournament.format)} · Турнир сообщества</p>

            <div class="meta">
                <div>ПРИЗ<b>${tournament.prize} SOL</b></div>
                <div>ФОРМАТ<b>${escapeHTML(tournament.format)}</b></div>
                <div>УЧАСТНИКИ<b>${tournament.registered}/${tournament.teams}</b></div>
            </div>

            <div class="cardactions">
                <button onclick="openRegistration('${tournament.id}')">
                    Участвовать ↗
                </button>
                <button class="second-btn" onclick="showMessage('${escapeHTML(tournament.game)} · ${tournament.prize} SOL')">
                    Подробнее
                </button>
            </div>
        </article>
    `).join("") || "<p>Нет турниров в этой категории.</p>";
}

document.querySelectorAll(".filters button").forEach(button => {
    button.onclick = () => setFilter(button.dataset.filter);
});

// Турнирная сетка
function renderBracket() {
    const teams = [
        ["NOVA", "FROST", "ECHO", "VIPER", "AKUMA", "RAVEN", "WOLVES", "PHANTOM"],
        ["DROP", "SKY", "SQUAD X", "NOMADS", "ALPHA", "TITANS", "ZONE4", "LEGENDS"],
        ["VALOR", "NIGHT", "ACE", "RUSH", "PIXEL", "ZERO", "K1NG", "SENTINEL"]
    ][$("bracketSelect").selectedIndex];

    $("bracketView").innerHTML = [4, 2, 1].map((count, round) => `
        <div class="round">
            <small>${["ЧЕТВЕРТЬФИНАЛ", "ПОЛУФИНАЛ", "ФИНАЛ"][round]}</small>
            ${Array.from({ length: count }, (_, i) => {
                const a = teams[i * 2 ** (round + 1)];
                const b = teams[i * 2 ** (round + 1) + 1];

                return `
                    <div class="match">
                        <div class="team ${round === 0 && i === 0 ? "winner" : ""}">
                            ${a}<span>${round === 0 && i === 0 ? "2" : "—"}</span>
                        </div>
                        <div class="team">
                            ${b}<span>${round === 0 && i === 0 ? "1" : "—"}</span>
                        </div>
                    </div>
                `;
            }).join("")}
        </div>
    `).join("");
}

$("bracketSelect").onchange = renderBracket;

// Профиль и история
function renderProfile() {
    $("profileName").textContent = state.nickname || "Игрок";
    $("nickname").value = state.nickname || "";

    $("myTournaments").innerHTML = state.registrations.map(registration => `
        <p>• ${escapeHTML(registration.name)} — ${escapeHTML(registration.team)}</p>
    `).join("") || "";

    $("rewardHistory").innerHTML = state.rewards.map(reward => `
        <p>◎ ${escapeHTML(reward.winner)} — <b>${reward.amount} SOL</b> (демо)</p>
    `).join("") || "Пока нет наград.";
}

$("saveNickname").onclick = () => {
    state.nickname = $("nickname").value.trim() || "Игрок";
    save();
    renderProfile();
    showMessage("Профиль сохранён.");
};

// Регистрация
function openRegistration(id) {
    const tournament = state.tournaments.find(t => t.id === id);

    $("tournamentId").value = id;
    $("modalTitle").textContent = "Регистрация · " + tournament.name;
    $("teamFormat").value = tournament.format;

    $("prizeWallet").value = wallet ? wallet.toBase58() : "";
    $("registerModal").classList.remove("hidden");
}

$("closeModal").onclick = () => {
    $("registerModal").classList.add("hidden");
};

$("registerModal").onclick = event => {
    if (event.target === $("registerModal")) {
        $("registerModal").classList.add("hidden");
    }
};

$("registerForm").onsubmit = event => {
    event.preventDefault();

    const id = $("tournamentId").value;
    const tournament = state.tournaments.find(t => t.id === id);
    const team = $("teamName").value.trim();

    if (!tournament || !team) return;

    if (tournament.registered >= tournament.teams) {
        return showMessage("Свободных мест нет.");
    }

    if (state.registrations.some(r =>
        r.id === id && r.team.toLowerCase() === team.toLowerCase()
    )) {
        return showMessage("Эта команда уже зарегистрирована.");
    }

    tournament.registered++;

    state.registrations.push({
        id,
        name: tournament.name,
        team
    });

    save();
    render();
    $("registerModal").classList.add("hidden");
    $("teamName").value = "";

    showMessage("Регистрация подтверждена (демо).");
};

// Создание турнира
$("createTournament").onclick = () => {
    const name = prompt("Название турнира");
    if (!name || !name.trim()) return;

    const game = prompt(
        "Игра: CS2, PUBG, Valorant, Dota 2, Apex Legends",
        "CS2"
    );
    if (!game) return;

    const prize = Number(prompt("Призовой фонд в SOL", "5"));

    if (!Number.isFinite(prize) || prize <= 0) {
        return showMessage("Укажи корректную сумму.");
    }

    state.tournaments.push({
        id: "new" + Date.now(),
        game,
        name: name.trim(),
        format: game === "PUBG" ? "Squad" : "5 на 5",
        prize,
        teams: 16,
        registered: 0,
        status: "Регистрация открыта"
    });

    save();
    render();
    showMessage("Турнир создан.");
};

// Демо-награды
$("awardPrize").onclick = () => {
    const tournament = state.tournaments.find(
        t => t.id === $("adminTournament").value
    );

    const winner = $("winnerName").value.trim();
    const amount = Number($("rewardAmount").value);

    if (!tournament || !winner || !Number.isFinite(amount) || amount <= 0) {
        return showMessage("Заполни победителя и сумму.");
    }

    state.rewards.unshift({
        winner,
        amount,
        tournament: tournament.name
    });

    save();
    renderProfile();
    $("winnerName").value = "";

    showMessage("Демо-награда записана. Реальная транзакция не отправлялась.");
};

// Solana / Phantom
async function connectWallet() {
    try {
        const provider = window.phantom?.solana || window.solana;

        if (!provider?.isPhantom) {
            showMessage("Phantom не найден. Открой сайт кошелька.");
            window.open("https://phantom.app/", "_blank");
            return;
        }

        const response = await provider.connect();
        wallet = response.publicKey;

        $("walletBtn").textContent = "Кошелёк подключён";
        $("connectWallet").textContent = "Кошелёк подключён";
        $("walletAddress").textContent = wallet.toBase58();
        $("profileAddress").textContent = wallet.toBase58();

        await updateBalance();
        showMessage("Phantom подключён.");
    } catch {
        showMessage("Подключение отменено.");
    }
}

async function updateBalance() {
    if (!wallet || !window.solanaWeb3) {
        return showMessage("Сначала подключи Phantom.");
    }

    try {
        const connection = new solanaWeb3.Connection(
            "https://api.devnet.solana.com",
            "confirmed"
        );

        const lamports = await connection.getBalance(wallet);

        $("walletBalance").innerHTML =
            (lamports / solanaWeb3.LAMPORTS_PER_SOL).toFixed(4) +
            " <small>SOL</small>";
    } catch {
        showMessage("Не удалось получить баланс Devnet.");
    }
}

$("walletBtn").onclick = connectWallet;
$("connectWallet").onclick = connectWallet;
$("refreshBalance").onclick = updateBalance;

// Обновление интерфейса
function render() {
    renderTournaments();
    renderBracket();
    renderProfile();

    $("adminTournament").innerHTML = state.tournaments.map(t => `
        <option value="${t.id}">${escapeHTML(t.name)}</option>
    `).join("");
}

render();