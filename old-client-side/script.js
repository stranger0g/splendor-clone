document.addEventListener('DOMContentLoaded', () => {

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
    let currentAction = null;
    const MAX_GEMS_PLAYER = 10;
    const MAX_RESERVED_CARDS = 3;
    const CARDS_PER_LEVEL_VISIBLE = 4;
    const WINNING_SCORE = 15;
    const TIMER_LOW_THRESHOLD = 10;
    const MIN_GEMS_FOR_TAKE_TWO = 4;
    const PLAYER_COLORS = ['player-color-1', 'player-color-2', 'player-color-3', 'player-color-4'];
    const THEME_COLOR_NAMES = { 'player-color-1': 'Red', 'player-color-2': 'Blue', 'player-color-3': 'Green', 'player-color-4': 'Yellow' };




    function initGame(playerData) {

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


        playerData.forEach((pData, i) => {
            players.push({
                id: i,
                name: pData.name,
                colorTheme: pData.colorTheme,
                gems: { white: 0, blue: 0, green: 0, red: 0, black: 0, gold: 0 },
                cards: [],
                reservedCards: [],
                nobles: [],
                score: 0,
                bonuses: { white: 0, blue: 0, green: 0, red: 0, black: 0 },

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
                    selfSufficientPurchases: 0,
                    firstCardPurchasedTurn: { 1: null, 2: null, 3: null },
                    cardsReservedTotalCount: 0,
                    allReservedCardsData: [],
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
                    noblesAcquiredTurn: {},
                    reserveActions: 0,
                    purchaseActions: 0,
                    gemTakeActions: 0,
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

        updateLog("Game started with " + playerData.map(p => p.name).join(', '));
        updateLog(`Player ${players[0].name}'s turn.`);


        setupScreen.classList.remove('active');
        setupScreen.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        gameContainer.classList.add('active');
        document.body.style.alignItems = 'flex-start';
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
                const themeName = getThemeColorName(colorClass);
                option.textContent = `Theme ${index + 1} (${themeName})`;
                option.selected = (i === index);
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
            turnDuration = gameSettings.timerMinutes * 60;

            const playerData = [];
            for (let i = 0; i < gameSettings.playerCount; i++) {
                const nameInput = document.getElementById(`player-name-${i}`);
                const colorSelect = document.getElementById(`player-color-${i}`);
                playerData.push({
                    name: nameInput.value.trim() || `Player ${i + 1}`,
                    colorTheme: colorSelect.value
                });
            }
            initGame(playerData);
        });


        deckElements[1].addEventListener('click', () => handleDeckClick(1));
        deckElements[2].addEventListener('click', () => handleDeckClick(2));
        deckElements[3].addEventListener('click', () => handleDeckClick(3));


        endTurnEarlyBtn.addEventListener('click', handleEndTurnEarly);


        playAgainBtn.addEventListener('click', () => {
            gameOverOverlay.classList.add('hidden');
            setupScreen.classList.remove('hidden');
            setupScreen.classList.add('active');
            gameContainer.classList.remove('active');
            gameContainer.classList.add('hidden');
            document.body.style.alignItems = 'center';
            document.body.style.justifyContent = 'center';
            setupPlayerNameInputs();
            isGameOverConditionMet = false;
            gameTrulyFinished = false;
        });
    }




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

    function handleGemClickWrapper(event) {
        const gemEl = event.currentTarget;
        const gemType = gemEl.dataset.gemType;


        if (!gemEl.classList.contains('not-selectable')) {
            handleGemClick(gemType, gemEl);
        } else {
            console.log(`Click ignored on ${gemType} because it's not-selectable.`);
        }
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
            deckElements[level].classList.remove('selected');
        }
        updateClickableState();
    }

    function handleVisibleCardClickWrapper(event) {
        const cardEl = event.currentTarget;

        if (cardEl.classList.contains('not-selectable')) return;
        const cardId = cardEl.dataset.cardId;
        const level = parseInt(cardEl.dataset.level, 10);
        if (cardId && !isNaN(level)) {
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


            playerEl.querySelectorAll('.reserved-card-small').forEach(cardEl => {
                const cardId = cardEl.dataset.cardId;
                if (cardId) {
                    cardEl.removeEventListener('click', handleReservedCardClickWrapper);
                    cardEl.addEventListener('click', handleReservedCardClickWrapper);
                }
            });
        });
        highlightActivePlayer();
        updateClickableState();
    }

    function handleReservedCardClickWrapper(event) {
        const cardEl = event.currentTarget;

        if (cardEl.classList.contains('not-selectable')) return;
        const cardId = cardEl.dataset.cardId;
        if (cardId) {
            handleReservedCardClick(cardId, cardEl);
        }
    }

    // Corrected createPlayerAreaElement
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
        gemsHeader.textContent = 'Tokens'; // Changed header for clarity
        const gemsContainer = document.createElement('div');
        gemsContainer.classList.add('gems-container', 'small-gems');
        let totalNonGoldGems = 0;
        GEM_TYPES.forEach(gemType => {
            const count = player.gems[gemType];
            totalNonGoldGems += count;
            if (count > 0) {
                const gemEl = createGemElement(gemType, count, true);
                gemEl.title = `${count} ${gemType}`;
                gemsContainer.appendChild(gemEl);
            }
        });
        if (player.gems[GOLD] > 0) {
            const goldEl = createGemElement(GOLD, player.gems[GOLD], true);
            goldEl.title = `${player.gems[GOLD]} gold (joker)`;
            gemsContainer.appendChild(goldEl);
        }

        // --- Corrected Total Gems Display ---
        const totalGemsSpan = document.createElement('span');
        totalGemsSpan.classList.add('total-gems-indicator');

        // Calculate total gems correctly
        const goldCount = player.gems[GOLD] || 0;
        const totalGems = totalNonGoldGems + goldCount;

        // Update display to show TOTAL vs limit
        totalGemsSpan.textContent = `Total: ${totalGems} / ${MAX_GEMS_PLAYER}`;
        totalGemsSpan.title = `${totalNonGoldGems} regular gems + ${goldCount} gold = ${totalGems} total`; // Add breakdown in title

        // Highlight if the TOTAL exceeds the limit
        if (totalGems > MAX_GEMS_PLAYER) {
             totalGemsSpan.style.color = 'var(--text-error)';
             totalGemsSpan.style.fontWeight = 'bold';
        } else {
            totalGemsSpan.style.color = 'inherit'; // Use default text color
            totalGemsSpan.style.fontWeight = 'normal'; // Use default font weight
        }
        gemsContainer.appendChild(totalGemsSpan); // Add the updated span
        // --- End Corrected Total Gems Display ---


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
        if (!hasBonuses) {
            bonusContainer.textContent = 'None';
            bonusContainer.style.cssText = 'font-size: 0.9em; color: var(--text-tertiary); text-align: center;';
        }


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
            playerNoblesContainer.textContent = 'None';
            playerNoblesContainer.style.cssText = 'font-size: 0.9em; color: var(--text-tertiary); text-align: center;';
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


    function renderPlayerArea(playerId) {
        const player = players.find(p => p.id === playerId);
        const playerAreaEl = document.getElementById(`player-area-${playerId}`);
        if (player && playerAreaEl) {

            const tempDiv = createPlayerAreaElement(player);
            playerAreaEl.innerHTML = tempDiv.innerHTML;


            playerAreaEl.querySelectorAll('.reserved-card-small').forEach(cardEl => {
                const cardId = cardEl.dataset.cardId;
                if (cardId) {
                    cardEl.removeEventListener('click', handleReservedCardClickWrapper);
                    cardEl.addEventListener('click', handleReservedCardClickWrapper);
                }
            });
            highlightActivePlayer();
            updateClickableState();
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
            timerDisplay.classList.remove('timer-low');
        }
    }



    function renderSelectionInfo() {
        dynamicActionButtonsContainer.innerHTML = '';
        const existingPreview = selectionInfoDiv.querySelector('.card-preview-container');
        if (existingPreview) existingPreview.remove();
        selectionInfoDiv.querySelectorAll('.selection-text').forEach(p => p.style.display = 'block');


        if (currentAction === 'SELECTING_GEMS' && selectedGemTypes.length > 0) {
            selectedGemsDisplay.innerHTML = '';
            selectedGemTypes.forEach(type => {
                selectedGemsDisplay.appendChild(createGemElement(type, 1, false));
            });

            const btn = document.createElement('button');
            btn.textContent = 'Confirm Take Tokens'; // Changed text
            btn.onclick = performTakeGems;
            const isValid = validateTakeGemsSelection();
            console.log(`[renderSelectionInfo] Take Gems Button Check: isValid=${isValid}`);
            btn.disabled = !isValid;
            dynamicActionButtonsContainer.appendChild(btn);
            if (isValid) btn.classList.add('action-possible');
        } else {
            selectedGemsDisplay.textContent = 'None';
        }


        if (currentAction === 'SELECTING_CARD' && selectedCard) {
             const cardData = selectedCard.id ? (getCardById(selectedCard.id) ?? getDeckCardPlaceholder(selectedCard.level)) : null;
             let cardText = 'Invalid Selection';
             if (cardData) {
                 if (selectedCard.type === 'visible') cardText = `Board L${cardData.level} (${cardData.color})`;
                 else if (selectedCard.type === 'reserved') cardText = `Reserved L${cardData.level} (${cardData.color})`;
                 else if (selectedCard.type === 'deck') cardText = `Deck L${cardData.level}`;
                 else cardText = `Unknown Card Type`;
             }


             if (cardData && (selectedCard.type === 'visible' || selectedCard.type === 'reserved') && cardData.id) {
                 selectionInfoDiv.querySelectorAll('.selection-text').forEach(p => p.style.display = 'none');
                 const previewContainer = document.createElement('div');
                 previewContainer.classList.add('card-preview-container');
                 const previewCardEl = createCardElement(cardData, cardData.level);
                 previewCardEl.classList.add('card-preview');
                 previewContainer.appendChild(previewCardEl);
                 selectionInfoDiv.insertBefore(previewContainer, dynamicActionButtonsContainer);
             } else {
                 selectedCardDisplay.textContent = cardText;
             }


             const player = players[currentPlayerIndex];
             if (player && cardData) {
                 const canReserveCheck = player.reservedCards.length < MAX_RESERVED_CARDS;
                 const { canAfford, goldNeeded } = (selectedCard.type === 'visible' || selectedCard.type === 'reserved') && cardData.id
                     ? canAffordCard(player, cardData)
                     : { canAfford: false, goldNeeded: 0 };


                 if ((selectedCard.type === 'visible' || selectedCard.type === 'reserved') && cardData.id) {
                     const purchaseBtn = document.createElement('button');
                     purchaseBtn.textContent = 'Purchase Card';
                     purchaseBtn.onclick = performPurchaseCard;
                     purchaseBtn.disabled = !canAfford;
                     if (canAfford) purchaseBtn.classList.add('action-possible');
                     else purchaseBtn.title = `Cannot afford (need ${goldNeeded} more gold or equivalent gems)`;
                     dynamicActionButtonsContainer.appendChild(purchaseBtn);
                 }


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
             gemEl.classList.add('small-gems');
             gemEl.style.width = '20px';
             gemEl.style.height = '20px';
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

        gemBankContainer.querySelectorAll('.gem.selected').forEach(el => el.classList.remove('selected'));
        selectedGemTypes = [];
        if (currentAction === 'SELECTING_GEMS') {
            currentAction = null;
            renderSelectionInfo();
            updateClickableState();
        }
    }

    function handleGemClick(gemType, clickedGemEl) {

        if (gemType === GOLD) return;


        if (currentAction === 'SELECTING_CARD') {
            clearCardSelectionState();
            currentAction = 'SELECTING_GEMS';
        } else {

             if (currentAction !== 'SELECTING_GEMS') {
                 currentAction = 'SELECTING_GEMS';
             }
        }

        const isSelectedVisual = clickedGemEl.classList.contains('selected');
        const currentSelection = [...selectedGemTypes];
        const currentCount = currentSelection.length;
        const currentUniqueCount = new Set(currentSelection).size;

        console.log(`[handleGemClick V3] Clicked: ${gemType}, isSelectedVisual: ${isSelectedVisual}, currentSelection: [${currentSelection.join(',')}]`);


        // Specific Case: Clicking identical type again when a pair is already selected logically - Clear selection
        if (currentAction === 'SELECTING_GEMS' && currentCount === 2 && currentUniqueCount === 1 && gemType === currentSelection[0]) {
            console.log("[handleGemClick V3] Clicked identical type again with pair selected. Clearing selection.");
            clearGemSelectionState();

            return; // Exit after clearing
        }


        // Specific Case: Clicking the *first* selected gem type again, if allowed to form a pair (Take 2)
        if (currentCount === 1 && gemType === currentSelection[0] && bank[gemType] >= MIN_GEMS_FOR_TAKE_TWO) {

            // Only add the second one if it's not already logically selected
            if (selectedGemTypes.length === 1) {
                console.log("[handleGemClick V3] Applying SELECT 2nd identical (Take 2 Rule)");
                selectedGemTypes.push(gemType);

                // Update visual state - ensure *both* are marked selected
                clickedGemEl.classList.add('selected');
                const otherGemEl = findNonSelectedBankGemElement(gemType, clickedGemEl);
                if (otherGemEl) {
                    console.log(`[handleGemClick V3]   -> Found other element for pairing, adding .selected class.`);
                    otherGemEl.classList.add('selected');
                } else {
                     // Failsafe: if we can't find a *distinct* second element, just mark all as selected
                     const allGemEls = gemBankContainer.querySelectorAll(`.gem[data-gem-type='${gemType}']`);
                     allGemEls.forEach(el => el.classList.add('selected'));
                     console.warn(`[handleGemClick V3]   -> Could not find *non-selected* visual element for Take 2 of ${gemType}. Ensuring all are selected visually.`);
                }
                 console.log(`  -> Added 2nd identical to selectedGemTypes. New: [${selectedGemTypes.join(',')}]`);
            } else {
                console.log(`[handleGemClick V3] Ignored click on ${gemType} - Take 2 already selected logically.`);
            }
        }


        // Regular Deselect: If the clicked element is visually selected
        else if (isSelectedVisual) {
            console.log(`[handleGemClick V3] Trying REGULAR DESELECT ${gemType}`);
            const indexToRemove = selectedGemTypes.lastIndexOf(gemType);
            if (indexToRemove > -1) {
                selectedGemTypes.splice(indexToRemove, 1);
                clickedGemEl.classList.remove('selected');
                console.log(`  -> Removed from selectedGemTypes. New: [${selectedGemTypes.join(',')}]`);

                 // If we just removed one from a pair, visually deselect the other one too
                 const typeCountAfterRemove = countOccurrences(selectedGemTypes, gemType);
                 if (countOccurrences(currentSelection, gemType) === 2 && typeCountAfterRemove === 1) {
                     const otherSelectedEl = gemBankContainer.querySelector(`.gem[data-gem-type='${gemType}'].selected`);
                     if (otherSelectedEl) {
                          otherSelectedEl.classList.remove('selected');
                          console.log(`  -> Visually deselected pair element for ${gemType}`);
                     }
                 }
            }

            // If deselecting makes the selection empty, reset the state fully
            if (selectedGemTypes.length === 0) {
                 console.log(`  -> Selection empty, clearing gem state fully (from deselect).`);
                clearGemSelectionState();
                return; // Exit after clearing
            }
        }


        // Regular Select: If the clicked element is NOT visually selected
        else {
            console.log(`[handleGemClick V3] Trying REGULAR SELECT ${gemType}. CurrentCount=${currentCount}`);
            let canAdd = false;
            // Rule: Can select 1st gem if available
            if (currentCount === 0 && bank[gemType] >= 1) {
                 canAdd = true;
            }
            // Rule: Can select 2nd *different* gem if available
            else if (currentCount === 1 && gemType !== currentSelection[0] && bank[gemType] >= 1) {
                 canAdd = true;
            }
            // Rule: Can select 3rd *different* gem if available (and previous 2 were different)
            else if (currentCount === 2 && currentUniqueCount === 2 && !currentSelection.includes(gemType) && bank[gemType] >= 1) {
                 canAdd = true;
            }

            console.log(`[handleGemClick V3] Result of REGULAR canAdd checks for ${gemType}: ${canAdd}`);
            if (canAdd) {
                selectedGemTypes.push(gemType);
                clickedGemEl.classList.add('selected');
                console.log(`  -> Added REGULAR to selectedGemTypes. New: [${selectedGemTypes.join(',')}]`);
            } else {
                console.log(`[handleGemClick V3] CANNOT ADD ${gemType} based on REGULAR rules.`);
            }
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
        return null;
    }

    function handleCardClick(type, level, cardId, cardEl) {

        if (selectedCard && selectedCard.element === cardEl) {
            clearCardSelectionState();
            return;
        }


        if (currentAction === 'SELECTING_GEMS') {
            clearGemSelectionState();
        }

        else if (currentAction === 'SELECTING_CARD' && selectedCard && selectedCard.element !== cardEl) {
             if (selectedCard.element) selectedCard.element.classList.remove('selected');
        }


        currentAction = 'SELECTING_CARD';
        selectedCard = { type, level, id: cardId, element: cardEl };
        cardEl.classList.add('selected');

        renderSelectionInfo();
        updateClickableState();
    }

    function handleDeckClick(level) {
        const deckEl = deckElements[level];
        if (deckEl.classList.contains('empty') || deckEl.classList.contains('not-selectable')) return;

        const player = players[currentPlayerIndex];
        if (player.reservedCards.length >= MAX_RESERVED_CARDS) {
            updateLog("Reserve limit reached (3). Cannot reserve from deck.");
            return;
        }

        const deckId = `deck-${level}`;


        if (selectedCard && selectedCard.element === deckEl) {
             clearCardSelectionState();
             return;
        }


        if (currentAction === 'SELECTING_GEMS') {
            clearGemSelectionState();
        }

        else if (currentAction === 'SELECTING_CARD' && selectedCard && selectedCard.element !== deckEl) {
             if (selectedCard.element) selectedCard.element.classList.remove('selected');
        }


        currentAction = 'SELECTING_CARD';
        selectedCard = { type: 'deck', level, id: deckId, element: deckEl };
        deckEl.classList.add('selected');

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


       if (selectedCard && selectedCard.element === cardEl) {
           clearCardSelectionState();
           return;
       }


       if (currentAction === 'SELECTING_GEMS') {
           clearGemSelectionState();
       }

       else if (currentAction === 'SELECTING_CARD' && selectedCard && selectedCard.element !== cardEl) {
            if (selectedCard.element) selectedCard.element.classList.remove('selected');
       }


       currentAction = 'SELECTING_CARD';
       selectedCard = { type: 'reserved', level: cardData.level, id: cardId, element: cardEl };
       cardEl.classList.add('selected');

       renderSelectionInfo();
       updateClickableState();
   }




    function validateTakeGemsSelection() {
        const gems = selectedGemTypes;
        const count = gems.length;
        const uniqueCount = new Set(gems).size;

        console.log(`[validateTakeGemsSelection] Validating: count=${count}, unique=${uniqueCount}, gems=[${gems.join(',')}]`);


        if (count === 3 && uniqueCount === 3) {
            const possible = gems.every(type => bank[type] >= 1);
            console.log(` -> Take 3? Possible=${possible}`);
            return possible;
        }

        if (count === 2 && uniqueCount === 1) {
            const type = gems[0];
            const possible = bank[type] >= MIN_GEMS_FOR_TAKE_TWO;
            console.log(` -> Take 2 identical (${type})? Bank=${bank[type]}, Min=${MIN_GEMS_FOR_TAKE_TWO}. Possible=${possible}`);
            return possible;
        }

        console.log(` -> Not a valid final action.`);

        return false;
    }

    function performTakeGems() {


        if (!validateTakeGemsSelection()) {
            updateLog("Invalid token selection for taking. Action cancelled.");
            clearActionState();
            return;
        }

        const player = players[currentPlayerIndex];
        const gemsTakenLog = {};
        const isTakeTwo = selectedGemTypes.length === 2;


        player.stats.gemTakeActions++;
        if (isTakeTwo) {
             player.stats.take2Actions++;
        } else {
             player.stats.take3Actions++;
        }


        selectedGemTypes.forEach(type => {


            if (bank[type] > 0) {
                bank[type]--;
                player.gems[type]++;
                gemsTakenLog[type] = (gemsTakenLog[type] || 0) + 1;
                player.stats.gemsTaken[type]++;
            } else {

                console.error(`CRITICAL ERROR: Attempting to take ${type} when bank count is ${bank[type]} after validation!`);
                updateLog(`Error: Cannot take ${type}, none left in bank despite validation! Action possibly corrupted.`);


                // Attempt recovery - though state might be inconsistent
                clearActionState();
                renderBank();
                renderPlayerArea(player.id);
                return;
            }
        });

        const gemString = Object.entries(gemsTakenLog).map(([t, c]) => `${c} ${t}`).join(', ');
        updateLog(`Player ${player.name} took ${gemString}.`);

        const performedActionType = 'TAKE_GEMS';
        clearActionState();
        renderBank();
        renderPlayerArea(player.id);
        endTurn(performedActionType);
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
        let cardReplaced = false;

        if (selectedCard.type === 'deck') {
            if (decks[level].length > 0) {
                reservedCardData = decks[level].pop();
                cardSourceDescription = `from L${level} deck`;
                player.stats.deckReservations[level]++;
            } else {
                updateLog(`Cannot reserve: Level ${level} deck is empty.`);
                clearActionState();
                renderCards();
                updateClickableState();
                return;
            }
        } else {
            const cardId = selectedCard.id;
            const cardIndex = visibleCards[level].findIndex(c => c && c.id === cardId);
            if (cardIndex !== -1 && visibleCards[level][cardIndex]) {
                reservedCardData = visibleCards[level][cardIndex];
                cardSourceDescription = `L${level} ${reservedCardData.color} from board`;
                player.stats.boardReservations[level]++;

                visibleCards[level][cardIndex] = null;
                drawCard(level, cardIndex);
                cardReplaced = true;
            } else {
                updateLog("Cannot reserve: Selected card is no longer available.");
                clearActionState();
                renderCards();
                updateClickableState();
                return;
            }
        }


        player.stats.reserveActions++;
        player.stats.cardsReservedTotalCount++;
        player.stats.allReservedCardsData.push(JSON.parse(JSON.stringify(reservedCardData)));
        player.reservedCards.push(reservedCardData);


        let gotGold = false;
        if (bank[GOLD] > 0) {
            player.gems[GOLD]++;
            bank[GOLD]--;
            gotGold = true;
            player.stats.goldTaken++;
        }

        updateLog(`Player ${player.name} reserved ${cardSourceDescription}${gotGold ? " and took 1 gold." : "."}`);

        const performedActionType = 'RESERVE';
        clearActionState();
        if (gotGold) renderBank();
        if (cardReplaced) renderCards();
        else renderDeckCount(level);
        renderPlayerArea(player.id);
        endTurn(performedActionType);
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
        let cardIndex = -1;
        let isFromReserve = (cardSource === 'reserved');


        if (cardSource === 'visible') {
            cardIndex = visibleCards[selectedCard.level].findIndex(c => c && c.id === cardId);
            if (cardIndex !== -1) {
                purchasedCardData = visibleCards[selectedCard.level][cardIndex];
            }
        } else {
            cardIndex = player.reservedCards.findIndex(c => c.id === cardId);
            if (cardIndex !== -1) {
                purchasedCardData = player.reservedCards[cardIndex];
            }
        }

        if (!purchasedCardData) {
            updateLog("Cannot purchase: Card not found or unavailable.");
            clearActionState();
            updateClickableState();
            return;
        }


        const { canAfford, goldNeeded, effectiveCost } = canAffordCard(player, purchasedCardData);
        if (!canAfford) {
            updateLog(`Cannot purchase: Not enough resources. Need ${goldNeeded} more gold or equivalent gems.`);

            return;
        }


        let goldSpent_this_turn = 0;
        let gemsSpent_this_turn = { white: 0, blue: 0, green: 0, red: 0, black: 0 };
        let totalResourceCost = 0;

        GEM_TYPES.forEach(gemType => {
            const cost = effectiveCost[gemType];
            totalResourceCost += cost;
            const playerHas = player.gems[gemType];
            const fromPlayerGems = Math.min(cost, playerHas);
            const needsGold = cost - fromPlayerGems;

            if (fromPlayerGems > 0) {
                player.gems[gemType] -= fromPlayerGems;
                bank[gemType] += fromPlayerGems;
                gemsSpent_this_turn[gemType] += fromPlayerGems;
            }
            if (needsGold > 0) {
                if (player.gems[GOLD] >= needsGold) {
                    player.gems[GOLD] -= needsGold;
                    bank[GOLD] += needsGold;
                    goldSpent_this_turn += needsGold;
                } else {

                    console.error("CRITICAL: Payment gold mismatch during purchase!");
                    updateLog("Error during payment calculation.");

                    return;
                }
            }
        });


        player.stats.purchaseActions++;
        player.stats.cardsPurchasedCount++;
        player.stats.cardsPurchasedByLevel[purchasedCardData.level]++;
        player.stats.cardsPurchasedByColor[purchasedCardData.color]++;
        if (isFromReserve) player.stats.purchasedFromReserveCount++;
        else player.stats.purchasedFromBoardCount++;
        if (totalResourceCost === 0) player.stats.selfSufficientPurchases++;
        player.stats.goldSpent += goldSpent_this_turn;
        GEM_TYPES.forEach(type => player.stats.gemsSpent[type] += gemsSpent_this_turn[type]);
        if (player.stats.firstCardPurchasedTurn[purchasedCardData.level] === null) {
            player.stats.firstCardPurchasedTurn[purchasedCardData.level] = turnNumber;
        }


        player.cards.push(purchasedCardData);
        player.score += purchasedCardData.vp;
        player.bonuses[purchasedCardData.color]++;

        updateLog(`Player ${player.name} purchased L${purchasedCardData.level} ${purchasedCardData.color} card${isFromReserve ? ' (from reserve)' : ''}${goldSpent_this_turn > 0 ? ` (used ${goldSpent_this_turn} gold)` : ''}.`);


        let cardReplaced = false;
        if (cardSource === 'visible') {
            visibleCards[purchasedCardData.level][cardIndex] = null;
            drawCard(purchasedCardData.level, cardIndex);
            cardReplaced = true;
        } else {
            player.reservedCards.splice(cardIndex, 1);
        }

        const performedActionType = 'PURCHASE';
        clearActionState();
        renderBank();
        if (cardReplaced) renderCards();
        renderPlayerArea(player.id);
        endTurn(performedActionType);
    }

    function handleConfirmReturnGems(player, gemsToReturnCount, callback) {
        const selectedElements = returnGemsPlayerDisplay.querySelectorAll('.gem.selected[data-return-gem-type]');
        if (selectedElements.length !== gemsToReturnCount) {
             // User hasn't selected the correct amount yet
             updateLog(`Please select exactly ${gemsToReturnCount} non-gold tokens to return.`);
            return;
        }

        const returnedCounts = {};
        selectedElements.forEach(gemEl => {
            const type = gemEl.dataset.returnGemType;
            if (player.gems[type] > 0) {
                player.gems[type]--;
                bank[type]++;
                returnedCounts[type] = (returnedCounts[type] || 0) + 1;
                player.stats.gemsReturnedOverLimit[type]++;
            } else {
                console.error(`Error returning ${type}? Player count: ${player.gems[type]}`);
                 // Should not happen if UI is correct, but handle defensively
            }
        });

        const returnString = Object.entries(returnedCounts)
            .map(([type, count]) => `${count} ${type}`)
            .join(', ');
        updateLog(`Player ${player.name} returned ${returnString}.`);

        returnGemsOverlay.classList.add('hidden');
        renderBank();
        renderPlayerArea(player.id);
        if (callback) callback(); // Continue the end-of-turn sequence
    }


    function awardNoble(player, nobleData) {
        updateLog(`Noble (${nobleData.vp} VP) visits Player ${player.name}.`);
        player.nobles.push(nobleData);
        player.score += nobleData.vp;
        player.stats.noblesAcquiredTurn[nobleData.id] = turnNumber;

        availableNobles = availableNobles.filter(n => n.id !== nobleData.id);
    }




    function startTurn() {
        if (gameTrulyFinished) return;
        highlightActivePlayer();
        clearActionState();
        startTimer();
        updateClickableState();
    }

    function endTurn(actionType) {
        console.log(`Ending turn for Player ${currentPlayerIndex} (${players[currentPlayerIndex].name}). Action: ${actionType}. Turn: ${turnNumber}`);
        stopTimer();
        const player = players[currentPlayerIndex];


        player.stats.turnsTaken++;
        const currentNonGoldGems = GEM_TYPES.reduce((sum, type) => sum + player.gems[type], 0);
        const currentGoldGems = player.gems[GOLD] || 0;
        const currentTotalGems = currentNonGoldGems + currentGoldGems;
        player.stats.peakGemsHeld = Math.max(player.stats.peakGemsHeld, currentTotalGems); // Track peak TOTAL gems
        if (currentTotalGems === MAX_GEMS_PLAYER) player.stats.turnsEndedExactLimit++; // Check TOTAL against limit
        else if (currentTotalGems < MAX_GEMS_PLAYER) player.stats.turnsEndedBelowLimit++; // Check TOTAL against limit



        // Sequence: Nobles -> Gem Limit -> Game End Check -> Next Player
        checkForNobleVisit(player, () => {
            checkForGemLimit(player, () => { // checkForGemLimit now handles the total gem count logic

                const scoreJustReached = player.score >= WINNING_SCORE;
                if (scoreJustReached && player.stats.turnReached15VP === null) {
                    player.stats.turnReached15VP = turnNumber;
                }
                const gameEndTriggeredThisTurn = checkAndSetGameOverCondition(player);
                if (gameEndTriggeredThisTurn) {
                    player.stats.triggeredGameEnd = true;
                }


                if (isGameOverConditionMet && currentPlayerIndex === lastRoundPlayerIndex) {
                    console.log(`Player ${currentPlayerIndex} (${player.name}) was the last player. Ending game.`);
                    endGame();
                    return;
                }

                if (gameEndTriggeredThisTurn) {
                    console.log(`Final round continues. Current: ${currentPlayerIndex}, Ends after: ${lastRoundPlayerIndex}`);
                }


                currentPlayerIndex = (currentPlayerIndex + 1) % players.length;



                // Increment turn number only if it's the start of a new round (player 0) AND game end isn't triggered yet
                if (currentPlayerIndex === 0 && !isGameOverConditionMet) {
                    turnNumber++;
                    console.log(`Starting Turn ${turnNumber}`);
                } else if (isGameOverConditionMet) {
                     console.log(`Continuing final round. Next player: ${currentPlayerIndex} (${players[currentPlayerIndex].name})`);
                }



                if (!gameTrulyFinished) {
                    updateLog(`Player ${players[currentPlayerIndex].name}'s turn.`);
                    startTurn();
                } else {
                     // If game ended during checks, just update clickable state
                     updateClickableState();
                }
            });
        });
    }

    function checkAndSetGameOverCondition(player) {
        if (!isGameOverConditionMet && player.score >= WINNING_SCORE) {
            isGameOverConditionMet = true;

            lastRoundPlayerIndex = (currentPlayerIndex + players.length - 1) % players.length;
            updateLog(`--- Player ${player.name} reached ${player.score} VP! Final round begins. All players up to Player ${players[lastRoundPlayerIndex].name} will get one more turn. ---`);
            console.log(`Game end condition met. Final round initiated. Ends after player index: ${lastRoundPlayerIndex}.`);
            return true;
        }
        return false;
    }

    function checkForNobleVisit(player, callback) {
        const eligibleNobles = availableNobles.filter(noble =>
            GEM_TYPES.every(gemType => (player.bonuses[gemType] || 0) >= (noble.requirements[gemType] || 0))
        );

        if (eligibleNobles.length === 0) {
            if (callback) callback();
        } else if (eligibleNobles.length === 1) {

            awardNoble(player, eligibleNobles[0]);
            renderNobles();
            renderPlayerArea(player.id);
            if (callback) callback();
        } else {

            updateLog(`Player ${player.name} qualifies for multiple nobles. Choose one.`);
            showNobleChoiceOverlay(player, eligibleNobles, callback);

        }
    }

    function showNobleChoiceOverlay(player, eligibleNobles, callback) {
        nobleChoiceOptionsContainer.innerHTML = '';
        eligibleNobles.forEach(nobleData => {
            const nobleEl = createNobleElement(nobleData);
            nobleEl.classList.add('clickable');
            nobleEl.onclick = () => handleNobleChoice(player, nobleData, callback);
            nobleChoiceOptionsContainer.appendChild(nobleEl);
        });
        nobleChoiceOverlay.classList.remove('hidden');
        updateClickableState();
    }

    function handleNobleChoice(player, chosenNoble, callback) {
        nobleChoiceOverlay.classList.add('hidden');


        if (availableNobles.some(n => n.id === chosenNoble.id)) {
            awardNoble(player, chosenNoble);
            renderNobles();
            renderPlayerArea(player.id);
        } else {
            console.warn(`Chosen noble ${chosenNoble.id} no longer available? Race condition?`);
            updateLog("Selected noble was no longer available.");
        }
        if (callback) callback();
        updateClickableState();
    }

    // Corrected checkForGemLimit Function
    function checkForGemLimit(player, callback) {
        const nonGoldGems = GEM_TYPES.reduce((sum, type) => sum + player.gems[type], 0);
        const goldGems = player.gems[GOLD] || 0;
        const totalGems = nonGoldGems + goldGems; // Calculate total including gold

        if (totalGems > MAX_GEMS_PLAYER) { // Check TOTAL against the limit
            // Calculate the exact number of tokens over the limit
            const excessGems = totalGems - MAX_GEMS_PLAYER;

            // The player MUST return 'excessGems' tokens, but they can ONLY return non-gold gems.
            // The number they actually need to select and return is the minimum of the excess
            // and the number of non-gold gems they possess.
            const actualGemsToReturn = Math.min(excessGems, nonGoldGems);

            if (actualGemsToReturn > 0) {
                // Log the TOTAL count and the required non-gold return count
                updateLog(`Player ${player.name} has ${totalGems} total tokens (limit ${MAX_GEMS_PLAYER}). Must return ${actualGemsToReturn} non-gold tokens.`);
                showReturnGemsOverlay(player, totalGems, actualGemsToReturn, callback); // Pass total and return count
            } else {
                // This case occurs if a player has > 10 tokens, but all the excess are gold
                // (e.g., 9 non-gold + 2 gold = 11 total, need to return 1;
                // or 0 non-gold + 11 gold = 11 total, need to return 1 but can't).
                // Since they cannot return gold, they proceed without returning if actualGemsToReturn is 0.
                updateLog(`Player ${player.name} has ${totalGems} total tokens, but cannot return the required ${excessGems} non-gold tokens.`);
                 if (callback) callback(); // Proceed without returning
            }
        } else {
            // Total gems are within the limit
            if (callback) callback();
        }
    }


    // Corrected showReturnGemsOverlay Function (minor text update)
    function showReturnGemsOverlay(player, currentTotalGems, gemsToReturnCount, callback) {
        // Update the text to reflect the TOTAL gem count vs limit
        returnGemsCountSpan.textContent = `${currentTotalGems} / ${MAX_GEMS_PLAYER}`;
        returnGemsPlayerDisplay.innerHTML = '';

        // Display ONLY non-gold gems as selectable for returning
        GEM_TYPES.forEach(gemType => {
            for (let i = 0; i < player.gems[gemType]; i++) {
                const gemEl = createGemElement(gemType, 1, false);
                gemEl.classList.add('clickable');
                gemEl.dataset.returnGemType = gemType;
                gemEl.onclick = () => toggleReturnGemSelection(gemEl, gemsToReturnCount);
                returnGemsPlayerDisplay.appendChild(gemEl);
            }
        });

        // Optionally, still show gold but make it clear it's unselectable
        if (player.gems.gold > 0) {
             const goldEl = createGemElement(GOLD, player.gems.gold, true); // Use bank style for count
             goldEl.style.opacity = '0.5';
             goldEl.style.cursor = 'not-allowed';
             goldEl.style.marginLeft = '10px';
             goldEl.title = "Gold tokens cannot be returned";
             // Make the gold gem slightly smaller to match selectable ones
             goldEl.style.width = '25px';
             goldEl.style.height = '25px';
              if (goldEl.querySelector('.gem-count')) { // Check if count exists
                 goldEl.querySelector('.gem-count').style.fontSize = '0.7em'; // Adjust count size
             }
             returnGemsPlayerDisplay.appendChild(goldEl);
        }


        confirmReturnGemsBtn.disabled = true;
        // This text is correct - it shows how many non-gold need selecting
        returnGemsSelectionDisplay.textContent = `Selected to return: 0 / ${gemsToReturnCount}`;

        confirmReturnGemsBtn.onclick = null;
        confirmReturnGemsBtn.onclick = () => {
            // Pass the correct number required (non-gold gems) to the confirmation handler
            handleConfirmReturnGems(player, gemsToReturnCount, callback);
            updateClickableState();
        };

        returnGemsOverlay.classList.remove('hidden');
        updateClickableState();
    }



    function toggleReturnGemSelection(gemEl, gemsToReturnCount) {
        gemEl.classList.toggle('selected');
        const selectedElements = returnGemsPlayerDisplay.querySelectorAll('.gem.selected[data-return-gem-type]');
        const selectedCount = selectedElements.length;
        returnGemsSelectionDisplay.textContent = `Selected to return: ${selectedCount}/${gemsToReturnCount}`;
        confirmReturnGemsBtn.disabled = selectedCount !== gemsToReturnCount;
    }




    function endGame() {
        console.log("GAME OVER - Calculating winner and displaying detailed stats...");
        updateLog("--- GAME OVER ---");
        gameTrulyFinished = true;
        stopTimer();
        hideOverlays();
        clearActionState();


        const sortedPlayers = [...players].sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return a.cards.length - b.cards.length; // Tiebreaker: fewer cards wins
        });


        let winners = [];
        if (sortedPlayers.length > 0) {
            const topScore = sortedPlayers[0].score;
            const potentialWinners = sortedPlayers.filter(p => p.score === topScore);
            if (potentialWinners.length === 1) {
                winners = potentialWinners;
            } else {

                const minCards = Math.min(...potentialWinners.map(p => p.cards.length));
                winners = potentialWinners.filter(p => p.cards.length === minCards);
            }
        }


        finalScoresDiv.innerHTML = '';
        sortedPlayers.forEach((p, index) => {
            const rank = index + 1;
            const isWinner = winners.some(w => w.id === p.id);
            const playerStats = p.stats;


            const vpFromCards = p.cards.reduce((sum, card) => sum + card.vp, 0);
            const vpFromNobles = p.nobles.reduce((sum, noble) => sum + noble.vp, 0);
            const avgVpPerTurn = playerStats.turnsTaken > 0 ? (p.score / playerStats.turnsTaken).toFixed(2) : 'N/A';
            const avgVpPerCard = playerStats.cardsPurchasedCount > 0 ? (vpFromCards / playerStats.cardsPurchasedCount).toFixed(2) : 'N/A';
            const reservationSuccessRate = playerStats.cardsReservedTotalCount > 0 ? ((playerStats.purchasedFromReserveCount / playerStats.cardsReservedTotalCount) * 100).toFixed(1) : '0.0';
            const totalBonuses = Object.values(p.bonuses).reduce((s, c) => s + c, 0);
            const avgBonusPerCard = playerStats.cardsPurchasedCount > 0 ? (totalBonuses / playerStats.cardsPurchasedCount).toFixed(2) : 'N/A';
            const totalGemsTaken = Object.values(playerStats.gemsTaken).reduce((s, c) => s + c, 0);
            const totalGemTakeActions = playerStats.take2Actions + playerStats.take3Actions;
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


            const playerEntryDiv = document.createElement('details');
            playerEntryDiv.classList.add('player-result-entry-detailed');
            if (isWinner) playerEntryDiv.classList.add('winner');
            if (rank === 1) playerEntryDiv.open = true;
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


            const col1 = document.createElement('div');
            col1.classList.add('stat-column');

            col1.innerHTML += `
                <div class="stat-category"><h4>VP Breakdown</h4>
                    <div class="stat-items">
                        <span>Cards: ${vpFromCards} VP</span>
                        <span>Nobles: ${vpFromNobles} VP</span>
                        ${playerStats.turnReached15VP ? `<span>Reached 15 VP: Turn ${playerStats.turnReached15VP}</span>` : ''}
                    </div>
                </div>`;

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

            let reservedCurrentHTML = `
                 <div class="stat-category"><h4>Reserved (${p.reservedCards.length})</h4>
                     <div class="cards-summary reserved-cards-summary">
                        ${p.reservedCards.length > 0 ? p.reservedCards.map(card => createTinyCardElement(card).outerHTML).join('') : '<span class="no-items">None</span>'}
                     </div>
                 </div>`;
            col1.innerHTML += reservedCurrentHTML;

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

            let noblesHTML = `
                <div class="stat-category"><h4>Nobles (${p.nobles.length})</h4>
                    <div class="summary-items nobles-summary">
                        ${p.nobles.length > 0
                            ? p.nobles.map(noble => {
                                const nobleEl = createNobleElement(noble);
                                nobleEl.style.transform = 'scale(0.7)';
                                nobleEl.style.margin = '-5px';
                                return `<span title="Acquired Turn ${playerStats.noblesAcquiredTurn[noble.id] || '?'}">${nobleEl.outerHTML}</span>`;
                              }).join('')
                            : '<span class="no-items">None</span>'
                        }
                    </div>
                </div>`;
            col1.innerHTML += noblesHTML;
            detailsContainer.appendChild(col1);


            const col2 = document.createElement('div');
            col2.classList.add('stat-column');

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

            let gemHistoryHTML = `
                <details class="sub-details"><summary>Token Management</summary>
                    <div class="stat-category inner-stat-category">
                        <h4>Final Tokens Held</h4>
                        <div class="summary-items gems-summary small-gems">
                             ${[...GEM_TYPES, GOLD].map(type => { const count = p.gems[type] || 0; return count > 0 ? createGemElement(type, count, true).outerHTML : ''; }).join('') || '<span class="no-items">None</span>'}
                        </div>
                        <h4>Token Flow (Cumulative)</h4>
                        <div class="stat-items sub-stats flow-stats">
                            <span>Taken: ${createGemFlowString(playerStats.gemsTaken)}</span>
                            <span>Gold Taken: ${playerStats.goldTaken}</span>
                            <span>Spent: ${createGemFlowString(playerStats.gemsSpent)}</span>
                            <span>Gold Spent: ${playerStats.goldSpent} (${goldDependency}%)</span>
                            <span>Returned (Limit): ${createGemFlowString(playerStats.gemsReturnedOverLimit)} (${totalGemsReturned} total)</span>
                            <span>Peak Held (Total): ${playerStats.peakGemsHeld}</span>
                        </div>
                        <h4>Token Actions</h4>
                        <div class="stat-items sub-stats">
                            <span>Take 3 Actions: ${playerStats.take3Actions} (${percentTake3}%)</span>
                            <span>Take 2 Actions: ${playerStats.take2Actions} (${percentTake2}%)</span>
                            <span>Avg Tokens/Action: ${avgGemsPerTakeAction}</span>
                        </div>
                         <h4>Token Limit Interaction</h4>
                        <div class="stat-items sub-stats">
                            <span>Turns Ended at Limit: ${playerStats.turnsEndedExactLimit}</span>
                            <span>Turns Ended Below Limit: ${playerStats.turnsEndedBelowLimit}</span>
                        </div>
                    </div>
                </details>`;
            col2.innerHTML += gemHistoryHTML;

            col2.innerHTML += `
                <div class="stat-category"><h4>Action Distribution (${totalActions} Total)</h4>
                    <div class="stat-items action-dist-stats">
                        <span>Token Takes: ${actionDist.gem}%</span>
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


        if (winners.length > 1) {
            const tieMessage = document.createElement('p');
            tieMessage.classList.add('tie-message');
            tieMessage.textContent = `Tie between: ${winners.map(w => w.name).join(' & ')}! (Fewest cards purchased wins)`;
            finalScoresDiv.appendChild(tieMessage);
            updateLog(`Game ended in a tie!`);
        } else if (winners.length === 1) {
            updateLog(`Winner: ${winners[0].name} with ${winners[0].score} VP!`);
        }

        updateClickableState();
        gameOverOverlay.classList.remove('hidden');
    }





    function clearActionState() {

        clearGemSelectionState();


        clearCardSelectionState();


        currentAction = null;




        renderSelectionInfo();
        updateClickableState();
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

            const actionCancelled = currentAction;
            clearActionState();
            updateLog(`Player ${player.name} cancelled ${actionCancelled.replace('SELECTING_','').toLowerCase()} selection and ended their turn.`);
        } else {

            updateLog(`Player ${player.name} passed the turn.`);
        }
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

        for (let level = 1; level <= 3; level++) {
            const card = visibleCards[level]?.find(c => c && c.id === id);
            if (card) return card;
        }

        for (const p of players) {
            const card = p.reservedCards?.find(c => c && c.id === id);
            if (card) return card;
        }

        return null; // Card not found in visible or any player's reserve
    }

    function getDeckCardPlaceholder(level) {
        // Returns a placeholder object for display purposes when a deck is selected
        return { level: level, color: 'deck', cost: {}, vp: 0, id: null };
    }

    function canAffordCard(player, cardData) {
        if (!player || !cardData || !cardData.cost) {
            return { canAfford: false, goldNeeded: 0, effectiveCost: {} };
        }
        let goldNeeded = 0;
        const effectiveCost = {}; // Store cost after bonuses

        GEM_TYPES.forEach(gemType => {
            const cardCost = cardData.cost[gemType] || 0;
            const playerBonus = player.bonuses[gemType] || 0;
            const costAfterBonus = Math.max(0, cardCost - playerBonus);
            effectiveCost[gemType] = costAfterBonus; // This is what needs to be paid

            if (player.gems[gemType] < costAfterBonus) {
                // Calculate how much gold is needed for *this specific color*
                goldNeeded += costAfterBonus - player.gems[gemType];
            }
        });

        const canAfford = player.gems.gold >= goldNeeded; // Check if player has enough gold for the *total* shortfall
        return { canAfford, goldNeeded, effectiveCost };
    }

    function drawCard(level, index) {
        if (decks[level].length > 0) {
            visibleCards[level][index] = decks[level].pop();
        } else {
            visibleCards[level][index] = null; // No more cards in deck
        }


        return visibleCards[level][index]; // Return the drawn card (or null)
    }

    function renderDeckCount(level) {
        if (deckCounts[level] && deckElements[level]) {
            deckCounts[level].textContent = decks[level].length;
            deckElements[level].classList.toggle('empty', decks[level].length === 0);
            deckElements[level].title = `${decks[level].length} cards left in Level ${level} deck`;
        }
    }



    function updateClickableState() {
        const player = players[currentPlayerIndex];
        const disableAll = gameTrulyFinished || isOverlayVisible() || !player;



        document.querySelectorAll('.card-affordable-now').forEach(el => el.classList.remove('card-affordable-now'));

        if (disableAll) {

            document.querySelectorAll('.gem, .card:not(.empty-slot), .deck, .reserved-card-small').forEach(el => {
                el.classList.add('not-selectable');
                el.classList.remove('not-affordable', 'selected');
            });

             if (currentAction === 'SELECTING_GEMS') {
                 gemBankContainer.querySelectorAll('.gem.selected').forEach(el => el.classList.remove('selected'));
             }
            dynamicActionButtonsContainer.innerHTML = '';
            endTurnEarlyBtn.disabled = true;
            endTurnEarlyBtn.classList.add('hidden');
            return;
        }


        gemBankContainer.querySelectorAll('.gem').forEach(gemEl => {
            const gemType = gemEl.dataset.gemType;
            const isGold = gemType === GOLD;
            const isSelected = gemEl.classList.contains('selected');
            let clickable = false;




            if (!isGold && bank[gemType] > 0) {


                if (currentAction === 'SELECTING_CARD') {
                    clickable = false; // Cannot select gems while card is selected
                }

                else { // currentAction is null or 'SELECTING_GEMS'
                     const currentSelection = selectedGemTypes;
                     const currentCount = currentSelection.length;
                     const currentUniqueCount = new Set(currentSelection).size;


                     if (isSelected) {
                         clickable = true; // Always allow deselecting
                     }

                     else { // Gem is not currently selected
                         if (currentCount === 0) {
                            clickable = (bank[gemType] >= 1); // Can take first gem
                         } else if (currentCount === 1) {
                            const firstType = currentSelection[0];

                            if (gemType !== firstType && bank[gemType] >= 1) {
                                clickable = true; // Can take 2nd different gem
                            }

                            else if (gemType === firstType) { // Potential Take 2
                                const bankHasEnough = bank[gemType] >= MIN_GEMS_FOR_TAKE_TWO;
                                 console.log(`  [updateClickableState] Count=1, checking 2nd identical ${gemType}: Bank=${bank[gemType]}, Needs=${MIN_GEMS_FOR_TAKE_TWO}, BankHasEnough=${bankHasEnough}`);
                                if (bankHasEnough) {
                                    clickable = true; // Can take 2nd identical if enough in bank
                                }
                            }
                         } else if (currentCount === 2) {

                            if (currentUniqueCount === 1) {
                                clickable = false; // Cannot take 3rd gem if first 2 were identical
                            }

                            else if (currentUniqueCount === 2) {
                                if (!currentSelection.includes(gemType) && bank[gemType] >= 1) {
                                    clickable = true; // Can take 3rd different gem
                                }
                            }
                         }

                         else { // currentCount >= 3
                             clickable = false; // Cannot take more than 3 gems
                         }
                     }
                }
            }


            // Update visual state
            gemEl.classList.toggle('not-selectable', !clickable);

        });


        // Update Cards and Decks
        document.querySelectorAll('#cards-area .card:not(.empty-slot), #cards-area .deck').forEach(el => {
            let disable = false;
            const isDeck = el.classList.contains('deck');
            const isCard = el.classList.contains('card');
            let canPlayerAfford = false;
            let cardData = null;

            if (isCard) cardData = getCardById(el.dataset.cardId);
            if (cardData) canPlayerAfford = canAffordCard(player, cardData).canAfford;

            if (currentAction === 'SELECTING_GEMS') {
                disable = true; // Cannot interact with cards/decks when selecting gems
            } else if (currentAction === 'SELECTING_CARD' && selectedCard?.element !== el) {
                disable = true; // Only the selected card/deck is active
            } else { // currentAction is null or matches this element
                if (isDeck) {
                    if (el.classList.contains('empty')) disable = true; // Cannot select empty deck

                    // Can only reserve if not already selected OR if player can reserve
                    else if (currentAction === null && player.reservedCards.length >= MAX_RESERVED_CARDS) {
                         disable = true; // Cannot reserve if limit reached
                    }
                } else if (isCard && cardData) {
                    // Can interact if:
                    // 1. Not selecting gems
                    // 2. Either no card is selected, OR this is the selected card
                    // 3. Player can either afford it OR can reserve it (if not already maxed)
                    const canReserve = player.reservedCards.length < MAX_RESERVED_CARDS;
                    if (currentAction === null && !canPlayerAfford && !canReserve) {
                        disable = true; // Cannot purchase AND cannot reserve
                    }
                    // Otherwise, it's selectable (for purchase or reserve)
                } else if (isCard && !cardData) { // Handle edge case where card data is missing
                     disable = true;
                }
            }

            el.classList.toggle('not-selectable', disable);
            if (isCard && cardData) {
                // Show affordability hints only if the card is potentially interactive
                el.classList.toggle('not-affordable', !disable && !canPlayerAfford);
                // Highlight affordable cards only when *no* card is actively selected
                el.classList.toggle('card-affordable-now', !disable && canPlayerAfford && currentAction !== 'SELECTING_CARD');
            } else {
                // Clear affordability classes for decks or non-selectable cards
                 el.classList.remove('not-affordable', 'card-affordable-now');
            }
        });

        // Update Reserved Cards (only for the current player)
        document.querySelectorAll(`#player-area-${player.id} .reserved-card-small`).forEach(cardEl => {
            let disable = true;
            let canPlayerAfford = false;
            let cardData = null;

            // Find the reserved card data for the current player
            cardData = player.reservedCards?.find(c => c.id === cardEl.dataset.cardId);
            if (cardData) canPlayerAfford = canAffordCard(player, cardData).canAfford;

            if (currentAction === 'SELECTING_GEMS') {
                disable = true; // Cannot interact when selecting gems
            } else if (currentAction === 'SELECTING_CARD' && selectedCard?.element !== cardEl) {
                disable = true; // Only the selected card is active
            } else if (cardData){ // If card data exists
                disable = false; // Generally selectable...
                 // ...unless no action is selected AND the player cannot afford it
                 if (currentAction === null && !canPlayerAfford) {
                     disable = true; // Cannot purchase
                 }
            }

            cardEl.classList.toggle('not-selectable', disable);
            if (!disable && cardData) {
                 cardEl.classList.toggle('not-affordable', !canPlayerAfford);
                 // Highlight affordable reserved cards only when *no* card is actively selected
                 cardEl.classList.toggle('card-affordable-now', canPlayerAfford && currentAction !== 'SELECTING_CARD');
            } else {
                 cardEl.classList.remove('not-affordable', 'card-affordable-now');
            }
        });
        // Disable reserved cards for inactive players
         document.querySelectorAll(`.player-area:not(#player-area-${player.id}) .reserved-card-small`).forEach(cardEl => {
             cardEl.classList.add('not-selectable');
             cardEl.classList.remove('not-affordable', 'selected', 'card-affordable-now');
         });


        // End Turn Button
        endTurnEarlyBtn.disabled = disableAll;
        endTurnEarlyBtn.classList.toggle('hidden', disableAll);
    }


    function highlightActivePlayer() {

        document.querySelectorAll('.player-area.active-player').forEach(el => el.classList.remove('active-player'));

        const activePlayerEl = document.getElementById(`player-area-${currentPlayerIndex}`);
        if (activePlayerEl) {
            activePlayerEl.classList.add('active-player');
        }
    }

    function startTimer() {
        stopTimer();
        if (gameSettings.timerMinutes <= 0 || turnDuration <= 0) {
            renderTimer();
            return;
        }
        turnTimeRemaining = turnDuration;
        renderTimer();
        turnTimerInterval = setInterval(() => {
            turnTimeRemaining--;
            renderTimer();
            if (turnTimeRemaining < 0) {
                updateLog(`Player ${players[currentPlayerIndex].name}'s turn timed out.`);
                clearActionState();
                endTurn('TIMEOUT');
            }
        }, 1000);
    }

    function stopTimer() {
        clearInterval(turnTimerInterval);
        turnTimerInterval = null;

         renderTimer();
    }

    function updateLog(message) {
        const p = document.createElement('p');
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        p.textContent = `[${timestamp}] ${message}`;
        logMessagesDiv.appendChild(p);
        logMessagesDiv.scrollTop = logMessagesDiv.scrollHeight;
    }

    function hideOverlays() {
        returnGemsOverlay.classList.add('hidden');
        gameOverOverlay.classList.add('hidden');
        nobleChoiceOverlay.classList.add('hidden');
        updateClickableState();
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
        title += `\nCost: ${costString || 'Free'}`;
        return title;
    }


    function createTinyCardElement(cardData) {
        const cardEl = document.createElement('div');
        if (!cardData) return cardEl;
        cardEl.classList.add('tiny-card', `card-border-${cardData.color}`);

        const costString = Object.entries(cardData.cost || {})
                               .filter(([,c]) => c > 0)
                               .map(([t,c]) => `${c}${t.slice(0,1).toUpperCase()}`)
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


    function createGemFlowString(gemCounts) {
        return GEM_TYPES
            .map(type => ({ type, count: gemCounts[type] || 0 }))
            .filter(item => item.count > 0)
            .map(item => `<span class="gem-inline gem-${item.type}" title="${item.count} ${item.type}">${item.count}</span>`)
            .join(' ') || '<span class="no-items">0</span>';
    }



    // Initial setup
    document.body.style.alignItems = 'center';
    document.body.style.justifyContent = 'center';
    setupPlayerNameInputs();
    setupEventListeners();

});