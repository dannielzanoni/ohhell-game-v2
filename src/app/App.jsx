import { AppProvider } from './provider.jsx';
import { AppRouter } from './router.jsx';

function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}

export default App;
