import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import AuthPage from './AuthPage';
import ProfilePage from './ProfilePage';
import DetailPage from './DetailPage';
import OrdersPage from './OrdersPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/model/:id" element={<DetailPage />} />
        <Route path="/orders" element={<OrdersPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;