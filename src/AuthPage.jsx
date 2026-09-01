import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from './assets/logorm.png';

const AuthPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  // 1. State สำหรับเก็บข้อมูลจากฟอร์ม (ไม่มี email แล้ว)
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');

  // 2. State สำหรับแสดงสถานะ
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('maker_token');
    if (token) {
      navigate('/'); 
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullPhoneNumber = `+85620${phoneNumber}`;
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const url = `https://my-cloudflare-api.lmps.workers.dev${endpoint}`; 

    const payload = isLogin ? { phone_number: fullPhoneNumber, password } : { username, phone_number: fullPhoneNumber, password };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
      }

      setSuccessMessage(data.message);
      
      if (isLogin) {
        localStorage.setItem('maker_token', data.token);
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        setPassword('');
        setTimeout(() => setIsLogin(true), 2000); 
      }

    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col justify-center items-center p-4 font-sans">
      
      {/* โลโก้แบรนด์ */}
      <a href="/" className="flex items-center gap-2 mb-8 group cursor-pointer">
        <img 
          src={logoImg} 
          alt="Lanouzhi.lab Logo" 
          className="w-10 h-10 object-contain rounded-md" 
        />
        <span className="font-bold text-2xl tracking-tight text-gray-900">Lanouzhi.lab</span>
      </a>

      {/* กล่อง Form หลัก */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {isLogin ? 'Welcome back' : 'Create a new account'}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {isLogin ? 'Sign in to manage and download your 3D models' : 'Join our community of 3D creators today'}
          </p>
        </div>

        {/* ================= ส่วนแสดงข้อความ Error / Success ================= */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 text-green-600 text-sm font-medium rounded-xl border border-green-100">
            {successMessage}
          </div>
        )}

        {/* ฟอร์มกรอกข้อมูล */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* 1. ช่อง Username (แสดงเฉพาะตอนสมัคร) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">Username</label>
                <input 
                  type="text" 
                  required
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  placeholder="Your Name" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all outline-none" 
                />
            </div>
          )}

          {/* 2. ช่องเบอร์โทรศัพท์ (แสดงตลอดทั้งตอน Login และ Register) */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Phone Number</label>
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-gray-900 focus-within:ring-1 focus-within:ring-gray-900 transition-all">
          {/* กล่องข้อความ +85620 ที่ล็อกไว้ */}
              <span className="pl-4 pr-2 py-3 text-sm font-semibold text-gray-600 bg-gray-100/50 border-r border-gray-200 select-none">
                +85620
              </span>
          {/* ช่องให้ผู้ใช้พิมพ์แค่เลขที่เหลือ */}
            <input 
              type="tel" 
              required 
              value={phoneNumber} // ⚠️ ตรวจสอบชื่อตัวแปร State ของคุณให้ตรงด้วยนะครับ
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))} // .replace(/\D/g, '') ช่วยบังคับให้พิมพ์ได้แค่ตัวเลขครับ
              placeholder="XXXX-XXXX"
              maxLength="8"
              className="w-full px-3 py-3 text-sm bg-transparent outline-none"
            />
            </div>
          </div>

          {/* 3. ช่อง Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-900">Password</label>
              {isLogin && (
                <a href="#" className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors">Forgot password?</a>
              )}
            </div>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all outline-none"
            />
          </div>

          {/* ปุ่ม Submit */}
          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full text-white font-semibold py-3.5 rounded-xl transition-all shadow-md mt-2 
              ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-black hover:shadow-lg'}`}
          >
            {isLoading 
              ? 'Processing...' 
              : isLogin ? 'Sign In' : 'Sign Up'
            }
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-600">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          {' '}
          <button 
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMessage(''); 
              setSuccessMessage('');
            }} 
            className="font-semibold text-gray-900 hover:underline transition-all"
          >
            {isLogin ? 'Sign up for free' : 'Sign In'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AuthPage;