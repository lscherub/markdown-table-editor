
import { Grid } from './components/Grid/Grid';
import { Toolbar } from './components/Toolbar/Toolbar';
import { Preview } from './components/Preview/Preview';
import { InitializationModal } from './components/InitializationModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { HelpModal } from './components/HelpModal';

function App() {
  return (
    <div className="h-screen w-screen flex flex-col bg-white text-gray-900 font-sans">
      <header className="flex flex-col bg-gray-50 flex-shrink-0 z-30">
        <div className="h-10 border-b border-gray-200 flex items-center px-4 bg-white">
          <h1 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <span className="w-5 h-5 bg-blue-600 rounded text-white flex items-center justify-center text-xs">M</span>
            Markdown Table Editor
          </h1>
        </div>
        <Toolbar />
      </header>

      <main className="flex-1 overflow-hidden flex min-w-0">
        <div className="flex-1 relative min-w-0">
          <Grid />
        </div>
        <Preview />
      </main>

      <InitializationModal />
      <KeyboardShortcutsModal />
      <HelpModal />
    </div>
  );
}

export default App;
