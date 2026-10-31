import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { stylesReady } from './stylesReady.ts'
import App from './App.tsx'

// Dev reference page; split into its own chunk so it never weighs on the landing page.
const TypeSpecimen = lazy(() => import('./specimen/TypeSpecimen.tsx'))
const isSpecimen = window.location.pathname.replace(/\/$/, '') === '/type-specimen'

// After the CSS has loaded: the scroll scenes read computed styles when they mount (see stylesReady).
void stylesReady().then(() =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      {isSpecimen ? (
        <Suspense>
          <TypeSpecimen />
        </Suspense>
      ) : (
        <App />
      )}
    </StrictMode>,
  ),
)
