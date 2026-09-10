import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import logoImg from './assets/logo2.jpeg';

const parseImages = (imageUrlField) => {
  try {
    const parsed = JSON.parse(imageUrlField);
    return Array.isArray(parsed) ? parsed : [imageUrlField];
  } catch {
    return [imageUrlField];
  }
};

const FavoritesPage = () => {
  const navigate = useNavigate();
  const [favoriteModels, setFavoriteModels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const token = localStorage.getItem('maker_token');
  let currentUser = null;
  let currentUserRole = null;

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUser = payload.username;
      currentUserRole = payload.role;
    } catch (e) {
      console.error('Token invalid');
    }
  }

  // เด้งกลับไปหน้าล็อกอินถ้ายังไม่ล็อกอิน
  useEffect(() => {
    if (!token) navigate('/auth');
  }, [navigate, token]);

  const fetchFavorites = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://my-cloudflare-api.lmps.workers.dev/api/user/favorites', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setFavoriteModels(data);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchFavorites();
  }, [token]);

  const handleUnlike = async (e, modelId) => {
    e.stopPropagation();
    
    // อัปเดต UI ทันที (Optimistic UI) ลบออกจากหน้าจอก่อน
    setFavoriteModels(prev => prev.filter(model => model.id !== modelId));

    try {
      const res = await fetch(`https://my-cloudflare-api.lmps.workers.dev/api/models/${modelId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to unlike');
    } catch (error) {
      console.error('Error unliking:', error);
      // ถ้ายกเลิกไม่สำเร็จ ให้ดึงข้อมูลกลับมาใหม่
      fetchFavorites();
      alert('Network error. Could not unlike.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('maker_token');
    navigate('/');
  };

  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen bg-[#121212] font-sans relative">
      <Sidebar activeTab="favorites"/>

      {/* ================= Main Content ================= */}
      <div className="flex-1 flex flex-col min-w-0 pb-12">
        <Topbar />

        <main className="w-full max-w-5xl mx-auto px-6 mt-8">
          <h2 className="text-2xl font-bold text-white mb-6 border-b border-[#2d2d2f] pb-4 flex items-center gap-3">
            <svg className="w-7 h-7 text-red-500 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            My Favorites ({favoriteModels.length})
          </h2>

          {isLoading ? (
            <div className="text-center py-12 text-white font-medium animate-pulse">Loading your favorites...</div>
          ) : favoriteModels.length === 0 ? (
            <div className="text-center py-20 bg-[#1c1c1e] rounded-3xl border border-[#2d2d2f]">
              <div className="text-5xl mb-4">💔</div>
              <p className="text-lg font-medium text-white mb-2">No favorites yet.</p>
              <p className="text-sm opacity-80 text-gray-400 mb-6">You haven't liked any models. Go explore and find something you love!</p>
              <button onClick={() => navigate('/')} className="bg-[#FF7518] hover:bg-orange-600 text-white px-6 py-2 rounded-full text-sm font-bold transition-colors">
                Explore Models
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favoriteModels.map((model) => (
                <div key={model.id} onClick={() => navigate(`/model/${model.id}`)} className="group bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col relative cursor-pointer">
                  
                  {/* 🌟 ปุ่มหัวใจ (สีแดงเสมอในหน้านี้ เพราะเป็น Favorite) 🌟 */}
                  <div className="absolute top-3 right-3 z-20 flex gap-2">
                    <button 
                      onClick={(e) => handleUnlike(e, model.id)} 
                      className="p-2 rounded-full shadow-md transition-all duration-300 bg-red-500/20 text-red-500 hover:bg-red-500/40 border border-red-500/30"
                      title="Remove from favorites"
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>

                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-800">
                    <img src={parseImages(model.image_url)[0]} alt={model.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&q=80' }} />
                    {parseImages(model.image_url).length > 1 && (
                      <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-md border border-gray-700 shadow-sm z-10">
                        +{parseImages(model.image_url).length - 1} photos
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-white font-semibold text-lg truncate mb-1">{model.title}</h3>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-300">
                          {model.author ? model.author.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span className="text-sm text-gray-400 truncate">{model.author}</span>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/model/${model.id}`); }} className="w-full bg-[#FF7518] hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl transition-colors shadow-sm hover:shadow-md flex justify-center items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                          View Details 
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default FavoritesPage;