import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import logoImg from './assets/logo2.jpeg';

const ChatPage = () => {
  const navigate = useNavigate();
  
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0); // 🌟 นับยอดแจ้งเตือนทั้งหมด
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ดึงรายชื่อผู้ติดต่อ + ยอด Unread
  const fetchContacts = async () => {
    if (!token) return;
    try {
      const res = await fetch('https://my-cloudflare-api.lmps.workers.dev/api/chat/contacts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
        
        // คำนวณยอดแจ้งเตือนรวม
        const unreadCount = data.reduce((acc, curr) => acc + curr.unread, 0);
        setTotalUnread(unreadCount);
        
        if (data.length > 0 && !activeContact) setActiveContact(data[0].name);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (contact) => {
    if (!token || !contact) return;
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
    }
  };

  useEffect(() => {
    fetchContacts();
    // 🌟 ดึงข้อมูลอัปเดตทุกๆ 3 วินาที (เพื่อให้ป้ายแดงเด้งแบบ Real-time)
    const interval = setInterval(() => {
      fetchContacts();
      if (activeContact) fetchMessages(activeContact);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeContact]);

  useEffect(() => {
    if (activeContact) {
      setIsLoading(true);
      fetchMessages(activeContact).finally(() => setIsLoading(false));
    }
  }, [activeContact]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeContact) return;
    
    const messageContent = newMessage;
    setNewMessage('');
    
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
      <Sidebar activeTab="chat"/>

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
                contacts.map((contactObj) => {
                  const isActive = activeContact === contactObj.name;
                  return (
                    <button 
                      key={contactObj.name}
                      onClick={() => setActiveContact(contactObj.name)}
                      className={`w-full text-left p-4 border-b border-[#2d2d2f] flex items-center justify-between transition-colors ${isActive ? 'bg-[#2d2d2f]' : 'hover:bg-black/20'}`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 bg-[#FF7518] rounded-full flex items-center justify-center text-white font-bold shadow-inner flex-shrink-0">
                          {contactObj.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <h3 className="text-white font-medium truncate">@{contactObj.name}</h3>
                          <p className={`text-xs truncate ${contactObj.unread > 0 && !isActive ? 'text-red-400 font-bold' : 'text-gray-400'}`}>
                            {contactObj.unread > 0 && !isActive ? 'New message!' : 'Tap to chat...'}
                          </p>
                        </div>
                      </div>
                      
                      {/* 🌟 ป้ายแจ้งเตือนสีแดง (แสดงเฉพาะคนที่ยังไม่ได้เปิดอ่าน) 🌟 */}
                      {contactObj.unread > 0 && !isActive && (
                        <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {contactObj.unread}
                        </div>
                      )}
                    </button>
                  );
                })
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
                    {activeContact.toLowerCase() === 'admin' && <span className="text-xs text-blue-400 font-medium">Support Team</span>}
                  </div>
                </div>

                {/* ข้อความแชท */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar">
                  {isLoading && messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500 text-sm">Loading...</div>
                  ) : messages.length === 0 ? (
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