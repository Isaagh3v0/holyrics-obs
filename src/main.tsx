import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { createBrowserRouter, RouterProvider } from 'react-router'
import ControlPanel from './pages/ControlPanel.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: 'control-panel',
    element: <ControlPanel />
  }
])

createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router}/>
)
