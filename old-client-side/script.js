// --- START OF FILE script.js ---
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
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
    const selectedGemsDisplay = document.getElementById('selected-gems-display');
    const selectedCardDisplay = document.getElementById('selected-card-display');
    const dynamicActionButtonsContainer = document.getElementById('dynamic-action-buttons');
    const cancelActionBtn = document.getElementById('cancel-action-btn');
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

    // --- Game State Variables ---
    let players = [];
    let bank = {};
    let decks = { 1: [], 2: [], 3: [] };
    let visibleCards = { 1: [], 2: [], 3: [] };
    let availableNobles = [];
    let currentPlayerIndex = 0;
    let turnNumber = 1;
    let gameSettings = { playerCount: 4, timerMinutes: 1.5 };
    let isGameOver = false;
    let lastRoundPlayerIndex = -1; // Index of the player who gets the last turn
    let turnTimerInterval = null;
    let turnTimeRemaining = 0;
    let turnDuration = 0;

    // --- Player Action State ---
    let selectedGemTypes = []; // Array of gem types selected (e.g., ['blue', 'red', 'green'] or ['white', 'white'])
    let selectedCard = null; // { type: 'visible'/'reserved'/'deck', level: N, id: 'card-X'/'deck-L', element: DOMElement }
    let currentAction = null; // e.g., 'SELECTING_GEMS', 'SELECTING_CARD', null

    // --- Constants ---
    const MAX_GEMS_PLAYER = 10;
    const MAX_RESERVED_CARDS = 3;
    const CARDS_PER_LEVEL_VISIBLE = 4;
    const WINNING_SCORE = 15;
    const TIMER_LOW_THRESHOLD = 10; // Seconds remaining to show warning
    const MIN_GEMS_FOR_TAKE_TWO = 4; // Min gems in bank to take 2 identical

    // ========================================================================
    // INITIALIZATION & SETUP
    // ========================================================================

    function initGame(playerNames) {
        // Reset Core Game State
        players = [];
        bank = {};
        decks = { 1: [], 2: [], 3: [] };
        visibleCards = { 1: [], 2: [], 3: [] };
        availableNobles = [];
        currentPlayerIndex = 0;
        turnNumber = 1;
        isGameOver = false;
        lastRoundPlayerIndex = -1;

        // Reset Timers & Overlays & Logs
        stopTimer();
        hideOverlays();
        logMessagesDiv.innerHTML = '';

        // Reset Action State
        clearActionState();

        // Initialize Players
        for (let i = 0; i < playerNames.length; i++) {
            players.push({
                id: i, name: playerNames[i],
                gems: { white: 0, blue: 0, green: 0, red: 0, black: 0, gold: 0 },
                cards: [], reservedCards: [], nobles: [], score: 0,
                bonuses: { white: 0, blue: 0, green: 0, red: 0, black: 0 }
            });
        }

        // Initialize Bank based on player count (Rulebook p.2)
        const gemCount = gameSettings.playerCount === 2 ? 4 : (gameSettings.playerCount === 3 ? 5 : 7);
        GEM_TYPES.forEach(gem => bank[gem] = gemCount);
        bank[GOLD] = 5;

        // Initialize Decks
        decks[1] = shuffleArray([...ALL_CARDS.filter(c => c.level === 1)]);
        decks[2] = shuffleArray([...ALL_CARDS.filter(c => c.level === 2)]);
        decks[3] = shuffleArray([...ALL_CARDS.filter(c => c.level === 3)]);

        // Deal Initial Visible Cards (4 per level)
        for (let level = 1; level <= 3; level++) {
            visibleCards[level] = [];
            for (let i = 0; i < CARDS_PER_LEVEL_VISIBLE; i++) {
                drawCard(level, i); // Use helper to draw and handle empty decks
            }
        }

        // Reveal Nobles (Player Count + 1)
        const numNobles = gameSettings.playerCount + 1;
        availableNobles = shuffleArray([...ALL_NOBLES]).slice(0, numNobles);

        // Render Initial Board State
        renderBank();
        renderCards();
        renderNobles();
        renderPlayers();

        // Log Start
        updateLog("Game started with " + playerNames.join(', '));
        updateLog(`Player ${players[0].name}'s turn.`);

        // Switch Screens
        setupScreen.classList.remove('active');
        setupScreen.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        gameContainer.classList.add('active');
        document.body.style.alignItems = 'flex-start'; // Adjust body alignment for game view
        document.body.style.justifyContent = 'center';

        // Start First Turn
        startTurn();
    }

    function setupPlayerNameInputs() {
        const count = parseInt(playerCountSelect.value);
        playerNamesDiv.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const input = document.createElement('input');
            input.type = 'text'; input.placeholder = `Player ${i + 1} Name`;
            input.id = `player-name-${i}`; input.value = `Player ${i + 1}`;
            input.classList.add('setup-input');
            playerNamesDiv.appendChild(input);
        }
    }

    function setupEventListeners() {
        playerCountSelect.addEventListener('change', setupPlayerNameInputs);
        startGameBtn.addEventListener('click', () => {
            gameSettings.playerCount = parseInt(playerCountSelect.value);
            gameSettings.timerMinutes = parseFloat(timerInput.value);
            turnDuration = gameSettings.timerMinutes * 60;
            const playerNames = [];
            for (let i = 0; i < gameSettings.playerCount; i++) {
                const input = document.getElementById(`player-name-${i}`);
                playerNames.push(input.value.trim() || `Player ${i + 1}`);
            }
            initGame(playerNames);
        });

        deckElements[1].addEventListener('click', () => handleDeckClick(1));
        deckElements[2].addEventListener('click', () => handleDeckClick(2));
        deckElements[3].addEventListener('click', () => handleDeckClick(3));

        cancelActionBtn.addEventListener('click', cancelAction);
        endTurnEarlyBtn.addEventListener('click', handleEndTurnEarly); // Changed name for clarity

        playAgainBtn.addEventListener('click', () => {
            gameOverOverlay.classList.add('hidden'); setupScreen.classList.remove('hidden');
            setupScreen.classList.add('active'); gameContainer.classList.remove('active');
            gameContainer.classList.add('hidden');
            document.body.style.alignItems = 'center'; document.body.style.justifyContent = 'center';
            setupPlayerNameInputs();
        });
    }

    // ========================================================================
    // RENDERING FUNCTIONS
    // ========================================================================

    function renderBank() {
        gemBankContainer.innerHTML = '';
        [...GEM_TYPES, GOLD].forEach(gemType => {
            const count = bank[gemType];
            if (count >= 0) {
                const gemEl = createGemElement(gemType, count, true); // isBank = true for count display
                gemEl.dataset.gemType = gemType; // Add type for listener logic
                if (count > 0 && gemType !== GOLD) {
                    gemEl.removeEventListener('click', handleGemClickWrapper); // Prevent duplicates
                    gemEl.addEventListener('click', handleGemClickWrapper);
                } else {
                    gemEl.classList.add('not-selectable'); // Use CSS to style non-clickable
                }
                gemBankContainer.appendChild(gemEl);
            }
        });
        // updateClickableState() should be called after any render that might change clickability
    }
     // Wrapper needed because addEventListener doesn't easily pass extra args like gemType
     function handleGemClickWrapper(event) {
        const gemEl = event.currentTarget;
        const gemType = gemEl.dataset.gemType;
        if (gemType && gemType !== GOLD) { // Ensure it's a valid, non-gold type
            handleGemClick(gemType, gemEl);
        }
    }


    function renderCards() {
        for (let level = 1; level <= 3; level++) {
            const container = visibleCardsContainers[level];
            container.innerHTML = ''; // Clear previous cards
            visibleCards[level].forEach((cardData, index) => {
                const cardEl = createCardElement(cardData, level, index);
                if (cardData) {
                    cardEl.dataset.cardId = cardData.id; // Make sure ID is set for listener
                    cardEl.removeEventListener('click', handleVisibleCardClickWrapper); // Prevent duplicates
                    cardEl.addEventListener('click', handleVisibleCardClickWrapper);
                 }
                container.appendChild(cardEl);
            });
            // Update deck counts and styles
            deckCounts[level].textContent = decks[level].length;
            deckElements[level].classList.toggle('empty', decks[level].length === 0);
            deckElements[level].classList.remove('selected');
        }
        // updateClickableState(); // Call after rendering potentially clickable items
    }
    // Wrapper for visible card clicks
    function handleVisibleCardClickWrapper(event) {
        const cardEl = event.currentTarget;
        const cardId = cardEl.dataset.cardId;
        const level = parseInt(cardEl.dataset.level, 10);
        if (cardId) { // Ensure card data is present
            handleCardClick('visible', level, cardId, cardEl);
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
            // Add listeners for reserved cards *after* element is in DOM
            playerEl.querySelectorAll('.reserved-card-small').forEach(cardEl => {
                const cardId = cardEl.dataset.cardId;
                 if (cardId) {
                    cardEl.removeEventListener('click', handleReservedCardClickWrapper); // Prevent duplicates
                    cardEl.addEventListener('click', handleReservedCardClickWrapper);
                 }
            });
        });
        highlightActivePlayer();
        // updateClickableState(); // Call after rendering potentially clickable items
    }
    // Wrapper for reserved card clicks
    function handleReservedCardClickWrapper(event) {
        const cardEl = event.currentTarget;
        const cardId = cardEl.dataset.cardId;
         if (cardId) { // Ensure card data is present
             handleReservedCardClick(cardId, cardEl);
         }
    }

    // Renders a single player's area - called by renderPlayers and after actions
    function renderPlayerArea(playerId) {
        const player = players.find(p => p.id === playerId);
        const playerAreaEl = document.getElementById(`player-area-${playerId}`);
        if (player && playerAreaEl) {
            const logScrollTop = logMessagesDiv.scrollTop;
            // Replace content efficiently
            const tempDiv = createPlayerAreaElement(player);
            playerAreaEl.innerHTML = tempDiv.innerHTML;
            logMessagesDiv.scrollTop = logScrollTop; // Restore scroll position

            // Re-attach listeners for the updated reserved cards
            playerAreaEl.querySelectorAll('.reserved-card-small').forEach(cardEl => {
                const cardId = cardEl.dataset.cardId;
                 if (cardId) {
                    cardEl.removeEventListener('click', handleReservedCardClickWrapper); // Prevent duplicates
                    cardEl.addEventListener('click', handleReservedCardClickWrapper);
                 }
            });
             highlightActivePlayer(); // Ensure active player border is correct
        } else {
            console.error("Could not find player or player area to update:", playerId);
        }
        // updateClickableState(); // Called after relevant state changes
    }

    function renderTimer() {
        if (gameSettings.timerMinutes <= 0) { timerDisplay.textContent = "Off"; timerDisplay.classList.remove('timer-low'); return; }
        const minutes = Math.floor(turnTimeRemaining / 60);
        const seconds = Math.floor(turnTimeRemaining % 60);
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        timerDisplay.classList.toggle('timer-low', turnTimeRemaining <= TIMER_LOW_THRESHOLD && turnTimeRemaining > 0);
        if (turnTimeRemaining <= 0) { timerDisplay.classList.remove('timer-low'); }
    }

    function renderSelectionInfo() {
        dynamicActionButtonsContainer.innerHTML = ''; // Clear old buttons
        let actionPossible = false; // Is *any* selection active?

        // --- Display Selected Gems ---
        if (currentAction === 'SELECTING_GEMS' && selectedGemTypes.length > 0) {
            selectedGemsDisplay.innerHTML = '';
            selectedGemTypes.forEach(type => { selectedGemsDisplay.appendChild(createGemElement(type, 1, false)); });
            actionPossible = true;

            // Always create Confirm button, disable if invalid
            const btn = document.createElement('button');
            btn.textContent = 'Confirm Take Gems';
            btn.onclick = performTakeGems;
            btn.disabled = !validateTakeGemsSelection(); // Disable if selection invalid
            dynamicActionButtonsContainer.appendChild(btn);

        } else {
            selectedGemsDisplay.textContent = 'None';
        }

        // --- Display Selected Card ---
        if (currentAction === 'SELECTING_CARD' && selectedCard) {
            const cardData = selectedCard.id ? (getCardById(selectedCard.id) ?? getDeckCardPlaceholder(selectedCard.level)) : null;
            let cardText = 'Invalid Selection';
            if(cardData) {
                 if (selectedCard.type === 'visible') cardText = `Board L${cardData.level} (${cardData.color})`;
                 else if (selectedCard.type === 'reserved') cardText = `Reserved L${cardData.level} (${cardData.color})`;
                 else if (selectedCard.type === 'deck') cardText = `Deck L${cardData.level}`;
            }
            selectedCardDisplay.textContent = cardText;
            actionPossible = true;

            // --- Always Create Applicable Buttons, Disable as Needed ---
            const player = players[currentPlayerIndex];
            if (player && cardData) {
                const canReserveCheck = player.reservedCards.length < MAX_RESERVED_CARDS;
                const { canAfford } = canAffordCard(player, cardData);

                // Purchase Button (Visible or Reserved Card only)
                if ((selectedCard.type === 'visible' || selectedCard.type === 'reserved') && cardData.id) { // Requires a real card ID
                    const purchaseBtn = document.createElement('button');
                    purchaseBtn.textContent = 'Purchase Card';
                    purchaseBtn.onclick = performPurchaseCard;
                    purchaseBtn.disabled = !canAfford; // Disable if cannot afford
                    dynamicActionButtonsContainer.appendChild(purchaseBtn);
                }

                // Reserve Button (Visible or Deck only)
                if (selectedCard.type === 'visible' || selectedCard.type === 'deck') {
                    const reserveBtn = document.createElement('button');
                    reserveBtn.textContent = 'Reserve Card';
                    reserveBtn.onclick = performReserveCard;
                    // Disable if reservation limit reached OR trying to reserve from an empty deck
                    const disableReserve = !canReserveCheck || (selectedCard.type === 'deck' && decks[selectedCard.level].length === 0);
                    reserveBtn.disabled = disableReserve;
                    dynamicActionButtonsContainer.appendChild(reserveBtn);
                }
            }
        } else {
            selectedCardDisplay.textContent = 'None';
        }

        // --- Show/Hide Cancel Button ---
        // Keep original logic: show only when an action is selected
        cancelActionBtn.classList.toggle('hidden', !actionPossible);

        // --- Update End Turn Button State ---
        // (Also handled in updateClickableState, but good to ensure consistency here)
        const disableAll = isGameOver || isOverlayVisible();
        endTurnEarlyBtn.disabled = !!currentAction || disableAll;
         // Make sure End Turn is VISIBLE unless game is over/overlay
        endTurnEarlyBtn.classList.toggle('hidden', disableAll && !currentAction);


    } // End renderSelectionInfo


    // ========================================================================
    // UI ELEMENT CREATION HELPERS
    // ========================================================================
    // createGemElement, createCardElement, createSmallReservedCardElement,
    // createNobleElement, createPlayerAreaElement remain largely the same as before.
    // Make sure they don't attach listeners directly.

    function createGemElement(type, count, isBank) {
        const gemEl = document.createElement('div');
        gemEl.classList.add('gem', `gem-${type}`);
        // Removed dataset setting here, added in renderBank for clarity
        if (isBank) {
            const countEl = document.createElement('span');
            countEl.classList.add('gem-count'); countEl.textContent = count;
            gemEl.appendChild(countEl);
        } else {
            gemEl.classList.add('small-gems');
        }
        return gemEl;
    }

    function createCardElement(cardData, level, index = -1) {
        const cardEl = document.createElement('div');
        if (!cardData) { cardEl.classList.add('card', 'empty-slot'); cardEl.textContent = 'Empty'; return cardEl; }
        cardEl.classList.add('card', `card-border-${cardData.color}`);
        cardEl.dataset.level = level; if (index !== -1) cardEl.dataset.index = index; // ID set in renderCards
        const topArea = document.createElement('div'); topArea.classList.add('card-top-area');
        const vpSpan = document.createElement('span'); vpSpan.classList.add('card-vp'); vpSpan.textContent = cardData.vp > 0 ? cardData.vp : '';
        const gemBonus = document.createElement('div'); gemBonus.classList.add('card-gem-bonus', `gem-${cardData.color}`);
        topArea.appendChild(vpSpan); topArea.appendChild(gemBonus);
        const centerArea = document.createElement('div'); centerArea.classList.add('card-center-area');
        const costArea = document.createElement('div'); costArea.classList.add('card-cost-area');
        GEM_TYPES.forEach(gemType => {
            const cost = cardData.cost[gemType];
            if (cost > 0) {
                const costItem = document.createElement('div'); costItem.classList.add('cost-item'); costItem.textContent = cost;
                const costGem = document.createElement('span'); costGem.classList.add('cost-gem', `gem-${gemType}`);
                costItem.appendChild(costGem); costArea.appendChild(costItem);
            }
        });
        cardEl.appendChild(topArea); cardEl.appendChild(centerArea); cardEl.appendChild(costArea);
        return cardEl;
    }

    function createSmallReservedCardElement(cardData) {
        const cardEl = document.createElement('div');
        cardEl.classList.add('reserved-card-small', `card-border-${cardData.color}`); cardEl.dataset.cardId = cardData.id;
        // ... (rest of the small card structure remains the same) ...
        const topArea = document.createElement('div'); topArea.classList.add('card-top-area');
        const vpSpan = document.createElement('span'); vpSpan.classList.add('card-vp'); vpSpan.textContent = cardData.vp > 0 ? cardData.vp : '';
        const gemBonus = document.createElement('div'); gemBonus.classList.add('card-gem-bonus', `gem-${cardData.color}`);
        topArea.appendChild(vpSpan); topArea.appendChild(gemBonus);
        const costArea = document.createElement('div'); costArea.classList.add('card-cost-area');
        GEM_TYPES.forEach(gemType => {
            const cost = cardData.cost[gemType];
            if (cost > 0) {
                const costItem = document.createElement('div'); costItem.classList.add('cost-item'); costItem.textContent = cost;
                const costGem = document.createElement('span'); costGem.classList.add('cost-gem', `gem-${gemType}`);
                costItem.appendChild(costGem); costArea.appendChild(costItem);
            }
        });
        cardEl.appendChild(topArea); cardEl.appendChild(costArea);
        return cardEl;
    }

    function createNobleElement(nobleData) {
        const nobleEl = document.createElement('div'); nobleEl.classList.add('noble'); nobleEl.dataset.nobleId = nobleData.id;
        // ... (rest of the noble structure remains the same) ...
        const vpSpan = document.createElement('span'); vpSpan.classList.add('noble-vp'); vpSpan.textContent = nobleData.vp;
        const reqsDiv = document.createElement('div'); reqsDiv.classList.add('noble-requirements');
        GEM_TYPES.forEach(gemType => {
            const req = nobleData.requirements[gemType];
            if (req > 0) {
                const reqItem = document.createElement('div'); reqItem.classList.add('req-item'); reqItem.textContent = req;
                const reqGem = document.createElement('span'); reqGem.classList.add('req-gem', `gem-${gemType}`);
                reqItem.appendChild(reqGem); reqsDiv.appendChild(reqItem);
            }
        });
        nobleEl.appendChild(vpSpan); nobleEl.appendChild(reqsDiv);
        return nobleEl;
    }

     function createPlayerAreaElement(player) {
        const playerDiv = document.createElement('div');
        playerDiv.classList.add('player-area'); playerDiv.id = `player-area-${player.id}`;
        // ... (rest of player area structure remains the same) ...
        const header = document.createElement('div'); header.classList.add('player-header');
        const nameSpan = document.createElement('span'); nameSpan.classList.add('player-name'); nameSpan.textContent = player.name;
        const scoreSpan = document.createElement('span'); scoreSpan.classList.add('player-score'); scoreSpan.textContent = `VP: ${player.score}`;
        header.appendChild(nameSpan); header.appendChild(scoreSpan);
        const resourcesDiv = document.createElement('div'); resourcesDiv.classList.add('player-resources');
        const gemsHeader = document.createElement('h4'); gemsHeader.textContent = 'Gems';
        const gemsContainer = document.createElement('div'); gemsContainer.classList.add('gems-container', 'small-gems');
        let totalNonGoldGems = 0;
        GEM_TYPES.forEach(gemType => {
            const count = player.gems[gemType]; totalNonGoldGems += count;
            if (count > 0) { gemsContainer.appendChild(createGemElement(gemType, count, true)); }
        });
        if (player.gems[GOLD] > 0) { gemsContainer.appendChild(createGemElement(GOLD, player.gems[GOLD], true)); }
        const totalGemsSpan = document.createElement('span'); totalGemsSpan.style.marginLeft = '10px'; totalGemsSpan.style.fontWeight = 'bold'; totalGemsSpan.textContent = `(${totalNonGoldGems}/${MAX_GEMS_PLAYER})`;
        gemsContainer.appendChild(totalGemsSpan);

        const bonusHeader = document.createElement('h4'); bonusHeader.textContent = 'Bonuses';
        const bonusContainer = document.createElement('div'); bonusContainer.classList.add('player-cards');
        let hasBonuses = false;
        GEM_TYPES.forEach(gemType => {
            const count = player.bonuses[gemType];
            if (count > 0) { hasBonuses = true; const bonusEl = document.createElement('div'); bonusEl.classList.add('player-card-count', `gem-${gemType}`); bonusEl.textContent = count; bonusContainer.appendChild(bonusEl); }
        });
        if (!hasBonuses) { bonusContainer.textContent = 'None'; bonusContainer.style.fontSize = '0.9em'; bonusContainer.style.color = 'var(--text-tertiary)'; bonusContainer.style.textAlign = 'center'; }

        const reservedHeader = document.createElement('h4'); reservedHeader.textContent = `Reserved (${player.reservedCards.length}/${MAX_RESERVED_CARDS})`;
        const reservedContainer = document.createElement('div'); reservedContainer.classList.add('reserved-cards-container');
        if (player.reservedCards.length > 0) { player.reservedCards.forEach(cardData => { reservedContainer.appendChild(createSmallReservedCardElement(cardData)); });
        } else { reservedContainer.textContent = 'None reserved'; reservedContainer.style.textAlign = 'center'; reservedContainer.style.color = 'var(--text-tertiary)'; }

        const noblesHeader = document.createElement('h4'); noblesHeader.textContent = `Nobles (${player.nobles.length})`;
        const playerNoblesContainer = document.createElement('div'); playerNoblesContainer.classList.add('nobles-container'); playerNoblesContainer.style.justifyContent = 'flex-start'; /* ... other styles */ playerNoblesContainer.style.minHeight = '55px';
        if (player.nobles.length > 0) { player.nobles.forEach(nobleData => { const nobleEl = createNobleElement(nobleData); /* style adjustments */ playerNoblesContainer.appendChild(nobleEl); });
        } else { playerNoblesContainer.textContent = 'None'; playerNoblesContainer.style.fontSize = '0.9em'; playerNoblesContainer.style.color = 'var(--text-tertiary)'; playerNoblesContainer.style.textAlign = 'center'; }

        resourcesDiv.appendChild(gemsHeader); resourcesDiv.appendChild(gemsContainer); resourcesDiv.appendChild(bonusHeader); resourcesDiv.appendChild(bonusContainer); resourcesDiv.appendChild(reservedHeader); resourcesDiv.appendChild(reservedContainer); resourcesDiv.appendChild(noblesHeader); resourcesDiv.appendChild(playerNoblesContainer);
        playerDiv.appendChild(header); playerDiv.appendChild(resourcesDiv);
        return playerDiv;
    }

    // ========================================================================
    // PLAYER ACTION HANDLING (Input)
    // ========================================================================

    function handleGemClick(gemType, gemEl) {
        if (currentAction && currentAction !== 'SELECTING_GEMS') {
            updateLog("Finish or cancel your current card selection first.");
            return;
        }
        if (isGameOver || isOverlayVisible()) return;

        currentAction = 'SELECTING_GEMS'; // Assume gem selection starts/continues
        const isSelected = gemEl.classList.contains('selected');
        const selectionCount = selectedGemTypes.length;
        const typeCount = countOccurrences(selectedGemTypes, gemType);

        // --- SPECIAL CASE: Selecting Second Identical Gem ---
        // Check if exactly one gem is selected, it's the same type as clicked, and bank has enough
        if (selectionCount === 1 && selectedGemTypes[0] === gemType && bank[gemType] >= MIN_GEMS_FOR_TAKE_TWO) {
            // INTENT: Select the second identical gem, regardless of which element was clicked
            selectedGemTypes.push(gemType); // Add the second gem logically
            updateLog(`Selected second ${gemType}.`);

            // Visually select the clicked element (if not already)
            if (!isSelected) {
                 gemEl.classList.add('selected');
            }
            // Try to visually select another distinct element of the same type
            const otherGemEl = findNonSelectedBankGemElement(gemType, gemEl);
            if (otherGemEl) {
                otherGemEl.classList.add('selected');
            } else {
                 // If only one physical pile, ensure the original clicked one is selected
                 // This case is unlikely if bank >= 4, but handles edge cases.
                 // The first click should have already selected *an* element.
                 const firstSelectedEl = gemBankContainer.querySelector(`.gem[data-gem-type="${gemType}"].selected`);
                 if(!firstSelectedEl) { // If somehow the first click didn't select visually
                    const anyGemEl = gemBankContainer.querySelector(`.gem[data-gem-type="${gemType}"]`);
                    if(anyGemEl) anyGemEl.classList.add('selected');
                 }
                 console.warn(`Could only visually select one pile for taking two ${gemType} gems.`);
            }

            // Update UI and exit
            renderSelectionInfo();
            updateClickableState();
            return;
        }

        // --- DESELECTION ---
        // If the gem clicked is already selected, AND it wasn't the special case above
        if (isSelected) {
            // If currently selected count is 2 and both are this type (deselection of take-two)
            if (selectionCount === 2 && typeCount === 2) {
                 updateLog(`Cancelled taking two ${gemType} gems.`);
                 // Remove both logically and visually
                 selectedGemTypes = []; // Clear the selection entirely
                 gemBankContainer.querySelectorAll(`.gem[data-gem-type="${gemType}"].selected`).forEach(el => el.classList.remove('selected'));
            } else {
                 // General deselection: Remove one instance of this type
                 const index = selectedGemTypes.indexOf(gemType);
                 if (index > -1) {
                     selectedGemTypes.splice(index, 1);
                     gemEl.classList.remove('selected'); // Deselect the clicked element
                     updateLog(`Deselected ${gemType}.`);
                 }
            }
        }
        // --- SELECTION (First gem or subsequent different gems) ---
        else { // Gem clicked is not currently selected
            // Check standard selection rules
            if (selectionCount >= 3) {
                updateLog("Cannot select more than 3 gems."); currentAction = 'SELECTING_GEMS'; /* keep state */ return;
            }
            const uniqueTypesCount = new Set(selectedGemTypes).size;
            // Check if trying to add a different gem when 2 identical are selected
            if (selectionCount === 2 && uniqueTypesCount === 1) {
                updateLog("Cannot select a different gem type when holding two identical gems."); currentAction = 'SELECTING_GEMS'; return;
            }
             // Check if trying to add an identical gem when 2 different are selected
             if (selectionCount === 2 && uniqueTypesCount === 2 && typeCount >= 1) {
                 updateLog("Cannot select two identical gems when holding two different gems."); currentAction = 'SELECTING_GEMS'; return;
             }

            // If rules pass, select the gem
            selectedGemTypes.push(gemType);
            gemEl.classList.add('selected');
            updateLog(`Selected ${gemType}.`);
        }

        // Update UI based on changes
        if (selectedGemTypes.length === 0) {
            currentAction = null; // Reset action type if selection is now empty
        }
        renderSelectionInfo();
        updateClickableState();
    }

    function findNonSelectedBankGemElement(gemType, excludeElement = null) {
        const elements = gemBankContainer.querySelectorAll(`.gem[data-gem-type="${gemType}"]`);
        for (const el of elements) {
            if (!el.classList.contains('selected') && el !== excludeElement) {
                return el;
            }
        }
        return null; // No other non-selected element found
    }

    function handleCardClick(type, level, cardId, cardEl) {
        if (currentAction && currentAction !== 'SELECTING_CARD') {
             updateLog("Finish or cancel your current gem selection first."); return;
        }
        if (isGameOver || isOverlayVisible()) return;
        if (cardEl.classList.contains('not-selectable')) return; // Ignore clicks on non-selectable

        if (selectedCard && selectedCard.element === cardEl) { // Clicked the same card again - deselect
            cardEl.classList.remove('selected');
            clearActionState(); // Fully clear card selection
        } else { // Selecting a new card
            if (selectedCard && selectedCard.element) {
                selectedCard.element.classList.remove('selected'); // Deselect previous
            }
            currentAction = 'SELECTING_CARD';
            selectedCard = { type, level, id: cardId, element: cardEl };
            cardEl.classList.add('selected');
        }

        // Update UI
        renderSelectionInfo();
        updateClickableState();
    }

    function handleDeckClick(level) {
         if (currentAction && currentAction !== 'SELECTING_CARD') {
             updateLog("Finish or cancel your current gem selection first."); return;
         }
         if (isGameOver || isOverlayVisible()) return;
         const deckEl = deckElements[level];
         if (deckEl.classList.contains('empty') || deckEl.classList.contains('not-selectable')) return;

         // Check reservation limit
         const player = players[currentPlayerIndex];
         if (player.reservedCards.length >= MAX_RESERVED_CARDS) {
             updateLog("Reservation limit reached (max 3)."); return;
         }

         const deckId = `deck-${level}`; // Unique ID for deck selection state

         if (selectedCard && selectedCard.element === deckEl) { // Clicked same deck again - deselect
             deckEl.classList.remove('selected');
             clearActionState();
         } else { // Selecting deck
             if (selectedCard && selectedCard.element) {
                 selectedCard.element.classList.remove('selected'); // Deselect previous card/deck
             }
             currentAction = 'SELECTING_CARD';
             selectedCard = { type: 'deck', level, id: deckId, element: deckEl }; // Use deckId
             deckEl.classList.add('selected');
         }

         // Update UI
         renderSelectionInfo();
         updateClickableState();
    }

     function handleReservedCardClick(cardId, cardEl) {
        if (currentAction && currentAction !== 'SELECTING_CARD') {
             updateLog("Finish or cancel your current gem selection first."); return;
         }
         if (isGameOver || isOverlayVisible()) return;
         if (cardEl.classList.contains('not-selectable')) return; // Already handled by updateClickableState but safer

         const player = players[currentPlayerIndex];
         const cardData = player.reservedCards.find(c => c.id === cardId);
         if (!cardData) { console.error("Reserved card data not found for click!", cardId); return; }

         // Check if it's the current player's card (redundant with updateClickableState, but good practice)
         const playerArea = cardEl.closest('.player-area');
         if (!playerArea || playerArea.id !== `player-area-${currentPlayerIndex}`) {
              updateLog("Can only select your own reserved cards."); return;
         }

         if (selectedCard && selectedCard.element === cardEl) { // Clicked same reserved card again - deselect
             cardEl.classList.remove('selected');
             clearActionState();
         } else { // Selecting this reserved card
             if (selectedCard && selectedCard.element) {
                 selectedCard.element.classList.remove('selected'); // Deselect previous
             }
             currentAction = 'SELECTING_CARD';
             selectedCard = { type: 'reserved', level: cardData.level, id: cardId, element: cardEl };
             cardEl.classList.add('selected');
         }

         // Update UI
         renderSelectionInfo();
         updateClickableState();
    }


    // ========================================================================
    // ACTION VALIDATION & PERFORMING (State Updates)
    // ========================================================================

    // Validates the *current* selection of gems in selectedGemTypes array
    function validateTakeGemsSelection() {
        const gems = selectedGemTypes;
        const count = gems.length;
        const uniqueCount = new Set(gems).size;

        if (count === 0) return false;

        // Rule: Take 3 different gems
        if (count === 3) {
            return uniqueCount === 3 && gems.every(type => bank[type] >= 1);
        }
        // Rule: Take 2 identical gems
        if (count === 2 && uniqueCount === 1) {
            const type = gems[0];
            // Check *original* bank count needed
            return bank[type] >= MIN_GEMS_FOR_TAKE_TWO;
        }
        // Rule: Take 1 gem (implicitly allowed if others fail, but explicit check is just >= 1)
        // **NOTE:** The official rule is choose ONE action. Taking 1 gem is usually suboptimal
        // if taking 2 identical or 3 different is possible. This logic *allows* taking 1.
        // A stricter implementation might disallow taking 1 if other options exist.
        if (count === 1) {
             return bank[gems[0]] >= 1;
        }

        // Rule: Taking 2 different gems (Added for completion, although not a primary action choice in rules usually)
        // Some interpretations allow this if 3 different isn't possible. Let's allow it.
        if (count === 2 && uniqueCount === 2) {
             return gems.every(type => bank[type] >= 1);
        }


        return false; // Invalid selection count or combination
    }

    function performTakeGems() {
        if (!validateTakeGemsSelection()) {
            updateLog("Invalid gem selection cannot be confirmed.");
            // Don't clear selection, let user fix it or cancel
            return;
        }
        const player = players[currentPlayerIndex];
        const gemsTaken = {};
        // Update state immediately
        selectedGemTypes.forEach(type => {
            if (bank[type] > 0) {
                bank[type]--;
                player.gems[type]++;
                gemsTaken[type] = (gemsTaken[type] || 0) + 1;
            } else {
                console.error(`CRITICAL ERROR: Tried to take ${type} but bank count is ${bank[type]}`);
                 // Potential rollback logic here if needed
                 return; // Abort on error
            }
        });

        const gemString = Object.entries(gemsTaken).map(([t, c]) => `${c} ${t}`).join(', ');
        updateLog(`Player ${player.name} took ${gemString}.`);

        // Clear action state *after* performing action
        const performedActionType = 'TAKE_GEMS'; // For endTurn logic
        clearActionState();

        // Render immediate changes
        renderBank();
        renderPlayerArea(player.id); // Update player gems display

        // Proceed to end-of-turn checks
        endTurn(performedActionType);
    }

    function performReserveCard() {
        if (!selectedCard || (selectedCard.type !== 'visible' && selectedCard.type !== 'deck')) {
            updateLog("No valid card or deck selected to reserve."); return;
        }
        const player = players[currentPlayerIndex];
        if (player.reservedCards.length >= MAX_RESERVED_CARDS) {
            updateLog("Cannot reserve, reservation limit reached (max 3)."); return;
        }

        let reservedCardData = null;
        let cardSourceDescription = "";
        const level = selectedCard.level;
        let cardReplaced = false; // Did we replace a visible card?

        // --- Get the card ---
        if (selectedCard.type === 'deck') {
            if (decks[level].length > 0) {
                reservedCardData = decks[level].pop();
                cardSourceDescription = `from L${level} deck`;
            } else {
                updateLog(`Deck L${level} is empty, cannot reserve.`); clearActionState(); renderCards(); updateClickableState(); return;
            }
        } else { // Visible card
            const cardId = selectedCard.id;
            const cardIndex = visibleCards[level].findIndex(c => c && c.id === cardId);
            if (cardIndex !== -1 && visibleCards[level][cardIndex]) {
                reservedCardData = visibleCards[level][cardIndex];
                cardSourceDescription = `L${level} ${reservedCardData.color} from board`;
                // Replace the card on the board immediately
                drawCard(level, cardIndex); // Helper handles drawing or setting null
                cardReplaced = true;
            } else {
                updateLog("Selected card is no longer available."); clearActionState(); renderCards(); updateClickableState(); return;
            }
        }

        // --- Update Player State ---
        player.reservedCards.push(reservedCardData);
        let gotGold = false;
        if (bank[GOLD] > 0) {
            player.gems[GOLD]++;
            bank[GOLD]--;
            gotGold = true;
        }

        updateLog(`Player ${player.name} reserved ${cardSourceDescription}${gotGold ? " and took 1 gold." : "."}`);

        // Clear action state *after* performing action
        const performedActionType = 'RESERVE';
        clearActionState();

        // Render immediate changes
        if (gotGold) renderBank();
        if (cardReplaced) renderCards(); // Render if visible cards changed
        else renderDeckCount(level); // Just update deck count if deck was source
        renderPlayerArea(player.id); // Update reserved cards display & gems

        // Proceed to end-of-turn checks
        endTurn(performedActionType);
    }


    function performPurchaseCard() {
         if (!selectedCard || (selectedCard.type !== 'visible' && selectedCard.type !== 'reserved')) {
            updateLog("No valid card selected to purchase."); return;
        }
        const player = players[currentPlayerIndex];
        const cardId = selectedCard.id;
        let purchasedCardData = null;
        let cardSource = selectedCard.type;
        let cardIndex = -1; // Index in visible/reserved array

        // --- Find Card Data ---
        if (cardSource === 'visible') {
            cardIndex = visibleCards[selectedCard.level].findIndex(c => c && c.id === cardId);
            if (cardIndex !== -1) purchasedCardData = visibleCards[selectedCard.level][cardIndex];
        } else { // Reserved
            cardIndex = player.reservedCards.findIndex(c => c.id === cardId);
            if (cardIndex !== -1) purchasedCardData = player.reservedCards[cardIndex];
        }

        if (!purchasedCardData) {
            updateLog("Selected card not found for purchase."); clearActionState(); updateClickableState(); return;
        }

        // --- Check Affordability ---
        const { canAfford, goldNeeded, effectiveCost } = canAffordCard(player, purchasedCardData);
        if (!canAfford) {
            updateLog(`Cannot afford card L${purchasedCardData.level} ${purchasedCardData.color}. Need ${goldNeeded} gold.`);
            // Don't clear selection, allow user to see why
            return;
        }

        // --- Process Payment ---
        let goldSpent = 0;
        GEM_TYPES.forEach(gemType => {
            const cost = effectiveCost[gemType];
            const playerHas = player.gems[gemType];
            const fromPlayerGems = Math.min(cost, playerHas); // Gems paid from player's regular stack
            const needsGold = cost - fromPlayerGems; // Remainder needed from gold

            if (fromPlayerGems > 0) {
                player.gems[gemType] -= fromPlayerGems;
                bank[gemType] += fromPlayerGems;
            }
            if (needsGold > 0) {
                 if (player.gems[GOLD] >= needsGold) {
                     player.gems[GOLD] -= needsGold;
                     bank[GOLD] += needsGold;
                     goldSpent += needsGold;
                 } else {
                     // This should be caught by canAfford, but is a safety check
                     console.error("CRITICAL: Payment gold mismatch despite canAfford check!");
                     updateLog("Error during payment. Please try again or report bug.");
                     // Ideally, rollback payment state here if complex
                     return; // Abort purchase
                 }
            }
        });

        // --- Update Player State (Card Acquisition) ---
        player.cards.push(purchasedCardData);
        player.score += purchasedCardData.vp;
        player.bonuses[purchasedCardData.color]++;
        updateLog(`Player ${player.name} purchased L${purchasedCardData.level} ${purchasedCardData.color} (used ${goldSpent} gold).`);

        // --- Remove Card from Source ---
        let cardReplaced = false;
        if (cardSource === 'visible') {
            drawCard(purchasedCardData.level, cardIndex); // Replace card on board
            cardReplaced = true;
        } else { // Reserved
            player.reservedCards.splice(cardIndex, 1);
        }

        // Clear action state *after* performing action
        const performedActionType = 'PURCHASE';
        clearActionState();

        // Render immediate changes
        renderBank(); // Show returned gems
        if (cardReplaced) renderCards(); // Update visible cards / deck counts
        renderPlayerArea(player.id); // Update player score, bonuses, gems, cards, reserved

        // Proceed to end-of-turn checks
        endTurn(performedActionType);
    }


    // ========================================================================
    // TURN MANAGEMENT & END-OF-TURN SEQUENCE
    // ========================================================================

    function startTurn() {
        highlightActivePlayer();
        clearActionState(); // Clears selections, updates UI (renderSelectionInfo, updateClickableState)
        startTimer();
        // End turn button state is handled by clearActionState -> updateClickableState
    }

    function endTurn(actionType) { // actionType is e.g., 'TAKE_GEMS', 'RESERVE', 'PURCHASE', 'EARLY_END', 'TIMEOUT'
        console.log(`Ending turn for Player ${currentPlayerIndex}. Action: ${actionType}`);
        stopTimer(); // Stop timer for end-of-turn checks

        const player = players[currentPlayerIndex];

        // --- End of Turn Sequence (Rulebook Order) ---
        // 1. Check for Noble Visits (based on BONUSES)
        checkForNobleVisit(player, () => { // Pass a callback for the next step

            // 2. Check Gem Limit (must return excess over 10)
            checkForGemLimit(player, () => { // Pass a callback for the next step

                // 3. Check for Game End Condition (>= 15 VP)
                const gameEndTriggeredThisTurn = checkForGameOver(player);

                // 4. Determine if Game Actually Ends Now
                if (isGameOver && currentPlayerIndex === lastRoundPlayerIndex) {
                    // This was the *last* player's turn in the final round
                    endGame();
                    return; // Stop the turn cycle
                }

                 // If game over was triggered, but it's not the last player yet, log continues
                 if (isGameOver) {
                      console.log(`Final round continues. Current: ${currentPlayerIndex}, Ends after: ${lastRoundPlayerIndex}`);
                 }

                // 5. Advance to Next Player
                currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
                if (currentPlayerIndex === 0 && !isGameOver) {
                    turnNumber++; // Increment turn number after a full cycle if game isn't over
                    console.log(`Starting Turn ${turnNumber}`);
                }

                // 6. Log and Start Next Turn
                updateLog(`Player ${players[currentPlayerIndex].name}'s turn.`);
                startTurn();
            });
        });
    }

    function checkForNobleVisit(player, callback) {
        const eligibleNobles = availableNobles.filter(noble =>
             GEM_TYPES.every(gemType => (player.bonuses[gemType] || 0) >= (noble.requirements[gemType] || 0))
        );

        if (eligibleNobles.length === 0) {
            if (callback) callback(); // No visit, proceed
        } else if (eligibleNobles.length === 1) {
            awardNoble(player, eligibleNobles[0]);
            renderNobles(); // Update noble display immediately
            renderPlayerArea(player.id); // Update player display immediately
            if (callback) callback(); // Proceed after awarding
        } else {
            // Multiple eligible nobles, player must choose
            updateLog(`Player ${player.name} qualifies for multiple nobles. Choose one.`);
            showNobleChoiceOverlay(player, eligibleNobles, callback); // Show choice overlay, callback proceeds after choice
        }
    }
    // showNobleChoiceOverlay & handleNobleChoice remain the same - they call awardNoble and then the callback.
    function showNobleChoiceOverlay(player, eligibleNobles, callback) {
        nobleChoiceOptionsContainer.innerHTML = '';
        eligibleNobles.forEach(nobleData => {
            const nobleEl = createNobleElement(nobleData); nobleEl.classList.add('clickable');
            nobleEl.onclick = () => handleNobleChoice(player, nobleData, callback); // Assign click handler
            nobleChoiceOptionsContainer.appendChild(nobleEl);
        });
        nobleChoiceOverlay.classList.remove('hidden');
    }
    function handleNobleChoice(player, chosenNoble, callback) {
        nobleChoiceOverlay.classList.add('hidden'); // Hide immediately
        if(availableNobles.some(n => n.id === chosenNoble.id)) {
             awardNoble(player, chosenNoble);
             renderNobles(); // Update display after awarding
             renderPlayerArea(player.id);
        } else {
             console.warn(`Chosen noble ${chosenNoble.id} no longer available?`);
             updateLog("Selected noble was no longer available.");
        }
        if (callback) callback(); // Proceed regardless of whether award was successful
    }

    function awardNoble(player, nobleData) {
        updateLog(`Noble ${nobleData.id} visits Player ${player.name} (+${nobleData.vp} VP).`);
        player.nobles.push(nobleData); player.score += nobleData.vp;
        availableNobles = availableNobles.filter(n => n.id !== nobleData.id);
        // Rendering handled by caller (checkForNobleVisit or handleNobleChoice)
    }

    function checkForGemLimit(player, callback) {
        const totalGems = GEM_TYPES.reduce((sum, type) => sum + player.gems[type], 0) + player.gems[GOLD]; // Include gold for count
        const nonGoldGems = totalGems - player.gems[GOLD];

        if (totalGems > MAX_GEMS_PLAYER) {
            const gemsToReturnCount = totalGems - MAX_GEMS_PLAYER;
            updateLog(`Player ${player.name} has ${totalGems} tokens, must return ${gemsToReturnCount}.`);
            showReturnGemsOverlay(player, totalGems, gemsToReturnCount, callback); // Show overlay
         } else {
            if (callback) callback(); // No return needed, proceed
         }
    }
    // showReturnGemsOverlay & toggleReturnGemSelection remain similar, but pass gemsToReturnCount
    function showReturnGemsOverlay(player, currentTotalGems, gemsToReturnCount, callback) {
         returnGemsCountSpan.textContent = `${currentTotalGems}/${MAX_GEMS_PLAYER}`;
         returnGemsPlayerDisplay.innerHTML = '';
         let gemsAvailableToReturn = []; // Track selectable gems { type, element }

         // Display player's non-gold gems for selection
         GEM_TYPES.forEach(gemType => {
             for (let i = 0; i < player.gems[gemType]; i++) {
                const gemEl = createGemElement(gemType, 1, false); gemEl.classList.add('clickable');
                gemEl.dataset.returnGemType = gemType;
                gemEl.onclick = () => toggleReturnGemSelection(gemEl, gemsToReturnCount); // Pass count needed
                returnGemsPlayerDisplay.appendChild(gemEl);
                gemsAvailableToReturn.push({ type: gemType, element: gemEl });
            }
        });
        // Display gold, but not selectable
        if (player.gems.gold > 0) {
            const goldEl = createGemElement(GOLD, player.gems.gold, true); goldEl.classList.add('not-selectable'); goldEl.style.marginLeft = '10px';
            returnGemsPlayerDisplay.appendChild(goldEl);
        }

        confirmReturnGemsBtn.disabled = true;
        returnGemsSelectionDisplay.textContent = `Selected to return: 0/${gemsToReturnCount}`;
        confirmReturnGemsBtn.onclick = () => handleConfirmReturnGems(player, gemsToReturnCount, callback);
        returnGemsOverlay.classList.remove('hidden');
    }

    function toggleReturnGemSelection(gemEl, gemsToReturnCount) {
        gemEl.classList.toggle('selected'); // Toggle visual state

        // Count currently selected gems in the overlay
        const selectedElements = returnGemsPlayerDisplay.querySelectorAll('.gem.selected');
        const selectedCount = selectedElements.length;

        returnGemsSelectionDisplay.textContent = `Selected to return: ${selectedCount}/${gemsToReturnCount}`;
        confirmReturnGemsBtn.disabled = selectedCount !== gemsToReturnCount; // Enable only when exact count selected
    }

     function handleConfirmReturnGems(player, gemsToReturnCount, callback) {
        const selectedElements = returnGemsPlayerDisplay.querySelectorAll('.gem.selected');
        if (selectedElements.length !== gemsToReturnCount) return; // Should be disabled, but safe check

        const returnedCounts = {};
        selectedElements.forEach(gemEl => {
            const type = gemEl.dataset.returnGemType;
            if (player.gems[type] > 0) {
                player.gems[type]--;
                bank[type]++;
                returnedCounts[type] = (returnedCounts[type] || 0) + 1;
            } else { console.error(`Error returning ${type}, player count was 0?`); }
        });

        const returnString = Object.entries(returnedCounts).map(([type, count]) => `${count} ${type}`).join(', ');
        updateLog(`Player ${player.name} returned ${returnString}.`);

        returnGemsOverlay.classList.add('hidden');
        renderBank(); // Update bank display
        renderPlayerArea(player.id); // Update player display

        if (callback) callback(); // Proceed
    }

    function checkForGameOver(player) {
        if (!isGameOver && player.score >= WINNING_SCORE) {
            isGameOver = true;
            // Last player is the one *before* the current player
            lastRoundPlayerIndex = (currentPlayerIndex + players.length - 1) % players.length;
            updateLog(`--- Player ${player.name} reached ${player.score} VP! Final round begins. ---`);
            console.log(`Game end triggered. Current player: ${currentPlayerIndex}. Last turn for player: ${lastRoundPlayerIndex}.`);
            return true; // Signify that the condition was met this turn
         }
         return false; // Game continues normally
    }

    function endGame() {
        console.log("GAME OVER - Calculating winner...");
        updateLog("--- GAME OVER ---");
        isGameOver = true; // Ensure flag is set
        stopTimer();
        hideOverlays();
        clearActionState(); // Clear any selections

        // Determine Winner (Highest score, fewest cards tiebreaker)
        let highestScore = -1; players.forEach(p => highestScore = Math.max(highestScore, p.score));
        let potentialWinners = players.filter(p => p.score === highestScore);
        let winners = [];
        if (potentialWinners.length === 1) {
            winners = potentialWinners;
        } else {
            let minCards = Infinity; potentialWinners.forEach(p => minCards = Math.min(minCards, p.cards.length));
            winners = potentialWinners.filter(p => p.cards.length === minCards);
        }

        // Display Scores
        finalScoresDiv.innerHTML = '';
        const sortedPlayers = [...players].sort((a, b) => (b.score !== a.score) ? b.score - a.score : a.cards.length - b.cards.length);
        sortedPlayers.forEach(p => {
            const scoreP = document.createElement('p');
            const isWinner = winners.some(w => w.id === p.id);
            scoreP.textContent = `${p.name}: ${p.score} VP (${p.cards.length} cards)`;
            if (isWinner) scoreP.classList.add('winner'); scoreP.textContent = (isWinner ? '🏆 ' : '') + scoreP.textContent + (isWinner ? ' - Winner!' : '');
            finalScoresDiv.appendChild(scoreP);
        });
        if (winners.length > 1) { finalScoresDiv.innerHTML += `<p style="font-weight:bold; margin-top:10px;">Tie between: ${winners.map(w=>w.name).join(' & ')}!</p>`; updateLog(`Game ended in a tie!`); }
        else if (winners.length === 1) updateLog(`Winner: ${winners[0].name} with ${winners[0].score} VP!`);

        // Disable interactions
        updateClickableState(); // Should disable everything due to isGameOver
        gameOverOverlay.classList.remove('hidden'); // Show overlay
    }

    // ========================================================================
    // HELPER & UTILITY FUNCTIONS
    // ========================================================================

    function clearActionState() {
        // Clear gem selection visuals
        gemBankContainer.querySelectorAll('.gem.selected').forEach(el => el.classList.remove('selected'));
        selectedGemTypes = [];

        // Clear card selection visuals
        if (selectedCard && selectedCard.element) {
            selectedCard.element.classList.remove('selected');
        }
        selectedCard = null;

        // Reset action type
        currentAction = null;

        // Update UI elements that depend on the cleared state
        renderSelectionInfo(); // Hides dynamic buttons, updates selection text, shows/hides cancel
        updateClickableState(); // Re-enables clickable elements and manages End Turn button state
    }

    function cancelAction() {
        updateLog("Action cancelled.");
        clearActionState(); // Clears selection and updates UI
    }

    function handleEndTurnEarly() {
        // Validate if turn can be ended (no action in progress)
        if (currentAction) {
            updateLog("Cannot end turn while an action is in progress. Cancel first.");
            return;
        }
        if (isGameOver) {
            updateLog("Game is already over.");
            return;
        }
         if (isOverlayVisible()) {
             updateLog("Cannot end turn while resolving overlay.");
             return;
         }

        updateLog(`Player ${players[currentPlayerIndex].name} passed the turn.`);
        // No game state changes, just proceed to end turn sequence
        endTurn('EARLY_END');
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
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
        // Check reserved cards
        for (const p of players) {
            const card = p.reservedCards?.find(c => c && c.id === id);
            if (card) return card;
        }
        // Check purchased cards (less likely needed for lookup, but possible)
        // for (const p of players) {
        //     const card = p.cards?.find(c => c && c.id === id);
        //     if (card) return card;
        // }
        return null; // Not found in visible or reserved
    }
    // Helper to get placeholder data for deck selection display
    function getDeckCardPlaceholder(level) {
         return { level, color: 'deck', cost: {}, vp: 0, id: null }; // Placeholder data
    }


    function canAffordCard(player, cardData) {
        if (!cardData || !cardData.cost) return { canAfford: false, goldNeeded: 0, effectiveCost: {} };
        let goldNeeded = 0;
        const effectiveCost = {}; // Cost after applying bonuses

        GEM_TYPES.forEach(gemType => {
            const cardCost = cardData.cost[gemType] || 0;
            const playerBonus = player.bonuses[gemType] || 0;
            const costAfterBonus = Math.max(0, cardCost - playerBonus);
            effectiveCost[gemType] = costAfterBonus;

            if (player.gems[gemType] < costAfterBonus) {
                goldNeeded += costAfterBonus - player.gems[gemType];
            }
        });

        const canAfford = player.gems.gold >= goldNeeded;
        return { canAfford, goldNeeded, effectiveCost };
    }

     // Draws card for a given level/index, returns the card data drawn (or null)
     function drawCard(level, index) {
        if (decks[level].length > 0) {
            visibleCards[level][index] = decks[level].pop();
        } else {
            visibleCards[level][index] = null; // Deck empty
        }
        renderDeckCount(level); // Update count display
        return visibleCards[level][index];
    }
     // Helper to just update deck count display
     function renderDeckCount(level) {
         if (deckCounts[level]) {
             deckCounts[level].textContent = decks[level].length;
             deckElements[level].classList.toggle('empty', decks[level].length === 0);
         }
     }

     function updateClickableState() {
        const player = players[currentPlayerIndex]; // Attempt to get the current player

        // --- GUARD CLAUSE ---
        const disableAll = isGameOver || isOverlayVisible() || !player;

        if (disableAll) {
            // Make everything non-selectable and clear styles
            document.querySelectorAll('.gem, .card:not(.empty-slot), .deck, .reserved-card-small').forEach(el => {
                el.classList.add('not-selectable');
                el.classList.remove('not-affordable', 'selected');
            });
            gemBankContainer.querySelectorAll('.gem.selected').forEach(el => el.classList.remove('selected'));

            // Clear dynamic buttons and hide Cancel
            dynamicActionButtonsContainer.innerHTML = '';
            cancelActionBtn.classList.add('hidden');
            endTurnEarlyBtn.disabled = true; // Disable end turn
            endTurnEarlyBtn.classList.remove('hidden'); // Ensure it's visible but disabled

            return; // Exit early
        }
        // --- END GUARD CLAUSE ---

        // Player is valid, game active, no overlay. Proceed with specific logic.
        const disableDueToAction = !!currentAction; // Is *any* action selected?

        // --- Gems ---
        gemBankContainer.querySelectorAll('.gem').forEach(gemEl => {
            const gemType = gemEl.dataset.gemType;
            const isGold = gemType === GOLD;
            let disable = isGold || bank[gemType] === 0; // Basic disabling

            if (!disable) {
                if (currentAction === 'SELECTING_CARD') disable = true; // Cannot take gems if card selected
                else if (currentAction === 'SELECTING_GEMS') {
                    // Logic for disabling gems based on current gem selection rules
                    const isSelected = gemEl.classList.contains('selected');
                    if (!isSelected) { // Only check rules if trying to ADD this gem
                        const selectionCount = selectedGemTypes.length;
                        const typeCount = countOccurrences(selectedGemTypes, gemType);
                        const uniqueTypesCount = new Set(selectedGemTypes).size;
                        if (selectionCount >= 3) disable = true;
                        else if (typeCount === 1 && bank[gemType] < MIN_GEMS_FOR_TAKE_TWO) disable = true;
                        else if (typeCount === 1 && selectionCount > 1) disable = true;
                        else if (selectionCount === 2 && uniqueTypesCount === 1) disable = true;
                        else if (selectionCount === 2 && uniqueTypesCount === 2 && countOccurrences(selectedGemTypes, gemType) >= 1) disable = true;
                    }
                }
            }
            gemEl.classList.toggle('not-selectable', disable);
        });

        // --- Cards & Decks ---
        document.querySelectorAll('#cards-area .card:not(.empty-slot), #cards-area .deck').forEach(el => {
            let disable = false;
            const isDeck = el.classList.contains('deck');
            const isCard = el.classList.contains('card');

            if (currentAction === 'SELECTING_GEMS') disable = true;
            else if (currentAction === 'SELECTING_CARD' && selectedCard?.element !== el) disable = true;
            else {
                if (isDeck) {
                    const level = parseInt(el.id.split('-')[1], 10);
                    if (el.classList.contains('empty')) disable = true;
                    // Disable reserving deck if hand is full (only when no card is selected)
                    else if (!currentAction && player.reservedCards.length >= MAX_RESERVED_CARDS) disable = true;
                } else if (isCard) {
                    const cardData = getCardById(el.dataset.cardId);
                    const canReserve = player.reservedCards.length < MAX_RESERVED_CARDS;
                    const { canAfford } = canAffordCard(player, cardData);
                    // Disable clicking card if cannot afford AND cannot reserve (only when no card is selected)
                    if (!currentAction && !canAfford && !canReserve) disable = true;
                }
            }
            el.classList.toggle('not-selectable', disable);

            // Affordability styling for visible cards
            if (isCard) {
                const cardData = getCardById(el.dataset.cardId);
                el.classList.toggle('not-affordable', !disable && cardData && !canAffordCard(player, cardData).canAfford);
            }
        });

         // --- Reserved Cards ---
        document.querySelectorAll('.player-area .reserved-card-small').forEach(cardEl => {
            let disable = true;
            const playerArea = cardEl.closest('.player-area');

            if (playerArea && playerArea.id === `player-area-${player.id}`) { // Is it current player's?
                 if (currentAction === 'SELECTING_GEMS') disable = true;
                 else if (currentAction === 'SELECTING_CARD' && selectedCard?.element !== cardEl) disable = true;
                 else disable = false; // Enable current player's reserved card
            }
            cardEl.classList.toggle('not-selectable', disable);

            // Affordability styling for *current player's* reserved cards (only if clickable)
            if (!disable) {
                const cardData = player.reservedCards?.find(c => c.id === cardEl.dataset.cardId);
                 cardEl.classList.toggle('not-affordable', cardData && !canAffordCard(player, cardData).canAfford);
            } else {
                 cardEl.classList.remove('not-affordable');
            }
        });

        // --- End Turn Early Button ---
        // Disable if an action is in progress OR if globally disabled (already handled by guard clause)
        endTurnEarlyBtn.disabled = disableDueToAction;
        endTurnEarlyBtn.classList.remove('hidden'); // Ensure it's always visible unless game over/overlay

    } // End updateClickableState

    function highlightActivePlayer() {
        document.querySelectorAll('.player-area.active-player').forEach(el => el.classList.remove('active-player'));
        const activePlayerEl = document.getElementById(`player-area-${currentPlayerIndex}`);
        if (activePlayerEl) activePlayerEl.classList.add('active-player');
    }

    function startTimer() {
        stopTimer();
        if (gameSettings.timerMinutes <= 0) { renderTimer(); return; }
        turnTimeRemaining = turnDuration; renderTimer();
        turnTimerInterval = setInterval(() => {
            turnTimeRemaining--; renderTimer();
            if (turnTimeRemaining < 0) {
                updateLog(`Player ${players[currentPlayerIndex].name}'s turn timed out.`);
                clearActionState(); // Cancel any pending action on timeout
                endTurn('TIMEOUT'); // Force end turn
            }
        }, 1000);
    }
    function stopTimer() { clearInterval(turnTimerInterval); turnTimerInterval = null; renderTimer(); /* Update display */ }

    function updateLog(message) {
        const p = document.createElement('p');
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        p.textContent = `[${timestamp}] ${message}`;
        logMessagesDiv.appendChild(p);
        logMessagesDiv.scrollTop = logMessagesDiv.scrollHeight; // Auto-scroll
    }

    function hideOverlays() { returnGemsOverlay.classList.add('hidden'); gameOverOverlay.classList.add('hidden'); nobleChoiceOverlay.classList.add('hidden'); }
    function isOverlayVisible() { return !returnGemsOverlay.classList.contains('hidden') || !gameOverOverlay.classList.contains('hidden') || !nobleChoiceOverlay.classList.contains('hidden'); }

    // ========================================================================
    // INITIAL SCRIPT EXECUTION
    // ========================================================================
    document.body.style.alignItems = 'center'; document.body.style.justifyContent = 'center'; // Center setup screen initially
    setupPlayerNameInputs();
    setupEventListeners();

}); // End DOMContentLoaded
// --- END OF FILE script.js ---