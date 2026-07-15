import { AppProvider } from './providers/AppProvider.jsx';
import { AppRouter } from './router/AppRouter.jsx';

function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}

export default App;
