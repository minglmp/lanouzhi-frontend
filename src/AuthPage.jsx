import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from './assets/logo2.jpeg';

const AuthPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 🌟 States สำหรับ Modal ลืมรหัสผ่าน
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // ฟังก์ชัน Login / Sign Up
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const res = await fetch(`https://my-cloudflare-api.lmps.workers.dev${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            username: username.trim(), 
            password,
            role: 'user' 
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        if (isLogin) {
          localStorage.setItem('maker_token', data.token);
          navigate('/');
        } else {
          alert('Sign up successful! Please log in.');
          setIsLogin(true);
          setPassword('');
        }
      } else {
        alert(data.message || data.error || 'Authentication failed');
      }
    } catch (err) {
      alert('Server error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // 🌟 ฟังก์ชันจัดการลืมรหัสผ่าน
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotPhone || !forgotNewPassword) return alert('Please fill in all fields');
    setIsResetting(true);
    
    try {
      const res = await fetch('https://my-cloudflare-api.lmps.workers.dev/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: forgotPhone.trim(), newPassword: forgotNewPassword })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert('🎉 Password reset successfully! You can now log in with your new password.');
        setIsForgotModalOpen(false);
        setForgotPhone('');
        setForgotNewPassword('');
        setPassword('');
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
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-4 font-sans">
      
      {/* โลโก้ด้านบน */}
      <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={() => navigate('/')}>
        <img src={logoImg} alt="Logo" className="w-10 h-10 object-contain rounded-md" />
        <span className="font-bold text-2xl text-gray-900 tracking-tight">Lanouzhi.lab</span>
      </div>

      {/* กล่อง Login/Register */}
      <div className="bg-white w-full max-w-md rounded-[2rem] p-8 md:p-10 shadow-lg border border-gray-100 relative">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isLogin ? 'Sign in to manage and download your 3D models' : 'Sign up to start exploring 3D models'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ช่องกรอกเบอร์โทร */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Phone Number</label>
            <div className="flex items-center bg-[#f0f4f8] rounded-xl overflow-hidden border border-transparent focus-within:border-gray-300 focus-within:bg-white transition-all">
              <span className="px-4 text-gray-500 font-medium text-sm border-r border-gray-200">+85620</span>
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-transparent px-4 py-3.5 text-gray-900 text-sm outline-none" 
                placeholder="1234567"
              />
            </div>
          </div>

          {/* ช่องกรอกรหัสผ่าน */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-gray-900">Password</label>
              {isLogin && (
                <button 
                  type="button" 
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors hover:underline"
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
              className="w-full bg-[#f0f4f8] rounded-xl px-4 py-3.5 text-gray-900 text-sm outline-none border border-transparent focus:border-gray-300 focus:bg-white transition-all" 
              placeholder="••••••••"
            />
          </div>

          {/* ปุ่ม Sign In / Sign Up */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-[#111827] hover:bg-[#1f2937] text-white font-bold py-4 rounded-xl transition-all shadow-md mt-2 disabled:opacity-70"
          >
            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        {/* สลับหน้า Login <-> Sign Up */}
        <div className="mt-8 text-center text-sm text-gray-500">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => { setIsLogin(!isLogin); setUsername(''); setPassword(''); }} 
            className="font-bold text-gray-900 hover:underline"
          >
            {isLogin ? 'Sign up for free' : 'Sign In'}
          </button>
        </div>
      </div>

      {/* ================= 🌟 MODAL: FORGOT PASSWORD 🌟 ================= */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
              <h2 className="font-bold text-lg text-gray-900">Reset Password</h2>
              <button 
                onClick={() => setIsForgotModalOpen(false)} 
                className="text-gray-400 hover:text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-full p-1.5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Form */}
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-6">Enter your registered phone number and a new password.</p>
              
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1.5 uppercase tracking-wider">Phone Number</label>
                  <div className="flex items-center bg-gray-50 rounded-xl overflow-hidden border border-gray-200 focus-within:border-gray-400 transition-all">
                    <span className="px-3 text-gray-400 font-medium text-sm border-r border-gray-200">+85620</span>
                    <input 
                      type="text" 
                      required
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value)}
                      className="w-full bg-transparent px-3 py-2.5 text-gray-900 text-sm outline-none" 
                      placeholder="1234567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1.5 uppercase tracking-wider">New Password</label>
                  <input 
                    type="password" 
                    required
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-gray-900 text-sm outline-none border border-gray-200 focus:border-gray-400 transition-all" 
                    placeholder="Enter new password"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isResetting}
                  className="w-full bg-[#FF7518] hover:bg-orange-600 disabled:bg-gray-400 text-white font-bold py-3 rounded-xl shadow-md transition-all mt-4"
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