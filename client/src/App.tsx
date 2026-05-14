import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Providers from './Providers';
import Login from './pages/Login';
import Register from './pages/Register';
import MyWorks from './pages/MyWorks';
import Browse from './pages/Browse';
import ContentDetail from './pages/ContentDetail';
import EditorPage from './pages/EditorPage';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Providers>
      <Router>
        <div style={{ minHeight: '100vh', background: 'var(--cream)', color: 'var(--ink)' }}>
          <Navbar />
          <Routes>
            <Route path="/" element={<Navigate to="/browse" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard/my-works" element={<MyWorks />} />
            <Route path="/dashboard/editor/:id" element={<EditorPage />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/content/:id" element={<ContentDetail />} />
          </Routes>
          <Toaster position="bottom-right" />
        </div>
      </Router>
    </Providers>
  );
}

export default App;
