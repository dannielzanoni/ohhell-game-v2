import { AppProvider } from './provider.jsx';
import { AppRouter } from './router.jsx';
import { PlatformProvider } from '@/platform/PlatformProvider.jsx';

function App() {
  return (
    <PlatformProvider>
      <AppProvider>
        <AppRouter />
      </AppProvider>
    </PlatformProvider>
  );
}

export default App;
