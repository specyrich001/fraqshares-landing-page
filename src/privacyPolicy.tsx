import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { stylesReady } from './stylesReady.ts'
import { LegalPage } from './components/legal/LegalPage.tsx'
import { PRIVACY_POLICY } from './content/legal/privacyPolicy.ts'

// After the CSS has loaded: the scroll scenes read computed styles when they mount (see stylesReady).
void stylesReady().then(() =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <LegalPage document={PRIVACY_POLICY} />
    </StrictMode>,
  ),
)
