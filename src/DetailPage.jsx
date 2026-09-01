import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// ฟังก์ชันแปลงข้อมูลรูปภาพ
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
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  // State สำหรับ Checkout Modal
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [slipImage, setSlipImage] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);

  useEffect(() => {
    const fetchModelDetail = async () => {
      try {
        const res = await fetch(`https://my-cloudflare-api.lmps.workers.dev/api/models/${id}`);
        if (!res.ok) throw new Error('Model not found');
        const data = await res.json();
        setModel(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchModelDetail();
  }, [id]);

  // 1. เช็กว่าล็อกอินหรือยังก่อนเปิดหน้า Checkout
  const handleOrderClick = () => {
    const token = localStorage.getItem('maker_token');
    if (!token) {
      alert("Please log in to purchase this model.");
      navigate('/auth');
      return;
    }
    setIsCheckoutModalOpen(true);
  };

  // 2. จัดการเมื่ออัปโหลดสลิป
  const handleSlipChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // ไม่เกิน 2MB
        alert('Please select an image smaller than 2MB');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setSlipImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // 3. กดยืนยันการสั่งซื้อ
  const handleConfirmOrder = async () => {
    if (!slipImage) {
      alert('Please upload your payment slip before confirming.');
      return;
    }

    const token = localStorage.getItem('maker_token');
    setIsOrdering(true);
    
    try {
      const res = await fetch('https://my-cloudflare-api.lmps.workers.dev/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          model_id: model.id,
          slip_image: slipImage
        })
      });

      if (res.ok) {
        alert('🎉 Order submitted successfully!\n\nPlease wait for the Admin to verify your payment. Once approved, you can download the files.');
        setIsCheckoutModalOpen(false);
        setSlipImage('');
      } else {
        alert('Failed to place order. Please try again.');
      }
    } catch (err) {
      alert('Server error occurred.');
    } finally {
      setIsOrdering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white font-medium animate-pulse">
        Loading amazing details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold mb-4">Oops! {error}</h1>
        <button onClick={() => navigate('/')} className="bg-[#FF7518] px-6 py-2 rounded-full font-bold transition-colors hover:bg-orange-600">
          Go Back Home
        </button>
      </div>
    );
  }

  if (!model) return null;

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6 md:p-12 font-sans flex justify-center">
      <div className="max-w-6xl w-full">
        
        {/* ================= ปุ่มย้อนกลับ ================= */}
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group">
          <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Explore
        </button>

        <div className="flex flex-col md:flex-row gap-10">
          
          {/* ================= ฝั่งซ้าย: รูปภาพใหญ่ และ Thumbnails ================= */}
          <div className="w-full md:w-3/5 flex flex-col gap-4">
            {/* กล่องรูปภาพหลัก */}
            <div className="bg-[#1c1c1e] rounded-3xl overflow-hidden border border-[#2d2d2f] shadow-2xl relative aspect-[4/3] md:aspect-auto md:h-[600px]">
              <img 
                src={parseImages(model.image_url)[selectedImageIndex] || parseImages(model.image_url)[0]} 
                alt={model.title} 
                className="w-full h-full object-cover transition-opacity duration-300" 
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&q=80' }} 
              />
            </div>

            {/* แถบรูปขนาดย่อ (แสดงเมื่อมีมากกว่า 1 รูป) */}
            {parseImages(model.image_url).length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                {parseImages(model.image_url).map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      selectedImageIndex === idx 
                        ? 'border-[#FF7518] scale-105 shadow-lg' 
                        : 'border-[#2d2d2f] opacity-60 hover:opacity-100 hover:border-gray-500'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ================= ฝั่งขวา: รายละเอียดโมเดล (ที่หายไป) ================= */}
          <div className="w-full md:w-2/5 flex flex-col justify-center">
            {/* ป้ายหมวดหมู่ */}
            <div className="inline-block bg-[#2d2d2f] text-gray-300 text-xs font-bold px-3 py-1 rounded-full w-max mb-4">
              {model.category || 'Art'}
            </div>
            
            {/* ชื่อผลงาน */}
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
              {model.title}
            </h1>
            
            {/* ข้อมูลผู้สร้าง */}
            <div className="flex items-center gap-4 mb-10 p-4 bg-[#1c1c1e] rounded-2xl border border-[#2d2d2f]">
              <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-xl font-bold text-gray-300">
                {model.author ? model.author.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <p className="text-sm text-gray-500">Created by</p>
                <p className="text-lg font-bold text-white">{model.author}</p>
              </div>
            </div>
            {/* ================= 🌟 กล่อง Details (เพิ่มใหม่ตรงนี้) 🌟 ================= */}
            <div className="mb-6 p-5 bg-[#1c1c1e] rounded-2xl border border-[#2d2d2f] flex-1">
              <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Model Details
              </h3>
              
              {/* ส่วนเนื้อหา */}
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                {model.description 
                  ? model.description 
                  : "No description provided for this model yet. Stay tuned for more details!"}
              </p>
            </div>
            {/* ==================================================================== */}
            {/* ปุ่มสั่งซื้อ */}
            <div className="mt-auto">
              <button 
                onClick={handleOrderClick}
                className="w-full bg-[#FF7518] hover:bg-orange-600 text-white font-bold py-4 rounded-2xl text-lg transition-all shadow-lg hover:shadow-orange-500/30 flex justify-center items-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Order This Model
              </button>
            </div>
          </div>

        </div>
      </div>
      {/* ================= Checkout Modal ================= */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1c1c1e] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-[#2d2d2f] relative animate-in fade-in zoom-in duration-200">
            
            {/* ปุ่มปิด Modal */}
            <button 
              onClick={() => { setIsCheckoutModalOpen(false); setSlipImage(''); }} 
              className="absolute top-4 right-4 text-gray-400 hover:text-white bg-black/30 hover:bg-black/50 rounded-full p-2 transition-colors z-10"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-[#FF7518]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                Secure Checkout
              </h2>

              {/* สรุปออเดอร์ */}
              <div className="bg-black/50 rounded-xl p-4 mb-6 border border-[#2d2d2f]">
                <p className="text-gray-400 text-sm mb-1">Order Summary</p>
                <p className="text-white font-semibold truncate">{model.title}</p>
                <div className="flex justify-between mt-2 pt-2 border-t border-[#2d2d2f]">
                  <span className="text-gray-400 text-sm">Total Price:</span>
                  <span className="text-[#FF7518] font-bold">50,000 LAK</span> {/* 👈 ตรงนี้เดี๋ยวค่อยทำระบบราคาจริงทีหลัง */}
                </div>
              </div>

              {/* QR Code สำหรับโอนเงิน */}
              <div className="flex flex-col items-center mb-6">
                <p className="text-white font-medium mb-3 text-sm">Scan QR Code to Pay (BCEL One)</p>
                <div className="bg-white p-2 rounded-xl">
                  {/* เปลี่ยนเป็นรูป QR Code จริงของคุณได้เลย */}
                  <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" alt="QR Code" className="w-32 h-32" />
                </div>
              </div>

              {/* ช่องอัปโหลดสลิป */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-300 mb-2">Upload Payment Slip</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleSlipChange}
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#2d2d2f] file:text-white hover:file:bg-[#3d3d3f] cursor-pointer outline-none transition-all" 
                />
                {slipImage && (
                  <div className="mt-3 relative w-24 h-32 rounded-lg overflow-hidden border border-[#2d2d2f]">
                    <img src={slipImage} alt="Slip Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* ปุ่มกด Confirm */}
              <button 
                onClick={handleConfirmOrder}
                disabled={isOrdering || !slipImage}
                className="w-full bg-[#FF7518] hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex justify-center items-center"
              >
                {isOrdering ? 'Verifying...' : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ================================================= */}
    </div>
  );
};

export default DetailPage;