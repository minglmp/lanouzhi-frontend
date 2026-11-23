import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const CATEGORIES = ['All', 'New', 'Art', 'Gadgets', 'Toys'];

const parseImages = (imageUrlField) => {
  try {
    const parsed = JSON.parse(imageUrlField);
    return Array.isArray(parsed) ? parsed : [imageUrlField];
  } catch {
    return [imageUrlField];
  }
};

const API_BASE = 'https://my-cloudflare-api.lmps.workers.dev';

// GET JSON (แนบ token ถ้ามี) คืนค่า null ถ้า response ไม่ ok
const getJson = async (path, token) => {
  const res = await fetch(`${API_BASE}${path}`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
  return res.ok ? res.json() : null;
};

const HomePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(CATEGORIES[0]);

  const [models, setModels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [likedModels, setLikedModels] = useState(new Set());
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const token = localStorage.getItem('maker_token');
  const isLoggedIn = !!token;

  // โหลดโมเดลใหม่ (เรียกจาก Topbar หลังอัปโหลดสำเร็จ)
  const fetchModels = () =>
    getJson('/api/models')
      .then((data) => { if (data) setModels(data); })
      .catch((error) => console.error('Error fetching models:', error))
      .finally(() => setIsLoading(false));

  useEffect(() => {
    let cancelled = false;
    getJson('/api/models')
      .then((data) => { if (!cancelled && data) setModels(data); })
      .catch((error) => console.error('Error fetching models:', error))
      .finally(() => { if (!cancelled) setIsLoading(false); });

    if (token) {
      getJson('/api/user/likes', token)
        .then((likedIds) => { if (!cancelled && likedIds) setLikedModels(new Set(likedIds)); })
        .catch((err) => console.error('Error fetching likes:', err));
    }
    return () => { cancelled = true; };
  }, [token]);

  const handleLike = async (e, modelId) => {
    e.stopPropagation(); 
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }

    const isCurrentlyLiked = likedModels.has(modelId);
    
    setLikedModels(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyLiked) newSet.delete(modelId);
      else newSet.add(modelId);
      return newSet;
    });

    setModels(prevModels => 
      prevModels.map(model => {
        if (model.id === modelId) {
          return {
            ...model,
            likes: isCurrentlyLiked ? Math.max(0, (model.likes || 0) - 1) : (model.likes || 0) + 1
          };
        }
        return model;
      })
    );

    try {
      const res = await fetch(`https://my-cloudflare-api.lmps.workers.dev/api/models/${modelId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error('Failed to update like');
      }
    } catch (error) {
      console.error('Error updating like:', error);
      setLikedModels(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) newSet.add(modelId);
        else newSet.delete(modelId);
        return newSet;
      });
      setModels(prevModels => 
        prevModels.map(model => {
          if (model.id === modelId) {
            return {
              ...model,
              likes: isCurrentlyLiked ? (model.likes || 0) + 1 : Math.max(0, (model.likes || 0) - 1)
            };
          }
          return model;
        })
      );
      alert('Network error. Could not update like status.');
    }
  };

  const [searchQuery, setSearchQuery] = useState('');

  const filteredModels = models.filter((model) => {
    const query = searchQuery.toLowerCase();
    const matchTitle = model.title.toLowerCase().includes(query);
    const matchAuthor = model.author && model.author.toLowerCase().includes(query);
    const matchSearch = matchTitle || matchAuthor;

    let matchCategory;

    if (activeTab === 'All') {
      matchCategory = true;
    } else if (activeTab === 'New') {
      if (model.created_at) {
        const now = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);

        const modelDate = new Date(model.created_at.replace(' ', 'T') + 'Z');
        matchCategory = modelDate >= oneMonthAgo;
      } else {
        matchCategory = true;
      }
    } else {
      matchCategory = model.category === activeTab;
    }

    return matchSearch && matchCategory;
  });

  return (
    <div className="flex min-h-screen bg-[#121212] font-sans relative">
      <div className="hidden md:flex w-64 flex-shrink-0">
        <Sidebar activeTab="home"/>
      </div>

      {/* ================= 2. พื้นที่เนื้อหาหลัก ================= */}
      <div className="flex-1 flex flex-col min-w-0 pb-12">
      <Topbar 
        showSearch={true} 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        onUploadSuccess={fetchModels} 
      />

        {/* ================= Main Content ================= */}
        <main className="w-full px-6 mt-4">
          <div className="flex overflow-x-auto hide-scrollbar gap-2.5 mb-6 pb-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setActiveTab(category)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === category
                    ? 'bg-[#FF7518] text-white shadow-md'
                    : 'bg-[#1E1E1E] text-gray-400 hover:bg-[#27272A] hover:text-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-white font-medium animate-pulse">Loading models...</div>
          ) : filteredModels.length === 0 ? (
            <div className="text-center py-20 text-white">
              <p className="text-lg font-medium mb-2">No models found in the system.</p>
              <p className="text-sm opacity-80">Check back later for new arrivals!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
              {filteredModels.map((model) => (
                <div key={model.id} onClick={() => navigate(`/model/${model.id}`)} className="group bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col relative cursor-pointer">
                  
                  {/* 🌟 ปุ่มหัวใจ (Like Button) 🌟 */}
                  <div className="absolute top-3 right-3 z-20 flex gap-2">
                    <button 
                      onClick={(e) => handleLike(e, model.id)} 
                      className={`p-2 rounded-full shadow-md transition-all duration-300 ${
                        likedModels.has(model.id) 
                          ? 'bg-red-500/20 text-red-500 hover:bg-red-500/40 border border-red-500/30' 
                          : 'bg-black/50 text-gray-300 hover:bg-black/70 border border-gray-700'
                      }`}
                    >
                      <svg className={`w-5 h-5 ${likedModels.has(model.id) ? 'fill-current' : 'fill-none'}`} viewBox="0 0 24 24" stroke="currentColor">
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
                      
                      {/* 🌟 แสดงยอดไลก์ตรงนี้ 🌟 */}
                      <div className="flex items-center gap-1.5 text-gray-400 text-xs font-semibold bg-gray-800/50 px-2.5 py-1 rounded-full border border-gray-800">
                        <svg className="w-3.5 h-3.5 text-red-400 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        {model.likes || 0}
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
      {/* ================= 🌟 LOGIN PROMPT POPUP (เด้งเตือนให้ล็อกอินตอนกด Like) 🌟 ================= */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-[#1c1c1e] border border-[#2d2d2f] rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center transform transition-all animate-in zoom-in duration-300">
            
            {/* ไอคอนแม่กุญแจ (Login) */}
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-5 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            
            <h3 className="text-2xl font-extrabold text-white mb-2">Login Required</h3>
            <p className="text-gray-400 mb-8 text-sm">
              Please log in or create an account<br/>to like and save your favorite models.
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowLoginPrompt(false)} 
                className="flex-1 bg-[#2d2d2f] hover:bg-[#3d3d3f] text-white font-bold py-3.5 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => navigate('/auth')} 
                className="flex-1 bg-[#FF7518] hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;