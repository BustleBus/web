import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ExperimentPage from './components/ExperimentPage.tsx';

const root = createRoot(document.getElementById('root')!);

const isTestMode = new URLSearchParams(window.location.search).get('test') === 'chart';

root.render(
  <StrictMode>
    {isTestMode ? <ExperimentPage /> : <App />}
  </StrictMode>,
)
