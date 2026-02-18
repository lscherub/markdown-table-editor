import React, { useState } from 'react';
import { useGridStore } from '../store/gridStore';
import { useShallow } from 'zustand/react/shallow';

export const InitializationModal: React.FC = () => {
    const { showNewSheetModal, setShowNewSheetModal, initializeGrid } = useGridStore(useShallow((state) => ({
        showNewSheetModal: state.showNewSheetModal,
        setShowNewSheetModal: state.setShowNewSheetModal,
        initializeGrid: state.initializeGrid
    })));

    const [rows, setRows] = useState(20);
    const [cols, setCols] = useState(10);

    // Reset local state when modal opens?
    // For now just keep persistent or reset on open?
    // useEffect(() => { if (showNewSheetModal) { setRows(20); setCols(10); } }, [showNewSheetModal]);

    if (!showNewSheetModal) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        initializeGrid(rows, cols);
        setShowNewSheetModal(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl p-6 w-96 transform transition-all scale-100 opacity-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">New Sheet</h2>
                    <button onClick={() => setShowNewSheetModal(false)} className="text-gray-500 hover:text-gray-700">
                        ✕
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Number of Rows
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="1000"
                            value={rows}
                            onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 0))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Number of Columns
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={cols}
                            onChange={(e) => setCols(Math.max(1, parseInt(e.target.value) || 0))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
                    >
                        Create Table
                    </button>
                </form>
            </div>
        </div>
    );
};
