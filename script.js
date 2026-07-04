// Master Pool of 32 Rule Cards based on "You Can't Say Umm" mechanics
const ALL_RULES = [
    "Must clap hands before speaking",
    "Cannot use words starting with 'S'",
    "Must speak in a high pitched voice",
    "Cannot look directly at other players",
    "Must end every sentence with 'mate'",
    "Must keep both elbows on the table",
    "Cannot use the word 'The'",
    "Must scratch your head when thinking",
    "Must answer questions with a whisper",
    "Cannot point fingers at anyone",
    "Must puff out cheeks while silent",
    "Cannot say the word 'And'",
    "Must nod constantly while talking",
    "Must keep one eye closed",
    "Cannot use contractions (don't, can't)",
    "Must speak like a pirate",
    "Must clear throat before every answer",
    "Cannot cross your legs",
    "Must say 'Beep' after mentioning a name",
    "Cannot say the word 'Uh' or 'Umm'",
    "Must touch your nose when answering",
    "Cannot use words with more than 3 syllables",
    "Must speak entirely in monotone",
    "Must say 'Wow' before every clue",
    "Cannot use your thumbs",
    "Must keep your tongue slightly out",
    "Cannot use the word 'Like'",
    "Must wave hello when a turn starts",
    "Cannot say 'Yes' or 'No'",
    "Must shrug your shoulders every 5 seconds",
    "Must talk without showing your teeth",
    "Cannot say the word 'You'"
];

let currentTeamPool = [];
let teamARules = [];
let teamBRules = [];
let currentSelectingTeam = '';
let selectedIndices = [];

// Game state variables
let timerInterval = null;
let timeLeft = 60;
let isTimerRunning = false;
let timerTouchStart = 0;

// Universal Screen Navigator
function navigateTo(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    if (screenId === 'screen-team-select') {
        checkGameReadyStatus();
    }
}

// Fisher-Yates Shuffle Algorithm for mixing cards cleanly
function shuffle(array) {
    let m = array.length, t, i;
    while (m) {
        i = Math.floor(Math.random() * m--);
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }
    return array;
}

// Setup Rule Picker View
function openRuleSelection(team) {
    currentSelectingTeam = team;
    selectedIndices = [];
    document.getElementById('rule-screen-title').innerText = `Team ${team} Rule Pick`;
    
    // Get unique pool of 6 items out of the master list
    let shuffledPool = shuffle([...ALL_RULES]);
    
    // Safety check: ensure Team B doesn't overlap items already locked by Team A
    if (team === 'B' && teamARules.length > 0) {
        shuffledPool = shuffledPool.filter(rule => !teamARules.includes(rule));
    }
    
    currentTeamPool = shuffledPool.slice(0, 6);
    
    const grid = document.getElementById('rules-grid');
    grid.innerHTML = '';
    
    currentTeamPool.forEach((rule, index) => {
        const card = document.createElement('div');
        card.className = 'rule-card';
        card.innerText = rule;
        card.dataset.index = index;
        card.addEventListener('click', () => toggleRuleSelection(card, index));
        grid.appendChild(card);
    });
    
    updateReadyButtonState();
    navigateTo('screen-rule-select');
}

// Handlers for selection restrictions (exactly 3 rule items)
function toggleRuleSelection(cardElement, index) {
    const pos = selectedIndices.indexOf(index);
    if (pos > -1) {
        selectedIndices.splice(pos, 1);
        cardElement.classList.remove('selected');
    } else {
        if (selectedIndices.length < 3) {
            selectedIndices.push(index);
            cardElement.classList.add('selected');
        }
    }
    updateReadyButtonState();
}

function updateReadyButtonState() {
    const readyBtn = document.getElementById('btn-rules-ready');
    readyBtn.disabled = (selectedIndices.length !== 3);
}

function confirmRules() {
    const chosenRules = selectedIndices.map(idx => currentTeamPool[idx]);
    
    if (currentSelectingTeam === 'A') {
        teamARules = chosenRules;
        document.getElementById('btn-team-a').style.opacity = '0.5';
        document.getElementById('btn-team-a').innerText = 'Team A (Selected)';
    } else {
        teamBRules = chosenRules;
        document.getElementById('btn-team-b').style.opacity = '0.5';
        document.getElementById('btn-team-b').innerText = 'Team B (Selected)';
    }
    
    navigateTo('screen-team-select');
}

function checkGameReadyStatus() {
    if (teamARules.length === 3 && teamBRules.length === 3) {
        document.getElementById('btn-start-match').classList.remove('hidden');
    }
}

// Build Game Board 
function startGameBoard() {
    const trackA = document.getElementById('track-A');
    const trackB = document.getElementById('track-B');
    
    // Clear out old spaces if restarting, but keep headers
    document.querySelectorAll('.board-square').forEach(el => el.remove());

    // Generate squares 1 up to Win (20)
    for (let i = 1; i <= 20; i++) {
        const label = (i === 20) ? "WIN" : i;
        const extraClass = (i === 20) ? " win-space" : "";
        
        const sqA = document.createElement('div');
        sqA.className = `board-square${extraClass}`;
        sqA.innerText = label;
        trackA.appendChild(sqA);

        const sqB = document.createElement('div');
        sqB.className = `board-square${extraClass}`;
        sqB.innerText = label;
        trackB.appendChild(sqB);
    }

    // Set Up Face Down Horizontal Slots
    // CRITICAL REQUIREMENT Swap placement: Team A's cards go on Team B's side (Right) and vice-versa
    const leftSlots = document.querySelectorAll('.left-penalties .penalty-slot');
    const rightSlots = document.querySelectorAll('.right-penalties .penalty-slot');

    leftSlots.forEach((slot, index) => {
        slot.classList.remove('flipped');
        slot.innerHTML = `<span>Tap to Reveal</span>`;
        slot.dataset.ruleText = teamBRules[index]; // Team B's cards are placed on Left (Team A's side)
    });

    rightSlots.forEach((slot, index) => {
        slot.classList.remove('flipped');
        slot.innerHTML = `<span>Tap to Reveal</span>`;
        slot.dataset.ruleText = teamARules[index]; // Team A's cards are placed on Right (Team B's side)
    });

    setupTimerInteractions();
    navigateTo('screen-game-board');
}

function flipCard(slotElement) {
    if(!slotElement.classList.contains('flipped')) {
        slotElement.classList.add('flipped');
        slotElement.innerHTML = `<strong>${slotElement.dataset.ruleText}</strong>`;
    }
}

// Adaptive Touch/Click Timer Control System
function setupTimerInteractions() {
    const timerDisplay = document.getElementById('timer-display');
    
    // Normal tap handler
    timerDisplay.onclick = function() {
        if (isTimerRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    };

    // Long press logic supporting desktop click & mobile touches
    const startResetTrack = () => { timerTouchStart = Date.now(); };
    const endResetTrack = () => {
        if (Date.now() - timerTouchStart >= 1000) {
            resetTimer();
        }
    };

    timerDisplay.onmousedown = startResetTrack;
    timerDisplay.onmouseup = endResetTrack;
    timerDisplay.ontouchstart = startResetTrack;
    timerDisplay.ontouchend = endResetTrack;
}

function startTimer() {
    if (isTimerRunning) return;
    isTimerRunning = true;
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer-display').innerText = timeLeft;
        if (timeLeft <= 0) {
            pauseTimer();
            alert("Time's Up!");
        }
    }, 1000);
}

function pauseTimer() {
    isTimerRunning = false;
    clearInterval(timerInterval);
}

function resetTimer() {
    pauseTimer();
    timeLeft = 60;
    document.getElementById('timer-display').innerText = timeLeft;
}