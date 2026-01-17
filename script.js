document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('bingo-board');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const resetBtn = document.getElementById('reset-btn');
    const winDialog = document.getElementById('win-message');
    const closeWinBtn = document.getElementById('close-win-btn');

    // Load state from local storage or initialize
    let gameState = JSON.parse(localStorage.getItem('saraSunitBingo2026')) || {
        checked: [], // Array of indices checked
        hasWon: false
    };

    // Ensure we have a valid configuration of items
    // We expect 24 items in bingoData.js. If less, we fill with placeholders.
    const items = [...bingoData];
    while (items.length < 24) {
        items.push("Bonus Adventure");
    }
    // Limit to 24 if more
    const finalItems = items.slice(0, 24);

    // Insert Free Space at index 12 (center of 5x5 = 25 cells, index 0-24)
    // Actually, let's map the 25 cells.
    // Indices: 0-11 take items 0-11
    // Index 12 is free space
    // Indices 13-24 take items 12-23

    const gridContent = [];
    let itemIndex = 0;

    for (let i = 0; i < 25; i++) {
        if (i === 12) {
            gridContent.push({ text: "2026<br>✨", isFree: true });
        } else {
            gridContent.push({ text: finalItems[itemIndex], isFree: false });
            itemIndex++;
        }
    }

    // Render Board
    function renderBoard() {
        boardElement.innerHTML = '';
        gridContent.forEach((cell, index) => {
            const cellDiv = document.createElement('div');
            cellDiv.className = 'bingo-cell';
            if (cell.isFree) {
                cellDiv.classList.add('free-space');
                cellDiv.classList.add('active'); // Free space always active
                cellDiv.innerHTML = cell.text;
            } else {
                cellDiv.innerText = cell.text;
                // Check if active in state
                if (gameState.checked.includes(index)) {
                    cellDiv.classList.add('active');
                }

                // Click handler
                cellDiv.onclick = () => toggleCell(index);
            }
            boardElement.appendChild(cellDiv);
        });
        updateProgress();
    }

    function toggleCell(index) {
        if (index === 12) return; // Ignore free space click (always active)

        const idx = gameState.checked.indexOf(index);

        if (idx > -1) {
            // Uncheck
            gameState.checked.splice(idx, 1);
        } else {
            // Check
            gameState.checked.push(index);
            triggerConfetti(0.5); // Small burst
        }

        saveState();
        renderBoard();
        checkWin();
    }

    function updateProgress() {
        // Free space is always "done" but let's count only user actions or total?
        // Let's count total active including free space.
        // Free space index is not in checked[] usually, unless we put it there. 
        // Let's handle it manually.

        const totalChecked = gameState.checked.length + 1; // +1 for free space
        const percentage = (totalChecked / 25) * 100;

        progressFill.style.width = `${percentage}%`;
        progressText.innerText = `${totalChecked}/25 Completed`;
    }

    function saveState() {
        localStorage.setItem('saraSunitBingo2026', JSON.stringify(gameState));
    }

    function checkWin() {
        // Win conditions: Rows, Cols, Diagonals
        // Indices: 0-4, 5-9, ...
        const wins = [
            [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24], // Rows
            [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24], // Cols
            [0, 6, 12, 18, 24], [4, 8, 12, 16, 20] // Diagonals
        ];

        let isBingo = false;

        // Current active indices including free space (12)
        const activeIndices = new Set([...gameState.checked, 12]);

        for (let combination of wins) {
            if (combination.every(idx => activeIndices.has(idx))) {
                isBingo = true;
                break;
            }
        }

        if (isBingo && !gameState.hasWon) {
            showWin();
            gameState.hasWon = true;
            saveState();
        } else if (!isBingo) {
            gameState.hasWon = false; // Reset win state if they uncheck and lose bingo
            saveState();
        }
    }

    function showWin() {
        winDialog.classList.add('show');
        triggerConfetti(1);
        triggerConfetti(1);
    }

    function triggerConfetti(multiplier) {
        const count = 200 * multiplier;
        const defaults = {
            origin: { y: 0.7 }
        };

        function fire(particleRatio, opts) {
            confetti(Object.assign({}, defaults, opts, {
                particleCount: Math.floor(count * particleRatio)
            }));
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    }

    resetBtn.addEventListener('click', () => {
        if (confirm("Start fresh for 2026? This will clear your board.")) {
            gameState = { checked: [], hasWon: false };
            saveState();
            renderBoard();
        }
    });

    closeWinBtn.addEventListener('click', () => {
        winDialog.classList.remove('show');
    });

    // Initial render
    renderBoard();
});
