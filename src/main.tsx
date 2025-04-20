import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { createBrowserRouter, RouterProvider } from 'react-router'
import Lyrics from './pages/Lyrics.tsx'
import Verses from './pages/Verses.tsx'
import { SocketProvider } from './context/SocketContext.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: 'lyrics',
    element: <Lyrics />,
  },
  {
    path: 'verses',
    element: <Verses />,
  }
])

createRoot(document.getElementById('root')!).render(
  <SocketProvider>
    <RouterProvider router={router}/>
  </SocketProvider>
)
