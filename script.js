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

let teamAProgress = 0; 
let teamBProgress = 0; 

let timerInterval = null;
let timeLeft = 60;
let isTimerRunning = false;
let isTimerLocked = false; 
let timerTouchStart = 0;

function navigateTo(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    if (screenId === 'screen-team-select') checkGameReadyStatus();
}

function shuffle(array) {
    let m = array.length, t, i;
    while (m) {
        i = Math.floor(Math.random() * m--);
        t = array[m]; array[m] = array[i]; array[i] = t;
    }
    return array;
}

function openRuleSelection(team) {
    currentSelectingTeam = team;
    selectedIndices = [];
    document.getElementById('rule-screen-title').innerText = `Team ${team} Rule Pick`;
    
    let shuffledPool = shuffle([...ALL_RULES]);
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
        card.addEventListener('click', () => toggleRuleSelection(card, index));
        grid.appendChild(card);
    });
    
    updateReadyButtonState();
    navigateTo('screen-rule-select');
}

function toggleRuleSelection(cardElement, index) {
    const pos = selectedIndices.indexOf(index);
    if (pos > -1) {
        selectedIndices.splice(pos, 1);
        cardElement.classList.remove('selected');
    } else if (selectedIndices.length < 3) {
        selectedIndices.push(index);
        cardElement.classList.add('selected');
    }
    updateReadyButtonState();
}

function updateReadyButtonState() {
    document.getElementById('btn-rules-ready').disabled = (selectedIndices.length !== 3);
}

function confirmRules() {
    const chosenRules = selectedIndices.map(idx => currentTeamPool[idx]);
    if (currentSelectingTeam === 'A') {
        teamARules = chosenRules;
        document.getElementById('btn-team-a').innerText = 'Team A (Selected)';
        document.getElementById('btn-team-a').style.opacity = '0.6';
    } else {
        teamBRules = chosenRules;
        document.getElementById('btn-team-b').innerText = 'Team B (Selected)';
        document.getElementById('btn-team-b').style.opacity = '0.6';
    }
    navigateTo('screen-team-select');
}

function checkGameReadyStatus() {
    if (teamARules.length === 3 && teamBRules.length === 3) {
        document.getElementById('btn-start-match').classList.remove('hidden');
    }
}

function startGameBoard() {
    teamAProgress = 0;
    teamBProgress = 0;
    resetTimer();

    buildTrackSquares('A');
    buildTrackSquares('B');

    // Index mappings: slot 5=index 0, slot 10=index 1, slot 15=index 2
    document.getElementById('card-left-5').dataset.rule = teamBRules[0];
    document.getElementById('card-left-10').dataset.rule = teamBRules[1];
    document.getElementById('card-left-15').dataset.rule = teamBRules[2];

    document.getElementById('card-right-5').dataset.rule = teamARules[0];
    document.getElementById('card-right-10').dataset.rule = teamARules[1];
    document.getElementById('card-right-15').dataset.rule = teamARules[2];

    setupTimerInteractions();
    navigateTo('screen-game-board');
}

function buildTrackSquares(teamId) {
    const container = document.getElementById(`squares-container-${teamId}`);
    container.innerHTML = '';

    for (let i = 1; i <= 20; i++) {
        const sq = document.createElement('div');
        sq.className = 'board-square';
        if (i === 20) sq.classList.add('win-space');
        sq.innerText = (i === 20) ? "WIN" : i;
        
        sq.addEventListener('click', () => handleSquareTap(teamId, i, sq));
        container.appendChild(sq);
    }
}

function handleSquareTap(teamId, squareNum, element) {
    let currentProgress = (teamId === 'A') ? teamAProgress : teamBProgress;

    // Strict sequential rule matching
    if (squareNum === currentProgress + 1) {
        if (teamId === 'A') {
            teamAProgress = squareNum;
            element.style.background = 'var(--team-a-color)';
        } else {
            teamBProgress = squareNum;
            element.style.background = 'var(--team-b-color)';
        }
        element.style.color = '#000';

        // Check for victory handling condition
        if (squareNum === 20) {
            triggerVictory(teamId);
            return;
        }

        // Check for rules milestone activations
        if (squareNum === 5 || squareNum === 10 || squareNum === 15) {
            triggerMilestoneCard(teamId, squareNum);
        }
    }
}

function triggerMilestoneCard(teamId, step) {
    const side = (teamId === 'A') ? 'left' : 'right';
    const targetCard = document.getElementById(`card-${side}-${step}`);
    
    if (!targetCard || targetCard.classList.contains('revealed')) return;

    // Freeze timer tracking loop loop safely
    let wasRunning = isTimerRunning;
    isTimerRunning = false;
    isTimerLocked = true;
    clearInterval(timerInterval);

    // Apply flash class instantly
    targetCard.classList.add('flashing');
    targetCard.classList.add('revealed');
    targetCard.innerHTML = `<strong>${targetCard.dataset.rule}</strong>`;

    // Wait exactly 2 seconds before unfreezing timer controls to give teams reading time
    setTimeout(() => {
        targetCard.classList.remove('flashing');
        isTimerLocked = false;
        if (wasRunning) {
            startTimer();
        }
    }, 2000);
}

function triggerVictory(teamName) {
    pauseTimer();
    document.getElementById('victory-message').innerText = `Team ${teamName} Wins!`;
    navigateTo('screen-victory');
}

function setupTimerInteractions() {
    const timerDisplay = document.getElementById('timer-display');
    
    timerDisplay.onclick = function() {
        if (isTimerLocked) return;
        if (isTimerRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    };

    const startTrack = () => { timerTouchStart = Date.now(); };
    const endTrack = () => {
        if (Date.now() - timerTouchStart >= 1000) {
            resetTimer();
        }
    };

    timerDisplay.onmousedown = startTrack;
    timerDisplay.onmouseup = endTrack;
    timerDisplay.ontouchstart = startTrack;
    timerDisplay.ontouchend = endTrack;
}

function startTimer() {
    if (isTimerRunning || isTimerLocked) return;
    isTimerRunning = true;
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer-display').innerText = timeLeft;
        if (timeLeft <= 0) {
            pauseTimer();
            alert("Time is up!");
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