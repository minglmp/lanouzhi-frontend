import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from './assets/logo2.jpeg';

const Sidebar = ({ activeTab }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('maker_token');
  const isLoggedIn = !!token;
  let currentUserRole = null;

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUserRole = payload.role;
    } catch (e) {}
  }

  const [pendingOrders, setPendingOrders] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);

  // ดึงแจ้งเตือนทั้งหมดแบบ Real-time ทุกๆ 3 วินาที
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchBadges = async () => {
      try {
        // 1. ดึงยอดออเดอร์ (🌟 ปลดล็อก: ดึงทุกคน แอดมินเห็นยอดรวม ลูกค้าเห็นยอดตัวเอง)
        const resOrders = await fetch('https://my-cloudflare-api.lmps.workers.dev/api/orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (resOrders.ok) {
          const orders = await resOrders.json();
          // นับเฉพาะออเดอร์ที่สถานะ pending
          setPendingOrders(orders.filter(o => o.status === 'pending').length);
        }

        // 2. ดึงยอดแชทใหม่
        const resChat = await fetch('https://my-cloudflare-api.lmps.workers.dev/api/chat/unread/total', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (resChat.ok) {
          const chatData = await resChat.json();
          setUnreadChats(chatData.count || 0);
        }
      } catch (err) {
        console.error('Error fetching badges', err);
      }
    };

    fetchBadges(); 
    const interval = setInterval(fetchBadges, 3000); 
    return () => clearInterval(interval);
  }, [isLoggedIn, token]); // เอา currentUserRole ออกจาก dependency เพราะดึงทุกคนแล้ว

  // ฟังก์ชันจัดสไตล์ปุ่มให้ปุ่มที่ถูกเลือก (activeTab) สว่างขึ้น
  const getButtonClass = (tabName) => {
    const baseClass = "w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-sm transition-colors mt-2";
    if (activeTab === tabName) {
      return `${baseClass} bg-[#2d2d2f] text-white`;
    }
    return `${baseClass} text-gray-400 hover:text-white hover:bg-[#2d2d2f]/50`;
  };

  // ฟังก์ชันจัดการสีไอคอน
  const getIconClass = (tabName) => {
    if (activeTab === tabName) {
      if (tabName === 'favorites') return "text-red-500 fill-current";
      if (tabName === 'chat') return "text-blue-400";
      return "text-white";
    }
    return ""; 
  };

  return (
    <aside className="w-[240px] bg-[#1c1c1e] border-r border-[#2d2d2f] hidden md:flex flex-col sticky top-0 h-screen z-50">
      <div className="p-4 h-[72px] flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
        <img src={logoImg} alt="Logo" className="w-7 object-contain rounded-md" />
        <span className="font-bold text-[17px] text-white tracking-tight">Lanouzhi.lab</span>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        <button onClick={() => navigate('/')} className={getButtonClass('home')}>
          <div className="flex items-center gap-3">
            <svg className={`w-5 h-5 ${getIconClass('home')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            Home
          </div>
        </button>
        
        {isLoggedIn && (
          <>
            <button onClick={() => navigate('/profile')} className={getButtonClass('profile')}>
              <div className="flex items-center gap-3">
                <svg className={`w-5 h-5 ${getIconClass('profile')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                My Profile
              </div>
            </button>

            <button onClick={() => navigate('/orders')} className={getButtonClass('orders')}>
              <div className="flex items-center gap-3">
                <svg className={`w-5 h-5 ${getIconClass('orders')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                {currentUserRole === 'admin' ? 'Manage Orders' : 'My Purchases'}
              </div>
              {/* 🌟 แจ้งเตือนออเดอร์ (โชว์ให้ทุกคน แต่แยกสี Admin แดง / User ส้ม) 🌟 */}
              {pendingOrders > 0 && (
                <span className={`${currentUserRole === 'admin' ? 'bg-red-500' : 'bg-[#FF7518]'} text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse`}>
                  {pendingOrders}
                </span>
              )}
            </button>

            <button onClick={() => navigate('/favorites')} className={getButtonClass('favorites')}>
              <div className="flex items-center gap-3">
                <svg className={`w-5 h-5 ${getIconClass('favorites')}`} viewBox="0 0 24 24" stroke="currentColor" fill="none"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                My Favorites
              </div>
            </button>

            <button onClick={() => navigate('/chat')} className={getButtonClass('chat')}>
              <div className="flex items-center gap-3">
                <svg className={`w-5 h-5 ${getIconClass('chat')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                Chat
              </div>
              {/* 🔴 แจ้งเตือนแชท */}
              {unreadChats > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                  {unreadChats}
                </span>
              )}
            </button>
          </>
        )}
      </nav>
      {/* Footer */}
        <div className="mt-auto p-4 border-t border-[#2d2d2f]">
          <div className="flex items-center gap-4 mb-4 text-gray-500">
            
            {/* 1. Facebook */}
            <a href="#" title="Facebook" className="hover:text-[#1877F2] transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>
            </a>
            
            {/* 2. Instagram */}
            <a href="#" title="Instagram" className="hover:text-[#E1306C] transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            
            {/* 3. YouTube */}
            <a href="#" title="YouTube" className="hover:text-[#FF0000] transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
            </a>
            
            {/* 4. TikTok */}
            <a href="#" title="TikTok" className="hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
            </a>
            
          </div>
          <div className="text-[11px] text-gray-600 font-medium">
            © 2026 Lanouzhi.lab
          </div>
        </div>
    </aside>
  );
};

export default Sidebar;