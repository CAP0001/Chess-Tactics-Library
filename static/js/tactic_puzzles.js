document.addEventListener('DOMContentLoaded', function () {
    const config = window.TacticConfig;
    if (!config) return;
    const solutionMoves = config.solutionMoves || [];
    const initialFen = config.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    
    const moveSound = new Audio('https://images.chesscomfiles.com/chess-themes/sounds/standard/move-self.mp3');
    const captureSound = new Audio('https://images.chesscomfiles.com/chess-themes/sounds/standard/capture.mp3');
    
    // Проверяем сохраненные решения при загрузке
    document.querySelectorAll('.puzzle-square-indicator').forEach(el => {
        const href = el.getAttribute('href');
        if (localStorage.getItem('puzzle_solved_' + href) === 'true') {
            el.style.backgroundColor = '#4CAF50';
        }
    });

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
    let currentStepIndex = 0;
    let isPuzzleSolved = false;
    let selectedSquare = null;

    const stepInfo = document.getElementById('step-info');
    const movesContainer = document.getElementById('moves-list-container');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');

    if (nextBtn) nextBtn.style.display = 'none';

    const sidebar = document.querySelector('.chess-sidebar');
    let statusBanner = document.getElementById('puzzle-status-banner');
    if (!statusBanner && sidebar) {
        statusBanner = document.createElement('div');
        statusBanner.id = 'puzzle-status-banner';
        statusBanner.style.cssText = 'margin-top: 15px; padding: 10px; text-align: center; font-weight: bold; font-size: 1.05em; border-radius: 6px; background-color: var(--scroll-bg); min-height: 40px; display: flex; align-items: center; justify-content: center;';
        sidebar.appendChild(statusBanner);
    }

    if (prevBtn) {
        prevBtn.innerText = '🔄 Сбросить';
        prevBtn.onclick = function() {
            game.load(initialFen);
            currentStepIndex = 0;
            isPuzzleSolved = false;
            selectedSquare = null;
            removeHighlights();
            board.position(game.fen());
            updateLastMoveHighlight(null, null);
            renderPlayedMoves([]);
            if (statusBanner) {
                statusBanner.innerText = '';
                statusBanner.style.color = 'inherit';
            }
            updateState();
        };
    }

    renderPlayedMoves([]);
    
    function highlightSquare(square) {
        const $square = $('#board .square-' + square);
        $square.addClass('highlight-selected');
    }

    function removeHighlights() {
        $('#board .square-55d63').removeClass('highlight-selected hint-empty hint-capture');
    }

    function showHintsForSquare(square) {
        removeHighlights();
        selectedSquare = square;
        
        const moves = game.moves({ square: square, verbose: true });
        moves.forEach(m => {
            const $targetSquare = $('#board .square-' + m.to);
            const targetPiece = game.get(m.to);
            
            if (targetPiece) {
                $targetSquare.addClass('hint-capture');
            } else {
                $targetSquare.addClass('hint-empty');
            }
        });
    }

    // Функция обновления подсветки последнего хода
    function updateLastMoveHighlight(fromSquare, toSquare) {
        document.querySelectorAll('.square-55d63, square').forEach(el => {
            el.classList.remove('highlight-last-move');
        });

        if (!fromSquare || !toSquare) return;

        const fromEl = document.querySelector(`.square-${fromSquare}`);
        const toEl = document.querySelector(`.square-${toSquare}`);

        if (fromEl) fromEl.classList.add('highlight-last-move');
        if (toEl) toEl.classList.add('highlight-last-move');
    }

    function onSquareClick(square) {
        if (isPuzzleSolved) return;

        const piece = game.get(square);
        const turn = game.turn();

        if (piece && ((turn === 'w' && piece.color === 'w') || (turn === 'b' && piece.color === 'b'))) {
            if (selectedSquare === square) {
                selectedSquare = null;
                removeHighlights();
                return;
            }
            showHintsForSquare(square);
            return;
        }

        if (selectedSquare) {
            const move = game.move({
                from: selectedSquare,
                to: square,
                promotion: 'q'
            });

            if (move === null) {
                selectedSquare = null;
                removeHighlights();
                return;
            }

            processPlayerMove(move);
            selectedSquare = null;
            removeHighlights();
        }
    }

    function onDrop(source, target) {
        if (isPuzzleSolved) return 'snapback';

        const move = game.move({
            from: source,
            to: target,
            promotion: 'q'
        });

        if (move === null) return 'snapback';

        processPlayerMove(move);
        selectedSquare = null;
        removeHighlights();
    }

    function processPlayerMove(move) {
        const expectedMoveStr = solutionMoves[currentStepIndex];

        const cleanMoveSan = move.san.replace(/[+#!?]/g, '');
        const cleanExpected = expectedMoveStr ? expectedMoveStr.replace(/[+#!?]/g, '') : '';

        const isCorrect = (
            move.san === expectedMoveStr || 
            (move.from + move.to) === expectedMoveStr || 
            cleanMoveSan === cleanExpected ||
            move.to === expectedMoveStr
        );

        if (isCorrect) {
            playMoveSound(move);
            currentStepIndex++;
            
            updateLastMoveHighlight(move.from, move.to);

            renderPlayedMoves(solutionMoves.slice(0, currentStepIndex));
            if (statusBanner) {
                statusBanner.innerText = '✅ Правильно!';
                statusBanner.style.color = '#4CAF50';
            }
            updateState();

            if (currentStepIndex >= solutionMoves.length) {
                isPuzzleSolved = true;
                if (statusBanner) {
                    statusBanner.innerText = '🎉 Задача успешно решена!';
                    statusBanner.style.color = '#4CAF50';
                }
                
                localStorage.setItem('puzzle_solved_' + window.location.pathname, 'true');
                
                const activeSquareIndicator = document.querySelector('.puzzle-square-indicator.current-puzzle');
                if (activeSquareIndicator) {
                    activeSquareIndicator.style.backgroundColor = '#4CAF50';
                }
                return;
            }

            // Автоматический ответ противника с плавной анимацией
            setTimeout(() => {
                const opponentMoveStr = solutionMoves[currentStepIndex];
                const computerMove = game.move(opponentMoveStr);
                
                if (computerMove) {
                    playMoveSound(computerMove);
                    board.position(game.fen(), true);
                    
                    setTimeout(() => {
                        updateLastMoveHighlight(computerMove.from, computerMove.to);
                    }, 250);
                    
                    currentStepIndex++;
                    
                    renderPlayedMoves(solutionMoves.slice(0, currentStepIndex));
                    updateState();

                    if (currentStepIndex >= solutionMoves.length) {
                        isPuzzleSolved = true;
                        if (statusBanner) {
                            statusBanner.innerText = '🎉 Задача успешно решена!';
                            statusBanner.style.color = '#4CAF50';
                        }
                    }
                }
            }, 400);

        } else {
            game.undo();
            board.position(game.fen());
            playMoveSound({ captured: false });
            if (statusBanner) {
                statusBanner.innerText = '❌ Неправильный ход! Попробуйте еще раз.';
                statusBanner.style.color = '#e74c3c';
            }
            return 'snapback';
        }
    }

    // Вспомогательная функция для перевода HEX в RGBA с полупрозрачностью
    function hexToRgbA(hex, alpha = 0.42) {
        let c = hex.replace('#', '');
        if (c.length === 3) {
            c = c.split('').map(char => char + char).join('');
        }
        const num = parseInt(c, 16);
        return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
    }

    // Обработчик выбора цвета подсветки хода
    const colorPicker = document.getElementById('move-color-picker');
    if (colorPicker) {
        const savedColor = localStorage.getItem('custom_move_highlight_color');
        if (savedColor) {
            colorPicker.value = savedColor;
            document.documentElement.style.setProperty('--last-move-color', hexToRgbA(savedColor, 0.42));
        }

        colorPicker.addEventListener('input', function (e) {
            const hexColor = e.target.value;
            document.documentElement.style.setProperty('--last-move-color', hexToRgbA(hexColor, 0.42));
            localStorage.setItem('custom_move_highlight_color', hexColor);
        });
    }

    function renderPlayedMoves(playedList) {
        if (!movesContainer) return;
        if (playedList.length === 0) {
            movesContainer.innerHTML = '<p class="moves-placeholder">Найдите правильный ход...</p>';
            return;
        }

        let html = '';
        let moveNum = 1;
        let isBlackStart = initialFen.split(' ')[1] === 'b';
        
        let listIdx = 0;
        if (isBlackStart) {
            let bMove = playedList[0];
            html += `<div style="margin-bottom: 6px; display: flex; align-items: center;"><span class="move-number" style="width: 35px; font-weight: bold;">${moveNum}.</span><span style="margin-right: 35px;">...</span><span class="chess-move-item chess-move-active">${bMove}</span></div>`;
            moveNum++;
            listIdx = 1;
        }

        for (let i = listIdx; i < playedList.length; i += 2) {
            let wMove = playedList[i];
            let bMove = (i + 1 < playedList.length) ? playedList[i + 1] : null;

            html += `<div style="margin-bottom: 6px; display: flex; align-items: center;">`;
            html += `<span class="move-number" style="width: 35px; font-weight: bold;">${moveNum}.</span>`;
            html += `<span class="chess-move-item chess-move-active" style="margin-right: 15px;">${wMove}</span>`;
            if (bMove) {
                html += `<span class="chess-move-item chess-move-active">${bMove}</span>`;
            }
            html += `</div>`;
            moveNum++;
        }

        movesContainer.innerHTML = html;
    }

    const board = Chessboard('board', {
        draggable: true,
        position: initialFen,
        width: 720,
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
        onDragStart: function(source, piece) {
            if (isPuzzleSolved) return false;
            const turn = game.turn();
            if ((turn === 'w' && piece.search(/^b/) !== -1) || (turn === 'b' && piece.search(/^w/) !== -1)) {
                return false;
            }
            selectedSquare = source;
            showHintsForSquare(source);
        },
        onDrop: onDrop,
        onSnapEnd: function() {
            board.position(game.fen());
        }
    });

    $('#board').on('click', '.square-55d63', function() {
        const square = $(this).attr('data-square');
        if (square) onSquareClick(square);
    });

    function updateState() {
        if (stepInfo) {
            stepInfo.innerText = isPuzzleSolved ? "Решено!" : `Ход за: ${game.turn() === 'w' ? 'Белых' : 'Черных'}`;
        }
    }

    updateState();
});