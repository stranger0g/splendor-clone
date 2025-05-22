// Helper for SVG icons
const SVG_ICONS = {
    pause: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M0 0h24v24H0z" fill="none"/><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
    play: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M0 0h24v24H0z" fill="none"/><path d="M8 5v14l11-7z"/></svg>',
    flag: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M0 0h24v24H0z" fill="none"/><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6zM5 6h7.4l.4 2H19v2h-3.6l-.4-2H7V6zm0 11v-2h7.6l.4 2H19v2h-5.6l-.4-2H5z"/></svg>',
    cancel: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'
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
    const apiKeyIcon = document.getElementById('api-key-icon');
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
    const aiThinkingOverlay = document.getElementById('ai-thinking-overlay');
    const aiThinkingPlayerName = document.getElementById('ai-thinking-player-name');

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
        if (storedKey) {
            GEMINI_API_KEY = storedKey;
            if (apiKeyIcon) apiKeyIcon.classList.add('loaded');
            if (apiKeyTooltipText) apiKeyTooltipText.textContent = "API Key loaded.";
            AI_CONFIG.isEnabled = true;
        } else {
            if (apiKeyIcon) apiKeyIcon.classList.add('missing');
            if (apiKeyTooltipText) apiKeyTooltipText.textContent = "API Key not found. AI Players disabled. Click to set.";
            AI_CONFIG.isEnabled = false;
        }
        if (typeof setupPlayerNameInputs === 'function') {
           setupPlayerNameInputs();
        }
    }

    function promptForApiKey() {
        const newKey = prompt("Gemini API Key not found or invalid.\nPlease enter your Gemini API Key (will be stored locally for future sessions):");
        if (newKey) {
            GEMINI_API_KEY = newKey;
            localStorage.setItem('geminiApiKey', GEMINI_API_KEY);
            if (apiKeyIcon) { apiKeyIcon.classList.remove('missing', 'error'); apiKeyIcon.classList.add('loaded'); }
            if (apiKeyTooltipText) apiKeyTooltipText.textContent = "API Key stored and loaded.";
            AI_CONFIG.isEnabled = true;
        } else {
            if (apiKeyIcon) { apiKeyIcon.classList.remove('loaded', 'error'); apiKeyIcon.classList.add('missing'); }
            if (apiKeyTooltipText) apiKeyTooltipText.textContent = "API Key not provided. AI Players disabled. Click to set.";
            AI_CONFIG.isEnabled = false;
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
                drawCard(level, i);
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
             const simBtnIcon = simulationPauseBtn.querySelector('svg');
             const simBtnText = simulationPauseBtn.querySelector('.btn-text-placeholder');
             if(isSimulationPaused) {
                 if (simBtnIcon) simBtnIcon.outerHTML = SVG_ICONS.play;
                 if (simBtnText) simBtnText.textContent = "Resume Sim";
             } else {
                 if (simBtnIcon) simBtnIcon.outerHTML = SVG_ICONS.pause;
                 if (simBtnText) simBtnText.textContent = "Pause Sim";
             }
             if(simulationStatusSpan) simulationStatusSpan.textContent = isSimulationPaused ? "Paused" : "Running";
             if(endTurnEarlyBtn) endTurnEarlyBtn.classList.add('hidden');
        } else {
            if(simulationPauseBtn) simulationPauseBtn.classList.add('hidden');
            if(simulationStatusSpan) simulationStatusSpan.classList.add('hidden');
        }

        if (setupScreen) setupScreen.classList.replace('active', 'hidden');
        if (gameContainer) gameContainer.classList.replace('hidden', 'active');
        document.body.style.alignItems = 'flex-start'; document.body.style.justifyContent = 'center';

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

            const nameInput = document.createElement('input');
            nameInput.type = 'text'; nameInput.placeholder = `Player ${i + 1} Name`;
            nameInput.id = `player-name-${i}`; nameInput.value = `Player ${i + 1}`;
            nameInput.classList.add('setup-input', 'player-name-input');

            const themeSelectorDiv = document.createElement('div');
            themeSelectorDiv.classList.add('player-theme-selector');
            const themeLabel = document.createElement('label');
            themeLabel.classList.add('setup-label'); themeLabel.textContent = 'Theme:';
            themeSelectorDiv.appendChild(themeLabel);
            const swatchesContainer = document.createElement('div');
            swatchesContainer.classList.add('theme-swatches-container');
            PLAYER_COLORS.forEach((colorClass, colorIndex) => {
                const swatchItem = document.createElement('div');
                swatchItem.classList.add('theme-swatch-item'); swatchItem.dataset.colorClass = colorClass;
                const swatch = document.createElement('span');
                swatch.classList.add('theme-swatch', `${colorClass}-bg`);
                swatchItem.appendChild(swatch);
                const themeNameSpan = document.createElement('span');
                themeNameSpan.classList.add('theme-name'); themeNameSpan.textContent = getThemeColorName(colorClass);
                swatchItem.appendChild(themeNameSpan);
                if (i === colorIndex) swatchItem.classList.add('selected');
                swatchItem.addEventListener('click', () => {
                    swatchesContainer.querySelectorAll('.theme-swatch-item').forEach(s => s.classList.remove('selected'));
                    swatchItem.classList.add('selected');
                });
                swatchesContainer.appendChild(swatchItem);
            });
            themeSelectorDiv.appendChild(swatchesContainer);

            const typeSelectorDiv = document.createElement('div');
            typeSelectorDiv.classList.add('player-type-selector');
            const typeLabel = document.createElement('label');
            typeLabel.classList.add('setup-label'); typeLabel.textContent = 'Type:';
            typeSelectorDiv.appendChild(typeLabel);
            const typeButtonGroup = document.createElement('div');
            typeButtonGroup.classList.add('button-group-tight');
            const humanBtn = document.createElement('button');
            humanBtn.classList.add('btn', 'btn-player-type'); humanBtn.dataset.type = 'human'; humanBtn.innerHTML = '👤 Human';
            const aiBtn = document.createElement('button');
            aiBtn.classList.add('btn', 'btn-player-type'); aiBtn.dataset.type = 'ai'; aiBtn.innerHTML = '🤖 AI';

            if (simulationModeCheckbox && simulationModeCheckbox.checked) {
                aiBtn.classList.add('active'); humanBtn.disabled = true; aiBtn.disabled = true;
            } else {
                humanBtn.classList.add('active'); aiBtn.disabled = !AI_CONFIG.isEnabled;
            }

            [humanBtn, aiBtn].forEach(btn => {
                btn.addEventListener('click', () => {
                    if (btn.disabled) return;
                    typeButtonGroup.querySelectorAll('.btn-player-type').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                });
                typeButtonGroup.appendChild(btn);
            });
            typeSelectorDiv.appendChild(typeButtonGroup);

            playerEntryDiv.appendChild(nameInput); playerEntryDiv.appendChild(themeSelectorDiv); playerEntryDiv.appendChild(typeSelectorDiv);
            playerNamesDiv.appendChild(playerEntryDiv);
        }
        if (!AI_CONFIG.isEnabled) {
            document.querySelectorAll('.btn-player-type[data-type="ai"]').forEach(btn => {
                btn.disabled = true;
                if (btn.classList.contains('active')) {
                    btn.classList.remove('active');
                    const humanEquivalent = btn.parentElement.querySelector('.btn-player-type[data-type="human"]');
                    if (humanEquivalent) humanEquivalent.classList.add('active');
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
                btn.classList.toggle('active', parseInt(btn.dataset.value, 10) === gameSettings.selectedPlayerCount);
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
                    timerPresetsContainer.querySelectorAll('.btn-timer-preset').forEach(btn => btn.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                });
            });
        }
        if (timerInput) {
            timerInput.addEventListener('input', () => {
                const currentValue = parseFloat(timerInput.value);
                timerPresetsContainer.querySelectorAll('.btn-timer-preset').forEach(btn => {
                    btn.classList.toggle('active', parseFloat(btn.dataset.value) === currentValue);
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
                        if(humanBtn) { humanBtn.classList.remove('active'); humanBtn.disabled = true; }
                        if(aiBtn) { aiBtn.classList.add('active'); aiBtn.disabled = true; }
                    } else {
                        if(humanBtn) { humanBtn.classList.add('active'); humanBtn.disabled = false; }
                        if(aiBtn) { aiBtn.classList.remove('active'); aiBtn.disabled = !AI_CONFIG.isEnabled; }
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
                     alert("An AI player was selected, but the Gemini API Key is missing or invalid! Please set the key (click the key icon) or choose Human players only."); return;
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
            }
        });

        if(endTurnEarlyBtn) {
            const textPlaceholder = endTurnEarlyBtn.querySelector('.btn-text-placeholder');
            if (textPlaceholder && textPlaceholder.textContent.trim() === "") { 
                 textPlaceholder.textContent = "End Turn";
            }
            endTurnEarlyBtn.addEventListener('click', handleEndTurnEarly);
        }
        if(simulationPauseBtn) simulationPauseBtn.addEventListener('click', toggleSimulationPause);
        if(playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                if (gameOverOverlay) gameOverOverlay.classList.add('hidden');
                if (setupScreen) setupScreen.classList.replace('hidden', 'active');
                if (gameContainer) gameContainer.classList.replace('active', 'hidden');
                document.body.style.alignItems = 'center'; document.body.style.justifyContent = 'center';
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
            apCancelBtn.addEventListener('click', clearActionState);
        }
    }

    function renderBank() {
        if (!gemBankContainer) return;
        gemBankContainer.innerHTML = '';
        [...GEM_TYPES, GOLD].forEach(gemType => {
            const count = bank[gemType];
            if (count >= 0) {
                const gemEl = createGemElement(gemType, count, true);
                gemEl.dataset.gemType = gemType;
                gemEl.title = `${count} ${gemType} available`;
                gemEl.removeEventListener('click', handleGemClickWrapper); 
                gemEl.addEventListener('click', handleGemClickWrapper);
                if (gemType === GOLD || count <= 0) {
                     gemEl.classList.add('not-selectable');
                     if (count <= 0) gemEl.title = `No ${gemType} gems available`;
                     if (gemType === GOLD) gemEl.title += ' (Cannot take directly)';
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
            container.innerHTML = '';
            visibleCards[level].forEach((cardData, index) => {
                const cardEl = createCardElement(cardData, level, index);
                if (cardData) {
                    cardEl.dataset.cardId = cardData.id;
                    cardEl.dataset.level = level;
                    cardEl.removeEventListener('click', handleVisibleCardClickWrapper); 
                    cardEl.addEventListener('click', handleVisibleCardClickWrapper);
                }
                container.appendChild(cardEl);
            });
            renderDeckCount(level);
            if(deckElements[level]) deckElements[level].classList.remove('selected');
        }
        updateClickableState();
    }

    function renderNobles() {
        if (!noblesContainer) return;
        noblesContainer.innerHTML = '';
        if (availableNobles && availableNobles.length > 0) {
            availableNobles.forEach(nobleData => {
                noblesContainer.appendChild(createNobleElement(nobleData));
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
        updateClickableState();
    }

    function renderPlayerArea(playerId) {
        const player = players.find(p => p.id === playerId);
        const playerAreaEl = document.getElementById(`player-area-${playerId}`);
        if (player && playerAreaEl) {
            const tempDiv = createPlayerAreaElement(player); 
            playerAreaEl.innerHTML = tempDiv.innerHTML;

            playerAreaEl.querySelectorAll('.reserved-card-small').forEach(rc => {
                rc.removeEventListener('click', handleReservedCardClickWrapper); 
                rc.addEventListener('click', handleReservedCardClickWrapper);
            });

             if (player.type === 'ai') {
                 const badge = document.createElement('span');
                 badge.classList.add('ai-badge');
                 badge.textContent = 'AI';
                  if(!playerAreaEl.querySelector('.ai-badge')){
                       const header = playerAreaEl.querySelector('.player-header');
                       if (header) header.appendChild(badge);
                  }
             }
            highlightActivePlayer();
            updateClickableState();
        } else {
            console.error("Could not find player or player area to update:", playerId);
        }
    }

    function renderTimer() {
        if (!timerDisplay) return;
        timerDisplay.classList.remove('active-timer-pulse'); 

        if (isSimulationMode || gameSettings.timerMinutes <= 0 || turnDuration <= 0) {
            timerDisplay.textContent = "Off";
            timerDisplay.classList.remove('timer-low');
            return;
        }
        const currentPlayer = players[currentPlayerIndex];
        if (!currentPlayer || currentPlayer.type === 'ai' || gameTrulyFinished) {
             timerDisplay.textContent = "--:--";
             timerDisplay.classList.remove('timer-low');
             if(currentPlayer && currentPlayer.type === 'ai') stopTimer();
             return;
         }
        
        if (turnTimerInterval) { 
            timerDisplay.classList.add('active-timer-pulse');
        }

        const minutes = Math.floor(turnTimeRemaining / 60);
        const seconds = Math.floor(turnTimeRemaining % 60);
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        const isLow = turnTimeRemaining <= TIMER_LOW_THRESHOLD && turnTimeRemaining > 0;
        timerDisplay.classList.toggle('timer-low', isLow);
        if (isLow) { 
            timerDisplay.classList.remove('active-timer-pulse');
        }
        
        if (turnTimeRemaining <= 0 && !isLow) { 
            timerDisplay.classList.remove('timer-low');
        }
    }

    function renderSelectionInfo() {
        if (!apSelectionText || !apSelectedGemsDisplay || !apCardPreview || !apActionButtons || !apCancelBtn) {
            return;
        }
    
        apSelectedGemsDisplay.innerHTML = '';
        apCardPreview.innerHTML = '';
    
        const dynamicButtons = apActionButtons.querySelectorAll('button:not(#ap-cancel-btn)');
        dynamicButtons.forEach(btn => btn.remove());
    
        apCancelBtn.classList.toggle('hidden', !currentAction);
    
        if (currentAction === 'SELECTING_GEMS' && selectedGemTypes.length > 0) {
            apSelectionText.textContent = 'Selected Gems:';
            selectedGemTypes.forEach(type => {
                const gemEl = createGemElement(type, 1, false); 
                apSelectedGemsDisplay.appendChild(gemEl);
            });
    
            const btn = document.createElement('button');
            btn.classList.add('btn');
            btn.textContent = 'Confirm Take Tokens';
            btn.onclick = performTakeGems;
            const isValid = validateTakeGemsSelection();
            btn.disabled = !isValid;
            if (isValid) btn.classList.add('action-possible', 'btn-confirm'); else btn.classList.add('btn-secondary');
            apActionButtons.insertBefore(btn, apCancelBtn); 
    
        } else if (currentAction === 'SELECTING_CARD' && selectedCard) {
            apSelectionText.textContent = selectedCard.type === 'deck' ? 'Selected Deck:' : 'Selected Card:';
            let cardData = null;
            if (selectedCard.id) cardData = getCardById(selectedCard.id); 
            if (!cardData && selectedCard.type === 'deck') cardData = getDeckCardPlaceholder(selectedCard.level);
            
            if (selectedCard.type === 'reserved' && selectedCard.ownerId === currentPlayerIndex) {
                const cPlayer = players[currentPlayerIndex];
                cardData = cPlayer.reservedCards.find(c => c.id === selectedCard.id);
            }


            if (cardData) {
                if (selectedCard.type === 'deck') {
                    const deckPreviewEl = document.createElement('div');
                    deckPreviewEl.classList.add('ap-deck-preview');
                    deckPreviewEl.textContent = `Deck L${cardData.level}`;
                    apCardPreview.appendChild(deckPreviewEl);
                } else if (cardData.id && cardData.color !== 'deck') { 
                    const previewCardEl = createCardElement(cardData, cardData.level);
                    previewCardEl.classList.add('ap-previewed-card'); 
                    apCardPreview.appendChild(previewCardEl);
                } else {
                    apSelectionText.textContent = 'Invalid Card Data';
                }
    
                const activePlayer = players[currentPlayerIndex];
                const isHumanTurn = activePlayer && activePlayer.type === 'human' && !isSimulationMode && !gameTrulyFinished && !isOverlayVisible();
    
                if (isHumanTurn) {
                    const canReserveCheck = activePlayer.reservedCards.length < MAX_RESERVED_CARDS;
                    const { canAfford, goldNeeded } = (selectedCard.type === 'visible' || selectedCard.type === 'reserved') && cardData && cardData.id && cardData.color !== 'deck'
                        ? canAffordCard(activePlayer, cardData)
                        : { canAfford: false, goldNeeded: 0 };
    
                    // Only show purchase button if it's the current player's reserved card or a visible card
                    if (((selectedCard.type === 'visible') || (selectedCard.type === 'reserved' && selectedCard.ownerId === currentPlayerIndex)) && cardData && cardData.id && cardData.color !== 'deck') {
                        const purchaseBtn = document.createElement('button');
                        purchaseBtn.classList.add('btn', 'btn-primary');
                        purchaseBtn.textContent = 'Purchase Card';
                        purchaseBtn.onclick = performPurchaseCard;
                        purchaseBtn.disabled = !canAfford;
                        if (canAfford) purchaseBtn.classList.add('action-possible');
                        else purchaseBtn.title = `Cannot afford (need ${goldNeeded} more gold or equivalent gems)`;
                        apActionButtons.insertBefore(purchaseBtn, apCancelBtn);
                    }
    
                    // Only show reserve button for visible cards or decks
                    if (selectedCard.type === 'visible' || selectedCard.type === 'deck') {
                        const reserveBtn = document.createElement('button');
                        reserveBtn.classList.add('btn', 'btn-secondary');
                        reserveBtn.textContent = 'Reserve Card';
                        reserveBtn.onclick = performReserveCard;
                        const isDeckEmpty = (selectedCard.type === 'deck' && decks[selectedCard.level].length === 0);
                        const disableReserve = !canReserveCheck || isDeckEmpty;
                        reserveBtn.disabled = disableReserve;
                        if (!disableReserve) reserveBtn.classList.add('action-possible');
    
                        if (!canReserveCheck) reserveBtn.title = "Reservation limit reached (3)";
                        if (isDeckEmpty) reserveBtn.title = `Level ${selectedCard.level} deck is empty`;
                        apActionButtons.insertBefore(reserveBtn, apCancelBtn);
                    }
                }
            } else {
                apSelectionText.textContent = 'Invalid Card Selection';
            }
        } else {
            apSelectionText.textContent = 'Select gems or a card.';
        }
    }


     function renderDeckCount(level) {
        if (deckCounts[level] && deckElements[level]) {
            const count = decks[level].length;
            deckCounts[level].textContent = count;
            deckElements[level].classList.toggle('empty', count === 0);
            deckElements[level].title = `${count} cards left in Level ${level} deck`;
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
        } else { 
            gemEl.style.cursor = 'default';
        }
        return gemEl;
    }

    function createCardElement(cardData, level, index = -1) {
        const cardEl = document.createElement('div');
        if (!cardData) {
            cardEl.classList.add('card', 'empty-slot');
            cardEl.textContent = 'Empty';
            return cardEl;
        }
        cardEl.classList.add('card', `card-border-${cardData.color}`);
        cardEl.dataset.level = level;
        if (index !== -1) cardEl.dataset.index = index;
        cardEl.title = formatCardCostForTitle(cardData);
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
        return cardEl;
    }

    function createSmallReservedCardElement(cardData) {
        const cardEl = document.createElement('div');
        cardEl.classList.add('reserved-card-small', `card-border-${cardData.color}`);
        cardEl.dataset.cardId = cardData.id; 
        cardEl.title = formatCardCostForTitle(cardData);
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
        nobleEl.title = formatNobleInfoForTitle(nobleData);
    
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
        nobleEl.appendChild(artworkAreaDiv);
    
        const requirementsFooterDiv = document.createElement('div');
        requirementsFooterDiv.classList.add('noble-requirements-footer');
    
        GEM_TYPES.forEach(gemType => {
            const req = nobleData.requirements[gemType];
            if (req > 0) {
                const reqItem = document.createElement('div');
                reqItem.classList.add('req-item');
                reqItem.textContent = req; 
    
                const reqGem = document.createElement('span');
                reqGem.classList.add('req-gem', `gem-${gemType}`);
                reqItem.appendChild(reqGem); 
    
                requirementsFooterDiv.appendChild(reqItem);
            }
        });
        nobleEl.appendChild(requirementsFooterDiv);
    
        return nobleEl;
    }


    function createPlayerAreaElement(player) {
        const playerDiv = document.createElement('div');
        playerDiv.classList.add('player-area');
        playerDiv.classList.add(player.colorTheme);
        playerDiv.id = `player-area-${player.id}`;

        const header = document.createElement('div');
        header.classList.add('player-header');
        const nameSpan = document.createElement('span');
        nameSpan.classList.add('player-name');
        nameSpan.textContent = player.name;
        const scoreSpan = document.createElement('span');
        scoreSpan.classList.add('player-score');
        scoreSpan.textContent = `VP: ${player.score}`;
        scoreSpan.title = `${player.score} Victory Points`;
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
                gemsContainer.appendChild(createGemElement(gemType, count, true));
            }
        });
        if (player.gems[GOLD] > 0) {
            gemsContainer.appendChild(createGemElement(GOLD, player.gems[GOLD], true));
        }
        const totalGemsSpan = document.createElement('span');
        totalGemsSpan.classList.add('total-gems-indicator');
        const totalGems = totalNonGoldGems + player.gems[GOLD];
        totalGemsSpan.textContent = `Total: ${totalGems}/${MAX_GEMS_PLAYER}`;
        totalGemsSpan.title = `${totalNonGoldGems} regular + ${player.gems[GOLD]} gold = ${totalGems} total`;
        if (totalGems > MAX_GEMS_PLAYER) {
             totalGemsSpan.style.color = 'var(--text-error)';
             totalGemsSpan.style.fontWeight = 'bold';
        }
        gemsContainer.appendChild(totalGemsSpan);

        const bonusHeader = document.createElement('h4');
        bonusHeader.textContent = 'Bonuses';
        const bonusContainer = document.createElement('div');
        bonusContainer.classList.add('player-cards');
        let hasBonuses = false;
        GEM_TYPES.forEach(gemType => {
            const count = player.bonuses[gemType];
            if (count > 0) {
                hasBonuses = true;
                const bonusEl = document.createElement('div');
                bonusEl.classList.add('player-card-count', `gem-${gemType}`);
                bonusEl.textContent = count;
                bonusEl.title = `${count} ${gemType} bonus (discount)`;
                bonusContainer.appendChild(bonusEl);
            }
        });
        if (!hasBonuses) bonusContainer.innerHTML = '<span class="no-items">None</span>';

        const reservedHeader = document.createElement('h4');
        reservedHeader.textContent = `Reserved (${player.reservedCards.length}/${MAX_RESERVED_CARDS})`;
        const reservedContainer = document.createElement('div');
        reservedContainer.classList.add('reserved-cards-container');
        if (player.reservedCards.length > 0) {
            player.reservedCards.forEach(cardData => {
                const reservedCardEl = createSmallReservedCardElement(cardData);
                reservedCardEl.removeEventListener('click', handleReservedCardClickWrapper); 
                reservedCardEl.addEventListener('click', handleReservedCardClickWrapper);
                reservedContainer.appendChild(reservedCardEl);
            });
        } else {
            reservedContainer.innerHTML = '<span class="no-items">None reserved</span>';
            reservedContainer.style.textAlign = 'center';
        }

        const noblesHeader = document.createElement('h4');
        noblesHeader.textContent = `Nobles (${player.nobles.length})`;
        const playerNoblesContainer = document.createElement('div');
        playerNoblesContainer.classList.add('nobles-container', 'player-nobles-display');
        if (player.nobles.length > 0) {
             player.nobles.forEach(nobleData => {
                const nobleEl = createNobleElement(nobleData);
                nobleEl.style.transform = 'scale(0.7)'; 
                playerNoblesContainer.appendChild(nobleEl);
             });
        } else {
            playerNoblesContainer.innerHTML = '<span class="no-items">None</span>';
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
        if (gemEl.classList.contains('not-selectable') && !gemEl.classList.contains('selected')) return;
        
        const gemType = gemEl.dataset.gemType;
         if (!isGemClickable(gemType, gemEl.classList.contains('selected'))) {
            return;
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
        } else {
           console.error("Visible card click error: Missing cardId or level", cardEl.dataset);
        }
    }

    function handleReservedCardClickWrapper(event) {
        const player = players[currentPlayerIndex];
        if (!player || player.type === 'ai' || isSimulationMode || isOverlayVisible() || gameTrulyFinished) return;

        const cardEl = event.currentTarget;
        // Allow clicking if it's already selected OR if it's not marked 'not-selectable'
        // This means, if it's selectable, OR if it's already selected, proceed.
        if (cardEl.classList.contains('not-selectable') && !(selectedCard && selectedCard.element === cardEl)) { 
            return;
        }

        const cardId = cardEl.dataset.cardId;
        if (cardId) {
            handleReservedCardClick(cardId, cardEl);
        } else {
            console.error("Reserved card wrapper: Missing cardId on element", cardEl);
        }
    }

    function handleGemClick(gemType, clickedGemEl) {
        if (gemType === GOLD) return;

        if (currentAction === 'SELECTING_CARD' && selectedCard) {
            clearCardSelectionState(); 
        }
        currentAction = 'SELECTING_GEMS';

        const isSelectedVisual = clickedGemEl.classList.contains('selected');
        
        if (isSelectedVisual) { 
            const deselectedType = clickedGemEl.dataset.gemType;
            selectedGemTypes = selectedGemTypes.filter(g => g !== deselectedType);
            gemBankContainer.querySelectorAll(`.gem[data-gem-type='${deselectedType}'].selected`).forEach(el => {
                el.classList.remove('selected');
            });
            if (selectedGemTypes.length === 0) currentAction = null;
        } else { 
            if (selectedGemTypes.length === 0) {
                selectedGemTypes.push(gemType);
                clickedGemEl.classList.add('selected');
            } else if (selectedGemTypes.length === 1) {
                if (selectedGemTypes[0] === gemType && bank[gemType] >= MIN_GEMS_FOR_TAKE_TWO) {
                    selectedGemTypes.push(gemType);
                    clickedGemEl.classList.add('selected'); 
                } else if (selectedGemTypes[0] !== gemType && bank[gemType] >= 1) {
                    selectedGemTypes.push(gemType);
                    clickedGemEl.classList.add('selected');
                }
            } else if (selectedGemTypes.length === 2) {
                if (new Set(selectedGemTypes).size === 2 && !selectedGemTypes.includes(gemType) && bank[gemType] >= 1) {
                    selectedGemTypes.push(gemType);
                    clickedGemEl.classList.add('selected');
                }
            }
        }
        renderSelectionInfo();
        updateClickableState();
    }

    function handleCardClick(type, level, cardId, cardEl) {
        if (currentAction === 'SELECTING_GEMS' && selectedGemTypes.length > 0) {
            clearGemSelectionState(); 
        }
        currentAction = 'SELECTING_CARD'; 

        if (selectedCard && selectedCard.element === cardEl) {
            clearActionState(); // Deselect if clicking the same card
            return;
        }
            
        if (selectedCard && selectedCard.element) { // Deselect previous card
            selectedCard.element.classList.remove('selected');
        }
        
        selectedCard = { type, level, id: cardId, element: cardEl };
        cardEl.classList.add('selected');
        
        renderSelectionInfo(); 
        updateClickableState(); 
    }
    
    function handleDeckClick(level) {
        const deckEl = deckElements[level];

        if (currentAction === 'SELECTING_GEMS' && selectedGemTypes.length > 0) {
            clearGemSelectionState();
        }
        currentAction = 'SELECTING_CARD';
    
        if (selectedCard && selectedCard.element === deckEl) {
            clearActionState();
            return;
        }
        
        const player = players[currentPlayerIndex];
        if (!player) return;

        if (player.reservedCards.length >= MAX_RESERVED_CARDS && !(selectedCard && selectedCard.element === deckEl) ) {
            let purchasePossibleFromCurrent = false;
            if (selectedCard && selectedCard.type !== 'deck') {
                const currentCardData = getCardById(selectedCard.id);
                if(currentCardData) {
                    purchasePossibleFromCurrent = canAffordCard(player, currentCardData).canAfford;
                }
            }
            if (!purchasePossibleFromCurrent) {
                updateLog("Reserve limit reached (3). Cannot select deck for reservation unless purchasing current card first.");
            }
             return; 
        }
    
        if (selectedCard && selectedCard.element) {
            selectedCard.element.classList.remove('selected');
        }
        
        const deckId = `deck-${level}`;
        selectedCard = { type: 'deck', level, id: deckId, element: deckEl };
        deckEl.classList.add('selected');
    
        renderSelectionInfo();
        updateClickableState();
    }
    
    function handleReservedCardClick(cardId, cardEl) {
        if (currentAction === 'SELECTING_GEMS' && selectedGemTypes.length > 0) {
            clearGemSelectionState();
        }
        currentAction = 'SELECTING_CARD';

        if (selectedCard && selectedCard.element === cardEl) {
            clearActionState();
            return;
        }

        const playerArea = cardEl.closest('.player-area');
        if (!playerArea) return;
        const ownerId = parseInt(playerArea.id.split('-')[2], 10);
        const ownerPlayer = players.find(p => p.id === ownerId);
        if (!ownerPlayer) return;
    
        const cardData = ownerPlayer.reservedCards.find(c => c.id === cardId);
        if (!cardData) { 
            renderPlayerArea(ownerId); 
            return; 
        }
            
        if (selectedCard && selectedCard.element) {
            selectedCard.element.classList.remove('selected');
        }
        
        selectedCard = { type: 'reserved', level: cardData.level, id: cardId, element: cardEl, ownerId: ownerId };
        
        document.querySelectorAll('.card.selected, .deck.selected').forEach(el => {
            el.classList.remove('selected');
        });
        cardEl.classList.add('selected');
    
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
         const iconEl = simulationPauseBtn.querySelector('svg');
         const textEl = simulationPauseBtn.querySelector('.btn-text-placeholder');

         if (isSimulationPaused) {
             if (iconEl) iconEl.outerHTML = SVG_ICONS.play;
             if (textEl) textEl.textContent = "Resume Sim";
             if(simulationStatusSpan) simulationStatusSpan.textContent = "Paused";
             updateLog("Simulation paused."); stopTimer(); updateClickableState();
         } else {
             if (iconEl) iconEl.outerHTML = SVG_ICONS.pause;
             if (textEl) textEl.textContent = "Pause Sim";
             if(simulationStatusSpan) simulationStatusSpan.textContent = "Running";
             updateLog("Simulation resumed."); updateClickableState();
             if (!isOverlayVisible() && !gameTrulyFinished) setTimeout(startTurn, 0);
         }
    }

    function validateTakeGemsSelection() {
        const gems = selectedGemTypes; const count = gems.length; const uniqueCount = new Set(gems).size;
        if (count === 0) return false;
        if (count === 3 && uniqueCount === 3) return gems.every(type => bank[type] >= 1);
        if (count === 2 && uniqueCount === 1) return bank[gems[0]] >= MIN_GEMS_FOR_TAKE_TWO;
        if (count === 2 && uniqueCount === 2) return gems.every(type => bank[type] >= 1);
        if (count === 1) return bank[gems[0]] >= 1;
        return false;
    }

    function performTakeGems() {
        if (!validateTakeGemsSelection()) { updateLog("Invalid gem selection. Action cancelled."); clearActionState(); return; }
        const player = players[currentPlayerIndex]; const gemsTakenLog = {};
        const isTakeTwo = selectedGemTypes.length === 2 && new Set(selectedGemTypes).size === 1;
        player.stats.gemTakeActions++; if (isTakeTwo) player.stats.take2Actions++; else player.stats.take3Actions++; 
        selectedGemTypes.forEach(type => {
            if (bank[type] > 0) {
                bank[type]--; player.gems[type]++; gemsTakenLog[type] = (gemsTakenLog[type] || 0) + 1; player.stats.gemsTaken[type]++;
            } else { updateLog(`Error: Bank empty for ${type}! Action may be incomplete.`); clearActionState(); renderBank(); renderPlayerArea(player.id); endTurn('TAKE_GEMS_ERROR'); return; }
        });
        const gemString = Object.entries(gemsTakenLog).map(([t, c]) => `${c} ${t}`).join(', ');
        updateLog(`${player.name} (${player.type.toUpperCase()}) took ${gemString}.`);
        logActionToHistory(player, 'TAKE_GEMS', { gems: [...selectedGemTypes] });
        clearActionState(); renderBank(); renderPlayerArea(player.id); endTurn('TAKE_GEMS');
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
        } else { 
            const cardId = selectedCard.id; const cardIndex = visibleCards[level].findIndex(c => c && c.id === cardId);
            if (cardIndex !== -1 && visibleCards[level][cardIndex]) {
                reservedCardData = visibleCards[level][cardIndex]; cardSourceDescription = `L${level} ${reservedCardData.color} from board`;
                player.stats.boardReservations[level]++; visibleCards[level][cardIndex] = null; drawCard(level, cardIndex); cardReplaced = true;
            } else { updateLog("Cannot reserve: Selected card is no longer available."); clearActionState(); renderCards(); return; }
        }
        player.reservedCards.push(reservedCardData); player.stats.reserveActions++;
        player.stats.cardsReservedTotalCount++; player.stats.allReservedCardsData.push(JSON.parse(JSON.stringify(reservedCardData)));
        let gotGold = false;
        if (bank[GOLD] > 0) { player.gems[GOLD]++; bank[GOLD]--; gotGold = true; player.stats.goldTaken++; }
        updateLog(`${player.name} (${player.type.toUpperCase()}) reserved ${cardSourceDescription}${gotGold ? " and took 1 gold." : "."}`);
        logActionToHistory(player, 'RESERVE_CARD', { cardId: reservedCardData.id, source: cardSourceType, level: reservedCardData.level, color: reservedCardData.color, gotGold: gotGold });
        clearActionState(); if (gotGold) renderBank(); if (cardReplaced) renderCards(); else renderDeckCount(level);
        renderPlayerArea(player.id); endTurn('RESERVE');
    }

    function performPurchaseCard() {
        if (!selectedCard || (selectedCard.type !== 'visible' && selectedCard.type !== 'reserved')) { updateLog("No valid card selected to purchase."); clearActionState(); return; }
        const player = players[currentPlayerIndex]; const cardId = selectedCard.id;
        let purchasedCardData = null; let cardSource = selectedCard.type; let cardIndex = -1; let isFromReserve = (cardSource === 'reserved');

        if (cardSource === 'visible') { 
            cardIndex = visibleCards[selectedCard.level]?.findIndex(c => c && c.id === cardId); 
            if (cardIndex !== -1) purchasedCardData = visibleCards[selectedCard.level][cardIndex]; 
        } else { 
            if (selectedCard.ownerId !== player.id) {
                updateLog("Cannot purchase reserved card of another player."); 
                clearActionState();
                return;
            }
            cardIndex = player.reservedCards.findIndex(c => c.id === cardId); 
            if (cardIndex !== -1) purchasedCardData = player.reservedCards[cardIndex]; 
        }

        if (!purchasedCardData) { updateLog("Cannot purchase: Card not found or unavailable."); clearActionState(); renderCards(); renderPlayerArea(player.id); return; }
        const { canAfford, goldNeeded, effectiveCost } = canAffordCard(player, purchasedCardData);
        if (!canAfford) { updateLog(`Cannot purchase: Not enough resources. Need ${goldNeeded} more gold or equivalent gems.`); return; }
        let goldSpent_this_turn = 0; let gemsSpent_this_turn = { white: 0, blue: 0, green: 0, red: 0, black: 0 }; let totalResourceCost = 0; let paymentError = false;
        GEM_TYPES.forEach(gemType => {
             if (paymentError) return; const costToPay = effectiveCost[gemType]; totalResourceCost += costToPay;
            const playerHas = player.gems[gemType]; const useFromPlayerGems = Math.min(costToPay, playerHas); const needsGoldForThisColor = costToPay - useFromPlayerGems;
            if (useFromPlayerGems > 0) { player.gems[gemType] -= useFromPlayerGems; bank[gemType] += useFromPlayerGems; gemsSpent_this_turn[gemType] += useFromPlayerGems; }
            if (needsGoldForThisColor > 0) { if (player.gems[GOLD] >= needsGoldForThisColor) { player.gems[GOLD] -= needsGoldForThisColor; bank[GOLD] += needsGoldForThisColor; goldSpent_this_turn += needsGoldForThisColor; } else paymentError = true; }
        });
        if (paymentError) { updateLog("Error during payment calculation. Action cancelled."); renderBank(); renderPlayerArea(player.id); clearActionState(); return; }
        player.cards.push(purchasedCardData); player.score += purchasedCardData.vp; player.bonuses[purchasedCardData.color]++;
        player.stats.purchaseActions++; player.stats.cardsPurchasedCount++; player.stats.cardsPurchasedByLevel[purchasedCardData.level]++; player.stats.cardsPurchasedByColor[purchasedCardData.color]++;
        if (isFromReserve) player.stats.purchasedFromReserveCount++; else player.stats.purchasedFromBoardCount++;
        if (totalResourceCost === 0) player.stats.selfSufficientPurchases++; player.stats.goldSpent += goldSpent_this_turn;
        GEM_TYPES.forEach(type => player.stats.gemsSpent[type] += gemsSpent_this_turn[type]);
        if (player.stats.firstCardPurchasedTurn[purchasedCardData.level] === null) player.stats.firstCardPurchasedTurn[purchasedCardData.level] = turnNumber;
        let cardReplaced = false;
        if (cardSource === 'visible') { visibleCards[purchasedCardData.level][cardIndex] = null; drawCard(purchasedCardData.level, cardIndex); cardReplaced = true; }
        else player.reservedCards.splice(cardIndex, 1);
        updateLog(`${player.name} (${player.type.toUpperCase()}) purchased L${purchasedCardData.level} ${purchasedCardData.color} card${isFromReserve ? ' (from reserve)' : ''}${goldSpent_this_turn > 0 ? ` (used ${goldSpent_this_turn} gold)` : ''}.`);
        logActionToHistory(player, 'PURCHASE_CARD', { cardId: purchasedCardData.id, source: cardSource, level: purchasedCardData.level, color: purchasedCardData.color, vp: purchasedCardData.vp, costPaid: JSON.parse(JSON.stringify(gemsSpent_this_turn)), goldUsed: goldSpent_this_turn });
        clearActionState(); renderBank(); if (cardReplaced) renderCards(); renderPlayerArea(player.id); endTurn('PURCHASE');
    }

    function handleConfirmReturnGems(player, gemsToReturnCount, callback) {
        const selectedElements = returnGemsPlayerDisplay.querySelectorAll('.gem.selected[data-return-gem-type]');
        if (selectedElements.length !== gemsToReturnCount) { updateLog(`Please select exactly ${gemsToReturnCount} non-gold tokens to return.`); return; }
        executeReturnGems(player, selectedElements, callback);
    }

     function executeReturnGems(player, gemsElementsToReturn, callback) {
        const returnedCounts = {}; const returnedGemTypes = [];
        gemsElementsToReturn.forEach(gemEl => {
            const type = gemEl.dataset.returnGemType;
            if (type && player.gems[type] > 0) {
                player.gems[type]--; bank[type]++; returnedCounts[type] = (returnedCounts[type] || 0) + 1;
                returnedGemTypes.push(type); player.stats.gemsReturnedOverLimit[type]++;
            }
        });
        const returnString = Object.entries(returnedCounts).map(([type, count]) => `${count} ${type}`).join(', ');
        updateLog(`Player ${player.name} (${player.type.toUpperCase()}) returned ${returnString}.`);
        logActionToHistory(player, 'RETURN_GEMS', { returnedGems: returnedCounts });
        returnGemsOverlay.classList.add('hidden'); renderBank(); renderPlayerArea(player.id);
        if (callback) callback();
     }

    function awardNoble(player, nobleData) {
         const nobleIndex = availableNobles.findIndex(n => n.id === nobleData.id);
         if (nobleIndex === -1) { updateLog(`Noble ${nobleData.id} was no longer available for ${player.name}.`); return false; }
        updateLog(`Noble (${nobleData.vp} VP) visits Player ${player.name} (${player.type.toUpperCase()}).`);
        player.nobles.push(nobleData); player.score += nobleData.vp; player.stats.noblesAcquiredTurn[nobleData.id] = turnNumber;
        availableNobles.splice(nobleIndex, 1);
        logActionToHistory(player, 'NOBLE_VISIT', { nobleId: nobleData.id, vp: nobleData.vp });
        return true;
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
        const currentRealPlayer = players[currentPlayerIndex];
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
        const player = gameState.currentPlayer;
        try {
            switch (action.action) {
                case 'TAKE_GEMS':
                    if (!action.gems || !Array.isArray(action.gems) || action.gems.length === 0) return null; 
                    const gemCount = action.gems.length; const uniqueGems = new Set(action.gems);
                    if (!action.gems.every(g => GEM_TYPES.includes(g))) return null;

                    if (gemCount === 3) { if (uniqueGems.size !== 3 || !action.gems.every(g => gameState.bank[g] >= 1)) return null; }
                    else if (gemCount === 2) { 
                        if (uniqueGems.size === 1) { if (gameState.bank[action.gems[0]] < MIN_GEMS_FOR_TAKE_TWO) return null; }
                        else if (uniqueGems.size === 2) { if (!action.gems.every(g => gameState.bank[g] >=1)) return null;}
                        else return null; 
                    } else if (gemCount === 1) { if(gameState.bank[action.gems[0]] < 1) return null; }
                    else return null; 
                    return action;
                case 'RESERVE_CARD':
                     if (player.reservedCards.length >= MAX_RESERVED_CARDS || !action.source || (action.source !== 'visible' && action.source !== 'deck')) return null;
                     if (action.source === 'visible') { if (!action.cardId || !Object.values(gameState.visibleCards).flat().some(c => c && c.id === action.cardId)) return null; }
                     else { if (!action.level || ![1, 2, 3].includes(action.level) || gameState.deckCounts[action.level] <= 0) return null; }
                     return action;
                case 'PURCHASE_CARD':
                    if (!action.source || (action.source !== 'visible' && action.source !== 'reserved') || !action.cardId) return null;
                    let cardToPurchase = (action.source === 'visible') ? Object.values(gameState.visibleCards).flat().find(c => c && c.id === action.cardId) : player.reservedCards.find(c => c.id === action.cardId);
                    if (!cardToPurchase || !canAffordCard({ gems: player.gems, bonuses: player.bonuses }, cardToPurchase).canAfford) return null;
                    return action;
                default: return null;
            }
        } catch (validationError) { console.error("Error during AI action validation:", validationError, "Action:", action); return null; }
    }

    function executeAiAction(action) {
        const player = players[currentPlayerIndex];
        switch (action.action) {
            case 'TAKE_GEMS': selectedGemTypes = action.gems; performTakeGems(); break;
            case 'RESERVE_CARD':
                if (action.source === 'visible') {
                     const cardElement = document.querySelector(`.card[data-card-id='${action.cardId}']`);
                     if (cardElement) { const level = parseInt(cardElement.dataset.level, 10); selectedCard = { type: 'visible', level: level, id: action.cardId, element: cardElement }; performReserveCard(); } else executeFallbackAiAction(getGameStateForAI());
                } else {
                     const deckElement = deckElements[action.level]; if (deckElement) { selectedCard = { type: 'deck', level: action.level, id: `deck-${action.level}`, element: deckElement }; performReserveCard(); } else executeFallbackAiAction(getGameStateForAI());
                } break;
            case 'PURCHASE_CARD':
                 let cardElement = null; let cardData = null;
                 if (action.source === 'visible') {
                    cardElement = document.querySelector(`.card[data-card-id='${action.cardId}']`);
                    if (cardElement) { cardData = getCardById(action.cardId); if (cardData) { selectedCard = { type: 'visible', level: cardData.level, id: action.cardId, element: cardElement }; performPurchaseCard(); } else executeFallbackAiAction(getGameStateForAI()); } else executeFallbackAiAction(getGameStateForAI());
                 } else {
                      cardData = player.reservedCards.find(c => c.id === action.cardId); cardElement = document.querySelector(`#player-area-${player.id} .reserved-card-small[data-card-id='${action.cardId}']`);
                      if (cardData && cardElement) { selectedCard = { type: 'reserved', level: cardData.level, id: action.cardId, element: cardElement, ownerId: player.id }; performPurchaseCard(); } else executeFallbackAiAction(getGameStateForAI());
                 } break;
            default: executeFallbackAiAction(getGameStateForAI());
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
          const counts = availableToReturn.reduce((acc, type) => { acc[type] = (acc[type] || 0) + 1; return acc; }, {}); availableToReturn.sort((a, b) => counts[b] - counts[a]);
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
             if (chosenNoble && awardNoble(player, chosenNoble)) { renderNobles(); renderPlayerArea(player.id); }
         } catch (error) {
             console.error(`Error during AI noble choice for ${player.name}:`, error); updateLog(`Error during AI ${player.name}'s noble choice. Using fallback.`);
              let fallbackNoble = null; if (eligibleNobles.length > 0) { eligibleNobles.sort((a, b) => b.vp - a.vp); fallbackNoble = eligibleNobles[0]; if (fallbackNoble && awardNoble(player, fallbackNoble)){ renderNobles(); renderPlayerArea(player.id); } }
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
        console.log(`END TURN: Player ${currentPlayerIndex} (${players[currentPlayerIndex].name}). Action: ${actionType}. Turn: ${turnNumber}. Score: ${players[currentPlayerIndex].score}`);
        stopTimer(); const player = players[currentPlayerIndex]; player.stats.turnsTaken++;
        const currentNonGoldGems = GEM_TYPES.reduce((sum, type) => sum + player.gems[type], 0);
        const currentGoldGems = player.gems[GOLD] || 0; const currentTotalGems = currentNonGoldGems + currentGoldGems;
        player.stats.peakGemsHeld = Math.max(player.stats.peakGemsHeld, currentTotalGems);
        if (currentTotalGems === MAX_GEMS_PLAYER) player.stats.turnsEndedExactLimit++; else if (currentTotalGems < MAX_GEMS_PLAYER) player.stats.turnsEndedBelowLimit++;

        checkForNobleVisit(player, () => {
            checkForGemLimit(player, () => {
                const scoreJustReachedWinning = player.score >= WINNING_SCORE;
                if (scoreJustReachedWinning && player.stats.turnReached15VP === null) player.stats.turnReached15VP = turnNumber;

                const gameEndTriggeredThisTurn = checkAndSetGameOverCondition(player);
                if (gameEndTriggeredThisTurn) {
                    player.stats.triggeredGameEnd = true;
                    console.log(`Game end triggered by ${player.name}. Last player will be ${players[lastRoundPlayerIndex].name}`);
                }

                console.log(`isGameOverConditionMet: ${isGameOverConditionMet}, currentPlayerIndex: ${currentPlayerIndex}, lastRoundPlayerIndex: ${lastRoundPlayerIndex}`);
                if (isGameOverConditionMet && currentPlayerIndex === lastRoundPlayerIndex) {
                    console.log(`Final player (${player.name}) of the final round has completed their turn. Ending game.`);
                    updateLog(`--- Final Turn Completed by ${player.name} ---`);
                    endGame(); return;
                }

                currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
                if (currentPlayerIndex === 0 && !isGameOverConditionMet) turnNumber++;
                
                if (!gameTrulyFinished) {
                    updateLog(`Player ${players[currentPlayerIndex].name}'s turn (#${turnNumber}).`);
                    if (isSimulationMode && !isSimulationPaused) setTimeout(startTurn, 0); 
                    else if (!isSimulationMode) startTurn();
                } else { console.log("Game truly finished, not starting next turn."); updateClickableState(); }
            });
        });
    }

    function checkAndSetGameOverCondition(player) {
        if (!isGameOverConditionMet && player.score >= WINNING_SCORE) {
            isGameOverConditionMet = true;
            lastRoundPlayerIndex = (currentPlayerIndex - 1 + gameSettings.playerCount) % gameSettings.playerCount;
            updateLog(`--- Player ${player.name} (${player.type.toUpperCase()}) reached ${player.score} VP! Final round begins. Game ends after Player ${players[lastRoundPlayerIndex].name} completes their turn. ---`);
            console.log(`Game end condition met by Player ${player.id} (${player.name}). lastRoundPlayerIndex set to: ${lastRoundPlayerIndex} (${players[lastRoundPlayerIndex].name}).`);
            return true;
        }
        return false;
    }

    function checkForNobleVisit(player, callback) {
        const eligibleNobles = availableNobles.filter(noble => GEM_TYPES.every(gemType => (player.bonuses[gemType] || 0) >= (noble.requirements[gemType] || 0)));
        if (eligibleNobles.length === 0) { if (callback) callback(); }
        else if (eligibleNobles.length === 1) { if (awardNoble(player, eligibleNobles[0])) { renderNobles(); renderPlayerArea(player.id); } if (callback) callback(); }
        else { if (player.type === 'human') { updateLog(`Player ${player.name} qualifies for multiple nobles. Choose one.`); showNobleChoiceOverlay(player, eligibleNobles, callback); } else handleAiNobleChoice(player, eligibleNobles, callback); }
    }

    function showNobleChoiceOverlay(player, eligibleNobles, callback) {
        if (!nobleChoiceOptionsContainer || !nobleChoiceOverlay) return;
        nobleChoiceOptionsContainer.innerHTML = '';
        eligibleNobles.forEach(nobleData => {
            const nobleEl = createNobleElement(nobleData); nobleEl.classList.add('clickable');
            nobleEl.onclick = () => { handleNobleChoice(player, nobleData, callback); updateClickableState(); };
            nobleChoiceOptionsContainer.appendChild(nobleEl); });
        nobleChoiceOverlay.classList.remove('hidden'); updateClickableState();
    }

    function handleNobleChoice(player, chosenNoble, callback) {
        if (nobleChoiceOverlay) nobleChoiceOverlay.classList.add('hidden');
        if (awardNoble(player, chosenNoble)) { renderNobles(); renderPlayerArea(player.id); }
        if (callback) callback();
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
        GEM_TYPES.forEach(type => { for (let i = 0; i < player.gems[type]; i++) { const gemEl = createGemElement(type, 1, false); gemEl.classList.add('clickable'); gemEl.dataset.returnGemType = type; gemEl.onclick = () => toggleReturnGemSelection(gemEl, gemsToReturnCount); returnGemsPlayerDisplay.appendChild(gemEl); } });
        if (player.gems.gold > 0) { const goldEl = createGemElement(GOLD, player.gems.gold, true); goldEl.style.cssText = 'opacity:0.5; cursor:not-allowed; margin-left:10px; width:25px; height:25px;'; goldEl.title = "Gold tokens cannot be returned"; if (goldEl.querySelector('.gem-count')) goldEl.querySelector('.gem-count').style.fontSize = '0.7em'; returnGemsPlayerDisplay.appendChild(goldEl); }
        confirmReturnGemsBtn.disabled = true; confirmReturnGemsBtn.classList.remove('btn-primary'); confirmReturnGemsBtn.classList.add('btn-confirm'); 
        returnGemsSelectionDisplay.textContent = `Selected to return: 0 / ${gemsToReturnCount}`;
        confirmReturnGemsBtn.onclick = () => { handleConfirmReturnGems(player, gemsToReturnCount, callback); updateClickableState(); };
        returnGemsOverlay.classList.remove('hidden'); updateClickableState();
    }

    function toggleReturnGemSelection(gemEl, gemsToReturnCount) {
        gemEl.classList.toggle('selected'); const selectedElements = returnGemsPlayerDisplay.querySelectorAll('.gem.selected[data-return-gem-type]');
        const selectedCount = selectedElements.length; returnGemsSelectionDisplay.textContent = `Selected to return: ${selectedCount}/${gemsToReturnCount}`;
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
            const summary = document.createElement('summary'); summary.classList.add('player-result-header-detailed'); let rankSuffix = 'th'; if (rank === 1 && !isWinner && winners.length > 1) rankSuffix = 'st (Tied)'; else if (rank === 1) rankSuffix = 'st'; else if (rank === 2) rankSuffix = 'nd'; else if (rank === 3) rankSuffix = 'rd';
            summary.innerHTML = `<span class="player-rank">${isWinner ? '🏆' : ''} ${rank}${rankSuffix}</span> <span class="player-name-endgame">${p.name} ${p.type === 'ai' ? '[AI]' : ''} ${playerStats.isFirstPlayer ? '(P1)' : ''} ${playerStats.triggeredGameEnd ? '[Triggered End]' : ''}</span> <span class="player-score-endgame">${p.score} VP</span> <span class="player-summary-stats">(Cards: ${p.cards.length} | Turns: ${playerStats.turnsTaken})</span>`; playerEntryDiv.appendChild(summary);
            const detailsContainer = document.createElement('div'); detailsContainer.classList.add('player-result-details-grid'); const col1 = document.createElement('div'); col1.classList.add('stat-column');
            col1.innerHTML = `<div class="stat-category"><h4>VP Breakdown</h4><div class="stat-items"><span>Cards: ${vpFromCards} VP</span><span>Nobles: ${vpFromNobles} VP</span>${playerStats.turnReached15VP ? `<span>Reached ${WINNING_SCORE} VP: Turn ${playerStats.turnReached15VP}</span>` : ''}</div></div>`
                           + `<div class="stat-category"><h4>Purchased (${p.cards.length}) <span class="details-inline">(L1:${playerStats.cardsPurchasedByLevel[1]}/L2:${playerStats.cardsPurchasedByLevel[2]}/L3:${playerStats.cardsPurchasedByLevel[3]})</span></h4><div class="cards-summary purchased-cards-summary">${p.cards.length > 0 ? p.cards.map(card => createTinyCardElement(card).outerHTML).join('') : '<span class="no-items">None</span>'}</div><div class="stat-items sub-stats"><span>Avg VP/Card: ${avgVpPerCard}</span><span>From Reserve: ${playerStats.purchasedFromReserveCount} / Board: ${playerStats.purchasedFromBoardCount}</span><span>Free Purchases: ${playerStats.selfSufficientPurchases}</span></div></div>`
                           + `<div class="stat-category"><h4>Reserved (${p.reservedCards.length})</h4><div class="cards-summary reserved-cards-summary">${p.reservedCards.length > 0 ? p.reservedCards.map(card => createTinyCardElement(card).outerHTML).join('') : '<span class="no-items">None</span>'}</div></div>`
                           + `<details class="sub-details"><summary>Reservation History (${playerStats.cardsReservedTotalCount} Total)</summary><div class="stat-category inner-stat-category"><h4>All Reserved Cards (Ever)</h4><div class="cards-summary reserved-cards-summary">${playerStats.allReservedCardsData.length > 0 ? playerStats.allReservedCardsData.map(card => createTinyCardElement(card).outerHTML).join('') : '<span class="no-items">None</span>'}</div><div class="stat-items sub-stats"><span>Deck Res (L1/L2/L3): ${playerStats.deckReservations[1]}/${playerStats.deckReservations[2]}/${playerStats.deckReservations[3]}</span><span>Board Res (L1/L2/L3): ${playerStats.boardReservations[1]}/${playerStats.boardReservations[2]}/${playerStats.boardReservations[3]}</span><span>Purchase Rate: ${reservationSuccessRate}%</span></div></div></details>`
                           + `<div class="stat-category"><h4>Nobles (${p.nobles.length})</h4><div class="summary-items nobles-summary">${p.nobles.length > 0 ? p.nobles.map(noble => { const nobleEl = createNobleElement(noble); nobleEl.style.transform = 'scale(0.7)'; nobleEl.style.margin = '-5px'; return `<span title="Acquired Turn ${playerStats.noblesAcquiredTurn[noble.id] || '?'}">${nobleEl.outerHTML}</span>`; }).join('') : '<span class="no-items">None</span>'}</div></div>`; detailsContainer.appendChild(col1);
            const col2 = document.createElement('div'); col2.classList.add('stat-column');
            col2.innerHTML = `<div class="stat-category"><h4>Bonuses (${totalBonuses} Total)</h4><div class="summary-items bonuses-summary">${totalBonuses > 0 ? GEM_TYPES.map(type => { const count = p.bonuses[type] || 0; return count > 0 ? `<div class="player-card-count gem-${type}" title="${count} ${type} bonus">${count}</div>` : ''; }).join('') : '<span class="no-items">None</span>'}</div><div class="stat-items sub-stats"><span>Avg Bonus/Card: ${avgBonusPerCard}</span></div></div>`
                           + `<details class="sub-details"><summary>Token Management</summary><div class="stat-category inner-stat-category"><h4>Final Tokens Held</h4><div class="summary-items gems-summary small-gems">${[...GEM_TYPES, GOLD].map(type => { const count = p.gems[type] || 0; return count > 0 ? createGemElement(type, count, true).outerHTML : ''; }).join('') || '<span class="no-items">None</span>'}</div><h4>Token Flow (Cumulative)</h4><div class="stat-items sub-stats flow-stats"><span>Taken: ${createGemFlowString(playerStats.gemsTaken)} (${totalGemsTaken} total)</span><span>Gold Taken: ${playerStats.goldTaken}</span><span>Spent: ${createGemFlowString(playerStats.gemsSpent)} (${totalGemsSpent} total)</span><span>Gold Spent: ${playerStats.goldSpent} (${goldDependency}% of cost)</span><span>Returned (Limit): ${createGemFlowString(playerStats.gemsReturnedOverLimit)} (${totalGemsReturned} total)</span><span>Peak Held (Total): ${playerStats.peakGemsHeld}</span></div><h4>Token Actions</h4><div class="stat-items sub-stats"><span>Take 3 Actions: ${playerStats.take3Actions} (${percentTake3}%)</span><span>Take 2 Actions: ${playerStats.take2Actions} (${percentTake2}%)</span><span>Avg Tokens/Take Action: ${avgGemsPerTakeAction}</span></div><h4>Token Limit Interaction</h4><div class="stat-items sub-stats"><span>Turns Ended at Limit: ${playerStats.turnsEndedExactLimit}</span><span>Turns Ended Below Limit: ${playerStats.turnsEndedBelowLimit}</span></div></div></details>`
                           + `<div class="stat-category"><h4>Action Distribution (${totalActions} Total)</h4><div class="stat-items action-dist-stats"><span>Token Takes: ${actionDist.gem}%</span><span>Purchases: ${actionDist.purchase}%</span><span>Reserves: ${actionDist.reserve}%</span></div><div class="stat-items sub-stats"><span>Avg VP/Turn: ${avgVpPerTurn}</span></div></div>`; detailsContainer.appendChild(col2);
            playerEntryDiv.appendChild(detailsContainer); if(finalScoresDiv) finalScoresDiv.appendChild(playerEntryDiv);
        });
        if (winners.length > 1) { const tieMessage = document.createElement('p'); tieMessage.classList.add('tie-message'); tieMessage.textContent = `Tie between: ${winners.map(w => w.name).join(' & ')}! (Fewest cards purchased wins)`; if(finalScoresDiv) finalScoresDiv.appendChild(tieMessage); updateLog(`Game ended in a tie! Winner(s) determined by fewest cards.`); }
        else if (winners.length === 1) { updateLog(`Winner: ${winners[0].name} with ${winners[0].score} VP!`); } else { updateLog("Game ended. No winner determined?"); }
        updateClickableState(); if (gameOverOverlay) gameOverOverlay.classList.remove('hidden');
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
            }
        }
        selectedCard = null;
        if (apCardPreview) apCardPreview.innerHTML = ''; 
        if (currentAction === 'SELECTING_CARD') currentAction = null;
    }

    function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } return array; }
    function countOccurrences(arr, val) { return arr.reduce((count, current) => (current === val ? count + 1 : count), 0); }
    function getCardById(id) { 
        if (!id || typeof id !== 'string') return null; 
        for (let level = 1; level <= 3; level++) { 
            const card = visibleCards[level]?.find(c => c && c.id === id); 
            if (card) return JSON.parse(JSON.stringify(card)); 
        } 
        for (const p of players) { 
            const card = p.reservedCards?.find(c => c && c.id === id); 
            if (card) return JSON.parse(JSON.stringify(card)); 
        } 
        const allCardsCard = ALL_CARDS.find(c => c.id === id);
        if (allCardsCard) return JSON.parse(JSON.stringify(allCardsCard));

        return null; 
    }
    function getDeckCardPlaceholder(level) { return { level: level, color: 'deck', cost: {}, vp: 0, id: `deck-${level}` }; }
    function canAffordCard(player, cardData) { if (!player || !cardData || !cardData.cost) { return { canAfford: false, goldNeeded: 0, effectiveCost: {} }; } let goldNeeded = 0; const effectiveCost = {}; GEM_TYPES.forEach(gemType => { const cardCost = cardData.cost[gemType] || 0; const playerBonus = player.bonuses[gemType] || 0; const costAfterBonus = Math.max(0, cardCost - playerBonus); effectiveCost[gemType] = costAfterBonus; const playerHasGem = player.gems[gemType] || 0; if (playerHasGem < costAfterBonus) goldNeeded += costAfterBonus - playerHasGem; }); const playerHasGold = player.gems.gold || 0; const canAfford = playerHasGold >= goldNeeded; return { canAfford, goldNeeded, effectiveCost }; }
    function drawCard(level, index) { if (decks[level].length > 0) visibleCards[level][index] = decks[level].pop(); else visibleCards[level][index] = null; }
    function findNonSelectedBankGemElement(gemType, excludeElement = null) { const elements = gemBankContainer?.querySelectorAll(`.gem[data-gem-type="${gemType}"]`); if(!elements) return null; for (const el of elements) if (!el.classList.contains('selected') && el !== excludeElement) return el; return null; }
    function formatCardCostForTitle(cardData) { let title = `L${cardData.level} ${cardData.color} (${cardData.vp} VP)`; const costString = GEM_TYPES.map(type => ({ type, count: cardData.cost[type] || 0 })).filter(item => item.count > 0).map(item => `${item.count} ${item.type}`).join(', '); title += `\nCost: ${costString || 'Free'}`; return title; }
    function createTinyCardElement(cardData) { const cardEl = document.createElement('div'); if (!cardData) return cardEl; cardEl.classList.add('tiny-card', `card-border-${cardData.color}`); const costString = Object.entries(cardData.cost || {}).filter(([,c]) => c > 0).map(([t,c]) => `${c}${t.slice(0,1).toUpperCase()}`).join(', '); cardEl.title = `L${cardData.level} ${cardData.color} (${cardData.vp} VP)\nCost: ${costString || 'Free'}`; const vpSpan = document.createElement('span'); vpSpan.classList.add('tiny-card-vp'); vpSpan.textContent = cardData.vp > 0 ? cardData.vp : ''; const gemBonus = document.createElement('div'); gemBonus.classList.add('tiny-card-gem', `gem-${cardData.color}`); cardEl.appendChild(vpSpan); cardEl.appendChild(gemBonus); return cardEl; }
    function createGemFlowString(gemCounts) { return GEM_TYPES.map(type => ({ type, count: gemCounts[type] || 0 })).filter(item => item.count > 0).map(item => `<span class="gem-inline gem-${item.type}" title="${item.count} ${item.type}">${item.count}</span>`).join(' ') || '<span class="no-items">0</span>'; }
    
    function updateClickableState() {
        if (!players || players.length === 0 || (currentPlayerIndex >= players.length && !gameTrulyFinished) ) {
            return;
        }
        const player = players[currentPlayerIndex]; 
        const disableAllInteraction = gameTrulyFinished || isSimulationMode || isOverlayVisible() || (player && player.type === 'ai');
        
        const allPotentiallyInteractive = document.querySelectorAll(
            '#gem-bank .gem, #cards-area .card:not(.empty-slot), #cards-area .deck, .player-area .reserved-card-small, #end-turn-early-btn, #simulation-pause-btn, #ap-cancel-btn'
        );
        allPotentiallyInteractive.forEach(el => {
            const isPauseButton = el.id === 'simulation-pause-btn';
            const shouldBeDisabledOverall = disableAllInteraction && !(isPauseButton && isSimulationMode && !gameTrulyFinished);
            
            el.classList.toggle('not-selectable', shouldBeDisabledOverall);
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
            if (!isOverlayVisible() && currentAction) {
                // clearActionState called within startTurn/endTurn, avoid recursion here
            }
            document.querySelectorAll('.nobles-container .noble.clickable').forEach(el => el.style.pointerEvents = 'none');
            if (isSimulationMode && !gameTrulyFinished && simulationPauseBtn) {
                simulationPauseBtn.disabled = false;
                simulationPauseBtn.classList.remove('not-selectable');
            }
            return; 
        }

        document.querySelectorAll('.nobles-container .noble.clickable').forEach(el => el.style.pointerEvents = 'auto');
        const isHumanActiveTurn = player && player.type === 'human';

        gemBankContainer?.querySelectorAll('.gem').forEach(gemEl => {
            const gemType = gemEl.dataset.gemType;
            const isSelected = gemEl.classList.contains('selected');
            let clickable = isHumanActiveTurn ? isGemClickable(gemType, isSelected) : false;
            gemEl.classList.toggle('not-selectable', !clickable && !isSelected); 
        });

        document.querySelectorAll('#cards-area .card:not(.empty-slot), #cards-area .deck').forEach(el => {
             let disableSpecificInteraction = true;
             const isSelectedElement = selectedCard && selectedCard.element === el;
            
             if (isHumanActiveTurn) {
                 if (isSelectedElement) { 
                     disableSpecificInteraction = false;
                 } else if (currentAction === 'SELECTING_GEMS') {
                     disableSpecificInteraction = true;
                 } else { 
                     if (el.classList.contains('deck')) {
                         disableSpecificInteraction = el.classList.contains('empty') || (player.reservedCards.length >= MAX_RESERVED_CARDS);
                     } else if (el.classList.contains('card')) {
                         const cardData = getCardById(el.dataset.cardId);
                         const canAfford = cardData ? canAffordCard(player, cardData).canAfford : false;
                         // Can select to reserve if limit not reached, OR can select to buy if affordable
                         disableSpecificInteraction = !( (player.reservedCards.length < MAX_RESERVED_CARDS) || canAfford );
                     }
                 }
             }
             el.classList.toggle('not-selectable', disableSpecificInteraction);

             if (el.classList.contains('card') && !el.classList.contains('empty-slot')) {
                 const cardData = getCardById(el.dataset.cardId);
                 const canAfford = cardData ? canAffordCard(player, cardData).canAfford : false;
                 el.classList.toggle('not-affordable', !canAfford && !isSelectedElement);
                 el.classList.toggle('card-affordable-now', canAfford && !isSelectedElement);
             } else {
                  el.classList.remove('not-affordable', 'card-affordable-now');
             }
         });

        document.querySelectorAll(`.player-area .reserved-card-small`).forEach(cardEl => {
            let disableSpecificInteraction = true;
            const isSelectedElement = selectedCard && selectedCard.element === cardEl;
            const cardPlayerArea = cardEl.closest('.player-area');
            const cardPlayerId = cardPlayerArea ? parseInt(cardPlayerArea.id.split('-')[2], 10) : -1;

            if (isHumanActiveTurn) { // Only current player can truly interact for actions
                if (cardPlayerId === currentPlayerIndex) {
                    if (isSelectedElement) { // Can always deselect own selected card
                        disableSpecificInteraction = false;
                    } else if (currentAction === 'SELECTING_GEMS') { // If selecting gems, can't select cards
                        disableSpecificInteraction = true;
                    } else { 
                        // Can select any of own reserved cards to view/potentially buy
                        disableSpecificInteraction = false; 
                    }
                } else { // Other players' reserved cards are not selectable for action
                    disableSpecificInteraction = true;
                }
            }
            
            cardEl.classList.toggle('not-selectable', disableSpecificInteraction);
            
            if (cardPlayerId === currentPlayerIndex) {
                const cardData = player.reservedCards?.find(c => c.id === cardEl.dataset.cardId);
                const canAfford = cardData ? canAffordCard(player, cardData).canAfford : false;
                cardEl.classList.toggle('not-affordable', !canAfford && !isSelectedElement);
                cardEl.classList.toggle('card-affordable-now', canAfford && !isSelectedElement);
            } else {
                 cardEl.classList.remove('not-affordable', 'card-affordable-now');
            }
        });

        if (apCancelBtn) {
            const disableCancel = !currentAction || disableAllInteraction;
            apCancelBtn.disabled = disableCancel;
            apCancelBtn.classList.toggle('not-selectable', disableCancel);
        }
    }

    function isGemClickable(gemType, isSelectedVisual) { 
        if (bank[gemType] <= 0 || gemType === GOLD ) return false; // Removed: currentAction === 'SELECTING_CARD'
        
        if (isSelectedVisual) return true; 

        const currentSelection = selectedGemTypes; 
        const currentCount = currentSelection.length; 
        const currentUniqueCount = new Set(currentSelection).size; 
        
        if (currentCount === 0) return bank[gemType] >= 1;
        if (currentCount === 1) {
            const firstType = currentSelection[0];
            if (gemType === firstType) return bank[gemType] >= MIN_GEMS_FOR_TAKE_TWO; 
            return bank[gemType] >= 1; 
        }
        if (currentCount === 2) {
            if (currentUniqueCount === 1) return false; 
            return !currentSelection.includes(gemType) && bank[gemType] >= 1; 
        }
        return false; 
    }
    function highlightActivePlayer() { document.querySelectorAll('.player-area.active-player').forEach(el => el.classList.remove('active-player')); if (!gameTrulyFinished) { const activePlayerEl = document.getElementById(`player-area-${currentPlayerIndex}`); if (activePlayerEl) activePlayerEl.classList.add('active-player'); } }
    function updateLog(message) {
        if (!logMessagesDiv) return;
        const p = document.createElement('p');
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const turnPrefix = `[T${turnNumber}]`;
        p.textContent = `${timestamp} ${turnPrefix} ${message}`;
        
        p.classList.add('new-log-entry');
        logMessagesDiv.appendChild(p);
        logMessagesDiv.scrollTop = logMessagesDiv.scrollHeight;
        setTimeout(() => {
            p.classList.remove('new-log-entry');
        }, 500); 
    }
    function hideOverlays() { [returnGemsOverlay, gameOverOverlay, nobleChoiceOverlay, aiThinkingOverlay].forEach(overlay => overlay?.classList.add('hidden')); }
    function isOverlayVisible() { return [returnGemsOverlay, gameOverOverlay, nobleChoiceOverlay, aiThinkingOverlay].some(overlay => overlay && !overlay.classList.contains('hidden')); }
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
        renderTimer(); 
        timerDisplay.classList.add('active-timer-pulse'); 

        turnTimerInterval = setInterval(() => {
             const player = players[currentPlayerIndex]; 
             if (gameTrulyFinished || !player || player.type === 'ai' || isOverlayVisible() || (isSimulationMode && isSimulationPaused)) { 
                 stopTimer(); renderTimer(); return; 
             }
            turnTimeRemaining--; 
            renderTimer(); 
            if (turnTimeRemaining < 0) { 
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
        if(timerDisplay) timerDisplay.classList.remove('active-timer-pulse');
    }
    function showAiThinking(playerName) { if (!aiThinkingOverlay || !aiThinkingPlayerName) return; aiThinkingPlayerName.textContent = playerName ? `(${playerName})` : ''; aiThinkingOverlay.classList.remove('hidden'); }
    function hideAiThinking() { if (!aiThinkingOverlay) return; aiThinkingOverlay.classList.add('hidden'); }
    function logActionToHistory(player, actionType, details) { const logEntry = { turn: turnNumber, playerIndex: player.id, playerName: player.name, playerType: player.type, actionType: actionType, details: JSON.parse(JSON.stringify(details)) }; gameHistoryLog.push(logEntry); }
    function getThemeColorName(colorClass) { return THEME_COLOR_NAMES[colorClass] || colorClass.replace('player-color-','Theme '); }

    initializeApiKey();
    document.body.style.alignItems = 'center';
    document.body.style.justifyContent = 'center';
    updatePlayerCountSelection(gameSettings.selectedPlayerCount);
    setupEventListeners();
    const initialTimerValue = parseFloat(timerInput.value);
    if (timerPresetsContainer) {
        timerPresetsContainer.querySelectorAll('.btn-timer-preset').forEach(btn => {
            btn.classList.toggle('active', parseFloat(btn.dataset.value) === initialTimerValue);
        });
    }
    if (simulationSpeedContainer && simulationModeCheckbox) {
        simulationSpeedContainer.classList.toggle('hidden', !simulationModeCheckbox.checked);
    }
    renderSelectionInfo(); 
});