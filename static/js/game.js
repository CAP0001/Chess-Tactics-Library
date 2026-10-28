document.addEventListener('DOMContentLoaded', function () {
    const gameConfig = window.DjangoChessConfig || {};
    
    // Если мы не на странице шахмат, этот конфиг будет пустым — просто выходим из скрипта
    if (!gameConfig.updateUrl) return; 

    const initialFen = gameConfig.fen || 'start';
    const csrfToken = gameConfig.csrfToken || '';
    const updateUrl = gameConfig.updateUrl;

    let board = null;
    const game = new Chess(initialFen);

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
        const move = game.move({
            from: source,
            to: target,
            promotion: 'q'
        });

        if (move === null) return 'snapback';

        updateStatus();
        saveGame();
    }

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

    const config = {
        draggable: true,
        position: initialFen,
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    };

    board = Chessboard('board', config);
    updateStatus();
});