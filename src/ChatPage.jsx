import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from './assets/logo2.jpeg';

const ChatPage = () => {
  const navigate = useNavigate();
  
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem('maker_token');
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
    if (!token) navigate('/auth');
  }, [navigate, token]);

  // เลื่อนหน้าจอลงล่างสุดอัตโนมัติเวลาแชทอัปเดต
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ดึงรายชื่อผู้ติดต่อ
  const fetchContacts = async () => {
    if (!token) return;
    try {
      const res = await fetch('https://my-cloudflare-api.lmps.workers.dev/api/chat/contacts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
        if (data.length > 0 && !activeContact) setActiveContact(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ดึงประวัติแชทของคนที่เรากำลังคุยด้วย
  const fetchMessages = async (contact) => {
    if (!token || !contact) return;
    setIsLoading(true);
    try {
      const res = await fetch(`https://my-cloudflare-api.lmps.workers.dev/api/chat/${contact}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
    // ตั้งเวลาให้ดึงแชทอัตโนมัติทุกๆ 3 วินาที (เพื่อให้คุยกันได้แบบไม่ต้องกด Refresh)
    const interval = setInterval(() => {
      if (activeContact) fetchMessages(activeContact);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeContact]);

  useEffect(() => {
    if (activeContact) fetchMessages(activeContact);
  }, [activeContact]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeContact) return;
    
    const messageContent = newMessage;
    setNewMessage('');
    
    // โชว์ข้อความที่เราพิมพ์ฝั่งเราก่อนทันที (Optimistic)
    setMessages(prev => [...prev, { id: Date.now(), sender: currentUser, receiver: activeContact, content: messageContent, created_at: new Date().toISOString() }]);

    try {
      await fetch('https://my-cloudflare-api.lmps.workers.dev/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ receiver: activeContact, content: messageContent })
      });
      fetchMessages(activeContact);
    } catch (err) {
      console.error('Failed to send', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('maker_token');
    navigate('/');
  };

  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen bg-[#18181a] font-sans relative">
      {/* ================= Sidebar ================= */}
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
          
          <button onClick={() => navigate('/profile')} className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-white hover:bg-[#2d2d2f]/50 rounded-lg font-medium text-sm transition-colors mt-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            My Profile
          </button>

          <button onClick={() => navigate('/orders')} className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-white hover:bg-[#2d2d2f]/50 rounded-lg font-medium text-sm transition-colors mt-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            {currentUserRole === 'admin' ? 'Manage Orders' : 'My Purchases'}
          </button>

          <button onClick={() => navigate('/favorites')} className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-white hover:bg-[#2d2d2f]/50 rounded-lg font-medium text-sm transition-colors mt-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            My Favorites
          </button>

          {/* 🌟 ปุ่ม Chat สถานะ Active 🌟 */}
          <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-[#2d2d2f] text-white rounded-lg font-medium text-sm transition-colors mt-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Chat
          </button>
        </nav>
        {/* Footer */}
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

      {/* ================= Main Content ================= */}
      <div className="flex-1 flex flex-col min-w-0 pb-0 h-screen overflow-hidden">
        <nav className="bg-[#121212] flex-shrink-0 z-40 px-6 py-4 flex items-center justify-end gap-6 border-b border-[#2d2d2f]">
          <button onClick={() => navigate('/')} className="md:hidden text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 text-sm font-medium transition-colors">Logout</button>
        </nav>

        {/* พื้นที่แชทหลัก */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* ช่องซ้าย: รายชื่อผู้ติดต่อ */}
          <div className="w-[300px] border-r border-[#2d2d2f] bg-[#1c1c1e] flex flex-col">
            <div className="p-4 border-b border-[#2d2d2f]">
              <h2 className="text-lg font-bold text-white">Messages</h2>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar">
              {contacts.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">No conversations yet.</div>
              ) : (
                contacts.map((contact) => (
                  <button 
                    key={contact}
                    onClick={() => setActiveContact(contact)}
                    className={`w-full text-left p-4 border-b border-[#2d2d2f] flex items-center gap-3 transition-colors ${activeContact === contact ? 'bg-[#2d2d2f]' : 'hover:bg-black/20'}`}
                  >
                    <div className="w-10 h-10 bg-[#FF7518] rounded-full flex items-center justify-center text-white font-bold shadow-inner flex-shrink-0">
                      {contact.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="text-white font-medium truncate">@{contact}</h3>
                      <p className="text-xs text-gray-400 truncate">Tap to chat...</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* ช่องขวา: กล่องแชท */}
          <div className="flex-1 flex flex-col bg-[#121212]">
            {activeContact ? (
              <>
                {/* Header แชท */}
                <div className="p-4 border-b border-[#2d2d2f] bg-[#1c1c1e] flex items-center gap-3 shadow-sm">
                  <div className="w-10 h-10 bg-[#FF7518] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {activeContact.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">@{activeContact}</h3>
                    {activeContact === 'admin' && <span className="text-xs text-blue-400 font-medium">Support Team</span>}
                  </div>
                </div>

                {/* ข้อความแชท */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                      Start a conversation with @{activeContact}
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isMe = msg.sender === currentUser;
                      return (
                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] rounded-2xl px-5 py-3 shadow-sm ${
                            isMe 
                              ? 'bg-[#FF7518] text-white rounded-tr-sm' 
                              : 'bg-[#2d2d2f] text-gray-100 rounded-tl-sm'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-orange-200' : 'text-gray-400'}`}>
                              {new Date(msg.created_at.replace(' ', 'T') + 'Z').toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* ช่องพิมพ์ข้อความ */}
                <div className="p-4 bg-[#1c1c1e] border-t border-[#2d2d2f]">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <input 
                      type="text" 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 bg-[#262628] text-white rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF7518] transition-shadow placeholder-gray-500"
                    />
                    <button 
                      type="submit" 
                      disabled={!newMessage.trim()}
                      className="w-11 h-11 bg-[#FF7518] text-white rounded-full flex items-center justify-center disabled:opacity-50 transition-opacity flex-shrink-0"
                    >
                      <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <svg className="w-16 h-16 text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>Select a contact to start chatting</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ChatPage;