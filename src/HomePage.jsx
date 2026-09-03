import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from './assets/logo2.jpeg';

const CATEGORIES = ['All', 'New', 'Art', 'Gadgets', 'Toys'];

// ฟังก์ชันสำหรับแปลงข้อมูลรูปภาพ
const parseImages = (imageUrlField) => {
  try {
    const parsed = JSON.parse(imageUrlField);
    return Array.isArray(parsed) ? parsed : [imageUrlField];
  } catch {
    return [imageUrlField];
  }
};

const HomePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(CATEGORIES[0]);

  const [models, setModels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // States สำหรับ Upload Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPrice, setNewPrice] = useState('');
  
  // 🌟 แยกระหว่าง "ไฟล์จริง" ที่จะส่งไปหลังบ้าน กับ "รูปลิงก์ชั่วคราว" สำหรับพรีวิว
  const [newImageFiles, setNewImageFiles] = useState([]); 
  const [newImagePreviews, setNewImagePreviews] = useState([]); 
  
  const [newCategory, setNewCategory] = useState('Art');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // ตรวจสอบการล็อกอิน
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

  const fetchModels = async () => {
    try {
      const response = await fetch('https://my-cloudflare-api.lmps.workers.dev/api/models');
      if (response.ok) {
        const data = await response.json();
        setModels(data);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  // 🌟 จัดการเมื่อเลือกไฟล์รูปภาพ (ปรับให้เก็บ File แทน Base64)
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (newImageFiles.length + files.length > 4) {
      alert('You can upload up to 4 images per model.');
      return;
    }

    const validFiles = [];
    const previews = [];

    files.forEach((file) => {
      if (file.size > 1024 * 1024) {
        alert(`File "${file.name}" exceeds 1MB.`);
        return;
      }
      validFiles.push(file);
      // สร้าง URL จำลองเพื่อให้หน้าเว็บแสดงรูปพรีวิวได้ทันที
      previews.push(URL.createObjectURL(file)); 
    });

    setNewImageFiles((prev) => [...prev, ...validFiles]);
    setNewImagePreviews((prev) => [...prev, ...previews]);
  };

  // ลบรูปภาพที่เลือกไว้
  const handleRemoveImage = (indexToRemove) => {
    setNewImageFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setNewImagePreviews((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // 🌟 ส่งข้อมูลอัปโหลด (ทำงาน 2 สเตป: ขึ้น R2 -> บันทึก D1)
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (newImageFiles.length === 0) {
      setUploadError('Please select at least one image before uploading.');
      return;
    }
    
    setIsUploading(true);
    setUploadError('');

    try {
      const uploadedUrls = [];

      // สเตปที่ 1: อัปโหลดรูปทีละไฟล์ไปที่ R2
      for (const file of newImageFiles) {
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch('https://my-cloudflare-api.lmps.workers.dev/api/upload', {
          method: 'POST',
          body: formData // ไม่ต้องใส่ Content-Type เดี๋ยวเบราว์เซอร์จัดการให้เอง
        });

        if (!uploadRes.ok) throw new Error('Failed to upload image to Cloudflare R2');
        
        const uploadData = await uploadRes.json();
        
        // นำชื่อไฟล์มาต่อกับ Public URL ของคุณ
        const r2PublicUrl = `https://pub-3e184cc2bc334d1fbf04415454aa22ef.r2.dev/${uploadData.fileName}`;
        uploadedUrls.push(r2PublicUrl);
      }

      // สเตปที่ 2: นำ URL ที่ได้ไปบันทึกลง Database D1
      const res = await fetch('https://my-cloudflare-api.lmps.workers.dev/api/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          price: Number(newPrice) || 0,
          images: uploadedUrls, // 👈 ส่งเป็น Array ของ Public URL แทน
          category: newCategory
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error_detail || 'Upload failed');

      // เคลียร์ค่าทั้งหมดหลังอัปโหลดสำเร็จ
      setIsUploadModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewPrice('');
      setNewImageFiles([]);
      setNewImagePreviews([]);
      fetchModels();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('maker_token');
    window.location.reload();
  };

  // ระบบค้นหาและกรองหมวดหมู่
  const [searchQuery, setSearchQuery] = useState('');

  const filteredModels = models.filter((model) => {
    const query = searchQuery.toLowerCase();
    const matchTitle = model.title.toLowerCase().includes(query);
    const matchAuthor = model.author && model.author.toLowerCase().includes(query);
    const matchSearch = matchTitle || matchAuthor;

    let matchCategory = true;

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

      {/* ================= 1. Sidebar ด้านซ้าย ================= */}
      <aside className="w-[240px] bg-[#1E1E1E] border-r border-[#2d2d2f] hidden md:flex flex-col sticky top-0 h-screen z-50">
        <div className="p-4 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer">
            <img src={logoImg} alt="Logo" className="w-7 object-contain rounded-md" />
            <span className="font-bold text-[17px] text-white tracking-tight">Lanouzhi.lab</span>
          </div>
          <button className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
          </button>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-white bg-[#2d2d2f] rounded-lg font-medium text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            Home
          </button>
          {isLoggedIn && (
            <button
              onClick={() => navigate('/profile')}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-white hover:bg-[#2d2d2f]/50 rounded-lg font-medium text-sm transition-colors mt-4"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              My Profile
            </button>
          )}
        </nav>
        <div className="mt-auto p-4 border-t border-[#2d2d2f]">
          <div className="flex items-center gap-4 mb-4 text-gray-500">
            <a href="#" className="hover:text-gray-300 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>
            </a>
            <a href="#" className="hover:text-gray-300 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            <a href="#" className="hover:text-gray-300 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
            </a>
            <a href="#" className="hover:text-gray-300 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
            </a>
          </div>
          <div className="text-[11px] text-gray-600 font-medium">
            © 2026 Lanouzhi.lab
          </div>
        </div>
      </aside>

      {/* ================= 2. พื้นที่เนื้อหาหลัก ================= */}
      <div className="flex-1 flex flex-col min-w-0 pb-12">

        {/* ================= Top Navbar ================= */}
        <nav className="bg-[#121212] sticky top-0 z-40 px-6 py-4 flex items-center justify-between gap-6">
          <div className="flex md:hidden items-center gap-2 cursor-pointer">
            <img src={logoImg} alt="Logo" className="w-8 h-8 object-contain rounded-md" />
          </div>

          <div className="flex-1 max-w-4xl">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search models or users name..."
                className="w-full bg-[#262628] border border-transparent text-gray-200 rounded-full py-2 pl-11 pr-10 text-sm focus:bg-[#2d2d2f] focus:border-[#444] outline-none transition-all placeholder-gray-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <button onClick={() => setIsUploadModalOpen(true)} className="hidden sm:block bg-[#262628] hover:bg-[#333] text-white px-5 py-2 rounded-full text-sm font-medium transition-colors border border-gray-700">
                  + Upload
                </button>
                <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 text-sm font-medium transition-colors">
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                className="bg-[#262628] hover:bg-[#333] text-white px-6 py-2 rounded-full text-sm font-medium transition-colors border border-gray-700 shadow-sm"
              >
                Log In
              </button>
            )}
          </div>
        </nav>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredModels.map((model) => (
                <div
                  key={model.id}
                  onClick={() => navigate(`/model/${model.id}`)}
                  className="group bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col relative cursor-pointer"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-800">
                    <img
                      src={parseImages(model.image_url)[0]}
                      alt={model.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&q=80' }}
                    />

                    {/* ป้ายกำกับ: โชว์เฉพาะตอนที่มีมากกว่า 1 รูป */}
                    {parseImages(model.image_url).length > 1 && (
                      <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-md border border-gray-700 shadow-sm z-10">
                        +{parseImages(model.image_url).length - 1} photos
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-white font-semibold text-lg truncate mb-1">{model.title}</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-300">
                        {model.author ? model.author.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span className="text-sm text-gray-400 truncate">{model.author}</span>
                    </div>

                    <div className="mt-auto">
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/model/${model.id}`); }} 
                        className="w-full bg-[#FF7518] hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl transition-colors shadow-sm hover:shadow-md flex justify-center items-center gap-2"
                      >
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

      {/* ================= Upload Modal ================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload New Model 🎨</h2>

            {uploadError && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">Model Name</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Articulated Dragon"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">Description (Optional)</label>
                <textarea
                  rows="3"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Tell us about this model..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all outline-none resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">Price (LAK)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="e.g., 50000 (Leave 0 for Free)"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:bg-white focus:border-gray-900 focus:ring-1 outline-none"
                  />
                  <span className="absolute right-4 top-3 text-gray-400 text-sm font-bold">₭</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">Model Images (Up to 4)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple 
                  onChange={handleImageChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-900 hover:file:bg-gray-200 transition-all outline-none cursor-pointer"
                />

                {/* 🌟 แสดงพรีวิวด้วย URL จำลอง 🌟 */}
                {newImagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {newImagePreviews.map((img, index) => (
                      <div key={index} className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                        <img src={img} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-1 hover:bg-red-500 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all outline-none"
                >
                  {CATEGORIES.filter(c => c !== 'All' && c !== 'New').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setNewImageFiles([]);
                    setNewImagePreviews([]);
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3.5 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || newImageFiles.length === 0}
                  className={`flex-1 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md ${
                    (isUploading || newImageFiles.length === 0)
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed shadow-none'
                      : 'bg-gray-900 hover:bg-black hover:shadow-lg'
                  }`}
                >
                  {isUploading ? 'Uploading...' : 'Upload Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;