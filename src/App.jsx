import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import AuthPage from './AuthPage';
import ProfilePage from './ProfilePage'; // 👇 1. Import ไฟล์ใหม่
import DetailPage from './DetailPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        {/* 👇 2. เพิ่ม Route สำหรับหน้า Profile */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/model/:id" element={<DetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;