import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { stylesReady } from './stylesReady.ts'
import { AboutPage } from './components/about/AboutPage.tsx'

// After the CSS has loaded: the scroll scenes read computed styles when they mount (see stylesReady).
void stylesReady().then(() =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AboutPage />
    </StrictMode>,
  ),
)
