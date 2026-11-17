import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './proto.css'
import { Proto } from './Proto'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Proto />
  </StrictMode>,
)
