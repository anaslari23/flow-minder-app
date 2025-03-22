
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { UserProvider } from './contexts/UserContext.tsx'
import { PeriodProvider } from './contexts/PeriodContext.tsx'

createRoot(document.getElementById("root")!).render(
  <UserProvider>
    <PeriodProvider>
      <App />
    </PeriodProvider>
  </UserProvider>
);
