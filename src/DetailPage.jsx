import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

const DetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [model, setModel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  
  // 🌟 States สำหรับ Checkout Modal
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const token = localStorage.getItem('maker_token');
  const isLoggedIn = !!token;
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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('https://my-cloudflare-api.lmps.workers.dev/api/models');
        if (res.ok) {
          const allModels = await res.json();
          const foundModel = allModels.find(m => m.id === id);
          if (foundModel) {
            setModel(foundModel);
            setLikeCount(foundModel.likes || 0);
          }
        }
        
        if (token) {
          const likesRes = await fetch('https://my-cloudflare-api.lmps.workers.dev/api/user/likes', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (likesRes.ok) {
            const likedIds = await likesRes.json();
            if (likedIds.includes(id)) setIsLiked(true);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, token]);

  const handleLike = async () => {
    if (!isLoggedIn) {
      alert('Please log in to like this model.');
      navigate('/auth');
      return;
    }

    const currentlyLiked = isLiked;
    setIsLiked(!currentlyLiked);
    setLikeCount(prev => currentlyLiked ? Math.max(0, prev - 1) : prev + 1);

    try {
      const res = await fetch(`https://my-cloudflare-api.lmps.workers.dev/api/models/${id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed');
    } catch (err) {
      setIsLiked(currentlyLiked);
      setLikeCount(prev => currentlyLiked ? prev + 1 : Math.max(0, prev - 1));
      alert('Network error. Could not update like status.');
    }
  };

  const openCheckoutModal = () => {
    if (!isLoggedIn) {
      alert('Please log in to place an order.');
      navigate('/auth');
      return;
    }
    setIsCheckoutModalOpen(true);
  };

  // 🌟 ฟังก์ชัน Confirm Order (กดปุ๊บ สั่งซื้อเลย ไม่ต้องแนบสลิป)
  const handleConfirmOrder = async () => {
    setIsPlacingOrder(true);
    try {
      const res = await fetch('https://my-cloudflare-api.lmps.workers.dev/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ model_id: id })
      });
      
      if (res.ok) {
        alert('🎉 Order placed successfully! Waiting for admin approval.');
        setIsCheckoutModalOpen(false);
        navigate('/orders'); 
      } else {
        alert('Failed to place order.');
      }
    } catch (err) {
      alert('Server error occurred.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('maker_token');
    window.location.reload();
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white animate-pulse">Loading model details...</div>;
  }

  if (!model) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold mb-4">Model not found 😢</h1>
        <button onClick={() => navigate('/')} className="bg-[#FF7518] px-6 py-2 rounded-full text-sm font-bold">Go Back Home</button>
      </div>
    );
  }

  const images = parseImages(model.image_url);

  return (
    <div className="flex min-h-screen bg-[#121212] font-sans relative">
      
      <Sidebar activeTab="" />

      {/* ================= Main Content ================= */}
      <div className="flex-1 flex flex-col min-w-0 pb-12">
        <Topbar />

        <main className="w-full max-w-6xl mx-auto px-6 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            
            {/* ซ้าย: แกลเลอรีรูปภาพ */}
            <div className="flex flex-col gap-4">
              <div className="w-full aspect-[4/3] bg-black rounded-3xl overflow-hidden border border-[#2d2d2f] shadow-lg">
                <img 
                  src={images[activeImageIndex]} 
                  alt={model.title} 
                  className="w-full h-full object-contain"
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&q=80' }} 
                />
              </div>
              
              {/* ภาพย่อ (Thumbnails) */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                  {images.map((img, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${activeImageIndex === idx ? 'border-[#FF7518] scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ขวา: รายละเอียดและการสั่งซื้อ */}
            <div className="flex flex-col">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-4xl font-bold text-white leading-tight">{model.title}</h1>
                <button 
                  onClick={handleLike} 
                  className={`flex-shrink-0 p-3 rounded-full shadow-md transition-all duration-300 ${isLiked ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-[#1c1c1e] text-gray-400 hover:text-white border border-[#2d2d2f]'}`}
                >
                  <svg className={`w-6 h-6 ${isLiked ? 'fill-current' : 'fill-none'}`} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-6 mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-inner">
                    {model.author ? model.author.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="text-gray-400 font-medium">@{model.author}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400 font-medium">
                  <svg className="w-5 h-5 text-red-400 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                  {likeCount} Likes
                </div>
                <span className="px-3 py-1 bg-gray-800 text-gray-300 text-xs font-bold rounded-md">
                  {model.category || 'Art'}
                </span>
              </div>

              <div className="bg-[#1c1c1e] rounded-3xl p-6 border border-[#2d2d2f] mb-8">
                <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-3">About this model</h3>
                <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {model.description || 'No description provided by the creator.'}
                </p>
              </div>

              <div className="mt-auto bg-[#1c1c1e] rounded-3xl p-6 border border-[#2d2d2f] flex flex-col gap-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium mb-1">Price</p>
                    <div className="text-3xl font-bold text-[#FF7518]">
                      {model.price === 0 || !model.price ? 'Free' : `₭ ${model.price.toLocaleString()}`}
                    </div>
                  </div>
                </div>

                {currentUser === model.author ? (
                  <button disabled className="w-full py-4 rounded-xl text-white font-bold text-lg bg-gray-700 cursor-not-allowed">
                    This is your model
                  </button>
                ) : (
                  <button 
                    onClick={openCheckoutModal} 
                    className="w-full bg-[#FF7518] hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all text-lg flex items-center justify-center gap-2"
                  >
                    🛒 Order This Model
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ================= 🌟 SECURE CHECKOUT MODAL 🌟 ================= */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1c1c1e] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative border border-[#2d2d2f] flex flex-col animate-in fade-in zoom-in duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#2d2d2f]">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <svg className="w-6 h-6 text-[#FF7518]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Secure Checkout
              </div>
              <button 
                onClick={() => setIsCheckoutModalOpen(false)} 
                className="text-gray-400 hover:text-white bg-[#2d2d2f] hover:bg-gray-700 rounded-full p-1.5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col gap-6">
              
              {/* Order Summary */}
              <div className="bg-[#121212] border border-[#2d2d2f] rounded-xl p-4">
                <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Order Summary</p>
                <p className="text-white font-bold text-base truncate mb-4">{model.title}</p>
                <div className="flex items-center justify-between border-t border-[#2d2d2f] pt-3">
                  <span className="text-gray-400 text-sm">Total Price:</span>
                  <span className="text-[#FF7518] font-bold text-lg">
                    {model.price === 0 || !model.price ? 'Free' : `${model.price.toLocaleString()} LAK`}
                  </span>
                </div>
              </div>

              {/* Account Number */}
              <div className="bg-[#121212] border border-[#2d2d2f] rounded-xl p-4 flex flex-col items-center justify-center">
                <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">ADMIN ACCOUNT NUMBER</p>
                <p className="text-[#FF7518] font-mono font-bold text-lg tracking-wider">160-12-00-12345678</p>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center gap-3">
                <p className="text-white font-bold text-sm">Scan QR Code to Pay (BCEL One)</p>
                <div className="bg-white p-3 rounded-2xl w-40 h-40 flex items-center justify-center">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=160-12-00-12345678`} 
                    alt="Payment QR Code" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Confirm Button */}
              <button 
                onClick={handleConfirmOrder}
                disabled={isPlacingOrder}
                className="w-full bg-[#FF7518] hover:bg-orange-600 disabled:bg-gray-600 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all"
              >
                {isPlacingOrder ? 'Processing...' : 'Confirm Order'}
              </button>

            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default DetailPage;