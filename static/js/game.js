document.addEventListener('DOMContentLoaded', function () {
    const gameConfig = window.DjangoChessConfig || {};
    if (!gameConfig.updateUrl) return; 

    const initialFen = gameConfig.fen || 'start';
    const csrfToken = gameConfig.csrfToken || '';
    const updateUrl = gameConfig.updateUrl;

    const startBtn = document.getElementById('start-game-btn');
    const gameContainer = document.getElementById('game-container');

    if (!startBtn) return;

    let board = null;
    let game = null;
    let pendingMove = null; // Переменная для сохранения хода пешки до выбора фигуры

    // Запускаем игру по нажатию на кнопку
    startBtn.addEventListener('click', function () {
        startBtn.style.display = 'none';
        gameContainer.style.display = 'block';

        game = new Chess(initialFen);

        const config = {
            draggable: true,
            position: initialFen,
            width: 350,
            pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
            onDragStart: onDragStart,
            onDrop: onDrop,
            onSnapEnd: onSnapEnd
        };

        board = Chessboard('board', config);
        updateStatus();
    });
    
    function saveGame() {
        fetch(updateUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({ fen: game.fen() })
        })
        .then(response => response.json())
        .then(data => console.log('Игра сохранена:', data.fen))
        .catch(error => console.error('Ошибка сохранения:', error));
    }

    function onDragStart(source, piece, position, orientation) {
        if (game.game_over()) return false;
        if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
            (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
            return false;
        }
    }

    function onDrop(source, target) {
        const piece = game.get(source);
        if (piece && piece.type === 'p' && ((piece.color === 'w' && target[1] === '8') || (piece.color === 'b' && target[1] === '1'))) {
            pendingMove = { from: source, to: target };
            document.getElementById('promotion-dialog').style.display = 'block';
            return; 
        }

        const move = game.move({
            from: source,
            to: target,
            promotion: 'q'
        });

        if (move === null) return 'snapback';

        updateStatus();
        saveGame();
    }


    document.querySelectorAll('.promo-piece').forEach(el => {
        el.addEventListener('click', function () {
            const promotionPiece = this.getAttribute('data-piece');
            document.getElementById('promotion-dialog').style.display = 'none';

            if (pendingMove) {
                const move = game.move({
                    from: pendingMove.from,
                    to: pendingMove.to,
                    promotion: promotionPiece
                });

                board.position(game.fen());
                updateStatus();
                saveGame();
                pendingMove = null;
            }
        });
    });

    function onSnapEnd() {
        board.position(game.fen());
    }

    function updateStatus() {
        let status = '';
        let moveColor = game.turn() === 'b' ? 'Черные' : 'Белые';

        if (game.in_checkmate()) {
            status = 'Мат! Победили ' + (moveColor === 'Белые' ? 'Черные' : 'Белые');
        } else if (game.in_draw()) {
            status = 'Ничья';
        } else {
            status = 'Ход: ' + moveColor;
            if (game.in_check()) {
                status += ', Шах!';
            }
        }
        $('#status').text(status);
    }
});