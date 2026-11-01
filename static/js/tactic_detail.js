document.addEventListener('DOMContentLoaded', function () {
    const config = window.TacticConfig;
    if (!config) return;
    const mainLine = config.solutionMoves || [];
    const initialFen = config.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    
    // Инициализация звуков в стиле Chess.com
    const moveSound = new Audio('https://images.chesscomfiles.com/chess-themes/sounds/standard/move-self.mp3');
    const captureSound = new Audio('https://images.chesscomfiles.com/chess-themes/sounds/standard/capture.mp3');

    function playMoveSound(moveResult) {
        if (!moveResult) return;
        try {
            if (moveResult.captured) {
                captureSound.currentTime = 0;
                captureSound.play().catch(e => console.log("Аудио заблокировано", e));
            } else {
                moveSound.currentTime = 0;
                moveSound.play().catch(e => console.log("Аудио заблокировано", e));
            }
        } catch (err) {
            console.log("Ошибка воспроизведения звука", err);
        }
    }

    const game = new Chess(initialFen);
    const board = Chessboard('board', {
        draggable: false,
        position: initialFen,
        width: 720,
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
    });

    let currentIndex = -1;
    let currentLine = mainLine;
    let history = []; 
    
    // Переменные для отслеживания спама
    let lastClickTime = 0;
    let spamThreshold = 300; // Если кликают чаще чем раз в 300мс — включаем мгновенный прыжок

    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const stepInfo = document.getElementById('step-info');
    const movesContainer = document.getElementById('moves-list-container');
    const branchContainer = document.getElementById('branch-container');
    const branchButtons = document.getElementById('branch-buttons');

    if (!nextBtn) return;

    renderMovesList(mainLine);

    // Кнопка «Вперед» со спам-контролем
    nextBtn.addEventListener('click', function () {
        let now = Date.now();
        let isSpamming = (now - lastClickTime) < spamThreshold;
        lastClickTime = now;

        if (currentIndex < currentLine.length - 1) {
            currentIndex++;
            let step = currentLine[currentIndex];
            
            if (typeof step === 'object' && step.branchChoices) {
                showBranches(step.branchChoices);
                return;
            }

            let moveStr = typeof step === 'object' ? step.move : step;
            let moveResult = game.move(moveStr); 
            playMoveSound(moveResult);           
            
            // Если спамит — анимация false (мгновенно на место), иначе true (плавно)
            board.position(game.fen(), !isSpamming);    
            
            history.push({ 
                index: currentIndex, 
                line: currentLine,
                fen: game.fen() 
            });
            
            updateState();
        }
    });

    // Кнопка «Назад» со спам-контролем
    prevBtn.addEventListener('click', function () {
        let now = Date.now();
        let isSpamming = (now - lastClickTime) < spamThreshold;
        lastClickTime = now;

        branchContainer.style.display = 'none';

        if (history.length > 0) {
            history.pop();
            
            if (history.length > 0) {
                let prevState = history[history.length - 1];
                currentIndex = prevState.index;
                
                if (currentLine !== prevState.line) {
                    currentLine = prevState.line;
                    renderMovesList(currentLine);
                }

                game.load(prevState.fen);
            } else {
                currentIndex = -1;
                if (currentLine !== mainLine) {
                    currentLine = mainLine;
                    renderMovesList(mainLine);
                }
                game.load(initialFen);
            }

            board.position(game.fen(), !isSpamming); // Мгновенно при спаме, плавно в обычном режиме
            updateState();
        } else {
            currentIndex = -1;
            if (currentLine !== mainLine) {
                currentLine = mainLine;
                renderMovesList(mainLine);
            }
            game.load(initialFen);
            board.position(game.fen(), !isSpamming); 
            updateState();
        }
    });

    // Рендер списка ходов
    function renderMovesList(line) {
        movesContainer.innerHTML = '';
        let html = '';
        
        let moveNum = 1;
        let whiteMove = null;
        let blackMove = null;
        let whiteIndex = -1;
        let blackIndex = -1;

        let cleanMoves = [];
        for (let i = 0; i < line.length; i++) {
            let s = line[i];
            if (typeof s === 'object' && s.branchChoices) continue;
            cleanMoves.push({
                move: typeof s === 'object' ? s.move : s,
                originalIndex: i
            });
        }

        for (let i = 0; i < cleanMoves.length; i++) {
            if (i % 2 === 0) {
                whiteMove = cleanMoves[i].move;
                whiteIndex = cleanMoves[i].originalIndex;
                blackMove = null;
                blackIndex = -1;
            } else {
                blackMove = cleanMoves[i].move;
                blackIndex = cleanMoves[i].originalIndex;
                
                html += renderRow(moveNum, whiteMove, whiteIndex, blackMove, blackIndex);
                moveNum++;
                whiteMove = null;
            }
        }

        if (whiteMove !== null) {
            html += renderRow(moveNum, whiteMove, whiteIndex, null, -1);
        }

        movesContainer.innerHTML = html;

        document.querySelectorAll('.chess-move-item').forEach(item => {
            item.addEventListener('click', function () {
                let targetIndex = parseInt(this.getAttribute('data-index'));
                jumpToStep(targetIndex);
            });
        });
    }

    function renderRow(moveNum, wMove, wIdx, bMove, bIdx) {
        let rowHtml = `<div style="margin-bottom: 6px; display: flex; align-items: center;">`;
        rowHtml += `<span class="move-number" style="width: 35px; font-weight: bold;">${moveNum}.</span>`;

        if (wMove) {
            rowHtml += `<span id="move-${wIdx}" class="chess-move-item" data-index="${wIdx}" style="margin-right: 15px; cursor: pointer; padding: 2px 8px; border-radius: 4px;">${wMove}</span>`;
        } else {
            rowHtml += `<span style="margin-right: 35px; display: inline-block;">...</span>`;
        }

        if (bMove) {
            rowHtml += `<span id="move-${bIdx}" class="chess-move-item" data-index="${bIdx}" style="cursor: pointer; padding: 2px 8px; border-radius: 4px;">${bMove}</span>`;
        }

        rowHtml += `</div>`;
        return rowHtml;
    }

    function jumpToStep(targetIndex) {
        game.load(initialFen);
        history = [];
        currentIndex = targetIndex;

        for (let i = 0; i <= targetIndex; i++) {
            let s = currentLine[i];
            let m = typeof s === 'object' ? s.move : s;
            if (m) {
                game.move(m);
                history.push({
                    index: i,
                    line: currentLine,
                    fen: game.fen()
                });
            }
        }

        board.position(game.fen(), false); 
        branchContainer.style.display = 'none';
        updateState();
    }

    function showBranches(choices) {
        branchContainer.style.display = 'block';
        branchButtons.innerHTML = '';

        choices.forEach(branch => {
            const btn = document.createElement('button');
            btn.className = 'chess-btn';
            btn.innerText = branch.name;
            btn.onclick = function () {
                branchContainer.style.display = 'none';
                
                let branchStartIndex = currentIndex;
                let basePart = currentLine.slice(0, branchStartIndex + 1);
                currentLine = basePart.concat(branch.moves);
                
                renderMovesList(currentLine);
                nextBtn.click();
            };
            branchButtons.appendChild(btn);
        });
    }

    function updateState() {
        stepInfo.innerText = currentIndex === -1 ? "Шаг 0" : `Шаг ${currentIndex + 1} из ${currentLine.length}`;

        document.querySelectorAll('.chess-move-item').forEach(el => {
            el.classList.remove('chess-move-active');
        });

        if (currentIndex >= 0) {
            const activeEl = document.getElementById(`move-${currentIndex}`);
            if (activeEl) activeEl.classList.add('chess-move-active');
        }
    }
});