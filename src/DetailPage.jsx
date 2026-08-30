import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const DetailPage = () => {
  const { id } = useParams(); // ดึง ID จาก URL
  const navigate = useNavigate();
  const [model, setModel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchModelDetail = async () => {
      try {
        // ⚠️ ตรวจสอบ URL ให้ตรงกับ Worker ของคุณด้วยนะครับ
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

  if (isLoading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white font-medium animate-pulse">Loading amazing details...</div>;
  if (error) return <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-white"><h1 className="text-2xl font-bold mb-4">Oops! {error}</h1><button onClick={() => navigate('/')} className="bg-[#FF7518] px-6 py-2 rounded-full font-bold">Go Back Home</button></div>;
  if (!model) return null;

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6 md:p-12 font-sans flex justify-center">
      <div className="max-w-6xl w-full">
        
        {/* ปุ่มย้อนกลับ */}
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group">
          <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Explore
        </button>

        <div className="flex flex-col md:flex-row gap-10">
          {/* ฝั่งซ้าย: รูปภาพใหญ่ */}
          <div className="w-full md:w-3/5 bg-[#1c1c1e] rounded-3xl overflow-hidden border border-[#2d2d2f] shadow-2xl">
            <img src={model.image_url} alt={model.title} className="w-full h-full object-cover aspect-[4/3] md:aspect-auto md:h-[600px]" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&q=80' }} />
          </div>

          {/* ฝั่งขวา: รายละเอียด */}
          <div className="w-full md:w-2/5 flex flex-col justify-center">
            <div className="inline-block bg-[#2d2d2f] text-gray-300 text-xs font-bold px-3 py-1 rounded-full w-max mb-4">
              {model.category || 'Art'}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">{model.title}</h1>
            
            <div className="flex items-center gap-4 mb-10 p-4 bg-[#1c1c1e] rounded-2xl border border-[#2d2d2f]">
              <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-xl font-bold text-gray-300">
                {model.author ? model.author.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <p className="text-sm text-gray-500">Created by</p>
                <p className="text-lg font-bold text-white">{model.author}</p>
              </div>
            </div>

            <div className="mt-auto">
              <button 
                onClick={() => alert(`🎉 Proceeding to checkout for:\n"${model.title}"`)} 
                className="w-full bg-[#FF7518] hover:bg-orange-600 text-white font-bold py-4 rounded-2xl text-lg transition-all shadow-lg hover:shadow-orange-500/30 flex justify-center items-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                Order This Model
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DetailPage;