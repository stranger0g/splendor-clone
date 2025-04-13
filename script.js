// --- START OF FILE script.js ---
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
    const darkModeToggleBtn = document.getElementById('dark-mode-toggle'); // Dark mode button

    const gemBankContainer = document.getElementById('gem-bank');
    const selectedGemsDisplay = document.getElementById('selected-gems-display');
    const selectedCardDisplay = document.getElementById('selected-card-display');
    const dynamicActionButtonsContainer = document.getElementById('dynamic-action-buttons');
    const cancelActionBtn = document.getElementById('cancel-action-btn');

    const deckCounts = {
        1: document.getElementById('deck-1-count'),
        2: document.getElementById('deck-2-count'),
        3: document.getElementById('deck-3-count'),
    };
    const visibleCardsContainers = {
        1: document.getElementById('visible-cards-1'),
        2: document.getElementById('visible-cards-2'),
        3: document.getElementById('visible-cards-3'),
    };
    const deckElements = {
        1: document.getElementById('deck-1'),
        2: document.getElementById('deck-2'),
        3: document.getElementById('deck-3'),
    }

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
    let selectedGemTypes = [];
    let selectedBankElements = new Set();
    let selectedCard = null;
    let turnTimerInterval = null;
    let turnTimeRemaining = 0;
    let turnDuration = 0;
    let gameSettings = { playerCount: 4, timerMinutes: 1.5 };
    let isGameOver = false;
    let lastRoundPlayerIndex = -1;
    let gemsToReturn = 0;
    let selectedGemsToReturn = [];

    const MAX_GEMS_PLAYER = 10;
    const MAX_RESERVED_CARDS = 3;
    const CARDS_PER_LEVEL_VISIBLE = 4;
    const WINNING_SCORE = 15;
    const TIMER_LOW_THRESHOLD = 10;

    // --- Dark Mode Logic ---
    const applyDarkModePreference = () => {
        const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            darkModeToggleBtn.textContent = '☀️'; // Sun icon for light mode
            darkModeToggleBtn.title = 'Toggle Light Mode';
        } else {
            document.body.classList.remove('dark-mode');
            darkModeToggleBtn.textContent = '🌙'; // Moon icon for dark mode
            darkModeToggleBtn.title = 'Toggle Dark Mode';
        }
    };

    darkModeToggleBtn.addEventListener('click', () => {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        if (isDarkMode) {
            localStorage.setItem('darkMode', 'enabled');
            darkModeToggleBtn.textContent = '☀️';
            darkModeToggleBtn.title = 'Toggle Light Mode';
        } else {
            localStorage.setItem('darkMode', 'disabled');
            darkModeToggleBtn.textContent = '🌙';
            darkModeToggleBtn.title = 'Toggle Dark Mode';
        }
    });
    // --- End Dark Mode Logic ---

    function countOccurrences(arr, val) {
        return arr.reduce((count, current) => (current === val ? count + 1 : count), 0);
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function setupPlayerNameInputs() {
        const count = parseInt(playerCountSelect.value);
        playerNamesDiv.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const input = document.createElement('input');
            input.type = 'text'; input.placeholder = `Player ${i + 1} Name`;
            input.id = `player-name-${i}`; input.value = `Player ${i + 1}`;
            playerNamesDiv.appendChild(input);
        }
    }

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

    function initGame(playerNames) {
        players = []; bank = {}; decks = { 1: [], 2: [], 3: [] }; visibleCards = { 1: [], 2: [], 3: [] }; availableNobles = [];
        currentPlayerIndex = 0; turnNumber = 1; isGameOver = false; lastRoundPlayerIndex = -1; gemsToReturn = 0;
        stopTimer(); clearSelections(); hideOverlays(); logMessagesDiv.innerHTML = '';

        for (let i = 0; i < playerNames.length; i++) {
            players.push({ id: i, name: playerNames[i], gems: { white: 0, blue: 0, green: 0, red: 0, black: 0, gold: 0 }, cards: [], reservedCards: [], nobles: [], score: 0, bonuses: { white: 0, blue: 0, green: 0, red: 0, black: 0 } });
        }

        const gemCount = gameSettings.playerCount === 2 ? 4 : (gameSettings.playerCount === 3 ? 5 : 7);
        GEM_TYPES.forEach(gem => bank[gem] = gemCount); bank[GOLD] = 5;

        decks[1] = shuffleArray(ALL_CARDS.filter(c => c.level === 1));
        decks[2] = shuffleArray(ALL_CARDS.filter(c => c.level === 2));
        decks[3] = shuffleArray(ALL_CARDS.filter(c => c.level === 3));

        for (let level = 1; level <= 3; level++) {
            visibleCards[level] = [];
            for (let i = 0; i < CARDS_PER_LEVEL_VISIBLE; i++) {
                visibleCards[level].push(decks[level].length > 0 ? decks[level].pop() : null);
            }
        }

        const numNobles = gameSettings.playerCount + 1;
        availableNobles = shuffleArray(ALL_NOBLES).slice(0, numNobles);

        renderBank(); renderCards(); renderNobles(); renderPlayers();
        updateLog("Game started with " + playerNames.join(', '));
        updateLog(`Player ${players[0].name}'s turn.`);

        setupScreen.classList.remove('active'); setupScreen.classList.add('hidden');
        gameContainer.classList.remove('hidden'); gameContainer.classList.add('active');

        applyDarkModePreference(); // Re-apply theme in case body class was somehow lost
        startTurn();
    }

    function renderBank() {
        gemBankContainer.innerHTML = '';
        [...GEM_TYPES, GOLD].forEach(gemType => {
            const count = bank[gemType];
            if (count >= 0) {
                const gemEl = createGemElement(gemType, count, true);
                if (count > 0 && gemType !== GOLD) {
                    gemEl.addEventListener('click', () => handleGemClick(gemType, gemEl));
                } else {
                    gemEl.classList.add('not-selectable');
                   // gemEl.style.opacity = '0.3'; // Opacity handled by CSS var now
                    gemEl.style.cursor = 'default';
                }
                gemBankContainer.appendChild(gemEl);
            }
        });
         // Ensure state is correct after initial render
        updateClickableState();
    }

    function renderCards() {
        for (let level = 1; level <= 3; level++) {
            visibleCardsContainers[level].innerHTML = '';
            visibleCards[level].forEach((cardData, index) => {
                const cardEl = createCardElement(cardData, level, index);
                if (cardData) {
                    cardEl.addEventListener('click', () => handleCardClick('visible', level, cardData.id, cardEl));
                }
                visibleCardsContainers[level].appendChild(cardEl);
            });
            deckCounts[level].textContent = decks[level].length;
            deckElements[level].classList.toggle('empty', decks[level].length === 0);
            deckElements[level].classList.remove('selected');
        }
    }

    function renderNobles() {
        noblesContainer.innerHTML = '';
        availableNobles.forEach(nobleData => {
            const nobleEl = createNobleElement(nobleData);
            noblesContainer.appendChild(nobleEl);
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
            // Store scroll position of log
             const logScrollTop = logMessagesDiv.scrollTop;
            playerAreaEl.innerHTML = createPlayerAreaElement(player).innerHTML;
             logMessagesDiv.scrollTop = logScrollTop; // Restore scroll position
            const reservedContainer = playerAreaEl.querySelector('.reserved-cards-container');
            if (reservedContainer) {
                reservedContainer.querySelectorAll('.reserved-card-small').forEach(cardEl => {
                    const cardId = cardEl.dataset.cardId;
                    const reservedCardData = player.reservedCards.find(c => c.id === cardId);
                    if (cardId && reservedCardData) {
                        // Use the named wrapper function for removal and addition
                        cardEl.removeEventListener('click', handleReservedCardClickWrapper);
                        cardEl.addEventListener('click', handleReservedCardClickWrapper);
                    }
                });
            }
        } else { console.error("Could not find player or player area to update:", playerId); }
        highlightActivePlayer();
        updateClickableState(); // Update button/affordability states AFTER player area rerendered
    }

    // Wrapper function to handle reserved card clicks properly with event removal
    function handleReservedCardClickWrapper(event) {
        const cardEl = event.currentTarget; // Use currentTarget
        const cardId = cardEl.dataset.cardId;
        handleReservedCardClick(cardId, cardEl);
    }


    function highlightActivePlayer() {
        document.querySelectorAll('.player-area').forEach(el => el.classList.remove('active-player'));
        const activePlayerEl = document.getElementById(`player-area-${currentPlayerIndex}`);
        if (activePlayerEl) activePlayerEl.classList.add('active-player');
    }

    function updateLog(message) {
        const p = document.createElement('p');
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        p.textContent = `[${timestamp}] ${message}`;
        logMessagesDiv.appendChild(p);
        logMessagesDiv.scrollTop = logMessagesDiv.scrollHeight;
    }

    function renderTimer() {
        if(gameSettings.timerMinutes <= 0) { timerDisplay.textContent = "Off"; return; }
        const minutes = Math.floor(turnTimeRemaining / 60);
        const seconds = Math.floor(turnTimeRemaining % 60);
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        timerDisplay.classList.toggle('timer-low', turnTimeRemaining <= TIMER_LOW_THRESHOLD && turnTimeRemaining > 0 && turnTimeRemaining <= 60*gameSettings.timerMinutes);
        if (turnTimeRemaining <= 0 && gameSettings.timerMinutes > 0) { timerDisplay.classList.remove('timer-low'); timerDisplay.textContent = "00:00"; }
        else if (turnTimeRemaining > TIMER_LOW_THRESHOLD) {timerDisplay.classList.remove('timer-low');}

    }

    function createGemElement(type, count, isBank) {
        const gemEl = document.createElement('div');
        gemEl.classList.add('gem', `gem-${type}`);
        if (isBank && type !== GOLD) { // Add dataset only for non-gold bank gems for click handling
             gemEl.dataset.gemType = type;
        }
        if (isBank) {
            const countEl = document.createElement('span');
            countEl.classList.add('gem-count'); countEl.textContent = count;
            gemEl.appendChild(countEl);
        } else {
            // Small gems in player area or selection display
            gemEl.classList.add('small-gems'); // Add class for specific small styling if needed beyond parent container
        }
        return gemEl;
    }


    function createCardElement(cardData, level, index = -1) {
        const cardEl = document.createElement('div');
        if (!cardData) { cardEl.classList.add('card', 'empty-slot'); cardEl.textContent = 'Empty'; return cardEl; }
        cardEl.classList.add('card', `card-border-${cardData.color}`);
        cardEl.dataset.cardId = cardData.id; cardEl.dataset.level = level; if (index !== -1) cardEl.dataset.index = index;
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
        const header = document.createElement('div'); header.classList.add('player-header');
        const nameSpan = document.createElement('span'); nameSpan.classList.add('player-name'); nameSpan.textContent = player.name;
        const scoreSpan = document.createElement('span'); scoreSpan.classList.add('player-score'); scoreSpan.textContent = `VP: ${player.score}`;
        header.appendChild(nameSpan); header.appendChild(scoreSpan);
        const resourcesDiv = document.createElement('div'); resourcesDiv.classList.add('player-resources');
        const gemsHeader = document.createElement('h4'); gemsHeader.textContent = 'Gems';
        const gemsContainer = document.createElement('div'); gemsContainer.classList.add('gems-container', 'small-gems');
        let totalNonGoldGems = 0; // Only count non-gold for display here
        GEM_TYPES.forEach(gemType => {
            const count = player.gems[gemType];
            totalNonGoldGems += count;
            if (count > 0) {
                 const gemEl = createGemElement(gemType, count, true); // isBank=true to get count span
                 gemsContainer.appendChild(gemEl);
             }
        });
         // Add Gold separately without adding to totalGems count for display
         if (player.gems[GOLD] > 0) {
             const goldEl = createGemElement(GOLD, player.gems[GOLD], true); // isBank=true
             gemsContainer.appendChild(goldEl);
         }

        const totalGemsSpan = document.createElement('span'); totalGemsSpan.style.marginLeft = '10px'; totalGemsSpan.style.fontWeight = 'bold'; totalGemsSpan.textContent = `(${totalNonGoldGems}/${MAX_GEMS_PLAYER})`; // Display non-gold total
        gemsContainer.appendChild(totalGemsSpan);

        const bonusHeader = document.createElement('h4'); bonusHeader.textContent = 'Bonuses';
        const bonusContainer = document.createElement('div'); bonusContainer.classList.add('player-cards');
        let hasBonuses = false;
        GEM_TYPES.forEach(gemType => {
            const count = player.bonuses[gemType];
            if (count > 0) { hasBonuses = true; const bonusEl = document.createElement('div'); bonusEl.classList.add('player-card-count', `gem-${gemType}`); bonusEl.textContent = count; bonusContainer.appendChild(bonusEl); }
        });
        if (!hasBonuses) { bonusContainer.textContent = 'None'; bonusContainer.style.fontSize = '0.9em'; bonusContainer.style.color = 'var(--text-tertiary)'; bonusContainer.style.textAlign = 'center'; } // Use CSS var
        const reservedHeader = document.createElement('h4'); reservedHeader.textContent = `Reserved (${player.reservedCards.length}/${MAX_RESERVED_CARDS})`;
        const reservedContainer = document.createElement('div'); reservedContainer.classList.add('reserved-cards-container');
        if (player.reservedCards.length > 0) {
            player.reservedCards.forEach(cardData => {
                const smallCardEl = createSmallReservedCardElement(cardData);
                // Listener added in renderPlayerArea
                reservedContainer.appendChild(smallCardEl);
            });
        } else { reservedContainer.textContent = 'None reserved'; reservedContainer.style.textAlign = 'center'; reservedContainer.style.color = 'var(--text-tertiary)'; } // Use CSS var
        const noblesHeader = document.createElement('h4'); noblesHeader.textContent = `Nobles (${player.nobles.length})`;
        const playerNoblesContainer = document.createElement('div'); playerNoblesContainer.classList.add('nobles-container'); playerNoblesContainer.style.justifyContent = 'flex-start'; playerNoblesContainer.style.marginBottom = '5px'; playerNoblesContainer.style.minHeight = '55px';
        if (player.nobles.length > 0) {
            player.nobles.forEach(nobleData => {
                const nobleEl = createNobleElement(nobleData); nobleEl.style.width = '50px'; nobleEl.style.height = '50px'; nobleEl.querySelector('.noble-vp').style.fontSize = '1.1em'; nobleEl.querySelectorAll('.req-item').forEach(item => item.style.fontSize = '0.7em'); nobleEl.querySelectorAll('.req-gem').forEach(gem => {gem.style.width = '8px'; gem.style.height = '8px'}); playerNoblesContainer.appendChild(nobleEl);
            });
        } else { playerNoblesContainer.textContent = 'None'; playerNoblesContainer.style.fontSize = '0.9em'; playerNoblesContainer.style.color = 'var(--text-tertiary)'; playerNoblesContainer.style.textAlign = 'center'; } // Use CSS var
        resourcesDiv.appendChild(gemsHeader); resourcesDiv.appendChild(gemsContainer); resourcesDiv.appendChild(bonusHeader); resourcesDiv.appendChild(bonusContainer); resourcesDiv.appendChild(reservedHeader); resourcesDiv.appendChild(reservedContainer); resourcesDiv.appendChild(noblesHeader); resourcesDiv.appendChild(playerNoblesContainer);
        playerDiv.appendChild(header); playerDiv.appendChild(resourcesDiv);
        return playerDiv;
    }


    function startTurn() {
        clearSelections();
        highlightActivePlayer();
        renderPlayerArea(currentPlayerIndex);
        startTimer();
        endTurnEarlyBtn.classList.remove('hidden');
    }

    function endTurn(actionTaken = null) {
        stopTimer();
        endTurnEarlyBtn.classList.add('hidden');
        const player = players[currentPlayerIndex];

        clearSelections(); // Clear selection *before* processing end-of-turn checks

        checkForNobleVisit(player, () => {
            checkForGemLimit(player, () => {
                const gameOverTriggeredThisTurn = checkForGameOver(player);
                if (isGameOver) {
                    if (currentPlayerIndex === lastRoundPlayerIndex) {
                         endGame();
                         return;
                    } else {
                         console.log(`Game over condition met, final round continues. Current: ${currentPlayerIndex}, Last round ends after: ${lastRoundPlayerIndex}`);
                    }
                } else if (gameOverTriggeredThisTurn) {
                    lastRoundPlayerIndex = (currentPlayerIndex + players.length - 1) % players.length;
                     console.log(`Player ${player.name} reached ${WINNING_SCORE} VP. Final round starts. Last player index: ${lastRoundPlayerIndex}`);
                     updateLog(`Player ${player.name} reached ${WINNING_SCORE} VP! Final round begins.`);
                }
                currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
                if (currentPlayerIndex === 0 && !isGameOver) turnNumber++;
                updateLog(`Player ${players[currentPlayerIndex].name}'s turn.`);
                startTurn();
            });
        });
    }

    function handleGemClick(gemType, gemEl) {
        // Basic validation checks first
        if (selectedCard) { updateLog("Cancel card selection first."); return; }
        if (isGameOver) { updateLog("Game is over."); return; }
        if (returnGemsOverlay && !returnGemsOverlay.classList.contains('hidden')) { updateLog("Cannot take gems while returning gems."); return; }
        if (gemType === GOLD) { updateLog("Gold cannot be taken directly."); return; }

        const isVisuallySelected = selectedBankElements.has(gemEl); // Check if THIS SPECIFIC element is selected
        const currentSelectionCount = selectedGemTypes.length;
        const countThisTypeSelected = countOccurrences(selectedGemTypes, gemType);

        // --- ⚠️ DEBUGGING ---
        // console.log(`[handleGemClick] Click ${gemType}: Bank=${bank[gemType]}, SelCount=${currentSelectionCount}, TypeCount=${countThisTypeSelected}, isVisualSel=${isVisuallySelected}`);
        // --- END DEBUGGING ---


        // --- SPECIAL CASE: Selecting the Second Identical Gem ---
        // Condition: Exactly 1 gem selected, AND it's the same type as the clicked one, AND bank has enough (>=4)
        if (currentSelectionCount === 1 && selectedGemTypes[0] === gemType && bank[gemType] >= 4) {
            // Even if we clicked the *already selected* visual element (isVisuallySelected = true),
            // the INTENT in this specific state is to add the second one.
            selectedGemTypes.push(gemType);

            // Find a different visual element of the same type to mark as selected
            const otherElement = findNonSelectedBankGemElement(gemType, gemEl); // Pass clicked el to avoid selecting itself
            if (otherElement) {
                selectedBankElements.add(otherElement);
                otherElement.classList.add('selected');
                // Ensure the originally clicked one is also marked if it wasn't the one found
                 if (!selectedBankElements.has(gemEl)) {
                     selectedBankElements.add(gemEl);
                     gemEl.classList.add('selected');
                 }
            } else {
                // Fallback if only one visual element exists but count allows taking two (unlikely UI state)
                // Or if we clicked the only available one twice. Ensure it's marked.
                if (!isVisuallySelected) { // Should already be selected visually from first click
                    selectedBankElements.add(gemEl);
                    gemEl.classList.add('selected');
                }
                console.warn(`Could not find a distinct second visual element for ${gemType}, but logic allows taking two.`);
            }

            updateLog(`Selected second ${gemType}.`); // Optional log message
            updateSelectionInfo();
            updateClickableState();
            return; // Action completed: selected second identical gem
        }


        // --- Handle Deselection ---
        if (isVisuallySelected) {
            // Specific Deselection: Cancel taking 2 identical by clicking one of them
            // (Check if selection count is 2 and both are the clicked type)
             if (currentSelectionCount === 2 && countThisTypeSelected === 2 && selectedGemTypes[0] === gemType && selectedGemTypes[1] === gemType) {
                 updateLog("Selection of two identical gems cancelled.");
                 clearSelections(); // Clear the whole selection
                 return; // Exit early
             }

             // General Deselection: Remove one instance of the clicked type
            const indexToRemove = selectedGemTypes.lastIndexOf(gemType);
            if (indexToRemove > -1) {
                selectedGemTypes.splice(indexToRemove, 1);
                selectedBankElements.delete(gemEl); // Remove THIS specific element
                gemEl.classList.remove('selected'); // Unmark THIS specific element

                // If this was the *only* one of its type selected, remove selection from others too (safety)
                 if (countOccurrences(selectedGemTypes, gemType) === 0) {
                     gemBankContainer.querySelectorAll(`.gem[data-gem-type="${gemType}"].selected`).forEach(el => {
                        selectedBankElements.delete(el);
                         el.classList.remove('selected');
                     });
                 }
                 updateSelectionInfo();
                 updateClickableState();
                 return; // Action completed: deselected a gem
            } else {
                 console.error(`Could not find ${gemType} in selection ${selectedGemTypes} to deselect.`); // Should not happen
            }
        }
        // --- Handle Selection (First gem, or subsequent different gems) ---
        else { // !isVisuallySelected
            // Check conditions that PREVENT selection first:
            let preventedReason = null;
            if (currentSelectionCount >= 3) {
                preventedReason = "Cannot select more than 3 gems.";
            }
            // Check rule: Trying to select a different gem when 2 identical already selected
            else if (currentSelectionCount === 2 && countThisTypeSelected === 0 && new Set(selectedGemTypes).size === 1) {
                 // If 2 identical gems are selected, you cannot select any other gem type.
                 const existingType = selectedGemTypes[0];
                 if (gemType !== existingType) {
                    preventedReason = "Cannot select a different gem when 2 identical are already selected.";
                 } // Note: Clicking the same type again would have been handled by the "cancel" logic above if count was 2.
            }
             // Check rule: Trying to select 2 identical when 2 different already selected
            else if (currentSelectionCount === 2 && countThisTypeSelected >= 1 && new Set(selectedGemTypes).size === 2) {
                 // This condition means you have selected two different gems (A, B)
                 // and are now clicking type A or B again. This is invalid.
                 preventedReason = "Cannot take 2 identical gems after selecting 2 different ones.";
            }
            // Check rule: Is the bank actually empty for this gem?
            else if (bank[gemType] < 1) {
                 preventedReason = `No ${gemType} gems left in the bank.`;
            }
            // Redundant check: Bank < 4 rule (already handled by the special case above, but safe to keep)
            // This only matters now if countThisTypeSelected is 0 and currentSelectionCount < 2
            else if (countThisTypeSelected > 0 && bank[gemType] < 4) {
                 // This case is unlikely to be hit due to the top check, but covers edge cases.
                 preventedReason = `Bank must have at least 4 ${gemType} gems to take two.`;
            }


            if (preventedReason) {
                updateLog(preventedReason);
                updateSelectionInfo();
                updateClickableState();
                return; // Exit early
            } else {
                 // --- Perform Selection ---
                selectedGemTypes.push(gemType);
                selectedBankElements.add(gemEl); // Add the specific clicked element
                gemEl.classList.add('selected'); // Mark the specific clicked element
                 updateSelectionInfo();
                 updateClickableState();
                 return; // Action completed: selected a new gem
            }
        }

        // Fallback if somehow no action was taken
        console.warn("handleGemClick reached end without taking action for:", gemType);
        updateSelectionInfo();
        updateClickableState();
    }

    // Helper function to find a gem element in the bank that isn't selected
    function findNonSelectedBankGemElement(gemType, excludeElement = null) {
        const elements = gemBankContainer.querySelectorAll(`.gem[data-gem-type="${gemType}"]`);
        for (const el of elements) {
            // Check if it's not in the selected set AND not the element we want to exclude (usually the one just clicked)
            if (!selectedBankElements.has(el) && el !== excludeElement) {
                return el; // Return the first available non-selected element
            }
        }
        // If no *other* element found, maybe return the excludeElement if it wasn't selected? Or just null.
        // If the first click selected el, and we click el again to add second, we need *another* element.
        return null; // Indicate no *other* suitable element was found
    }
    // Helper for unique types check within handleGemClick
    function uniqueTypes(arr) {
        return [...new Set(arr)];
    }


    function handleCardClick(type, level, cardId, cardEl) {
        if (selectedGemTypes.length > 0) { updateLog("Cancel gem selection first."); return; }
        if (isGameOver) return;
        const isSelected = selectedCard && selectedCard.element === cardEl;
        if (isSelected) deselectCard();
        else {
            if (selectedCard && selectedCard.element) selectedCard.element.classList.remove('selected');
            selectCard(type, level, cardId, cardEl);
        }
        updateSelectionInfo(); updateClickableState();
    }

    function handleDeckClick(level, deckEl) {
        if (selectedGemTypes.length > 0) { updateLog("Cancel gem selection first."); return; }
        if (isGameOver) return;
        if (decks[level].length === 0) { updateLog(`Deck ${level} is empty.`); return; }
        const player = players[currentPlayerIndex];
        if (player.reservedCards.length >= MAX_RESERVED_CARDS) { updateLog("Reservation full."); return; }
        const isSelected = selectedCard && selectedCard.element === deckEl;
        if (isSelected) deselectCard();
        else {
            if (selectedCard && selectedCard.element) selectedCard.element.classList.remove('selected');
            selectCard('deck', level, null, deckEl);
        }
        updateSelectionInfo(); updateClickableState();
    }

    function handleReservedCardClick(cardId, cardEl) {
        if (selectedGemTypes.length > 0) { updateLog("Cancel gem selection first."); return; }
        if (isGameOver) return;
        const player = players[currentPlayerIndex];
        const cardData = player.reservedCards.find(c => c.id === cardId);
        if (!cardData) { console.error("Reserved card data not found!", cardId); return; }

        const playerArea = cardEl.closest('.player-area');
        if (!playerArea || playerArea.id !== `player-area-${currentPlayerIndex}`) {
             updateLog("Can only select your own reserved cards.");
             return;
        }

        const isSelected = selectedCard && selectedCard.element === cardEl;

        if (isSelected) deselectCard();
        else {
            if (selectedCard && selectedCard.element) selectedCard.element.classList.remove('selected');
            selectCard('reserved', cardData.level, cardId, cardEl);
        }
        updateSelectionInfo(); updateClickableState();
    }

    function selectCard(type, level, cardId, cardEl) {
        selectedCard = { type, level, id: cardId, element: cardEl };
        cardEl.classList.add('selected');
    }

    function deselectCard() {
        if (selectedCard && selectedCard.element) selectedCard.element.classList.remove('selected');
        selectedCard = null;
    }

    function clearSelections() {
        selectedBankElements.forEach(el => el.classList.remove('selected'));
        selectedBankElements.clear(); selectedGemTypes = [];
        deselectCard();
        updateSelectionInfo();
        updateClickableState();
    }

    function cancelSelection() { clearSelections(); }
    cancelActionBtn.addEventListener('click', cancelSelection);

    function updateSelectionInfo() {
        const player = players[currentPlayerIndex];
        dynamicActionButtonsContainer.innerHTML = ''; // Clear previous buttons/messages
        let actionPossible = false;

        // Display Selected Gems
        if (selectedGemTypes.length > 0) {
            selectedGemsDisplay.innerHTML = ''; // Clear placeholder
            const fragment = document.createDocumentFragment(); // Use fragment for efficiency
            const selectionCounts = {};
            selectedGemTypes.forEach(type => selectionCounts[type] = (selectionCounts[type] || 0) + 1);
            Object.keys(selectionCounts).sort().forEach(gemType => {
                 const count = selectionCounts[gemType];
                 for (let i = 0; i < count; i++) {
                    // Create small gem element (isBank=false)
                    const gemEl = createGemElement(gemType, 1, false);
                    fragment.appendChild(gemEl); // Add to fragment
                }
            });
            selectedGemsDisplay.appendChild(fragment); // Append fragment once
            actionPossible = true;
        } else {
            selectedGemsDisplay.textContent = 'None'; // Keep placeholder if nothing selected
        }


        // Display Selected Card
        if (selectedCard) {
            let cardText = ''; const cardData = selectedCard.id ? getCardById(selectedCard.id) : null;
            if (selectedCard.type === 'visible' && cardData) cardText = `L${cardData.level} ${cardData.color}`;
            else if (selectedCard.type === 'reserved' && cardData) cardText = `Reserved L${cardData.level} ${cardData.color}`;
            else if (selectedCard.type === 'deck') cardText = `L${selectedCard.level} Deck`;
            else cardText = 'Error';
            selectedCardDisplay.textContent = cardText;
            actionPossible = true;
        } else {
            selectedCardDisplay.textContent = 'None';
        }

        // Add Dynamic Action Buttons/Messages
        if (player && !isGameOver) {
            if (selectedGemTypes.length > 0) {
                if (validateTakeGems()) {
                    const btn = document.createElement('button'); btn.textContent = 'Confirm Take Gems'; btn.onclick = performTakeGems; dynamicActionButtonsContainer.appendChild(btn);
                } else {
                    const info = document.createElement('span'); info.textContent = "(Invalid Selection)"; dynamicActionButtonsContainer.appendChild(info);
                }
            } else if (selectedCard) {
                const cardData = selectedCard.id ? getCardById(selectedCard.id) : null;
                const canReserve = player.reservedCards.length < MAX_RESERVED_CARDS;
                let purchaseBtn = null, reserveBtn = null;
                if (selectedCard.type === 'visible' && cardData) {
                    const { canAfford } = canAffordCard(player, cardData);
                    if (canAfford) { purchaseBtn = document.createElement('button'); purchaseBtn.textContent = 'Purchase Card'; purchaseBtn.onclick = performPurchaseCard; }
                    if (canReserve) { reserveBtn = document.createElement('button'); reserveBtn.textContent = 'Reserve Card'; reserveBtn.onclick = performReserveCard; }
                } else if (selectedCard.type === 'reserved' && cardData) {
                    const { canAfford } = canAffordCard(player, cardData);
                    if (canAfford) { purchaseBtn = document.createElement('button'); purchaseBtn.textContent = 'Purchase Card'; purchaseBtn.onclick = performPurchaseCard; }
                } else if (selectedCard.type === 'deck') {
                    if (canReserve && decks[selectedCard.level].length > 0) { reserveBtn = document.createElement('button'); reserveBtn.textContent = 'Confirm Reserve Deck'; reserveBtn.onclick = performReserveCard; }
                }
                if (purchaseBtn) dynamicActionButtonsContainer.appendChild(purchaseBtn);
                if (reserveBtn) dynamicActionButtonsContainer.appendChild(reserveBtn);

                // Add descriptive text if no actions are possible for the selected card
                if (!purchaseBtn && !reserveBtn) {
                    const info = document.createElement('span');
                    if (selectedCard.type === 'visible') {
                        info.textContent = canReserve ? "(Cannot Afford)" : "(Cannot Afford / Reservation Full)";
                    } else if (selectedCard.type === 'reserved') {
                        info.textContent = "(Cannot Afford)";
                    } else if (selectedCard.type === 'deck') {
                         info.textContent = canReserve ? "(Deck Empty)" : "(Reservation Full)";
                    }
                    dynamicActionButtonsContainer.appendChild(info);
                }
            }
        }
        cancelActionBtn.classList.toggle('hidden', !actionPossible);
    }

    // Validate Take Gems (Corrected Version)
    function validateTakeGems() {
        const gemTypes = selectedGemTypes;
        if (gemTypes.length === 0) return false; // No gems selected

        const uniqueTypesArr = [...new Set(gemTypes)];
        const selectionCounts = {};
        gemTypes.forEach(g => selectionCounts[g] = (selectionCounts[g] || 0) + 1);

        // Rule 1: Taking 3 different gems
        if (gemTypes.length === 3) {
            if (uniqueTypesArr.length === 3) {
                return uniqueTypesArr.every(type => (bank[type] ?? 0) >= 1);
            } else {
                return false; // 3 gems selected, but not all unique
            }
        }

        // Rule 2: Taking 2 identical gems
        if (gemTypes.length === 2) {
            if (uniqueTypesArr.length === 1) {
                return (bank[uniqueTypesArr[0]] ?? 0) >= 4;
            } else { // 2 unique gems selected
                 return uniqueTypesArr.every(type => (bank[type] ?? 0) >= 1);
            }
        }

        // Rule 3: Taking 1 gem
        if (gemTypes.length === 1) {
             return (bank[uniqueTypesArr[0]] ?? 0) >= 1;
        }

        // If none of the valid conditions (1, 2, or 3 gems) are met
        return false;
    }


    function canAffordCard(player, cardData) {
        if (!cardData) return { canAfford: false, goldNeeded: 0, effectiveCost: {} };
        let goldNeeded = 0; let canAfford = true; const cost = {};
        GEM_TYPES.forEach(gemType => {
            const cardCost = cardData.cost[gemType] || 0; const playerBonus = player.bonuses[gemType] || 0;
            const effectiveCost = Math.max(0, cardCost - playerBonus); cost[gemType] = effectiveCost;
            if (player.gems[gemType] < effectiveCost) goldNeeded += effectiveCost - player.gems[gemType];
        });
        if (player.gems.gold < goldNeeded) canAfford = false;
        return { canAfford, goldNeeded, effectiveCost: cost };
    }

    function performTakeGems() {
        if (!validateTakeGems()) { updateLog("Invalid gem selection just before commit."); clearSelections(); return; }
        const player = players[currentPlayerIndex]; const gemsTaken = {}; const initialBankState = {...bank}; let error = false;
        selectedGemTypes.forEach(type => {
            if (bank[type] > 0) { bank[type]--; player.gems[type]++; gemsTaken[type] = (gemsTaken[type] || 0) + 1; }
            else { console.error(`CRITICAL: Bank empty for ${type}!`); bank = initialBankState; updateLog("Error taking gems: Bank inconsistency."); error = true; }
        });
        if(error) { clearSelections(); return; }
        const gemString = Object.entries(gemsTaken).map(([t, c]) => `${c} ${t}`).join(', ');
        updateLog(`Player ${player.name} took ${gemString} gems.`);
        renderBank();
        renderPlayerArea(player.id);
        endTurn('TAKE_GEMS');
    }

    function performReserveCard() {
        if (!selectedCard || (selectedCard.type !== 'visible' && selectedCard.type !== 'deck')) { updateLog("Invalid selection state for reservation."); clearSelections(); return; }
        const player = players[currentPlayerIndex]; if (player.reservedCards.length >= MAX_RESERVED_CARDS) { updateLog("Reservation limit reached."); clearSelections(); return; }
        let reservedCardData = null; let cardSourceDescription = ""; let actionFailed = false;
        let needsCardRender = false;
        if (selectedCard.type === 'deck') {
            const level = selectedCard.level;
            if (decks[level].length > 0) { reservedCardData = decks[level].pop(); cardSourceDescription = `L${level} deck`; deckCounts[level].textContent = decks[level].length; deckElements[level].classList.toggle('empty', decks[level].length === 0); needsCardRender = true;}
            else { updateLog(`Deck ${level} empty.`); actionFailed = true; }
        } else { // visible card
            const level = selectedCard.level; const cardId = selectedCard.id; const cardIndex = visibleCards[level].findIndex(c => c && c.id === cardId);
            if (cardIndex !== -1 && visibleCards[level][cardIndex]) {
                reservedCardData = visibleCards[level][cardIndex]; cardSourceDescription = `visible L${level} ${reservedCardData.color}`;
                if (decks[level].length > 0) visibleCards[level][cardIndex] = decks[level].pop();
                else visibleCards[level][cardIndex] = null;
                 needsCardRender = true;
            } else { updateLog("Card disappeared?"); actionFailed = true; }
        }
        if (actionFailed || !reservedCardData) { clearSelections(); if (needsCardRender) renderCards(); return; }
        player.reservedCards.push(reservedCardData);
        let gotGold = false; if (bank[GOLD] > 0) { player.gems[GOLD]++; bank[GOLD]--; gotGold = true; }
        updateLog(`Player ${player.name} reserved ${cardSourceDescription}${gotGold ? " + 1 gold." : "."}`);
        if(gotGold) renderBank();
        if(needsCardRender) renderCards();
        renderPlayerArea(player.id);
        endTurn('RESERVE');
    }

    function performPurchaseCard() {
        if (!selectedCard || (selectedCard.type !== 'visible' && selectedCard.type !== 'reserved')) { updateLog("Invalid selection state for purchase."); clearSelections(); return; }
        const player = players[currentPlayerIndex]; let purchasedCardData = null; let cardSource = selectedCard.type; let originalCardIndex = -1;
         let needsCardRender = false;

        if (cardSource === 'visible') {
            const cardId = selectedCard.id; const level = selectedCard.level; const cardIndex = visibleCards[level].findIndex(c => c && c.id === cardId);
            if (cardIndex !== -1 && visibleCards[level][cardIndex]) {
                 purchasedCardData = visibleCards[level][cardIndex];
            } else { updateLog("Card disappeared?"); clearSelections(); renderCards(); return; }
        } else { // reserved
            originalCardIndex = player.reservedCards.findIndex(c => c.id === selectedCard.id);
            if (originalCardIndex !== -1) {
                 purchasedCardData = player.reservedCards[originalCardIndex];
             } else { updateLog("Reserved card error."); clearSelections(); return; }
        }
        const { canAfford, goldNeeded, effectiveCost } = canAffordCard(player, purchasedCardData); if (!canAfford) { updateLog("Cannot afford card (checked again)."); clearSelections(); return; }
        let goldSpent = 0; let error = false;
        GEM_TYPES.forEach(gemType => {
            const cost = effectiveCost[gemType]; const playerHas = player.gems[gemType]; const gemsToPay = Math.min(cost, playerHas);
            player.gems[gemType] -= gemsToPay; bank[gemType] = (bank[gemType] ?? 0) + gemsToPay;
            const remainingCost = cost - gemsToPay;
            if (remainingCost > 0) {
                if (player.gems[GOLD] >= remainingCost) { player.gems[GOLD] -= remainingCost; bank[GOLD] = (bank[GOLD] ?? 0) + remainingCost; goldSpent += remainingCost; }
                else { console.error(`CRITICAL: Gold mismatch! Need ${remainingCost}, have ${player.gems.gold}`); updateLog("Error processing payment - gold mismatch."); error = true;}
            }
        });
        if(error) { clearSelections(); return; }
        updateLog(`Player ${player.name} purchased L${purchasedCardData.level} ${purchasedCardData.color} (Gold: ${goldSpent}).`);
        player.cards.push(purchasedCardData); player.score += purchasedCardData.vp; player.bonuses[purchasedCardData.color]++;
        if (cardSource === 'visible') {
            const level = purchasedCardData.level; const cardIndex = visibleCards[level].findIndex(c => c && c.id === purchasedCardData.id);
            if (cardIndex !== -1) {
                if (decks[level].length > 0) visibleCards[level][cardIndex] = decks[level].pop();
                else visibleCards[level][cardIndex] = null;
                needsCardRender = true;
            }
            else console.error("Purchased card missing after payment!");
        } else { // reserved
            player.reservedCards.splice(originalCardIndex, 1);
        }
        renderBank();
        if (needsCardRender) renderCards();
        renderPlayerArea(player.id);
        endTurn('PURCHASE');
    }

    function checkForGemLimit(player, callback) {
         const totalNonGoldGems = Object.values(player.gems).reduce((sum, count, index) => index < GEM_TYPES.length ? sum + count : sum, 0); // Only count non-gold
         if (totalNonGoldGems > MAX_GEMS_PLAYER) {
             gemsToReturn = totalNonGoldGems - MAX_GEMS_PLAYER;
             updateLog(`Player ${player.name} must return ${gemsToReturn} non-gold gems.`);
             showReturnGemsOverlay(player, totalNonGoldGems, callback);
          }
         else if (callback) callback();
    }
    function showReturnGemsOverlay(player, totalNonGoldGems, callback) {
         returnGemsCountSpan.textContent = `${totalNonGoldGems}/${MAX_GEMS_PLAYER}`;
         returnGemsPlayerDisplay.innerHTML = ''; selectedGemsToReturn = []; returnGemsSelectionDisplay.textContent = `Selected to return: 0/${gemsToReturn}`; confirmReturnGemsBtn.disabled = true;

         GEM_TYPES.forEach(gemType => {
             for (let i = 0; i < player.gems[gemType]; i++) {
                const gemEl = createGemElement(gemType, 1, false);
                gemEl.classList.add('clickable'); gemEl.dataset.returnGemType = gemType;
                gemEl.dataset.gemInstanceId = `${gemType}-${i}`;
                gemEl.addEventListener('click', () => toggleReturnGemSelection(gemType, gemEl));
                returnGemsPlayerDisplay.appendChild(gemEl);
            }
        });

         if (player.gems.gold > 0) {
            const goldStackEl = createGemElement(GOLD, player.gems.gold, true);
            goldStackEl.style.pointerEvents = 'none';
            goldStackEl.style.opacity = 0.5;
            goldStackEl.style.cursor = 'not-allowed';
            goldStackEl.style.marginLeft = '10px';
            goldStackEl.title = "Gold cannot be returned";
             const countSpan = goldStackEl.querySelector('.gem-count');
             if(countSpan) countSpan.style.display='none';
             goldStackEl.textContent = player.gems.gold; // Show count as text
            returnGemsPlayerDisplay.appendChild(goldStackEl);
         }

         confirmReturnGemsBtn.onclick = () => handleConfirmReturnGems(player, callback); returnGemsOverlay.classList.remove('hidden');
    }
    function toggleReturnGemSelection(gemType, gemEl) {
        const instanceId = gemEl.dataset.gemInstanceId;
        const selectionItem = { type: gemType, element: gemEl, id: instanceId };
        const index = selectedGemsToReturn.findIndex(item => item.element === gemEl);

        if (index !== -1) { // Deselect
            selectedGemsToReturn.splice(index, 1); gemEl.classList.remove('selected');
        } else if (selectedGemsToReturn.length < gemsToReturn) { // Select
             selectedGemsToReturn.push(selectionItem); gemEl.classList.add('selected');
        }
        returnGemsSelectionDisplay.textContent = `Selected to return: ${selectedGemsToReturn.length}/${gemsToReturn}`; confirmReturnGemsBtn.disabled = selectedGemsToReturn.length !== gemsToReturn;
    }
    function handleConfirmReturnGems(player, callback) {
        if (selectedGemsToReturn.length !== gemsToReturn) return;
        const returnedCounts = {}; selectedGemsToReturn.forEach(gemInfo => { if (player.gems[gemInfo.type] > 0) { player.gems[gemInfo.type]--; bank[gemInfo.type] = (bank[gemInfo.type] ?? 0) + 1; returnedCounts[gemInfo.type] = (returnedCounts[gemInfo.type] || 0) + 1; } else console.error(`Error returning ${gemInfo.type}`); });
        const returnString = Object.entries(returnedCounts).map(([type, count]) => `${count} ${type}`).join(', '); updateLog(`Player ${player.name} returned ${returnString} gems.`);
        returnGemsOverlay.classList.add('hidden'); renderBank(); renderPlayerArea(player.id); selectedGemsToReturn = []; gemsToReturn = 0; if (callback) callback();
    }

    function checkForNobleVisit(player, callback) {
        const eligibleNobles = availableNobles.filter(noble => GEM_TYPES.every(gemType => (player.bonuses[gemType] || 0) >= (noble.requirements[gemType] || 0)));
        if (eligibleNobles.length === 0) { if (callback) callback(); }
        else if (eligibleNobles.length === 1) { awardNoble(player, eligibleNobles[0]); if (callback) callback(); }
        else {
            updateLog(`Player ${player.name} qualifies for multiple nobles. Choose one.`); showNobleChoiceOverlay(player, eligibleNobles, callback); }
    }
    function showNobleChoiceOverlay(player, eligibleNobles, callback) {
        nobleChoiceOptionsContainer.innerHTML = ''; eligibleNobles.forEach(nobleData => { const nobleEl = createNobleElement(nobleData); nobleEl.classList.add('clickable'); nobleEl.addEventListener('click', () => handleNobleChoice(player, nobleData, callback)); nobleChoiceOptionsContainer.appendChild(nobleEl); }); nobleChoiceOverlay.classList.remove('hidden');
    }
    function handleNobleChoice(player, chosenNoble, callback) {
        if(availableNobles.some(n => n.id === chosenNoble.id)) awardNoble(player, chosenNoble); else { console.warn(`Chosen noble ${chosenNoble.id} no longer available?`); updateLog("Selected noble was no longer available."); }
        nobleChoiceOverlay.classList.add('hidden'); if (callback) callback();
    }
    function awardNoble(player, nobleData) {
        updateLog(`Noble ${nobleData.id} visits Player ${player.name} (+${nobleData.vp} VP).`);
        player.nobles.push(nobleData); player.score += nobleData.vp; availableNobles = availableNobles.filter(n => n.id !== nobleData.id);
        renderNobles(); renderPlayerArea(player.id);
    }

     function checkForGameOver(player) {
        if (!isGameOver && player.score >= WINNING_SCORE) {
            isGameOver = true;
            lastRoundPlayerIndex = (currentPlayerIndex + players.length - 1) % players.length;
             console.log(`Game over triggered by Player ${player.name} (Index: ${currentPlayerIndex}). Final turn is for Player ${lastRoundPlayerIndex}.`);
             updateLog(`Player ${player.name} triggered the end game! Final round in progress.`);
             return true;
         }
         return false;
    }

    function endGame() {
        console.log("Ending game. Calculating final scores."); stopTimer(); isGameOver = true; endTurnEarlyBtn.classList.add('hidden'); clearSelections();
        let highestScore = -1; players.forEach(p => { if (p.score > highestScore) highestScore = p.score; });
        let potentialWinners = players.filter(p => p.score === highestScore); let winners = [];
        if (potentialWinners.length === 1) winners = potentialWinners;
        else { let minCards = Infinity; potentialWinners.forEach(p => { if (p.cards.length < minCards) minCards = p.cards.length; }); winners = potentialWinners.filter(p => p.cards.length === minCards); }
        finalScoresDiv.innerHTML = ''; const sortedPlayers = [...players].sort((a, b) => (b.score !== a.score) ? b.score - a.score : a.cards.length - b.cards.length);
        sortedPlayers.forEach(p => { const scoreP = document.createElement('p'); const isWinner = winners.some(w => w.id === p.id); scoreP.textContent = `${p.name}: ${p.score} VP (${p.cards.length} cards)`; if (isWinner) { scoreP.classList.add('winner'); scoreP.textContent = `🏆 ${scoreP.textContent} - Winner!`; } finalScoresDiv.appendChild(scoreP); });
        if (winners.length > 1) { const tieMessage = document.createElement('p'); tieMessage.textContent = `It's a tie between ${winners.map(w=>w.name).join(' and ')}!`; tieMessage.style.fontWeight = 'bold'; finalScoresDiv.appendChild(tieMessage); updateLog(`Game ended in a tie between ${winners.map(w=>w.name).join(' and ')} with ${highestScore} points.`); }
        else if (winners.length === 1) updateLog(`Game ended. Winner: ${winners[0].name} with ${highestScore} points!`);
        document.querySelectorAll('.gem, .card, .deck, .reserved-card-small, .noble').forEach(el => { el.classList.add('not-selectable'); el.style.cursor = 'default'; el.onclick = null; }); // Make everything unclickable
        updateClickableState();
        gameOverOverlay.classList.remove('hidden');
    }

    playAgainBtn.addEventListener('click', () => {
        gameOverOverlay.classList.add('hidden'); setupScreen.classList.remove('hidden'); setupScreen.classList.add('active'); gameContainer.classList.remove('active'); gameContainer.classList.add('hidden');
         setupPlayerNameInputs();
         applyDarkModePreference();
    });

    function startTimer() {
        stopTimer(); if (gameSettings.timerMinutes <= 0) { timerDisplay.textContent = "Off"; return; } turnTimeRemaining = turnDuration; renderTimer();
        turnTimerInterval = setInterval(() => { turnTimeRemaining--; renderTimer(); if (turnTimeRemaining < 0) { updateLog(`Player ${players[currentPlayerIndex].name}'s turn timed out.`); stopTimer(); clearSelections(); endTurn('TIMEOUT'); } }, 1000);
    }
    function stopTimer() {
        clearInterval(turnTimerInterval); turnTimerInterval = null;
    }

    function updateClickableState() {
        const player = players[currentPlayerIndex];
        const disableAllActions = isGameOver;
        const disableGemsDueToCard = selectedCard !== null;
        const disableActionDueToReturn = returnGemsOverlay && !returnGemsOverlay.classList.contains('hidden');

        const selectionLen = selectedGemTypes.length;
        const uniqueSelectedTypes = [...new Set(selectedGemTypes)];
        const selectionCounts = {};
        selectedGemTypes.forEach(g => selectionCounts[g] = (selectionCounts[g] || 0) + 1);
        const hasSelectedTwoIdentical = selectionLen === 2 && uniqueSelectedTypes.length === 1;
        const hasSelectedOne = selectionLen === 1;

        // --- Gem Bank Clickability ---
        gemBankContainer.querySelectorAll('.gem').forEach(gemEl => {
            const gemType = gemEl.dataset.gemType;
            const isGold = !gemType;
            const countInBank = bank[isGold ? GOLD : gemType] ?? 0;
            // isVisuallySelected check removed from the initial disableClick calculation

            // Initial checks based on game state and non-selection rules
            let disableClick = disableAllActions ||
                               disableGemsDueToCard ||
                               disableActionDueToReturn ||
                               isGold ||                  // Cannot select gold
                               countInBank === 0;       // Cannot select if bank is empty
                               // Removed: isVisuallySelected

            // Apply selection rules ONLY if the gem is not already disabled for basic reasons AND is not gold
            if (!disableClick && gemType) {
                // Rule: Cannot select if already holding 3 gems.
                if (selectionLen >= 3) {
                    disableClick = true;
                }
                // Rule: Check rules related to having selected ONLY ONE gem previously
                else if (hasSelectedOne) {
                    const previouslySelectedType = selectedGemTypes[0];
                     // Sub-rule: Trying to select the *second identical* gem
                     if (gemType === previouslySelectedType) {
                         // Must have at least 4 in the bank to take the second
                         if (countInBank < 4) {
                             disableClick = true;
                         }
                         // If countInBank >= 4, this gem remains clickable (disableClick is not set)
                     }
                     // Sub-rule: Trying to select a *second different* gem (Allowed, no change to disableClick needed here)
                }
                 // Rule: Check rules related to having selected TWO gems previously
                 else if (selectionLen === 2) {
                     // Sub-rule: If 2 identical already selected, cannot select a different one.
                     if (hasSelectedTwoIdentical && gemType !== selectedGemTypes[0]) {
                         disableClick = true;
                     }
                     // Sub-rule: If 2 different already selected, cannot select an identical copy of one of them.
                     else if (uniqueSelectedTypes.length === 2 && (gemType === selectedGemTypes[0] || gemType === selectedGemTypes[1])) {
                         disableClick = true;
                     }
                 }
            }

            // Apply the final decision
            // Note: Even if disableClick is false here, handleGemClick will correctly
            // interpret a click on a visually selected gem as a deselection attempt.
            gemEl.classList.toggle('not-selectable', disableClick);
        });

        // --- Card/Deck Clickability (Check if returning gems) ---
        // ... (rest of the function remains the same) ...
        document.querySelectorAll('#cards-area .card:not(.empty-slot), #cards-area .deck').forEach(el => {
             const isCard = el.classList.contains('card') && !el.classList.contains('empty-slot');
             const isDeck = el.classList.contains('deck');
             let disableClick = disableAllActions || selectedGemTypes.length > 0 || disableActionDueToReturn; // Simplified base checks
             const canReserve = player && player.reservedCards.length < MAX_RESERVED_CARDS;

             if (!disableClick) { // Only apply specific checks if not already disabled
                 if (isDeck && el.classList.contains('empty')) disableClick = true;

                 if (!selectedCard) { // Check intent rules if no card is selected
                     if (isDeck && !canReserve) disableClick = true;
                     if (isCard) {
                         const cardData = getCardById(el.dataset.cardId);
                         if (cardData && !canAffordCard(player, cardData).canAfford && !canReserve) {
                              disableClick = true;
                         }
                     }
                 } else if (selectedCard.element !== el) { // Disable others if one card is selected
                     disableClick = true;
                 }
             }

             el.classList.toggle('not-selectable', disableClick);
        });


        // --- Reserved Card Clickability (Check if returning gems) ---
        document.querySelectorAll('.player-area .reserved-card-small').forEach(cardEl => {
            let disableClick = true; // Default to disabled
            const playerArea = cardEl.closest('.player-area');

            // Enable only if: not game over, no gems selected, not returning gems, is current player's card
            if (!disableAllActions && selectedGemTypes.length === 0 && !disableActionDueToReturn &&
                player && playerArea && playerArea.id === `player-area-${player.id}`)
            {
                // Further check: if a card is selected, only the selected one is clickable
                if (selectedCard && selectedCard.element !== cardEl) {
                    disableClick = true;
                } else {
                    disableClick = false; // Passes all checks
                }
            }
            cardEl.classList.toggle('not-selectable', disableClick);
        });


        // --- Affordability Styling (No change needed here) ---
        if (player && !disableAllActions && !disableActionDueToReturn) {
            document.querySelectorAll('#cards-area .card:not(.empty-slot)').forEach(cardEl => {
                const cardData = getCardById(cardEl.dataset.cardId);
                cardEl.classList.toggle('not-affordable', cardData && !canAffordCard(player, cardData).canAfford);
            });
            document.querySelectorAll(`#player-area-${player.id} .reserved-card-small`).forEach(cardEl => {
                const cardData = player.reservedCards.find(c => c.id === cardEl.dataset.cardId);
                 cardEl.classList.toggle('not-affordable', cardData && !canAffordCard(player, cardData).canAfford);
            });
             players.forEach(p => {
                if (p.id !== player.id) {
                    document.querySelectorAll(`#player-area-${p.id} .reserved-card-small`).forEach(cardEl => {
                        cardEl.classList.remove('not-affordable');
                    });
                }
             });
        } else {
             document.querySelectorAll('.card.not-affordable, .reserved-card-small.not-affordable').forEach(el => el.classList.remove('not-affordable'));
        }
    }


    function getCardById(id) {
        if (!id) return null;
        for(let level = 1; level <= 3; level++) {
            const card = visibleCards[level].find(c => c && c.id === id);
             if (card) return card;
         }
        for (const p of players) { // Check all players' reserved cards
            const card = p.reservedCards.find(c => c && c.id === id);
             if (card) return card;
         }
        return null;
    }

    function getNobleById(id) {
        let noble = availableNobles.find(n => n.id === id); if (noble) return noble;
        for (const player of players) { noble = player.nobles.find(n => n.id === id); if (noble) return noble; }
        return null;
    }
    function hideOverlays() {
        returnGemsOverlay.classList.add('hidden'); gameOverOverlay.classList.add('hidden'); nobleChoiceOverlay.classList.add('hidden');
    }

    function setupEventListeners() {
        deckElements[1].addEventListener('click', () => handleDeckClick(1, deckElements[1]));
        deckElements[2].addEventListener('click', () => handleDeckClick(2, deckElements[2]));
        deckElements[3].addEventListener('click', () => handleDeckClick(3, deckElements[3]));

        endTurnEarlyBtn.addEventListener('click', () => {
            if (selectedGemTypes.length > 0 || selectedCard) { updateLog("Cancel selection first."); return; }
            if(isGameOver) { updateLog("Game is over."); return; }
            updateLog(`Player ${players[currentPlayerIndex].name} ended turn early.`);
            stopTimer(); endTurn('EARLY_END');
        });
         // Gem/Card/Reserved listeners added dynamically
    }

    // Initial setup calls
    setupPlayerNameInputs();
    setupEventListeners();
    applyDarkModePreference(); // Apply theme preference on initial load

});
// --- END OF FILE script.js ---