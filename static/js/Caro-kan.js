document.addEventListener('DOMContentLoaded', function () {
    const config = window.TacticConfig;
    if (!config) return;
    const mainLine = config.solutionMoves || [];
    const initialFen = config.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    
    const game = new Chess(initialFen);
    const board = Chessboard('board', {
        draggable: false,
        position: initialFen,
        width: 360,
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
    });

    let currentIndex = -1;
    let currentLine = mainLine;
    let history = []; 

    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const stepInfo = document.getElementById('step-info');
    const movesContainer = document.getElementById('moves-list-container');
    const branchContainer = document.getElementById('branch-container');
    const branchButtons = document.getElementById('branch-buttons');

    if (!nextBtn) return;

    renderMovesList(mainLine);

    // Кнопка «Вперед»
    nextBtn.addEventListener('click', function () {
        if (currentIndex < currentLine.length - 1) {
            currentIndex++;
            let step = currentLine[currentIndex];
            
            if (typeof step === 'object' && step.branchChoices) {
                showBranches(step.branchChoices);
                return;
            }

            let moveStr = typeof step === 'object' ? step.move : step;
            game.move(moveStr);
            board.position(game.fen());
            
            history.push({ 
                index: currentIndex, 
                line: currentLine,
                fen: game.fen() 
            });
            
            updateState();
        }
    });

    // Кнопка «Назад»
    prevBtn.addEventListener('click', function () {
        branchContainer.style.display = 'none';

        if (history.length > 0) {
            history.pop();
            
            if (history.length > 0) {
                let prevState = history[history.length - 1];
                currentIndex = prevState.index;
                currentLine = prevState.line;
                game.load(prevState.fen);
            } else {
                currentIndex = -1;
                currentLine = mainLine;
                game.load(initialFen);
            }

            board.position(game.fen());
            updateState();
        } else {
            currentIndex = -1;
            currentLine = mainLine;
            game.load(initialFen);
            board.position(game.fen());
            updateState();
        }
    });

    // Рендер списка ходов с поддержкой клика для перехода
    function renderMovesList(line) {
        movesContainer.innerHTML = '';
        let html = '';
        
        for (let i = 0; i < line.length; i++) {
            let s = line[i];
            if (typeof s === 'object' && s.branchChoices) continue; // Пропускаем объект развилки в тексте

            // Считаем номера ходов (каждые 2 полухода — это 1 полный ход)
            if (i % 2 === 0) {
                let moveNum = Math.floor(i / 2) + 1;
                html += `<div style="margin-bottom: 4px;"><span class="move-number">${moveNum}.</span>`;
            }

            let moveStr = typeof s === 'object' ? s.move : s;
            html += `<span id="move-${i}" class="chess-move-item" data-index="${i}" style="margin-right: 8px; cursor: pointer;">${moveStr}</span>`;

            if (i % 2 !== 1 || i === line.length - 1) {
                html += `</div>`;
            }
        }
        movesContainer.innerHTML = html;

        // Добавляем обработчик клика на каждый ход в списке
        document.querySelectorAll('.chess-move-item').forEach(item => {
            item.addEventListener('click', function () {
                let targetIndex = parseInt(this.getAttribute('data-index'));
                jumpToStep(targetIndex);
            });
        });
    }

    // Функция прыжка к конкретному ходу по клику
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

        board.position(game.fen());
        branchContainer.style.display = 'none';
        updateState();
    }

    // Показ кнопок развилки (вертикально)
    function showBranches(choices) {
        branchContainer.style.display = 'block';
        branchButtons.innerHTML = '';

        choices.forEach(branch => {
            const btn = document.createElement('button');
            btn.className = 'chess-btn';
            btn.innerText = branch.name;
            btn.onclick = function () {
                branchContainer.style.display = 'none';
                currentLine = branch.moves;
                currentIndex = -1;
                renderMovesList(currentLine);
                nextBtn.click();
            };
            branchButtons.appendChild(btn);
        });
    }

    // Обновление подсветки
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