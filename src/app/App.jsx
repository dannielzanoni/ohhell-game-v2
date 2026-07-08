import { AppProvider } from './provider.jsx';
import { AppRouter } from './router.jsx';
import { RenderErrorBoundary } from './RenderErrorBoundary.jsx';
import { PlatformProvider } from '@/platform/PlatformProvider.jsx';

function App() {
  return (
    <PlatformProvider>
      <AppProvider>
        <RenderErrorBoundary>
          <AppRouter />
        </RenderErrorBoundary>
      </AppProvider>
    </PlatformProvider>
  );
}

export default App;
