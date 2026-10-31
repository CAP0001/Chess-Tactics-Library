document.addEventListener('DOMContentLoaded', function () {
    const config = window.TacticConfig;
    if (!config) return;
    const mainLine = config.solutionMoves || [];
    const initialFen = config.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    
    // Инициализация звуков в стиле Chess.com
    const moveSound = new Audio('https://images.chesscomfiles.com/chess-themes/sounds/standard/move-self.mp3');
    const captureSound = new Audio('https://images.chesscomfiles.com/chess-themes/sounds/standard/capture.mp3');

    // Функция проигрывания звука хода или взятия
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
            let moveResult = game.move(moveStr); // Делаем ход и получаем объект результата
            playMoveSound(moveResult);           // Воспроизводим звук (ход или взятие)
            
            board.position(game.fen(), true);    // Плавная анимация для одиночного шага
            
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

            board.position(game.fen(), false); // Отключаем анимацию при возврате назад
            updateState();
        } else {
            currentIndex = -1;
            currentLine = mainLine;
            game.load(initialFen);
            board.position(game.fen(), false); // Отключаем анимацию в начальной позиции
            updateState();
        }
    });

    // Рендер списка ходов: парами (ход белых и ход черных на одной строке)
    function renderMovesList(line) {
        movesContainer.innerHTML = '';
        let html = '';
        
        let moveNum = 1;
        for (let i = 0; i < line.length; i += 2) {
            let sWhite = line[i];
            let sBlack = line[i + 1];

            // Пропускаем объекты развилок, если они попадаются в списке
            if (typeof sWhite === 'object' && sWhite.branchChoices) continue;

            html += `<div style="margin-bottom: 6px; display: flex; align-items: center;">`;
            html += `<span class="move-number" style="width: 35px; font-weight: bold;">${moveNum}.</span>`;

            // Ход белых
            if (sWhite) {
                let moveStrWhite = typeof sWhite === 'object' ? sWhite.move : sWhite;
                html += `<span id="move-${i}" class="chess-move-item" data-index="${i}" style="margin-right: 15px; cursor: pointer; padding: 2px 8px; border-radius: 4px;">${moveStrWhite}</span>`;
            }

            // Ход черных (если он есть в текущей линии)
            if (sBlack) {
                if (typeof sBlack !== 'object' || !sBlack.branchChoices) {
                    let moveStrBlack = typeof sBlack === 'object' ? sBlack.move : sBlack;
                    html += `<span id="move-${i + 1}" class="chess-move-item" data-index="${i + 1}" style="cursor: pointer; padding: 2px 8px; border-radius: 4px;">${moveStrBlack}</span>`;
                }
            }

            html += `</div>`;
            moveNum++;
        }

        movesContainer.innerHTML = html;

        // Добавляем обработчик клика на каждый ход в списке для прыжка к нему
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

        board.position(game.fen(), false); // Отключаем анимацию при мгновенном прыжке по списку
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