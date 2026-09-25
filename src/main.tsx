import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.js'
import { LanguageProvider } from './i18n/LanguageContext'
import { ThemeProvider } from './theme/ThemeContext'

const queryClient = new QueryClient()

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root was not found. Check index.html.');
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider><LanguageProvider><App /></LanguageProvider></ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
