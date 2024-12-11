class Minesweeper {
    constructor(rows = 9, cols = 9, mines = 10) {
        this.rows = rows;
        this.cols = cols;
        this.mines = mines;
        this.board = [];
        this.revealed = new Set();
        this.flagged = new Set();
        this.gameOver = false;
        this.gameStarted = false;
        this.timer = 0;
        this.timerInterval = null;
        this.difficulty = this.getDifficulty();
        this.init();
    }

    getDifficulty() {
        const totalCells = this.rows * this.cols;
        if (totalCells <= 81 && this.mines <= 10) return 'beginner';
        if (totalCells <= 256 && this.mines <= 40) return 'intermediate';
        return 'expert';
    }

    init() {
        // Initialize empty board
        for (let i = 0; i < this.rows; i++) {
            this.board[i] = new Array(this.cols).fill(0);
        }

        // Place mines randomly
        let minesPlaced = 0;
        while (minesPlaced < this.mines) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            if (this.board[row][col] !== -1) {
                this.board[row][col] = -1;
                minesPlaced++;
            }
        }

        // Calculate numbers
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col] === -1) continue;
                this.board[row][col] = this.countAdjacentMines(row, col);
            }
        }
    }

    countAdjacentMines(row, col) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                if (newRow >= 0 && newRow < this.rows && 
                    newCol >= 0 && newCol < this.cols && 
                    this.board[newRow][newCol] === -1) {
                    count++;
                }
            }
        }
        return count;
    }

    reveal(row, col) {
        if (!this.gameStarted) {
            this.startTimer();
            this.gameStarted = true;
        }

        if (this.gameOver || this.flagged.has(`${row},${col}`)) return;

        const key = `${row},${col}`;
        if (this.revealed.has(key)) return;

        this.revealed.add(key);

        if (this.board[row][col] === -1) {
            this.gameOver = true;
            this.revealAll();
            this.stopTimer();
            alert('Game Over!');
            return;
        }

        if (this.board[row][col] === 0) {
            // Reveal adjacent cells for empty cells
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const newRow = row + i;
                    const newCol = col + j;
                    if (newRow >= 0 && newRow < this.rows && 
                        newCol >= 0 && newCol < this.cols) {
                        this.reveal(newRow, newCol);
                    }
                }
            }
        }

        this.checkWin();
    }

    toggleFlag(row, col) {
        if (this.gameOver || this.revealed.has(`${row},${col}`)) return;

        const key = `${row},${col}`;
        if (this.flagged.has(key)) {
            this.flagged.delete(key);
        } else {
            this.flagged.add(key);
        }

        document.getElementById('mineCount').textContent = 
            this.mines - this.flagged.size;
    }

    revealAll() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.revealed.add(`${row},${col}`);
            }
        }
        this.renderBoard();
    }

    checkWin() {
        const totalCells = this.rows * this.cols;
        const safeCells = totalCells - this.mines;
        if (this.revealed.size === safeCells) {
            this.gameOver = true;
            this.stopTimer();
            const score = this.timer;
            this.saveHighScore(score);
            alert('Congratulations! You won in ' + score + ' seconds!');
        }
    }

    saveHighScore(score) {
        const highScores = JSON.parse(localStorage.getItem(`highScores_${this.difficulty}`) || '[]');
        highScores.push({
            score,
            date: new Date().toISOString(),
            grid: `${this.rows}x${this.cols}`,
            mines: this.mines
        });
        
        // Sort and keep only top 10 scores
        highScores.sort((a, b) => a.score - b.score);
        highScores.splice(10);
        
        localStorage.setItem(`highScores_${this.difficulty}`, JSON.stringify(highScores));
        updateHighScoreDisplay(this.difficulty);
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            document.getElementById('timer').textContent = this.timer;
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }

    renderBoard() {
        const board = document.getElementById('board');
        board.style.gridTemplateColumns = `repeat(${this.cols}, minmax(0, 1fr))`;
        board.innerHTML = '';

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                const key = `${row},${col}`;
                
                cell.className = 'w-10 h-10 flex items-center justify-center font-bold cursor-pointer select-none';
                
                if (this.revealed.has(key)) {
                    if (this.board[row][col] === -1) {
                        cell.className += ' bg-red-500 dark:bg-red-600 text-white';
                        cell.textContent = '💣';
                    } else {
                        cell.className += ' bg-gray-100 dark:bg-gray-800 dark:text-gray-100';
                        if (this.board[row][col] > 0) {
                            cell.textContent = this.board[row][col];
                            const colors = [
                                'text-blue-500 dark:text-blue-400',
                                'text-green-500 dark:text-green-400',
                                'text-red-500 dark:text-red-400',
                                'text-purple-500 dark:text-purple-400',
                                'text-yellow-600 dark:text-yellow-400',
                                'text-pink-500 dark:text-pink-400',
                                'text-gray-600 dark:text-gray-400',
                                'text-gray-800 dark:text-gray-300'
                            ];
                            cell.className += ` ${colors[this.board[row][col] - 1]}`;
                        }
                    }
                } else {
                    cell.className += ' bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500';
                    if (this.flagged.has(key)) {
                        cell.textContent = '🚩';
                    }
                }

                const currentRow = row;
                const currentCol = col;
                
                if (isMobile) {
                    cell.addEventListener('click', () => handleCellClick(currentRow, currentCol));
                } else {
                    cell.addEventListener('mousedown', (e) => {
                        e.preventDefault();
                        handleCellClick(currentRow, currentCol, e.button === 2);
                    });
                }

                board.appendChild(cell);
            }
        }
    }
}

// Settings and UI Controls
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const cancelSettings = document.getElementById('cancelSettings');
const saveSettings = document.getElementById('saveSettings');
const rowsInput = document.getElementById('rowsInput');
const colsInput = document.getElementById('colsInput');
const minesInput = document.getElementById('minesInput');

// Load saved settings or set defaults
let gameSettings = JSON.parse(localStorage.getItem('gameSettings')) || {
    rows: 9,
    cols: 9,
    mines: 10
};

// Initialize input values
function initializeSettings() {
    rowsInput.value = gameSettings.rows;
    colsInput.value = gameSettings.cols;
    minesInput.value = gameSettings.mines;

    // Set min/max values
    rowsInput.addEventListener('input', updateMinesLimit);
    colsInput.addEventListener('input', updateMinesLimit);
    updateMinesLimit();
}

function updateMinesLimit() {
    const totalCells = rowsInput.value * colsInput.value;
    minesInput.max = Math.floor(totalCells * 0.85); // Maximum 85% of cells can be mines
    minesInput.min = Math.max(1, Math.floor(totalCells * 0.1)); // Minimum 10% of cells
    
    // Update mines if current value is out of bounds
    if (minesInput.value > minesInput.max) {
        minesInput.value = minesInput.max;
    } else if (minesInput.value < minesInput.min) {
        minesInput.value = minesInput.min;
    }
}

// Settings modal controls
settingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
});

cancelSettings.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
    initializeSettings(); // Reset to current settings
});

saveSettings.addEventListener('click', () => {
    const newSettings = {
        rows: parseInt(rowsInput.value),
        cols: parseInt(colsInput.value),
        mines: parseInt(minesInput.value)
    };

    // Validate settings
    const totalCells = newSettings.rows * newSettings.cols;
    if (newSettings.mines >= totalCells) {
        alert('Too many mines for the grid size!');
        return;
    }

    // Save settings
    gameSettings = newSettings;
    localStorage.setItem('gameSettings', JSON.stringify(gameSettings));
    
    // Start new game with new settings
    game.stopTimer();
    game = new Minesweeper(gameSettings.rows, gameSettings.cols, gameSettings.mines);
    game.renderBoard();
    document.getElementById('timer').textContent = '0';
    document.getElementById('mineCount').textContent = game.mines;
    
    settingsModal.classList.add('hidden');
});

// Initialize settings
initializeSettings();

// Mobile controls
let isFlagMode = false;
const modeToggle = document.getElementById('modeToggle');
const currentMode = document.getElementById('currentMode');
const mobileFlagBtn = document.getElementById('mobileFlagBtn');
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

if (isMobile) {
    modeToggle.addEventListener('click', () => {
        isFlagMode = !isFlagMode;
        currentMode.textContent = isFlagMode ? 'Flag' : 'Reveal';
        modeToggle.classList.toggle('bg-red-500');
        modeToggle.classList.toggle('bg-blue-500');
    });

    mobileFlagBtn.addEventListener('click', () => {
        isFlagMode = !isFlagMode;
        currentMode.textContent = isFlagMode ? 'Flag' : 'Reveal';
        modeToggle.classList.toggle('bg-red-500');
        modeToggle.classList.toggle('bg-blue-500');
    });
}

// High Score functionality
const highScoreBtn = document.getElementById('highScoreBtn');
const highScoreModal = document.getElementById('highScoreModal');
const closeHighScores = document.getElementById('closeHighScores');
const beginnerScores = document.getElementById('beginnerScores');
const intermediateScores = document.getElementById('intermediateScores');
const expertScores = document.getElementById('expertScores');

function updateHighScoreDisplay(difficulty) {
    const highScores = JSON.parse(localStorage.getItem(`highScores_${difficulty}`) || '[]');
    const highScoreList = document.getElementById('highScoreList');
    
    // Update difficulty buttons
    [beginnerScores, intermediateScores, expertScores].forEach(btn => {
        btn.className = 'flex-1 py-2 px-4 rounded';
        if (btn.id.startsWith(difficulty)) {
            btn.className += ' bg-blue-500 text-white';
        } else {
            btn.className += ' bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
        }
    });

    // Display scores
    highScoreList.innerHTML = highScores.length ? '' : '<p class="text-gray-500 dark:text-gray-400 text-center">No scores yet</p>';
    
    highScores.forEach((score, index) => {
        const date = new Date(score.date).toLocaleDateString();
        highScoreList.innerHTML += `
            <div class="flex justify-between items-center p-2 ${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} rounded">
                <div class="flex items-center gap-2">
                    <span class="font-bold text-gray-700 dark:text-gray-300">${index + 1}.</span>
                    <span class="text-gray-900 dark:text-gray-100">${score.score}s</span>
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                    ${score.grid} • ${score.mines} mines • ${date}
                </div>
            </div>
        `;
    });
}

highScoreBtn.addEventListener('click', () => {
    highScoreModal.classList.remove('hidden');
    updateHighScoreDisplay('beginner');
});

closeHighScores.addEventListener('click', () => {
    highScoreModal.classList.add('hidden');
});

beginnerScores.addEventListener('click', () => updateHighScoreDisplay('beginner'));
intermediateScores.addEventListener('click', () => updateHighScoreDisplay('intermediate'));
expertScores.addEventListener('click', () => updateHighScoreDisplay('expert'));

// Update cell click handling for mobile
function handleCellClick(row, col, isRightClick = false) {
    if (isMobile) {
        if (isFlagMode) {
            game.toggleFlag(row, col);
        } else {
            game.reveal(row, col);
        }
    } else {
        if (isRightClick) {
            game.toggleFlag(row, col);
        } else {
            game.reveal(row, col);
        }
    }
    game.renderBoard();
}

// Initialize game with saved settings
let game = new Minesweeper(gameSettings.rows, gameSettings.cols, gameSettings.mines);
game.renderBoard();

// New game button
document.getElementById('newGameBtn').addEventListener('click', () => {
    game.stopTimer();
    game = new Minesweeper(gameSettings.rows, gameSettings.cols, gameSettings.mines);
    game.renderBoard();
    document.getElementById('timer').textContent = '0';
    document.getElementById('mineCount').textContent = game.mines;
});

// Dark mode toggle
const darkModeToggle = document.getElementById('darkModeToggle');
const html = document.documentElement;

// Check for saved dark mode preference
if (localStorage.getItem('darkMode') === 'true') {
    html.classList.add('dark');
}

darkModeToggle.addEventListener('click', () => {
    html.classList.toggle('dark');
    localStorage.setItem('darkMode', html.classList.contains('dark'));
});

// Prevent context menu on right-click
document.addEventListener('contextmenu', e => e.preventDefault());
