document.addEventListener('DOMContentLoaded', function () {
    const config = window.TacticConfig;
    if (!config) return;

    let movesList = config.solutionMoves || [];
    if (movesList.length === 0) return;

    const initialFen = config.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    
    const game = new Chess(initialFen);
    const board = Chessboard('board', {
        draggable: false,
        position: initialFen,
        width: 350,
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
    });

    let currentIndex = -1; // -1 — старт

    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const stepInfo = document.getElementById('step-info');
    const movesContainer = document.getElementById('moves-list-container');

    if (!nextBtn) return;

    renderMovesList();

    // Кнопка «Вперед»
    nextBtn.addEventListener('click', function () {
        if (currentIndex < movesList.length - 1) {
            currentIndex++;
            game.move(movesList[currentIndex]);
            board.position(game.fen());
            updateState();
        }
    });

    // Кнопка «Назад»
    prevBtn.addEventListener('click', function () {
        if (currentIndex >= 0) {
            game.load(initialFen);
            for (let i = 0; i <= currentIndex - 1; i++) {
                game.move(movesList[i]);
            }
            board.position(game.fen());
            currentIndex--;
            updateState();
        }
    });

    // Рендер списка ходов справа
    function renderMovesList() {
        movesContainer.innerHTML = '';
        let html = '';
        
        // Группируем ходы по парам (Белые / Черные)
        for (let i = 0; i < movesList.length; i += 2) {
            let moveNum = Math.floor(i / 2) + 1;
            let whiteMove = movesList[i] || '';
            let blackMove = movesList[i + 1] || '';

            html += `<div class="move-row" style="margin-bottom: 4px;">
                <span style="color: #7f8c8d; display: inline-block; width: 30px;">${moveNum}.</span> 
                <span id="move-${i}" style="padding: 2px 4px; border-radius: 4px;">${whiteMove}</span> 
                <span id="move-${i+1}" style="padding: 2px 4px; border-radius: 4px; margin-left: 10px;">${blackMove}</span>
            </div>`;
        }
        movesContainer.innerHTML = html;
    }

    // Обновление подсветки хода и статуса
    function updateState() {
        stepInfo.innerText = `Шаг ${currentIndex + 1} из ${movesList.length}`;

        // Сбрасываем всю подсветку в списке
        document.querySelectorAll('[id^="move-"]').forEach(el => {
            el.style.backgroundColor = 'transparent';
        });

        // Подсвечиваем текущий ход в правой колонке
        if (currentIndex >= 0) {
            const currentMoveElement = document.getElementById(`move-${currentIndex}`);
            if (currentMoveElement) {
                currentMoveElement.style.backgroundColor = '#3498db';
                currentMoveElement.style.color = '#fff';
            }
        }
    }
});