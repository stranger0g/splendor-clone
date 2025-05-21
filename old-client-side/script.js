document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const setupScreen = document.getElementById('setup-screen');
    const gameContainer = document.getElementById('game-container');
    const playerCountSelect = document.getElementById('player-count');
    const timerInput = document.getElementById('timer-input');
    const playerNamesDiv = document.getElementById('player-names');
    const simulationModeCheckbox = document.getElementById('simulation-mode');
    const simulationSpeedInput = document.getElementById('simulation-speed');
    const startGameBtn = document.getElementById('start-game-btn');
    const apiKeyStatusP = document.getElementById('api-key-status');
    const noblesContainer = document.querySelector('#nobles-area .nobles-container');
    const timerDisplay = document.getElementById('timer-display');
    const logMessagesDiv = document.getElementById('log-messages');
    const endTurnEarlyBtn = document.getElementById('end-turn-early-btn');
    const simulationPauseBtn = document.getElementById('simulation-pause-btn');
    const simulationStatusSpan = document.getElementById('simulation-status');
    const gemBankContainer = document.getElementById('gem-bank');
    const selectionInfoDiv = document.getElementById('selection-info');
    const selectedGemsDisplay = document.getElementById('selected-gems-display');
    const selectedCardDisplay = document.getElementById('selected-card-display');
    const dynamicActionButtonsContainer = document.getElementById('dynamic-action-buttons');
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

    // --- Game State Variables ---
    let players = [];
    let bank = {};
    let decks = { 1: [], 2: [], 3: [] };
    let visibleCards = { 1: [], 2: [], 3: [] };
    let availableNobles = [];
    let currentPlayerIndex = 0;
    let turnNumber = 1;
    let gameSettings = { playerCount: 4, timerMinutes: 1.5 };
    let isGameOverConditionMet = false;
    let gameTrulyFinished = false;
    let lastRoundPlayerIndex = -1;
    let turnTimerInterval = null;
    let turnTimeRemaining = 0;
    let turnDuration = 0; // In seconds
    let selectedGemTypes = [];
    let selectedCard = null; // { type: 'visible'|'reserved'|'deck', level: #, id: '...', element: ... }
    let currentAction = null; // 'SELECTING_GEMS', 'SELECTING_CARD'
    let gameHistoryLog = []; // Array to store action history
    let aiActionCounter = 0; // Debug counter for AI actions

    // --- Constants & Config ---
    const MAX_GEMS_PLAYER = 10;
    const MAX_RESERVED_CARDS = 3;
    const CARDS_PER_LEVEL_VISIBLE = 4;
    const WINNING_SCORE = 15;
    const TIMER_LOW_THRESHOLD = 10; // seconds
    const MIN_GEMS_FOR_TAKE_TWO = 4;
    const PLAYER_COLORS = ['player-color-1', 'player-color-2', 'player-color-3', 'player-color-4'];
    const THEME_COLOR_NAMES = { 'player-color-1': 'Red', 'player-color-2': 'Blue', 'player-color-3': 'Green', 'player-color-4': 'Yellow' };

    // --- AI Configuration ---
    let GEMINI_API_KEY = null;
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key='; // Base URL
    let isSimulationMode = false;
    let isSimulationPaused = false;
    let simulationTurnDelayMs = 200; // Default delay

    const AI_CONFIG = {
        isEnabled: false, // Will be true if key is provided
        requestTimeoutMs: 25000, // Generous timeout for complex prompts
        maxRetries: 2,
        thinkingIndicatorDelayMs: 300,
        logPrompts: false, // Set true for deep debugging
        logResponses: false, // Set true for deep debugging
    };

    // =========================================================================
    // INITIALIZATION & SETUP
    // =========================================================================

    function initializeApiKey() {
        const storedKey = localStorage.getItem('geminiApiKey'); // Try reading from localStorage

        if (storedKey) {
            // Key found in storage
            GEMINI_API_KEY = storedKey;
            console.log("Gemini API Key loaded from localStorage.");
            if (apiKeyStatusP) { // Update status message
                apiKeyStatusP.textContent = "API Key loaded from localStorage.";
                apiKeyStatusP.style.color = "var(--text-secondary)";
            }
            AI_CONFIG.isEnabled = true;
        } else {
            // Key not found, prompt the user
            GEMINI_API_KEY = prompt("Gemini API Key not found in storage.\nPlease enter your Gemini API Key (will be stored locally for future sessions):");

            if (GEMINI_API_KEY) {
                // Key provided via prompt
                console.log("Gemini API Key provided by user.");
                localStorage.setItem('geminiApiKey', GEMINI_API_KEY); // Store the key
                if (apiKeyStatusP) {
                    apiKeyStatusP.textContent = "API Key stored in localStorage for future sessions.";
                    apiKeyStatusP.style.color = "var(--text-secondary)";
                }
                AI_CONFIG.isEnabled = true;
            } else {
                // User cancelled the prompt or entered nothing
                console.error("Gemini API Key not provided. AI features will be disabled.");
                if (apiKeyStatusP) {
                    apiKeyStatusP.textContent = "API Key not provided. AI players disabled.";
                    apiKeyStatusP.style.color = "var(--text-error)";
                }
                AI_CONFIG.isEnabled = false;
                // Disable AI options immediately if key is missing
                document.querySelectorAll('.player-type-select').forEach(sel => {
                     const aiOption = sel.querySelector('option[value="ai"]');
                     if(aiOption) aiOption.disabled = true;
                });
                if(simulationModeCheckbox) simulationModeCheckbox.disabled = true;
            }
        }

        // Ensure UI reflects key status after check (might run before setupPlayerNameInputs)
        // Call setup again or ensure setup uses AI_CONFIG.isEnabled correctly
        if (typeof setupPlayerNameInputs === 'function') { // Check if function exists yet
           setupPlayerNameInputs(); // Re-run setup to potentially disable AI options
        }
    }


    function initGame(playerData) {
        console.log("Initializing game...");
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
        stopTimer(); // Stop any existing timer
        hideOverlays();
        clearActionState();
        logMessagesDiv.innerHTML = ''; // Clear log
        gameHistoryLog = []; // Clear history
        aiActionCounter = 0; // Reset AI counter
        isSimulationPaused = false; // Ensure simulation starts unpaused

        // Update simulation delay from input
        simulationTurnDelayMs = parseInt(simulationSpeedInput.value, 10) || 200;

        // Create Player Objects
        playerData.forEach((pData, i) => {
            players.push({
                id: i,
                name: pData.name,
                colorTheme: pData.colorTheme,
                type: pData.type, // 'human' or 'ai'
                gems: { white: 0, blue: 0, green: 0, red: 0, black: 0, gold: 0 },
                cards: [], // Purchased cards
                reservedCards: [], // { id, level, color, vp, cost }
                nobles: [], // { id, vp, requirements }
                score: 0,
                bonuses: { white: 0, blue: 0, green: 0, red: 0, black: 0 },
                // Detailed Stats (as defined previously)
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

        // Initialize Bank
        const gemCount = gameSettings.playerCount === 2 ? 4 : (gameSettings.playerCount === 3 ? 5 : 7);
        GEM_TYPES.forEach(gem => bank[gem] = gemCount);
        bank[GOLD] = 5;

        // Initialize Decks
        decks[1] = shuffleArray([...ALL_CARDS.filter(c => c.level === 1)]);
        decks[2] = shuffleArray([...ALL_CARDS.filter(c => c.level === 2)]);
        decks[3] = shuffleArray([...ALL_CARDS.filter(c => c.level === 3)]);

        // Deal Initial Cards
        for (let level = 1; level <= 3; level++) {
            visibleCards[level] = [];
            for (let i = 0; i < CARDS_PER_LEVEL_VISIBLE; i++) {
                drawCard(level, i); // Draw directly into the slot
            }
        }

        // Deal Nobles
        const numNobles = gameSettings.playerCount + 1;
        availableNobles = shuffleArray([...ALL_NOBLES]).slice(0, numNobles);

        // Initial Render
        renderBank();
        renderCards();
        renderNobles();
        renderPlayers(); // Includes AI badges

        // Log Game Start
        updateLog(`Game started. Players: ${players.map(p => `${p.name} (${p.type.toUpperCase()})`).join(', ')}.`);
        if(isSimulationMode) {
            updateLog(`AI Simulation Mode ACTIVE. Delay: ${simulationTurnDelayMs}ms.`);
             // Timer should be off in simulation
             gameSettings.timerMinutes = 0;
             turnDuration = 0;
             renderTimer(); // Show "Off"
             simulationPauseBtn.classList.remove('hidden');
             simulationStatusSpan.classList.remove('hidden');
             simulationPauseBtn.textContent = "Pause Sim";
             simulationStatusSpan.textContent = "Running";
             endTurnEarlyBtn.classList.add('hidden'); // No manual end turn in sim
        } else {
            simulationPauseBtn.classList.add('hidden');
            simulationStatusSpan.classList.add('hidden');
            // End turn button visibility handled in startTurn
        }


        // Transition Screens
        setupScreen.classList.remove('active');
        setupScreen.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        gameContainer.classList.add('active');
        document.body.style.alignItems = 'flex-start'; // Ensure game board isn't centered vertically
        document.body.style.justifyContent = 'center';


        // Start First Turn
        updateLog(`Player ${players[0].name}'s turn (#1).`);
        startTurn(); // This will handle AI or Human start logic
    }

    function setupPlayerNameInputs() {
        const count = parseInt(playerCountSelect.value);
        playerNamesDiv.innerHTML = ''; // Clear previous
        for (let i = 0; i < count; i++) {
            const playerInputDiv = document.createElement('div');
            playerInputDiv.classList.add('player-setup-entry');

            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.placeholder = `Player ${i + 1} Name`;
            nameInput.id = `player-name-${i}`;
            nameInput.value = `Player ${i + 1}`;
            nameInput.classList.add('setup-input', 'player-name-input');

            const colorSelect = document.createElement('select');
            colorSelect.id = `player-color-${i}`;
            colorSelect.classList.add('setup-input', 'player-color-select');
            PLAYER_COLORS.forEach((colorClass, index) => {
                const option = document.createElement('option');
                option.value = colorClass;
                option.textContent = `Theme ${index + 1} (${getThemeColorName(colorClass)})`;
                option.selected = (i === index);
                colorSelect.appendChild(option);
            });

            // AI Type Selector
            const typeLabel = document.createElement('label');
            typeLabel.htmlFor = `player-type-${i}`;
            typeLabel.textContent = 'Type:';
            typeLabel.classList.add('setup-label', 'inline-label');

            const typeSelect = document.createElement('select');
            typeSelect.id = `player-type-${i}`;
            typeSelect.classList.add('setup-input', 'player-type-select');
            // Check if AI should be enabled based on key status
            const aiDisabled = !AI_CONFIG.isEnabled ? 'disabled' : '';
            typeSelect.innerHTML = `
                <option value="human" selected>Human</option>
                <option value="ai" ${aiDisabled}>AI (Gemini)</option>
            `;
            // Disable if simulation mode is currently checked
            typeSelect.disabled = simulationModeCheckbox.checked;


            // Append all elements
            playerInputDiv.appendChild(nameInput);
            playerInputDiv.appendChild(colorSelect);
            playerInputDiv.appendChild(typeLabel);
            playerInputDiv.appendChild(typeSelect);
            playerNamesDiv.appendChild(playerInputDiv);
        }
         // Ensure sim checkbox state matches key availability
         if(simulationModeCheckbox) simulationModeCheckbox.disabled = !AI_CONFIG.isEnabled;
    }

    function setupEventListeners() {
        playerCountSelect.addEventListener('change', setupPlayerNameInputs);
        simulationModeCheckbox.addEventListener('change', () => {
             const isSim = simulationModeCheckbox.checked;
             document.querySelectorAll('.player-type-select').forEach(sel => {
                 sel.disabled = isSim;
                 if (isSim) sel.value = 'ai'; // Force AI display if sim checked
             });
             if(isSim) timerInput.value = 0; // Force timer off visually
             // Trigger re-render/update of player inputs if needed, though disabling might be enough
             // setupPlayerNameInputs();
        });

        // Start Game Button
        startGameBtn.addEventListener('click', () => {
            const simulationCheckbox = document.getElementById('simulation-mode');
            const isSim = simulationCheckbox.checked;

            const playerData = [];
            let aiSelectedCount = 0;
            const numPlayers = parseInt(playerCountSelect.value);
            for (let i = 0; i < numPlayers; i++) {
                const nameInput = document.getElementById(`player-name-${i}`);
                const colorSelect = document.getElementById(`player-color-${i}`);
                const typeSelect = document.getElementById(`player-type-${i}`);
                const playerType = isSim ? 'ai' : typeSelect.value;

                if (playerType === 'ai') {
                    aiSelectedCount++;
                }

                playerData.push({
                    name: nameInput.value.trim() || `Player ${i + 1}`,
                    colorTheme: colorSelect.value,
                    type: playerType
                });
            }

            // Check API key only if an AI is actually involved
             if (aiSelectedCount > 0 && !GEMINI_API_KEY) {
                 alert("An AI player was selected, but the Gemini API Key is missing or invalid! Please refresh and enter the key, or choose Human players only.");
                 return; // Prevent game start
             }

            // Get settings
            gameSettings.playerCount = numPlayers;
            gameSettings.timerMinutes = parseFloat(timerInput.value);
             if (isSim) gameSettings.timerMinutes = 0; // Force timer off in sim state
            turnDuration = gameSettings.timerMinutes * 60;
            isSimulationMode = isSim; // Set global flag

            initGame(playerData);
        });


        // Deck Clicks
        deckElements[1].addEventListener('click', () => handleDeckClick(1));
        deckElements[2].addEventListener('click', () => handleDeckClick(2));
        deckElements[3].addEventListener('click', () => handleDeckClick(3));

        // End Turn / Pause Sim
        endTurnEarlyBtn.addEventListener('click', handleEndTurnEarly);
        simulationPauseBtn.addEventListener('click', toggleSimulationPause);

        // Play Again
        playAgainBtn.addEventListener('click', () => {
            gameOverOverlay.classList.add('hidden');
            setupScreen.classList.remove('hidden');
            setupScreen.classList.add('active');
            gameContainer.classList.remove('active');
            gameContainer.classList.add('hidden');
            document.body.style.alignItems = 'center'; // Re-center setup
            document.body.style.justifyContent = 'center';
            initializeApiKey(); // Re-check key on play again
            setupPlayerNameInputs(); // Reset setup options
            // Reset global simulation flags explicitly
            isSimulationMode = false;
            isSimulationPaused = false;
        });
    }

    // =========================================================================
    // RENDERING FUNCTIONS
    // =========================================================================

    function renderBank() {
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
        noblesContainer.innerHTML = '';
        availableNobles.forEach(nobleData => {
            noblesContainer.appendChild(createNobleElement(nobleData));
        });
    }

    function renderPlayers() {
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
            // Re-add AI badge if needed
             if (player.type === 'ai') {
                 const badge = document.createElement('span');
                 badge.classList.add('ai-badge');
                 badge.textContent = 'AI';
                  // Ensure badge is appended correctly after innerHTML overwrite
                  // It might be better to selectively update parts of the player area
                  // But for simplicity, let's re-append it.
                  // Check if it already exists from createPlayerAreaElement call within innerHTML set?
                  if(!playerAreaEl.querySelector('.ai-badge')){
                       playerAreaEl.appendChild(badge);
                  }
             }
            highlightActivePlayer();
            updateClickableState();
        } else {
            console.error("Could not find player or player area to update:", playerId);
        }
    }

    function renderTimer() {
        if (isSimulationMode || gameSettings.timerMinutes <= 0 || turnDuration <= 0) {
            timerDisplay.textContent = "Off";
            timerDisplay.classList.remove('timer-low');
            return;
        }
        const currentPlayer = players[currentPlayerIndex];
        if (!currentPlayer || currentPlayer.type === 'ai' || gameTrulyFinished) {
             timerDisplay.textContent = "--:--";
             timerDisplay.classList.remove('timer-low');
             if(currentPlayer && currentPlayer.type === 'ai') stopTimer(); // Ensure stopped for AI
             return;
         }
        const minutes = Math.floor(turnTimeRemaining / 60);
        const seconds = Math.floor(turnTimeRemaining % 60);
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        timerDisplay.classList.toggle('timer-low', turnTimeRemaining <= TIMER_LOW_THRESHOLD && turnTimeRemaining > 0);
        if (turnTimeRemaining <= 0) {
            timerDisplay.classList.remove('timer-low');
        }
    }

    function renderSelectionInfo() {
        dynamicActionButtonsContainer.innerHTML = ''; // Clear old buttons
        const existingPreview = selectionInfoDiv.querySelector('.card-preview-container');
        if (existingPreview) existingPreview.remove(); // Remove old preview
        // Ensure text elements exist before manipulating style
        selectionInfoDiv.querySelectorAll('.selection-text').forEach(p => { if(p) p.style.display = 'block'; }); // Show text by default
        if (selectedCardDisplay) selectedCardDisplay.textContent = 'None'; // Reset text display initially
        if (selectedGemsDisplay) selectedGemsDisplay.textContent = 'None'; // Reset gem display initially

        // Render Selected Gems & Button
        if (currentAction === 'SELECTING_GEMS' && selectedGemTypes.length > 0) {
            if (selectedGemsDisplay) { // Check element exists
                 selectedGemsDisplay.innerHTML = ''; // Clear old gems
                 selectedGemTypes.forEach(type => {
                     selectedGemsDisplay.appendChild(createGemElement(type, 1, false)); // isBank = false
                 });
             }

            const btn = document.createElement('button');
            btn.textContent = 'Confirm Take Tokens';
            btn.onclick = performTakeGems;
            const isValid = validateTakeGemsSelection();
            btn.disabled = !isValid;
             dynamicActionButtonsContainer.appendChild(btn);
            if (isValid) btn.classList.add('action-possible');
             if (selectedCardDisplay) selectedCardDisplay.textContent = 'None'; // Ensure card display is none

        // Render Selected Card, Preview & Buttons
        } else if (currentAction === 'SELECTING_CARD' && selectedCard) {
             let cardData = null;
             // Get card data - use getCardById which checks visible and ALL reserves
             if(selectedCard.id) cardData = getCardById(selectedCard.id);
             // For decks, create placeholder
             if (!cardData && selectedCard.type === 'deck') cardData = getDeckCardPlaceholder(selectedCard.level);

             let cardText = 'Invalid Selection'; // Default text

             if (cardData) {
                // --- Display Card Preview (Visible or Reserved) ---
                 if ((selectedCard.type === 'visible' || selectedCard.type === 'reserved') && cardData.id) {
                     selectionInfoDiv.querySelectorAll('.selection-text').forEach(p => { if(p) p.style.display = 'none'; });
                     const previewContainer = document.createElement('div');
                     previewContainer.classList.add('card-preview-container');
                     const previewCardEl = createCardElement(cardData, cardData.level);
                     previewCardEl.classList.add('card-preview');
                     const clonedPreview = previewCardEl.cloneNode(true); // Clone to remove listeners implicitly
                     previewContainer.appendChild(clonedPreview);
                     selectionInfoDiv.insertBefore(previewContainer, dynamicActionButtonsContainer);
                      if (selectedCardDisplay) selectedCardDisplay.textContent = '';
                      if (selectedGemsDisplay) selectedGemsDisplay.textContent = 'None';

                 }
                 // --- Display Text for Deck Selection ---
                 else if (selectedCard.type === 'deck') {
                     cardText = `Deck L${cardData.level}`;
                      if (selectedCardDisplay) selectedCardDisplay.textContent = cardText;
                      if (selectedGemsDisplay) selectedGemsDisplay.textContent = 'None';
                 } else {
                      if (selectedCardDisplay) selectedCardDisplay.textContent = 'Unknown Card';
                 }

                 // --- Add Action Buttons (Conditional) ---
                 const activePlayer = players[currentPlayerIndex]; // The player whose turn it IS
                 const isHumanTurn = activePlayer && activePlayer.type === 'human' && !isSimulationMode && !gameTrulyFinished && !isOverlayVisible(); // Check overlay too

                 // Only allow actions if it's an active human's turn & no blocking overlay
                 if (isHumanTurn) {
                      const canReserveCheck = activePlayer.reservedCards.length < MAX_RESERVED_CARDS;
                      const { canAfford, goldNeeded } = (selectedCard.type === 'visible' || selectedCard.type === 'reserved') && cardData.id
                          ? canAffordCard(activePlayer, cardData)
                          : { canAfford: false, goldNeeded: 0 };

                      // Purchase Button (Visible OR Reserved IF it's the current player's card)
                      if (((selectedCard.type === 'visible') || (selectedCard.type === 'reserved' && selectedCard.ownerId === currentPlayerIndex)) && cardData.id) {
                          const purchaseBtn = document.createElement('button');
                          purchaseBtn.textContent = 'Purchase Card';
                          purchaseBtn.onclick = performPurchaseCard;
                          purchaseBtn.disabled = !canAfford; // Disabled if cannot afford
                          if (canAfford) purchaseBtn.classList.add('action-possible');
                          else purchaseBtn.title = `Cannot afford (need ${goldNeeded} more gold or equivalent gems)`;
                          dynamicActionButtonsContainer.appendChild(purchaseBtn);
                      }

                      // Reserve Button (Visible or Deck ONLY)
                      if (selectedCard.type === 'visible' || selectedCard.type === 'deck') {
                          const reserveBtn = document.createElement('button');
                          reserveBtn.textContent = 'Reserve Card';
                          reserveBtn.onclick = performReserveCard;
                          const isDeckEmpty = (selectedCard.type === 'deck' && decks[selectedCard.level].length === 0);
                          const disableReserve = !canReserveCheck || isDeckEmpty;
                          reserveBtn.disabled = disableReserve;
                          if (!disableReserve) reserveBtn.classList.add('action-possible');
                          if (!canReserveCheck) reserveBtn.title = "Reservation limit reached (3)";
                          if (isDeckEmpty) reserveBtn.title = `Level ${selectedCard.level} deck is empty`;
                          dynamicActionButtonsContainer.appendChild(reserveBtn);
                      }
                 } else {
                      // console.log("Not human turn or overlay visible, no action buttons rendered for selected card.");
                 }
             } else {
                  if (selectedCardDisplay) selectedCardDisplay.textContent = cardText;
             }

        } else {
            // Default state when nothing is selected
            if (selectedCardDisplay) selectedCardDisplay.textContent = 'None';
            if (selectedGemsDisplay) selectedGemsDisplay.textContent = 'None';
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

    // =========================================================================
    // ELEMENT CREATION FUNCTIONS
    // =========================================================================

    function createGemElement(type, count, isBank) {
        const gemEl = document.createElement('div');
        gemEl.classList.add('gem', `gem-${type}`);
        if (isBank) {
            const countEl = document.createElement('span');
            countEl.classList.add('gem-count');
            countEl.textContent = count;
            gemEl.appendChild(countEl);
        } else {
             gemEl.classList.add('small-gems');
             gemEl.style.width = '20px';
             gemEl.style.height = '20px';
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

    function createNobleElement(nobleData) {
        const nobleEl = document.createElement('div');
        nobleEl.classList.add('noble');
        nobleEl.dataset.nobleId = nobleData.id;
        const reqString = GEM_TYPES
            .map(type => ({ type, count: nobleData.requirements[type] || 0 }))
            .filter(item => item.count > 0)
            .map(item => `${item.count} ${item.type}`)
            .join(', ');
        nobleEl.title = `${nobleData.vp} VP - Requires: ${reqString}`;
        const vpSpan = document.createElement('span');
        vpSpan.classList.add('noble-vp');
        vpSpan.textContent = nobleData.vp;
        const reqsDiv = document.createElement('div');
        reqsDiv.classList.add('noble-requirements');
        GEM_TYPES.forEach(gemType => {
            const req = nobleData.requirements[gemType];
            if (req > 0) {
                const reqItem = document.createElement('div');
                reqItem.classList.add('req-item');
                reqItem.textContent = req;
                const reqGem = document.createElement('span');
                reqGem.classList.add('req-gem', `gem-${gemType}`);
                reqItem.appendChild(reqGem);
                reqsDiv.appendChild(reqItem);
            }
        });
        nobleEl.appendChild(vpSpan);
        nobleEl.appendChild(reqsDiv);
        return nobleEl;
    }

    function createPlayerAreaElement(player) {
        const playerDiv = document.createElement('div');
        playerDiv.classList.add('player-area');
        playerDiv.classList.add(player.colorTheme);
        playerDiv.id = `player-area-${player.id}`;
        // Add AI class marker if AI player
        if (player.type === 'ai') {
            playerDiv.classList.add('player-area-ai'); // Add a class for potential specific styling
        }

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

        // AI Badge (Add to header maybe?)
        if (player.type === 'ai') {
             const badge = document.createElement('span');
             badge.classList.add('ai-badge');
             badge.textContent = 'AI';
             header.appendChild(badge); // Add badge near name/score
         }

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
                nobleEl.style.transform = 'scale(0.8)';
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

    // =========================================================================
    // EVENT HANDLERS & USER INTERACTION
    // =========================================================================

     function handleGemClickWrapper(event) {
        const player = players[currentPlayerIndex];
         if (!player || player.type === 'ai' || isSimulationMode || isOverlayVisible() || gameTrulyFinished) return;
        const gemEl = event.currentTarget;
        if (gemEl.classList.contains('not-selectable')) return; // Already checked non-selectable state?
        const gemType = gemEl.dataset.gemType;
         if (!isGemClickable(gemType, gemEl.classList.contains('selected'))) { // Use helper to check dynamic state
            console.log(`Click ignored on ${gemType}: Not clickable in current state.`);
            return;
         }
        handleGemClick(gemType, gemEl);
    }

    function handleVisibleCardClickWrapper(event) {
         const player = players[currentPlayerIndex];
         if (!player || player.type === 'ai' || isSimulationMode || isOverlayVisible() || gameTrulyFinished) return;
        const cardEl = event.currentTarget;
        if (cardEl.classList.contains('not-selectable') || cardEl.classList.contains('empty-slot')) return;
        const cardId = cardEl.dataset.cardId;
        const level = parseInt(cardEl.dataset.level, 10);
        if (cardId && !isNaN(level)) {
            handleCardClick('visible', level, cardId, cardEl);
        } else {
            console.error("Visible card click error: Missing cardId or level", cardEl.dataset);
        }
    }

    function handleReservedCardClickWrapper(event) {
        // Allow click even if not current player or simulation, etc. for PREVIEW purposes.
        const cardEl = event.currentTarget;

        // If the element itself is marked as globally not-selectable by updateClickableState
        // (e.g., game over, overlay active), then stop.
        // We might still allow deselecting though? Let's check if *something* is selected.
        if (cardEl.classList.contains('not-selectable') && !selectedCard) {
             // console.log("Reserved card wrapper blocked click (globally not-selectable)");
            return;
        }

        const cardId = cardEl.dataset.cardId;
        if (cardId) {
            // Pass the element itself for context
            handleReservedCardClick(cardId, cardEl);
        } else {
            console.error("Reserved card wrapper: Missing cardId on element", cardEl);
        }
    }

     function handleGemClick(gemType, clickedGemEl) {
        if (gemType === GOLD) return;

        if (currentAction === 'SELECTING_CARD') {
            console.log("[handleGemClick] Clearing card selection state because gem was clicked.");
            clearCardSelectionState();
        }
        if (currentAction !== 'SELECTING_GEMS') {
             currentAction = 'SELECTING_GEMS';
        }

        const isSelectedVisual = clickedGemEl.classList.contains('selected');
        const currentSelection = [...selectedGemTypes];
        const currentCount = currentSelection.length;
        const currentUniqueCount = new Set(currentSelection).size;

        console.log(`-----------------------------------------------------`);
        console.log(`[handleGemClick] START | Clicked: ${gemType}, isSelectedVisual: ${isSelectedVisual}`);
        console.log(`                  | Bank count: ${bank[gemType]}, Current selection (start): [${currentSelection.join(',')}]`);
        console.log(`                  | currentAction: ${currentAction}`);


        // A. CLICKING A VISUALLY SELECTED GEM ELEMENT
        if (isSelectedVisual) {
            // *** NEW LOGIC: Handle different scenarios when clicking selected ***

            // Scenario 1: Trying to complete a Take 2 pair?
            const isTryingToAddSecondIdentical = (currentCount === 1 && currentSelection[0] === gemType && bank[gemType] >= MIN_GEMS_FOR_TAKE_TWO);

            // Scenario 2: Trying to deselect one gem from an already selected pair?
            const isTryingToDeselectPair = (currentCount === 2 && currentUniqueCount === 1 && currentSelection[0] === gemType);

            if (isTryingToAddSecondIdentical) {
                // --- ADD SECOND IDENTICAL GEM ---
                console.log(` -> Action: Adding SECOND IDENTICAL ${gemType} (Take 2 rule)`);
                selectedGemTypes.push(gemType);
                 console.log(`   -> After push (2nd identical): selectedGemTypes = [${selectedGemTypes.join(',')}] (Length: ${selectedGemTypes.length})`);
                const otherGemEl = findNonSelectedBankGemElement(gemType, clickedGemEl);
                if (otherGemEl) {
                    console.log("     -> Found other element for pair:", otherGemEl, "Adding .selected class.");
                    otherGemEl.classList.add('selected');
                } else {
                    console.warn(`     -> Could not find a second non-selected element for ${gemType} pair visual.`);
                     gemBankContainer.querySelectorAll(`.gem[data-gem-type='${gemType}']`).forEach(el => el.classList.add('selected'));
                }

            } else if (isTryingToDeselectPair) {
                 // --- DESELECT THE ENTIRE PAIR ---
                 console.log(` -> Action: Deselecting entire PAIR of ${gemType}`);
                 // Clear logically
                 selectedGemTypes = [];
                 console.log(`   -> Cleared selectedGemTypes. New (logic): [${selectedGemTypes.join(',')}]`);
                 // Clear visually
                 console.log("   -> Deselecting ALL visual elements for", gemType);
                  gemBankContainer.querySelectorAll(`.gem[data-gem-type='${gemType}'].selected`).forEach(el => {
                      el.classList.remove('selected');
                  });
                  currentAction = null; // Reset action as selection is empty

            } else {
                // --- REGULAR DESELECT (Not completing a pair, not breaking a pair) ---
                // This covers deselecting one of 3 different, or deselecting when > 2 selected etc.
                console.log(` -> Action: Regular Deselect of ${gemType}`);
                const indexToRemove = selectedGemTypes.lastIndexOf(gemType);
                if (indexToRemove > -1) {
                    selectedGemTypes.splice(indexToRemove, 1);
                    clickedGemEl.classList.remove('selected'); // Deselect just the clicked one visually
                    console.log(`   -> Removed from selectedGemTypes. New (logic): [${selectedGemTypes.join(',')}]`);
                } else {
                     console.warn(`   -> Deselect WARNING: Could not find ${gemType} in selectedGemTypes to remove.`);
                     clickedGemEl.classList.remove('selected'); // Ensure visual deselect anyway
                }
                if (selectedGemTypes.length === 0) {
                    console.log("   -> Selection empty after deselect.");
                    currentAction = null;
                }
            }

        // B. CLICKING A *NOT* VISUALLY SELECTED GEM ELEMENT
        } else {
             // --- Logic for selecting 1st, 2nd different, 3rd different ---
             // (Keep this block exactly as it was in the previous correct version)
             console.log(` -> Action: Attempting Select ${gemType}. Current count: ${currentCount}`);
            let canAdd = false;
            if (currentCount === 0 && bank[gemType] >= 1) {
                 console.log("   -> Check Rule 1 (Select First): Pass");
                canAdd = true;
            }
            else if (currentCount === 1) {
                const firstType = currentSelection[0];
                 console.log(`   -> Check Rule 2 (Select Second): First type=${firstType}, Clicked=${gemType}`);
                if (gemType !== firstType && bank[gemType] >= 1) {
                     console.log("     -> Check Rule 2a (Different): Pass");
                    canAdd = true;
                } else {
                     console.log(`     -> Check Rule 2: Fail (Cannot add identical by clicking unselected OR Bank empty)`);
                }
            }
            else if (currentCount === 2 && currentUniqueCount === 2 && !currentSelection.includes(gemType) && bank[gemType] >= 1) {
                 console.log("   -> Check Rule 3 (Select Third): Pass (3rd different)");
                canAdd = true;
            }
            else {
                 console.log(`   -> Check: Fail (Max gems (${currentCount}) reached or invalid combo for ${gemType})`);
            }

            if (canAdd) {
                 console.log(`   -> Before push: selectedGemTypes = [${selectedGemTypes.join(',')}] (Length: ${selectedGemTypes.length})`);
                 selectedGemTypes.push(gemType);
                 console.log(`   -> After push: selectedGemTypes = [${selectedGemTypes.join(',')}] (Length: ${selectedGemTypes.length})`);
                 clickedGemEl.classList.add('selected');
                 console.log(`   -> Added visual class '.selected' to clicked ${gemType} element.`);
            } else {
                 console.log(`   -> Cannot add ${gemType} based on current selection/rules.`);
                 clickedGemEl.style.animation = 'shake 0.5s';
                 setTimeout(() => { clickedGemEl.style.animation = ''; }, 500);
            }
        } // End of B (Clicking non-selected)

        console.log(`--- State Before Render/Update --- selectedGemTypes: [${selectedGemTypes.join(',')}] (Length: ${selectedGemTypes.length})`);
        renderSelectionInfo();
        updateClickableState();
        console.log(`--- State After Render/Update --- selectedGemTypes: [${selectedGemTypes.join(',')}] (Length: ${selectedGemTypes.length})`);
        console.log(`[handleGemClick] END | currentAction: ${currentAction}`);
        console.log(`-----------------------------------------------------`);
    }

    function handleCardClick(type, level, cardId, cardEl) {
        // Assumes checks for player turn are done in the wrapper
         console.log(`[handleCardClick] Clicked card: ${cardId}. Current selected ID: ${selectedCard?.id}`); // Log entry

        // *** FIX: Compare by ID and Type for deselect check ***
        if (selectedCard && selectedCard.id === cardId && selectedCard.type === type) {
            console.log(` -> Match found by ID! Calling clearCardSelectionState for ${cardId}.`);
            clearCardSelectionState(); // Clear selection and update UI
             console.log(` -> After clearCardSelectionState. selectedCard is now:`, selectedCard); // Verify clear
            return; // Stop processing
        }
        // *** END FIX ***

        // Clear gem selection if switching action type
        if (currentAction === 'SELECTING_GEMS') {
            console.log(" -> Clearing gem selection.");
            clearGemSelectionState();
        }
        // Clear previous card selection visual if selecting a different card
        else if (currentAction === 'SELECTING_CARD' && selectedCard && selectedCard.element !== cardEl) {
             console.log(` -> Clearing previous card selection visual: ${selectedCard.id}`);
             if (selectedCard.element) selectedCard.element.classList.remove('selected');
        }

        // Set new selection
        currentAction = 'SELECTING_CARD';
        selectedCard = { type, level, id: cardId, element: cardEl };
        cardEl.classList.add('selected');
        console.log(`[handleCardClick] Setting new selection: ${cardId}`);


        renderSelectionInfo();
        updateClickableState();
    }

    function handleDeckClick(level) {
        // Assumes checks for player turn are done implicitly by updateClickableState disabling
        const deckEl = deckElements[level];
        if (deckEl.classList.contains('empty') || deckEl.classList.contains('not-selectable')) return;

        // *** FIX: Check if clicking the already selected deck ***
        if (selectedCard && selectedCard.element === deckEl) {
            console.log(`[handleDeckClick] Deselecting already selected deck: L${level}`);
            clearCardSelectionState(); // Clear selection and update UI
            return; // Stop processing
        }
        // *** END FIX ***


        const player = players[currentPlayerIndex];
        // Add this check back just in case updateClickableState didn't catch it somehow
        if (!player || player.reservedCards.length >= MAX_RESERVED_CARDS) {
            updateLog("Reserve limit reached (3). Cannot reserve from deck.");
            return;
        }

        const deckId = `deck-${level}`; // Use a consistent ID format

        // Clear other selections
        if (currentAction === 'SELECTING_GEMS') clearGemSelectionState();
        else if (currentAction === 'SELECTING_CARD' && selectedCard && selectedCard.element !== deckEl) {
             if (selectedCard.element) selectedCard.element.classList.remove('selected');
        }

        // Set new selection
        currentAction = 'SELECTING_CARD';
        selectedCard = { type: 'deck', level, id: deckId, element: deckEl }; // Use deckId
        deckEl.classList.add('selected');
        console.log(`[handleDeckClick] Selected deck: L${level}`);


        renderSelectionInfo();
        updateClickableState();
    }

    function handleReservedCardClick(cardId, cardEl) {
        // Find the owner player based on the parent element
        const playerArea = cardEl.closest('.player-area');
        if (!playerArea) {
             console.error("Could not find player area for reserved card click.");
             return;
        }
        const ownerId = parseInt(playerArea.id.split('-')[2], 10);
        const ownerPlayer = players.find(p => p.id === ownerId);

        if (!ownerPlayer) {
             console.error(`Could not find player object for ID ${ownerId}.`);
             return;
        }

       // Ensure card still exists in that player's reserve
       const cardData = ownerPlayer.reservedCards.find(c => c.id === cardId);
       if (!cardData) {
           console.error(`Reserved card ${cardId} data not found for click in player ${ownerId}'s hand!`);
           renderPlayerArea(ownerId); // Refresh display in case of sync issue
           return;
       }
        console.log(`[handleReservedCardClick] Clicked reserved card: ${cardId} owned by Player ${ownerId}. Current selected ID: ${selectedCard?.id}`);

       // Check if clicking the already selected reserved card (compare ID and type)
       if (selectedCard && selectedCard.id === cardId && selectedCard.type === 'reserved') {
           console.log(` -> Match found by ID! Calling clearCardSelectionState for reserved ${cardId}.`);
           clearCardSelectionState();
            console.log(` -> After clearCardSelectionState. selectedCard is now:`, selectedCard);
           return; // Stop processing
       }

       // Clear other selections (gems, other cards/decks)
       if (currentAction === 'SELECTING_GEMS') {
            console.log(" -> Clearing gem selection.");
            clearGemSelectionState(); // This now calls render/update internally
        }
       else if (currentAction === 'SELECTING_CARD' && selectedCard) {
             console.log(` -> Clearing previous card/deck selection visual: ${selectedCard.id}`);
            if (selectedCard.element) {
                 selectedCard.element.classList.remove('selected');
            }
       }

       // --- Set new selection state for the PREVIEW ---
       currentAction = 'SELECTING_CARD';
        // Add ownerId to the selected card state
       selectedCard = { type: 'reserved', level: cardData.level, id: cardId, element: cardEl, ownerId: ownerId };
        // Visually select ONLY the clicked small card
        document.querySelectorAll('.reserved-card-small.selected, .card.selected, .deck.selected').forEach(el => el.classList.remove('selected')); // Clear others first
       cardEl.classList.add('selected');
       console.log(`[handleReservedCardClick] Setting new selection: Reserved ${cardId} owned by ${ownerId}`);

       // --- Update UI ---
       renderSelectionInfo(); // This will now show the preview and correct buttons
       updateClickableState(); // This will update which *other* elements are clickable
    }

    function handleEndTurnEarly() {
        if (gameTrulyFinished || isSimulationMode || isOverlayVisible()) return;
        const player = players[currentPlayerIndex];
        if (!player || player.type === 'ai') return;
        if (currentAction) {
            const actionCancelled = currentAction.replace('SELECTING_','').toLowerCase();
            clearActionState();
            updateLog(`Player ${player.name} cancelled ${actionCancelled} selection and ended turn.`);
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
         if (isSimulationPaused) {
             simulationPauseBtn.textContent = "Resume Sim";
             simulationStatusSpan.textContent = "Paused";
             updateLog("Simulation paused.");
             stopTimer();
             updateClickableState(); // Keep pause button active
         } else {
             simulationPauseBtn.textContent = "Pause Sim";
             simulationStatusSpan.textContent = "Running";
             updateLog("Simulation resumed.");
             // If paused between AI turns, the natural loop in endTurn will restart it via startTurn
             // If paused during human turn (impossible in sim mode), nothing happens until unpause
             updateClickableState(); // Re-disable background
             // Immediately start next turn if needed (in case it was paused right before startTurn)
             if (!isOverlayVisible() && !gameTrulyFinished) {
                 console.log("Resuming simulation, triggering startTurn immediately.");
                 setTimeout(startTurn, 0); // Trigger next turn check now
             }
         }
    }

    // =========================================================================
    // ACTION VALIDATION HELPERS
    // =========================================================================

    function validateTakeGemsSelection() {
        const gems = selectedGemTypes;
        const count = gems.length;
        const uniqueCount = new Set(gems).size;
        if (count === 3 && uniqueCount === 3) {
            return gems.every(type => bank[type] >= 1);
        }
        if (count === 2 && uniqueCount === 1) {
            const type = gems[0];
            return bank[type] >= MIN_GEMS_FOR_TAKE_TWO;
        }
        return false;
    }

    // =========================================================================
    // GAME ACTIONS & LOGIC
    // =========================================================================

    function performTakeGems() {
        if (!validateTakeGemsSelection()) {
            updateLog("Invalid gem selection. Action cancelled.");
            clearActionState();
            return;
        }
        const player = players[currentPlayerIndex];
        const gemsTakenLog = {};
        const isTakeTwo = selectedGemTypes.length === 2 && new Set(selectedGemTypes).size === 1;
        player.stats.gemTakeActions++;
        if (isTakeTwo) player.stats.take2Actions++; else player.stats.take3Actions++;
        selectedGemTypes.forEach(type => {
            if (bank[type] > 0) {
                bank[type]--;
                player.gems[type]++;
                gemsTakenLog[type] = (gemsTakenLog[type] || 0) + 1;
                player.stats.gemsTaken[type]++;
            } else {
                console.error(`CRITICAL ERROR: Bank empty for ${type} despite validation!`);
                updateLog(`Error: Bank empty for ${type}! Action may be incomplete.`);
                clearActionState(); renderBank(); renderPlayerArea(player.id);
                endTurn('TAKE_GEMS_ERROR'); return;
            }
        });
        const gemString = Object.entries(gemsTakenLog).map(([t, c]) => `${c} ${t}`).join(', ');
        updateLog(`${player.name} (${player.type.toUpperCase()}) took ${gemString}.`);
        logActionToHistory(player, 'TAKE_GEMS', { gems: [...selectedGemTypes] });
        clearActionState(); renderBank(); renderPlayerArea(player.id);
        endTurn('TAKE_GEMS');
    }

    function performReserveCard() {
        if (!selectedCard || (selectedCard.type !== 'visible' && selectedCard.type !== 'deck')) {
            updateLog("No valid card or deck selected to reserve."); clearActionState(); return;
        }
        const player = players[currentPlayerIndex];
        if (player.reservedCards.length >= MAX_RESERVED_CARDS) {
            updateLog("Cannot reserve: Reservation limit reached (3)."); clearActionState(); return;
        }
        let reservedCardData = null; let cardSourceDescription = ""; let cardSourceType = selectedCard.type;
        const level = selectedCard.level; let cardReplaced = false;
        if (selectedCard.type === 'deck') {
            if (decks[level].length > 0) {
                reservedCardData = decks[level].pop(); cardSourceDescription = `from L${level} deck`;
                player.stats.deckReservations[level]++;
            } else {
                updateLog(`Cannot reserve: Level ${level} deck is empty.`); clearActionState(); renderCards(); return;
            }
        } else { // type === 'visible'
            const cardId = selectedCard.id;
            const cardIndex = visibleCards[level].findIndex(c => c && c.id === cardId);
            if (cardIndex !== -1 && visibleCards[level][cardIndex]) {
                reservedCardData = visibleCards[level][cardIndex];
                cardSourceDescription = `L${level} ${reservedCardData.color} from board`;
                player.stats.boardReservations[level]++;
                visibleCards[level][cardIndex] = null; drawCard(level, cardIndex); cardReplaced = true;
            } else {
                updateLog("Cannot reserve: Selected card is no longer available."); clearActionState(); renderCards(); return;
            }
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
        if (!selectedCard || (selectedCard.type !== 'visible' && selectedCard.type !== 'reserved')) {
            updateLog("No valid card selected to purchase."); clearActionState(); return;
        }
        const player = players[currentPlayerIndex]; const cardId = selectedCard.id;
        let purchasedCardData = null; let cardSource = selectedCard.type; let cardIndex = -1; let isFromReserve = (cardSource === 'reserved');
        if (cardSource === 'visible') {
            cardIndex = visibleCards[selectedCard.level]?.findIndex(c => c && c.id === cardId); // Added optional chaining
            if (cardIndex !== -1) purchasedCardData = visibleCards[selectedCard.level][cardIndex];
        } else {
            cardIndex = player.reservedCards.findIndex(c => c.id === cardId);
            if (cardIndex !== -1) purchasedCardData = player.reservedCards[cardIndex];
        }
        if (!purchasedCardData) {
            updateLog("Cannot purchase: Card not found or unavailable."); clearActionState(); renderCards(); renderPlayerArea(player.id); return;
        }
        const { canAfford, goldNeeded, effectiveCost } = canAffordCard(player, purchasedCardData);
        if (!canAfford) {
            updateLog(`Cannot purchase: Not enough resources. Need ${goldNeeded} more gold or equivalent gems.`); return;
        }
        let goldSpent_this_turn = 0; let gemsSpent_this_turn = { white: 0, blue: 0, green: 0, red: 0, black: 0 }; let totalResourceCost = 0;
        let paymentError = false; // Flag for payment issues
        GEM_TYPES.forEach(gemType => {
             if (paymentError) return; // Stop if error occurred
            const costToPay = effectiveCost[gemType]; totalResourceCost += costToPay;
            const playerHas = player.gems[gemType]; const useFromPlayerGems = Math.min(costToPay, playerHas);
            const needsGoldForThisColor = costToPay - useFromPlayerGems;
            if (useFromPlayerGems > 0) {
                player.gems[gemType] -= useFromPlayerGems; bank[gemType] += useFromPlayerGems; gemsSpent_this_turn[gemType] += useFromPlayerGems;
            }
            if (needsGoldForThisColor > 0) {
                if (player.gems[GOLD] >= needsGoldForThisColor) {
                    player.gems[GOLD] -= needsGoldForThisColor; bank[GOLD] += needsGoldForThisColor; goldSpent_this_turn += needsGoldForThisColor;
                } else {
                    console.error("CRITICAL: Payment gold mismatch during purchase!"); paymentError = true;
                }
            }
        });
        if (paymentError) { // Handle error after loop
            updateLog("Error during payment calculation. Action cancelled."); renderBank(); renderPlayerArea(player.id); clearActionState(); return;
        }
        player.cards.push(purchasedCardData); player.score += purchasedCardData.vp; player.bonuses[purchasedCardData.color]++;
        player.stats.purchaseActions++; player.stats.cardsPurchasedCount++; player.stats.cardsPurchasedByLevel[purchasedCardData.level]++; player.stats.cardsPurchasedByColor[purchasedCardData.color]++;
        if (isFromReserve) player.stats.purchasedFromReserveCount++; else player.stats.purchasedFromBoardCount++;
        if (totalResourceCost === 0) player.stats.selfSufficientPurchases++; player.stats.goldSpent += goldSpent_this_turn;
        GEM_TYPES.forEach(type => player.stats.gemsSpent[type] += gemsSpent_this_turn[type]);
        if (player.stats.firstCardPurchasedTurn[purchasedCardData.level] === null) player.stats.firstCardPurchasedTurn[purchasedCardData.level] = turnNumber;
        let cardReplaced = false;
        if (cardSource === 'visible') {
            visibleCards[purchasedCardData.level][cardIndex] = null; drawCard(purchasedCardData.level, cardIndex); cardReplaced = true;
        } else {
            player.reservedCards.splice(cardIndex, 1);
        }
        updateLog(`${player.name} (${player.type.toUpperCase()}) purchased L${purchasedCardData.level} ${purchasedCardData.color} card${isFromReserve ? ' (from reserve)' : ''}${goldSpent_this_turn > 0 ? ` (used ${goldSpent_this_turn} gold)` : ''}.`);
        logActionToHistory(player, 'PURCHASE_CARD', { cardId: purchasedCardData.id, source: cardSource, level: purchasedCardData.level, color: purchasedCardData.color, vp: purchasedCardData.vp, costPaid: JSON.parse(JSON.stringify(gemsSpent_this_turn)), goldUsed: goldSpent_this_turn });
        clearActionState(); renderBank(); if (cardReplaced) renderCards(); renderPlayerArea(player.id);
        endTurn('PURCHASE');
    }

    // --- Gem Return Logic ---
    function handleConfirmReturnGems(player, gemsToReturnCount, callback) {
        const selectedElements = returnGemsPlayerDisplay.querySelectorAll('.gem.selected[data-return-gem-type]');
        if (selectedElements.length !== gemsToReturnCount) {
             updateLog(`Please select exactly ${gemsToReturnCount} non-gold tokens to return.`); return;
        }
        executeReturnGems(player, selectedElements, callback);
    }

     function executeReturnGems(player, gemsElementsToReturn, callback) {
        const returnedCounts = {}; const returnedGemTypes = [];
        gemsElementsToReturn.forEach(gemEl => {
            const type = gemEl.dataset.returnGemType;
            if (type && player.gems[type] > 0) { // Ensure type exists before accessing
                player.gems[type]--; bank[type]++;
                returnedCounts[type] = (returnedCounts[type] || 0) + 1;
                returnedGemTypes.push(type); player.stats.gemsReturnedOverLimit[type]++;
            } else { console.error(`Error returning ${type}? Player count: ${player.gems[type]}`); }
        });
        const returnString = Object.entries(returnedCounts).map(([type, count]) => `${count} ${type}`).join(', ');
        updateLog(`Player ${player.name} (${player.type.toUpperCase()}) returned ${returnString}.`);
        logActionToHistory(player, 'RETURN_GEMS', { returnedGems: returnedCounts });
        returnGemsOverlay.classList.add('hidden'); renderBank(); renderPlayerArea(player.id);
        if (callback) callback();
     }

    // --- Noble Logic ---
    function awardNoble(player, nobleData) {
         const nobleIndex = availableNobles.findIndex(n => n.id === nobleData.id);
         if (nobleIndex === -1) {
             console.warn(`Attempted to award noble ${nobleData.id} which is no longer available.`);
             updateLog(`Noble ${nobleData.id} was no longer available for ${player.name}.`); return false;
         }
        updateLog(`Noble (${nobleData.vp} VP) visits Player ${player.name} (${player.type.toUpperCase()}).`);
        player.nobles.push(nobleData); player.score += nobleData.vp; player.stats.noblesAcquiredTurn[nobleData.id] = turnNumber;
        availableNobles.splice(nobleIndex, 1);
        logActionToHistory(player, 'NOBLE_VISIT', { nobleId: nobleData.id, vp: nobleData.vp });
        return true;
    }

    // =========================================================================
    // AI LOGIC
    // =========================================================================

    async function handleAiTurn() {
        // (Keep initial checks for game over, pause, AI enabled, etc.)
        if (gameTrulyFinished || (isSimulationMode && isSimulationPaused)) { /*...*/ return; }
        const player = players[currentPlayerIndex];
        if (!player || player.type !== 'ai') { /*...*/ return; }
        if (!AI_CONFIG.isEnabled || !GEMINI_API_KEY) { /*...*/ executeFallbackAiAction(getGameStateForAI()); /*...*/ return; }

        aiActionCounter++;
        console.log(`Starting AI Turn ${turnNumber} for ${player.name} (Action Attempt #${aiActionCounter})`);
        // showAiThinking(player.name); // --- REMOVED Thinking Screen ---
        updateClickableState(); // Ensure UI is disabled

        let validatedAction = null;
        let attempts = 0;
        const MAX_INVALID_ATTEMPTS = 2; // Try up to 2 times before fallback

        while (!validatedAction && attempts < MAX_INVALID_ATTEMPTS) {
            attempts++;
            console.log(`   -> AI Action Attempt ${attempts}/${MAX_INVALID_ATTEMPTS}`);
            try {
                // 1. Gather State & History
                const gameState = getGameStateForAI();

                // 2. Create Prompt (Potentially add info about previous failure?)
                // For simplicity now, we use the same prompt generation.
                // A more advanced approach could add: "Your previous attempt was invalid, please re-evaluate based on the rules."
                const prompt = createPromptForGemini(gameState);
                if (AI_CONFIG.logPrompts && attempts === 1) console.log(`[AI Prompt - ${player.name} Turn ${turnNumber}]:\n`, prompt);

                // 3. Fetch Action from API
                const aiSuggestedAction = await fetchGeminiActionDirect(prompt);

                // 4. Validate Action
                if (aiSuggestedAction) {
                    validatedAction = validateAiAction(aiSuggestedAction, gameState);
                     if (!validatedAction) {
                        console.warn(`AI ${player.name} proposed invalid action (Attempt ${attempts}):`, aiSuggestedAction);
                        updateLog(`AI ${player.name} proposed invalid action (Attempt ${attempts}). Re-thinking...`);
                         // Optionally wait a tiny bit before retrying
                         await new Promise(resolve => setTimeout(resolve, 100));
                     } else {
                          console.log(`   -> AI Action validated on attempt ${attempts}.`);
                     }
                } else {
                     console.warn(`AI ${player.name} failed to get action from API (Attempt ${attempts}).`);
                     updateLog(`AI ${player.name} failed to get action from API (Attempt ${attempts}).`);
                      // If API fails, break the loop and go to fallback immediately? Or let retry handle it?
                      // Let's let retry handle API errors for now.
                      // If fetchGeminiActionDirect returns null after retries, validatedAction remains null.
                      break; // Exit while loop if API failed definitively
                }

            } catch (error) {
                console.error(`Error during AI turn attempt ${attempts} for ${player.name}:`, error);
                updateLog(`Error during AI ${player.name}'s turn attempt ${attempts}.`);
                 // Break loop on unexpected error during the process
                 break;
            }
        } // End while loop

        // 5. Execute or Fallback
        if (validatedAction) {
            console.log(`AI ${player.name} executing validated action:`, validatedAction);
            executeAiAction(validatedAction); // This calls endTurn indirectly
        } else {
             console.warn(`AI ${player.name} failed to provide a valid action after ${attempts} attempts. Executing fallback.`);
             updateLog(`AI ${player.name} failed to provide valid action. Executing fallback.`);
            executeFallbackAiAction(getGameStateForAI()); // Fallback calls endTurn indirectly
        }

        // hideAiThinking(); // --- REMOVED Thinking Screen ---

    }

    function getGameStateForAI() {
        const currentPlayer = players[currentPlayerIndex];
        const opponents = players.filter(p => p.id !== currentPlayerIndex).map(p => ({
                id: p.id, name: p.name, type: p.type, score: p.score,
                gems: JSON.parse(JSON.stringify(p.gems)),
                bonuses: JSON.parse(JSON.stringify(p.bonuses)),
                reservedCards: p.reservedCards.map(card => JSON.parse(JSON.stringify(card))),
                reservedCardCount: p.reservedCards.length, purchasedCardCount: p.cards.length,
                nobles: p.nobles.map(noble => JSON.parse(JSON.stringify(noble))),
            }));
        const visibleCardsCopy = { 1: [], 2: [], 3: [] };
        for (let level = 1; level <= 3; level++) { visibleCardsCopy[level] = visibleCards[level].map(card => card ? JSON.parse(JSON.stringify(card)) : null); }
        const availableNoblesCopy = availableNobles.map(noble => JSON.parse(JSON.stringify(noble)));
        return {
            gameSettings: { ...gameSettings },
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
        const hints = {
            canTake3Different: false,
            canTake2Same: [], // List of colors possible for take 2
            canReserve: gameState.currentPlayer.reservedCards.length < MAX_RESERVED_CARDS,
            canPurchaseVisible: [], // List of { cardId, level, color } for affordable visible
            canPurchaseReserved: [], // List of { cardId, level, color } for affordable reserved
            canReserveFromDeck: { 1: false, 2: false, 3: false },
        };
        const player = gameState.currentPlayer; // Use the state AI sees

        // Check Take 3 Different
        const availableSingleGems = GEM_TYPES.filter(g => gameState.bank[g] >= 1);
        if (availableSingleGems.length >= 3) {
            hints.canTake3Different = true;
        }

        // Check Take 2 Same
        GEM_TYPES.forEach(g => {
            if (gameState.bank[g] >= MIN_GEMS_FOR_TAKE_TWO) {
                hints.canTake2Same.push(g);
            }
        });

        // Check Reserve from Deck
        if (hints.canReserve) {
            for (let level = 1; level <= 3; level++) {
                 if (gameState.deckCounts[level] > 0) {
                    hints.canReserveFromDeck[level] = true;
                 }
            }
        }

        // Check Affordable Purchases (using current player state)
        const currentRealPlayer = players[currentPlayerIndex]; // Need real player for canAffordCard
        if (currentRealPlayer) {
             // Visible Cards
            for (let level = 1; level <= 3; level++) {
                gameState.visibleCards[level].forEach(card => {
                    if (card) {
                        const { canAfford } = canAffordCard(currentRealPlayer, card);
                        if (canAfford) {
                            hints.canPurchaseVisible.push({ cardId: card.id, level: card.level, color: card.color, vp: card.vp });
                        }
                    }
                });
            }
             // Reserved Cards
             currentRealPlayer.reservedCards.forEach(card => { // Check actual reserved cards
                 if (card) {
                     const { canAfford } = canAffordCard(currentRealPlayer, card);
                     if (canAfford) {
                          hints.canPurchaseReserved.push({ cardId: card.id, level: card.level, color: card.color, vp: card.vp });
                     }
                 }
             });
        } else {
             console.warn("Cannot check affordability hints: current player not found in main players array.");
        }


        return hints;
    }

    function createPromptForGemini(gameState) {
        // Calculate valid action hints based on the current state
        const validHints = getValidActionHints(gameState);

        const prompt = `
You are a world-champion-level Splendor AI. Your goal is to win decisively by selecting the absolute optimal move based on the provided game state, history, and valid action hints.

**Internal Thinking Process (Perform these steps before deciding):**
1.  **Analyze Self:** Your score, resources, goals.
2.  **Analyze Opponents:** Their state, threats, potential moves.
3.  **Analyze Board:** Card values, affordability, blocking opportunities.
4.  **Analyze Nobles:** Your progress vs. opponent progress.
5.  **Analyze History:** Recent actions (patterns, targets).
6.  **Review Valid Actions (Hints below):** Consider the *possible* moves identified. If taking gems, which specific combo is best? If purchasing, which specific card? If reserving, which card/deck?
7.  **Evaluate Actions:** Mentally simulate outcomes.
8.  **Select Optimal Move:** Choose the single BEST action. Prioritize valid moves suggested below, but use your strategic judgment if reserving or taking different gems seems superior despite not being explicitly listed as 'affordable purchase'.

**Current Game State:**
*   Turn: ${gameState.turnInfo.turnNumber}
*   You are Player ${gameState.currentPlayer.id} (${gameState.currentPlayer.name})
*   Winning Score: ${gameState.rules.WINNING_SCORE} VP
*   Final Round Active: ${gameState.turnInfo.isFinalRound}
*   Bank: ${JSON.stringify(gameState.bank)}
*   Deck Counts: L1: ${gameState.deckCounts[1]}, L2: ${gameState.deckCounts[2]}, L3: ${gameState.deckCounts[3]}
*   Available Nobles: ${JSON.stringify(gameState.availableNobles)}
*   Visible Cards: L3: ${JSON.stringify(gameState.visibleCards[3])} | L2: ${JSON.stringify(gameState.visibleCards[2])} | L1: ${JSON.stringify(gameState.visibleCards[1])}

**Your Hand (Player ${gameState.currentPlayer.id} - ${gameState.currentPlayer.name}):**
*   Score: ${gameState.currentPlayer.score} VP
*   Gems: ${JSON.stringify(gameState.currentPlayer.gems)}
*   Bonuses: ${JSON.stringify(gameState.currentPlayer.bonuses)}
*   Reserved Cards (${gameState.currentPlayer.reservedCards.length}/${gameState.rules.MAX_RESERVED_CARDS}): ${JSON.stringify(gameState.currentPlayer.reservedCards)}
*   Acquired Nobles: ${JSON.stringify(gameState.currentPlayer.nobles)}

**Opponents:** ${JSON.stringify(gameState.opponents)}

**Game History (Last ~15 Actions):**
${JSON.stringify(gameState.gameHistory.slice(-15))} ${gameState.gameHistory.length > 15 ? `\n...(truncated, ${gameState.gameHistory.length} total actions)`: ''}

**VALID ACTION HINTS (Based on Current State):**
*   Take 3 Different Gems Possible: ${validHints.canTake3Different}
*   Take 2 Same Color Gems Possible: [${validHints.canTake2Same.join(', ')}] (Requires Bank >= ${MIN_GEMS_FOR_TAKE_TWO})
*   Can Reserve (Limit < ${MAX_RESERVED_CARDS}): ${validHints.canReserve}
    *   Reserve from Deck L1 Possible: ${validHints.canReserveFromDeck[1]}
    *   Reserve from Deck L2 Possible: ${validHints.canReserveFromDeck[2]}
    *   Reserve from Deck L3 Possible: ${validHints.canReserveFromDeck[3]}
*   Affordable Visible Cards: ${JSON.stringify(validHints.canPurchaseVisible)}
*   Affordable Reserved Cards: ${JSON.stringify(validHints.canPurchaseReserved)}

**Required Output Format (JSON ONLY):**
CRITICAL: Your response MUST be ONLY the raw JSON object for your chosen action. NO extra text, NO markdown \`\`\`. Choose ONE format:

1.  {"action":"TAKE_GEMS","gems":["color1","color2","color3"]}
2.  {"action":"TAKE_GEMS","gems":["color","color"]}
3.  {"action":"RESERVE_CARD","source":"visible","cardId":"card-id-string"}
4.  {"action":"RESERVE_CARD","source":"deck","level":level_number}
5.  {"action":"PURCHASE_CARD","source":"visible","cardId":"card-id-string"}
6.  {"action":"PURCHASE_CARD","source":"reserved","cardId":"card-id-string"}

Based on your analysis and the valid hints, provide ONLY the single JSON object for your optimal action.
`;
        return prompt;
    }

    async function fetchGeminiActionDirect(prompt) {
        if (!AI_CONFIG.isEnabled || !GEMINI_API_KEY) {
             console.error("Attempted to call Gemini without API Key.");
             return null;
        }

        const requestBody = {
            contents: [{ parts: [{ text: prompt }] }],
            // Optional: Add safetySettings if needed
            // generationConfig: { temperature: 0.7 } // Adjust temperature if needed
        };
        const fullUrl = `${GEMINI_API_URL}${GEMINI_API_KEY}`;

        for (let i = 0; i <= AI_CONFIG.maxRetries; i++) {
             console.log(`AI API Call Attempt ${i + 1}/${AI_CONFIG.maxRetries + 1}`);
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.requestTimeoutMs);

                const response = await fetch(fullUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorBody = await response.text();
                    console.error(`Gemini API Error ${response.status}: ${errorBody}`);
                    throw new Error(`API Error (${response.status}): ${response.statusText}`);
                }

                const data = await response.json();
                if (AI_CONFIG.logResponses) console.log("AI Response Raw:", JSON.stringify(data, null, 2));

                // --- Extract and Parse JSON Response ---
                if (data.candidates && data.candidates[0]?.content?.parts?.[0]) {
                    const responseText = data.candidates[0].content.parts[0].text;
                    try {
                        // Clean potential markdown formatting
                        const cleanedResponse = responseText.replace(/^```json\s*|```$/g, '').trim();
                        // Attempt to parse
                        const actionJson = JSON.parse(cleanedResponse);
                        if (AI_CONFIG.logResponses) console.log("Parsed AI JSON:", actionJson);

                        // *** FIX: Return ANY valid parsed JSON object ***
                        // The calling function will validate the specific structure needed (action, return, nobleId)
                        if (actionJson && typeof actionJson === 'object') {
                             return actionJson; // Success! Return the parsed object
                         } else {
                             // This case means JSON.parse succeeded but resulted in null, boolean, number etc. which is not expected.
                             throw new Error("Parsed JSON is not a valid object.");
                         }
                    } catch (parseError) {
                        console.error("Failed to parse AI response JSON:", parseError, "\nRaw Text:", responseText);
                        // Don't retry on parsing error, the response is fundamentally bad
                        return null; // Indicate failure to parse
                    }
                } else if (data.promptFeedback?.blockReason) {
                    console.error("Gemini Prompt Blocked:", data.promptFeedback.blockReason, data.promptFeedback.safetyRatings);
                    updateLog(`AI Error: Prompt blocked by safety filters (${data.promptFeedback.blockReason}).`);
                    return null; // Indicate failure due to blocking
                } else {
                    console.error("Unexpected Gemini API response structure:", data);
                    throw new Error("Unexpected API response structure"); // Throw error to trigger retry or failure
                }

            } catch (error) {
                 if (error.name === 'AbortError') {
                     console.error(`AI API Call timed out after ${AI_CONFIG.requestTimeoutMs}ms (Attempt ${i + 1})`);
                 } else {
                     console.error(`Error fetching AI action (Attempt ${i + 1}):`, error);
                 }
                if (i === AI_CONFIG.maxRetries) {
                    updateLog(`AI Error: Max retries reached for API call.`);
                    return null; // Failed after all retries
                }
                // Wait before retrying (simple backoff)
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
        // Should only be reached if all retries fail
        return null;
    }

    function validateAiAction(action, gameState) {
        // Rigorous check of the AI's proposed action against the game state *it was given*
        const player = gameState.currentPlayer; // Use the state AI saw
        console.log(`[validateAiAction] Validating AI Action for ${player.name}:`, action); // Log validation start

        try { // Wrap in try-catch for safety
            switch (action.action) {
                case 'TAKE_GEMS':
                    if (!action.gems || !Array.isArray(action.gems)) { console.log(" -> Validation Fail: Invalid gems structure."); return null; }
                    const gemCount = action.gems.length;
                    const uniqueGems = new Set(action.gems);

                    if (!action.gems.every(g => GEM_TYPES.includes(g))) { console.log(" -> Validation Fail: Invalid gem color."); return null; }

                    if (gemCount === 3) {
                        if (uniqueGems.size !== 3) { console.log(" -> Validation Fail: Take 3 requires 3 unique gems."); return null; }
                        if (!action.gems.every(g => gameState.bank[g] >= 1)) { console.log(` -> Validation Fail: Take 3 - Bank lacks required gems. Bank: ${JSON.stringify(gameState.bank)}`); return null; }
                        console.log(" -> Validation Pass: Take 3 Gems");
                    } else if (gemCount === 2) {
                        if (uniqueGems.size !== 1) { console.log(" -> Validation Fail: Take 2 requires 2 identical gems."); return null; }
                        const type = action.gems[0];
                        // *** ADD EXPLICIT LOG FOR BANK COUNT CHECK ***
                        console.log(` -> Validation Check: Take 2 ${type}. Bank has ${gameState.bank[type]}. Need >= ${MIN_GEMS_FOR_TAKE_TWO}.`);
                        if (gameState.bank[type] < MIN_GEMS_FOR_TAKE_TWO) {
                             console.log(` -> Validation Fail: Take 2 ${type} - Bank count insufficient.`);
                             return null;
                        }
                        console.log(" -> Validation Pass: Take 2 Gems");
                    } else {
                        console.log(` -> Validation Fail: Invalid number of gems (${gemCount}).`);
                        return null; // Invalid number of gems
                    }
                    return action; // Valid TAKE_GEMS

                // ... (rest of validation for RESERVE_CARD, PURCHASE_CARD) ...
                case 'RESERVE_CARD':
                     if (player.reservedCards.length >= MAX_RESERVED_CARDS) { console.log(" -> Validation Fail: Reserve limit reached."); return null; }
                     if (!action.source || (action.source !== 'visible' && action.source !== 'deck')) { console.log(" -> Validation Fail: Invalid reserve source."); return null; }
                     if (action.source === 'visible') {
                         if (!action.cardId) { console.log(" -> Validation Fail: Missing cardId for visible reserve."); return null; }
                         const cardExists = Object.values(gameState.visibleCards).flat().some(c => c && c.id === action.cardId);
                         if (!cardExists) { console.log(` -> Validation Fail: Visible card ${action.cardId} not found.`); return null; }
                     } else { // source === 'deck'
                         if (!action.level || ![1, 2, 3].includes(action.level)) { console.log(` -> Validation Fail: Invalid deck level ${action.level}.`); return null; }
                         if (gameState.deckCounts[action.level] <= 0) { console.log(` -> Validation Fail: Deck L${action.level} is empty.`); return null; }
                     }
                      console.log(" -> Validation Pass: Reserve Card");
                     return action;
                case 'PURCHASE_CARD':
                    if (!action.source || (action.source !== 'visible' && action.source !== 'reserved')) { console.log(" -> Validation Fail: Invalid purchase source."); return null; }
                    if (!action.cardId) { console.log(" -> Validation Fail: Missing cardId for purchase."); return null; }
                    let cardToPurchase = null;
                    if (action.source === 'visible') { cardToPurchase = Object.values(gameState.visibleCards).flat().find(c => c && c.id === action.cardId); }
                    else { cardToPurchase = player.reservedCards.find(c => c.id === action.cardId); }
                    if (!cardToPurchase) { console.log(` -> Validation Fail: Card ${action.cardId} not found for purchase.`); return null; }
                     const { canAfford: aiCanAfford } = canAffordCard({ gems: player.gems, bonuses: player.bonuses }, cardToPurchase);
                     if (!aiCanAfford) { console.warn(`AI Validation: Cannot afford card ${action.cardId}`); console.log(` -> Validation Fail: Cannot afford card ${action.cardId}.`); return null; }
                      console.log(" -> Validation Pass: Purchase Card");
                    return action;

                default:
                    console.warn("AI Validation: Unknown action type:", action.action);
                    return null; // Unknown action
            }
        } catch (validationError) {
             console.error("Error during AI action validation:", validationError, "Action:", action);
             return null;
        }
    }

    function executeAiAction(action) {
        const player = players[currentPlayerIndex];
        console.log(`AI ${player.name} executing: ${action.action}`, action);
        switch (action.action) {
            case 'TAKE_GEMS': selectedGemTypes = action.gems; performTakeGems(); break;
            case 'RESERVE_CARD':
                if (action.source === 'visible') {
                     const cardElement = document.querySelector(`.card[data-card-id='${action.cardId}']`);
                     if (cardElement) { const level = parseInt(cardElement.dataset.level, 10); selectedCard = { type: 'visible', level: level, id: action.cardId, element: cardElement }; performReserveCard(); }
                     else { console.error(`AI Execute Error: Could not find visible card element for ${action.cardId}`); executeFallbackAiAction(getGameStateForAI()); }
                } else {
                     const deckElement = deckElements[action.level];
                      if (deckElement) { selectedCard = { type: 'deck', level: action.level, id: `deck-${action.level}`, element: deckElement }; performReserveCard(); }
                      else { console.error(`AI Execute Error: Could not find deck element for level ${action.level}`); executeFallbackAiAction(getGameStateForAI()); }
                } break;
            case 'PURCHASE_CARD':
                 let cardElement = null; let cardData = null;
                 if (action.source === 'visible') {
                    cardElement = document.querySelector(`.card[data-card-id='${action.cardId}']`);
                    if (cardElement) { cardData = getCardById(action.cardId); if (cardData) { selectedCard = { type: 'visible', level: cardData.level, id: action.cardId, element: cardElement }; performPurchaseCard(); }
                        else { console.error(`AI Execute Error: Could not find visible card data for ${action.cardId}`); executeFallbackAiAction(getGameStateForAI()); } }
                    else { console.error(`AI Execute Error: Could not find visible card element for ${action.cardId}`); executeFallbackAiAction(getGameStateForAI()); }
                 } else {
                      cardData = player.reservedCards.find(c => c.id === action.cardId);
                       cardElement = document.querySelector(`#player-area-${player.id} .reserved-card-small[data-card-id='${action.cardId}']`);
                      if (cardData && cardElement) { selectedCard = { type: 'reserved', level: cardData.level, id: action.cardId, element: cardElement }; performPurchaseCard(); }
                      else { console.error(`AI Execute Error: Could not find reserved card data or element for ${action.cardId}`); executeFallbackAiAction(getGameStateForAI()); }
                 } break;
            default: console.error(`AI Execute Error: Unknown action type ${action.action}`); executeFallbackAiAction(getGameStateForAI());
        }
    }

    function executeFallbackAiAction(gameState) {
        const player = players[currentPlayerIndex]; updateLog(`AI ${player.name} executing fallback action.`); console.warn(`Executing fallback for ${player.name}.`);
        let cheapestCard = null; let minCost = Infinity;
        const checkCardAffordability = (card, source) => {
            if (!card) return; const { canAfford, effectiveCost } = canAffordCard(player, card);
            if (canAfford) { const totalCost = Object.values(effectiveCost).reduce((sum, c) => sum + c, 0); const costMetric = totalCost - (card.vp * 0.1);
                if (costMetric < minCost) { minCost = costMetric; cheapestCard = { ...card, source: source }; } } };
        Object.values(visibleCards).flat().forEach(card => checkCardAffordability(card, 'visible'));
        player.reservedCards.forEach(card => checkCardAffordability(card, 'reserved'));
        if (cheapestCard) {
            updateLog(`AI Fallback: Purchasing cheapest card ${cheapestCard.id}`);
            const cardElement = cheapestCard.source === 'visible' ? document.querySelector(`.card[data-card-id='${cheapestCard.id}']`) : document.querySelector(`#player-area-${player.id} .reserved-card-small[data-card-id='${cheapestCard.id}']`);
            if (cardElement) { selectedCard = { type: cheapestCard.source, level: cheapestCard.level, id: cheapestCard.id, element: cardElement }; performPurchaseCard(); return; }
            else { console.warn("Fallback purchase failed: element not found."); } }
        const availableTypes = GEM_TYPES.filter(g => bank[g] > 0);
        if (availableTypes.length >= 3) { selectedGemTypes = availableTypes.slice(0, 3); updateLog(`AI Fallback: Taking 3 gems: ${selectedGemTypes.join(', ')}`); performTakeGems(); return; }
        const takeTwoType = GEM_TYPES.find(g => bank[g] >= MIN_GEMS_FOR_TAKE_TWO);
        if (takeTwoType) { selectedGemTypes = [takeTwoType, takeTwoType]; updateLog(`AI Fallback: Taking 2 ${takeTwoType} gems.`); performTakeGems(); return; }
         if (player.reservedCards.length < MAX_RESERVED_CARDS) {
             const l1Visible = visibleCards[1].find(c => c !== null);
             if (l1Visible) { const cardElement = document.querySelector(`.card[data-card-id='${l1Visible.id}']`);
                 if (cardElement) { updateLog(`AI Fallback: Reserving L1 card ${l1Visible.id}`); selectedCard = { type: 'visible', level: 1, id: l1Visible.id, element: cardElement }; performReserveCard(); return; } }
             else if (decks[1].length > 0) { updateLog(`AI Fallback: Reserving from L1 deck.`); const deckElement = deckElements[1]; selectedCard = { type: 'deck', level: 1, id: `deck-1`, element: deckElement }; performReserveCard(); return; } }
        updateLog(`AI Fallback: No valid fallback action found. Passing turn.`);
        logActionToHistory(player, 'FALLBACK_PASS', {}); // Log the fallback pass
        endTurn('FALLBACK_PASS');
    }

    async function handleAiReturnGems(player, currentTotalGems, gemsToReturnCount, callback) {
        console.log(`AI ${player.name} needs to return ${gemsToReturnCount} gems.`); showAiThinking(`${player.name} (Returning Gems)`); updateClickableState();
        const nonGoldGemsOwned = {}; let nonGoldGemElements = [];
        GEM_TYPES.forEach(type => { if (player.gems[type] > 0) { nonGoldGemsOwned[type] = player.gems[type]; for (let i = 0; i < player.gems[type]; i++) { const dummyEl = document.createElement('div'); dummyEl.dataset.returnGemType = type; nonGoldGemElements.push(dummyEl); } } });
        if (nonGoldGemElements.length < gemsToReturnCount) {
             console.warn(`AI ${player.name} cannot return ${gemsToReturnCount} non-gold gems (only has ${nonGoldGemElements.length}).`);
             updateLog(`AI ${player.name} has ${currentTotalGems} tokens but cannot return required ${gemsToReturnCount} non-gold. Continuing turn.`);
             hideAiThinking(); if (callback) callback(); return;
        }
        try {
            const gameState = getGameStateForAI();
            const prompt = `You are the Splendor AI Player ${player.name}. You MUST return exactly ${gemsToReturnCount} non-gold gems (limit ${MAX_GEMS_PLAYER}, you have ${currentTotalGems}). Your non-gold gems: ${JSON.stringify(nonGoldGemsOwned)}. Game state/history provided. Choose OPTIMAL gems to return. Respond ONLY with JSON: { "return": ["color1", ...] } Example: { "return": ["white", "blue"] } Ensure exactly ${gemsToReturnCount} gems. \n${JSON.stringify(gameState, null, 2)}`;
            if (AI_CONFIG.logPrompts) console.log(`[AI Return Gems Prompt - ${player.name}]:\n`, prompt);
            const aiResponse = await fetchGeminiActionDirect(prompt);
            let validatedChoice = null;
            if (aiResponse?.return) { validatedChoice = validateAiReturnGems(aiResponse.return, nonGoldGemsOwned, gemsToReturnCount);
                 if (!validatedChoice) { console.warn(`AI ${player.name} proposed invalid gems to return:`, aiResponse.return); updateLog(`AI ${player.name} proposed invalid return choice. Using fallback.`); }
            } else { console.warn(`AI ${player.name} failed to get return choice from API.`); updateLog(`AI ${player.name} failed to get return choice from API. Using fallback.`); }
            if (validatedChoice) {
                console.log(`AI ${player.name} executing return:`, validatedChoice); let elementsToReturn = []; let tempOwned = {...nonGoldGemsOwned};
                 for (const typeToReturn of validatedChoice) { if(tempOwned[typeToReturn] > 0) { const el = nonGoldGemElements.find(e => e.dataset.returnGemType === typeToReturn); if(el) { elementsToReturn.push(el); nonGoldGemElements.splice(nonGoldGemElements.indexOf(el), 1); tempOwned[typeToReturn]--; } else { console.error(`Return logic error: Could not find dummy element for ${typeToReturn}`); } } }
                 if(elementsToReturn.length === gemsToReturnCount) { executeReturnGems(player, elementsToReturn, callback); }
                 else { console.error(`Return logic error: Element selection count mismatch.`); executeFallbackReturnGems(player, nonGoldGemsOwned, gemsToReturnCount, callback); }
            } else { executeFallbackReturnGems(player, nonGoldGemsOwned, gemsToReturnCount, callback); }
        } catch (error) { console.error(`Error during AI gem return for ${player.name}:`, error); updateLog(`Error during AI ${player.name}'s gem return. Using fallback.`); executeFallbackReturnGems(player, nonGoldGemsOwned, gemsToReturnCount, callback);
        } finally { setTimeout(hideAiThinking, AI_CONFIG.thinkingIndicatorDelayMs / 2); }
    }

     function validateAiReturnGems(chosenGems, ownedNonGold, countNeeded) {
         if (!Array.isArray(chosenGems) || chosenGems.length !== countNeeded) { console.warn("AI Return Validation: Incorrect number of gems."); return null; }
         let tempOwned = { ...ownedNonGold };
         for (const gem of chosenGems) { if (!GEM_TYPES.includes(gem) || gem === GOLD) { console.warn(`AI Return Validation: Invalid gem type ${gem}.`); return null; } if (!tempOwned[gem] || tempOwned[gem] <= 0) { console.warn(`AI Return Validation: Tried to return ${gem}, but doesn't own enough.`); return null; } tempOwned[gem]--; }
         return chosenGems;
     }

     function executeFallbackReturnGems(player, ownedNonGold, countNeeded, callback) {
          updateLog(`AI ${player.name} executing fallback gem return.`); console.warn(`Executing fallback return for ${player.name}.`);
         let gemsToReturn = []; let availableToReturn = [];
         GEM_TYPES.forEach(type => { for (let i = 0; i < (ownedNonGold[type] || 0); i++) { availableToReturn.push(type); } });
          // Simple: return least valuable (or most common if tie?) - Let's do most common first
          const counts = availableToReturn.reduce((acc, type) => { acc[type] = (acc[type] || 0) + 1; return acc; }, {});
          availableToReturn.sort((a, b) => counts[b] - counts[a]); // Sort by frequency desc
          gemsToReturn = availableToReturn.slice(0, countNeeded);
          let elementsToReturn = []; let tempOwned = {...ownedNonGold};
           for (const typeToReturn of gemsToReturn) { if(tempOwned[typeToReturn] > 0) { const dummyEl = document.createElement('div'); dummyEl.dataset.returnGemType = typeToReturn; elementsToReturn.push(dummyEl); tempOwned[typeToReturn]--; } }
           if (elementsToReturn.length === countNeeded) { executeReturnGems(player, elementsToReturn, callback); }
           else { console.error("Fallback return generation failed."); updateLog(`AI ${player.name} CRITICAL FALLBACK ERROR: Could not determine gems to return. Continuing turn.`); if(callback) callback(); }
     }

    async function handleAiNobleChoice(player, eligibleNobles, callback) {
         console.log(`AI ${player.name} needs to choose from ${eligibleNobles.length} nobles.`); showAiThinking(`${player.name} (Choosing Noble)`); updateClickableState();
         try {
             const gameState = getGameStateForAI();
             const prompt = `You are the Splendor AI Player ${player.name}. You MUST choose ONE noble. Eligible Nobles: ${JSON.stringify(eligibleNobles)}. Game state/history provided. Choose the OPTIMAL noble. Respond ONLY with JSON: { "nobleId": "noble-id-string" } Example: { "nobleId": "noble-5" } Ensure ID is from eligible list. \n${JSON.stringify(gameState, null, 2)}`;
             if (AI_CONFIG.logPrompts) console.log(`[AI Noble Choice Prompt - ${player.name}]:\n`, prompt);
             const aiResponse = await fetchGeminiActionDirect(prompt);
             let validatedChoiceId = null;
             if (aiResponse?.nobleId) { validatedChoiceId = validateAiNobleChoice(aiResponse.nobleId, eligibleNobles);
                  if (!validatedChoiceId) { console.warn(`AI ${player.name} proposed invalid noble choice:`, aiResponse.nobleId); updateLog(`AI ${player.name} proposed invalid noble choice. Using fallback.`); }
             } else { console.warn(`AI ${player.name} failed to get noble choice from API.`); updateLog(`AI ${player.name} failed to get noble choice from API. Using fallback.`); }
             let chosenNoble = null;
             if (validatedChoiceId) { chosenNoble = eligibleNobles.find(n => n.id === validatedChoiceId); }
             else { eligibleNobles.sort((a, b) => b.vp - a.vp); chosenNoble = eligibleNobles[0]; updateLog(`AI ${player.name} executing fallback noble choice (Highest VP).`); console.warn(`Executing fallback noble choice for ${player.name}.`); }
             if (chosenNoble) { if(awardNoble(player, chosenNoble)){ renderNobles(); renderPlayerArea(player.id); } } // awardNoble returns true on success
             else { console.error("AI Noble Choice: Could not determine a noble to award!"); }
         } catch (error) {
             console.error(`Error during AI noble choice for ${player.name}:`, error); updateLog(`Error during AI ${player.name}'s noble choice. Using fallback.`);
              let fallbackNoble = null; if (eligibleNobles.length > 0) { eligibleNobles.sort((a, b) => b.vp - a.vp); fallbackNoble = eligibleNobles[0]; if (fallbackNoble) { if(awardNoble(player, fallbackNoble)){ renderNobles(); renderPlayerArea(player.id); } } }
         } finally { setTimeout(hideAiThinking, AI_CONFIG.thinkingIndicatorDelayMs / 2); if (callback) callback(); }
     }

     function validateAiNobleChoice(chosenNobleId, eligibleNobles) {
         if (!chosenNobleId) return null; const isValid = eligibleNobles.some(n => n.id === chosenNobleId);
         if (!isValid) console.warn(`AI Noble Validation: Chosen ID ${chosenNobleId} not in eligible list.`); return isValid ? chosenNobleId : null;
     }

    // =========================================================================
    // TURN MANAGEMENT & GAME FLOW
    // =========================================================================

    function startTurn() {
        if (gameTrulyFinished) return;
        highlightActivePlayer(); clearActionState();
        const currentPlayer = players[currentPlayerIndex];
        if (isSimulationMode && isSimulationPaused) { console.log("Turn start skipped: Simulation paused."); return; }
        if (!isSimulationMode && currentPlayer.type === 'human') { endTurnEarlyBtn.classList.remove('hidden'); }
        else { endTurnEarlyBtn.classList.add('hidden'); }
        if (currentPlayer.type === 'ai') {
            console.log(`Starting AI turn for ${currentPlayer.name}`);
            const delay = isSimulationMode ? simulationTurnDelayMs : AI_CONFIG.thinkingIndicatorDelayMs / 3;
            stopTimer(); renderTimer(); updateClickableState();
            setTimeout(() => { if (isSimulationMode && isSimulationPaused) { console.log("AI turn execution skipped post-delay: Simulation paused."); return; } handleAiTurn(); }, delay);
        } else {
            console.log(`Starting Human turn for ${currentPlayer.name}`);
            startTimer(); updateClickableState();
        }
    }

    function endTurn(actionType = 'UNKNOWN') {
        console.log(`Ending turn for Player ${currentPlayerIndex} (${players[currentPlayerIndex].name}). Action: ${actionType}. Turn: ${turnNumber}`);
        stopTimer(); const player = players[currentPlayerIndex]; player.stats.turnsTaken++;
        const currentNonGoldGems = GEM_TYPES.reduce((sum, type) => sum + player.gems[type], 0);
        const currentGoldGems = player.gems[GOLD] || 0; const currentTotalGems = currentNonGoldGems + currentGoldGems;
        player.stats.peakGemsHeld = Math.max(player.stats.peakGemsHeld, currentTotalGems);
        if (currentTotalGems === MAX_GEMS_PLAYER) player.stats.turnsEndedExactLimit++; else if (currentTotalGems < MAX_GEMS_PLAYER) player.stats.turnsEndedBelowLimit++;
        checkForNobleVisit(player, () => {
            checkForGemLimit(player, () => {
                const scoreJustReached = player.score >= WINNING_SCORE;
                if (scoreJustReached && player.stats.turnReached15VP === null) player.stats.turnReached15VP = turnNumber;
                const gameEndTriggeredThisTurn = checkAndSetGameOverCondition(player);
                if (gameEndTriggeredThisTurn) player.stats.triggeredGameEnd = true;
                if (isGameOverConditionMet && currentPlayerIndex === lastRoundPlayerIndex) {
                    console.log(`Player ${currentPlayerIndex} (${player.name}) was the last player of the final round. Ending game.`); updateLog(`--- Final Turn Completed ---`);
                    endGame(); return;
                }
                currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
                if (currentPlayerIndex === 0 && !isGameOverConditionMet) {
                    turnNumber++; console.log(`Starting Round ${Math.ceil(turnNumber / players.length)}, Turn ${turnNumber}`);
                } else if (isGameOverConditionMet) { console.log(`Continuing final round. Next player: ${currentPlayerIndex} (${players[currentPlayerIndex].name})`); }
                 if (!gameTrulyFinished) {
                      updateLog(`Player ${players[currentPlayerIndex].name}'s turn (#${turnNumber}).`);
                      if (isSimulationMode) { setTimeout(startTurn, 0); } // Auto-advance in sim
                      else { startTurn(); } // Normal start for human/AI mix
                 } else { updateClickableState(); } // Final UI update if game just ended
            });
        });
    }

    function checkAndSetGameOverCondition(player) {
        if (!isGameOverConditionMet && player.score >= WINNING_SCORE) {
            isGameOverConditionMet = true; lastRoundPlayerIndex = (players.length - 1); // Game ends after last player index completes turn
            updateLog(`--- Player ${player.name} (${player.type.toUpperCase()}) reached ${player.score} VP! Final round begins. All players up to Player ${players[lastRoundPlayerIndex].name} complete their turn. ---`);
            console.log(`Game end condition met by Player ${player.id} (${player.name}). Final round initiated. Game ends after player index: ${lastRoundPlayerIndex}.`);
            return true;
        } return false;
    }

    function checkForNobleVisit(player, callback) {
        const eligibleNobles = availableNobles.filter(noble => GEM_TYPES.every(gemType => (player.bonuses[gemType] || 0) >= (noble.requirements[gemType] || 0)));
        if (eligibleNobles.length === 0) { if (callback) callback(); }
        else if (eligibleNobles.length === 1) { if (awardNoble(player, eligibleNobles[0])) { renderNobles(); renderPlayerArea(player.id); } if (callback) callback(); }
        else { if (player.type === 'human') { updateLog(`Player ${player.name} qualifies for multiple nobles. Choose one.`); showNobleChoiceOverlay(player, eligibleNobles, callback); }
               else { handleAiNobleChoice(player, eligibleNobles, callback); } }
    }

    function showNobleChoiceOverlay(player, eligibleNobles, callback) {
        nobleChoiceOptionsContainer.innerHTML = '';
        eligibleNobles.forEach(nobleData => {
            const nobleEl = createNobleElement(nobleData); nobleEl.classList.add('clickable');
            nobleEl.onclick = () => { handleNobleChoice(player, nobleData, callback); updateClickableState(); };
            nobleChoiceOptionsContainer.appendChild(nobleEl); });
        nobleChoiceOverlay.classList.remove('hidden'); updateClickableState();
    }

    function handleNobleChoice(player, chosenNoble, callback) {
        nobleChoiceOverlay.classList.add('hidden');
        if (awardNoble(player, chosenNoble)) { renderNobles(); renderPlayerArea(player.id); }
        if (callback) callback();
    }

    function checkForGemLimit(player, callback) {
        const nonGoldGems = GEM_TYPES.reduce((sum, type) => sum + player.gems[type], 0);
        const goldGems = player.gems[GOLD] || 0; const totalGems = nonGoldGems + goldGems;
        if (totalGems > MAX_GEMS_PLAYER) {
            const excessGems = totalGems - MAX_GEMS_PLAYER; const actualGemsToReturn = Math.min(excessGems, nonGoldGems);
            if (actualGemsToReturn > 0) { updateLog(`Player ${player.name} (${player.type.toUpperCase()}) has ${totalGems} total tokens (limit ${MAX_GEMS_PLAYER}). Must return ${actualGemsToReturn} non-gold tokens.`);
                 if (player.type === 'human') { showReturnGemsOverlay(player, totalGems, actualGemsToReturn, callback); }
                 else { handleAiReturnGems(player, totalGems, actualGemsToReturn, callback); }
            } else { updateLog(`Player ${player.name} (${player.type.toUpperCase()}) has ${totalGems} total tokens, but cannot return the required ${excessGems} non-gold tokens.`); if (callback) callback(); }
        } else { if (callback) callback(); }
    }

    function showReturnGemsOverlay(player, currentTotalGems, gemsToReturnCount, callback) {
        returnGemsCountSpan.textContent = `${currentTotalGems} / ${MAX_GEMS_PLAYER}`; returnGemsNeededSpan.textContent = gemsToReturnCount;
        returnGemsPlayerDisplay.innerHTML = '';
        GEM_TYPES.forEach(type => { for (let i = 0; i < player.gems[type]; i++) { const gemEl = createGemElement(type, 1, false); gemEl.classList.add('clickable'); gemEl.dataset.returnGemType = type; gemEl.onclick = () => toggleReturnGemSelection(gemEl, gemsToReturnCount); returnGemsPlayerDisplay.appendChild(gemEl); } });
        if (player.gems.gold > 0) { const goldEl = createGemElement(GOLD, player.gems.gold, true); goldEl.style.cssText = 'opacity:0.5; cursor:not-allowed; margin-left:10px; width:25px; height:25px;'; goldEl.title = "Gold tokens cannot be returned"; if (goldEl.querySelector('.gem-count')) { goldEl.querySelector('.gem-count').style.fontSize = '0.7em'; } returnGemsPlayerDisplay.appendChild(goldEl); }
        confirmReturnGemsBtn.disabled = true; returnGemsSelectionDisplay.textContent = `Selected to return: 0 / ${gemsToReturnCount}`;
        confirmReturnGemsBtn.onclick = () => { handleConfirmReturnGems(player, gemsToReturnCount, callback); updateClickableState(); };
        returnGemsOverlay.classList.remove('hidden'); updateClickableState();
    }

    function toggleReturnGemSelection(gemEl, gemsToReturnCount) {
        gemEl.classList.toggle('selected'); const selectedElements = returnGemsPlayerDisplay.querySelectorAll('.gem.selected[data-return-gem-type]');
        const selectedCount = selectedElements.length; returnGemsSelectionDisplay.textContent = `Selected to return: ${selectedCount}/${gemsToReturnCount}`;
        confirmReturnGemsBtn.disabled = selectedCount !== gemsToReturnCount;
    }

    function endGame() {
        console.log("GAME OVER - Calculating winner and displaying detailed stats..."); updateLog("--- GAME OVER ---");
        gameTrulyFinished = true; stopTimer(); hideOverlays(); clearActionState(); isSimulationPaused = true;
        const sortedPlayers = [...players].sort((a, b) => { if (b.score !== a.score) { return b.score - a.score; } return a.cards.length - b.cards.length; });
        let winners = []; if (sortedPlayers.length > 0) { const topScore = sortedPlayers[0].score; const potentialWinners = sortedPlayers.filter(p => p.score === topScore); if (potentialWinners.length === 1) { winners = potentialWinners; } else { const minCards = Math.min(...potentialWinners.map(p => p.cards.length)); winners = potentialWinners.filter(p => p.cards.length === minCards); } }
        finalScoresDiv.innerHTML = ''; sortedPlayers.forEach((p, index) => {
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
            playerEntryDiv.appendChild(detailsContainer); finalScoresDiv.appendChild(playerEntryDiv); });
        if (winners.length > 1) { const tieMessage = document.createElement('p'); tieMessage.classList.add('tie-message'); tieMessage.textContent = `Tie between: ${winners.map(w => w.name).join(' & ')}! (Fewest cards purchased wins)`; finalScoresDiv.appendChild(tieMessage); updateLog(`Game ended in a tie! Winner(s) determined by fewest cards.`); }
        else if (winners.length === 1) { updateLog(`Winner: ${winners[0].name} with ${winners[0].score} VP!`); }
        else { updateLog("Game ended. No winner determined?"); }
        updateClickableState(); gameOverOverlay.classList.remove('hidden'); simulationPauseBtn.classList.add('hidden'); simulationStatusSpan.classList.add('hidden');
    }

    // =========================================================================
    // STATE MANAGEMENT & UTILITY FUNCTIONS
    // =========================================================================

    function clearActionState() {
        clearGemSelectionState(); clearCardSelectionState(); currentAction = null;
        renderSelectionInfo(); updateClickableState();
    }
    function clearGemSelectionState() {
        gemBankContainer.querySelectorAll('.gem.selected').forEach(el => el.classList.remove('selected'));
        selectedGemTypes = []; if (currentAction === 'SELECTING_GEMS') { currentAction = null; }
    }
    function clearCardSelectionState() {
        // Remove visual selection from the previously selected element
        if (selectedCard && selectedCard.element) {
             // Check if it's a card or deck element before removing class
             if (selectedCard.element.classList.contains('card') || selectedCard.element.classList.contains('deck') || selectedCard.element.classList.contains('reserved-card-small')) {
                 selectedCard.element.classList.remove('selected');
             }
        }
        selectedCard = null; // Clear the logical selection

        // *** FIX: Remove the card preview element if it exists ***
        const existingPreview = selectionInfoDiv.querySelector('.card-preview-container');
        if (existingPreview) {
            console.log("[clearCardSelectionState] Removing existing card preview.");
            existingPreview.remove();
        }
        // Also, ensure default text elements are visible again
        selectionInfoDiv.querySelectorAll('.selection-text').forEach(p => p.style.display = 'block');
        selectedCardDisplay.textContent = 'None'; // Reset text display
        // *** END FIX ***


        if (currentAction === 'SELECTING_CARD') {
            currentAction = null; // Reset action type if it was card selection
        }
        // No need to call renderSelectionInfo/updateClickableState here,
        // the calling function (like handleDeckClick) will handle subsequent updates.
        // However, if called standalone, we might need them. Let's add them back
        // just in case, as clearActionState calls this.
        renderSelectionInfo(); // Render cleared state (buttons etc)
        updateClickableState(); // Update clickable elements
    }
    function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } return array; }
    function countOccurrences(arr, val) { return arr.reduce((count, current) => (current === val ? count + 1 : count), 0); }
    function getCardById(id) { if (!id || typeof id !== 'string') return null; for (let level = 1; level <= 3; level++) { const card = visibleCards[level]?.find(c => c && c.id === id); if (card) return card; } for (const p of players) { const card = p.reservedCards?.find(c => c && c.id === id); if (card) return card; } return null; }
    function getDeckCardPlaceholder(level) { return { level: level, color: 'deck', cost: {}, vp: 0, id: `deck-${level}` }; }
    function canAffordCard(player, cardData) { if (!player || !cardData || !cardData.cost) { return { canAfford: false, goldNeeded: 0, effectiveCost: {} }; } let goldNeeded = 0; const effectiveCost = {}; GEM_TYPES.forEach(gemType => { const cardCost = cardData.cost[gemType] || 0; const playerBonus = player.bonuses[gemType] || 0; const costAfterBonus = Math.max(0, cardCost - playerBonus); effectiveCost[gemType] = costAfterBonus; const playerHasGem = player.gems[gemType] || 0; if (playerHasGem < costAfterBonus) { goldNeeded += costAfterBonus - playerHasGem; } }); const playerHasGold = player.gems.gold || 0; const canAfford = playerHasGold >= goldNeeded; return { canAfford, goldNeeded, effectiveCost }; }
    function drawCard(level, index) { if (decks[level].length > 0) { visibleCards[level][index] = decks[level].pop(); } else { visibleCards[level][index] = null; } }
    function findNonSelectedBankGemElement(gemType, excludeElement = null) { const elements = gemBankContainer.querySelectorAll(`.gem[data-gem-type="${gemType}"]`); for (const el of elements) { if (!el.classList.contains('selected') && el !== excludeElement) { return el; } } return null; }
    function formatCardCostForTitle(cardData) { let title = `L${cardData.level} ${cardData.color} (${cardData.vp} VP)`; const costString = GEM_TYPES.map(type => ({ type, count: cardData.cost[type] || 0 })).filter(item => item.count > 0).map(item => `${item.count} ${item.type}`).join(', '); title += `\nCost: ${costString || 'Free'}`; return title; }
    function createTinyCardElement(cardData) { const cardEl = document.createElement('div'); if (!cardData) return cardEl; cardEl.classList.add('tiny-card', `card-border-${cardData.color}`); const costString = Object.entries(cardData.cost || {}).filter(([,c]) => c > 0).map(([t,c]) => `${c}${t.slice(0,1).toUpperCase()}`).join(', '); cardEl.title = `L${cardData.level} ${cardData.color} (${cardData.vp} VP)\nCost: ${costString || 'Free'}`; const vpSpan = document.createElement('span'); vpSpan.classList.add('tiny-card-vp'); vpSpan.textContent = cardData.vp > 0 ? cardData.vp : ''; const gemBonus = document.createElement('div'); gemBonus.classList.add('tiny-card-gem', `gem-${cardData.color}`); cardEl.appendChild(vpSpan); cardEl.appendChild(gemBonus); return cardEl; }
    function createGemFlowString(gemCounts) { return GEM_TYPES.map(type => ({ type, count: gemCounts[type] || 0 })).filter(item => item.count > 0).map(item => `<span class="gem-inline gem-${item.type}" title="${item.count} ${item.type}">${item.count}</span>`).join(' ') || '<span class="no-items">0</span>'; }

    // =========================================================================
    // UI UPDATES & STATE CHECKS
    // =========================================================================

    function updateClickableState() {
        // === Safety check at the very beginning ===
        if (!players || players.length === 0 || !players[currentPlayerIndex]) {
             console.warn("updateClickableState called before players array or current player fully initialized, skipping UI update for this cycle.");
             return; // Exit the function early
         }

        const player = players[currentPlayerIndex];
        // Determine if input should be globally disabled
        const disableAll = gameTrulyFinished ||
                           isSimulationMode ||
                           isOverlayVisible() || // Includes AI thinking overlay now
                           (player && player.type === 'ai'); // Disable during AI's turn

        // Select all potentially interactive elements that might need disabling/enabling
        const allPotentiallyInteractive = document.querySelectorAll(
            '#gem-bank .gem',
            '#cards-area .card:not(.empty-slot)',
            '#cards-area .deck',
            `.player-area .reserved-card-small`, // Select all reserved cards
            '#end-turn-early-btn',
            '#simulation-pause-btn'
            // Add dynamic action buttons if they need explicit disabling? Usually just clearing them is enough.
        );

        // --- Global Disable/Enable Pass ---
        allPotentiallyInteractive.forEach(el => {
            const isPauseButton = el.id === 'simulation-pause-btn';
            // Disable if disableAll is true, UNLESS it's the pause button in active simulation mode
            const shouldBeDisabled = disableAll && !(isPauseButton && isSimulationMode && !gameTrulyFinished);

            el.classList.toggle('not-selectable', shouldBeDisabled);
            if (shouldBeDisabled) {
                el.classList.remove('selected', 'not-affordable', 'card-affordable-now');
                 // Specifically disable buttons
                 if (el.tagName === 'BUTTON') {
                     el.disabled = true;
                 }
                 // Remove listeners might be overly complex here if class handles it
            } else {
                 // Explicitly enable buttons if not globally disabled
                 if (el.tagName === 'BUTTON') {
                     el.disabled = false;
                 }
            }
        });

        // Clear dynamic buttons if globally disabled
        if (disableAll) {
             dynamicActionButtonsContainer.innerHTML = '';
             // Only clear logical selection state if disabling for reasons OTHER than modal overlays
             // (Prevents losing selection when Return Gems / Noble Choice appears)
             if (!isOverlayVisible() && currentAction) {
                  console.log("Clearing action state due to global disable (not overlay)");
                  clearActionState();
             }
             // Ensure non-button interactive areas are disabled
             document.querySelectorAll('.nobles-container .noble').forEach(el => el.style.pointerEvents = 'none');
              // Re-enable pause button specifically if needed after global disable
              if (isSimulationMode && !gameTrulyFinished && simulationPauseBtn) {
                  simulationPauseBtn.disabled = false;
                  simulationPauseBtn.classList.remove('not-selectable');
              }
             return; // Stop further processing
         }


        // --- Enable Interaction (Human Turn or Preview Click) ---
        // Since disableAll is false, interaction is generally allowed.
        document.querySelectorAll('.nobles-container .noble').forEach(el => el.style.pointerEvents = 'auto');


        // Specific Logic for Human Turn elements:
        const isHumanActiveTurn = player && player.type === 'human';

        // Enable/Disable Gems (Only truly interactive for human turn)
        gemBankContainer.querySelectorAll('.gem').forEach(gemEl => {
             const gemType = gemEl.dataset.gemType;
             const isSelected = gemEl.classList.contains('selected');
             let clickable = false;
             if (isHumanActiveTurn) { // Only check rules if it's human's turn
                 clickable = isGemClickable(gemType, isSelected);
             }
             gemEl.classList.toggle('not-selectable', !clickable);
             // Manage listener
             gemEl.removeEventListener('click', handleGemClickWrapper);
             if (clickable) { // Add listener only if clickable for human
                 gemEl.addEventListener('click', handleGemClickWrapper);
             }
         });

        // Enable/Disable Cards and Decks (Only truly interactive for human turn)
        document.querySelectorAll('#cards-area .card:not(.empty-slot), #cards-area .deck').forEach(el => {
             let disable = true; // Assume disabled unless proven otherwise
             const isDeck = el.classList.contains('deck');
             const isCard = el.classList.contains('card');

             if (isHumanActiveTurn) { // Only enable for human turn
                 let canPlayerAfford = false; let cardData = null;
                 if (isCard) cardData = getCardById(el.dataset.cardId);
                 if (player && cardData) canPlayerAfford = canAffordCard(player, cardData).canAfford;

                 if (currentAction === 'SELECTING_GEMS') { disable = true; }
                 else if (currentAction === 'SELECTING_CARD' && selectedCard?.element !== el) { disable = true; }
                 else { // currentAction is null or matches this element
                     if (isDeck) {
                         if (el.classList.contains('empty') || (currentAction === null && player.reservedCards.length >= MAX_RESERVED_CARDS)) { disable = true; }
                         else { disable = false; } // Deck is selectable if conditions met
                     } else if (isCard && cardData) {
                         const canReserve = player.reservedCards.length < MAX_RESERVED_CARDS;
                         if (currentAction === null && !canPlayerAfford && !canReserve) { disable = true; }
                         else { disable = false; } // Card is selectable
                     } else if (isCard && !cardData) { disable = true; } // Card DOM exists but data doesn't
                     else { disable = false; } // Default to not disabled if human turn and not excluded above
                 }

                 // Affordability styling
                 if (isCard && cardData && !disable) {
                     el.classList.toggle('not-affordable', !canPlayerAfford);
                     el.classList.toggle('card-affordable-now', canPlayerAfford && currentAction !== 'SELECTING_CARD');
                 } else {
                     el.classList.remove('not-affordable', 'card-affordable-now');
                 }
             } // End if(isHumanActiveTurn) for cards/decks

             el.classList.toggle('not-selectable', disable);
             // Manage listeners
             el.removeEventListener('click', handleVisibleCardClickWrapper);
             el.onclick = null; // Clear potential deck onclick
             if (!disable) { // Add listener only if interactive
                 if(isCard) { el.addEventListener('click', handleVisibleCardClickWrapper); }
                 else if(isDeck) { const level = parseInt(el.id.split('-')[1], 10); if(!isNaN(level)) el.onclick = () => handleDeckClick(level); }
             }
         });

         // Reserved Cards (Clickable always for preview, styled only for active human)
          document.querySelectorAll(`.player-area .reserved-card-small`).forEach(cardEl => {
              cardEl.classList.remove('not-selectable'); // Preview click allowed
              cardEl.removeEventListener('click', handleReservedCardClickWrapper); // Remove old
              cardEl.addEventListener('click', handleReservedCardClickWrapper); // Add always

              const cardPlayerArea = cardEl.closest('.player-area');
              const cardPlayerId = cardPlayerArea ? parseInt(cardPlayerArea.id.split('-')[2], 10) : -1;

              // Reset styles first
              cardEl.classList.remove('not-affordable', 'card-affordable-now');

              // Apply styles ONLY if it's the current HUMAN player's card
              if (isHumanActiveTurn && cardPlayerId === currentPlayerIndex) {
                  let canPlayerAfford = false;
                  let cardData = player.reservedCards?.find(c => c.id === cardEl.dataset.cardId);
                  if (cardData) canPlayerAfford = canAffordCard(player, cardData).canAfford;

                  cardEl.classList.toggle('not-affordable', !canPlayerAfford);
                  // Only add highlight if no other card is actively selected in the main panel
                  cardEl.classList.toggle('card-affordable-now', canPlayerAfford && currentAction !== 'SELECTING_CARD');
              }
          });

        // End Turn Button (Handled by initial global disable/enable pass)
        // Simulation Pause Button (Handled by initial global disable/enable pass)

     }

     function isGemClickable(gemType, isSelectedVisual) {
        // Basic checks: Must have gems in bank, cannot be gold
        if (bank[gemType] <= 0 || gemType === GOLD) return false;

        // If interaction is blocked by current action (e.g., selecting a card), it's not clickable
        if (currentAction === 'SELECTING_CARD') return false;

        const currentSelection = selectedGemTypes;
        const currentCount = currentSelection.length;
        const currentUniqueCount = new Set(currentSelection).size;

        // --- Logging for Debugging ---
        // console.log(`[isGemClickable] Checking: ${gemType}, isSelectedVisual: ${isSelectedVisual}, currentCount: ${currentCount}, uniqueCount: ${currentUniqueCount}, bankCount: ${bank[gemType]}`);

        // If the gem element is already visually selected, allow clicking to deselect it
        if (isSelectedVisual) {
            // console.log(" -> Result: true (can deselect)");
            return true;
        }

        // --- Logic for clicking a NOT visually selected gem ---
        else {
            // Can always select the first gem
            if (currentCount === 0) {
               // console.log(" -> Result: true (can select first gem)");
               return true;
            }
            // Selecting the second gem
            else if (currentCount === 1) {
               const firstType = currentSelection[0];
               // Can select a DIFFERENT second gem if available
               if (gemType !== firstType && bank[gemType] >= 1) {
                    // console.log(" -> Result: true (can select 2nd different)");
                   return true;
               }
               // Can select the SAME second gem IF bank has enough
               if (gemType === firstType && bank[gemType] >= MIN_GEMS_FOR_TAKE_TWO) {
                    // console.log(` -> Result: true (can select 2nd identical, bank=${bank[gemType]} >= min=${MIN_GEMS_FOR_TAKE_TWO})`);
                   return true;
               }
               // Otherwise, cannot select this gem as the second one
               // console.log(" -> Result: false (cannot select 2nd gem - rules fail)");
               return false;
            }
            // Selecting the third gem
            else if (currentCount === 2) {
                // Can only select a third gem if the first two were DIFFERENT,
                // this one is also DIFFERENT, and available in the bank.
                const canSelectThird = (currentUniqueCount === 2 && !currentSelection.includes(gemType) && bank[gemType] >= 1);
                // console.log(` -> Result: ${canSelectThird} (can select 3rd different?)`);
               return canSelectThird;
            }
            // Cannot select more than 3 gems
            else { // currentCount >= 3
                // console.log(" -> Result: false (already have 3+ gems selected)");
                return false;
            }
        }
   }

    function highlightActivePlayer() {
        document.querySelectorAll('.player-area.active-player').forEach(el => el.classList.remove('active-player'));
        if (!gameTrulyFinished) { const activePlayerEl = document.getElementById(`player-area-${currentPlayerIndex}`); if (activePlayerEl) { activePlayerEl.classList.add('active-player'); } }
    }

    function updateLog(message) {
        const p = document.createElement('p'); const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const turnPrefix = `[T${turnNumber}]`; p.textContent = `${timestamp} ${turnPrefix} ${message}`;
        logMessagesDiv.appendChild(p); logMessagesDiv.scrollTop = logMessagesDiv.scrollHeight;
    }

    function hideOverlays() {
        returnGemsOverlay.classList.add('hidden'); gameOverOverlay.classList.add('hidden');
        nobleChoiceOverlay.classList.add('hidden'); aiThinkingOverlay.classList.add('hidden');
    }

    function isOverlayVisible() {
        return !returnGemsOverlay.classList.contains('hidden') || !gameOverOverlay.classList.contains('hidden') ||
               !nobleChoiceOverlay.classList.contains('hidden') || !aiThinkingOverlay.classList.contains('hidden');
    }

    function startTimer() {
        stopTimer(); if (isSimulationMode || gameSettings.timerMinutes <= 0 || turnDuration <= 0) { renderTimer(); return; }
        const currentPlayer = players[currentPlayerIndex]; if (!currentPlayer || currentPlayer.type === 'ai') { renderTimer(); return; }
        turnTimeRemaining = turnDuration; renderTimer();
        turnTimerInterval = setInterval(() => {
             const player = players[currentPlayerIndex]; if (gameTrulyFinished || !player || player.type === 'ai' || isOverlayVisible() || (isSimulationMode && isSimulationPaused)) { stopTimer(); renderTimer(); return; }
            turnTimeRemaining--; renderTimer();
            if (turnTimeRemaining < 0) { updateLog(`Player ${player.name}'s turn timed out.`); clearActionState(); logActionToHistory(player, 'TIMEOUT', {}); endTurn('TIMEOUT'); }
        }, 1000);
    }

    function stopTimer() { clearInterval(turnTimerInterval); turnTimerInterval = null; }
    function showAiThinking(playerName) { if (!aiThinkingOverlay) return; aiThinkingPlayerName.textContent = playerName ? `(${playerName})` : ''; aiThinkingOverlay.classList.remove('hidden'); }
    function hideAiThinking() { if (!aiThinkingOverlay) return; aiThinkingOverlay.classList.add('hidden'); }
    function logActionToHistory(player, actionType, details) { const logEntry = { turn: turnNumber, playerIndex: player.id, playerName: player.name, playerType: player.type, actionType: actionType, details: JSON.parse(JSON.stringify(details)) }; gameHistoryLog.push(logEntry); }
    function getThemeColorName(colorClass) { return THEME_COLOR_NAMES[colorClass] || 'Unknown'; }

    // =========================================================================
    // INITIAL SCRIPT EXECUTION
    // =========================================================================

    initializeApiKey(); // Prompt for or load API Key on page load
    document.body.style.alignItems = 'center';
    document.body.style.justifyContent = 'center';
    setupPlayerNameInputs(); // Populate initial player setup fields based on key status
    setupEventListeners(); // Add all button/input listeners

}); // End DOMContentLoaded