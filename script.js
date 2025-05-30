const FA_ICONS = {
    pause: 'fas fa-pause',
    play: 'fas fa-play',
    flag: 'fas fa-flag',
    cancel: 'fas fa-times',
    gear: 'fas fa-cog',
    trophy: 'fas fa-trophy',
    cardsStack: 'fas fa-layer-group',
    lockOpen: 'fas fa-lock-open',
    scroll: 'fas fa-scroll',
    crown: 'fas fa-crown',
    gemCluster: 'fas fa-gem',
    coinsBag: 'fas fa-sack-dollar',
    chartPie: 'fas fa-chart-pie',
    purchaseAction: 'fas fa-shopping-cart',
    takeGemsAction: 'fas fa-hand-holding-gem',
    apiKeyLoaded: 'fas fa-key',
    apiKeyMissing: 'fas fa-key',
    apiKeyError: 'fas fa-exclamation-triangle',
    endTurnFlag: 'fas fa-flag-checkered',
    aiBadge: 'fas fa-robot',
    startIcon: 'fas fa-play-circle'
};


document.addEventListener('DOMContentLoaded', () => {

    const setupScreen = document.getElementById('setup-screen');
    const gameContainer = document.getElementById('game-container');
    const playerCountSelector = document.getElementById('player-count-selector');
    const timerInput = document.getElementById('timer-input');
    const timerPresetsContainer = document.getElementById('timer-presets');
    const playerNamesDiv = document.getElementById('player-names');
    const simulationModeCheckbox = document.getElementById('simulation-mode');
    const simulationSpeedInput = document.getElementById('simulation-speed');
    const simulationSpeedContainer = document.getElementById('simulation-speed-container');
    const startGameBtn = document.getElementById('start-game-btn');
    const apiKeyIndicatorContainer = document.getElementById('api-key-indicator-container');
    const apiKeyIcon = document.getElementById('api-key-icon-fa');
    const apiKeyTooltipText = document.getElementById('api-key-tooltip-text');

    const noblesContainer = document.querySelector('#nobles-area .nobles-container');
    const timerDisplay = document.getElementById('timer-display');
    const logMessagesDiv = document.getElementById('log-messages');
    const endTurnEarlyBtn = document.getElementById('end-turn-early-btn');
    const simulationPauseBtn = document.getElementById('simulation-pause-btn');
    const simulationStatusSpan = document.getElementById('simulation-status');
    const gemBankContainer = document.getElementById('gem-bank');

    const apSelectionText = document.getElementById('ap-selection-text');
    const apSelectedGemsDisplay = document.getElementById('ap-selected-gems-display');
    const apCardPreview = document.getElementById('ap-card-preview');
    const apActionButtons = document.getElementById('ap-action-buttons');
    const apCancelBtn = document.getElementById('ap-cancel-btn');

    const deckCounts = { 1: document.getElementById('deck-1-count'), 2: document.getElementById('deck-2-count'), 3: document.getElementById('deck-3-count') };
    const visibleCardsContainers = { 1: document.getElementById('visible-cards-1'), 2: document.getElementById('visible-cards-2'), 3: document.getElementById('visible-cards-3') };
    const deckElements = { 1: document.getElementById('deck-1'), 2: document.getElementById('deck-2'), 3: document.getElementById('deck-3') };
    const playersAreaContainer = document.getElementById('players-area');
    const returnGemsOverlay = document.getElementById('return-gems-overlay');
    const returnGemsCountSpan = document.getElementById('return-gems-count');
    const returnGemsNeededSpan = document.getElementById('return-gems-needed');
    const returnGemsPlayerDisplay = document.getElementById('return-gems-player-display');
    const returnGemsSelectionDisplay = document.getElementById('return-gems-selection-display');
    const confirmReturnGemsBtn = document.getElementById('confirm-return-gems-btn');
    const gameOverOverlay = document.getElementById('game-over-overlay');
    const finalScoresDiv = document.getElementById('final-scores');
    const playAgainBtn = document.getElementById('play-again-btn');
    const nobleChoiceOverlay = document.getElementById('noble-choice-overlay');
    const nobleChoiceOptionsContainer = document.getElementById('noble-choice-options');
    const confirmNobleChoiceBtn = document.getElementById('confirm-noble-choice-btn');
    const aiThinkingOverlay = document.getElementById('ai-thinking-overlay');
    const aiThinkingPlayerName = document.getElementById('ai-thinking-player-name');
    const customTooltipElement = document.querySelector('.custom-tooltip');


    let players = [];
    let bank = {};
    let decks = { 1: [], 2: [], 3: [] };
    let visibleCards = { 1: [], 2: [], 3: [] };
    let availableNobles = [];
    let currentPlayerIndex = 0;
    let turnNumber = 1;
    let gameSettings = { selectedPlayerCount: 4, timerMinutes: 1.5, playerCount: 4 };
    let isGameOverConditionMet = false;
    let gameTrulyFinished = false;
    let lastRoundPlayerIndex = -1;
    let turnTimerInterval = null;
    let turnTimeRemaining = 0;
    let turnDuration = 0;
    let selectedGemTypes = [];
    let selectedCard = null;
    let currentAction = null;
    let gameHistoryLog = [];
    let aiActionCounter = 0;

    let activeTooltipTarget = null;
    let hideTooltipTimeoutId = null;


    const MAX_GEMS_PLAYER = 10;
    const MAX_RESERVED_CARDS = 3;
    const CARDS_PER_LEVEL_VISIBLE = 4;
    const WINNING_SCORE = 15;
    const TIMER_LOW_THRESHOLD = 10;
    const MIN_GEMS_FOR_TAKE_TWO = 4;
    const PLAYER_COLORS = ['player-color-1', 'player-color-2', 'player-color-3', 'player-color-4'];
    const THEME_COLOR_NAMES = { 'player-color-1': 'Red', 'player-color-2': 'Blue', 'player-color-3': 'Green', 'player-color-4': 'Yellow' };

    let GEMINI_API_KEY = null;
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=';
    let isSimulationMode = false;
    let isSimulationPaused = false;
    let simulationTurnDelayMs = 200;

    const AI_CONFIG = {
        isEnabled: false,
        requestTimeoutMs: 25000,
        maxRetries: 2,
        thinkingIndicatorDelayMs: 300,
        logPrompts: false,
        logResponses: false,
    };

    function initializeApiKey() {
        const storedKey = localStorage.getItem('geminiApiKey');
        if (apiKeyIcon) {
            apiKeyIcon.className = FA_ICONS.apiKeyLoaded;
            if (storedKey) {
                GEMINI_API_KEY = storedKey;
                apiKeyIcon.classList.add('loaded');
                if (apiKeyTooltipText) apiKeyTooltipText.textContent = "API Key loaded.";
                AI_CONFIG.isEnabled = true;
            } else {
                apiKeyIcon.classList.add('missing');
                if (apiKeyTooltipText) apiKeyTooltipText.textContent = "API Key not found. AI Players disabled. Click to set.";
                AI_CONFIG.isEnabled = false;
            }
        }
        if (typeof setupPlayerNameInputs === 'function') {
           setupPlayerNameInputs();
        }
    }

    function promptForApiKey() {
        const newKey = prompt("Gemini API Key not found or invalid.\nPlease enter your Gemini API Key (will be stored locally for future sessions):");
        if (apiKeyIcon) {
            apiKeyIcon.className = FA_ICONS.apiKeyLoaded;
            if (newKey) {
                GEMINI_API_KEY = newKey;
                localStorage.setItem('geminiApiKey', GEMINI_API_KEY);
                apiKeyIcon.classList.remove('missing', 'error'); apiKeyIcon.classList.add('loaded');
                if (apiKeyTooltipText) apiKeyTooltipText.textContent = "API Key stored and loaded.";
                AI_CONFIG.isEnabled = true;
            } else {
                apiKeyIcon.classList.remove('loaded', 'error'); apiKeyIcon.classList.add('missing');
                if (apiKeyTooltipText) apiKeyTooltipText.textContent = "API Key not provided. AI Players disabled. Click to set.";
                AI_CONFIG.isEnabled = false;
            }
        }
        setupPlayerNameInputs();
    }

    function initGame(playerData) {
        console.log("Initializing game with data:", playerData);
        players = [];
        bank = {};
        decks = { 1: [], 2: [], 3: [] };
        visibleCards = { 1: [], 2: [], 3: [] };
        availableNobles = [];
        currentPlayerIndex = 0;
        turnNumber = 1;
        isGameOverConditionMet = false;
        gameTrulyFinished = false;
        lastRoundPlayerIndex = -1;
        stopTimer();
        hideOverlays();
        clearActionState();
        if (logMessagesDiv) logMessagesDiv.innerHTML = '';
        gameHistoryLog = [];
        aiActionCounter = 0;
        isSimulationPaused = false;

        simulationTurnDelayMs = parseInt(simulationSpeedInput.value, 10) || 200;
        gameSettings.playerCount = playerData.length;

        const noblesAreaH2 = document.querySelector('#nobles-area h2');
        if (noblesAreaH2) noblesAreaH2.textContent = "Available Patrons";
        const bankAreaH2 = document.querySelector('#bank-area h2');
        if (bankAreaH2) bankAreaH2.textContent = "Treasury";

        playerData.forEach((pData, i) => {
            players.push({
                id: i, name: pData.name, colorTheme: pData.colorTheme, type: pData.type,
                gems: { white: 0, blue: 0, green: 0, red: 0, black: 0, gold: 0 },
                cards: [], reservedCards: [], nobles: [], score: 0,
                bonuses: { white: 0, blue: 0, green: 0, red: 0, black: 0 },
                stats: {
                    isFirstPlayer: (i === 0), turnsTaken: 0, triggeredGameEnd: false, turnReached15VP: null,
                    cardsPurchasedCount: 0, cardsPurchasedByLevel: { 1: 0, 2: 0, 3: 0 },
                    cardsPurchasedByColor: { white: 0, blue: 0, green: 0, red: 0, black: 0 },
                    purchasedFromReserveCount: 0, purchasedFromBoardCount: 0, selfSufficientPurchases: 0,
                    firstCardPurchasedTurn: { 1: null, 2: null, 3: null }, cardsReservedTotalCount: 0,
                    allReservedCardsData: [], deckReservations: { 1: 0, 2: 0, 3: 0 }, boardReservations: { 1: 0, 2: 0, 3: 0 },
                    gemsTaken: { white: 0, blue: 0, green: 0, red: 0, black: 0 }, goldTaken: 0,
                    gemsSpent: { white: 0, blue: 0, green: 0, red: 0, black: 0 }, goldSpent: 0,
                    gemsReturnedOverLimit: { white: 0, blue: 0, green: 0, red: 0, black: 0 },
                    peakGemsHeld: 0, take3Actions: 0, take2Actions: 0,
                    turnsEndedExactLimit: 0, turnsEndedBelowLimit: 0, noblesAcquiredTurn: {},
                    reserveActions: 0, purchaseActions: 0, gemTakeActions: 0,
                }
            });
        });

        const gemCount = gameSettings.playerCount === 2 ? 4 : (gameSettings.playerCount === 3 ? 5 : 7);
        GEM_TYPES.forEach(gem => bank[gem] = gemCount);
        bank[GOLD] = 5;

        decks[1] = shuffleArray([...ALL_CARDS.filter(c => c.level === 1)]);
        decks[2] = shuffleArray([...ALL_CARDS.filter(c => c.level === 2)]);
        decks[3] = shuffleArray([...ALL_CARDS.filter(c => c.level === 3)]);

        for (let level = 1; level <= 3; level++) {
            visibleCards[level] = [];
            for (let i = 0; i < CARDS_PER_LEVEL_VISIBLE; i++) {
                drawCard(level, i, true); // Pass true for isInitialDraw
            }
        }

        const numNobles = gameSettings.playerCount + 1;
        availableNobles = shuffleArray([...ALL_NOBLES]).slice(0, numNobles);

        renderBank();
        renderCards();
        renderNobles();
        renderPlayers();
        renderSelectionInfo();

        updateLog(`Game started. Players: ${players.map(p => `${p.name} (${p.type.toUpperCase()})`).join(', ')}.`);
        if(isSimulationMode) {
            updateLog(`AI Simulation Mode ACTIVE. Delay: ${simulationTurnDelayMs}ms.`);
             gameSettings.timerMinutes = 0; turnDuration = 0; renderTimer();
             if(simulationPauseBtn) simulationPauseBtn.classList.remove('hidden');
             if(simulationStatusSpan) simulationStatusSpan.classList.remove('hidden');
             const simBtnIcon = simulationPauseBtn.querySelector('i');
             const simBtnText = simulationPauseBtn.querySelector('.btn-text-placeholder');
             if(isSimulationPaused) {
                 if (simBtnIcon) simBtnIcon.className = FA_ICONS.play;
                 if (simBtnText) simBtnText.textContent = "Resume Sim";
             } else {
                 if (simBtnIcon) simBtnIcon.className = FA_ICONS.pause;
                 if (simBtnText) simBtnText.textContent = "Pause Sim";
             }
             if(simulationStatusSpan) simulationStatusSpan.textContent = isSimulationPaused ? "Paused" : "Running";
             if(endTurnEarlyBtn) endTurnEarlyBtn.classList.add('hidden');
        } else {
            if(simulationPauseBtn) simulationPauseBtn.classList.add('hidden');
            if(simulationStatusSpan) simulationStatusSpan.classList.add('hidden');
        }

        if (setupScreen) {
            setupScreen.style.opacity = '0';
            const handleSetupFadeOut = () => {
                setupScreen.removeEventListener('transitionend', handleSetupFadeOut);
                setupScreen.classList.remove('active');
                setupScreen.classList.add('hidden');
                document.body.style.alignItems = 'flex-start';
                document.body.style.justifyContent = 'center';

                if (gameContainer) {
                    gameContainer.classList.remove('hidden');
                    gameContainer.classList.add('active');
                    gameContainer.style.opacity = '0';
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            gameContainer.style.opacity = '1';
                            window.scrollTo(0, 0);
                        });
                    });
                }
            };
            setupScreen.addEventListener('transitionend', handleSetupFadeOut);
        } else if (gameContainer) {
             document.body.style.alignItems = 'flex-start';
             document.body.style.justifyContent = 'center';
             gameContainer.classList.remove('hidden');
             gameContainer.classList.add('active');
             gameContainer.style.opacity = '1';
             window.scrollTo(0, 0);
        }

        updateLog(`Player ${players[0].name}'s turn (#1).`);
        startTurn();
    }

    function setupPlayerNameInputs() {
        const count = gameSettings.selectedPlayerCount;
        if (!playerNamesDiv) return;
        playerNamesDiv.innerHTML = '';

        for (let i = 0; i < count; i++) {
            const playerEntryDiv = document.createElement('div');
            playerEntryDiv.classList.add('player-setup-entry');
            playerEntryDiv.id = `player-entry-${i}`;

            const nameInputId = `player-name-${i}`;
            const nameLabel = document.createElement('label');
            nameLabel.htmlFor = nameInputId;
            nameLabel.classList.add('setup-label');
            nameLabel.textContent = `Player ${i + 1} Name:`;

            const nameInput = document.createElement('input');
            nameInput.type = 'text'; nameInput.placeholder = `Player ${i + 1} Name`;
            nameInput.id = nameInputId; nameInput.value = `Player ${i + 1}`;
            nameInput.classList.add('setup-input', 'player-name-input');
            nameInput.setAttribute('aria-label', `Player ${i+1} name input`);

            const themeSelectorDiv = document.createElement('div');
            themeSelectorDiv.classList.add('player-theme-selector');
            const themeLabel = document.createElement('label');
            themeLabel.classList.add('setup-label'); themeLabel.textContent = 'Theme:';
            themeLabel.id = `player-theme-label-${i}`;
            themeSelectorDiv.appendChild(themeLabel);
            const swatchesContainer = document.createElement('div');
            swatchesContainer.classList.add('theme-swatches-container');
            swatchesContainer.setAttribute('role', 'radiogroup');
            swatchesContainer.setAttribute('aria-labelledby', `player-theme-label-${i}`);

            PLAYER_COLORS.forEach((colorClass, colorIndex) => {
                const swatchItem = document.createElement('div');
                swatchItem.classList.add('theme-swatch-item'); swatchItem.dataset.colorClass = colorClass;
                swatchItem.setAttribute('role', 'radio');
                swatchItem.setAttribute('tabindex', '0');
                swatchItem.setAttribute('aria-checked', i === colorIndex ? 'true' : 'false');
                swatchItem.setAttribute('aria-label', `Select ${getThemeColorName(colorClass)} theme`);

                const swatch = document.createElement('span');
                swatch.classList.add('theme-swatch', `${colorClass}-bg`);
                swatchItem.appendChild(swatch);
                const themeNameSpan = document.createElement('span');
                themeNameSpan.classList.add('theme-name'); themeNameSpan.textContent = getThemeColorName(colorClass);
                swatchItem.appendChild(themeNameSpan);

                if (i === colorIndex) swatchItem.classList.add('selected');

                const selectTheme = () => {
                    swatchesContainer.querySelectorAll('.theme-swatch-item').forEach(s => {
                        s.classList.remove('selected');
                        s.setAttribute('aria-checked', 'false');
                    });
                    swatchItem.classList.add('selected');
                    swatchItem.setAttribute('aria-checked', 'true');
                };
                swatchItem.addEventListener('click', selectTheme);
                swatchItem.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') selectTheme(); });
                swatchesContainer.appendChild(swatchItem);
            });
            themeSelectorDiv.appendChild(swatchesContainer);

            const typeSelectorDiv = document.createElement('div');
            typeSelectorDiv.classList.add('player-type-selector');
            const typeLabel = document.createElement('label');
            typeLabel.classList.add('setup-label'); typeLabel.textContent = 'Type:';
            typeLabel.id = `player-type-label-${i}`;
            typeSelectorDiv.appendChild(typeLabel);
            const typeButtonGroup = document.createElement('div');
            typeButtonGroup.classList.add('button-group-tight');
            typeButtonGroup.setAttribute('role', 'radiogroup');
            typeButtonGroup.setAttribute('aria-labelledby', `player-type-label-${i}`);

            const humanBtn = document.createElement('button');
            humanBtn.classList.add('btn', 'btn-player-type'); humanBtn.dataset.type = 'human';
            const humanIcon = document.createElement('i'); humanIcon.className = 'fas fa-user';
            humanBtn.appendChild(humanIcon); humanBtn.appendChild(document.createTextNode(' Human'));
            humanBtn.setAttribute('role', 'radio'); humanBtn.setAttribute('aria-label', 'Set player type to Human');

            const aiBtn = document.createElement('button');
            aiBtn.classList.add('btn', 'btn-player-type'); aiBtn.dataset.type = 'ai';
            const aiIcon = document.createElement('i'); aiIcon.className = FA_ICONS.aiBadge;
            aiBtn.appendChild(aiIcon); aiBtn.appendChild(document.createTextNode(' AI'));
            aiBtn.setAttribute('role', 'radio'); aiBtn.setAttribute('aria-label', 'Set player type to AI');


            if (simulationModeCheckbox && simulationModeCheckbox.checked) {
                aiBtn.classList.add('active'); humanBtn.disabled = true; aiBtn.disabled = true;
                aiBtn.setAttribute('aria-checked', 'true'); humanBtn.setAttribute('aria-checked', 'false');
            } else {
                humanBtn.classList.add('active'); aiBtn.disabled = !AI_CONFIG.isEnabled;
                humanBtn.setAttribute('aria-checked', 'true'); aiBtn.setAttribute('aria-checked', 'false');
            }

            [humanBtn, aiBtn].forEach(btn => {
                btn.addEventListener('click', () => {
                    if (btn.disabled) return;
                    typeButtonGroup.querySelectorAll('.btn-player-type').forEach(b => {
                        b.classList.remove('active');
                        b.setAttribute('aria-checked', 'false');
                    });
                    btn.classList.add('active');
                    btn.setAttribute('aria-checked', 'true');
                });
                typeButtonGroup.appendChild(btn);
            });
            typeSelectorDiv.appendChild(typeButtonGroup);

            playerEntryDiv.appendChild(nameLabel);
            playerEntryDiv.appendChild(nameInput);
            playerEntryDiv.appendChild(themeSelectorDiv);
            playerEntryDiv.appendChild(typeSelectorDiv);
            playerNamesDiv.appendChild(playerEntryDiv);
        }
        if (!AI_CONFIG.isEnabled) {
            document.querySelectorAll('.btn-player-type[data-type="ai"]').forEach(btn => {
                btn.disabled = true;
                if (btn.classList.contains('active')) {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-checked', 'false');
                    const humanEquivalent = btn.parentElement.querySelector('.btn-player-type[data-type="human"]');
                    if (humanEquivalent) {
                        humanEquivalent.classList.add('active');
                        humanEquivalent.setAttribute('aria-checked', 'true');
                    }
                }
            });
            if (simulationModeCheckbox) simulationModeCheckbox.disabled = true;
        } else {
             if (simulationModeCheckbox) simulationModeCheckbox.disabled = false;
        }
    }

    function updatePlayerCountSelection(count) {
        gameSettings.selectedPlayerCount = parseInt(count, 10);
        if (playerCountSelector) {
            playerCountSelector.querySelectorAll('.btn-player-count').forEach(btn => {
                const isActive = parseInt(btn.dataset.value, 10) === gameSettings.selectedPlayerCount;
                btn.classList.toggle('active', isActive);
                btn.setAttribute('aria-pressed', isActive ? 'true' : 'false'); // Use aria-pressed for toggle buttons
            });
        }
        setupPlayerNameInputs();
    }

    function setupEventListeners() {
        if (playerCountSelector) {
            playerCountSelector.querySelectorAll('.btn-player-count').forEach(button => {
                button.addEventListener('click', (e) => updatePlayerCountSelection(e.currentTarget.dataset.value));
            });
        }
        if (timerPresetsContainer) {
            timerPresetsContainer.querySelectorAll('.btn-timer-preset').forEach(button => {
                button.addEventListener('click', (e) => {
                    timerInput.value = parseFloat(e.currentTarget.dataset.value);
                    timerPresetsContainer.querySelectorAll('.btn-timer-preset').forEach(btn => {
                        btn.classList.remove('active');
                        btn.setAttribute('aria-pressed', 'false');
                    });
                    e.currentTarget.classList.add('active');
                    e.currentTarget.setAttribute('aria-pressed', 'true');
                });
            });
        }
        if (timerInput) {
            timerInput.addEventListener('input', () => {
                const currentValue = parseFloat(timerInput.value);
                timerPresetsContainer.querySelectorAll('.btn-timer-preset').forEach(btn => {
                    const isActive = parseFloat(btn.dataset.value) === currentValue;
                    btn.classList.toggle('active', isActive);
                    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
                });
            });
        }
        if (simulationModeCheckbox) {
            simulationModeCheckbox.addEventListener('change', () => {
                isSimulationMode = simulationModeCheckbox.checked;
                simulationSpeedContainer.classList.toggle('hidden', !isSimulationMode);
                timerInput.disabled = isSimulationMode;
                timerPresetsContainer.querySelectorAll('.btn-timer-preset').forEach(btn => btn.disabled = isSimulationMode);
                if (isSimulationMode) timerInput.value = 0;

                document.querySelectorAll('.player-setup-entry').forEach(entry => {
                    const humanBtn = entry.querySelector('.btn-player-type[data-type="human"]');
                    const aiBtn = entry.querySelector('.btn-player-type[data-type="ai"]');
                    if (isSimulationMode) {
                        if(humanBtn) { humanBtn.classList.remove('active'); humanBtn.disabled = true; humanBtn.setAttribute('aria-checked', 'false'); }
                        if(aiBtn) { aiBtn.classList.add('active'); aiBtn.disabled = true; aiBtn.setAttribute('aria-checked', 'true'); }
                    } else {
                        if(humanBtn) { humanBtn.classList.add('active'); humanBtn.disabled = false; humanBtn.setAttribute('aria-checked', 'true');}
                        if(aiBtn) { aiBtn.classList.remove('active'); aiBtn.disabled = !AI_CONFIG.isEnabled; aiBtn.setAttribute('aria-checked', 'false');}
                    }
                });
            });
        }
        if (startGameBtn) {
            startGameBtn.addEventListener('click', () => {
                const playerData = [];
                let aiSelectedCount = 0;
                for (let i = 0; i < gameSettings.selectedPlayerCount; i++) {
                    const nameInput = document.getElementById(`player-name-${i}`);
                    const playerEntry = document.getElementById(`player-entry-${i}`);
                    const selectedThemeSwatch = playerEntry?.querySelector('.theme-swatch-item.selected');
                    const selectedTypeBtn = playerEntry?.querySelector('.btn-player-type.active');
                    const playerType = isSimulationMode ? 'ai' : (selectedTypeBtn ? selectedTypeBtn.dataset.type : 'human');
                    const theme = selectedThemeSwatch ? selectedThemeSwatch.dataset.colorClass : PLAYER_COLORS[i % PLAYER_COLORS.length];
                    if (playerType === 'ai') aiSelectedCount++;
                    playerData.push({
                        name: nameInput?.value.trim() || `Player ${i + 1}`,
                        colorTheme: theme, type: playerType
                    });
                }
                if (aiSelectedCount > 0 && !GEMINI_API_KEY) {
                     alert("An AI player was selected, but the Gemini API Key is missing or invalid! Please set the key (click the key icon) or choose Human players only.");
                     return;
                }
                gameSettings.timerMinutes = parseFloat(timerInput.value);
                if (isSimulationMode) gameSettings.timerMinutes = 0;
                turnDuration = gameSettings.timerMinutes * 60;
                initGame(playerData);
            });
        }

        Object.values(deckElements).forEach(deckEl => {
            if (deckEl) {
                deckEl.addEventListener('click', (event) => {
                    const player = players[currentPlayerIndex];
                    if (!player || player.type === 'ai' || isSimulationMode || isOverlayVisible() || gameTrulyFinished) return;

                    const targetDeckEl = event.currentTarget;
                    const level = parseInt(targetDeckEl.id.split('-')[1]);

                    if (targetDeckEl.classList.contains('not-selectable') && !(selectedCard && selectedCard.element === targetDeckEl)) {
                        return;
                    }
                    if (targetDeckEl.classList.contains('empty') && !(selectedCard && selectedCard.element === targetDeckEl)) return;

                    handleDeckClick(level);
                });
                deckEl.addEventListener('mouseover', (e) => {
                    const level = parseInt(e.currentTarget.id.split('-')[1]);
                    const count = decks[level] ? decks[level].length : 0;
                    const text = `${count} cards left in Level ${level} deck. Click to reserve from deck.`;
                    showTooltip(e.currentTarget, text);
                });
                deckEl.addEventListener('mouseout', hideTooltip);
            }
        });

        if(endTurnEarlyBtn) {
            const textPlaceholder = endTurnEarlyBtn.querySelector('.btn-text-placeholder');
            if (textPlaceholder && textPlaceholder.textContent.trim() === "") {
                 textPlaceholder.textContent = "End Turn";
            }
            endTurnEarlyBtn.addEventListener('click', () => { handleEndTurnEarly(); });
        }
        if(simulationPauseBtn) {
            simulationPauseBtn.addEventListener('click', () => { toggleSimulationPause(); });
        }

        if(playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                hideOverlays();

                if (gameContainer) {
                    gameContainer.style.opacity = '0';
                    const handleGameFadeOut = () => {
                        gameContainer.removeEventListener('transitionend', handleGameFadeOut);
                        gameContainer.classList.remove('active');
                        gameContainer.classList.add('hidden');
                        document.body.style.alignItems = 'center';
                        document.body.style.justifyContent = 'center';
                        if (setupScreen) {
                            setupScreen.classList.remove('hidden');
                            setupScreen.classList.add('active');
                            setupScreen.style.opacity = '0';
                            requestAnimationFrame(() => {
                                requestAnimationFrame(() => {
                                    setupScreen.style.opacity = '1';
                                });
                            });
                        }
                    };
                    gameContainer.addEventListener('transitionend', handleGameFadeOut);
                } else if (setupScreen) {
                    document.body.style.alignItems = 'center';
                    document.body.style.justifyContent = 'center';
                    setupScreen.classList.remove('hidden');
                    setupScreen.classList.add('active');
                    setupScreen.style.opacity = '1';
                }

                isSimulationMode = false;
                if (simulationModeCheckbox) {
                    simulationModeCheckbox.checked = false;
                    simulationModeCheckbox.dispatchEvent(new Event('change'));
                }
                initializeApiKey();
                updatePlayerCountSelection(4);
                isSimulationPaused = false;
            });
        }

        if (apiKeyIndicatorContainer) {
            apiKeyIndicatorContainer.addEventListener('click', () => {
                if (!GEMINI_API_KEY || apiKeyIcon?.classList.contains('error') || apiKeyIcon?.classList.contains('missing')) {
                    promptForApiKey();
                }
            });
        }
        if (apCancelBtn) {
            apCancelBtn.addEventListener('click', () => { clearActionState();});
        }

        if(logMessagesDiv) logMessagesDiv.setAttribute('aria-live', 'polite');
        if(returnGemsOverlay) { returnGemsOverlay.setAttribute('role', 'dialog'); returnGemsOverlay.setAttribute('aria-modal', 'true'); returnGemsOverlay.setAttribute('aria-labelledby', 'return-gems-title'); const title = returnGemsOverlay.querySelector('h2'); if(title) title.id = 'return-gems-title'; }
        if(gameOverOverlay) { gameOverOverlay.setAttribute('role', 'dialog'); gameOverOverlay.setAttribute('aria-modal', 'true'); gameOverOverlay.setAttribute('aria-labelledby', 'game-over-title'); const title = gameOverOverlay.querySelector('h2'); if(title) title.id = 'game-over-title'; }
        if(nobleChoiceOverlay) { nobleChoiceOverlay.setAttribute('role', 'dialog'); nobleChoiceOverlay.setAttribute('aria-modal', 'true'); nobleChoiceOverlay.setAttribute('aria-labelledby', 'noble-choice-title'); const title = nobleChoiceOverlay.querySelector('h2'); if(title) title.id = 'noble-choice-title'; }
        if(aiThinkingOverlay) { aiThinkingOverlay.setAttribute('role', 'alert'); aiThinkingOverlay.setAttribute('aria-live', 'assertive');}

        document.querySelectorAll('.setup-option label small').forEach((small, index) => {
            const input = small.closest('.setup-option').querySelector('input, select');
            if (input) {
                small.id = `desc-${input.id || 'gen'}-${index}`;
                input.setAttribute('aria-describedby', small.id);
            }
        });
    }

    function renderBank() {
        if (!gemBankContainer) return;
        gemBankContainer.innerHTML = '';
        [...GEM_TYPES, GOLD].forEach(gemType => {
            const count = bank[gemType];
            if (count >= 0) { // Ensure count is not undefined
                const gemEl = createGemElement(gemType, count, true);
                gemEl.dataset.gemType = gemType;

                const ariaLabel = `${count} ${gemType} ${gemType === GOLD ? 'tokens (cannot take directly)' : (count > 0 ? 'tokens available' : 'tokens, none available')}`;
                gemEl.setAttribute('aria-label', ariaLabel);
                if (gemType !== GOLD && count > 0) {
                    gemEl.setAttribute('role', 'button');
                    gemEl.setAttribute('tabindex', '0');
                } else {
                    gemEl.setAttribute('aria-disabled', 'true');
                }

                gemEl.removeEventListener('click', handleGemClickWrapper); // Prevent multiple listeners
                gemEl.addEventListener('click', handleGemClickWrapper);
                gemEl.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleGemClickWrapper(e); } });
                gemEl.addEventListener('mouseover', (e) => showTooltip(e.currentTarget, ariaLabel));
                gemEl.addEventListener('mouseout', hideTooltip);


                if (gemType === GOLD || count <= 0) {
                     gemEl.classList.add('not-selectable');
                }
                gemBankContainer.appendChild(gemEl);
            }
        });
        updateClickableState();
    }

    function renderCards() {
        for (let level = 1; level <= 3; level++) {
            const container = visibleCardsContainers[level];
            if (!container) continue;
            container.innerHTML = ''; // Clear existing cards
            visibleCards[level].forEach((cardData, index) => {
                const cardEl = createCardElement(cardData, level, index);
                if (cardData) {
                    cardEl.dataset.cardId = cardData.id;
                    cardEl.dataset.level = level; // Already set in createCardElement, but good for consistency
                    cardEl.setAttribute('role', 'button');
                    cardEl.setAttribute('tabindex', '0'); // Will be managed by updateClickableState
                    cardEl.setAttribute('aria-label', formatCardAriaLabel(cardData));
                    cardEl.removeEventListener('click', handleVisibleCardClickWrapper); // Prevent multiple listeners
                    cardEl.addEventListener('click', handleVisibleCardClickWrapper);
                    cardEl.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleVisibleCardClickWrapper(e); } });
                } else {
                    cardEl.setAttribute('aria-label', `Empty card slot, level ${level}`);
                }
                container.appendChild(cardEl);
            });
            renderDeckCount(level);
            if(deckElements[level]) { // Ensure deck element exists
                deckElements[level].classList.remove('selected'); // Ensure deck isn't stuck selected
                deckElements[level].setAttribute('aria-label', `${decks[level].length} cards left in Level ${level} deck. Click to reserve from deck.`);
                deckElements[level].setAttribute('role', 'button');
                deckElements[level].setAttribute('tabindex', '0'); // Will be managed by updateClickableState
            }
        }
        updateClickableState(); // Critical to apply initial affordability etc.
    }

    function renderNobles() {
        if (!noblesContainer) return;
        noblesContainer.innerHTML = '';
        if (availableNobles && availableNobles.length > 0) {
            availableNobles.forEach(nobleData => {
                const nobleEl = createNobleElement(nobleData);
                nobleEl.setAttribute('aria-label', formatNobleAriaLabel(nobleData)); // For accessibility
                noblesContainer.appendChild(nobleEl);
            });
        } else {
            noblesContainer.innerHTML = '<p style="color: var(--text-tertiary); font-style: italic;">No patrons available.</p>';
        }
    }

    function renderPlayers() {
        if (!playersAreaContainer) return;
        playersAreaContainer.innerHTML = '';
        players.forEach(player => {
            const playerEl = createPlayerAreaElement(player);
            playersAreaContainer.appendChild(playerEl);
        });
        highlightActivePlayer();
        updateClickableState(); // Update after players are rendered
    }

    function renderPlayerArea(playerId) {
        const player = players.find(p => p.id === playerId);
        const playerAreaEl = document.getElementById(`player-area-${playerId}`);
        if (player && playerAreaEl) {
            // Re-create the content of the player area
            const tempDiv = createPlayerAreaElement(player); // createPlayerAreaElement returns the full div
            playerAreaEl.innerHTML = tempDiv.innerHTML; // Replace inner HTML
            playerAreaEl.className = tempDiv.className; // Update classes if they change

            // Re-attach event listeners for reserved cards as they are re-created
            playerAreaEl.querySelectorAll('.reserved-card-small').forEach(rc => {
                rc.setAttribute('role', 'button'); // Ensure role is set
                rc.setAttribute('tabindex', '0'); // Will be managed by updateClickableState
                rc.removeEventListener('click', handleReservedCardClickWrapper); // Prevent duplicates
                rc.addEventListener('click', handleReservedCardClickWrapper);
                rc.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleReservedCardClickWrapper(e); } });
            });
            highlightActivePlayer(); // Ensure active player highlight is correct
            updateClickableState(); // Update all clickable states
        } else {
            console.error("Could not find player or player area to update:", playerId);
        }
    }

    function renderTimer() {
        if (!timerDisplay) return;
        timerDisplay.classList.remove('active-timer-pulse'); // Reset pulse state

        if (isSimulationMode || gameSettings.timerMinutes <= 0 || turnDuration <= 0) {
            timerDisplay.textContent = "Off";
            timerDisplay.classList.remove('timer-low');
            timerDisplay.setAttribute('aria-label', 'Turn timer is off');
            return;
        }
        const currentPlayer = players[currentPlayerIndex];
        // If game is over, or it's AI's turn (non-sim), or sim is paused, show placeholder
        if (gameTrulyFinished || !currentPlayer || (currentPlayer.type === 'ai' && !isSimulationMode) || (isSimulationMode && isSimulationPaused) ) {
             timerDisplay.textContent = "--:--";
             timerDisplay.classList.remove('timer-low');
             timerDisplay.setAttribute('aria-label', 'Turn timer paused');
             if(currentPlayer && currentPlayer.type === 'ai') stopTimer(); // Stop timer if it's AI's turn
             return;
         }

        // Only add pulse if timer is running and not low
        if (turnTimerInterval && turnTimeRemaining > TIMER_LOW_THRESHOLD) {
            timerDisplay.classList.add('active-timer-pulse');
        }

        const minutes = Math.floor(turnTimeRemaining / 60);
        const seconds = Math.floor(turnTimeRemaining % 60);
        const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        timerDisplay.textContent = timeString;
        timerDisplay.setAttribute('aria-label', `Time remaining: ${minutes} minutes ${seconds} seconds`);

        const isLow = turnTimeRemaining <= TIMER_LOW_THRESHOLD && turnTimeRemaining > 0;
        timerDisplay.classList.toggle('timer-low', isLow);

        // If low, remove active pulse as red pulse takes over
        if (isLow) {
            timerDisplay.classList.remove('active-timer-pulse');
        }
    }

    function renderSelectionInfo() {
        if (!apSelectionText || !apSelectedGemsDisplay || !apCardPreview || !apActionButtons || !apCancelBtn) {
            console.error("Action panel elements not found for renderSelectionInfo");
            return;
        }

        apSelectedGemsDisplay.innerHTML = ''; // Clear previous gems
        apCardPreview.innerHTML = ''; // Clear previous card preview

        // Remove only dynamically added action buttons (not the cancel button)
        const dynamicButtons = apActionButtons.querySelectorAll('button:not(#ap-cancel-btn)');
        dynamicButtons.forEach(btn => btn.remove());

        apCancelBtn.classList.toggle('hidden', !currentAction && !selectedCard && selectedGemTypes.length === 0);


        if (currentAction === 'SELECTING_GEMS' && selectedGemTypes.length > 0) {
            apSelectionText.textContent = 'Selected Gems:';
            selectedGemTypes.forEach(type => {
                const gemEl = createGemElement(type, 1, false); // isBank=false for display
                apSelectedGemsDisplay.appendChild(gemEl);
            });

            const btn = document.createElement('button');
            btn.classList.add('btn'); // Basic btn styling
            const icon = document.createElement('i');
            icon.className = FA_ICONS.takeGemsAction; // Using your FA_ICONS helper
            icon.setAttribute('aria-hidden', 'true');
            btn.appendChild(icon);
            btn.appendChild(document.createTextNode(' Confirm Take Tokens'));
            btn.onclick = () => { performTakeGems(); };

            const isValid = validateTakeGemsSelection();
            btn.disabled = !isValid;
            if (isValid) {
                btn.classList.add('action-possible', 'btn-confirm'); // Highlight if valid
            } else {
                btn.classList.add('btn-secondary'); // Default style if not valid yet
            }
            apActionButtons.insertBefore(btn, apCancelBtn); // Add before cancel button

        } else if (currentAction === 'SELECTING_CARD' && selectedCard) {
            apSelectionText.textContent = selectedCard.type === 'deck' ? 'Selected Deck:' : 'Selected Card:';
            let cardDataToPreview = null;

            if (selectedCard.type === 'visible') {
                cardDataToPreview = getCardById(selectedCard.id);
            } else if (selectedCard.type === 'reserved' && selectedCard.ownerId === currentPlayerIndex) {
                const cPlayer = players[currentPlayerIndex];
                cardDataToPreview = cPlayer.reservedCards.find(c => c.id === selectedCard.id);
            } else if (selectedCard.type === 'deck') {
                cardDataToPreview = getDeckCardPlaceholder(selectedCard.level); // Use placeholder for deck
            }


            if (cardDataToPreview) {
                if (selectedCard.type === 'deck') {
                    const deckPreviewEl = document.createElement('div');
                    deckPreviewEl.classList.add('ap-deck-preview');
                    deckPreviewEl.textContent = `Reserve from Level ${cardDataToPreview.level} Deck`;
                    apCardPreview.appendChild(deckPreviewEl);
                } else if (cardDataToPreview.id && cardDataToPreview.color !== 'deck') { // Ensure it's a real card
                    const previewCardEl = createCardElement(cardDataToPreview, cardDataToPreview.level);
                    previewCardEl.classList.add('ap-previewed-card'); // Special styling for preview
                    apCardPreview.appendChild(previewCardEl);
                } else {
                    apSelectionText.textContent = 'Invalid Card Data for Preview';
                }

                // Add action buttons based on selected card and player state
                const activePlayer = players[currentPlayerIndex];
                const isHumanTurn = activePlayer && activePlayer.type === 'human' && !isSimulationMode && !gameTrulyFinished && !isOverlayVisible();

                if (isHumanTurn) {
                    // Purchase Button (for visible or own reserved card)
                    if ((selectedCard.type === 'visible' || (selectedCard.type === 'reserved' && selectedCard.ownerId === activePlayer.id)) && cardDataToPreview.id && cardDataToPreview.color !== 'deck') {
                        const { canAfford, goldNeeded } = canAffordCard(activePlayer, cardDataToPreview);
                        const purchaseBtn = document.createElement('button');
                        purchaseBtn.classList.add('btn', 'btn-primary');
                        const pIcon = document.createElement('i'); pIcon.className = FA_ICONS.purchaseAction; pIcon.setAttribute('aria-hidden', 'true');
                        purchaseBtn.appendChild(pIcon); purchaseBtn.appendChild(document.createTextNode(' Purchase Card'));
                        purchaseBtn.onclick = () => { performPurchaseCard(); };
                        purchaseBtn.disabled = !canAfford;
                        if (canAfford) {
                            purchaseBtn.classList.add('action-possible');
                        } else {
                            purchaseBtn.setAttribute('aria-label', `Cannot afford card. Need ${goldNeeded} more gold or equivalent gems.`);
                        }
                        apActionButtons.insertBefore(purchaseBtn, apCancelBtn);
                    }

                    // Reserve Button (for visible card or deck)
                    if (selectedCard.type === 'visible' || selectedCard.type === 'deck') {
                        const canReserveCheck = activePlayer.reservedCards.length < MAX_RESERVED_CARDS;
                        const isDeckEmptyForReserve = (selectedCard.type === 'deck' && decks[selectedCard.level].length === 0);
                        const disableReserve = !canReserveCheck || isDeckEmptyForReserve;

                        const reserveBtn = document.createElement('button');
                        reserveBtn.classList.add('btn', 'btn-secondary');
                        const rIcon = document.createElement('i'); rIcon.className = FA_ICONS.flag; rIcon.setAttribute('aria-hidden', 'true');
                        reserveBtn.appendChild(rIcon); reserveBtn.appendChild(document.createTextNode(' Reserve Card'));
                        reserveBtn.onclick = () => { performReserveCard(); };
                        reserveBtn.disabled = disableReserve;

                        if (!disableReserve) {
                            reserveBtn.classList.add('action-possible');
                        } else {
                            if (!canReserveCheck) reserveBtn.setAttribute('aria-label', "Cannot reserve, reservation limit reached (3 cards).");
                            if (isDeckEmptyForReserve) reserveBtn.setAttribute('aria-label', `Cannot reserve, Level ${selectedCard.level} deck is empty.`);
                        }
                        apActionButtons.insertBefore(reserveBtn, apCancelBtn);
                    }
                }
            } else {
                apSelectionText.textContent = 'Invalid Card Selection for Preview';
            }
        } else { // Default state, no action selected
            apSelectionText.textContent = 'Select gems or a card.';
        }
    }


     function renderDeckCount(level) {
        if (deckCounts[level] && deckElements[level]) { // Ensure elements exist
            const count = decks[level].length;
            deckCounts[level].textContent = count;
            deckElements[level].classList.toggle('empty', count === 0);
        }
    }

    function createGemElement(type, count, isBank) {
        const gemEl = document.createElement('div');
        gemEl.classList.add('gem', `gem-${type}`);
        if (isBank) {
            const countEl = document.createElement('span');
            countEl.classList.add('gem-count');
            countEl.textContent = count;
            gemEl.appendChild(countEl);
        } else { // For display purposes, not interactive like bank gems
            gemEl.style.cursor = 'default';
        }
        return gemEl;
    }

    function createCardElement(cardData, level, index = -1) {
        const cardEl = document.createElement('div');
        if (!cardData) {
            cardEl.classList.add('card', 'empty-slot');
            cardEl.textContent = 'Empty';
            cardEl.setAttribute('tabindex', '-1'); // Not focusable
            cardEl.setAttribute('aria-disabled', 'true');
            return cardEl;
        }
        cardEl.classList.add('card', `card-border-${cardData.color}`);
        cardEl.dataset.level = level;
        if (index !== -1) cardEl.dataset.index = index;

        cardEl.setAttribute('role', 'button');
        cardEl.setAttribute('tabindex', '0'); // Initial, updateClickableState will manage
        cardEl.setAttribute('aria-disabled', 'false'); // Initial, updateClickableState will manage

        const topArea = document.createElement('div');
        topArea.classList.add('card-top-area');
        const vpSpan = document.createElement('span');
        vpSpan.classList.add('card-vp');
        vpSpan.textContent = cardData.vp > 0 ? cardData.vp : '';
        const gemBonus = document.createElement('div');
        gemBonus.classList.add('card-gem-bonus', `gem-${cardData.color}`);
        topArea.appendChild(vpSpan);
        topArea.appendChild(gemBonus);
        const centerArea = document.createElement('div');
        centerArea.classList.add('card-center-area');
        const costArea = document.createElement('div');
        costArea.classList.add('card-cost-area');
        GEM_TYPES.forEach(gemType => {
            const cost = cardData.cost[gemType];
            if (cost > 0) {
                const costItem = document.createElement('div');
                costItem.classList.add('cost-item');
                const costDot = document.createElement('span');
                costDot.classList.add('cost-dot', `gem-${gemType}`);
                costItem.appendChild(costDot);
                costItem.appendChild(document.createTextNode(cost));
                costArea.appendChild(costItem);
            }
        });
        cardEl.appendChild(topArea);
        cardEl.appendChild(centerArea);
        cardEl.appendChild(costArea);

        cardEl.addEventListener('mouseover', (e) => showTooltip(e.currentTarget, formatCardCostForTitle(cardData)));
        cardEl.addEventListener('mouseout', hideTooltip);
        return cardEl;
    }

    function createSmallReservedCardElement(cardData) {
        const cardEl = document.createElement('div');
        cardEl.classList.add('reserved-card-small', `card-border-${cardData.color}`);
        cardEl.dataset.cardId = cardData.id;
        cardEl.setAttribute('aria-label', formatCardAriaLabel(cardData));
        // Initial interactive attributes will be managed by updateClickableState

        const topArea = document.createElement('div');
        topArea.classList.add('card-top-area');
        const vpSpan = document.createElement('span');
        vpSpan.classList.add('card-vp');
        vpSpan.textContent = cardData.vp > 0 ? cardData.vp : '';
        const gemBonus = document.createElement('div');
        gemBonus.classList.add('card-gem-bonus', `gem-${cardData.color}`);
        topArea.appendChild(vpSpan);
        topArea.appendChild(gemBonus);
        const costArea = document.createElement('div');
        costArea.classList.add('card-cost-area');
        GEM_TYPES.forEach(gemType => {
            const cost = cardData.cost[gemType];
            if (cost > 0) {
                const costItem = document.createElement('div');
                costItem.classList.add('cost-item');
                const costDot = document.createElement('span');
                costDot.classList.add('cost-dot', `gem-${gemType}`);
                costItem.appendChild(costDot);
                costItem.appendChild(document.createTextNode(cost));
                costArea.appendChild(costItem);
            }
        });
        cardEl.appendChild(topArea);
        cardEl.appendChild(costArea);

        cardEl.addEventListener('mouseover', (e) => showTooltip(e.currentTarget, formatCardCostForTitle(cardData)));
        cardEl.addEventListener('mouseout', hideTooltip);
        return cardEl;
    }

    function formatNobleInfoForTitle(nobleData) {
        let title = `${nobleData.vp} VP - Requires: `;
        const reqParts = [];
        GEM_TYPES.forEach(gemType => {
            const reqCount = nobleData.requirements[gemType];
            if (reqCount > 0) {
                reqParts.push(`${reqCount} ${gemType}`);
            }
        });
        title += reqParts.join(', ') || 'nothing';
        return title;
    }

    function createNobleElement(nobleData) {
        const nobleEl = document.createElement('div');
        nobleEl.classList.add('noble');
        nobleEl.dataset.nobleId = nobleData.id;

        const vpBannerDiv = document.createElement('div');
        vpBannerDiv.classList.add('noble-vp-banner');

        const vpValueSpan = document.createElement('span');
        vpValueSpan.classList.add('noble-vp-value');
        vpValueSpan.textContent = nobleData.vp;
        vpBannerDiv.appendChild(vpValueSpan);

        const vpTextSpan = document.createElement('span');
        vpTextSpan.classList.add('noble-vp-text');
        vpTextSpan.textContent = 'VP';
        vpBannerDiv.appendChild(vpTextSpan);

        nobleEl.appendChild(vpBannerDiv);

        const artworkAreaDiv = document.createElement('div');
        artworkAreaDiv.classList.add('noble-artwork-area');

        const requirementsContainerDiv = document.createElement('div');
        requirementsContainerDiv.classList.add('noble-requirements-container');

        GEM_TYPES.forEach(gemType => {
            const req = nobleData.requirements[gemType];
            if (req > 0) {
                const reqItem = document.createElement('div');
                reqItem.classList.add('req-item');
                reqItem.textContent = req;

                const reqGem = document.createElement('span');
                reqGem.classList.add('req-gem', `gem-${gemType}`);
                reqItem.appendChild(reqGem);

                requirementsContainerDiv.appendChild(reqItem);
            }
        });
        artworkAreaDiv.appendChild(requirementsContainerDiv);
        nobleEl.appendChild(artworkAreaDiv);

        nobleEl.addEventListener('mouseover', (e) => showTooltip(e.currentTarget, formatNobleInfoForTitle(nobleData)));
        nobleEl.addEventListener('mouseout', hideTooltip);
        return nobleEl;
    }


    function createPlayerAreaElement(player) {
        const playerDiv = document.createElement('div');
        playerDiv.classList.add('player-area');
        playerDiv.classList.add(player.colorTheme);
        playerDiv.id = `player-area-${player.id}`;
        playerDiv.setAttribute('aria-label', `${player.name}'s area. Score: ${player.score}.`);

        const header = document.createElement('div');
        header.classList.add('player-header');

        const nameSpan = document.createElement('span');
        nameSpan.classList.add('player-name');
        if (player.type === 'ai') {
            const badgeSpan = document.createElement('span');
            badgeSpan.classList.add('ai-badge');
            const aiIcon = document.createElement('i');
            aiIcon.className = FA_ICONS.aiBadge;
            aiIcon.setAttribute('aria-hidden', 'true');
            badgeSpan.appendChild(aiIcon);
            nameSpan.appendChild(badgeSpan);
        }
        nameSpan.appendChild(document.createTextNode(player.name));

        const scoreSpan = document.createElement('span');
        scoreSpan.classList.add('player-score');
        scoreSpan.textContent = `VP: ${player.score}`;
        header.appendChild(nameSpan);
        header.appendChild(scoreSpan);

        const resourcesDiv = document.createElement('div');
        resourcesDiv.classList.add('player-resources');
        const gemsHeader = document.createElement('h4');
        gemsHeader.textContent = 'Tokens';
        const gemsContainer = document.createElement('div');
        gemsContainer.classList.add('gems-container', 'small-gems');
        let totalNonGoldGems = 0;
        GEM_TYPES.forEach(gemType => {
            const count = player.gems[gemType];
            totalNonGoldGems += count;
            if (count > 0) {
                const gemEl = createGemElement(gemType, count, true);
                gemEl.setAttribute('aria-label', `${count} ${gemType} tokens`);
                 gemEl.addEventListener('mouseover', (e) => showTooltip(e.currentTarget, `${count} ${gemType} tokens`));
                 gemEl.addEventListener('mouseout', hideTooltip);
                gemsContainer.appendChild(gemEl);
            }
        });
        if (player.gems[GOLD] > 0) {
            const goldEl = createGemElement(GOLD, player.gems[GOLD], true);
            goldEl.setAttribute('aria-label', `${player.gems[GOLD]} gold tokens`);
            goldEl.addEventListener('mouseover', (e) => showTooltip(e.currentTarget, `${player.gems[GOLD]} gold tokens`));
            goldEl.addEventListener('mouseout', hideTooltip);
            gemsContainer.appendChild(goldEl);
        }
        const totalGemsSpan = document.createElement('span');
        totalGemsSpan.classList.add('total-gems-indicator');
        const totalGems = totalNonGoldGems + player.gems[GOLD];
        totalGemsSpan.textContent = `Total: ${totalGems}/${MAX_GEMS_PLAYER}`;
        totalGemsSpan.setAttribute('aria-label', `Total tokens: ${totalGems} out of ${MAX_GEMS_PLAYER}. ${totalNonGoldGems} regular tokens, ${player.gems[GOLD]} gold tokens.`);
        if (totalGems > MAX_GEMS_PLAYER) {
             totalGemsSpan.style.color = 'var(--text-error)';
             totalGemsSpan.style.fontWeight = 'bold';
        }
        gemsContainer.appendChild(totalGemsSpan);

        const bonusHeader = document.createElement('h4');
        bonusHeader.textContent = 'Bonuses';
        const bonusContainer = document.createElement('div');
        bonusContainer.classList.add('player-bonuses-display');
        let hasBonuses = false;
        GEM_TYPES.forEach(gemType => {
            const count = player.bonuses[gemType];
            if (count > 0) {
                hasBonuses = true;
                const bonusEl = document.createElement('div');
                bonusEl.classList.add('player-card-count', `gem-${gemType}`);
                bonusEl.textContent = count;
                bonusEl.setAttribute('aria-label', `${count} ${gemType} bonus`);
                bonusEl.addEventListener('mouseover', (e) => showTooltip(e.currentTarget, `${count} ${gemType} bonus from purchased cards`));
                bonusEl.addEventListener('mouseout', hideTooltip);
                bonusContainer.appendChild(bonusEl);
            }
        });
        if (!hasBonuses) bonusContainer.innerHTML = '<span class="no-items" aria-label="No bonuses">None</span>';

        const reservedHeader = document.createElement('h4');
        reservedHeader.textContent = `Reserved (${player.reservedCards.length}/${MAX_RESERVED_CARDS})`;
        const reservedContainer = document.createElement('div');
        reservedContainer.classList.add('reserved-cards-container');
        if (player.reservedCards.length > 0) {
            player.reservedCards.forEach(cardData => {
                const reservedCardEl = createSmallReservedCardElement(cardData);
                // Event listeners for reserved cards are (re-)attached in renderPlayerArea or after initial setup
                reservedContainer.appendChild(reservedCardEl);
            });
        } else {
            reservedContainer.innerHTML = '<span class="no-items" aria-label="No cards reserved">None reserved</span>';
            reservedContainer.style.textAlign = 'center';
        }

        const noblesHeader = document.createElement('h4');
        noblesHeader.textContent = `Nobles (${player.nobles.length})`;
        const playerNoblesContainer = document.createElement('div');
        playerNoblesContainer.classList.add('nobles-container', 'player-nobles-display');
        if (player.nobles.length > 0) {
             player.nobles.forEach(nobleData => {
                const nobleEl = createNobleElement(nobleData);
                playerNoblesContainer.appendChild(nobleEl);
             });
        } else {
            playerNoblesContainer.innerHTML = '<span class="no-items" aria-label="No nobles acquired">None</span>';
             playerNoblesContainer.style.textAlign = 'center';
        }

        resourcesDiv.appendChild(gemsHeader);
        resourcesDiv.appendChild(gemsContainer);
        resourcesDiv.appendChild(bonusHeader);
        resourcesDiv.appendChild(bonusContainer);
        resourcesDiv.appendChild(reservedHeader);
        resourcesDiv.appendChild(reservedContainer);
        resourcesDiv.appendChild(noblesHeader);
        resourcesDiv.appendChild(playerNoblesContainer);

        playerDiv.appendChild(header);
        playerDiv.appendChild(resourcesDiv);
        return playerDiv;
    }

     function handleGemClickWrapper(event) {
        const player = players[currentPlayerIndex];
         if (!player || player.type === 'ai' || isSimulationMode || isOverlayVisible() || gameTrulyFinished) return;
        const gemEl = event.currentTarget;

        const gemType = gemEl.dataset.gemType;
         if (!isGemClickable(gemType, gemEl.classList.contains('selected'))) {
             if (!gemEl.classList.contains('selected')) return;
         }
        handleGemClick(gemType, gemEl);
    }

    function handleVisibleCardClickWrapper(event) {
        const player = players[currentPlayerIndex];
        if (!player || player.type === 'ai' || isSimulationMode || isOverlayVisible() || gameTrulyFinished) return;

        const cardEl = event.currentTarget;
        if (cardEl.classList.contains('empty-slot')) return;
        if (cardEl.classList.contains('not-selectable') && !(selectedCard && selectedCard.element === cardEl)) return;

        const cardId = cardEl.dataset.cardId;
        const level = parseInt(cardEl.dataset.level, 10);

        if (cardId && !isNaN(level)) {
           handleCardClick('visible', level, cardId, cardEl);
        }
    }

    function handleReservedCardClickWrapper(event) {
        const player = players[currentPlayerIndex];
        if (!player || player.type === 'ai' || isSimulationMode || isOverlayVisible() || gameTrulyFinished) return;

        const cardEl = event.currentTarget;
        if (cardEl.classList.contains('not-selectable') && !(selectedCard && selectedCard.element === cardEl)) {
            return;
        }

        const cardId = cardEl.dataset.cardId;
        if (cardId) {
            handleReservedCardClick(cardId, cardEl);
        }
    }

    function handleGemClick(gemType, clickedGemEl) {
        if (gemType === GOLD) return;

        if (currentAction === 'SELECTING_CARD' && selectedCard) {
            clearCardSelectionState();
        }
        currentAction = 'SELECTING_GEMS';

        const countOfThisGemInSelection = selectedGemTypes.filter(g => g === gemType).length;
        const isCurrentlyAPairOfThisType = selectedGemTypes.length === 2 && selectedGemTypes[0] === gemType && selectedGemTypes[1] === gemType;
        const isCurrentlyASingleOfThisType = selectedGemTypes.length === 1 && selectedGemTypes[0] === gemType;

        if (isCurrentlyAPairOfThisType) {
            selectedGemTypes = [];
        }
        else if (isCurrentlyASingleOfThisType && bank[gemType] >= MIN_GEMS_FOR_TAKE_TWO) {
            selectedGemTypes.push(gemType);
        }
        else if (selectedGemTypes.includes(gemType)) {
            const index = selectedGemTypes.indexOf(gemType);
            if (index > -1) {
                selectedGemTypes.splice(index, 1);
            }
        }
        else {
            if (selectedGemTypes.length < 3) {
                if (selectedGemTypes.length === 2 && selectedGemTypes[0] === selectedGemTypes[1]) {
                    // Do nothing, can't add to an existing pair of two.
                }
                else if (bank[gemType] >= 1) {
                    selectedGemTypes.push(gemType);
                }
            }
        }

        if (selectedGemTypes.length === 0) {
            currentAction = null;
        }

        gemBankContainer.querySelectorAll('.gem').forEach(el => el.classList.remove('selected'));

        if (selectedGemTypes.length === 2 && selectedGemTypes[0] === selectedGemTypes[1]) {
            const pairType = selectedGemTypes[0];
            const bankGemToMark = gemBankContainer.querySelector(`.gem[data-gem-type='${pairType}']`);
            if (bankGemToMark) bankGemToMark.classList.add('selected');
        } else {
            const uniqueTypesToMark = new Set(selectedGemTypes);
            uniqueTypesToMark.forEach(type => {
                const bankGemToMark = gemBankContainer.querySelector(`.gem[data-gem-type='${type}']`);
                if (bankGemToMark) bankGemToMark.classList.add('selected');
            });
        }

        renderSelectionInfo();
        updateClickableState();
    }


    function handleCardClick(type, level, cardId, cardEl) {
        if (currentAction === 'SELECTING_GEMS' && selectedGemTypes.length > 0) {
            clearGemSelectionState();
        }
        currentAction = 'SELECTING_CARD';

        if (selectedCard && selectedCard.element === cardEl) { // Clicked same card again
            clearActionState(); // Deselect everything
            return;
        }

        // Clear previous card selection visuals if any
        if (selectedCard && selectedCard.element) {
            selectedCard.element.classList.remove('selected');
            selectedCard.element.setAttribute('aria-pressed', 'false');
        }

        selectedCard = { type, level, id: cardId, element: cardEl };
        cardEl.classList.add('selected');
        cardEl.setAttribute('aria-pressed', 'true');

        renderSelectionInfo();
        updateClickableState();
    }

    function handleDeckClick(level) {
        const deckEl = deckElements[level];
        if (!deckEl || deckEl.classList.contains('empty')) return; // Can't select empty deck

        if (currentAction === 'SELECTING_GEMS' && selectedGemTypes.length > 0) {
            clearGemSelectionState();
        }
        currentAction = 'SELECTING_CARD';

        if (selectedCard && selectedCard.element === deckEl) { // Clicked same deck again
            clearActionState(); // Deselect everything
            return;
        }

        const player = players[currentPlayerIndex];
        if (!player) return;

        // Check if reservation is possible (only for reservation action, purchase not from deck)
        if (player.reservedCards.length >= MAX_RESERVED_CARDS) {
            // updateLog("Reserve limit reached (3). Cannot select deck for reservation.");
            // Don't immediately return, allow selection for UI, but reserve button will be disabled
        }

        if (selectedCard && selectedCard.element) { // Clear previous card/deck selection
            selectedCard.element.classList.remove('selected');
            selectedCard.element.setAttribute('aria-pressed', 'false');
        }

        const deckId = `deck-${level}`;
        selectedCard = { type: 'deck', level, id: deckId, element: deckEl };
        deckEl.classList.add('selected');
        deckEl.setAttribute('aria-pressed', 'true');

        renderSelectionInfo();
        updateClickableState();
    }

    function handleReservedCardClick(cardId, cardEl) {
        if (currentAction === 'SELECTING_GEMS' && selectedGemTypes.length > 0) {
            clearGemSelectionState();
        }
        currentAction = 'SELECTING_CARD';

        if (selectedCard && selectedCard.element === cardEl) { // Clicked same reserved card again
            clearActionState(); // Deselect everything
            return;
        }

        const playerArea = cardEl.closest('.player-area');
        if (!playerArea) return;
        const ownerId = parseInt(playerArea.id.split('-')[2], 10);
        const ownerPlayer = players.find(p => p.id === ownerId);
        if (!ownerPlayer) return;

        const cardData = ownerPlayer.reservedCards.find(c => c.id === cardId);
        if (!cardData) {
            renderPlayerArea(ownerId); // Card might have been purchased, re-render area
            return;
        }

        if (selectedCard && selectedCard.element) { // Clear previous selection
            selectedCard.element.classList.remove('selected');
            selectedCard.element.setAttribute('aria-pressed', 'false');
        }

        selectedCard = { type: 'reserved', level: cardData.level, id: cardId, element: cardEl, ownerId: ownerId };

        // Visually clear other selections on board/decks
        document.querySelectorAll('.card.selected, .deck.selected').forEach(el => {
            el.classList.remove('selected');
            el.setAttribute('aria-pressed', 'false');
        });
        // And other reserved cards
        document.querySelectorAll('.reserved-card-small.selected').forEach(el => {
            if (el !== cardEl) {
                el.classList.remove('selected');
                el.setAttribute('aria-pressed', 'false');
            }
        });

        cardEl.classList.add('selected');
        cardEl.setAttribute('aria-pressed', 'true');

        renderSelectionInfo();
        updateClickableState();
    }

    function handleEndTurnEarly() {
        if (gameTrulyFinished || isSimulationMode || isOverlayVisible()) return;
        const player = players[currentPlayerIndex];
        if (!player || player.type === 'ai') return;
        if (currentAction) {
            const actionCancelled = currentAction.replace('SELECTING_','').toLowerCase();
            clearActionState(); updateLog(`Player ${player.name} cancelled ${actionCancelled} selection and ended turn.`);
            logActionToHistory(player, 'CANCEL_&_PASS', { cancelledAction: actionCancelled });
        } else {
            updateLog(`Player ${player.name} passed the turn.`);
            logActionToHistory(player, 'PASS', {});
        }
        endTurn('PASSED');
    }

    function toggleSimulationPause() {
         if (!isSimulationMode) return;
         isSimulationPaused = !isSimulationPaused;
         const iconEl = simulationPauseBtn.querySelector('i');
         const textEl = simulationPauseBtn.querySelector('.btn-text-placeholder');

         if (isSimulationPaused) {
             if (iconEl) iconEl.className = FA_ICONS.play;
             if (textEl) textEl.textContent = "Resume Sim";
             if(simulationStatusSpan) simulationStatusSpan.textContent = "Paused";
             updateLog("Simulation paused."); stopTimer(); updateClickableState();
         } else {
             if (iconEl) iconEl.className = FA_ICONS.pause;
             if (textEl) textEl.textContent = "Pause Sim";
             if(simulationStatusSpan) simulationStatusSpan.textContent = "Running";
             updateLog("Simulation resumed."); updateClickableState();
             if (!isOverlayVisible() && !gameTrulyFinished) setTimeout(startTurn, 0);
         }
    }

    function validateTakeGemsSelection() {
        const gems = selectedGemTypes;
        const count = gems.length;
        const uniqueCount = new Set(gems).size;

        if (count === 0) return false;
        if (count === 3 && uniqueCount === 3) return gems.every(type => bank[type] >= 1);
        if (count === 2 && uniqueCount === 1) return bank[gems[0]] >= MIN_GEMS_FOR_TAKE_TWO;
        if (count === 2 && uniqueCount === 2) return gems.every(type => bank[type] >= 1);
        if (count === 1) return bank[gems[0]] >= 1; // Allow taking 1 gem if available

        return false;
    }

    function performTakeGems() {
        if (!validateTakeGemsSelection()) {
            updateLog("Invalid gem selection. Action cancelled.");
            clearActionState();
            return;
        }
        const player = players[currentPlayerIndex];
        const gemsTakenLog = {};

        player.stats.gemTakeActions++;
        if (selectedGemTypes.length === 2 && new Set(selectedGemTypes).size === 1) {
            player.stats.take2Actions++;
        } else if (selectedGemTypes.length === 3 && new Set(selectedGemTypes).size === 3) {
            player.stats.take3Actions++;
        }

        const fromElements = selectedGemTypes.map(type => gemBankContainer.querySelector(`.gem[data-gem-type="${type}"]`)).filter(el => el);
        const playerGemsArea = document.querySelector(`#player-area-${player.id} .gems-container`);

        animateGemTransfer([...selectedGemTypes], fromElements, playerGemsArea, false);

        selectedGemTypes.forEach(type => {
            if (bank[type] > 0) {
                bank[type]--;
                player.gems[type]++;
                gemsTakenLog[type] = (gemsTakenLog[type] || 0) + 1;
                player.stats.gemsTaken[type]++;
            } else {
                updateLog(`Error: Bank empty for ${type}! Action may be incomplete.`);
                clearActionState();
                renderBank();
                renderPlayerArea(player.id);
                endTurn('TAKE_GEMS_ERROR');
                return;
            }
        });
        const gemString = Object.entries(gemsTakenLog).map(([t, c]) => `${c} ${t}`).join(', ');
        updateLog(`${player.name} (${player.type.toUpperCase()}) took ${gemString}.`);
        logActionToHistory(player, 'TAKE_GEMS', { gems: [...selectedGemTypes] });
        clearActionState();
        renderBank();
        renderPlayerArea(player.id);
        endTurn('TAKE_GEMS');
    }

    function performReserveCard() {
        if (!selectedCard || (selectedCard.type !== 'visible' && selectedCard.type !== 'deck')) { updateLog("No valid card or deck selected to reserve."); clearActionState(); return; }
        const player = players[currentPlayerIndex];
        if (player.reservedCards.length >= MAX_RESERVED_CARDS) { updateLog("Cannot reserve: Reservation limit reached (3)."); clearActionState(); return; }

        let reservedCardData = null; let cardSourceDescription = ""; let cardSourceType = selectedCard.type;
        const level = selectedCard.level; let cardReplaced = false;

        if (selectedCard.type === 'deck') {
            if (decks[level].length > 0) { reservedCardData = decks[level].pop(); cardSourceDescription = `from L${level} deck`; player.stats.deckReservations[level]++; }
            else { updateLog(`Cannot reserve: Level ${level} deck is empty.`); clearActionState(); renderCards(); return; }
        } else { // 'visible' card
            const cardId = selectedCard.id; const cardIndex = visibleCards[level].findIndex(c => c && c.id === cardId);
            if (cardIndex !== -1 && visibleCards[level][cardIndex]) {
                reservedCardData = visibleCards[level][cardIndex]; cardSourceDescription = `L${level} ${reservedCardData.color} from board`;
                player.stats.boardReservations[level]++; visibleCards[level][cardIndex] = null; drawCard(level, cardIndex); cardReplaced = true;
            } else { updateLog("Cannot reserve: Selected card is no longer available."); clearActionState(); renderCards(); return; }
        }

        player.reservedCards.push(reservedCardData); player.stats.reserveActions++;
        player.stats.cardsReservedTotalCount++; player.stats.allReservedCardsData.push(JSON.parse(JSON.stringify(reservedCardData)));

        let gotGold = false;
        if (bank[GOLD] > 0) { player.gems[GOLD]++; bank[GOLD]--; gotGold = true; player.stats.goldTaken++;
            const goldBankEl = gemBankContainer.querySelector('.gem-gold');
            const playerGoldArea = document.querySelector(`#player-area-${player.id} .gems-container`);
            if (goldBankEl && playerGoldArea) animateGemTransfer([GOLD], [goldBankEl], playerGoldArea, false);
        }

        updateLog(`${player.name} (${player.type.toUpperCase()}) reserved ${cardSourceDescription}${gotGold ? " and took 1 gold." : "."}`);
        logActionToHistory(player, 'RESERVE_CARD', { cardId: reservedCardData.id, source: cardSourceType, level: reservedCardData.level, color: reservedCardData.color, gotGold: gotGold });
        clearActionState(); if (gotGold) renderBank(); if (!cardReplaced) renderDeckCount(level); // drawCard calls renderDeckCount internally
        renderPlayerArea(player.id); endTurn('RESERVE');
    }

    function performPurchaseCard() {
        if (!selectedCard || (selectedCard.type !== 'visible' && selectedCard.type !== 'reserved')) { updateLog("No valid card selected to purchase."); clearActionState(); return; }
        const player = players[currentPlayerIndex]; const cardId = selectedCard.id;
        let purchasedCardData = null; let cardSource = selectedCard.type; let cardIndexInSource = -1; let isFromReserve = (cardSource === 'reserved');

        if (cardSource === 'visible') {
            cardIndexInSource = visibleCards[selectedCard.level]?.findIndex(c => c && c.id === cardId);
            if (cardIndexInSource !== -1) purchasedCardData = visibleCards[selectedCard.level][cardIndexInSource];
        } else { // 'reserved'
            if (selectedCard.ownerId !== player.id) { updateLog("Cannot purchase reserved card of another player."); clearActionState(); return; }
            cardIndexInSource = player.reservedCards.findIndex(c => c.id === cardId);
            if (cardIndexInSource !== -1) purchasedCardData = player.reservedCards[cardIndexInSource];
        }

        if (!purchasedCardData) { updateLog("Cannot purchase: Card not found or unavailable."); clearActionState(); renderCards(); renderPlayerArea(player.id); return; }
        const { canAfford, goldNeeded, effectiveCost } = canAffordCard(player, purchasedCardData);
        if (!canAfford) { updateLog(`Cannot purchase: Not enough resources. Need ${goldNeeded} more gold or equivalent gems.`); return; }

        const playerGemsArea = document.querySelector(`#player-area-${player.id} .gems-container`);
        const gemsToAnimateToBank = []; const goldToAnimateToBank = [];

        let goldSpent_this_turn = 0; let gemsSpent_this_turn = { white: 0, blue: 0, green: 0, red: 0, black: 0 }; let totalResourceCost = 0; let paymentError = false;
        GEM_TYPES.forEach(gemType => {
             if (paymentError) return; const costToPay = effectiveCost[gemType]; totalResourceCost += costToPay;
            const playerHas = player.gems[gemType]; const useFromPlayerGems = Math.min(costToPay, playerHas); const needsGoldForThisColor = costToPay - useFromPlayerGems;
            if (useFromPlayerGems > 0) {
                player.gems[gemType] -= useFromPlayerGems; bank[gemType] += useFromPlayerGems; gemsSpent_this_turn[gemType] += useFromPlayerGems;
                for(let k=0; k<useFromPlayerGems; k++) gemsToAnimateToBank.push(gemType);
            }
            if (needsGoldForThisColor > 0) {
                if (player.gems[GOLD] >= needsGoldForThisColor) {
                    player.gems[GOLD] -= needsGoldForThisColor; bank[GOLD] += needsGoldForThisColor; goldSpent_this_turn += needsGoldForThisColor;
                    for(let k=0; k<needsGoldForThisColor; k++) goldToAnimateToBank.push(GOLD);
                } else paymentError = true;
            }
        });

        if (gemsToAnimateToBank.length > 0) {
            const bankGemElements = gemsToAnimateToBank.map(type => gemBankContainer.querySelector(`.gem[data-gem-type="${type}"]`)).filter(el => el);
            animateGemTransfer(gemsToAnimateToBank, playerGemsArea, bankGemElements, true);
        }
        if (goldToAnimateToBank.length > 0) {
            const goldBankEl = gemBankContainer.querySelector('.gem-gold');
            if(goldBankEl) animateGemTransfer(goldToAnimateToBank, playerGemsArea, [goldBankEl], true);
        }

        if (paymentError) { updateLog("Error during payment calculation. Action cancelled."); renderBank(); renderPlayerArea(player.id); clearActionState(); return; }

        player.cards.push(purchasedCardData); player.score += purchasedCardData.vp; player.bonuses[purchasedCardData.color]++;
        player.stats.purchaseActions++; player.stats.cardsPurchasedCount++; player.stats.cardsPurchasedByLevel[purchasedCardData.level]++; player.stats.cardsPurchasedByColor[purchasedCardData.color]++;
        if (isFromReserve) player.stats.purchasedFromReserveCount++; else player.stats.purchasedFromBoardCount++;
        if (totalResourceCost === 0) player.stats.selfSufficientPurchases++; player.stats.goldSpent += goldSpent_this_turn;
        GEM_TYPES.forEach(type => player.stats.gemsSpent[type] += gemsSpent_this_turn[type]);
        if (player.stats.firstCardPurchasedTurn[purchasedCardData.level] === null) player.stats.firstCardPurchasedTurn[purchasedCardData.level] = turnNumber;

        if (cardSource === 'visible') {
            visibleCards[purchasedCardData.level][cardIndexInSource] = null;
            drawCard(purchasedCardData.level, cardIndexInSource); // This will render the new card
        } else { // From reserve
             player.reservedCards.splice(cardIndexInSource, 1);
        }
        updateLog(`${player.name} (${player.type.toUpperCase()}) purchased L${purchasedCardData.level} ${purchasedCardData.color} card${isFromReserve ? ' (from reserve)' : ''}${goldSpent_this_turn > 0 ? ` (used ${goldSpent_this_turn} gold)` : ''}.`);
        logActionToHistory(player, 'PURCHASE_CARD', { cardId: purchasedCardData.id, source: cardSource, level: purchasedCardData.level, color: purchasedCardData.color, vp: purchasedCardData.vp, costPaid: JSON.parse(JSON.stringify(gemsSpent_this_turn)), goldUsed: goldSpent_this_turn });
        clearActionState(); renderBank(); // renderCards is handled by drawCard if applicable
        renderPlayerArea(player.id); endTurn('PURCHASE');
    }

    function handleConfirmReturnGems(player, gemsToReturnCount, callback) {
        const selectedElements = returnGemsPlayerDisplay.querySelectorAll('.gem.selected[data-return-gem-type]');
        if (selectedElements.length !== gemsToReturnCount) { updateLog(`Please select exactly ${gemsToReturnCount} non-gold tokens to return.`); return; }
        executeReturnGems(player, selectedElements, callback);
    }

     function executeReturnGems(player, gemsElementsToReturn, callback) {
        const returnedCounts = {}; const returnedGemTypes = [];
        const playerGemsArea = document.querySelector(`#player-area-${player.id} .gems-container`);
        const gemTypesToAnimate = [];

        gemsElementsToReturn.forEach(gemEl => {
            const type = gemEl.dataset.returnGemType;
            gemTypesToAnimate.push(type);
            if (type && player.gems[type] > 0) {
                player.gems[type]--; bank[type]++; returnedCounts[type] = (returnedCounts[type] || 0) + 1;
                returnedGemTypes.push(type); player.stats.gemsReturnedOverLimit[type]++;
            }
        });

        if (gemTypesToAnimate.length > 0) {
            const bankGemElements = gemTypesToAnimate.map(type => gemBankContainer.querySelector(`.gem[data-gem-type="${type}"]`)).filter(el => el);
            animateGemTransfer(gemTypesToAnimate, playerGemsArea, bankGemElements, true);
        }

        const returnString = Object.entries(returnedCounts).map(([type, count]) => `${count} ${type}`).join(', ');
        updateLog(`Player ${player.name} (${player.type.toUpperCase()}) returned ${returnString}.`);
        logActionToHistory(player, 'RETURN_GEMS', { returnedGems: returnedCounts });
        returnGemsOverlay.classList.add('hidden'); renderBank(); renderPlayerArea(player.id);
        if (callback) callback();
     }

    function awardNoble(player, nobleData) {
         const nobleIndex = availableNobles.findIndex(n => n.id === nobleData.id);
         if (nobleIndex === -1) { updateLog(`Noble ${nobleData.id} was no longer available for ${player.name}.`); return false; }

        const originalNobleEl = noblesContainer.querySelector(`.noble[data-noble-id="${nobleData.id}"]`);
        const playerNoblesArea = document.querySelector(`#player-area-${player.id} .player-nobles-display`);

        if (originalNobleEl && playerNoblesArea) {
            const nobleClone = originalNobleEl.cloneNode(true);
            nobleClone.style.position = 'fixed';
            nobleClone.style.zIndex = '1900';
            nobleClone.style.transition = 'transform 0.7s ease-in-out, opacity 0.5s 0.2s ease-in-out';

            const startRect = originalNobleEl.getBoundingClientRect();
            nobleClone.style.left = `${startRect.left + window.scrollX}px`;
            nobleClone.style.top = `${startRect.top + window.scrollY}px`;
            nobleClone.style.width = `${startRect.width}px`;
            nobleClone.style.height = `${startRect.height}px`;
            document.body.appendChild(nobleClone);

            originalNobleEl.style.opacity = '0'; // Hide original immediately

            requestAnimationFrame(() => { // Ensure clone is rendered before animating
                const endRect = playerNoblesArea.getBoundingClientRect();
                // Adjust target to be visually centered better if playerNoblesArea is large
                const targetX = endRect.left + (endRect.width / 2) - (startRect.width * 0.7 / 2) + window.scrollX;
                const targetY = endRect.top + (endRect.height / 2) - (startRect.height * 0.7 / 2) + window.scrollY;

                nobleClone.style.transform = `translate(${targetX - (startRect.left + window.scrollX)}px, ${targetY - (startRect.top + window.scrollY)}px) scale(0.7)`;
                nobleClone.style.opacity = '0';
            });

            nobleClone.addEventListener('transitionend', () => {
                nobleClone.remove();
                // Actual game state update happens after animation
                updateLog(`Noble (${nobleData.vp} VP) visits Player ${player.name} (${player.type.toUpperCase()}).`);
                player.nobles.push(nobleData); player.score += nobleData.vp; player.stats.noblesAcquiredTurn[nobleData.id] = turnNumber;
                availableNobles.splice(nobleIndex, 1);
                logActionToHistory(player, 'NOBLE_VISIT', { nobleId: nobleData.id, vp: nobleData.vp });
                renderNobles();
                renderPlayerArea(player.id);
            }, { once: true });
            return true; // Indicates animation started
        } else { // Fallback if elements not found for animation
            updateLog(`Noble (${nobleData.vp} VP) visits Player ${player.name} (${player.type.toUpperCase()}).`);
            player.nobles.push(nobleData); player.score += nobleData.vp; player.stats.noblesAcquiredTurn[nobleData.id] = turnNumber;
            availableNobles.splice(nobleIndex, 1);
            logActionToHistory(player, 'NOBLE_VISIT', { nobleId: nobleData.id, vp: nobleData.vp });
            renderNobles();
            renderPlayerArea(player.id);
            return true; // Indicates awarded directly
        }
    }

    async function handleAiTurn() {
        if (gameTrulyFinished || (isSimulationMode && isSimulationPaused)) return;
        const player = players[currentPlayerIndex];
        if (!player || player.type !== 'ai') return;
        if (!AI_CONFIG.isEnabled || !GEMINI_API_KEY) { executeFallbackAiAction(getGameStateForAI()); return; }
        aiActionCounter++; showAiThinking(player.name); updateClickableState();
        let validatedAction = null; let attempts = 0; const MAX_INVALID_ATTEMPTS = 2;
        while (!validatedAction && attempts < MAX_INVALID_ATTEMPTS) {
            attempts++;
            try {
                const gameState = getGameStateForAI(); const prompt = createPromptForGemini(gameState);
                if (AI_CONFIG.logPrompts && attempts === 1) console.log(`[AI Prompt - ${player.name} Turn ${turnNumber}]:\n`, prompt);
                const aiSuggestedAction = await fetchGeminiActionDirect(prompt);
                if (aiSuggestedAction) {
                    validatedAction = validateAiAction(aiSuggestedAction, gameState);
                     if (!validatedAction) { updateLog(`AI ${player.name} proposed invalid action (Attempt ${attempts}). Re-thinking...`); await new Promise(resolve => setTimeout(resolve, 100)); }
                } else { updateLog(`AI ${player.name} failed to get action from API (Attempt ${attempts}).`); break; }
            } catch (error) { updateLog(`Error during AI ${player.name}'s turn attempt ${attempts}.`); break; }
        }
        hideAiThinking();
        if (validatedAction) executeAiAction(validatedAction);
        else { updateLog(`AI ${player.name} failed to provide valid action. Executing fallback.`); executeFallbackAiAction(getGameStateForAI()); }
    }

    function getGameStateForAI() {
        const currentPlayer = players[currentPlayerIndex];
        const opponents = players.filter(p => p.id !== currentPlayerIndex).map(p => ({
                id: p.id, name: p.name, type: p.type, score: p.score,
                gems: JSON.parse(JSON.stringify(p.gems)), bonuses: JSON.parse(JSON.stringify(p.bonuses)),
                reservedCards: p.reservedCards.map(card => JSON.parse(JSON.stringify(card))),
                reservedCardCount: p.reservedCards.length, purchasedCardCount: p.cards.length,
                nobles: p.nobles.map(noble => JSON.parse(JSON.stringify(noble))),
            }));
        const visibleCardsCopy = { 1: [], 2: [], 3: [] };
        for (let level = 1; level <= 3; level++) visibleCardsCopy[level] = visibleCards[level].map(card => card ? JSON.parse(JSON.stringify(card)) : null);
        const availableNoblesCopy = availableNobles.map(noble => JSON.parse(JSON.stringify(noble)));
        return {
            gameSettings: { ...gameSettings, playerCount: gameSettings.playerCount },
            rules: { MAX_GEMS_PLAYER, MAX_RESERVED_CARDS, WINNING_SCORE, MIN_GEMS_FOR_TAKE_TWO, CARDS_PER_LEVEL_VISIBLE },
            turnInfo: { turnNumber, currentPlayerIndex, isFinalRound: isGameOverConditionMet, lastRoundPlayerIndex },
            currentPlayer: { id: currentPlayer.id, name: currentPlayer.name, type: currentPlayer.type, score: currentPlayer.score,
                 gems: JSON.parse(JSON.stringify(currentPlayer.gems)), bonuses: JSON.parse(JSON.stringify(currentPlayer.bonuses)),
                 reservedCards: currentPlayer.reservedCards.map(card => JSON.parse(JSON.stringify(card))), nobles: currentPlayer.nobles.map(noble => JSON.parse(JSON.stringify(noble))) },
            opponents: opponents, bank: { ...bank }, visibleCards: visibleCardsCopy,
            deckCounts: { 1: decks[1].length, 2: decks[2].length, 3: decks[3].length },
            availableNobles: availableNoblesCopy, gameHistory: JSON.parse(JSON.stringify(gameHistoryLog))
        };
    }

    function getValidActionHints(gameState) {
        const hints = { canTake3Different: false, canTake2Same: [], canReserve: gameState.currentPlayer.reservedCards.length < MAX_RESERVED_CARDS, canPurchaseVisible: [], canPurchaseReserved: [], canReserveFromDeck: { 1: false, 2: false, 3: false }, };
        const player = gameState.currentPlayer; const availableSingleGems = GEM_TYPES.filter(g => gameState.bank[g] >= 1);
        if (availableSingleGems.length >= 3) hints.canTake3Different = true;
        GEM_TYPES.forEach(g => { if (gameState.bank[g] >= MIN_GEMS_FOR_TAKE_TWO) hints.canTake2Same.push(g); });
        if (hints.canReserve) { for (let level = 1; level <= 3; level++) if (gameState.deckCounts[level] > 0) hints.canReserveFromDeck[level] = true; }
        const currentRealPlayer = players[currentPlayerIndex]; // Use actual player for canAffordCard
        if (currentRealPlayer) {
            for (let level = 1; level <= 3; level++) gameState.visibleCards[level].forEach(card => { if (card) { const { canAfford } = canAffordCard(currentRealPlayer, card); if (canAfford) hints.canPurchaseVisible.push({ cardId: card.id, level: card.level, color: card.color, vp: card.vp }); } });
            currentRealPlayer.reservedCards.forEach(card => { if (card) { const { canAfford } = canAffordCard(currentRealPlayer, card); if (canAfford) hints.canPurchaseReserved.push({ cardId: card.id, level: card.level, color: card.color, vp: card.vp }); } });
        }
        return hints;
    }

    function createPromptForGemini(gameState) {
        const validHints = getValidActionHints(gameState);
        return `
You are a world-champion-level Splendor AI. Your goal is to win decisively by selecting the absolute optimal move based on the provided game state, history, and valid action hints.
**Internal Thinking Process (Perform these steps before deciding):**
1. Analyze Self: Your score, resources, goals. 2. Analyze Opponents: Their state, threats, potential moves. 3. Analyze Board: Card values, affordability, blocking opportunities. 4. Analyze Nobles: Your progress vs. opponent progress. 5. Analyze History: Recent actions (patterns, targets). 6. Review Valid Actions (Hints below): Consider the *possible* moves identified. If taking gems, which specific combo is best? If purchasing, which specific card? If reserving, which card/deck? 7. Evaluate Actions: Mentally simulate outcomes. 8. Select Optimal Move: Choose the single BEST action. Prioritize valid moves suggested below, but use your strategic judgment if reserving or taking different gems seems superior despite not being explicitly listed as 'affordable purchase'.
**Current Game State:**
* Turn: ${gameState.turnInfo.turnNumber} * You are Player ${gameState.currentPlayer.id} (${gameState.currentPlayer.name}) * Winning Score: ${gameState.rules.WINNING_SCORE} VP * Final Round Active: ${gameState.turnInfo.isFinalRound} * Bank: ${JSON.stringify(gameState.bank)} * Deck Counts: L1: ${gameState.deckCounts[1]}, L2: ${gameState.deckCounts[2]}, L3: ${gameState.deckCounts[3]} * Available Nobles: ${JSON.stringify(gameState.availableNobles)} * Visible Cards: L3: ${JSON.stringify(gameState.visibleCards[3])} | L2: ${JSON.stringify(gameState.visibleCards[2])} | L1: ${JSON.stringify(gameState.visibleCards[1])}
**Your Hand (Player ${gameState.currentPlayer.id} - ${gameState.currentPlayer.name}):**
* Score: ${gameState.currentPlayer.score} VP * Gems: ${JSON.stringify(gameState.currentPlayer.gems)} * Bonuses: ${JSON.stringify(gameState.currentPlayer.bonuses)} * Reserved Cards (${gameState.currentPlayer.reservedCards.length}/${gameState.rules.MAX_RESERVED_CARDS}): ${JSON.stringify(gameState.currentPlayer.reservedCards)} * Acquired Nobles: ${JSON.stringify(gameState.currentPlayer.nobles)}
**Opponents:** ${JSON.stringify(gameState.opponents)}
**Game History (Last ~15 Actions):**
${JSON.stringify(gameState.gameHistory.slice(-15))} ${gameState.gameHistory.length > 15 ? `\n...(truncated, ${gameState.gameHistory.length} total actions)`: ''}
**VALID ACTION HINTS (Based on Current State):**
* Take 3 Different Gems Possible: ${validHints.canTake3Different} * Take 2 Same Color Gems Possible: [${validHints.canTake2Same.join(', ')}] (Requires Bank >= ${MIN_GEMS_FOR_TAKE_TWO}) * Can Reserve (Limit < ${MAX_RESERVED_CARDS}): ${validHints.canReserve} * Reserve from Deck L1 Possible: ${validHints.canReserveFromDeck[1]} * Reserve from Deck L2 Possible: ${validHints.canReserveFromDeck[2]} * Reserve from Deck L3 Possible: ${validHints.canReserveFromDeck[3]} * Affordable Visible Cards: ${JSON.stringify(validHints.canPurchaseVisible)} * Affordable Reserved Cards: ${JSON.stringify(validHints.canPurchaseReserved)}
**Required Output Format (JSON ONLY):**
CRITICAL: Your response MUST be ONLY the raw JSON object for your chosen action. NO extra text, NO markdown \`\`\`. Choose ONE format:
1. {"action":"TAKE_GEMS","gems":["color1","color2","color3"]} 2. {"action":"TAKE_GEMS","gems":["color","color"]} 3. {"action":"RESERVE_CARD","source":"visible","cardId":"card-id-string"} 4. {"action":"RESERVE_CARD","source":"deck","level":level_number} 5. {"action":"PURCHASE_CARD","source":"visible","cardId":"card-id-string"} 6. {"action":"PURCHASE_CARD","source":"reserved","cardId":"card-id-string"}
Based on your analysis and the valid hints, provide ONLY the single JSON object for your optimal action.`;
    }

    async function fetchGeminiActionDirect(prompt) {
        if (!AI_CONFIG.isEnabled || !GEMINI_API_KEY) return null;
        const requestBody = { contents: [{ parts: [{ text: prompt }] }], }; const fullUrl = `${GEMINI_API_URL}${GEMINI_API_KEY}`;
        for (let i = 0; i <= AI_CONFIG.maxRetries; i++) {
            try {
                const controller = new AbortController(); const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.requestTimeoutMs);
                const response = await fetch(fullUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody), signal: controller.signal });
                clearTimeout(timeoutId);
                if (!response.ok) { const errorBody = await response.text(); console.error(`Gemini API Error ${response.status}: ${errorBody}`); throw new Error(`API Error (${response.status}): ${response.statusText}`); }
                const data = await response.json(); if (AI_CONFIG.logResponses) console.log("AI Response Raw:", JSON.stringify(data, null, 2));
                if (data.candidates && data.candidates[0]?.content?.parts?.[0]) {
                    const responseText = data.candidates[0].content.parts[0].text;
                    try {
                        const cleanedResponse = responseText.replace(/^```json\s*|```$/g, '').trim(); const actionJson = JSON.parse(cleanedResponse);
                        if (AI_CONFIG.logResponses) console.log("Parsed AI JSON:", actionJson); if (actionJson && typeof actionJson === 'object') return actionJson; else throw new Error("Parsed JSON is not a valid object.");
                    } catch (parseError) { console.error("Failed to parse AI response JSON:", parseError, "\nRaw Text:", responseText); return null; }
                } else if (data.promptFeedback?.blockReason) { console.error("Gemini Prompt Blocked:", data.promptFeedback.blockReason, data.promptFeedback.safetyRatings); updateLog(`AI Error: Prompt blocked by safety filters (${data.promptFeedback.blockReason}).`); return null; }
                else { console.error("Unexpected Gemini API response structure:", data); throw new Error("Unexpected API response structure"); }
            } catch (error) {
                 if (error.name === 'AbortError') console.error(`AI API Call timed out after ${AI_CONFIG.requestTimeoutMs}ms (Attempt ${i + 1})`); else console.error(`Error fetching AI action (Attempt ${i + 1}):`, error);
                if (i === AI_CONFIG.maxRetries) { updateLog(`AI Error: Max retries reached for API call.`); return null; }
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
        return null;
    }

    function validateAiAction(action, gameState) {
        const player = gameState.currentPlayer; // This is the AI player's state from gameState
        try {
            switch (action.action) {
                case 'TAKE_GEMS':
                    if (!action.gems || !Array.isArray(action.gems) || action.gems.length === 0) return null;
                    const gemCount = action.gems.length; const uniqueGems = new Set(action.gems);
                    if (!action.gems.every(g => GEM_TYPES.includes(g))) return null; // Invalid gem type

                    if (gemCount === 3) { if (uniqueGems.size !== 3 || !action.gems.every(g => gameState.bank[g] >= 1)) return null; }
                    else if (gemCount === 2) {
                        if (uniqueGems.size === 1) { if (gameState.bank[action.gems[0]] < MIN_GEMS_FOR_TAKE_TWO) return null; }
                        else if (uniqueGems.size === 2) { if (!action.gems.every(g => gameState.bank[g] >=1)) return null;}
                        else return null; // Must be 1 or 2 unique types if count is 2
                    } else if (gemCount === 1) { if(gameState.bank[action.gems[0]] < 1) return null; }
                    else return null; // Only 1, 2, or 3 gems can be taken
                    return action;
                case 'RESERVE_CARD':
                     if (player.reservedCards.length >= MAX_RESERVED_CARDS || !action.source || (action.source !== 'visible' && action.source !== 'deck')) return null;
                     if (action.source === 'visible') { if (!action.cardId || !Object.values(gameState.visibleCards).flat().some(c => c && c.id === action.cardId)) return null; }
                     else { /* source === 'deck' */ if (!action.level || ![1, 2, 3].includes(action.level) || gameState.deckCounts[action.level] <= 0) return null; }
                     return action;
                case 'PURCHASE_CARD':
                    if (!action.source || (action.source !== 'visible' && action.source !== 'reserved') || !action.cardId) return null;
                    let cardToPurchase = (action.source === 'visible')
                        ? Object.values(gameState.visibleCards).flat().find(c => c && c.id === action.cardId)
                        : player.reservedCards.find(c => c.id === action.cardId);
                    if (!cardToPurchase) return null;
                    // For canAffordCard, we need bonuses which are part of the player object within gameState
                    if (!canAffordCard({ gems: player.gems, bonuses: player.bonuses }, cardToPurchase).canAfford) return null;
                    return action;
                default: return null;
            }
        } catch (validationError) { console.error("Error during AI action validation:", validationError, "Action:", action); return null; }
    }

    function executeAiAction(action) {
        const player = players[currentPlayerIndex]; // The actual current player object
        switch (action.action) {
            case 'TAKE_GEMS': selectedGemTypes = action.gems; performTakeGems(); break;
            case 'RESERVE_CARD':
                if (action.source === 'visible') {
                     const cardElement = document.querySelector(`.card[data-card-id='${action.cardId}']`);
                     if (cardElement) { const level = parseInt(cardElement.dataset.level, 10); selectedCard = { type: 'visible', level: level, id: action.cardId, element: cardElement }; performReserveCard(); } else { updateLog(`AI ${player.name} tried to reserve non-existent visible card ${action.cardId}. Fallback.`); executeFallbackAiAction(getGameStateForAI()); }
                } else { /* source === 'deck' */
                     const deckElement = deckElements[action.level]; if (deckElement) { selectedCard = { type: 'deck', level: action.level, id: `deck-${action.level}`, element: deckElement }; performReserveCard(); } else { updateLog(`AI ${player.name} tried to reserve from invalid deck L${action.level}. Fallback.`); executeFallbackAiAction(getGameStateForAI()); }
                } break;
            case 'PURCHASE_CARD':
                 let cardElementToPurchase = null; let cardDataToPurchase = null;
                 if (action.source === 'visible') {
                    cardElementToPurchase = document.querySelector(`.card[data-card-id='${action.cardId}']`);
                    if (cardElementToPurchase) { cardDataToPurchase = getCardById(action.cardId); if (cardDataToPurchase) { selectedCard = { type: 'visible', level: cardDataToPurchase.level, id: action.cardId, element: cardElementToPurchase }; performPurchaseCard(); } else { updateLog(`AI ${player.name} tried to purchase card ${action.cardId} with no data. Fallback.`); executeFallbackAiAction(getGameStateForAI());} } else { updateLog(`AI ${player.name} tried to purchase non-existent visible card ${action.cardId}. Fallback.`); executeFallbackAiAction(getGameStateForAI()); }
                 } else { /* source === 'reserved' */
                      cardDataToPurchase = player.reservedCards.find(c => c.id === action.cardId); cardElementToPurchase = document.querySelector(`#player-area-${player.id} .reserved-card-small[data-card-id='${action.cardId}']`);
                      if (cardDataToPurchase && cardElementToPurchase) { selectedCard = { type: 'reserved', level: cardDataToPurchase.level, id: action.cardId, element: cardElementToPurchase, ownerId: player.id }; performPurchaseCard(); } else { updateLog(`AI ${player.name} tried to purchase non-existent/invalid reserved card ${action.cardId}. Fallback.`); executeFallbackAiAction(getGameStateForAI());}
                 } break;
            default: updateLog(`AI ${player.name} provided unknown action type: ${action.action}. Fallback.`); executeFallbackAiAction(getGameStateForAI());
        }
    }

    function executeFallbackAiAction(gameState) {
        const player = players[currentPlayerIndex]; updateLog(`AI ${player.name} executing fallback action.`);
        let cheapestCard = null; let minCost = Infinity;
        const checkCardAffordability = (card, source) => { if (!card) return; const { canAfford, effectiveCost } = canAffordCard(player, card); if (canAfford) { const totalCost = Object.values(effectiveCost).reduce((sum, c) => sum + c, 0); const costMetric = totalCost - (card.vp * 0.1); if (costMetric < minCost) { minCost = costMetric; cheapestCard = { ...card, source: source }; } } };
        Object.values(visibleCards).flat().forEach(card => checkCardAffordability(card, 'visible')); player.reservedCards.forEach(card => checkCardAffordability(card, 'reserved'));
        if (cheapestCard) { updateLog(`AI Fallback: Purchasing cheapest card ${cheapestCard.id}`); const cardElement = cheapestCard.source === 'visible' ? document.querySelector(`.card[data-card-id='${cheapestCard.id}']`) : document.querySelector(`#player-area-${player.id} .reserved-card-small[data-card-id='${cheapestCard.id}']`); if (cardElement) { selectedCard = { type: cheapestCard.source, level: cheapestCard.level, id: cheapestCard.id, element: cardElement, ownerId: cheapestCard.source === 'reserved' ? player.id : undefined }; performPurchaseCard(); return; } }
        const availableTypes = GEM_TYPES.filter(g => bank[g] > 0); if (availableTypes.length >= 3) { selectedGemTypes = availableTypes.slice(0, 3); updateLog(`AI Fallback: Taking 3 gems: ${selectedGemTypes.join(', ')}`); performTakeGems(); return; }
        const takeTwoType = GEM_TYPES.find(g => bank[g] >= MIN_GEMS_FOR_TAKE_TWO); if (takeTwoType) { selectedGemTypes = [takeTwoType, takeTwoType]; updateLog(`AI Fallback: Taking 2 ${takeTwoType} gems.`); performTakeGems(); return; }
        if (player.reservedCards.length < MAX_RESERVED_CARDS) { const l1Visible = visibleCards[1].find(c => c !== null); if (l1Visible) { const cardElement = document.querySelector(`.card[data-card-id='${l1Visible.id}']`); if (cardElement) { updateLog(`AI Fallback: Reserving L1 card ${l1Visible.id}`); selectedCard = { type: 'visible', level: 1, id: l1Visible.id, element: cardElement }; performReserveCard(); return; } } else if (decks[1].length > 0) { updateLog(`AI Fallback: Reserving from L1 deck.`); const deckElement = deckElements[1]; selectedCard = { type: 'deck', level: 1, id: `deck-1`, element: deckElement }; performReserveCard(); return; } }
        updateLog(`AI Fallback: No valid fallback action found. Passing turn.`); logActionToHistory(player, 'FALLBACK_PASS', {}); endTurn('FALLBACK_PASS');
    }

    async function handleAiReturnGems(player, currentTotalGems, gemsToReturnCount, callback) {
        showAiThinking(`${player.name} (Returning Gems)`); updateClickableState(); const nonGoldGemsOwned = {}; let nonGoldGemElements = [];
        GEM_TYPES.forEach(type => { if (player.gems[type] > 0) { nonGoldGemsOwned[type] = player.gems[type]; for (let i = 0; i < player.gems[type]; i++) { const dummyEl = document.createElement('div'); dummyEl.dataset.returnGemType = type; nonGoldGemElements.push(dummyEl); } } });
        if (nonGoldGemElements.length < gemsToReturnCount) { updateLog(`AI ${player.name} has ${currentTotalGems} tokens but cannot return required ${gemsToReturnCount} non-gold. Continuing turn.`); hideAiThinking(); if (callback) callback(); return; }
        try {
            const gameState = getGameStateForAI(); const prompt = `You are the Splendor AI Player ${player.name}. You MUST return exactly ${gemsToReturnCount} non-gold gems (limit ${MAX_GEMS_PLAYER}, you have ${currentTotalGems}). Your non-gold gems: ${JSON.stringify(nonGoldGemsOwned)}. Game state/history provided. Choose OPTIMAL gems to return. Respond ONLY with JSON: { "return": ["color1", ...] } Example: { "return": ["white", "blue"] } Ensure exactly ${gemsToReturnCount} gems. \n${JSON.stringify(gameState, null, 2)}`;
            if (AI_CONFIG.logPrompts) console.log(`[AI Return Gems Prompt - ${player.name}]:\n`, prompt);
            const aiResponse = await fetchGeminiActionDirect(prompt); let validatedChoice = null;
            if (aiResponse?.return) { validatedChoice = validateAiReturnGems(aiResponse.return, nonGoldGemsOwned, gemsToReturnCount); if (!validatedChoice) updateLog(`AI ${player.name} proposed invalid return choice. Using fallback.`); } else updateLog(`AI ${player.name} failed to get return choice from API. Using fallback.`);
            if (validatedChoice) {
                let elementsToReturn = []; let tempOwned = {...nonGoldGemsOwned};
                 for (const typeToReturn of validatedChoice) { if(tempOwned[typeToReturn] > 0) { const el = nonGoldGemElements.find(e => e.dataset.returnGemType === typeToReturn); if(el) { elementsToReturn.push(el); nonGoldGemElements.splice(nonGoldGemElements.indexOf(el), 1); tempOwned[typeToReturn]--; } } }
                 if(elementsToReturn.length === gemsToReturnCount) executeReturnGems(player, elementsToReturn, callback); else executeFallbackReturnGems(player, nonGoldGemsOwned, gemsToReturnCount, callback);
            } else executeFallbackReturnGems(player, nonGoldGemsOwned, gemsToReturnCount, callback);
        } catch (error) { console.error(`Error during AI gem return for ${player.name}:`, error); updateLog(`Error during AI ${player.name}'s gem return. Using fallback.`); executeFallbackReturnGems(player, nonGoldGemsOwned, gemsToReturnCount, callback);
        } finally { setTimeout(hideAiThinking, AI_CONFIG.thinkingIndicatorDelayMs / 2); }
    }

     function validateAiReturnGems(chosenGems, ownedNonGold, countNeeded) {
         if (!Array.isArray(chosenGems) || chosenGems.length !== countNeeded) return null; let tempOwned = { ...ownedNonGold };
         for (const gem of chosenGems) { if (!GEM_TYPES.includes(gem) || gem === GOLD || !tempOwned[gem] || tempOwned[gem] <= 0) return null; tempOwned[gem]--; } return chosenGems;
     }

     function executeFallbackReturnGems(player, ownedNonGold, countNeeded, callback) {
          updateLog(`AI ${player.name} executing fallback gem return.`); let gemsToReturn = []; let availableToReturn = [];
         GEM_TYPES.forEach(type => { for (let i = 0; i < (ownedNonGold[type] || 0); i++) availableToReturn.push(type); });
          const counts = availableToReturn.reduce((acc, type) => { acc[type] = (acc[type] || 0) + 1; return acc; }, {}); availableToReturn.sort((a, b) => counts[b] - counts[a]); // Prioritize returning most common
          gemsToReturn = availableToReturn.slice(0, countNeeded); let elementsToReturn = []; let tempOwned = {...ownedNonGold};
           for (const typeToReturn of gemsToReturn) { if(tempOwned[typeToReturn] > 0) { const dummyEl = document.createElement('div'); dummyEl.dataset.returnGemType = typeToReturn; elementsToReturn.push(dummyEl); tempOwned[typeToReturn]--; } }
           if (elementsToReturn.length === countNeeded) executeReturnGems(player, elementsToReturn, callback); else { updateLog(`AI ${player.name} CRITICAL FALLBACK ERROR: Could not determine gems to return. Continuing turn.`); if(callback) callback(); }
     }

    async function handleAiNobleChoice(player, eligibleNobles, callback) {
         showAiThinking(`${player.name} (Choosing Noble)`); updateClickableState();
         try {
             const gameState = getGameStateForAI(); const prompt = `You are the Splendor AI Player ${player.name}. You MUST choose ONE noble. Eligible Nobles: ${JSON.stringify(eligibleNobles)}. Game state/history provided. Choose the OPTIMAL noble. Respond ONLY with JSON: { "nobleId": "noble-id-string" } Example: { "nobleId": "noble-5" } Ensure ID is from eligible list. \n${JSON.stringify(gameState, null, 2)}`;
             if (AI_CONFIG.logPrompts) console.log(`[AI Noble Choice Prompt - ${player.name}]:\n`, prompt);
             const aiResponse = await fetchGeminiActionDirect(prompt); let validatedChoiceId = null;
             if (aiResponse?.nobleId) { validatedChoiceId = validateAiNobleChoice(aiResponse.nobleId, eligibleNobles); if (!validatedChoiceId) updateLog(`AI ${player.name} proposed invalid noble choice. Using fallback.`); } else updateLog(`AI ${player.name} failed to get noble choice from API. Using fallback.`);
             let chosenNoble = validatedChoiceId ? eligibleNobles.find(n => n.id === validatedChoiceId) : null;
             if (!chosenNoble && eligibleNobles.length > 0) { eligibleNobles.sort((a, b) => b.vp - a.vp); chosenNoble = eligibleNobles[0]; updateLog(`AI ${player.name} executing fallback noble choice (Highest VP).`); }
             if (chosenNoble && awardNoble(player, chosenNoble)) { /* State updated by awardNoble */ }
         } catch (error) {
             console.error(`Error during AI noble choice for ${player.name}:`, error); updateLog(`Error during AI ${player.name}'s noble choice. Using fallback.`);
              let fallbackNoble = null; if (eligibleNobles.length > 0) { eligibleNobles.sort((a, b) => b.vp - a.vp); fallbackNoble = eligibleNobles[0]; if (fallbackNoble && awardNoble(player, fallbackNoble)){ /* State updated by awardNoble */ } }
         } finally { setTimeout(hideAiThinking, AI_CONFIG.thinkingIndicatorDelayMs / 2); if (callback) callback(); }
     }

     function validateAiNobleChoice(chosenNobleId, eligibleNobles) {
         if (!chosenNobleId) return null; const isValid = eligibleNobles.some(n => n.id === chosenNobleId); return isValid ? chosenNobleId : null;
     }

    function startTurn() {
        if (gameTrulyFinished) return;
        highlightActivePlayer(); clearActionState(); const currentPlayer = players[currentPlayerIndex];
        if (isSimulationMode && isSimulationPaused) return;
        if (!isSimulationMode && currentPlayer.type === 'human' && endTurnEarlyBtn) endTurnEarlyBtn.classList.remove('hidden');
        else if (endTurnEarlyBtn) endTurnEarlyBtn.classList.add('hidden');
        if (currentPlayer.type === 'ai') {
            const delay = isSimulationMode ? simulationTurnDelayMs : AI_CONFIG.thinkingIndicatorDelayMs / 3;
            stopTimer(); renderTimer(); updateClickableState(); setTimeout(() => { if (isSimulationMode && isSimulationPaused) return; handleAiTurn(); }, delay);
        } else { startTimer(); updateClickableState(); }
    }

    function endTurn(actionType = 'UNKNOWN') {
        stopTimer();
        const player = players[currentPlayerIndex];
        const playerIndexOfTurnCompleted = currentPlayerIndex;

        console.log(`ENDING TURN FOR: Player ${playerIndexOfTurnCompleted} (${player.name}). Action: ${actionType}. Turn: ${turnNumber}. Score: ${player.score}`);

        player.stats.turnsTaken++;
        const currentNonGoldGems = GEM_TYPES.reduce((sum, type) => sum + player.gems[type], 0);
        const currentGoldGems = player.gems[GOLD] || 0;
        const currentTotalGems = currentNonGoldGems + currentGoldGems;
        player.stats.peakGemsHeld = Math.max(player.stats.peakGemsHeld, currentTotalGems);
        if (currentTotalGems === MAX_GEMS_PLAYER) player.stats.turnsEndedExactLimit++;
        else if (currentTotalGems < MAX_GEMS_PLAYER) player.stats.turnsEndedBelowLimit++;

        checkForNobleVisit(player, () => {
            checkForGemLimit(player, () => {
                const scoreJustReachedWinning = player.score >= WINNING_SCORE;
                if (scoreJustReachedWinning && player.stats.turnReached15VP === null) {
                    player.stats.turnReached15VP = turnNumber;
                }

                const gameEndTriggeredThisTurn = checkAndSetGameOverCondition(player);
                if (gameEndTriggeredThisTurn) {
                    player.stats.triggeredGameEnd = true;
                }

                if (isGameOverConditionMet && playerIndexOfTurnCompleted === lastRoundPlayerIndex) {
                    updateLog(`--- Final Turn Completed by ${player.name} ---`);
                    endGame();
                    return;
                }

                currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
                if (currentPlayerIndex === 0 && !isGameOverConditionMet) {
                    turnNumber++;
                }
                console.log(`END TURN COMPLETE. Next is Player ${currentPlayerIndex} (${players[currentPlayerIndex].name}). Turn: ${turnNumber}. Final Round: ${isGameOverConditionMet}`);


                if (!gameTrulyFinished) {
                    updateLog(`Player ${players[currentPlayerIndex].name}'s turn (#${turnNumber}).`);
                    if (isSimulationMode && !isSimulationPaused) {
                        setTimeout(startTurn, 0);
                    } else if (!isSimulationMode) {
                        startTurn();
                    }
                } else {
                    updateClickableState();
                }
            });
        });
    }

    function checkAndSetGameOverCondition(player) {
        if (!isGameOverConditionMet && player.score >= WINNING_SCORE) {
            isGameOverConditionMet = true;
            lastRoundPlayerIndex = (currentPlayerIndex - 1 + gameSettings.playerCount) % gameSettings.playerCount;
            updateLog(`--- Player ${player.name} (${player.type.toUpperCase()}) reached ${player.score} VP! Final round begins. Game ends after Player ${players[lastRoundPlayerIndex].name} completes their turn. ---`);
            return true;
        }
        return false;
    }

    function checkForNobleVisit(player, callback) {
        const eligibleNobles = availableNobles.filter(noble => GEM_TYPES.every(gemType => (player.bonuses[gemType] || 0) >= (noble.requirements[gemType] || 0)));
        if (eligibleNobles.length === 0) { if (callback) callback(); }
        else if (eligibleNobles.length === 1) { if (awardNoble(player, eligibleNobles[0])) { /* State updated after animation */ } if (callback) callback(); }
        else { if (player.type === 'human') { updateLog(`Player ${player.name} qualifies for multiple nobles. Choose one.`); showNobleChoiceOverlay(player, eligibleNobles, callback); } else handleAiNobleChoice(player, eligibleNobles, callback); }
    }

    function showNobleChoiceOverlay(player, eligibleNobles, callback) {
        if (!nobleChoiceOptionsContainer || !nobleChoiceOverlay || !confirmNobleChoiceBtn) return;

        nobleChoiceOptionsContainer.innerHTML = '';
        confirmNobleChoiceBtn.disabled = true;
        let selectedNobleForChoice = null;

        eligibleNobles.forEach(nobleData => {
            const nobleEl = createNobleElement(nobleData);
            nobleEl.classList.add('clickable');
            nobleEl.dataset.nobleId = nobleData.id;
            nobleEl.setAttribute('role', 'radio');
            nobleEl.setAttribute('tabindex', '0');
            nobleEl.setAttribute('aria-checked', 'false');
            nobleEl.setAttribute('aria-label', `Choose Noble: ${formatNobleAriaLabel(nobleData)}`);


            const selectNoble = () => {
                nobleChoiceOptionsContainer.querySelectorAll('.noble.selected-for-choice').forEach(n => {
                    n.classList.remove('selected-for-choice');
                    n.setAttribute('aria-checked', 'false');
                });
                nobleEl.classList.add('selected-for-choice');
                nobleEl.setAttribute('aria-checked', 'true');
                selectedNobleForChoice = nobleData;
                confirmNobleChoiceBtn.disabled = false;
            };

            nobleEl.onclick = selectNoble;
            nobleEl.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') selectNoble(); };
            nobleChoiceOptionsContainer.appendChild(nobleEl);
        });

        confirmNobleChoiceBtn.onclick = () => {
            if (selectedNobleForChoice) {
                handleNobleChoice(player, selectedNobleForChoice, callback);
            }
        };

        nobleChoiceOverlay.classList.remove('hidden');
        requestAnimationFrame(() => {
            nobleChoiceOverlay.style.opacity = '1';
            if(nobleChoiceOverlay.querySelector('.modal-content')) nobleChoiceOverlay.querySelector('.modal-content').style.transform = 'scale(1)';
        });
        updateClickableState();
    }

    function handleNobleChoice(player, chosenNoble, callback) {
        if (nobleChoiceOverlay) nobleChoiceOverlay.classList.add('hidden');
        if (awardNoble(player, chosenNoble)) { /* State updated by awardNoble */ }
        if (callback) callback();
        updateClickableState();
    }

    function checkForGemLimit(player, callback) {
        const nonGoldGems = GEM_TYPES.reduce((sum, type) => sum + player.gems[type], 0);
        const goldGems = player.gems[GOLD] || 0; const totalGems = nonGoldGems + goldGems;
        if (totalGems > MAX_GEMS_PLAYER) {
            const excessGems = totalGems - MAX_GEMS_PLAYER; const actualGemsToReturn = Math.min(excessGems, nonGoldGems);
            if (actualGemsToReturn > 0) { updateLog(`Player ${player.name} (${player.type.toUpperCase()}) has ${totalGems} total tokens (limit ${MAX_GEMS_PLAYER}). Must return ${actualGemsToReturn} non-gold tokens.`);
                 if (player.type === 'human') showReturnGemsOverlay(player, totalGems, actualGemsToReturn, callback); else handleAiReturnGems(player, totalGems, actualGemsToReturn, callback);
            } else { updateLog(`Player ${player.name} (${player.type.toUpperCase()}) has ${totalGems} total tokens, but cannot return required ${excessGems} non-gold tokens.`); if (callback) callback(); }
        } else { if (callback) callback(); }
    }

    function showReturnGemsOverlay(player, currentTotalGems, gemsToReturnCount, callback) {
        if(!returnGemsOverlay || !returnGemsCountSpan || !returnGemsNeededSpan || !returnGemsPlayerDisplay || !confirmReturnGemsBtn || !returnGemsSelectionDisplay) return;
        returnGemsCountSpan.textContent = `${currentTotalGems} / ${MAX_GEMS_PLAYER}`; returnGemsNeededSpan.textContent = gemsToReturnCount;
        returnGemsPlayerDisplay.innerHTML = '';
        GEM_TYPES.forEach(type => {
            for (let i = 0; i < player.gems[type]; i++) {
                const gemEl = createGemElement(type, 1, false);
                gemEl.classList.add('clickable');
                gemEl.dataset.returnGemType = type;
                gemEl.setAttribute('role', 'checkbox');
                gemEl.setAttribute('aria-checked', 'false');
                gemEl.setAttribute('tabindex', '0');
                gemEl.setAttribute('aria-label', `Select one ${type} token to return`);
                gemEl.onclick = () => { toggleReturnGemSelection(gemEl, gemsToReturnCount); };
                gemEl.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { toggleReturnGemSelection(gemEl, gemsToReturnCount); } };
                returnGemsPlayerDisplay.appendChild(gemEl);
            }
        });
        if (player.gems.gold > 0) { const goldEl = createGemElement(GOLD, player.gems.gold, true); goldEl.style.cssText = 'opacity:0.5; cursor:not-allowed; margin-left:10px; width:25px; height:25px;'; goldEl.setAttribute('aria-label', "Gold tokens cannot be returned"); if (goldEl.querySelector('.gem-count')) goldEl.querySelector('.gem-count').style.fontSize = '0.7em'; returnGemsPlayerDisplay.appendChild(goldEl); }
        confirmReturnGemsBtn.disabled = true; confirmReturnGemsBtn.classList.remove('btn-primary'); confirmReturnGemsBtn.classList.add('btn-confirm');
        returnGemsSelectionDisplay.textContent = `Selected to return: 0 / ${gemsToReturnCount}`;
        confirmReturnGemsBtn.onclick = () => { handleConfirmReturnGems(player, gemsToReturnCount, callback); updateClickableState(); };

        returnGemsOverlay.classList.remove('hidden');
        requestAnimationFrame(() => {
            returnGemsOverlay.style.opacity = '1';
            if(returnGemsOverlay.querySelector('.modal-content')) returnGemsOverlay.querySelector('.modal-content').style.transform = 'scale(1)';
        });
        updateClickableState();
    }

    function toggleReturnGemSelection(gemEl, gemsToReturnCount) {
        gemEl.classList.toggle('selected');
        gemEl.setAttribute('aria-checked', gemEl.classList.contains('selected') ? 'true' : 'false');
        const selectedElements = returnGemsPlayerDisplay.querySelectorAll('.gem.selected[data-return-gem-type]');
        const selectedCount = selectedElements.length;
        returnGemsSelectionDisplay.textContent = `Selected to return: ${selectedCount}/${gemsToReturnCount}`;
        confirmReturnGemsBtn.disabled = selectedCount !== gemsToReturnCount;
    }

    function endGame() {
        gameTrulyFinished = true;
        console.log("GAME OVER - endGame() function called. Calculating winner and displaying detailed stats...");
        updateLog("--- GAME OVER ---"); stopTimer(); hideOverlays(); clearActionState(); isSimulationPaused = true;
        const sortedPlayers = [...players].sort((a, b) => { if (b.score !== a.score) return b.score - a.score; return a.cards.length - b.cards.length; });
        let winners = []; if (sortedPlayers.length > 0) { const topScore = sortedPlayers[0].score; const potentialWinners = sortedPlayers.filter(p => p.score === topScore); if (potentialWinners.length === 1) winners = potentialWinners; else { const minCards = Math.min(...potentialWinners.map(p => p.cards.length)); winners = potentialWinners.filter(p => p.cards.length === minCards); } }
        if (finalScoresDiv) finalScoresDiv.innerHTML = '';
        sortedPlayers.forEach((p, index) => {
            const rank = index + 1; const isWinner = winners.some(w => w.id === p.id); const playerStats = p.stats;
            const vpFromCards = p.cards.reduce((sum, card) => sum + card.vp, 0); const vpFromNobles = p.nobles.reduce((sum, noble) => sum + noble.vp, 0);
            const avgVpPerTurn = playerStats.turnsTaken > 0 ? (p.score / playerStats.turnsTaken).toFixed(2) : 'N/A'; const avgVpPerCard = playerStats.cardsPurchasedCount > 0 ? (vpFromCards / playerStats.cardsPurchasedCount).toFixed(2) : 'N/A';
            const reservationSuccessRate = playerStats.cardsReservedTotalCount > 0 ? ((playerStats.purchasedFromReserveCount / playerStats.cardsReservedTotalCount) * 100).toFixed(1) : '0.0'; const totalBonuses = Object.values(p.bonuses).reduce((s, c) => s + c, 0);
            const avgBonusPerCard = playerStats.cardsPurchasedCount > 0 ? (totalBonuses / playerStats.cardsPurchasedCount).toFixed(2) : 'N/A'; const totalGemsTaken = Object.values(playerStats.gemsTaken).reduce((s, c) => s + c, 0);
            const totalGemTakeActions = playerStats.take2Actions + playerStats.take3Actions; const avgGemsPerTakeAction = totalGemTakeActions > 0 ? (totalGemsTaken / totalGemTakeActions).toFixed(2) : 'N/A';
            const percentTake3 = totalGemTakeActions > 0 ? ((playerStats.take3Actions / totalGemTakeActions) * 100).toFixed(1) : 'N/A'; const percentTake2 = totalGemTakeActions > 0 ? ((playerStats.take2Actions / totalGemTakeActions) * 100).toFixed(1) : 'N/A';
            const totalGemsSpent = Object.values(playerStats.gemsSpent).reduce((s, c) => s + c, 0); const totalSpending = totalGemsSpent + playerStats.goldSpent; const goldDependency = totalSpending > 0 ? ((playerStats.goldSpent / totalSpending) * 100).toFixed(1) : '0.0';
            const totalGemsReturned = Object.values(playerStats.gemsReturnedOverLimit).reduce((s, c) => s + c, 0); const totalActions = playerStats.gemTakeActions + playerStats.purchaseActions + playerStats.reserveActions;
            const actionDist = { gem: totalActions > 0 ? ((playerStats.gemTakeActions / totalActions) * 100).toFixed(1) : 'N/A', purchase: totalActions > 0 ? ((playerStats.purchaseActions / totalActions) * 100).toFixed(1) : 'N/A', reserve: totalActions > 0 ? ((playerStats.reserveActions / totalActions) * 100).toFixed(1) : 'N/A' };
            const playerEntryDiv = document.createElement('details'); playerEntryDiv.classList.add('player-result-entry-detailed'); if (isWinner) playerEntryDiv.classList.add('winner'); playerEntryDiv.open = (rank === 1);
            const summary = document.createElement('summary'); summary.classList.add('player-result-header-detailed', 'details-summary-toggle');
            summary.setAttribute('aria-expanded', rank === 1 ? 'true' : 'false');
            summary.addEventListener('click', (e) => {
                const detailsElement = e.currentTarget.parentElement;
                setTimeout(() => summary.setAttribute('aria-expanded', detailsElement.open ? 'true' : 'false'), 0);
            });
            let rankSuffix = 'th'; if (rank === 1 && !isWinner && winners.length > 1) rankSuffix = 'st (Tied)'; else if (rank === 1) rankSuffix = 'st'; else if (rank === 2) rankSuffix = 'nd'; else if (rank === 3) rankSuffix = 'rd';
            let winnerIconHTML = isWinner ? `<i class="${FA_ICONS.trophy}" aria-hidden="true" aria-label="Winner"></i> ` : '';
            let aiBadgeHTML = p.type === 'ai' ? `<span class="ai-badge" aria-label="AI Player"><i class="${FA_ICONS.aiBadge}" aria-hidden="true"></i></span>` : '';
            summary.innerHTML = `<span class="player-rank">${winnerIconHTML}${rank}${rankSuffix}</span> <span class="player-name-endgame">${p.name} ${aiBadgeHTML} ${playerStats.isFirstPlayer ? '(P1)' : ''} ${playerStats.triggeredGameEnd ? '[Triggered End]' : ''}</span> <span class="player-score-endgame">${p.score} VP</span> <span class="player-summary-stats">(Cards: ${p.cards.length} | Turns: ${playerStats.turnsTaken})</span>`; playerEntryDiv.appendChild(summary);
            const detailsContainer = document.createElement('div'); detailsContainer.classList.add('player-result-details-grid'); const col1 = document.createElement('div'); col1.classList.add('stat-column');
            col1.innerHTML = `<div class="stat-category"><h4><span class="stat-icon"><i class="${FA_ICONS.trophy}"></i></span>VP Breakdown</h4><div class="stat-items"><span>Cards: ${vpFromCards} VP</span><span>Nobles: ${vpFromNobles} VP</span>${playerStats.turnReached15VP ? `<span>Reached ${WINNING_SCORE} VP: Turn ${playerStats.turnReached15VP}</span>` : ''}</div></div>`
                           + `<div class="stat-category"><h4><span class="stat-icon"><i class="${FA_ICONS.cardsStack}"></i></span>Purchased (${p.cards.length}) <span class="details-inline">(L1:${playerStats.cardsPurchasedByLevel[1]}/L2:${playerStats.cardsPurchasedByLevel[2]}/L3:${playerStats.cardsPurchasedByLevel[3]})</span></h4><div class="cards-summary purchased-cards-summary">${p.cards.length > 0 ? p.cards.map(card => createTinyCardElement(card).outerHTML).join('') : '<span class="no-items">None</span>'}</div><div class="stat-items sub-stats"><span>Avg VP/Card: ${avgVpPerCard}</span><span>From Reserve: ${playerStats.purchasedFromReserveCount} / Board: ${playerStats.purchasedFromBoardCount}</span><span>Free Purchases: ${playerStats.selfSufficientPurchases}</span></div></div>`
                           + `<div class="stat-category"><h4><span class="stat-icon"><i class="${FA_ICONS.lockOpen}"></i></span>Reserved (${p.reservedCards.length})</h4><div class="cards-summary reserved-cards-summary">${p.reservedCards.length > 0 ? p.reservedCards.map(card => createTinyCardElement(card).outerHTML).join('') : '<span class="no-items">None</span>'}</div></div>`
                           + `<details class="sub-details"><summary class="details-summary-toggle"><span class="stat-icon"><i class="${FA_ICONS.scroll}"></i></span>Reservation History (${playerStats.cardsReservedTotalCount} Total)</summary><div class="stat-category inner-stat-category"><h4>All Reserved Cards (Ever)</h4><div class="cards-summary reserved-cards-summary">${playerStats.allReservedCardsData.length > 0 ? playerStats.allReservedCardsData.map(card => createTinyCardElement(card).outerHTML).join('') : '<span class="no-items">None</span>'}</div><div class="stat-items sub-stats"><span>Deck Res (L1/L2/L3): ${playerStats.deckReservations[1]}/${playerStats.deckReservations[2]}/${playerStats.deckReservations[3]}</span><span>Board Res (L1/L2/L3): ${playerStats.boardReservations[1]}/${playerStats.boardReservations[2]}/${playerStats.boardReservations[3]}</span><span>Purchase Rate: ${reservationSuccessRate}%</span></div></div></details>`
                           + `<div class="stat-category"><h4><span class="stat-icon"><i class="${FA_ICONS.crown}"></i></span>Nobles (${p.nobles.length})</h4><div class="summary-items nobles-summary">${p.nobles.length > 0 ? p.nobles.map(noble => { const nobleEl = createNobleElement(noble); nobleEl.style.transform = 'scale(0.7)'; nobleEl.style.margin = '-5px'; return `<span aria-label="Acquired Turn ${playerStats.noblesAcquiredTurn[noble.id] || '?'}">${nobleEl.outerHTML}</span>`; }).join('') : '<span class="no-items">None</span>'}</div></div>`; detailsContainer.appendChild(col1);
            const col2 = document.createElement('div'); col2.classList.add('stat-column');
            col2.innerHTML = `<div class="stat-category"><h4><span class="stat-icon"><i class="${FA_ICONS.gemCluster}"></i></span>Bonuses (${totalBonuses} Total)</h4><div class="summary-items bonuses-summary">${totalBonuses > 0 ? GEM_TYPES.map(type => { const count = p.bonuses[type] || 0; return count > 0 ? `<div class="player-card-count gem-${type}" aria-label="${count} ${type} bonus">${count}</div>` : ''; }).join('') : '<span class="no-items">None</span>'}</div><div class="stat-items sub-stats"><span>Avg Bonus/Card: ${avgBonusPerCard}</span></div></div>`
                           + `<details class="sub-details"><summary class="details-summary-toggle"><span class="stat-icon"><i class="${FA_ICONS.coinsBag}"></i></span>Token Management</summary><div class="stat-category inner-stat-category"><h4>Final Tokens Held</h4><div class="summary-items gems-summary small-gems">${[...GEM_TYPES, GOLD].map(type => { const count = p.gems[type] || 0; return count > 0 ? createGemElement(type, count, true).outerHTML : ''; }).join('') || '<span class="no-items">None</span>'}</div><h4>Token Flow (Cumulative)</h4><div class="stat-items sub-stats flow-stats"><span>Taken: ${createGemFlowString(playerStats.gemsTaken)} (${totalGemsTaken} total)</span><span>Gold Taken: ${playerStats.goldTaken}</span><span>Spent: ${createGemFlowString(playerStats.gemsSpent)} (${totalGemsSpent} total)</span><span>Gold Spent: ${playerStats.goldSpent} (${goldDependency}% of cost)</span><span>Returned (Limit): ${createGemFlowString(playerStats.gemsReturnedOverLimit)} (${totalGemsReturned} total)</span><span>Peak Held (Total): ${playerStats.peakGemsHeld}</span></div><h4>Token Actions</h4><div class="stat-items sub-stats"><span>Take 3 Actions: ${playerStats.take3Actions} (${percentTake3}%)</span><span>Take 2 Actions: ${playerStats.take2Actions} (${percentTake2}%)</span><span>Avg Tokens/Take Action: ${avgGemsPerTakeAction}</span></div><h4>Token Limit Interaction</h4><div class="stat-items sub-stats"><span>Turns Ended at Limit: ${playerStats.turnsEndedExactLimit}</span><span>Turns Ended Below Limit: ${playerStats.turnsEndedBelowLimit}</span></div></div></details>`
                           + `<div class="stat-category"><h4><span class="stat-icon"><i class="${FA_ICONS.chartPie}"></i></span>Action Distribution (${totalActions} Total)</h4><div class="stat-items action-dist-stats"><span>Token Takes: ${actionDist.gem}%</span><span>Purchases: ${actionDist.purchase}%</span><span>Reserves: ${actionDist.reserve}%</span></div><div class="stat-items sub-stats"><span>Avg VP/Turn: ${avgVpPerTurn}</span></div></div>`; detailsContainer.appendChild(col2);
            playerEntryDiv.appendChild(detailsContainer); if(finalScoresDiv) finalScoresDiv.appendChild(playerEntryDiv);
        });
        if (winners.length > 1) { const tieMessage = document.createElement('p'); tieMessage.classList.add('tie-message'); tieMessage.textContent = `Tie between: ${winners.map(w => w.name).join(' & ')}! (Fewest cards purchased wins)`; if(finalScoresDiv) finalScoresDiv.appendChild(tieMessage); updateLog(`Game ended in a tie! Winner(s) determined by fewest cards.`); }
        else if (winners.length === 1) { updateLog(`Winner: ${winners[0].name} with ${winners[0].score} VP!`); } else { updateLog("Game ended. No winner determined?"); }
        updateClickableState();
        if (gameOverOverlay) {
            gameOverOverlay.classList.remove('hidden');
             requestAnimationFrame(() => {
                gameOverOverlay.style.opacity = '1';
                if(gameOverOverlay.querySelector('.modal-content')) gameOverOverlay.querySelector('.modal-content').style.transform = 'scale(1)';
            });
        }
        if (simulationPauseBtn) simulationPauseBtn.classList.add('hidden'); if (simulationStatusSpan) simulationStatusSpan.classList.add('hidden');
    }

    function clearActionState() {
        clearGemSelectionState();
        clearCardSelectionState();
        currentAction = null;
        renderSelectionInfo();
        updateClickableState();
    }

    function clearGemSelectionState() {
        if(gemBankContainer) gemBankContainer.querySelectorAll('.gem.selected').forEach(el => el.classList.remove('selected'));
        selectedGemTypes = [];
        if (currentAction === 'SELECTING_GEMS') currentAction = null;
    }

    function clearCardSelectionState() {
        if (selectedCard && selectedCard.element) {
            if (selectedCard.element.classList.contains('card') ||
                selectedCard.element.classList.contains('deck') ||
                selectedCard.element.classList.contains('reserved-card-small')) {
                selectedCard.element.classList.remove('selected');
                selectedCard.element.setAttribute('aria-pressed', 'false');
            }
        }
        selectedCard = null;
        if (apCardPreview) apCardPreview.innerHTML = '';
        if (currentAction === 'SELECTING_CARD') currentAction = null;
    }

    function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } return array; }
    function getCardById(id) {
        if (!id || typeof id !== 'string') return null;
        for (let level = 1; level <= 3; level++) {
            const card = visibleCards[level]?.find(c => c && c.id === id);
            if (card) return JSON.parse(JSON.stringify(card));
        }
        for (const p of players) { // Check all players' reserved cards
            const card = p.reservedCards?.find(c => c && c.id === id);
            if (card) return JSON.parse(JSON.stringify(card));
        }
        const allCardsCard = ALL_CARDS.find(c => c.id === id); // Fallback to master list
        if (allCardsCard) return JSON.parse(JSON.stringify(allCardsCard));
        return null;
    }
    function getDeckCardPlaceholder(level) { return { level: level, color: 'deck', cost: {}, vp: 0, id: `deck-${level}` }; }
    function canAffordCard(player, cardData) { if (!player || !cardData || !cardData.cost) { return { canAfford: false, goldNeeded: 0, effectiveCost: {} }; } let goldNeeded = 0; const effectiveCost = {}; GEM_TYPES.forEach(gemType => { const cardCost = cardData.cost[gemType] || 0; const playerBonus = player.bonuses[gemType] || 0; const costAfterBonus = Math.max(0, cardCost - playerBonus); effectiveCost[gemType] = costAfterBonus; const playerHasGem = player.gems[gemType] || 0; if (playerHasGem < costAfterBonus) goldNeeded += costAfterBonus - playerHasGem; }); const playerHasGold = player.gems.gold || 0; const canAfford = playerHasGold >= goldNeeded; return { canAfford, goldNeeded, effectiveCost }; }

    function drawCard(level, index, isInitialDraw = false) {
        const oldCardData = visibleCards[level][index];
        const oldCardElement = visibleCardsContainers[level]?.children[index];

        if (!isInitialDraw && oldCardElement && oldCardData) {
            oldCardElement.classList.add('card-exiting');
            oldCardElement.addEventListener('animationend', () => {
                if(oldCardElement.parentNode) oldCardElement.remove();
            }, { once: true });
        }

        if (decks[level].length > 0) {
            visibleCards[level][index] = decks[level].pop();
        } else {
            visibleCards[level][index] = null;
        }
        renderDeckCount(level);

        const newCardData = visibleCards[level][index];
        const newCardElement = createCardElement(newCardData, level, index);

        if (newCardData) {
             newCardElement.dataset.cardId = newCardData.id;
             // role, aria-label set in createCardElement
             // tabindex, aria-disabled initially set in createCardElement, refined by updateClickableState
             newCardElement.removeEventListener('click', handleVisibleCardClickWrapper);
             newCardElement.addEventListener('click', handleVisibleCardClickWrapper);
             newCardElement.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleVisibleCardClickWrapper(e); } });

            const actingPlayerIndex = currentPlayerIndex;
            let playerWhoseTurnIsNextIndex;
            if (gameTrulyFinished) {
                playerWhoseTurnIsNextIndex = actingPlayerIndex;
            } else if (isGameOverConditionMet && actingPlayerIndex === lastRoundPlayerIndex) {
                playerWhoseTurnIsNextIndex = actingPlayerIndex;
            } else {
                playerWhoseTurnIsNextIndex = (actingPlayerIndex + 1) % players.length;
            }
            const playerForInitialCheck = players[playerWhoseTurnIsNextIndex];

            if (playerForInitialCheck) {
                const { canAfford } = canAffordCard(playerForInitialCheck, newCardData);
                if (!canAfford) {
                    newCardElement.classList.add('not-affordable');
                }
            }
        }
        // createCardElement handles aria-label for empty slot

        if (!isInitialDraw) {
            newCardElement.classList.add('no-transition');
            newCardElement.classList.add('card-entering');

            setTimeout(() => {
                if (visibleCardsContainers[level]) {
                    if (visibleCardsContainers[level].children[index] && visibleCardsContainers[level].children[index] !== newCardElement) {
                        visibleCardsContainers[level].replaceChild(newCardElement, visibleCardsContainers[level].children[index]);
                    } else if (!visibleCardsContainers[level].children[index]) {
                         visibleCardsContainers[level].appendChild(newCardElement);
                    } else if (visibleCardsContainers[level].children[index] === oldCardElement && oldCardElement.classList.contains('card-exiting')) {
                        visibleCardsContainers[level].replaceChild(newCardElement, oldCardElement);
                    } else if (!visibleCardsContainers[level].contains(newCardElement)) {
                        visibleCardsContainers[level].appendChild(newCardElement);
                    }

                    const animationTotalTime = 450; // 0.3s duration + 0.15s delay
                    setTimeout(() => {
                        newCardElement.classList.remove('card-entering');
                        updateClickableState();
                        requestAnimationFrame(() => { // Remove no-transition after styles from updateClickableState applied
                            newCardElement.classList.remove('no-transition');
                        });
                    }, animationTotalTime + 20);
                }
            }, 150);
        } else {
            if (oldCardElement && visibleCardsContainers[level] && visibleCardsContainers[level].children[index]) {
                visibleCardsContainers[level].replaceChild(newCardElement, visibleCardsContainers[level].children[index]);
            } else if (visibleCardsContainers[level]) {
                 visibleCardsContainers[level].appendChild(newCardElement);
            }
            requestAnimationFrame(() => {
                updateClickableState();
            });
        }
    }

    function findNonSelectedBankGemElement(gemType, excludeElement = null) { const elements = gemBankContainer?.querySelectorAll(`.gem[data-gem-type="${gemType}"]`); if(!elements) return null; for (const el of elements) if (!el.classList.contains('selected') && el !== excludeElement) return el; return null; }

    function formatCardCostForTitle(cardData) {
        if (!cardData || !cardData.id) return "Card Data Error";
        let title = `L${cardData.level} ${cardData.color} (${cardData.vp} VP) [ID: ${cardData.id}]`;
        const costString = GEM_TYPES.map(type => ({ type, count: cardData.cost[type] || 0 }))
            .filter(item => item.count > 0)
            .map(item => `${item.count} ${item.type}`)
            .join(', ');
        title += `\nCost: ${costString || 'Free'}`;
        return title;
    }

    function formatCardAriaLabel(cardData) { if (!cardData) return "Empty card slot"; let label = `Level ${cardData.level} ${cardData.color} card.`; if (cardData.vp > 0) label += ` ${cardData.vp} Victory Points.`; const costParts = GEM_TYPES.map(type => ({ type, count: cardData.cost[type] || 0 })).filter(item => item.count > 0).map(item => `${item.count} ${item.type}`); if (costParts.length > 0) label += ` Cost: ${costParts.join(', ')}.`; else label += ` Cost: Free.`; return label; }
    function formatNobleAriaLabel(nobleData) { if (!nobleData) return ""; let label = `Noble, ${nobleData.vp} Victory Points. Requires: `; const reqParts = []; GEM_TYPES.forEach(gemType => { const reqCount = nobleData.requirements[gemType]; if (reqCount > 0) reqParts.push(`${reqCount} ${gemType} bonuses`); }); label += reqParts.join(', ') || 'no bonuses'; label += "."; return label; }
    function createTinyCardElement(cardData) { const cardEl = document.createElement('div'); if (!cardData) return cardEl; cardEl.classList.add('tiny-card', `card-border-${cardData.color}`);
    cardEl.setAttribute('aria-label', formatCardAriaLabel(cardData));
    const vpSpan = document.createElement('span'); vpSpan.classList.add('tiny-card-vp'); vpSpan.textContent = cardData.vp > 0 ? cardData.vp : ''; const gemBonus = document.createElement('div'); gemBonus.classList.add('tiny-card-gem', `gem-${cardData.color}`); cardEl.appendChild(vpSpan); cardEl.appendChild(gemBonus); return cardEl; }
    function createGemFlowString(gemCounts) { return GEM_TYPES.map(type => ({ type, count: gemCounts[type] || 0 })).filter(item => item.count > 0).map(item => `<span class="gem-inline gem-${item.type}" aria-label="${item.count} ${item.type}">${item.count}</span>`).join(' ') || '<span class="no-items">0</span>'; }

    function updateClickableState() {
        if (!players || players.length === 0 || (currentPlayerIndex >= players.length && !gameTrulyFinished) ) {
            return;
        }
        const player = players[currentPlayerIndex];
        const disableAllInteraction = gameTrulyFinished || isSimulationMode || isOverlayVisible() || (player && player.type === 'ai');
        const isHumanActiveTurn = player && player.type === 'human' && !disableAllInteraction;

        const allPotentiallyInteractive = document.querySelectorAll(
            '#gem-bank .gem, #cards-area .card:not(.empty-slot), #cards-area .deck, .player-area .reserved-card-small, #end-turn-early-btn, #simulation-pause-btn, #ap-cancel-btn'
        );
        allPotentiallyInteractive.forEach(el => {
            const isPauseButton = el.id === 'simulation-pause-btn';
            const shouldBeDisabledOverall = disableAllInteraction && !(isPauseButton && isSimulationMode && !gameTrulyFinished);

            el.classList.toggle('not-selectable', shouldBeDisabledOverall);
            if (el.hasAttribute('role') && (el.getAttribute('role') === 'button' || el.getAttribute('role') === 'radio' || el.getAttribute('role') === 'checkbox')) {
                 el.setAttribute('aria-disabled', shouldBeDisabledOverall ? 'true' : 'false');
            }
            if (el.hasAttribute('tabindex')) {
                el.setAttribute('tabindex', shouldBeDisabledOverall ? '-1' : '0');
            }

            if (shouldBeDisabledOverall) {
                el.classList.remove('selected', 'not-affordable', 'card-affordable-now');
                if (el.tagName === 'BUTTON') el.disabled = true;
            } else if (el.tagName === 'BUTTON') {
                el.disabled = false;
            }
        });

        if (disableAllInteraction) {
            if (apActionButtons) {
                const dynamicButtons = apActionButtons.querySelectorAll('button:not(#ap-cancel-btn)');
                dynamicButtons.forEach(btn => btn.remove());
            }
            if (apCancelBtn && !apCancelBtn.classList.contains('hidden') && !isOverlayVisible()) {
                apCancelBtn.classList.add('hidden');
            }
            document.querySelectorAll('.nobles-container .noble.clickable').forEach(el => el.style.pointerEvents = 'none');
            if (isSimulationMode && !gameTrulyFinished && simulationPauseBtn) {
                simulationPauseBtn.disabled = false;
                simulationPauseBtn.classList.remove('not-selectable');
                simulationPauseBtn.setAttribute('aria-disabled', 'false');
                simulationPauseBtn.setAttribute('tabindex', '0');
            }
            return;
        }

        document.querySelectorAll('.nobles-container .noble.clickable').forEach(el => el.style.pointerEvents = 'auto');

        gemBankContainer?.querySelectorAll('.gem').forEach(gemEl => {
            const gemType = gemEl.dataset.gemType;
            const isSelectedVisual = gemEl.classList.contains('selected');
            let clickable = isHumanActiveTurn ? isGemClickable(gemType, isSelectedVisual) : false;
            gemEl.classList.toggle('not-selectable', !clickable && !isSelectedVisual);
            gemEl.setAttribute('aria-disabled', (!clickable && !isSelectedVisual).toString());
            if (!clickable && !isSelectedVisual) gemEl.setAttribute('tabindex', '-1'); else gemEl.setAttribute('tabindex', '0');
        });

        document.querySelectorAll('#cards-area .card:not(.empty-slot)').forEach(el => {
             const cardId = el.dataset.cardId;
             let cardData = null;
             if (cardId) {
                cardData = getCardById(cardId);
             }

             let disableSpecificInteraction = true;
             const isSelectedElement = selectedCard && selectedCard.element === el;

             if (isHumanActiveTurn) {
                 if (isSelectedElement) {
                     disableSpecificInteraction = false;
                 } else if (currentAction === 'SELECTING_GEMS') {
                     disableSpecificInteraction = true;
                 } else {
                     const canAffordForInteraction = cardData ? canAffordCard(player, cardData).canAfford : false;
                     disableSpecificInteraction = !( (player.reservedCards.length < MAX_RESERVED_CARDS) || canAffordForInteraction );
                 }
             }

             el.classList.toggle('not-selectable', disableSpecificInteraction);
             el.setAttribute('aria-disabled', disableSpecificInteraction.toString());
             if (disableSpecificInteraction && !isSelectedElement) {
                 el.setAttribute('tabindex', '-1');
             } else {
                 el.setAttribute('tabindex', '0');
             }

            if (cardData) {
                const canAfford = canAffordCard(player, cardData).canAfford;
                const isInteractableAndNotSelected = !disableSpecificInteraction && !isSelectedElement;

                if (!canAfford) {
                    el.classList.add('not-affordable');
                    el.classList.remove('card-affordable-now');
                } else {
                    el.classList.remove('not-affordable');
                    if (isInteractableAndNotSelected) {
                        el.classList.add('card-affordable-now');
                    } else {
                        el.classList.remove('card-affordable-now');
                    }
                }
                if (isSelectedElement) {
                    el.classList.remove('not-affordable');
                    el.classList.remove('card-affordable-now');
                }
            } else {
                 el.classList.remove('not-affordable', 'card-affordable-now');
            }
         });

        document.querySelectorAll('#cards-area .deck').forEach(el => {
            let disableSpecificInteraction = true;
            const isSelectedElement = selectedCard && selectedCard.element === el;
            if (isHumanActiveTurn) {
                if (isSelectedElement) {
                    disableSpecificInteraction = false;
                } else if (currentAction === 'SELECTING_GEMS') {
                    disableSpecificInteraction = true;
                } else {
                    disableSpecificInteraction = el.classList.contains('empty') || (player.reservedCards.length >= MAX_RESERVED_CARDS);
                }
            }
            el.classList.toggle('not-selectable', disableSpecificInteraction);
            el.setAttribute('aria-disabled', disableSpecificInteraction.toString());
            if (disableSpecificInteraction && !isSelectedElement) el.setAttribute('tabindex', '-1'); else el.setAttribute('tabindex', '0');
        });

        document.querySelectorAll(`.player-area .reserved-card-small`).forEach(cardEl => {
            let disableSpecificInteraction = true;
            const isSelectedElement = selectedCard && selectedCard.element === cardEl;
            const cardPlayerArea = cardEl.closest('.player-area');
            const cardPlayerId = cardPlayerArea ? parseInt(cardPlayerArea.id.split('-')[2], 10) : -1;
            let rCardData = null;

            if (isHumanActiveTurn && cardPlayerId === currentPlayerIndex) {
                rCardData = player.reservedCards?.find(c => c.id === cardEl.dataset.cardId);
                if (isSelectedElement) {
                    disableSpecificInteraction = false;
                } else if (currentAction === 'SELECTING_GEMS') {
                    disableSpecificInteraction = true;
                } else {
                    disableSpecificInteraction = false;
                }
            }

            cardEl.classList.toggle('not-selectable', disableSpecificInteraction);
            cardEl.setAttribute('aria-disabled', disableSpecificInteraction.toString());
            if (disableSpecificInteraction && !isSelectedElement) cardEl.setAttribute('tabindex', '-1'); else cardEl.setAttribute('tabindex', '0');

            if (rCardData && cardPlayerId === currentPlayerIndex) {
                const canAfford = canAffordCard(player, rCardData).canAfford;
                const isInteractableAndNotSelected = !disableSpecificInteraction && !isSelectedElement;

                if (!canAfford) {
                    cardEl.classList.add('not-affordable');
                    cardEl.classList.remove('card-affordable-now');
                } else {
                    cardEl.classList.remove('not-affordable');
                    if (isInteractableAndNotSelected) {
                        cardEl.classList.add('card-affordable-now');
                    } else {
                        cardEl.classList.remove('card-affordable-now');
                    }
                }
                if (isSelectedElement) {
                    cardEl.classList.remove('not-affordable', 'card-affordable-now');
                }
            } else {
                 cardEl.classList.remove('not-affordable', 'card-affordable-now');
            }
        });

        if (apCancelBtn) {
            const disableCancel = !currentAction;
            apCancelBtn.disabled = disableCancel;
        }
    }

    function isGemClickable(gemType, isSelectedVisual) {
        const player = players[currentPlayerIndex];
        if (!player || player.type === 'ai' || isSimulationMode || isOverlayVisible() || gameTrulyFinished) return false;
        if (currentAction === 'SELECTING_CARD' && selectedCard) return false; // Don't allow gem clicks if card is being selected

        if (isSelectedVisual) return true; // Always clickable to deselect

        // If not selected, check if it can be added to selection
        if (bank[gemType] <= 0 || gemType === GOLD) return false; // Cannot select empty or gold

        const currentSelection = selectedGemTypes;
        const currentCount = currentSelection.length;
        const currentUniqueCount = new Set(currentSelection).size;

        if (currentCount === 0) { // No gems selected yet
            return bank[gemType] >= 1; // Can take one if available
        }
        if (currentCount === 1) { // One gem already selected
            const firstType = currentSelection[0];
            if (gemType === firstType) { // Trying to take a second of the same type
                return bank[gemType] >= MIN_GEMS_FOR_TAKE_TWO;
            } else { // Trying to take a second, different type
                return bank[gemType] >= 1;
            }
        }
        if (currentCount === 2) { // Two gems already selected
            if (currentUniqueCount === 1) { // Already have a pair ['X', 'X']
                return false; // Cannot select a third gem if a pair is selected
            } else { // Have two different ['X', 'Y']
                return !currentSelection.includes(gemType) && bank[gemType] >= 1; // Can take a third, different type
            }
        }
        return false; // Max 3 gems selected, or other invalid state
    }
    function highlightActivePlayer() {
        document.querySelectorAll('.player-area.active-player').forEach(el => {
            el.classList.remove('active-player');
            const nameEl = el.querySelector('.player-name');
            if(nameEl) nameEl.style.color = ''; // Reset color
        });
        if (!gameTrulyFinished && players[currentPlayerIndex]) { // Check if player exists
            const activePlayerEl = document.getElementById(`player-area-${currentPlayerIndex}`);
            if (activePlayerEl) {
                activePlayerEl.classList.add('active-player');
                const nameEl = activePlayerEl.querySelector('.player-name');
                if(nameEl) nameEl.style.color = 'var(--highlight-active)'; // Apply highlight color
            }
        }
    }
    function updateLog(message) {
        if (!logMessagesDiv) return;
        const p = document.createElement('p');
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const turnPrefix = `[T${turnNumber}]`;
        p.textContent = `${timestamp} ${turnPrefix} ${message}`;

        p.classList.add('new-log-entry'); // For CSS animation
        logMessagesDiv.appendChild(p);
        logMessagesDiv.scrollTop = logMessagesDiv.scrollHeight; // Auto-scroll
        setTimeout(() => { // Remove class after animation
            if (p.parentNode) { // Check if p is still in DOM
                 p.classList.remove('new-log-entry');
            }
        }, 500); // Match CSS animation duration
    }
    function hideOverlays() {
        [returnGemsOverlay, gameOverOverlay, nobleChoiceOverlay, aiThinkingOverlay].forEach(overlay => {
            if (overlay && !overlay.classList.contains('hidden')) {
                overlay.style.opacity = '0';
                if(overlay.querySelector('.modal-content')) overlay.querySelector('.modal-content').style.transform = 'scale(0.95)';

                const handleOverlayFadeOut = () => {
                    overlay.removeEventListener('transitionend', handleOverlayFadeOut);
                    overlay.classList.add('hidden');
                    // overlay.style.visibility = 'hidden'; // This is handled by .hidden class
                };
                overlay.addEventListener('transitionend', handleOverlayFadeOut, {once: true});
            }
        });
    }
    function isOverlayVisible() { return [returnGemsOverlay, gameOverOverlay, nobleChoiceOverlay, aiThinkingOverlay].some(overlay => overlay && !overlay.classList.contains('hidden') && overlay.style.opacity !== '0'); }
    function startTimer() {
        stopTimer();
        if (!timerDisplay) return;
        timerDisplay.classList.remove('active-timer-pulse', 'timer-low');

        if (isSimulationMode || gameSettings.timerMinutes <= 0 || turnDuration <= 0) {
            renderTimer(); return;
        }
        const currentPlayer = players[currentPlayerIndex];
        if (!currentPlayer || currentPlayer.type === 'ai') {
            renderTimer(); return;
        }

        turnTimeRemaining = turnDuration;
        renderTimer(); // Initial render of time
        if (turnTimeRemaining > TIMER_LOW_THRESHOLD) { // Only pulse if not immediately low
             timerDisplay.classList.add('active-timer-pulse');
        }


        turnTimerInterval = setInterval(() => {
             const player = players[currentPlayerIndex]; // Re-fetch in case of changes
             if (gameTrulyFinished || !player || player.type === 'ai' || isOverlayVisible() || (isSimulationMode && isSimulationPaused)) {
                 stopTimer(); renderTimer(); return;
             }
            turnTimeRemaining--;
            renderTimer(); // Update display every second
            if (turnTimeRemaining < 0) { // Use < 0 to allow 00:00 to show
                updateLog(`Player ${player.name}'s turn timed out.`);
                clearActionState();
                logActionToHistory(player, 'TIMEOUT', {});
                endTurn('TIMEOUT');
            }
        }, 1000);
    }
    function stopTimer() {
        clearInterval(turnTimerInterval);
        turnTimerInterval = null;
        if(timerDisplay) timerDisplay.classList.remove('active-timer-pulse'); // Always remove pulse when stopping
    }
    function showAiThinking(playerName) {
        if (!aiThinkingOverlay || !aiThinkingPlayerName) return;
        aiThinkingPlayerName.textContent = playerName ? `(${playerName})` : '';
        aiThinkingOverlay.classList.remove('hidden');
        requestAnimationFrame(() => {
            aiThinkingOverlay.style.opacity = '1';
            // aiThinkingOverlay.style.visibility = 'visible'; // Handled by removing .hidden
        });
    }
    function hideAiThinking() {
        if (!aiThinkingOverlay) return;
        aiThinkingOverlay.style.opacity = '0';
        const currentThinkingOverlay = aiThinkingOverlay; // Avoid issues if called rapidly
        const hideHandler = () => {
            if (currentThinkingOverlay.style.opacity === '0') { // Check if still meant to be hidden
                currentThinkingOverlay.classList.add('hidden');
                // currentThinkingOverlay.style.visibility = 'hidden';
            }
            currentThinkingOverlay.removeEventListener('transitionend', hideHandler);
        };
        currentThinkingOverlay.addEventListener('transitionend', hideHandler, { once: true });
    }
    function logActionToHistory(player, actionType, details) { const logEntry = { turn: turnNumber, playerIndex: player.id, playerName: player.name, playerType: player.type, actionType: actionType, details: JSON.parse(JSON.stringify(details)) }; gameHistoryLog.push(logEntry); }
    function getThemeColorName(colorClass) { return THEME_COLOR_NAMES[colorClass] || colorClass.replace('player-color-','Theme '); }

    function showTooltip(targetElement, textContent) {
        if (!customTooltipElement || !textContent || !targetElement) return;
        clearTimeout(hideTooltipTimeoutId);

        if (activeTooltipTarget === targetElement && customTooltipElement.style.visibility === 'visible') {
            const currentText = customTooltipElement.innerHTML.replace(/<br\s*\/?>/gi, '\n');
            if (currentText !== textContent) {
                customTooltipElement.innerHTML = textContent.replace(/\n/g, '<br>');
                positionTooltip(targetElement, customTooltipElement);
            }
            return;
        }

        activeTooltipTarget = targetElement;
        customTooltipElement.innerHTML = textContent.replace(/\n/g, '<br>');
        customTooltipElement.style.visibility = 'hidden';
        customTooltipElement.style.opacity = '0';

        requestAnimationFrame(() => {
            positionTooltip(targetElement, customTooltipElement);
            customTooltipElement.style.visibility = 'visible';
            requestAnimationFrame(() => {
                customTooltipElement.style.opacity = '1';
            });
        });

        window.addEventListener('scroll', handleTooltipScroll, { passive: true, capture: true });
        targetElement.addEventListener('mouseleave', hideTooltipOnMouseLeave, { once: true });
    }

    function hideTooltipOnMouseLeave(event) {
        if (customTooltipElement && event.relatedTarget === customTooltipElement) {
            customTooltipElement.addEventListener('mouseleave', () => hideTooltip(false, event.currentTarget), { once: true });
            return;
        }
        hideTooltip(false, event.currentTarget);
    }

    function hideTooltip(immediate = false, originalTarget = null) {
        if (!customTooltipElement) return;

        if (originalTarget && activeTooltipTarget !== originalTarget) {
            return;
        }

        clearTimeout(hideTooltipTimeoutId);
        window.removeEventListener('scroll', handleTooltipScroll, { capture: true });
        if(activeTooltipTarget) {
             activeTooltipTarget.removeEventListener('mouseleave', hideTooltipOnMouseLeave);
        }
         if(customTooltipElement){
            customTooltipElement.removeEventListener('mouseleave', hideTooltip); // Using a bound function or specific handler might be needed if this doesn't work
        }

        if (immediate || getComputedStyle(customTooltipElement).opacity === '0') { // If already faded out or immediate hide
            customTooltipElement.style.opacity = '0';
            customTooltipElement.style.visibility = 'hidden';
            if (originalTarget === null || activeTooltipTarget === originalTarget) {
                 activeTooltipTarget = null;
            }
        } else {
            customTooltipElement.style.opacity = '0';
            const transitionEndHandler = (e) => {
                if (e.propertyName === 'opacity' && e.target === customTooltipElement) {
                    if (customTooltipElement.style.opacity === '0') {
                        customTooltipElement.style.visibility = 'hidden';
                        if (originalTarget === null || activeTooltipTarget === originalTarget) {
                             activeTooltipTarget = null;
                        }
                    }
                }
            };
            customTooltipElement.addEventListener('transitionend', transitionEndHandler, { once: true });

            hideTooltipTimeoutId = setTimeout(() => {
                if (customTooltipElement.style.opacity === '0') { // Double check
                    customTooltipElement.style.visibility = 'hidden';
                    if (originalTarget === null || activeTooltipTarget === originalTarget) {
                        activeTooltipTarget = null;
                    }
                }
                customTooltipElement.removeEventListener('transitionend', transitionEndHandler); // Fallback cleanup
            }, 250); // Slightly longer than CSS transition (0.2s = 200ms)
        }
    }

    function positionTooltip(targetElement, tooltipEl) {
        if (!targetElement || !tooltipEl) return;

        const targetRect = targetElement.getBoundingClientRect();
        tooltipEl.style.left = '0px';
        tooltipEl.style.top = '0px';
        // Force reflow to get accurate measurements if tooltip was recently hidden/changed
        // tooltipEl.offsetHeight; // Reading a property like offsetHeight can force reflow

        const tooltipRect = tooltipEl.getBoundingClientRect();

        let top = targetRect.top - tooltipRect.height - 10; // Prefer above
        let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);

        if (top < 5) {
            top = targetRect.bottom + 8;
        }
        if (top + tooltipRect.height > window.innerHeight - 5) {
            top = targetRect.top - tooltipRect.height - 10;
            if (top < 5) { top = 5; }
        }
        if (left < 5) {
            left = 5;
        }
        if (left + tooltipRect.width > window.innerWidth - 5) {
            left = window.innerWidth - 5 - tooltipRect.width;
        }

        tooltipEl.style.top = `${top}px`;
        tooltipEl.style.left = `${left}px`;
    }

    function handleTooltipScroll() {
        if (activeTooltipTarget && customTooltipElement && customTooltipElement.style.visibility === 'visible') {
            positionTooltip(activeTooltipTarget, customTooltipElement);
        } else {
            hideTooltip(true);
            window.removeEventListener('scroll', handleTooltipScroll, { capture: true });
        }
    }

    function animateGemTransfer(gemTypesArray, fromElements, toElementOrCoords, isReturn = false) {
        if (!gemTypesArray || gemTypesArray.length === 0 || !fromElements || !toElementOrCoords) return;

        const particlesContainer = document.body; // Or a more specific container if you have one

        gemTypesArray.forEach((gemType, index) => {
            const particle = document.createElement('div');
            particle.classList.add('gem-particle', `gem-${gemType}`);
            particlesContainer.appendChild(particle);

            const fromEl = Array.isArray(fromElements) ? (fromElements[index] || fromElements[0]) : fromElements;
            if(!fromEl) { particle.remove(); return; } // Should not happen if fromElements is valid
            const startRect = fromEl.getBoundingClientRect();

            let endX, endY;
            const currentToTarget = Array.isArray(toElementOrCoords)
                ? (toElementOrCoords[index] || toElementOrCoords[0])
                : toElementOrCoords;

            if (currentToTarget instanceof HTMLElement) {
                const endRect = currentToTarget.getBoundingClientRect();
                endX = endRect.left + endRect.width / 2 - particle.offsetWidth / 2;
                endY = endRect.top + endRect.height / 2 - particle.offsetHeight / 2;
            } else if (typeof currentToTarget === 'object' && currentToTarget !== null && 'x' in currentToTarget && 'y' in currentToTarget) {
                endX = currentToTarget.x - particle.offsetWidth / 2;
                endY = currentToTarget.y - particle.offsetHeight / 2;
            } else {
                console.error("Invalid 'to' target for gem animation:", currentToTarget);
                particle.remove();
                return;
            }

            // Set initial position using window scroll offsets for fixed positioning
            particle.style.left = `${startRect.left + window.scrollX + startRect.width / 2 - particle.offsetWidth / 2}px`;
            particle.style.top = `${startRect.top + window.scrollY + startRect.height / 2 - particle.offsetHeight / 2}px`;
            particle.style.opacity = '1';
            particle.style.transform = 'scale(1)';

            requestAnimationFrame(() => { // Ensure initial styles are applied before transition starts
                const targetPageX = endX + window.scrollX; // Target X relative to document
                const targetPageY = endY + window.scrollY; // Target Y relative to document
                const offsetX = (Math.random() - 0.5) * 20; // Random offset for a bit of spread
                const offsetY = (Math.random() - 0.5) * 20;

                // Calculate translation relative to current particle position (which is document-relative)
                particle.style.transform = `translate(${targetPageX - parseFloat(particle.style.left) + offsetX}px, ${targetPageY - parseFloat(particle.style.top) + offsetY}px) scale(0.3)`;
                particle.style.opacity = '0';
            });

            particle.addEventListener('transitionend', () => {
                particle.remove();
            }, { once: true });
        });
    }


    // Initial Setup Calls
    initializeApiKey();
    document.body.style.alignItems = 'center'; // For setup screen centering
    document.body.style.justifyContent = 'center';
    updatePlayerCountSelection(gameSettings.selectedPlayerCount); // Set initial player count display
    setupEventListeners();
    const initialTimerValue = parseFloat(timerInput.value); // Sync timer presets with input
    if (timerPresetsContainer) {
        timerPresetsContainer.querySelectorAll('.btn-timer-preset').forEach(btn => {
             const isActive = parseFloat(btn.dataset.value) === initialTimerValue;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', isActive.toString());
        });
    }
    if (simulationSpeedContainer && simulationModeCheckbox) { // Initial state of sim speed input
        simulationSpeedContainer.classList.toggle('hidden', !simulationModeCheckbox.checked);
    }
    renderSelectionInfo(); // Initialize the action panel
});