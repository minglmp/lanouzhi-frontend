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

  // 🌟 3. State สำหรับ Modal ลืมรหัสผ่าน (เพิ่มใหม่)
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

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

  // 🌟 4. ฟังก์ชันจัดการลืมรหัสผ่าน (เพิ่มใหม่)
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotPhone || !forgotNewPassword) {
      setErrorMessage('Please fill in all fields');
      return;
    }
    
    setIsResetting(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    // แปลงเบอร์โทรให้มี +85620 นำหน้า เพื่อให้ตรงกับในฐานข้อมูล
    const fullForgotPhone = `+85620${forgotPhone}`;
    
    try {
      const res = await fetch('https://my-cloudflare-api.lmps.workers.dev/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: fullForgotPhone, newPassword: forgotNewPassword })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert('🎉 Password reset successfully! You can now log in with your new password.');
        setIsForgotModalOpen(false);
        setForgotPhone('');
        setForgotNewPassword('');
        setPassword(''); // เคลียร์รหัสผ่านเดิมในหน้า Login
      } else {
        alert(data.message || 'Failed to reset password');
      }
    } catch (err) {
      alert('Server error occurred.');
    } finally {
      setIsResetting(false);
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
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10 relative">
        
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
              value={phoneNumber} 
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
                // 🌟 เปลี่ยนจาก <a> เป็น <button> เพื่อเปิด Modal ลืมรหัสผ่าน
                <button 
                  type="button" 
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors hover:underline"
                >
                  Forgot password?
                </button>
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

      {/* ================= 🌟 5. MODAL: FORGOT PASSWORD (เพิ่มใหม่) 🌟 ================= */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
              <h2 className="font-bold text-lg text-gray-900">Reset Password</h2>
              <button 
                onClick={() => { setIsForgotModalOpen(false); setErrorMessage(''); }} 
                className="text-gray-400 hover:text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-full p-1.5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Form */}
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-6">Enter your registered phone number and a new password.</p>
              
              <form onSubmit={handleForgotPassword} className="space-y-5">
                
                {/* ช่องกรอกเบอร์ (มี +85620 ล็อกไว้เหมือนกัน) */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">Phone Number</label>
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-gray-900 focus-within:ring-1 focus-within:ring-gray-900 transition-all">
                    <span className="pl-4 pr-2 py-3 text-sm font-semibold text-gray-600 bg-gray-100/50 border-r border-gray-200 select-none">
                      +85620
                    </span>
                    <input 
                      type="tel" 
                      required
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-3 text-sm bg-transparent outline-none" 
                      placeholder="XXXX-XXXX"
                      maxLength="8"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">New Password</label>
                  <input 
                    type="password" 
                    required
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all outline-none" 
                    placeholder="Enter new password"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isResetting}
                  className={`w-full text-white font-semibold py-3.5 rounded-xl shadow-md transition-all mt-2 
                    ${isResetting ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-black hover:shadow-lg'}`}
                >
                  {isResetting ? 'Resetting...' : 'Confirm Reset Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default AuthPage;