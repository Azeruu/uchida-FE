import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppRouter from './routes/AppRouter.jsx'

export const API_URL = 'http://localhost:8080/api';
export const API_URL_PUBLIC = 'https://uchida-be.onrender.com/api';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
)
