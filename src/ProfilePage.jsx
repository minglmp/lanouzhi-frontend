import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from './assets/logo2.jpeg'; // ใช้โลโก้เดิม

const ProfilePage = () => {
  const navigate = useNavigate();
  const [myModels, setMyModels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. ดึงข้อมูลผู้ใช้จาก Token
  const token = localStorage.getItem('maker_token');
  let currentUser = null;
  let currentUserRole = null;

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUser = payload.username;
      currentUserRole = payload.role;
    } catch(e) {
      console.error('Token invalid');
    }
  }

  // 2. ถ้าไม่ได้ล็อกอิน ให้เด้งกลับไปหน้า Auth
  useEffect(() => {
    if (!token) {
      navigate('/auth');
    } else {
      fetchMyModels();
    }
  }, [navigate, token]);

  // 3. ดึงผลงานทั้งหมด แล้วกรองเอาเฉพาะของตัวเอง
  const fetchMyModels = async () => {
    try {
      const response = await fetch('https://my-cloudflare-api.lmps.workers.dev/api/models');
      if (response.ok) {
        const allModels = await response.json();
        // กรองเอาเฉพาะผลงานที่ผู้ใช้คนนี้เป็นคนสร้าง
        const filtered = allModels.filter(model => model.author === currentUser);
        setMyModels(filtered);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this model?')) return;
    try {
      const res = await fetch(`https://my-cloudflare-api.lmps.workers.dev/api/models${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchMyModels(); 
      }
    } catch (err) {
      alert('Server error occurred.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('maker_token');
    navigate('/');
  };

  if (!currentUser) return null; // ป้องกันการเรนเดอร์ก่อน Redirect

  return (
    <div className="flex min-h-screen bg-[#18181a] font-sans relative">
      
      {/* ================= Sidebar (ซ้าย) ================= */}
      <aside className="w-[240px] bg-[#1c1c1e] border-r border-[#2d2d2f] hidden md:flex flex-col sticky top-0 h-screen z-50">
        <div className="p-4 h-[72px] flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <img src={logoImg} alt="Logo" className="w-7 object-contain rounded-md" />
          <span className="font-bold text-[17px] text-white tracking-tight">Lanouzhi.lab</span>
        </div>
        
        <nav className="flex-1 px-3 py-2 space-y-1">
          <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-white hover:bg-[#2d2d2f]/50 rounded-lg font-medium text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            Home
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-white bg-[#2d2d2f] rounded-lg font-medium text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            My Profile
          </button>
        </nav>
      </aside>

      {/* ================= เนื้อหาหลัก (ขวา) ================= */}
      <div className="flex-1 flex flex-col min-w-0 pb-12">
        
        {/* Navbar */}
        <nav className="bg-[#18181a] sticky top-0 z-40 px-6 py-4 flex items-center justify-end gap-6 border-b border-[#2d2d2f]">
          <button onClick={() => navigate('/')} className="md:hidden text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 text-sm font-medium transition-colors">
            Logout
          </button>
        </nav>

        <main className="w-full max-w-5xl mx-auto px-6 mt-8">
          
          {/* Section 1: ข้อมูลผู้ใช้ (Profile Card) */}
          <div className="bg-[#1c1c1e] rounded-3xl p-8 mb-10 border border-[#2d2d2f] flex items-center gap-6 shadow-lg">
            <div className="w-24 h-24 bg-[#FF7518] rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-inner">
              {currentUser.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{currentUser}</h1>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${currentUserRole === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-300'}`}>
                  {currentUserRole === 'admin' ? 'Admin' : 'Creator'}
                </span>
                <span className="text-gray-400 text-sm">Joined recently</span>
              </div>
            </div>
          </div>

          {/* Section 2: ผลงานของฉัน (My Models) */}
          <h2 className="text-xl font-bold text-white mb-6 border-b border-[#2d2d2f] pb-4">My Uploaded Models ({myModels.length})</h2>

          {isLoading ? (
            <div className="text-center py-12 text-gray-400 animate-pulse">Loading your models...</div>
          ) : myModels.length === 0 ? (
            <div className="text-center py-20 bg-[#1c1c1e] rounded-3xl border border-[#2d2d2f]">
              <p className="text-lg font-medium text-white mb-2">You haven't uploaded any models yet.</p>
              <button onClick={() => navigate('/')} className="mt-4 bg-[#FF7518] hover:bg-orange-600 text-white px-6 py-2 rounded-full text-sm font-bold transition-colors">
                Go to Home to Upload
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {myModels.map((model) => (
                <div key={model.id} className="group bg-[#1c1c1e] rounded-3xl overflow-hidden border border-[#2d2d2f] shadow-md hover:border-[#444] transition-all duration-300 flex flex-col relative">
                  
                  {/* ปุ่มลบ */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(model.id); }}
                    className="absolute top-3 right-3 bg-black/70 hover:bg-red-500 hover:text-white text-gray-200 p-2 rounded-full shadow-sm transition-colors z-10 opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>

                  <div className="relative aspect-[4/3] overflow-hidden bg-black">
                    <img src={model.image_url} alt={model.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-white font-semibold text-lg truncate mb-1">{model.title}</h3>
                    <p className="text-xs text-gray-500">Uploaded by you</p>
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

export default ProfilePage;