import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoImg from './assets/logo2.jpeg';

const CATEGORIES = ['Art', 'Gadgets', 'Toys'];

const Topbar = ({ showSearch = false, searchQuery, setSearchQuery, onUploadSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('maker_token');
  const isLoggedIn = !!token;

  // State สำหรับระบบ Upload
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [newCategory, setNewCategory] = useState('Art');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

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
      previews.push(URL.createObjectURL(file));
    });
    setNewImageFiles((prev) => [...prev, ...validFiles]);
    setNewImagePreviews((prev) => [...prev, ...previews]);
  };

  const handleRemoveImage = (indexToRemove) => {
    setNewImageFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setNewImagePreviews((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

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
      for (const file of newImageFiles) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await fetch('https://my-cloudflare-api.lmps.workers.dev/api/upload', {
          method: 'POST',
          body: formData
        });
        if (!uploadRes.ok) throw new Error('Failed to upload image');
        const uploadData = await uploadRes.json();
        const r2PublicUrl = `https://pub-3e184cc2bc334d1fbf04415454aa22ef.r2.dev/${uploadData.fileName}`;
        uploadedUrls.push(r2PublicUrl);
      }

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
          images: uploadedUrls,
          category: newCategory
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');

      setIsUploadModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewPrice('');
      setNewImageFiles([]);
      setNewImagePreviews([]);

      // ถ้าอยู่หน้า Home ให้เรียกฟังก์ชันอัปเดต ถ้าอยู่หน้าอื่นให้เด้งกลับ Home
      if (onUploadSuccess) {
        onUploadSuccess();
      } else {
        navigate('/');
      }
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('maker_token');
    window.location.href = '/';
  };

  return (
    <>
      <nav className="bg-[#121212] flex-shrink-0 sticky top-0 z-40 px-6 py-4 flex items-center justify-between gap-6 border-b border-[#2d2d2f]">
        <div className="flex items-center gap-4">
          {showBack ? (
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back
            </button>
          ) : (
            <div className="flex md:hidden items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <img src={logoImg} alt="Logo" className="w-8 h-8 object-contain rounded-md" />
            </div>
          )}
        </div>

        {/* ช่องค้นหา (แสดงเฉพาะหน้าที่มีการส่งค่า showSearch = true) */}
        <div className="flex-1 max-w-4xl">
          {showSearch && (
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search models or users name..."
                className="w-full bg-[#262628] border border-transparent text-gray-200 rounded-full py-2 pl-11 pr-10 text-sm focus:bg-[#2d2d2f] focus:border-[#444] outline-none transition-all placeholder-gray-500"
              />
            </div>
          )}
        </div>

        {/* ปุ่มด้านขวา */}
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <button onClick={() => setIsUploadModalOpen(true)} className="bg-[#262628] hover:bg-[#333] text-white px-5 py-2 rounded-full text-sm font-medium transition-colors border border-gray-700 shadow-sm">
                + Upload
              </button>
              <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 text-sm font-medium transition-colors">
                Logout
              </button>
            </>
          ) : (
            <button onClick={() => navigate('/auth')} className="bg-[#262628] hover:bg-[#333] text-white px-6 py-2 rounded-full text-sm font-medium transition-colors border border-gray-700 shadow-sm">
              Log In
            </button>
          )}
        </div>
      </nav>

      {/* ================= Upload Modal ================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload New Model 🎨</h2>
            {uploadError && <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">{uploadError}</div>}
            <form onSubmit={handleUploadSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">Model Name</label>
                <input type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g., Articulated Dragon" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">Description (Optional)</label>
                <textarea rows="3" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Tell us about this model..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none resize-none"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">Price (LAK)</label>
                <div className="relative">
                  <input type="number" min="0" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="e.g., 50000 (Leave 0 for Free)" className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-12 py-3 text-sm outline-none" />
                  <span className="absolute right-4 top-3 text-gray-400 text-sm font-bold">₭</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">Model Images (Up to 4)</label>
                <input type="file" accept="image/*" multiple onChange={handleImageChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-900 hover:file:bg-gray-200 transition-all outline-none cursor-pointer" />
                {newImagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {newImagePreviews.map((img, index) => (
                      <div key={index} className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                        <img src={img} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => handleRemoveImage(index)} className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-1 hover:bg-red-500 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">Category</label>
                <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none">
                  {CATEGORIES.filter(c => c !== 'All' && c !== 'New').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => { setIsUploadModalOpen(false); setNewImageFiles([]); setNewImagePreviews([]); }} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3.5 rounded-xl transition-all">Cancel</button>
                <button type="submit" disabled={isUploading || newImageFiles.length === 0} className={`flex-1 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md ${ (isUploading || newImageFiles.length === 0) ? 'bg-gray-600 text-gray-400 cursor-not-allowed shadow-none' : 'bg-gray-900 hover:bg-black hover:shadow-lg' }`}>
                  {isUploading ? 'Uploading...' : 'Upload Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Topbar;