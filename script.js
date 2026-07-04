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
  "Cannot use words starting with 'N'",
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
  "Cannot say the word 'You'",
  "Must plug your nose while giving clues",
  "Must high-five a teammate after every correct guess",
  "Cannot use any hand gestures or body movements",
  "Must say 'Ding' every time you say a number",
  "Must salute before saying a new word",
  "Cannot look down at the screen while your team is guessing",
  "Must snap your fingers every time a teammate speaks",
  "Must bark like a dog if your team skips a word",
  "Must speak as if you are completely out of breath",
  "Must close both eyes while your team is talking",
];

// 60+ Authentic Playable Adjectives
const ADJECTIVES = [
  "angry",
  "sticky",
  "smelly",
  "wobbly",
  "shiny",
  "greasy",
  "fluffy",
  "frozen",
  "spicy",
  "gigantic",
  "tiny",
  "golden",
  "slippery",
  "noisy",
  "clumsy",
  "magic",
  "haunted",
  "stinky",
  "fancy",
  "fuzzy",
  "sweaty",
  "crumpy",
  "salty",
  "glowing",
  "rusty",
  "shaky",
  "muddy",
  "elastic",
  "sleepy",
  "screaming",
  "creepy",
  "heavy",
  "skinny",
  "plastic",
  "flying",
  "liquid",
  "fancy",
  "bubbly",
  "grumpy",
  "brave",
  "crazy",
  "lonely",
  "wooden",
  "chubby",
  "poisonous",
  "secret",
  "smoky",
  "jolly",
  "wild",
  "blind",
  "juicy",
  "chilly",
  "flaming",
  "melted",
  "filthy",
  "polite",
  "drunken",
  "nervous",
  "hungry",
  "ghostly",
  "rotten",
  "speedy",
];

// 60+ Authentic Playable Nouns
const NOUNS = [
  "hamster",
  "banana",
  "grandma",
  "toaster",
  "monkey",
  "penguin",
  "pirate",
  "octopus",
  "cactus",
  "diaper",
  "wizard",
  "chicken",
  "hotdog",
  "astronaut",
  "monster",
  "toilet",
  "mermaid",
  "hamburger",
  "broccoli",
  "donkey",
  "eyeball",
  "zombie",
  "pancake",
  "squirrel",
  "potato",
  "teacher",
  "dinosaur",
  "baby",
  "vampire",
  "balloon",
  "pillow",
  "sandwich",
  "tractor",
  "spider",
  "pickle",
  "waffle",
  "alien",
  "gorilla",
  "kitten",
  "robot",
  "chicken",
  "suitcase",
  "muffin",
  "sneaker",
  "garbage",
  "blanket",
  "pumpkin",
  "cowboy",
  "hippie",
  "doctor",
  "onion",
  "spider",
  "eyebrow",
  "burrito",
  "pigeon",
  "sausage",
  "shadow",
  "trophy",
  "feather",
  "guitar",
  "ladder",
  "trumpet",
];

// Smart Tracking Repositories
let unusedAdjectives = [];
let unusedNouns = [];
let combinationHistory = {}; // Key: Adjective, Value: Array of historically paired Nouns

let currentTeamPool = [];
let teamARules = [];
let teamBRules = [];
let currentSelectingTeam = "";
let selectedIndices = [];

let teamAProgress = 0;
let teamBProgress = 0;

let timerInterval = null;
let timeLeft = 45;
let isTimerRunning = false;
let isTimerLocked = false;
let timerTouchStart = 0;

function navigateTo(screenId) {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById(screenId).classList.add("active");
  if (screenId === "screen-team-select") checkGameReadyStatus();
}

function resetToHome(event) {
  if (event) event.preventDefault();
  pauseTimer();
  teamARules = [];
  teamBRules = [];
  teamAProgress = 0;
  teamBProgress = 0;
  const btnA = document.getElementById("btn-team-a");
  const btnB = document.getElementById("btn-team-b");
  if (btnA) {
    btnA.innerText = "Team A";
    btnA.style.opacity = "1";
  }
  if (btnB) {
    btnB.innerText = "Team B";
    btnB.style.opacity = "1";
  }
  const startMatchBtn = document.getElementById("btn-start-match");
  if (startMatchBtn) startMatchBtn.classList.add("hidden");
  navigateTo("screen-welcome");
}

function shuffle(array) {
  let m = array.length,
    t,
    i;
  while (m) {
    i = Math.floor(Math.random() * m--);
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }
  return array;
}

// Memory Allocation Initialization Loops for Word Pools
function initWordDecks() {
  if (unusedAdjectives.length === 0) {
    unusedAdjectives = shuffle([...ADJECTIVES]);
  }
  if (unusedNouns.length === 0) {
    unusedNouns = shuffle([...NOUNS]);
  }
  // Load pairing tracking history from local storage cache memory safely
  if (localStorage.getItem("umm_pairing_history")) {
    combinationHistory = JSON.parse(
      localStorage.getItem("umm_pairing_history"),
    );
  } else {
    ADJECTIVES.forEach((adj) => (combinationHistory[adj] = []));
  }
}

function openWordsTab() {
  initWordDecks();
  // Enforce initial startup display state toggles safely
  document.getElementById("words-setup-view").classList.remove("hidden");
  document.getElementById("words-game-view").classList.add("hidden");
  navigateTo("screen-words-view");
}

function revealPairing() {
  document.getElementById("words-setup-view").classList.add("hidden");
  document.getElementById("words-game-view").classList.remove("hidden");
  drawNextPairing();
}

// Unique Non-Repeating Combo Generation Engine
function drawNextPairing() {
  initWordDecks(); // Self-healing fallback loop check

  let chosenAdjIndex = -1;
  let chosenNounIndex = -1;
  let foundUniqueCombination = false;

  // Search loops to locate unmatched pairs safely
  for (let a = 0; a < unusedAdjectives.length; a++) {
    let currentAdj = unusedAdjectives[a];

    for (let n = 0; n < unusedNouns.length; n++) {
      let currentNoun = unusedNouns[n];

      // Verification check against history arrays
      if (
        !combinationHistory[currentAdj] ||
        !combinationHistory[currentAdj].includes(currentNoun)
      ) {
        chosenAdjIndex = a;
        chosenNounIndex = n;
        foundUniqueCombination = true;
        break;
      }
    }
    if (foundUniqueCombination) break;
  }

  // Edge Case Recovery Trigger: If word list runs out of combinations, reset pairings record array
  if (!foundUniqueCombination) {
    unusedAdjectives.forEach((adj) => (combinationHistory[adj] = []));
    localStorage.removeItem("umm_pairing_history");
    chosenAdjIndex = 0;
    chosenNounIndex = 0;
  }

  // Extract records out of live tracking arrays
  let targetAdjective = unusedAdjectives.splice(chosenAdjIndex, 1)[0];
  let targetNoun = unusedNouns.splice(chosenNounIndex, 1)[0];

  // Push into cache registry metrics to protect uniqueness rules
  if (!combinationHistory[targetAdjective])
    combinationHistory[targetAdjective] = [];
  combinationHistory[targetAdjective].push(targetNoun);
  localStorage.setItem(
    "umm_pairing_history",
    JSON.stringify(combinationHistory),
  );

  // Text delivery outputs
  document.getElementById("display-adjective").innerText = targetAdjective;
  document.getElementById("display-noun").innerText = targetNoun;
}

// Core Game Mechanics (Previous Step)
function openRuleSelection(team) {
  currentSelectingTeam = team;
  selectedIndices = [];
  document.getElementById("rule-screen-title").innerText =
    `Team ${team} Rule Pick`;
  let shuffledPool = shuffle([...ALL_RULES]);
  if (team === "B" && teamARules.length > 0) {
    shuffledPool = shuffledPool.filter((rule) => !teamARules.includes(rule));
  }
  currentTeamPool = shuffledPool.slice(0, 6);
  const grid = document.getElementById("rules-grid");
  grid.innerHTML = "";
  currentTeamPool.forEach((rule, index) => {
    const card = document.createElement("div");
    card.className = "rule-card";
    card.innerText = rule;
    card.addEventListener("click", () => toggleRuleSelection(card, index));
    grid.appendChild(card);
  });
  updateReadyButtonState();
  navigateTo("screen-rule-select");
}

function toggleRuleSelection(cardElement, index) {
  const pos = selectedIndices.indexOf(index);
  if (pos > -1) {
    selectedIndices.splice(pos, 1);
    cardElement.classList.remove("selected");
  } else if (selectedIndices.length < 3) {
    selectedIndices.push(index);
    cardElement.classList.add("selected");
  }
  updateReadyButtonState();
}

function updateReadyButtonState() {
  document.getElementById("btn-rules-ready").disabled =
    selectedIndices.length !== 3;
}

function confirmRules() {
  const chosenRules = selectedIndices.map((idx) => currentTeamPool[idx]);
  if (currentSelectingTeam === "A") {
    teamARules = chosenRules;
    document.getElementById("btn-team-a").innerText = "Team A (Selected)";
    document.getElementById("btn-team-a").style.opacity = "0.6";
  } else {
    teamBRules = chosenRules;
    document.getElementById("btn-team-b").innerText = "Team B (Selected)";
    document.getElementById("btn-team-b").style.opacity = "0.6";
  }
  navigateTo("screen-team-select");
}

function checkGameReadyStatus() {
  if (teamARules.length === 3 && teamBRules.length === 3) {
    document.getElementById("btn-start-match").classList.remove("hidden");
  }
}

function startGameBoard() {
  teamAProgress = 0;
  teamBProgress = 0;
  resetTimer();
  buildTrackSquares("A");
  buildTrackSquares("B");
  const pCards = document.querySelectorAll(".penalty-card");
  pCards.forEach((c) => {
    c.classList.remove("revealed", "flashing");
    c.innerHTML = "<span>Rule</span>";
  });
  document.getElementById("card-left-5").dataset.rule = teamBRules[0];
  document.getElementById("card-left-10").dataset.rule = teamBRules[1];
  document.getElementById("card-left-15").dataset.rule = teamBRules[2];
  document.getElementById("card-right-5").dataset.rule = teamARules[0];
  document.getElementById("card-right-10").dataset.rule = teamARules[1];
  document.getElementById("card-right-15").dataset.rule = teamARules[2];
  setupTimerInteractions();
  navigateTo("screen-game-board");
}

function buildTrackSquares(teamId) {
  const container = document.getElementById(`squares-container-${teamId}`);
  container.innerHTML = "";
  for (let i = 1; i <= 20; i++) {
    const sq = document.createElement("div");
    sq.className = "board-square";
    if (i === 20) sq.classList.add("win-space");
    sq.innerText = i === 20 ? "WIN" : i;
    sq.addEventListener("click", () => handleSquareTap(teamId, i, sq));
    container.appendChild(sq);
  }
}

function handleSquareTap(teamId, squareNum, element) {
  let currentProgress = teamId === "A" ? teamAProgress : teamBProgress;
  if (squareNum === currentProgress + 1) {
    if (teamId === "A") {
      teamAProgress = squareNum;
      element.style.background = "var(--team-a-color)";
    } else {
      teamBProgress = squareNum;
      element.style.background = "var(--team-b-color)";
    }
    element.style.color = "#000";
    if (squareNum === 20) {
      triggerVictory(teamId);
      return;
    }
    if (squareNum === 5 || squareNum === 10 || squareNum === 15) {
      triggerMilestoneCard(teamId, squareNum);
    }
  }
}

function triggerMilestoneCard(teamId, step) {
  const side = teamId === "A" ? "left" : "right";
  const targetCard = document.getElementById(`card-${side}-${step}`);
  if (!targetCard || targetCard.classList.contains("revealed")) return;

  let wasRunning = isTimerRunning;
  isTimerRunning = false;
  isTimerLocked = true;
  clearInterval(timerInterval);

  targetCard.classList.add("flashing");
  targetCard.classList.add("revealed");
  targetCard.innerHTML = `<strong>${targetCard.dataset.rule}</strong>`;

  setTimeout(() => {
    targetCard.classList.remove("flashing");
    isTimerLocked = false;
    if (wasRunning) startTimer();
  }, 2000);
}

function triggerVictory(teamName) {
  pauseTimer();
  document.getElementById("victory-message").innerText =
    `Team ${teamName} Wins!`;
  navigateTo("screen-victory");
}

function setupTimerInteractions() {
    const timerDisplay = document.getElementById('timer-display');
    let holdTimeout = null;
    let wasResetThisTouch = false;

    // Unified press activation system for mouse and touch inputs
    const startTrack = (e) => {
        // Stop browser default handling to prevent ghost clicks on mobile devices
        if (e.type === 'touchstart') e.preventDefault(); 
        
        wasResetThisTouch = false;
        
        // Count down exactly 1 second (1000ms) for continuous hold
        holdTimeout = setTimeout(() => {
            resetTimer();             // Fire 45 reset instantly while holding down finger
            wasResetThisTouch = true; // Mark flag to block standard tap action on release
        }, 1000);
    };
    
    // Unified release execution logic
    const endTrack = (e) => {
        if (e.type === 'touchend' || e.type === 'mouseup') {
            clearTimeout(holdTimeout); // Cancel background hold listener
            
            // If the user did NOT hold long enough to trigger a reset, execute standard play/pause
            if (!wasResetThisTouch && !isTimerLocked) {
                if (isTimerRunning) {
                    pauseTimer();
                } else {
                    startTimer();
                }
            }
        }
    };

    const cancelTrack = () => {
        clearTimeout(holdTimeout);
    };

    // Bind listeners across modern tablet/mobile touch and desktop pointer drivers
    timerDisplay.onmousedown = startTrack;
    timerDisplay.onmouseup = endTrack;
    timerDisplay.onmouseleave = cancelTrack;
    
    timerDisplay.ontouchstart = startTrack;
    timerDisplay.ontouchend = endTrack;
    timerDisplay.ontouchcancel = cancelTrack;
}

function startTimer() {
  if (isTimerRunning || isTimerLocked) return;
  isTimerRunning = true;

  document.getElementById("timer-display").classList.remove("time-up");

  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById("timer-display").innerText = timeLeft;
    if (timeLeft <= 0) {
      pauseTimer();
      document.getElementById("timer-display").classList.add("time-up");
    }
  }, 1000);
}

function resetTimer() {
  pauseTimer();
  timeLeft = 45;
  const timerEl = document.getElementById("timer-display");
  timerEl.innerText = timeLeft;
  timerEl.classList.remove("time-up");
}

function pauseTimer() {
  isTimerRunning = false;
  clearInterval(timerInterval);
}
