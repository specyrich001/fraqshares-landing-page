import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Dev reference page; split into its own chunk so it never weighs on the landing page.
const TypeSpecimen = lazy(() => import('./specimen/TypeSpecimen.tsx'))
const isSpecimen = window.location.pathname.replace(/\/$/, '') === '/type-specimen'

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
)
