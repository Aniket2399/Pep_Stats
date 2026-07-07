import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import PlayersPage from './pages/PlayersPage'
import LivePage from './pages/LivePage'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<PlayersPage />} />
          <Route path="/live" element={<LivePage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
