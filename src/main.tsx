import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ProvedorSessao } from './estado/sessao'
import { Raiz } from './Raiz'
import './styles/tokens.css'
import './styles/app.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProvedorSessao>
      <Raiz />
    </ProvedorSessao>
  </StrictMode>,
)
