import React, { useState, useEffect } from 'react';

const CheckersGame = () => {
  // Initialize 8x8 board with pieces
  const initializeBoard = () => {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Place red pieces (player) on top rows
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          board[row][col] = { color: 'red', isKing: false };
        }
      }
    }
    
    // Place black pieces (AI) on bottom rows
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          board[row][col] = { color: 'black', isKing: false };
        }
      }
    }
    
    return board;
  };

  const [board, setBoard] = useState(initializeBoard);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState('red');
  const [gameStatus, setGameStatus] = useState('playing');
  const [aiThinking, setAiThinking] = useState(false);
  const [apiLogs, setApiLogs] = useState([]);
  const [createdObjects, setCreatedObjects] = useState([]);

  const addApiLog = (log) => {
    setApiLogs(prev => [...prev, { ...log, timestamp: new Date().toISOString() }]);
  };

  // Get valid moves for a piece
  const getValidMoves = (board, row, col) => {
    const piece = board[row][col];
    if (!piece) return [];
    
    const moves = [];
    const directions = piece.isKing ? 
      [[-1, -1], [-1, 1], [1, -1], [1, 1]] : 
      piece.color === 'red' ? [[1, -1], [1, 1]] : [[-1, -1], [-1, 1]];
    
    directions.forEach(([dRow, dCol]) => {
      const newRow = row + dRow;
      const newCol = col + dCol;
      
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        if (!board[newRow][newCol]) {
          moves.push({ row: newRow, col: newCol, type: 'move' });
        } else if (board[newRow][newCol].color !== piece.color) {
          // Check for jump
          const jumpRow = newRow + dRow;
          const jumpCol = newCol + dCol;
          if (jumpRow >= 0 && jumpRow < 8 && jumpCol >= 0 && jumpCol < 8 && !board[jumpRow][jumpCol]) {
            moves.push({ row: jumpRow, col: jumpCol, type: 'jump', capturedRow: newRow, capturedCol: newCol });
          }
        }
      }
    });
    
    return moves;
  };

  // Make a move on the board
  const makeMove = (fromRow, fromCol, toRow, toCol, capturedRow = null, capturedCol = null) => {
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[fromRow][fromCol];
    
    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;
    
    if (capturedRow !== null && capturedCol !== null) {
      newBoard[capturedRow][capturedCol] = null;
    }
    
    // Check for king promotion
    if ((piece.color === 'red' && toRow === 7) || (piece.color === 'black' && toRow === 0)) {
      newBoard[toRow][toCol].isKing = true;
    }
    
    return newBoard;
  };

  // Convert board to string for AI analysis
  const boardToString = (board) => {
    return board.map((row, rowIndex) => 
      row.map((cell, colIndex) => {
        if (!cell) return '.';
        const symbol = cell.color === 'red' ? 'R' : 'B';
        return cell.isKing ? symbol.toLowerCase() : symbol;
      }).join(' ')
    ).join('\n');
  };

  // Get all possible moves for a player
  const getAllMoves = (board, color) => {
    const moves = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col] && board[row][col].color === color) {
          const pieceMoves = getValidMoves(board, row, col);
          pieceMoves.forEach(move => {
            moves.push({
              from: { row, col },
              to: { row: move.row, col: move.col },
              type: move.type,
              capturedRow: move.capturedRow,
              capturedCol: move.capturedCol
            });
          });
        }
      }
    }
    return moves;
  };

  // AI move using the API
  const makeAIMove = async () => {
    setAiThinking(true);
    
    try {
      const boardString = boardToString(board);
      const possibleMoves = getAllMoves(board, 'black');
      
      if (possibleMoves.length === 0) {
        setGameStatus('Red wins!');
        setAiThinking(false);
        return;
      }

      // Create board analysis prompt
      const prompt = `You are a checkers AI. Analyze this board and choose the best move for BLACK pieces.

Board (R=red piece, B=black piece, r=red king, b=black king, .=empty):
${boardString}

Available moves for BLACK:
${possibleMoves.map((move, index) => 
  `${index}: Move from (${move.from.row},${move.from.col}) to (${move.to.row},${move.to.col}) - ${move.type}`
).join('\n')}

Choose the best move by returning ONLY the move number (0-${possibleMoves.length - 1}). Consider:
- Capturing opponent pieces (jumps)
- Advancing pieces toward promotion
- Protecting your own pieces
- Controlling the center

Return only the number of your chosen move.`;

      // First store the board state
      const inputDataPayload = {
        created_object_name: 'board_state',
        data_type: 'strings',
        input_data: [boardString]
      };

      addApiLog({
        type: 'request',
        endpoint: '/input_data',
        payload: inputDataPayload
      });

      await fetch('https://builder.impromptu-labs.com/api_tools/input_data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 4e31d5e989125dc49a09d234c59e85bc',
          'X-Generated-App-ID': 'a01431ff-b043-4e34-838d-eb2cc35af7ba'
        },
        body: JSON.stringify(inputDataPayload)
      });

      setCreatedObjects(prev => [...prev, 'board_state']);

      // Now get the AI decision
      const promptPayload = {
        created_object_names: ['ai_move_decision'],
        prompt_string: prompt,
        inputs: [{
          input_object_name: 'board_state',
          mode: 'combine_events'
        }]
      };

      addApiLog({
        type: 'request',
        endpoint: '/apply_prompt',
        payload: promptPayload
      });

      await fetch('https://builder.impromptu-labs.com/api_tools/apply_prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 4e31d5e989125dc49a09d234c59e85bc',
          'X-Generated-App-ID': 'a01431ff-b043-4e34-838d-eb2cc35af7ba'
        },
        body: JSON.stringify(promptPayload)
      });

      setCreatedObjects(prev => [...prev, 'ai_move_decision']);

      // Get the AI's decision
      addApiLog({
        type: 'request',
        endpoint: '/return_data/ai_move_decision',
        payload: null
      });

      const decisionResponse = await fetch('https://builder.impromptu-labs.com/api_tools/return_data/ai_move_decision', {
        headers: {
          'Authorization': 'Bearer 4e31d5e989125dc49a09d234c59e85bc',
          'X-Generated-App-ID': 'a01431ff-b043-4e34-838d-eb2cc35af7ba'
        }
      });
      
      const decisionData = await decisionResponse.json();
      
      addApiLog({
        type: 'response',
        endpoint: '/return_data/ai_move_decision',
        payload: decisionData
      });

      const moveIndex = parseInt(decisionData.text_value.trim());
      
      if (moveIndex >= 0 && moveIndex < possibleMoves.length) {
        const chosenMove = possibleMoves[moveIndex];
        const newBoard = makeMove(
          chosenMove.from.row, 
          chosenMove.from.col, 
          chosenMove.to.row, 
          chosenMove.to.col,
          chosenMove.capturedRow,
          chosenMove.capturedCol
        );
        
        setBoard(newBoard);
        setCurrentPlayer('red');
      } else {
        // Fallback to random move if AI response is invalid
        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        const newBoard = makeMove(
          randomMove.from.row, 
          randomMove.from.col, 
          randomMove.to.row, 
          randomMove.to.col,
          randomMove.capturedRow,
          randomMove.capturedCol
        );
        setBoard(newBoard);
        setCurrentPlayer('red');
      }
      
    } catch (error) {
      console.error('AI move error:', error);
      addApiLog({
        type: 'error',
        endpoint: 'AI Move',
        payload: { error: error.message }
      });
      
      // Fallback to random move
      const possibleMoves = getAllMoves(board, 'black');
      if (possibleMoves.length > 0) {
        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        const newBoard = makeMove(
          randomMove.from.row, 
          randomMove.from.col, 
          randomMove.to.row, 
          randomMove.to.col,
          randomMove.capturedRow,
          randomMove.capturedCol
        );
        setBoard(newBoard);
        setCurrentPlayer('red');
      }
    }
    
    setAiThinking(false);
  };

  // Handle square click
  const handleSquareClick = (row, col) => {
    if (currentPlayer !== 'red' || aiThinking) return;

    if (selectedSquare) {
      const validMoves = getValidMoves(board, selectedSquare.row, selectedSquare.col);
      const move = validMoves.find(m => m.row === row && m.col === col);
      
      if (move) {
        const newBoard = makeMove(
          selectedSquare.row, 
          selectedSquare.col, 
          row, 
          col,
          move.capturedRow,
          move.capturedCol
        );
        setBoard(newBoard);
        setSelectedSquare(null);
        setCurrentPlayer('black');
      } else {
        setSelectedSquare(null);
      }
    } else if (board[row][col] && board[row][col].color === 'red') {
      setSelectedSquare({ row, col });
    }
  };

  // AI makes move when it's their turn
  useEffect(() => {
    if (currentPlayer === 'black' && gameStatus === 'playing') {
      const timer = setTimeout(() => {
        makeAIMove();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gameStatus]);

  // Check for game end
  useEffect(() => {
    const redMoves = getAllMoves(board, 'red');
    const blackMoves = getAllMoves(board, 'black');
    
    if (redMoves.length === 0) {
      setGameStatus('Black wins!');
    } else if (blackMoves.length === 0) {
      setGameStatus('Red wins!');
    }
  }, [board]);

  const resetGame = () => {
    setBoard(initializeBoard());
    setSelectedSquare(null);
    setCurrentPlayer('red');
    setGameStatus('playing');
    setAiThinking(false);
    setApiLogs([]);
    setCreatedObjects([]);
  };

  const showApiResults = async () => {
    const results = {};
    for (const objName of createdObjects) {
      try {
        const response = await fetch(`https://builder.impromptu-labs.com/api_tools/return_data/${objName}`, {
          headers: {
            'Authorization': 'Bearer 4e31d5e989125dc49a09d234c59e85bc',
            'X-Generated-App-ID': 'a01431ff-b043-4e34-838d-eb2cc35af7ba'
          }
        });
        const data = await response.json();
        results[objName] = data;
      } catch (error) {
        results[objName] = { error: error.message };
      }
    }
    alert(JSON.stringify(results, null, 2));
  };

  const deleteApiObjects = async () => {
    for (const objName of createdObjects) {
      try {
        await fetch(`https://builder.impromptu-labs.com/api_tools/objects/${objName}`, {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer 4e31d5e989125dc49a09d234c59e85bc',
            'X-Generated-App-ID': 'a01431ff-b043-4e34-838d-eb2cc35af7ba'
          }
        });
      } catch (error) {
        console.error(`Error deleting ${objName}:`, error);
      }
    }
    setCreatedObjects([]);
    alert('All API objects deleted');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
      {/* Game Status */}
      <div className="text-center mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Current Player: <span className={currentPlayer === 'red' ? 'text-red-600' : 'text-gray-900 dark:text-white'}>
              {currentPlayer === 'red' ? 'You (Red)' : 'AI (Black)'}
            </span>
          </div>
          <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Status: <span className="text-primary-600">{gameStatus}</span>
          </div>
        </div>
        
        {aiThinking && (
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <span className="text-primary-600 font-medium">AI is thinking...</span>
          </div>
        )}
      </div>
      
      {/* Game Board */}
      <div className="flex justify-center mb-8">
        <div className="inline-block border-4 border-amber-800 rounded-lg overflow-hidden shadow-lg">
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              {row.map((cell, colIndex) => {
                const isBlackSquare = (rowIndex + colIndex) % 2 === 1;
                const isSelected = selectedSquare && selectedSquare.row === rowIndex && selectedSquare.col === colIndex;
                const validMoves = selectedSquare ? getValidMoves(board, selectedSquare.row, selectedSquare.col) : [];
                const isValidMove = validMoves.some(move => move.row === rowIndex && move.col === colIndex);
                
                return (
                  <div
                    key={colIndex}
                    onClick={() => handleSquareClick(rowIndex, colIndex)}
                    className={`
                      w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center cursor-pointer transition-all duration-200
                      ${isBlackSquare ? 'bg-amber-800' : 'bg-amber-100'}
                      ${isSelected ? 'ring-4 ring-yellow-400' : ''}
                      ${isValidMove ? 'ring-4 ring-green-400' : ''}
                      hover:brightness-110
                    `}
                    role="button"
                    tabIndex={0}
                    aria-label={`Square ${rowIndex}-${colIndex}${cell ? ` with ${cell.color} ${cell.isKing ? 'king' : 'piece'}` : ''}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleSquareClick(rowIndex, colIndex);
                      }
                    }}
                  >
                    {cell && (
                      <div className={`
                        w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 border-gray-800 flex items-center justify-center text-white font-bold text-lg sm:text-2xl shadow-lg
                        ${cell.color === 'red' ? 'bg-red-600' : 'bg-gray-900'}
                      `}>
                        {cell.isKing ? '♔' : ''}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      {/* Control Buttons */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        <button 
          onClick={resetGame}
          className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg transition-colors duration-200"
          aria-label="Start new game"
        >
          New Game
        </button>
        
        {createdObjects.length > 0 && (
          <>
            <button 
              onClick={showApiResults}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg transition-colors duration-200"
              aria-label="Show API results"
            >
              Show API Results
            </button>
            
            <button 
              onClick={deleteApiObjects}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-lg transition-colors duration-200"
              aria-label="Delete API objects"
            >
              Delete API Objects
            </button>
          </>
        )}
      </div>
      
      {/* How to Play */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">How to Play:</h3>
        <ul className="space-y-2 text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-primary-600 font-bold">•</span>
            You are red pieces, AI is black pieces
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 font-bold">•</span>
            Click a red piece to select it, then click a valid square to move
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 font-bold">•</span>
            Jump over opponent pieces to capture them
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 font-bold">•</span>
            Reach the opposite end to become a king (crown symbol)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 font-bold">•</span>
            Win by capturing all opponent pieces or blocking all their moves
          </li>
        </ul>
      </div>

      {/* API Debug Section */}
      {apiLogs.length > 0 && (
        <div className="mt-8 bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">API Debug Log:</h3>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {apiLogs.map((log, index) => (
              <div key={index} className="text-sm">
                <div className={`font-semibold ${
                  log.type === 'error' ? 'text-red-600' : 
                  log.type === 'response' ? 'text-green-600' : 'text-blue-600'
                }`}>
                  [{log.type.toUpperCase()}] {log.endpoint}
                </div>
                <pre className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-2 rounded mt-1 overflow-x-auto">
                  {JSON.stringify(log.payload, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckersGame;
