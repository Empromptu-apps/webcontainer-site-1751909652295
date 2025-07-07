import React, { useState } from 'react';

const ApiDebugPanel = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">API Integration</h2>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('endpoints')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'endpoints'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Endpoints
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">AI Strategy Engine</h3>
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              The AI opponent uses advanced data processing APIs to analyze the board state and make strategic moves.
            </p>
          </div>

          <div className="space-y-4">
            <div className="border-l-4 border-primary-500 pl-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">Step 1: Board Analysis</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Current board state is converted to a readable format and stored using the input_data API.
              </p>
            </div>

            <div className="border-l-4 border-primary-500 pl-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">Step 2: Strategic Processing</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                AI analyzes all possible moves and board position using the apply_prompt API with strategic considerations.
              </p>
            </div>

            <div className="border-l-4 border-primary-500 pl-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">Step 3: Move Selection</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                The best move is retrieved using return_data API and executed on the game board.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'endpoints' && (
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">POST /input_data</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              Stores the current board state for AI analysis
            </p>
            <code className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded block">
              {JSON.stringify({
                created_object_name: "board_state",
                data_type: "strings",
                input_data: ["board_representation"]
              }, null, 2)}
            </code>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">POST /apply_prompt</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              Processes board state with AI strategy prompt
            </p>
            <code className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded block">
              {JSON.stringify({
                created_object_names: ["ai_move_decision"],
                prompt_string: "Strategic analysis prompt...",
                inputs: [{ input_object_name: "board_state", mode: "combine_events" }]
              }, null, 2)}
            </code>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">GET /return_data/{'{object_name}'}</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Retrieves the AI's move decision for execution
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiDebugPanel;
