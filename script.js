// --- START OF FILE script.js ---
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM References ---
    const setupScreen = document.getElementById('setup-screen');
    const gameContainer = document.getElementById('game-container');
    const playerCountSelect = document.getElementById('player-count');
    const timerInput = document.getElementById('timer-input');
    const playerNamesDiv = document.getElementById('player-names');
    const startGameBtn = document.getElementById('start-game-btn');
    const noblesContainer = document.querySelector('#nobles-area .nobles-container');
    const timerDisplay = document.getElementById('timer-display');
    const logMessagesDiv = document.getElementById('log-messages');
    const endTurnEarlyBtn = document.getElementById('end-turn-early-btn');
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
    const returnGemsPlayerDisplay = document.getElementById('return-gems-player-display');
    const returnGemsSelectionDisplay = document.getElementById('return-gems-selection-display');
    const confirmReturnGemsBtn = document.getElementById('confirm-return-gems-btn');
    const gameOverOverlay = document.getElementById('game-over-overlay');
    const finalScoresDiv = document.getElementById('final-scores');
    const playAgainBtn = document.getElementById('play-again-btn');
    const nobleChoiceOverlay = document.getElementById('noble-choice-overlay');
    const nobleChoiceOptionsContainer = document.getElementById('noble-choice-options');

    // --- Game State Variables & Constants ---
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
    let turnDuration = 0;
    let selectedGemTypes = [];
    let selectedCard = null;
    let currentAction = null; // e.g., 'SELECTING_GEMS', 'SELECTING_CARD'
    const MAX_GEMS_PLAYER = 10;
    const MAX_RESERVED_CARDS = 3;
    const CARDS_PER_LEVEL_VISIBLE = 4;
    const WINNING_SCORE = 15;
    const TIMER_LOW_THRESHOLD = 10; // seconds
    const MIN_GEMS_FOR_TAKE_TWO = 4;
    const PLAYER_COLORS = ['player-color-1', 'player-color-2', 'player-color-3', 'player-color-4'];
    const THEME_COLOR_NAMES = { 'player-color-1': 'Red', 'player-color-2': 'Blue', 'player-color-3': 'Green', 'player-color-4': 'Yellow' };

    // ========================================================================
    // INITIALIZATION & SETUP
    // ========================================================================

    function initGame(playerData) {
        // Reset state
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
        logMessagesDiv.innerHTML = '';
        clearActionState();

        // Initialize Players with stats
        playerData.forEach((pData, i) => {
            players.push({
                id: i,
                name: pData.name,
                colorTheme: pData.colorTheme,
                gems: { white: 0, blue: 0, green: 0, red: 0, black: 0, gold: 0 },
                cards: [], // purchased cards
                reservedCards: [],
                nobles: [],
                score: 0,
                bonuses: { white: 0, blue: 0, green: 0, red: 0, black: 0 },
                // --- Detailed Stats ---
                stats: {
                    isFirstPlayer: (i === 0),
                    turnsTaken: 0,
                    triggeredGameEnd: false,
                    turnReached15VP: null,
                    cardsPurchasedCount: 0,
                    cardsPurchasedByLevel: { 1: 0, 2: 0, 3: 0 },
                    cardsPurchasedByColor: { white: 0, blue: 0, green: 0, red: 0, black: 0 },
                    purchasedFromReserveCount: 0,
                    purchasedFromBoardCount: 0,
                    selfSufficientPurchases: 0, // Purchases made solely with bonuses
                    firstCardPurchasedTurn: { 1: null, 2: null, 3: null },
                    cardsReservedTotalCount: 0,
                    allReservedCardsData: [], // Store data of all cards ever reserved
                    deckReservations: { 1: 0, 2: 0, 3: 0 },
                    boardReservations: { 1: 0, 2: 0, 3: 0 },
                    gemsTaken: { white: 0, blue: 0, green: 0, red: 0, black: 0 },
                    goldTaken: 0,
                    gemsSpent: { white: 0, blue: 0, green: 0, red: 0, black: 0 },
                    goldSpent: 0,
                    gemsReturnedOverLimit: { white: 0, blue: 0, green: 0, red: 0, black: 0 },
                    peakGemsHeld: 0,
                    take3Actions: 0,
                    take2Actions: 0,
                    turnsEndedExactLimit: 0,
                    turnsEndedBelowLimit: 0,
                    noblesAcquiredTurn: {}, // { nobleId: turnNumber }
                    reserveActions: 0,
                    purchaseActions: 0,
                    gemTakeActions: 0,
                }
                // --- End Stats ---
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

        // Initialize Visible Cards
        for (let level = 1; level <= 3; level++) {
            visibleCards[level] = [];
            for (let i = 0; i < CARDS_PER_LEVEL_VISIBLE; i++) {
                drawCard(level, i); // drawCard handles empty decks
            }
        }

        // Initialize Nobles
        const numNobles = gameSettings.playerCount + 1;
        availableNobles = shuffleArray([...ALL_NOBLES]).slice(0, numNobles);

        // Render initial state
        renderBank();
        renderCards();
        renderNobles();
        renderPlayers();

        updateLog("Game started with " + playerData.map(p => p.name).join(', '));
        updateLog(`Player ${players[0].name}'s turn.`);

        // Switch screens
        setupScreen.classList.remove('active');
        setupScreen.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        gameContainer.classList.add('active');
        document.body.style.alignItems = 'flex-start'; // Adjust body alignment for game view
        document.body.style.justifyContent = 'center';

        startTurn();
    }

    function setupPlayerNameInputs() {
        const count = parseInt(playerCountSelect.value);
        playerNamesDiv.innerHTML = '';
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
                const themeName = getThemeColorName(colorClass); // Use helper
                option.textContent = `Theme ${index + 1} (${themeName})`; // Descriptive text
                option.selected = (i === index); // Default selection
                colorSelect.appendChild(option);
            });

            playerInputDiv.appendChild(nameInput);
            playerInputDiv.appendChild(colorSelect);
            playerNamesDiv.appendChild(playerInputDiv);
        }
    }

    function getThemeColorName(colorClass) {
        return THEME_COLOR_NAMES[colorClass] || 'Unknown';
    }

    function setupEventListeners() {
        playerCountSelect.addEventListener('change', setupPlayerNameInputs);

        startGameBtn.addEventListener('click', () => {
            gameSettings.playerCount = parseInt(playerCountSelect.value);
            gameSettings.timerMinutes = parseFloat(timerInput.value);
            turnDuration = gameSettings.timerMinutes * 60; // Convert minutes to seconds

            const playerData = [];
            for (let i = 0; i < gameSettings.playerCount; i++) {
                const nameInput = document.getElementById(`player-name-${i}`);
                const colorSelect = document.getElementById(`player-color-${i}`);
                playerData.push({
                    name: nameInput.value.trim() || `Player ${i + 1}`, // Use default if empty
                    colorTheme: colorSelect.value
                });
            }
            initGame(playerData);
        });

        // Deck click listeners
        deckElements[1].addEventListener('click', () => handleDeckClick(1));
        deckElements[2].addEventListener('click', () => handleDeckClick(2));
        deckElements[3].addEventListener('click', () => handleDeckClick(3));

        // End Turn button
        endTurnEarlyBtn.addEventListener('click', handleEndTurnEarly);

        // Play Again button
        playAgainBtn.addEventListener('click', () => {
            gameOverOverlay.classList.add('hidden');
            setupScreen.classList.remove('hidden');
            setupScreen.classList.add('active');
            gameContainer.classList.remove('active');
            gameContainer.classList.add('hidden');
            document.body.style.alignItems = 'center'; // Reset body alignment
            document.body.style.justifyContent = 'center';
            setupPlayerNameInputs(); // Reset setup options
            isGameOverConditionMet = false;
            gameTrulyFinished = false;
        });
    }

    // ========================================================================
    // RENDERING FUNCTIONS
    // ========================================================================

    function renderBank() {
        gemBankContainer.innerHTML = '';
        [...GEM_TYPES, GOLD].forEach(gemType => {
            const count = bank[gemType];
            if (count >= 0) { // Render even if 0 to show it exists
                const gemEl = createGemElement(gemType, count, true);
                gemEl.dataset.gemType = gemType;
                gemEl.title = `${count} ${gemType} available`;

                // Add click listener regardless of count initially (handled by updateClickableState)
                // No need to check count > 0 here, updateClickableState handles the 'not-selectable' class
                gemEl.removeEventListener('click', handleGemClickWrapper); // Prevent duplicates
                gemEl.addEventListener('click', handleGemClickWrapper);

                // Add not-selectable class initially if gold or count is 0, updateClickableState will refine this for non-gold > 0
                if (gemType === GOLD || count <= 0) {
                     gemEl.classList.add('not-selectable');
                     if (count <= 0) gemEl.title = `No ${gemType} gems available`;
                     if (gemType === GOLD) gemEl.title += ' (Cannot take directly)';
                }

                gemBankContainer.appendChild(gemEl);
            }
        });
         // Ensure clickable state is correct after initial render
         updateClickableState();
    }

    function handleGemClickWrapper(event) {
        const gemEl = event.currentTarget;
        const gemType = gemEl.dataset.gemType;
        // Ensure it's not marked as unselectable by updateClickableState
        // No need to explicitly check GOLD here, as updateClickableState marks gold as not-selectable
        if (!gemEl.classList.contains('not-selectable')) {
            handleGemClick(gemType, gemEl);
        } else {
            console.log(`Click ignored on ${gemType} because it's not-selectable.`); // Optional: feedback
        }
    }

    function renderCards() {
        for (let level = 1; level <= 3; level++) {
            const container = visibleCardsContainers[level];
            container.innerHTML = ''; // Clear previous cards

            // Render visible cards
            visibleCards[level].forEach((cardData, index) => {
                const cardEl = createCardElement(cardData, level, index); // cardData can be null
                if (cardData) { // Only add listener if there's a card
                    cardEl.dataset.cardId = cardData.id;
                    cardEl.dataset.level = level; // Ensure level is set
                    cardEl.removeEventListener('click', handleVisibleCardClickWrapper); // Prevent duplicates
                    cardEl.addEventListener('click', handleVisibleCardClickWrapper);
                }
                container.appendChild(cardEl);
            });

            // Update deck count and appearance
            renderDeckCount(level); // Use helper function
            deckElements[level].classList.remove('selected'); // Ensure deselected visually
        }
        updateClickableState(); // Update after cards are rendered
    }

    function handleVisibleCardClickWrapper(event) {
        const cardEl = event.currentTarget;
        // Prevent action if marked as unselectable by updateClickableState
        if (cardEl.classList.contains('not-selectable')) return;
        const cardId = cardEl.dataset.cardId;
        const level = parseInt(cardEl.dataset.level, 10);
        if (cardId && !isNaN(level)) { // Check if it's a real card with a valid level
            handleCardClick('visible', level, cardId, cardEl);
        } else {
            console.error("Visible card click error: Missing cardId or level", cardEl.dataset);
        }
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

            // Add event listeners for reserved cards within this specific player's area
            playerEl.querySelectorAll('.reserved-card-small').forEach(cardEl => {
                const cardId = cardEl.dataset.cardId;
                if (cardId) {
                    cardEl.removeEventListener('click', handleReservedCardClickWrapper); // Prevent duplicates
                    cardEl.addEventListener('click', handleReservedCardClickWrapper);
                }
            });
        });
        highlightActivePlayer();
        updateClickableState(); // Update after players are rendered
    }

    function handleReservedCardClickWrapper(event) {
        const cardEl = event.currentTarget;
        // Prevent action if marked as unselectable by updateClickableState
        if (cardEl.classList.contains('not-selectable')) return;
        const cardId = cardEl.dataset.cardId;
        if (cardId) {
            handleReservedCardClick(cardId, cardEl);
        }
    }

    function createPlayerAreaElement(player) {
        const playerDiv = document.createElement('div');
        playerDiv.classList.add('player-area');
        playerDiv.classList.add(player.colorTheme); // Apply theme class
        playerDiv.id = `player-area-${player.id}`;

        // Header (Name, Score)
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

        // Resources Section
        const resourcesDiv = document.createElement('div');
        resourcesDiv.classList.add('player-resources');

        // Gems
        const gemsHeader = document.createElement('h4');
        gemsHeader.textContent = 'Gems';
        const gemsContainer = document.createElement('div');
        gemsContainer.classList.add('gems-container', 'small-gems');
        let totalNonGoldGems = 0;
        GEM_TYPES.forEach(gemType => {
            const count = player.gems[gemType];
            totalNonGoldGems += count;
            if (count > 0) {
                const gemEl = createGemElement(gemType, count, true); // Use count for small display
                gemEl.title = `${count} ${gemType}`;
                gemsContainer.appendChild(gemEl);
            }
        });
        if (player.gems[GOLD] > 0) {
            const goldEl = createGemElement(GOLD, player.gems[GOLD], true);
            goldEl.title = `${player.gems[GOLD]} gold (joker)`;
            gemsContainer.appendChild(goldEl);
        }
        // Revised Gem Limit Display
        const totalGemsSpan = document.createElement('span');
        totalGemsSpan.classList.add('total-gems-indicator');
        const goldCount = player.gems[GOLD];
        totalGemsSpan.innerHTML = `Reg: ${totalNonGoldGems}/${MAX_GEMS_PLAYER} <span class="gold-indicator">(+${goldCount} ${GOLD})</span>`;
        totalGemsSpan.title = `${totalNonGoldGems} regular gems + ${goldCount} gold`;
        // Color red based ONLY on non-gold gems exceeding limit
        if (totalNonGoldGems > MAX_GEMS_PLAYER) {
             totalGemsSpan.style.color = 'var(--text-error)';
             totalGemsSpan.style.fontWeight = 'bold';
        } else {
            totalGemsSpan.style.color = 'inherit'; // Reset color
            totalGemsSpan.style.fontWeight = 'normal'; // Reset weight
        }
        gemsContainer.appendChild(totalGemsSpan);


        // Bonuses (from purchased cards)
        const bonusHeader = document.createElement('h4');
        bonusHeader.textContent = 'Bonuses';
        const bonusContainer = document.createElement('div');
        bonusContainer.classList.add('player-cards'); // Use card count styling
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
        if (!hasBonuses) {
            bonusContainer.textContent = 'None';
            bonusContainer.style.cssText = 'font-size: 0.9em; color: var(--text-tertiary); text-align: center;';
        }

        // Reserved Cards
        const reservedHeader = document.createElement('h4');
        reservedHeader.textContent = `Reserved (${player.reservedCards.length}/${MAX_RESERVED_CARDS})`;
        const reservedContainer = document.createElement('div');
        reservedContainer.classList.add('reserved-cards-container');
        if (player.reservedCards.length > 0) {
            player.reservedCards.forEach(cardData => {
                reservedContainer.appendChild(createSmallReservedCardElement(cardData));
            });
        } else {
            reservedContainer.textContent = 'None reserved';
            reservedContainer.style.cssText = 'text-align: center; color: var(--text-tertiary);';
        }

        // Nobles
        const noblesHeader = document.createElement('h4');
        noblesHeader.textContent = `Nobles (${player.nobles.length})`;
        const playerNoblesContainer = document.createElement('div');
        playerNoblesContainer.classList.add('nobles-container', 'player-nobles-display');
        if (player.nobles.length > 0) {
             player.nobles.forEach(nobleData => {
                const nobleEl = createNobleElement(nobleData);
                nobleEl.style.transform = 'scale(0.8)'; // Make nobles slightly smaller in player area
                playerNoblesContainer.appendChild(nobleEl);
             });
        } else {
            playerNoblesContainer.textContent = 'None';
            playerNoblesContainer.style.cssText = 'font-size: 0.9em; color: var(--text-tertiary); text-align: center;';
        }

        // Append sections to resourcesDiv
        resourcesDiv.appendChild(gemsHeader);
        resourcesDiv.appendChild(gemsContainer);
        resourcesDiv.appendChild(bonusHeader);
        resourcesDiv.appendChild(bonusContainer);
        resourcesDiv.appendChild(reservedHeader);
        resourcesDiv.appendChild(reservedContainer);
        resourcesDiv.appendChild(noblesHeader);
        resourcesDiv.appendChild(playerNoblesContainer);

        // Append header and resources to main playerDiv
        playerDiv.appendChild(header);
        playerDiv.appendChild(resourcesDiv);

        return playerDiv;
    }

    function renderPlayerArea(playerId) {
        const player = players.find(p => p.id === playerId);
        const playerAreaEl = document.getElementById(`player-area-${playerId}`);
        if (player && playerAreaEl) {
            // Re-create the content entirely
            const tempDiv = createPlayerAreaElement(player);
            playerAreaEl.innerHTML = tempDiv.innerHTML;

            // Re-attach event listeners for reserved cards in the updated area
            playerAreaEl.querySelectorAll('.reserved-card-small').forEach(cardEl => {
                const cardId = cardEl.dataset.cardId;
                if (cardId) {
                    cardEl.removeEventListener('click', handleReservedCardClickWrapper); // Prevent duplicates
                    cardEl.addEventListener('click', handleReservedCardClickWrapper);
                }
            });
            highlightActivePlayer(); // Ensure active highlight is correct
            updateClickableState(); // Update clickable state after redraw
        } else {
            console.error("Could not find player or player area to update:", playerId);
        }
    }

    function renderTimer() {
        if (gameSettings.timerMinutes <= 0) {
            timerDisplay.textContent = "Off";
            timerDisplay.classList.remove('timer-low');
            return;
        }
        const minutes = Math.floor(turnTimeRemaining / 60);
        const seconds = Math.floor(turnTimeRemaining % 60);
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        timerDisplay.classList.toggle('timer-low', turnTimeRemaining <= TIMER_LOW_THRESHOLD && turnTimeRemaining > 0);
        if (turnTimeRemaining <= 0) {
            timerDisplay.classList.remove('timer-low'); // Remove red pulse when time hits 0
        }
    }

    // ========================================================================
    // REVISED renderSelectionInfo + DEBUG LOGS
    // ========================================================================
    function renderSelectionInfo() {
        dynamicActionButtonsContainer.innerHTML = ''; // Clear previous buttons
        const existingPreview = selectionInfoDiv.querySelector('.card-preview-container');
        if (existingPreview) existingPreview.remove(); // Remove old preview
        selectionInfoDiv.querySelectorAll('.selection-text').forEach(p => p.style.display = 'block'); // Show default text

        // Display Selected Gems
        if (currentAction === 'SELECTING_GEMS' && selectedGemTypes.length > 0) {
            selectedGemsDisplay.innerHTML = ''; // Clear previous selection
            selectedGemTypes.forEach(type => {
                selectedGemsDisplay.appendChild(createGemElement(type, 1, false)); // Render small gems
            });
            // Add Confirm Button
            const btn = document.createElement('button');
            btn.textContent = 'Confirm Take Gems';
            btn.onclick = performTakeGems;
            const isValid = validateTakeGemsSelection(); // Call validation
            console.log(`[renderSelectionInfo] Take Gems Button Check: isValid=${isValid}`); // DEBUG
            btn.disabled = !isValid; // Set disabled state based on validation
            dynamicActionButtonsContainer.appendChild(btn);
            if (isValid) btn.classList.add('action-possible');
        } else {
            selectedGemsDisplay.textContent = 'None';
        }

        // Display Selected Card
        if (currentAction === 'SELECTING_CARD' && selectedCard) {
             const cardData = selectedCard.id ? (getCardById(selectedCard.id) ?? getDeckCardPlaceholder(selectedCard.level)) : null;
             let cardText = 'Invalid Selection';
             if (cardData) {
                 if (selectedCard.type === 'visible') cardText = `Board L${cardData.level} (${cardData.color})`;
                 else if (selectedCard.type === 'reserved') cardText = `Reserved L${cardData.level} (${cardData.color})`;
                 else if (selectedCard.type === 'deck') cardText = `Deck L${cardData.level}`;
                 else cardText = `Unknown Card Type`;
             }

             // Show card preview if it's a specific visible/reserved card
             if (cardData && (selectedCard.type === 'visible' || selectedCard.type === 'reserved') && cardData.id) {
                 selectionInfoDiv.querySelectorAll('.selection-text').forEach(p => p.style.display = 'none'); // Hide default text
                 const previewContainer = document.createElement('div');
                 previewContainer.classList.add('card-preview-container');
                 const previewCardEl = createCardElement(cardData, cardData.level); // Use full card rendering
                 previewCardEl.classList.add('card-preview'); // Add preview specific style
                 previewContainer.appendChild(previewCardEl);
                 selectionInfoDiv.insertBefore(previewContainer, dynamicActionButtonsContainer); // Insert preview before buttons
             } else {
                 selectedCardDisplay.textContent = cardText; // Show text for deck or invalid
             }

             // Add Action Buttons (Purchase/Reserve)
             const player = players[currentPlayerIndex];
             if (player && cardData) {
                 const canReserveCheck = player.reservedCards.length < MAX_RESERVED_CARDS;
                 const { canAfford, goldNeeded } = (selectedCard.type === 'visible' || selectedCard.type === 'reserved') && cardData.id
                     ? canAffordCard(player, cardData)
                     : { canAfford: false, goldNeeded: 0 }; // Cannot afford deck directly

                 // Purchase Button (only for specific cards)
                 if ((selectedCard.type === 'visible' || selectedCard.type === 'reserved') && cardData.id) {
                     const purchaseBtn = document.createElement('button');
                     purchaseBtn.textContent = 'Purchase Card';
                     purchaseBtn.onclick = performPurchaseCard;
                     purchaseBtn.disabled = !canAfford;
                     if (canAfford) purchaseBtn.classList.add('action-possible');
                     else purchaseBtn.title = `Cannot afford (need ${goldNeeded} more gold or equivalent gems)`;
                     dynamicActionButtonsContainer.appendChild(purchaseBtn);
                 }

                 // Reserve Button (only for visible cards or decks)
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
             }
        } else {
            selectedCardDisplay.textContent = 'None';
        }

        // End Turn button visibility/state is handled in updateClickableState
    }


    function createGemElement(type, count, isBank) {
        const gemEl = document.createElement('div');
        gemEl.classList.add('gem', `gem-${type}`);
        if (isBank) { // For bank or player area display with count
            const countEl = document.createElement('span');
            countEl.classList.add('gem-count');
            countEl.textContent = count;
            gemEl.appendChild(countEl);
        } else { // For selection display (single gem visual)
             gemEl.classList.add('small-gems'); // Use smaller style
             gemEl.style.width = '20px'; // Make selection gems slightly smaller
             gemEl.style.height = '20px';
        }
        return gemEl;
    }

    function createCardElement(cardData, level, index = -1) {
        const cardEl = document.createElement('div');
        if (!cardData) { // Handle empty slots
            cardEl.classList.add('card', 'empty-slot');
            cardEl.textContent = 'Empty';
            return cardEl;
        }

        cardEl.classList.add('card', `card-border-${cardData.color}`);
        cardEl.dataset.level = level;
        if (index !== -1) cardEl.dataset.index = index;
        cardEl.title = formatCardCostForTitle(cardData);

        // Top Area: VP and Gem Bonus
        const topArea = document.createElement('div');
        topArea.classList.add('card-top-area');
        const vpSpan = document.createElement('span');
        vpSpan.classList.add('card-vp');
        vpSpan.textContent = cardData.vp > 0 ? cardData.vp : ''; // Show VP only if > 0
        const gemBonus = document.createElement('div');
        gemBonus.classList.add('card-gem-bonus', `gem-${cardData.color}`);
        topArea.appendChild(vpSpan);
        topArea.appendChild(gemBonus);

        // Center Area (Placeholder graphic)
        const centerArea = document.createElement('div');
        centerArea.classList.add('card-center-area');
        // CSS will add pseudo-element content based on level

        // Cost Area
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
                costItem.appendChild(document.createTextNode(cost)); // Text node for count
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
        cardEl.title = formatCardCostForTitle(cardData); // Reuse title formatting

        // Simplified Top Area
        const topArea = document.createElement('div');
        topArea.classList.add('card-top-area'); // Use same class for basic structure
        const vpSpan = document.createElement('span');
        vpSpan.classList.add('card-vp');
        vpSpan.textContent = cardData.vp > 0 ? cardData.vp : '';
        const gemBonus = document.createElement('div');
        gemBonus.classList.add('card-gem-bonus', `gem-${cardData.color}`); // Use same class
        topArea.appendChild(vpSpan);
        topArea.appendChild(gemBonus);

        // Simplified Cost Area (no center area)
        const costArea = document.createElement('div');
        costArea.classList.add('card-cost-area'); // Use same class
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
        cardEl.appendChild(costArea); // Add cost area directly

        return cardEl;
    }

    function createNobleElement(nobleData) {
        const nobleEl = document.createElement('div');
        nobleEl.classList.add('noble');
        nobleEl.dataset.nobleId = nobleData.id;

        // Tooltip
        const reqString = GEM_TYPES
            .map(type => ({ type, count: nobleData.requirements[type] || 0 }))
            .filter(item => item.count > 0)
            .map(item => `${item.count} ${item.type}`)
            .join(', ');
        nobleEl.title = `${nobleData.vp} VP - Requires: ${reqString}`;

        // VP Display
        const vpSpan = document.createElement('span');
        vpSpan.classList.add('noble-vp');
        vpSpan.textContent = nobleData.vp;

        // Requirements Display
        const reqsDiv = document.createElement('div');
        reqsDiv.classList.add('noble-requirements');
        GEM_TYPES.forEach(gemType => {
            const req = nobleData.requirements[gemType];
            if (req > 0) {
                const reqItem = document.createElement('div');
                reqItem.classList.add('req-item');
                reqItem.textContent = req; // Number first
                const reqGem = document.createElement('span'); // Color indicator after number
                reqGem.classList.add('req-gem', `gem-${gemType}`);
                reqItem.appendChild(reqGem);
                reqsDiv.appendChild(reqItem);
            }
        });

        nobleEl.appendChild(vpSpan);
        nobleEl.appendChild(reqsDiv);

        return nobleEl;
    }

    // ========================================================================
    // REVISED PLAYER ACTION HANDLING (GEMS) + DEBUG LOGS
    // ========================================================================

    function clearCardSelectionState() {
        if (selectedCard && selectedCard.element) {
            selectedCard.element.classList.remove('selected');
        }
        selectedCard = null;
        if (currentAction === 'SELECTING_CARD') {
            currentAction = null;
            renderSelectionInfo();
            updateClickableState();
        }
    }

    function clearGemSelectionState() {
        // Deselect visuals first
        gemBankContainer.querySelectorAll('.gem.selected').forEach(el => el.classList.remove('selected'));
        selectedGemTypes = []; // Clear the data
        if (currentAction === 'SELECTING_GEMS') {
            currentAction = null;
            renderSelectionInfo(); // Update button state & display
            updateClickableState(); // Update bank clickability
        }
    }

    function handleGemClick(gemType, clickedGemEl) {
        // Cannot select gold directly
        if (gemType === GOLD) return;
    
        // If a card is selected, switch action type
        if (currentAction === 'SELECTING_CARD') {
            clearCardSelectionState();
            currentAction = 'SELECTING_GEMS';
        } else {
             // Ensure current action is set correctly if starting gem selection
             if (currentAction !== 'SELECTING_GEMS') {
                 currentAction = 'SELECTING_GEMS';
             }
        }
    
        const isSelectedVisual = clickedGemEl.classList.contains('selected');
        const currentSelection = [...selectedGemTypes];
        const currentCount = currentSelection.length;
        const currentUniqueCount = new Set(currentSelection).size;
    
        console.log(`[handleGemClick V3] Clicked: ${gemType}, isSelectedVisual: ${isSelectedVisual}, currentSelection: [${currentSelection.join(',')}]`); // DEBUG V3
    
        // --- NEW: Clear on 3rd click of identical type when pair is selected ---
        // Check if we are currently selecting gems, already have 2 identical selected,
        // and the click is on the *same* type.
        if (currentAction === 'SELECTING_GEMS' && currentCount === 2 && currentUniqueCount === 1 && gemType === currentSelection[0]) {
            console.log("[handleGemClick V3] Clicked identical type again with pair selected. Clearing selection."); // DEBUG V3
            clearGemSelectionState(); // Clear everything
            // UI updates are handled within clearGemSelectionState
            return; // Stop further processing in this click handler for this specific case
        }
    
        // --- Special Case: Attempting Take 2 Identical (Selecting the second one) ---
        // This check needs to happen when you click a gem of the type you *already* selected one of.
        // It should execute even if the clicked element is technically 'selected' visually, *unless* the clear condition above was met.
        if (currentCount === 1 && gemType === currentSelection[0] && bank[gemType] >= MIN_GEMS_FOR_TAKE_TWO) {
            // We are trying to select the second identical gem, and the bank allows it.
            // We only add it to the list *once* more.
            // Check if we haven't already added the second one logically
            if (selectedGemTypes.length === 1) { // Ensure we don't double-add if called unexpectedly
                console.log("[handleGemClick V3] Applying SELECT 2nd identical (Take 2 Rule)"); // DEBUG V3
                selectedGemTypes.push(gemType); // Add the second logical gem
                // Ensure BOTH visual elements are selected
                clickedGemEl.classList.add('selected');
                const otherGemEl = findNonSelectedBankGemElement(gemType, clickedGemEl);
                if (otherGemEl) {
                    console.log(`[handleGemClick V3]   -> Found other element for pairing, adding .selected class.`); // DEBUG V3
                    otherGemEl.classList.add('selected');
                } else {
                     const allGemEls = gemBankContainer.querySelectorAll(`.gem[data-gem-type='${gemType}']`);
                     allGemEls.forEach(el => el.classList.add('selected'));
                     console.warn(`[handleGemClick V3]   -> Could not find *non-selected* visual element for Take 2 of ${gemType}. Ensuring all are selected visually.`); // DEBUG V3 WARN
                }
                 console.log(`  -> Added 2nd identical to selectedGemTypes. New: [${selectedGemTypes.join(',')}]`); // DEBUG V3
            } else {
                console.log(`[handleGemClick V3] Ignored click on ${gemType} - Take 2 already selected logically.`); // DEBUG V3
            }
        }
        // --- Regular Deselection ---
        // Only deselect if it's visually selected AND the Take 2 condition wasn't met AND the clear condition wasn't met.
        else if (isSelectedVisual) {
            console.log(`[handleGemClick V3] Trying REGULAR DESELECT ${gemType}`); // DEBUG V3
            const indexToRemove = selectedGemTypes.lastIndexOf(gemType);
            if (indexToRemove > -1) {
                selectedGemTypes.splice(indexToRemove, 1);
                clickedGemEl.classList.remove('selected');
                console.log(`  -> Removed from selectedGemTypes. New: [${selectedGemTypes.join(',')}]`); // DEBUG V3
                // Handle visual pair deselection if needed...
                 const typeCountAfterRemove = countOccurrences(selectedGemTypes, gemType);
                 if (countOccurrences(currentSelection, gemType) === 2 && typeCountAfterRemove === 1) {
                     const otherSelectedEl = gemBankContainer.querySelector(`.gem[data-gem-type='${gemType}'].selected`);
                     if (otherSelectedEl) {
                          otherSelectedEl.classList.remove('selected');
                          console.log(`  -> Visually deselected pair element for ${gemType}`); // DEBUG V3
                     }
                 }
            }
            // If the selection is now empty, clear the action state fully
            if (selectedGemTypes.length === 0) {
                 console.log(`  -> Selection empty, clearing gem state fully (from deselect).`); // DEBUG V3
                clearGemSelectionState();
                return; // Exit after full clear
            }
        }
        // --- Regular Selection (1st gem, 2nd different, 3rd different) ---
        // Executes only if not visually selected and not the Take 2 special case.
        else {
            console.log(`[handleGemClick V3] Trying REGULAR SELECT ${gemType}. CurrentCount=${currentCount}`); // DEBUG V3
            let canAdd = false;
            if (currentCount === 0 && bank[gemType] >= 1) {
                 canAdd = true;
            } else if (currentCount === 1 && gemType !== currentSelection[0] && bank[gemType] >= 1) { // Only 2nd different
                 canAdd = true;
            } else if (currentCount === 2 && currentUniqueCount === 2 && !currentSelection.includes(gemType) && bank[gemType] >= 1) { // Only 3rd different
                 canAdd = true;
            }
    
            console.log(`[handleGemClick V3] Result of REGULAR canAdd checks for ${gemType}: ${canAdd}`); // DEBUG V3
            if (canAdd) {
                selectedGemTypes.push(gemType);
                clickedGemEl.classList.add('selected');
                console.log(`  -> Added REGULAR to selectedGemTypes. New: [${selectedGemTypes.join(',')}]`); // DEBUG V3
            } else {
                console.log(`[handleGemClick V3] CANNOT ADD ${gemType} based on REGULAR rules.`); // DEBUG V3
            }
        }
    
        // Update UI after any change (unless return; was hit)
        renderSelectionInfo();
        updateClickableState();
    }

    // Helper to find a gem element in the bank that isn't selected (used for visual feedback on take 2)
    function findNonSelectedBankGemElement(gemType, excludeElement = null) {
        const elements = gemBankContainer.querySelectorAll(`.gem[data-gem-type="${gemType}"]`);
        for (const el of elements) {
            if (!el.classList.contains('selected') && el !== excludeElement) {
                return el;
            }
        }
        return null; // None found
    }

    function handleCardClick(type, level, cardId, cardEl) {
        // Case 1: Clicking the exact same card element that IS selected -> Deselect
        if (selectedCard && selectedCard.element === cardEl) {
            clearCardSelectionState();
            return;
        }

        // Case 2: Clicking a card when gems are selected -> Switch Action
        if (currentAction === 'SELECTING_GEMS') {
            clearGemSelectionState(); // Clear gems first
        }
        // Case 3: Clicking a different card/deck when one is already selected -> Switch Card Selection
        else if (currentAction === 'SELECTING_CARD' && selectedCard && selectedCard.element !== cardEl) {
             if (selectedCard.element) selectedCard.element.classList.remove('selected'); // Deselect previous visually
        }

        // Proceed to select the new card
        currentAction = 'SELECTING_CARD';
        selectedCard = { type, level, id: cardId, element: cardEl };
        cardEl.classList.add('selected');
        // Log removed for less verbosity
        renderSelectionInfo();
        updateClickableState();
    }

    function handleDeckClick(level) {
        const deckEl = deckElements[level];
        if (deckEl.classList.contains('empty') || deckEl.classList.contains('not-selectable')) return; // Cannot select empty/disabled

        const player = players[currentPlayerIndex];
        if (player.reservedCards.length >= MAX_RESERVED_CARDS) {
            updateLog("Reserve limit reached (3). Cannot reserve from deck."); // Provide feedback
            return;
        }

        const deckId = `deck-${level}`; // Use a consistent ID format

        // Case 1: Clicking the exact same deck element that IS selected -> Deselect
        if (selectedCard && selectedCard.element === deckEl) {
             clearCardSelectionState();
             return;
        }

        // Case 2: Clicking deck when gems are selected -> Switch Action
        if (currentAction === 'SELECTING_GEMS') {
            clearGemSelectionState();
        }
        // Case 3: Clicking deck when a different card/deck is selected -> Switch Selection
        else if (currentAction === 'SELECTING_CARD' && selectedCard && selectedCard.element !== deckEl) {
             if (selectedCard.element) selectedCard.element.classList.remove('selected'); // Deselect previous visually
        }

        // Proceed to select the deck
        currentAction = 'SELECTING_CARD';
        selectedCard = { type: 'deck', level, id: deckId, element: deckEl }; // Store deck info
        deckEl.classList.add('selected');
        // Log removed for less verbosity
        renderSelectionInfo();
        updateClickableState();
    }

    function handleReservedCardClick(cardId, cardEl) {
       const player = players[currentPlayerIndex];
       const cardData = player.reservedCards.find(c => c.id === cardId);
       if (!cardData) {
           console.error("Reserved card data not found for click!", cardId);
           return;
       }

       // Case 1: Clicking the exact same reserved card element that IS selected -> Deselect
       if (selectedCard && selectedCard.element === cardEl) {
           clearCardSelectionState();
           return;
       }

        // Case 2: Clicking reserved card when gems are selected -> Switch Action
       if (currentAction === 'SELECTING_GEMS') {
           clearGemSelectionState();
       }
        // Case 3: Clicking reserved card when a different card/deck is selected -> Switch Selection
       else if (currentAction === 'SELECTING_CARD' && selectedCard && selectedCard.element !== cardEl) {
            if (selectedCard.element) selectedCard.element.classList.remove('selected'); // Deselect previous visually
       }

       // Proceed to select the reserved card
       currentAction = 'SELECTING_CARD';
       selectedCard = { type: 'reserved', level: cardData.level, id: cardId, element: cardEl };
       cardEl.classList.add('selected');
       // Log removed for less verbosity
       renderSelectionInfo();
       updateClickableState();
   }


    // ========================================================================
    // REVISED ACTION VALIDATION & PERFORMING (GEMS) + DEBUG LOGS
    // ========================================================================

    /**
     * Validates if the CURRENT selectedGemTypes array represents a
     * complete, valid final action (Take 3 different or Take 2 identical).
     * Does NOT validate intermediate selections.
     */
    function validateTakeGemsSelection() {
        const gems = selectedGemTypes;
        const count = gems.length;
        const uniqueCount = new Set(gems).size;

        console.log(`[validateTakeGemsSelection] Validating: count=${count}, unique=${uniqueCount}, gems=[${gems.join(',')}]`); // DEBUG

        // Rule 1: Take 3 different gems (check availability)
        if (count === 3 && uniqueCount === 3) {
            const possible = gems.every(type => bank[type] >= 1);
            console.log(` -> Take 3? Possible=${possible}`); // DEBUG
            return possible;
        }
        // Rule 2: Take 2 identical gems (check availability >= MIN_GEMS_FOR_TAKE_TWO)
        if (count === 2 && uniqueCount === 1) {
            const type = gems[0];
            const possible = bank[type] >= MIN_GEMS_FOR_TAKE_TWO;
            console.log(` -> Take 2 identical (${type})? Bank=${bank[type]}, Min=${MIN_GEMS_FOR_TAKE_TWO}. Possible=${possible}`); // DEBUG
            return possible;
        }

        console.log(` -> Not a valid final action.`); // DEBUG
        // Any other selection count/combination is NOT a valid final action
        return false;
    }

    function performTakeGems() {
        // --- Safeguard Re-validation ---
        // Ensure the selection is *still* valid right before execution.
        if (!validateTakeGemsSelection()) {
            updateLog("Invalid gem selection for taking. Action cancelled.");
            clearActionState(); // Reset state
            return;
        }

        const player = players[currentPlayerIndex];
        const gemsTakenLog = {}; // Track for log message
        const isTakeTwo = selectedGemTypes.length === 2; // Unique count check done by validateTakeGemsSelection

        // Update Stats
        player.stats.gemTakeActions++;
        if (isTakeTwo) {
             player.stats.take2Actions++;
        } else { // Must be Take 3 if validation passed
             player.stats.take3Actions++;
        }

        // Perform Transaction (Validation passed, safe to take)
        selectedGemTypes.forEach(type => {
            // We already validated availability via validateTakeGemsSelection,
            // but double-check > 0 for absolute safety.
            if (bank[type] > 0) {
                bank[type]--;
                player.gems[type]++;
                gemsTakenLog[type] = (gemsTakenLog[type] || 0) + 1;
                player.stats.gemsTaken[type]++;
            } else {
                // This indicates a critical error if reached after validation
                console.error(`CRITICAL ERROR: Attempting to take ${type} when bank count is ${bank[type]} after validation!`);
                updateLog(`Error: Cannot take ${type}, none left in bank despite validation! Action possibly corrupted.`);
                // Attempt to revert? Very difficult. Best to stop the action here.
                // Don't proceed with turn end. Might need manual fix / restart.
                // Clear state to prevent further issues this turn.
                clearActionState();
                renderBank(); // Update bank display
                renderPlayerArea(player.id); // Update player display potentially
                return; // Stop the turn end sequence
            }
        });

        const gemString = Object.entries(gemsTakenLog).map(([t, c]) => `${c} ${t}`).join(', ');
        updateLog(`Player ${player.name} took ${gemString}.`);

        const performedActionType = 'TAKE_GEMS';
        clearActionState(); // Reset selection & UI
        renderBank();
        renderPlayerArea(player.id);
        endTurn(performedActionType); // Proceed to end turn sequence
    }


    function performReserveCard() {
        if (!selectedCard || (selectedCard.type !== 'visible' && selectedCard.type !== 'deck')) {
            updateLog("No valid card or deck selected to reserve.");
            return;
        }
        const player = players[currentPlayerIndex];
        if (player.reservedCards.length >= MAX_RESERVED_CARDS) {
            updateLog("Cannot reserve: Reservation limit reached (3).");
            return;
        }

        let reservedCardData = null;
        let cardSourceDescription = "";
        const level = selectedCard.level;
        let cardReplaced = false; // Track if a card needs to be drawn from deck

        if (selectedCard.type === 'deck') {
            if (decks[level].length > 0) {
                reservedCardData = decks[level].pop(); // Take from deck
                cardSourceDescription = `from L${level} deck`;
                player.stats.deckReservations[level]++;
            } else {
                updateLog(`Cannot reserve: Level ${level} deck is empty.`);
                clearActionState(); // Clear selection as action failed
                renderCards(); // Update deck counts
                updateClickableState();
                return; // Stop action
            }
        } else { // type === 'visible'
            const cardId = selectedCard.id;
            const cardIndex = visibleCards[level].findIndex(c => c && c.id === cardId);
            if (cardIndex !== -1 && visibleCards[level][cardIndex]) {
                reservedCardData = visibleCards[level][cardIndex]; // Take the card data
                cardSourceDescription = `L${level} ${reservedCardData.color} from board`;
                player.stats.boardReservations[level]++;
                // Remove card from visible slot (will be replaced by drawCard)
                visibleCards[level][cardIndex] = null; // Placeholder while drawing
                drawCard(level, cardIndex); // Replace the card
                cardReplaced = true;
            } else {
                updateLog("Cannot reserve: Selected card is no longer available.");
                clearActionState();
                renderCards(); // Update display
                updateClickableState();
                return; // Stop action
            }
        }

        // If card successfully identified:
        player.stats.reserveActions++;
        player.stats.cardsReservedTotalCount++;
        player.stats.allReservedCardsData.push(JSON.parse(JSON.stringify(reservedCardData))); // Store deep copy for stats
        player.reservedCards.push(reservedCardData); // Add to player's hand

        // Take gold if available
        let gotGold = false;
        if (bank[GOLD] > 0) {
            player.gems[GOLD]++;
            bank[GOLD]--;
            gotGold = true;
            player.stats.goldTaken++;
        }

        updateLog(`Player ${player.name} reserved ${cardSourceDescription}${gotGold ? " and took 1 gold." : "."}`);

        const performedActionType = 'RESERVE';
        clearActionState(); // Reset selection
        if (gotGold) renderBank(); // Update gold count
        if (cardReplaced) renderCards(); // Render the drawn card
        else renderDeckCount(level); // Only update deck count if from deck
        renderPlayerArea(player.id); // Update player's reserved cards/gems
        endTurn(performedActionType); // Proceed to end turn sequence
    }

    function performPurchaseCard() {
        if (!selectedCard || (selectedCard.type !== 'visible' && selectedCard.type !== 'reserved')) {
            updateLog("No valid card selected to purchase.");
            return;
        }

        const player = players[currentPlayerIndex];
        const cardId = selectedCard.id;
        let purchasedCardData = null;
        let cardSource = selectedCard.type;
        let cardIndex = -1; // Index in visibleCards or reservedCards
        let isFromReserve = (cardSource === 'reserved');

        // Find the card data
        if (cardSource === 'visible') {
            cardIndex = visibleCards[selectedCard.level].findIndex(c => c && c.id === cardId);
            if (cardIndex !== -1) {
                purchasedCardData = visibleCards[selectedCard.level][cardIndex];
            }
        } else { // cardSource === 'reserved'
            cardIndex = player.reservedCards.findIndex(c => c.id === cardId);
            if (cardIndex !== -1) {
                purchasedCardData = player.reservedCards[cardIndex];
            }
        }

        if (!purchasedCardData) {
            updateLog("Cannot purchase: Card not found or unavailable.");
            clearActionState();
            updateClickableState(); // Re-enable things
            return;
        }

        // Check affordability
        const { canAfford, goldNeeded, effectiveCost } = canAffordCard(player, purchasedCardData);
        if (!canAfford) {
            updateLog(`Cannot purchase: Not enough resources. Need ${goldNeeded} more gold or equivalent gems.`);
            // Don't clear action state here, let player select something else
            return;
        }

        // Perform payment
        let goldSpent_this_turn = 0;
        let gemsSpent_this_turn = { white: 0, blue: 0, green: 0, red: 0, black: 0 };
        let totalResourceCost = 0; // Cost after bonuses

        GEM_TYPES.forEach(gemType => {
            const cost = effectiveCost[gemType]; // Cost after player bonus
            totalResourceCost += cost;
            const playerHas = player.gems[gemType];
            const fromPlayerGems = Math.min(cost, playerHas); // Gems player pays
            const needsGold = cost - fromPlayerGems; // Remaining cost covered by gold

            if (fromPlayerGems > 0) {
                player.gems[gemType] -= fromPlayerGems;
                bank[gemType] += fromPlayerGems; // Return gems to bank
                gemsSpent_this_turn[gemType] += fromPlayerGems;
            }
            if (needsGold > 0) {
                if (player.gems[GOLD] >= needsGold) {
                    player.gems[GOLD] -= needsGold;
                    bank[GOLD] += needsGold; // Return gold to bank
                    goldSpent_this_turn += needsGold;
                } else {
                    // This should not happen if canAfford check is correct
                    console.error("CRITICAL: Payment gold mismatch during purchase!");
                    updateLog("Error during payment calculation.");
                    // Attempt rollback? Difficult state. For now, log and potentially stop.
                    // It might be safer to re-add gems taken? Complex.
                    return; // Stop the action
                }
            }
        });

        // Update Player Stats
        player.stats.purchaseActions++;
        player.stats.cardsPurchasedCount++;
        player.stats.cardsPurchasedByLevel[purchasedCardData.level]++;
        player.stats.cardsPurchasedByColor[purchasedCardData.color]++;
        if (isFromReserve) player.stats.purchasedFromReserveCount++;
        else player.stats.purchasedFromBoardCount++;
        if (totalResourceCost === 0) player.stats.selfSufficientPurchases++; // Count free purchases
        player.stats.goldSpent += goldSpent_this_turn;
        GEM_TYPES.forEach(type => player.stats.gemsSpent[type] += gemsSpent_this_turn[type]);
        if (player.stats.firstCardPurchasedTurn[purchasedCardData.level] === null) {
            player.stats.firstCardPurchasedTurn[purchasedCardData.level] = turnNumber;
        }

        // Update Player State
        player.cards.push(purchasedCardData); // Add card to player's collection
        player.score += purchasedCardData.vp;
        player.bonuses[purchasedCardData.color]++;

        updateLog(`Player ${player.name} purchased L${purchasedCardData.level} ${purchasedCardData.color} card${isFromReserve ? ' (from reserve)' : ''}${goldSpent_this_turn > 0 ? ` (used ${goldSpent_this_turn} gold)` : ''}.`);

        // Update Board State
        let cardReplaced = false;
        if (cardSource === 'visible') {
            visibleCards[purchasedCardData.level][cardIndex] = null; // Placeholder
            drawCard(purchasedCardData.level, cardIndex); // Draw replacement
            cardReplaced = true;
        } else { // Remove from reserved hand
            player.reservedCards.splice(cardIndex, 1);
        }

        const performedActionType = 'PURCHASE';
        clearActionState(); // Reset selection
        renderBank(); // Update gem counts
        if (cardReplaced) renderCards(); // Render new card / empty slot
        renderPlayerArea(player.id); // Update player's score, bonuses, gems, reserved cards
        endTurn(performedActionType); // Proceed to end turn sequence
    }

    function handleConfirmReturnGems(player, gemsToReturnCount, callback) {
        const selectedElements = returnGemsPlayerDisplay.querySelectorAll('.gem.selected[data-return-gem-type]');
        if (selectedElements.length !== gemsToReturnCount) {
            // Should be prevented by button disable, but double-check
            return;
        }

        const returnedCounts = {}; // For logging
        selectedElements.forEach(gemEl => {
            const type = gemEl.dataset.returnGemType;
            if (player.gems[type] > 0) {
                player.gems[type]--;
                bank[type]++;
                returnedCounts[type] = (returnedCounts[type] || 0) + 1;
                player.stats.gemsReturnedOverLimit[type]++; // Track returned gems stat
            } else {
                console.error(`Error returning ${type}? Player count: ${player.gems[type]}`);
            }
        });

        const returnString = Object.entries(returnedCounts)
            .map(([type, count]) => `${count} ${type}`)
            .join(', ');
        updateLog(`Player ${player.name} returned ${returnString}.`);

        returnGemsOverlay.classList.add('hidden'); // Hide overlay
        renderBank(); // Update bank counts
        renderPlayerArea(player.id); // Update player gem counts
        if (callback) callback(); // Continue end-of-turn sequence
    }

    function awardNoble(player, nobleData) {
        updateLog(`Noble (${nobleData.vp} VP) visits Player ${player.name}.`);
        player.nobles.push(nobleData);
        player.score += nobleData.vp;
        player.stats.noblesAcquiredTurn[nobleData.id] = turnNumber; // Record turn
        // Remove noble from available list
        availableNobles = availableNobles.filter(n => n.id !== nobleData.id);
    }

    // ========================================================================
    // TURN MANAGEMENT & END-OF-TURN SEQUENCE - STAT TRACKING INTEGRATED
    // ========================================================================

    function startTurn() {
        if (gameTrulyFinished) return;
        highlightActivePlayer();
        clearActionState(); // Clear any leftover selections
        startTimer();
        updateClickableState(); // Ensure correct state at turn start
    }

    function endTurn(actionType) {
        console.log(`Ending turn for Player ${currentPlayerIndex} (${players[currentPlayerIndex].name}). Action: ${actionType}. Turn: ${turnNumber}`);
        stopTimer(); // Stop timer immediately
        const player = players[currentPlayerIndex];

        // --- Post-Action Stat Updates ---
        player.stats.turnsTaken++;
        const currentNonGoldGems = GEM_TYPES.reduce((sum, type) => sum + player.gems[type], 0);
        player.stats.peakGemsHeld = Math.max(player.stats.peakGemsHeld, currentNonGoldGems);
        if (currentNonGoldGems === MAX_GEMS_PLAYER) player.stats.turnsEndedExactLimit++;
        else if (currentNonGoldGems < MAX_GEMS_PLAYER) player.stats.turnsEndedBelowLimit++;
        // --- End Post-Action Stats ---


        // End of Turn Sequence: Nobles -> Gem Limit -> Game Over Check -> Next Player
        checkForNobleVisit(player, () => {
            checkForGemLimit(player, () => {
                // Check if game over condition met *this turn*
                const scoreJustReached = player.score >= WINNING_SCORE;
                if (scoreJustReached && player.stats.turnReached15VP === null) {
                    player.stats.turnReached15VP = turnNumber; // Record when player hit 15+
                }
                const gameEndTriggeredThisTurn = checkAndSetGameOverCondition(player);
                if (gameEndTriggeredThisTurn) {
                    player.stats.triggeredGameEnd = true; // Mark player who triggered the end
                }

                // Check if the game *truly* ends now
                if (isGameOverConditionMet && currentPlayerIndex === lastRoundPlayerIndex) {
                    console.log(`Player ${currentPlayerIndex} (${player.name}) was the last player. Ending game.`);
                    endGame(); // Run final calculations and display
                    return; // Stop the turn progression
                }

                if (gameEndTriggeredThisTurn) {
                    console.log(`Final round continues. Current: ${currentPlayerIndex}, Ends after: ${lastRoundPlayerIndex}`);
                }

                // Advance to next player
                currentPlayerIndex = (currentPlayerIndex + 1) % players.length;

                // Increment turn number if a full round passed (and game not ending)
                // Game over condition check ensures turn number doesn't increment during final round
                if (currentPlayerIndex === 0 && !isGameOverConditionMet) {
                    turnNumber++;
                    console.log(`Starting Turn ${turnNumber}`);
                } else if (isGameOverConditionMet) {
                     console.log(`Continuing final round. Next player: ${currentPlayerIndex} (${players[currentPlayerIndex].name})`);
                }


                // Start next turn if game not ended
                if (!gameTrulyFinished) {
                    updateLog(`Player ${players[currentPlayerIndex].name}'s turn.`);
                    startTurn(); // Initiate the next player's turn
                } else {
                     // Ensure UI is disabled if game ended abruptly (e.g. via timeout on last turn)
                     updateClickableState();
                }
            });
        });
    }

    function checkAndSetGameOverCondition(player) {
        if (!isGameOverConditionMet && player.score >= WINNING_SCORE) {
            isGameOverConditionMet = true;
            // The last player is the one *before* the current player in turn order
            lastRoundPlayerIndex = (currentPlayerIndex + players.length - 1) % players.length;
            updateLog(`--- Player ${player.name} reached ${player.score} VP! Final round begins. All players up to Player ${players[lastRoundPlayerIndex].name} will get one more turn. ---`);
            console.log(`Game end condition met. Final round initiated. Ends after player index: ${lastRoundPlayerIndex}.`);
            return true; // Condition met this turn
        }
        return false; // Condition not met or already met
    }

    function checkForNobleVisit(player, callback) {
        const eligibleNobles = availableNobles.filter(noble =>
            GEM_TYPES.every(gemType => (player.bonuses[gemType] || 0) >= (noble.requirements[gemType] || 0))
        );

        if (eligibleNobles.length === 0) {
            if (callback) callback(); // No nobles visit, continue
        } else if (eligibleNobles.length === 1) {
            // Automatically award the only eligible noble
            awardNoble(player, eligibleNobles[0]);
            renderNobles(); // Update global nobles display
            renderPlayerArea(player.id); // Update player's score/nobles
            if (callback) callback(); // Continue
        } else {
            // Multiple nobles - player must choose
            updateLog(`Player ${player.name} qualifies for multiple nobles. Choose one.`);
            showNobleChoiceOverlay(player, eligibleNobles, callback); // Show choice overlay
            // The callback will be triggered by handleNobleChoice
        }
    }

    function showNobleChoiceOverlay(player, eligibleNobles, callback) {
        nobleChoiceOptionsContainer.innerHTML = ''; // Clear previous options
        eligibleNobles.forEach(nobleData => {
            const nobleEl = createNobleElement(nobleData);
            nobleEl.classList.add('clickable');
            nobleEl.onclick = () => handleNobleChoice(player, nobleData, callback); // Pass callback
            nobleChoiceOptionsContainer.appendChild(nobleEl);
        });
        nobleChoiceOverlay.classList.remove('hidden'); // Show the overlay
        updateClickableState(); // Disable game board while overlay is up
    }

    function handleNobleChoice(player, chosenNoble, callback) {
        nobleChoiceOverlay.classList.add('hidden'); // Hide overlay

        // Double check if noble is still available (might not be needed if logic is sound)
        if (availableNobles.some(n => n.id === chosenNoble.id)) {
            awardNoble(player, chosenNoble);
            renderNobles();
            renderPlayerArea(player.id);
        } else {
            console.warn(`Chosen noble ${chosenNoble.id} no longer available? Race condition?`);
            updateLog("Selected noble was no longer available.");
        }
        if (callback) callback(); // Continue the end-of-turn sequence
        updateClickableState(); // Re-enable game board
    }

    function checkForGemLimit(player, callback) {
        const nonGoldGems = GEM_TYPES.reduce((sum, type) => sum + player.gems[type], 0);
        if (nonGoldGems > MAX_GEMS_PLAYER) {
            const gemsToReturnCount = nonGoldGems - MAX_GEMS_PLAYER;
            const totalGems = nonGoldGems + player.gems[GOLD]; // For display
            updateLog(`Player ${player.name} has ${nonGoldGems} non-gold gems (${totalGems} total), must return ${gemsToReturnCount}.`);
            showReturnGemsOverlay(player, nonGoldGems, gemsToReturnCount, callback);
            // Callback is passed to the overlay handler
        } else {
            if (callback) callback(); // Gem limit okay, continue sequence
        }
    }

    function showReturnGemsOverlay(player, currentNonGoldGems, gemsToReturnCount, callback) {
        returnGemsCountSpan.textContent = `${currentNonGoldGems}/${MAX_GEMS_PLAYER}`;
        returnGemsPlayerDisplay.innerHTML = ''; // Clear previous gems

        // Display player's non-gold gems for selection
        GEM_TYPES.forEach(gemType => {
            for (let i = 0; i < player.gems[gemType]; i++) {
                const gemEl = createGemElement(gemType, 1, false); // Display as single gems
                gemEl.classList.add('clickable');
                gemEl.dataset.returnGemType = gemType; // Store type for return logic
                gemEl.onclick = () => toggleReturnGemSelection(gemEl, gemsToReturnCount);
                returnGemsPlayerDisplay.appendChild(gemEl);
            }
        });
        // Optionally display gold gems (non-selectable) for context
        if (player.gems.gold > 0) {
             const goldEl = createGemElement(GOLD, player.gems.gold, true); // Show count
             goldEl.style.opacity = '0.5';
             goldEl.style.cursor = 'not-allowed';
             goldEl.style.marginLeft = '10px'; // Add some space
             goldEl.title = "Gold tokens cannot be returned";
             returnGemsPlayerDisplay.appendChild(goldEl);
        }

        confirmReturnGemsBtn.disabled = true; // Disable initially
        returnGemsSelectionDisplay.textContent = `Selected to return: 0/${gemsToReturnCount}`;
        // Redefine onclick to ensure fresh callback closure
        confirmReturnGemsBtn.onclick = null; // Clear previous listener
        confirmReturnGemsBtn.onclick = () => {
            handleConfirmReturnGems(player, gemsToReturnCount, callback); // Pass fresh callback
            updateClickableState(); // Re-enable game board after confirming
        };

        returnGemsOverlay.classList.remove('hidden'); // Show the overlay
        updateClickableState(); // Disable game board while overlay is up
    }


    function toggleReturnGemSelection(gemEl, gemsToReturnCount) {
        gemEl.classList.toggle('selected'); // Toggle visual selection state
        const selectedElements = returnGemsPlayerDisplay.querySelectorAll('.gem.selected[data-return-gem-type]');
        const selectedCount = selectedElements.length;
        returnGemsSelectionDisplay.textContent = `Selected to return: ${selectedCount}/${gemsToReturnCount}`;
        confirmReturnGemsBtn.disabled = selectedCount !== gemsToReturnCount; // Enable button only when correct number selected
    }

    // ========================================================================
    // END GAME FUNCTION - DETAILED STATS DISPLAY
    // ========================================================================

    function endGame() {
        console.log("GAME OVER - Calculating winner and displaying detailed stats...");
        updateLog("--- GAME OVER ---");
        gameTrulyFinished = true;
        stopTimer();
        hideOverlays(); // Hide any active overlays like return gems/noble choice
        clearActionState(); // Prevent further actions

        // Sort players: 1. Score (desc), 2. Fewest purchased cards (asc)
        const sortedPlayers = [...players].sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score; // Higher score first
            }
            return a.cards.length - b.cards.length; // Fewer cards first (tie-breaker)
        });

        // Determine winner(s)
        let winners = [];
        if (sortedPlayers.length > 0) {
            const topScore = sortedPlayers[0].score;
            const potentialWinners = sortedPlayers.filter(p => p.score === topScore);
            if (potentialWinners.length === 1) {
                winners = potentialWinners; // Single winner
            } else {
                // Tie in score, check card count
                const minCards = Math.min(...potentialWinners.map(p => p.cards.length));
                winners = potentialWinners.filter(p => p.cards.length === minCards); // Winners are those with min cards among top score
            }
        }

        // --- Build Detailed Stats Display ---
        finalScoresDiv.innerHTML = ''; // Clear previous scores
        sortedPlayers.forEach((p, index) => {
            const rank = index + 1;
            const isWinner = winners.some(w => w.id === p.id);
            const playerStats = p.stats;

            // Calculate derived stats for display
            const vpFromCards = p.cards.reduce((sum, card) => sum + card.vp, 0);
            const vpFromNobles = p.nobles.reduce((sum, noble) => sum + noble.vp, 0);
            const avgVpPerTurn = playerStats.turnsTaken > 0 ? (p.score / playerStats.turnsTaken).toFixed(2) : 'N/A';
            const avgVpPerCard = playerStats.cardsPurchasedCount > 0 ? (vpFromCards / playerStats.cardsPurchasedCount).toFixed(2) : 'N/A';
            const reservationSuccessRate = playerStats.cardsReservedTotalCount > 0 ? ((playerStats.purchasedFromReserveCount / playerStats.cardsReservedTotalCount) * 100).toFixed(1) : '0.0';
            const totalBonuses = Object.values(p.bonuses).reduce((s, c) => s + c, 0);
            const avgBonusPerCard = playerStats.cardsPurchasedCount > 0 ? (totalBonuses / playerStats.cardsPurchasedCount).toFixed(2) : 'N/A';
            const totalGemsTaken = Object.values(playerStats.gemsTaken).reduce((s, c) => s + c, 0);
            const totalGemTakeActions = playerStats.take2Actions + playerStats.take3Actions; // Total gem take actions
            const avgGemsPerTakeAction = totalGemTakeActions > 0 ? (totalGemsTaken / totalGemTakeActions).toFixed(2) : 'N/A';
            const percentTake3 = totalGemTakeActions > 0 ? ((playerStats.take3Actions / totalGemTakeActions) * 100).toFixed(1) : 'N/A';
            const percentTake2 = totalGemTakeActions > 0 ? ((playerStats.take2Actions / totalGemTakeActions) * 100).toFixed(1) : 'N/A';
            const totalGemsSpent = Object.values(playerStats.gemsSpent).reduce((s, c) => s + c, 0);
            const totalSpending = totalGemsSpent + playerStats.goldSpent;
            const goldDependency = totalSpending > 0 ? ((playerStats.goldSpent / totalSpending) * 100).toFixed(1) : '0.0';
            const totalGemsReturned = Object.values(playerStats.gemsReturnedOverLimit).reduce((s, c) => s + c, 0);
            const totalActions = playerStats.gemTakeActions + playerStats.purchaseActions + playerStats.reserveActions;
            const actionDist = {
                gem: totalActions > 0 ? ((playerStats.gemTakeActions / totalActions) * 100).toFixed(1) : 'N/A',
                purchase: totalActions > 0 ? ((playerStats.purchaseActions / totalActions) * 100).toFixed(1) : 'N/A',
                reserve: totalActions > 0 ? ((playerStats.reserveActions / totalActions) * 100).toFixed(1) : 'N/A',
            };

            // Create HTML structure
            const playerEntryDiv = document.createElement('details');
            playerEntryDiv.classList.add('player-result-entry-detailed');
            if (isWinner) playerEntryDiv.classList.add('winner');
            if (rank === 1) playerEntryDiv.open = true; // Open winner/first place by default
             else playerEntryDiv.open = false;


            const summary = document.createElement('summary');
            summary.classList.add('player-result-header-detailed');
            let rankSuffix = 'th';
            if (rank === 1) rankSuffix = 'st'; else if (rank === 2) rankSuffix = 'nd'; else if (rank === 3) rankSuffix = 'rd';
            summary.innerHTML = `
                <span class="player-rank">${isWinner ? '🏆' : ''} ${rank}${rankSuffix}</span>
                <span class="player-name-endgame">${p.name} ${playerStats.isFirstPlayer ? '(P1)' : ''} ${playerStats.triggeredGameEnd ? '[Triggered End]' : ''}</span>
                <span class="player-score-endgame">${p.score} VP</span>
                <span class="player-summary-stats">(Cards: ${p.cards.length} | Turns: ${playerStats.turnsTaken})</span>`;
            playerEntryDiv.appendChild(summary);

            const detailsContainer = document.createElement('div');
            detailsContainer.classList.add('player-result-details-grid');

            // --- Column 1 ---
            const col1 = document.createElement('div');
            col1.classList.add('stat-column');
            // VP Breakdown
            col1.innerHTML += `
                <div class="stat-category"><h4>VP Breakdown</h4>
                    <div class="stat-items">
                        <span>Cards: ${vpFromCards} VP</span>
                        <span>Nobles: ${vpFromNobles} VP</span>
                        ${playerStats.turnReached15VP ? `<span>Reached 15 VP: Turn ${playerStats.turnReached15VP}</span>` : ''}
                    </div>
                </div>`;
            // Purchased Cards
            let purchasedHTML = `
                <div class="stat-category">
                    <h4>Purchased (${p.cards.length}) <span class="details-inline">(L1:${playerStats.cardsPurchasedByLevel[1]}/L2:${playerStats.cardsPurchasedByLevel[2]}/L3:${playerStats.cardsPurchasedByLevel[3]})</span></h4>
                    <div class="cards-summary purchased-cards-summary">
                        ${p.cards.length > 0 ? p.cards.map(card => createTinyCardElement(card).outerHTML).join('') : '<span class="no-items">None</span>'}
                    </div>
                    <div class="stat-items sub-stats">
                        <span>Avg VP/Card: ${avgVpPerCard}</span>
                        <span>From Reserve: ${playerStats.purchasedFromReserveCount}</span>
                        <span>From Board: ${playerStats.purchasedFromBoardCount}</span>
                        <span>Free Purchases: ${playerStats.selfSufficientPurchases}</span>
                    </div>
                </div>`;
            col1.innerHTML += purchasedHTML;
            // Currently Reserved Cards
            let reservedCurrentHTML = `
                 <div class="stat-category"><h4>Reserved (${p.reservedCards.length})</h4>
                     <div class="cards-summary reserved-cards-summary">
                        ${p.reservedCards.length > 0 ? p.reservedCards.map(card => createTinyCardElement(card).outerHTML).join('') : '<span class="no-items">None</span>'}
                     </div>
                 </div>`;
            col1.innerHTML += reservedCurrentHTML;
            // Reservation History (Collapsible)
            let reservedHistoryHTML = `
                <details class="sub-details">
                    <summary>Reservation History (${playerStats.cardsReservedTotalCount} Total)</summary>
                    <div class="stat-category inner-stat-category">
                        <h4>All Reserved Cards (Ever)</h4>
                        <div class="cards-summary reserved-cards-summary">
                            ${playerStats.allReservedCardsData.length > 0 ? playerStats.allReservedCardsData.map(card => createTinyCardElement(card).outerHTML).join('') : '<span class="no-items">None</span>'}
                        </div>
                        <div class="stat-items sub-stats">
                            <span>Deck L1/L2/L3: ${playerStats.deckReservations[1]}/${playerStats.deckReservations[2]}/${playerStats.deckReservations[3]}</span>
                            <span>Board L1/L2/L3: ${playerStats.boardReservations[1]}/${playerStats.boardReservations[2]}/${playerStats.boardReservations[3]}</span>
                            <span>Purchase Rate: ${reservationSuccessRate}%</span>
                        </div>
                    </div>
                </details>`;
            col1.innerHTML += reservedHistoryHTML;
            // Nobles Acquired
            let noblesHTML = `
                <div class="stat-category"><h4>Nobles (${p.nobles.length})</h4>
                    <div class="summary-items nobles-summary">
                        ${p.nobles.length > 0
                            ? p.nobles.map(noble => {
                                const nobleEl = createNobleElement(noble);
                                nobleEl.style.transform = 'scale(0.7)'; // Smaller noble visual
                                nobleEl.style.margin = '-5px';
                                return `<span title="Acquired Turn ${playerStats.noblesAcquiredTurn[noble.id] || '?'}">${nobleEl.outerHTML}</span>`;
                              }).join('')
                            : '<span class="no-items">None</span>'
                        }
                    </div>
                </div>`;
            col1.innerHTML += noblesHTML;
            detailsContainer.appendChild(col1);

            // --- Column 2 ---
            const col2 = document.createElement('div');
            col2.classList.add('stat-column');
            // Bonuses
            let bonusesHTML = `
                <div class="stat-category"><h4>Bonuses (${totalBonuses} Total)</h4>
                    <div class="summary-items bonuses-summary">
                        ${Object.values(p.bonuses).some(c => c > 0)
                            ? GEM_TYPES.map(type => {
                                const count = p.bonuses[type] || 0;
                                return count > 0 ? `<div class="player-card-count gem-${type}" title="${count} ${type} bonus">${count}</div>` : '';
                              }).join('')
                            : '<span class="no-items">None</span>'
                        }
                    </div>
                    <div class="stat-items sub-stats">
                        <span>Avg Bonus/Card: ${avgBonusPerCard}</span>
                    </div>
                </div>`;
            col2.innerHTML += bonusesHTML;
            // Gem Management (Collapsible)
            let gemHistoryHTML = `
                <details class="sub-details"><summary>Gem Management</summary>
                    <div class="stat-category inner-stat-category">
                        <h4>Final Gems Held</h4>
                        <div class="summary-items gems-summary small-gems">
                             ${[...GEM_TYPES, GOLD].map(type => { const count = p.gems[type] || 0; return count > 0 ? createGemElement(type, count, true).outerHTML : ''; }).join('') || '<span class="no-items">None</span>'}
                        </div>
                        <h4>Gem Flow (Cumulative)</h4>
                        <div class="stat-items sub-stats flow-stats">
                            <span>Taken: ${createGemFlowString(playerStats.gemsTaken)}</span>
                            <span>Gold Taken: ${playerStats.goldTaken}</span>
                            <span>Spent: ${createGemFlowString(playerStats.gemsSpent)}</span>
                            <span>Gold Spent: ${playerStats.goldSpent} (${goldDependency}%)</span>
                            <span>Returned (Limit): ${createGemFlowString(playerStats.gemsReturnedOverLimit)} (${totalGemsReturned} total)</span>
                            <span>Peak Held (Non-Gold): ${playerStats.peakGemsHeld}</span>
                        </div>
                        <h4>Gem Actions</h4>
                        <div class="stat-items sub-stats">
                            <span>Take 3 Actions: ${playerStats.take3Actions} (${percentTake3}%)</span>
                            <span>Take 2 Actions: ${playerStats.take2Actions} (${percentTake2}%)</span>
                            <span>Avg Gems/Action: ${avgGemsPerTakeAction}</span>
                        </div>
                         <h4>Gem Limit Interaction</h4>
                        <div class="stat-items sub-stats">
                            <span>Turns Ended at Limit: ${playerStats.turnsEndedExactLimit}</span>
                            <span>Turns Ended Below Limit: ${playerStats.turnsEndedBelowLimit}</span>
                        </div>
                    </div>
                </details>`;
            col2.innerHTML += gemHistoryHTML;
            // Action Distribution / Efficiency
            col2.innerHTML += `
                <div class="stat-category"><h4>Action Distribution (${totalActions} Total)</h4>
                    <div class="stat-items action-dist-stats">
                        <span>Gem Takes: ${actionDist.gem}%</span>
                        <span>Purchases: ${actionDist.purchase}%</span>
                        <span>Reserves: ${actionDist.reserve}%</span>
                    </div>
                    <div class="stat-items sub-stats">
                        <span>Avg VP/Turn: ${avgVpPerTurn}</span>
                    </div>
                </div>`;
            detailsContainer.appendChild(col2);

            playerEntryDiv.appendChild(detailsContainer);
            finalScoresDiv.appendChild(playerEntryDiv);
        });

        // Add Tie Message if necessary
        if (winners.length > 1) {
            const tieMessage = document.createElement('p');
            tieMessage.classList.add('tie-message');
            tieMessage.textContent = `Tie between: ${winners.map(w => w.name).join(' & ')}!`;
            finalScoresDiv.appendChild(tieMessage);
            updateLog(`Game ended in a tie!`);
        } else if (winners.length === 1) {
            updateLog(`Winner: ${winners[0].name} with ${winners[0].score} VP!`);
        }

        updateClickableState(); // Disable everything
        gameOverOverlay.classList.remove('hidden'); // Show the game over screen
    }


    // ========================================================================
    // HELPER & UTILITY FUNCTIONS
    // ========================================================================

    function clearActionState() {
        // Clear gem selection
        clearGemSelectionState(); // Use the dedicated function

        // Clear card selection
        clearCardSelectionState(); // Use the dedicated function

        // Reset action state variable
        currentAction = null;

        // Reset selection info display (redundant now handled by clearGem/CardState?)
        // const existingPreview = selectionInfoDiv.querySelector('.card-preview-container');
        // if (existingPreview) existingPreview.remove();
        // selectionInfoDiv.querySelectorAll('.selection-text').forEach(p => p.style.display = 'block');

        // Update UI (buttons, clickable state)
        renderSelectionInfo(); // Render cleared state
        updateClickableState(); // Update clickable elements
    }


    function handleEndTurnEarly() {
        if (gameTrulyFinished) {
            updateLog("Game is over.");
            return;
        }
        if (isOverlayVisible()) {
            updateLog("Cannot end turn now (overlay visible).");
            return;
        }

        const player = players[currentPlayerIndex];
        if (currentAction) {
            // If an action (gem/card selection) is in progress, cancel it first.
            const actionCancelled = currentAction; // Remember what was cancelled for logging
            clearActionState(); // This will cancel selection and update UI
            updateLog(`Player ${player.name} cancelled ${actionCancelled.replace('SELECTING_','').toLowerCase()} selection and ended their turn.`);
        } else {
            // If no action is selected, just pass the turn.
            updateLog(`Player ${player.name} passed the turn.`);
        }
        endTurn('EARLY_END'); // End the turn regardless of whether an action was cancelled
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
        return array;
    }

    function countOccurrences(arr, val) {
        return arr.reduce((count, current) => (current === val ? count + 1 : count), 0);
    }

    function getCardById(id) {
        if (!id || typeof id !== 'string') return null;
        // Check visible cards
        for (let level = 1; level <= 3; level++) {
            const card = visibleCards[level]?.find(c => c && c.id === id);
            if (card) return card;
        }
        // Check reserved cards of all players (needed for preview logic)
        for (const p of players) {
            const card = p.reservedCards?.find(c => c && c.id === id);
            if (card) return card;
        }
        // Could also check purchased cards if needed, but usually not for actions
        return null; // Not found
    }

    function getDeckCardPlaceholder(level) {
        // Returns a placeholder object for rendering deck info when selected
        return { level: level, color: 'deck', cost: {}, vp: 0, id: null };
    }

    function canAffordCard(player, cardData) {
        if (!player || !cardData || !cardData.cost) {
            return { canAfford: false, goldNeeded: 0, effectiveCost: {} };
        }
        let goldNeeded = 0;
        const effectiveCost = {}; // Store cost after bonus discount

        GEM_TYPES.forEach(gemType => {
            const cardCost = cardData.cost[gemType] || 0;
            const playerBonus = player.bonuses[gemType] || 0;
            const costAfterBonus = Math.max(0, cardCost - playerBonus);
            effectiveCost[gemType] = costAfterBonus; // Store this for payment logic

            if (player.gems[gemType] < costAfterBonus) {
                // Calculate how much gold is needed for this gem type
                goldNeeded += costAfterBonus - player.gems[gemType];
            }
        });

        const canAfford = player.gems.gold >= goldNeeded; // Check if player has enough gold
        return { canAfford, goldNeeded, effectiveCost };
    }

    function drawCard(level, index) {
        if (decks[level].length > 0) {
            visibleCards[level][index] = decks[level].pop(); // Draw from deck
        } else {
            visibleCards[level][index] = null; // Deck empty, slot becomes empty
        }
        // Don't render deck count here, renderCards() or performReserveCard calls renderDeckCount
        // renderDeckCount(level);
        return visibleCards[level][index]; // Return the drawn card (or null)
    }

    function renderDeckCount(level) {
        if (deckCounts[level] && deckElements[level]) {
            deckCounts[level].textContent = decks[level].length;
            deckElements[level].classList.toggle('empty', decks[level].length === 0);
            deckElements[level].title = `${decks[level].length} cards left in Level ${level} deck`;
        }
    }

    // ========================================================================
    // REVISED updateClickableState + DEBUG LOGS (Gem Logic Part Only)
    // ========================================================================
    function updateClickableState() {
        const player = players[currentPlayerIndex];
        const disableAll = gameTrulyFinished || isOverlayVisible() || !player;

        // console.log(`--- updateClickableState START --- currentAction: ${currentAction}, selectedGems: [${selectedGemTypes.join(',')}]`); // DEBUG

        document.querySelectorAll('.card-affordable-now').forEach(el => el.classList.remove('card-affordable-now'));

        if (disableAll) {
            // Disable everything
            document.querySelectorAll('.gem, .card:not(.empty-slot), .deck, .reserved-card-small').forEach(el => {
                el.classList.add('not-selectable');
                el.classList.remove('not-affordable', 'selected');
            });
             // Ensure visual gem selections are cleared if game ends/overlay appears mid-selection
             if (currentAction === 'SELECTING_GEMS') {
                 gemBankContainer.querySelectorAll('.gem.selected').forEach(el => el.classList.remove('selected'));
             }
            dynamicActionButtonsContainer.innerHTML = ''; // Clear action buttons too
            endTurnEarlyBtn.disabled = true;
            endTurnEarlyBtn.classList.add('hidden');
            return; // Stop further processing
        }

        // --- Enable/Disable Gems (Revised Logic) ---
        gemBankContainer.querySelectorAll('.gem').forEach(gemEl => {
            const gemType = gemEl.dataset.gemType;
            const isGold = gemType === GOLD;
            const isSelected = gemEl.classList.contains('selected'); // Current visual state
            let clickable = false; // Default to not clickable

            // console.log(`  [updateClickableState] Checking Gem: ${gemType}, Bank: ${bank[gemType]}, isSelected: ${isSelected}`); // DEBUG

            // Basic conditions: Not gold, bank has gems
            if (!isGold && bank[gemType] > 0) {

                // Condition: Card action in progress? No gem selection allowed.
                if (currentAction === 'SELECTING_CARD') {
                    clickable = false;
                }
                // Condition: Gem selection in progress or starting
                else { // currentAction === 'SELECTING_GEMS' or null
                     const currentSelection = selectedGemTypes; // Use the actual data
                     const currentCount = currentSelection.length;
                     const currentUniqueCount = new Set(currentSelection).size;

                     // Rule: If this specific gem element is already selected, it's clickable (to deselect)
                     if (isSelected) {
                         clickable = true;
                     }
                     // Rule: If not selected, can it be ADDED?
                     else {
                         if (currentCount === 0) {
                            clickable = (bank[gemType] >= 1); // Can select if available
                         } else if (currentCount === 1) {
                            const firstType = currentSelection[0];
                            // Can select a second, different gem?
                            if (gemType !== firstType && bank[gemType] >= 1) {
                                clickable = true;
                            }
                            // Can select a second, identical gem? (Requires bank >= MIN_GEMS_FOR_TAKE_TWO)
                            else if (gemType === firstType) { // Checking the identical case
                                const bankHasEnough = bank[gemType] >= MIN_GEMS_FOR_TAKE_TWO;
                                 console.log(`  [updateClickableState] Count=1, checking 2nd identical ${gemType}: Bank=${bank[gemType]}, Needs=${MIN_GEMS_FOR_TAKE_TWO}, BankHasEnough=${bankHasEnough}`); // DEBUG
                                if (bankHasEnough) {
                                    clickable = true;
                                }
                            }
                         } else if (currentCount === 2) {
                            // If 2 identical selected, cannot add more.
                            if (currentUniqueCount === 1) {
                                clickable = false;
                            }
                            // If 2 different selected, can add a 3rd different one.
                            else if (currentUniqueCount === 2) {
                                if (!currentSelection.includes(gemType) && bank[gemType] >= 1) {
                                    clickable = true;
                                }
                            }
                         }
                         // If currentCount >= 3, cannot add more non-selected gems.
                         else { // currentCount >= 3
                             clickable = false;
                         }
                     }
                }
            }
            // else: Gem is Gold or Bank is empty for this type, clickable remains false

            // console.log(`  [updateClickableState] Final decision for ${gemType} (isSelected=${isSelected}): clickable=${clickable}`); // DEBUG
            gemEl.classList.toggle('not-selectable', !clickable);

        }); // End gem loop


        // --- Enable/Disable Cards/Decks/Reserved (Keep Original Logic Here) ---
        document.querySelectorAll('#cards-area .card:not(.empty-slot), #cards-area .deck').forEach(el => {
            let disable = false;
            const isDeck = el.classList.contains('deck');
            const isCard = el.classList.contains('card');
            let canPlayerAfford = false;
            let cardData = null;

            if (isCard) cardData = getCardById(el.dataset.cardId);
            if (cardData) canPlayerAfford = canAffordCard(player, cardData).canAfford;

            if (currentAction === 'SELECTING_GEMS') {
                disable = true; // Cannot interact with cards when selecting gems
            } else if (currentAction === 'SELECTING_CARD' && selectedCard?.element !== el) {
                disable = true; // Cannot interact with other cards when one is selected
            } else { // currentAction is null or SELECTING_CARD (and this is the selected element)
                if (isDeck) {
                    if (el.classList.contains('empty')) disable = true; // Cannot reserve empty deck
                    // Allow selecting deck if no action OR if this deck is already selected
                    // But disable initial selection if reserve limit reached
                    else if (currentAction === null && player.reservedCards.length >= MAX_RESERVED_CARDS) {
                         disable = true;
                    }
                } else if (isCard && cardData) {
                    // If no action is selected yet, disable if cannot afford AND cannot reserve
                    const canReserve = player.reservedCards.length < MAX_RESERVED_CARDS;
                    if (currentAction === null && !canPlayerAfford && !canReserve) {
                        disable = true;
                    }
                    // If this card IS selected, it remains enabled (to show purchase/reserve buttons)
                    // Note: Button disabling handles afford/reserve limits after selection
                } else if (isCard && !cardData) { // Empty slot
                     disable = true;
                }
            }

            el.classList.toggle('not-selectable', disable);
            if (isCard && cardData) { // Only apply afford/affordable classes to actual cards
                // Show not-affordable only if it's selectable but cannot be afforded
                el.classList.toggle('not-affordable', !disable && !canPlayerAfford);
                // Highlight affordable only if selectable, affordable, and not the currently selected card
                el.classList.toggle('card-affordable-now', !disable && canPlayerAfford && selectedCard?.element !== el);
            } else {
                // Clear affordability classes for decks/empty slots
                 el.classList.remove('not-affordable', 'card-affordable-now');
            }
        });

        document.querySelectorAll('.player-area .reserved-card-small').forEach(cardEl => {
            let disable = true; // Default to disabled
            const playerArea = cardEl.closest('.player-area');
            let canPlayerAfford = false;
            let cardData = null;

            // Only consider cards in the *current* player's area
            if (playerArea && playerArea.id === `player-area-${player.id}`) {
                cardData = player.reservedCards?.find(c => c.id === cardEl.dataset.cardId);
                if (cardData) canPlayerAfford = canAffordCard(player, cardData).canAfford;

                if (currentAction === 'SELECTING_GEMS') {
                    disable = true; // Cannot interact when selecting gems
                } else if (currentAction === 'SELECTING_CARD' && selectedCard?.element !== cardEl) {
                    disable = true; // Cannot interact with other cards when one is selected
                } else if (cardData){
                    // Can interact if no action, or if this card is the selected one
                    disable = false;
                     // Re-disable if no action and cannot afford (cannot reserve already reserved card)
                     if (currentAction === null && !canPlayerAfford) {
                         disable = true;
                     }
                }
            } // else: card is in another player's area, remains disabled

            cardEl.classList.toggle('not-selectable', disable);
            if (!disable && cardData) {
                 cardEl.classList.toggle('not-affordable', !canPlayerAfford);
                 // Highlight affordable only if selectable, affordable, and not the currently selected card
                 cardEl.classList.toggle('card-affordable-now', canPlayerAfford && selectedCard?.element !== el);
            } else {
                 cardEl.classList.remove('not-affordable', 'card-affordable-now');
            }
        });


        // --- End Turn Button State ---
        endTurnEarlyBtn.disabled = disableAll;
        endTurnEarlyBtn.classList.toggle('hidden', disableAll);
    }


    function highlightActivePlayer() {
        // Remove highlight from previously active player
        document.querySelectorAll('.player-area.active-player').forEach(el => el.classList.remove('active-player'));
        // Add highlight to current player
        const activePlayerEl = document.getElementById(`player-area-${currentPlayerIndex}`);
        if (activePlayerEl) {
            activePlayerEl.classList.add('active-player');
        }
    }

    function startTimer() {
        stopTimer(); // Clear any existing timer
        if (gameSettings.timerMinutes <= 0 || turnDuration <= 0) {
            renderTimer(); // Display "Off"
            return;
        }
        turnTimeRemaining = turnDuration; // Reset timer
        renderTimer(); // Initial display
        turnTimerInterval = setInterval(() => {
            turnTimeRemaining--;
            renderTimer(); // Update display every second
            if (turnTimeRemaining < 0) { // Time's up
                updateLog(`Player ${players[currentPlayerIndex].name}'s turn timed out.`);
                clearActionState(); // Cancel any pending action
                endTurn('TIMEOUT'); // Force end turn
            }
        }, 1000);
    }

    function stopTimer() {
        clearInterval(turnTimerInterval);
        turnTimerInterval = null;
        // Optionally reset visual state if needed, renderTimer handles display text
         renderTimer();
    }

    function updateLog(message) {
        const p = document.createElement('p');
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        p.textContent = `[${timestamp}] ${message}`;
        logMessagesDiv.appendChild(p);
        logMessagesDiv.scrollTop = logMessagesDiv.scrollHeight; // Auto-scroll
    }

    function hideOverlays() {
        returnGemsOverlay.classList.add('hidden');
        gameOverOverlay.classList.add('hidden');
        nobleChoiceOverlay.classList.add('hidden');
        updateClickableState(); // Ensure board is clickable after hiding overlays
    }

    function isOverlayVisible() {
        return !returnGemsOverlay.classList.contains('hidden') ||
               !gameOverOverlay.classList.contains('hidden') ||
               !nobleChoiceOverlay.classList.contains('hidden');
    }

    function formatCardCostForTitle(cardData) {
        let title = `L${cardData.level} ${cardData.color} (${cardData.vp} VP)`;
        const costString = GEM_TYPES
            .map(type => ({ type, count: cardData.cost[type] || 0 }))
            .filter(item => item.count > 0)
            .map(item => `${item.count} ${item.type}`)
            .join(', ');
        title += `\nCost: ${costString || 'Free'}`; // Indicate if free
        return title;
    }

    // Creates tiny card visuals for the end-game stats screen
    function createTinyCardElement(cardData) {
        const cardEl = document.createElement('div');
        if (!cardData) return cardEl; // Should not happen in stats, but safe check
        cardEl.classList.add('tiny-card', `card-border-${cardData.color}`);

        const costString = Object.entries(cardData.cost || {})
                               .filter(([,c]) => c > 0)
                               .map(([t,c]) => `${c}${t.slice(0,1).toUpperCase()}`) // e.g., "3W, 1B" - Keep abbreviation for now
                               .join(', ');
        cardEl.title = `L${cardData.level} ${cardData.color} (${cardData.vp} VP)\nCost: ${costString || 'Free'}`;

        const vpSpan = document.createElement('span');
        vpSpan.classList.add('tiny-card-vp');
        vpSpan.textContent = cardData.vp > 0 ? cardData.vp : '';

        const gemBonus = document.createElement('div');
        gemBonus.classList.add('tiny-card-gem', `gem-${cardData.color}`);

        cardEl.appendChild(vpSpan);
        cardEl.appendChild(gemBonus);
        return cardEl;
    }

    // Creates HTML string for gem counts in end-game stats
    function createGemFlowString(gemCounts) {
        return GEM_TYPES
            .map(type => ({ type, count: gemCounts[type] || 0 }))
            .filter(item => item.count > 0)
            .map(item => `<span class="gem-inline gem-${item.type}" title="${item.count} ${item.type}">${item.count}</span>`)
            .join(' ') || '<span class="no-items">0</span>'; // Show 0 if none
    }

    // ========================================================================
    // INITIAL SCRIPT EXECUTION
    // ========================================================================
    document.body.style.alignItems = 'center'; // Center setup screen initially
    document.body.style.justifyContent = 'center';
    setupPlayerNameInputs(); // Populate initial player name fields
    setupEventListeners(); // Add all listeners

}); // End DOMContentLoaded
// --- END OF FILE script.js ---