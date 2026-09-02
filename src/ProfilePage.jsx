import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from './assets/logo2.jpeg';

const CATEGORIES = ['All', 'New', 'Art', 'Gadgets', 'Toys'];

// ฟังก์ชันแปลงข้อมูลรูปภาพ
const parseImages = (imageUrlField) => {
  try {
    const parsed = JSON.parse(imageUrlField);
    return Array.isArray(parsed) ? parsed : [imageUrlField];
  } catch {
    return [imageUrlField];
  }
};

const ProfilePage = () => {
  const navigate = useNavigate();

  // ================= State Management =================
  // State สำหรับจัดการผลงาน
  const [myModels, setMyModels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State สำหรับจัดการระบบแอดมิน (Orders)
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // State สำหรับระบบแก้ไขผลงาน (Edit Modal)
  const [editingModel, setEditingModel] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [editCategory, setEditCategory] = useState('Art');
  const [editImages, setEditImages] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // ================= Authentication =================
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

  // ================= API Functions =================
  const fetchMyModels = useCallback(async () => {
    try {
      const response = await fetch('https://my-cloudflare-api.lmps.workers.dev/api/models');
      if (response.ok) {
        const allModels = await response.json();
        const filtered = currentUserRole === 'admin'
          ? allModels
          : allModels.filter((model) => model.author === currentUser);
        setMyModels(filtered);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, currentUserRole]);

  const fetchAdminOrders = useCallback(async () => {
    if (currentUserRole !== 'admin' || !token) return;

    setIsLoadingOrders(true);
    try {
      const res = await fetch('https://my-cloudflare-api.lmps.workers.dev/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [currentUserRole, token]);

  // Initial Load
  useEffect(() => {
    if (!token) {
      navigate('/auth');
    } else {
      fetchMyModels();
      fetchAdminOrders();
    }
  }, [navigate, token, fetchMyModels, fetchAdminOrders]);

  // ================= Event Handlers =================
  const handleLogout = () => {
    localStorage.removeItem('maker_token');
    navigate('/');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this model?')) return;
    try {
      const res = await fetch(`https://my-cloudflare-api.lmps.workers.dev/api/models/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchMyModels();
      }
    } catch (err) {
      alert('Server error occurred.');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`https://my-cloudflare-api.lmps.workers.dev/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        alert(`Order has been ${newStatus}!`);
        setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      } else {
        alert('Failed to update order status');
      }
    } catch (err) {
      alert('Server error occurred.');
    }
  };

  // ----- Edit Modal Handlers -----
  const handleEditClick = (model) => {
    setEditingModel(model);
    setEditTitle(model.title);
    setEditDescription(model.description || '');
    setEditPrice(model.price || 0);
    setEditCategory(model.category || 'Art');
    setEditImages(parseImages(model.image_url));
  };

  const handleEditImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (editImages.length + files.length > 4) {
      alert('You can upload up to 4 images per model.');
      return;
    }

    files.forEach((file) => {
      if (file.size > 1024 * 1024) {
        alert(`File "${file.name}" exceeds 1MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImages((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveEditImage = (indexToRemove) => {
    setEditImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (editImages.length === 0) {
      alert('Please provide at least one image.');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`https://my-cloudflare-api.lmps.workers.dev/api/models/${editingModel.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          images: editImages,
          category: editCategory,
          price: Number(editPrice),
        }),
      });

      if (res.ok) {
        setEditingModel(null);
        fetchMyModels();
      } else {
        alert('Failed to update model.');
      }
    } catch (err) {
      alert('Server error occurred.');
    } finally {
      setIsUpdating(false);
    }
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
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-white bg-[#2d2d2f] rounded-lg font-medium text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            My Profile
          </button>
        </nav>
      </aside>

      {/* ================= Main Content ================= */}
      <div className="flex-1 flex flex-col min-w-0 pb-12">
        <nav className="bg-[#18181a] sticky top-0 z-40 px-6 py-4 flex items-center justify-end gap-6 border-b border-[#2d2d2f]">
          <button onClick={() => navigate('/')} className="md:hidden text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 text-sm font-medium transition-colors">
            Logout
          </button>
        </nav>

        <main className="w-full max-w-5xl mx-auto px-6 mt-8">
          {/* ----- Profile Card ----- */}
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

          {/* ----- ADMIN ORDER MANAGEMENT ----- */}
          {currentUserRole === 'admin' && (
            <div className="mb-12">
              <h2 className="text-xl font-bold text-white mb-6 border-b border-[#2d2d2f] pb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-[#FF7518]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                Customer Orders (Needs Verification)
              </h2>

              <div className="bg-[#1c1c1e] border border-[#2d2d2f] rounded-2xl overflow-hidden">
                {isLoadingOrders ? (
                  <p className="text-gray-400 text-center py-8">Loading orders...</p>
                ) : orders.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No orders yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                      <thead className="text-xs text-gray-400 uppercase bg-black/40 border-b border-[#2d2d2f]">
                        <tr>
                          <th className="px-6 py-4">Buyer</th>
                          <th className="px-6 py-4">Model</th>
                          <th className="px-6 py-4 text-center">Payment Slip</th>
                          <th className="px-6 py-4 text-center">Status</th>
                          <th className="px-6 py-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id} className="border-b border-[#2d2d2f] hover:bg-black/20">
                            <td className="px-6 py-4 font-medium text-white">@{order.buyer_username}</td>
                            <td className="px-6 py-4 truncate max-w-[150px]">{order.model_title || order.model_id}</td>
                            
                            <td className="px-6 py-4 text-center">
                              <a href={order.slip_image} target="_blank" rel="noreferrer" className="text-[#FF7518] hover:underline flex flex-col items-center gap-1">
                                <img src={order.slip_image} alt="Slip" className="w-10 h-14 object-cover rounded border border-[#2d2d2f]" />
                                <span className="text-xs">View Slip</span>
                              </a>
                            </td>
                            
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                order.status === 'approved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                order.status === 'rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                              }`}>
                                {order.status.toUpperCase()}
                              </span>
                            </td>
                            
                            <td className="px-6 py-4 flex justify-center gap-2">
                              {order.status === 'pending' && (
                                <>
                                  <button onClick={() => handleUpdateOrderStatus(order.id, 'approved')} className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors">Approve</button>
                                  <button onClick={() => handleUpdateOrderStatus(order.id, 'rejected')} className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors">Reject</button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ----- All Models Section ----- */}
          <h2 className="text-xl font-bold text-white mb-6 border-b border-[#2d2d2f] pb-4">
            {currentUserRole === 'admin' ? 'All Models in System (Admin View)' : 'My Uploaded Models'} ({myModels.length})
          </h2>

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
                  
                  <div className="absolute top-3 right-3 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditClick(model); }}
                      className="bg-black/70 hover:bg-blue-500 hover:text-white text-gray-200 p-2 rounded-full shadow-sm transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(model.id); }}
                      className="bg-black/70 hover:bg-red-500 hover:text-white text-gray-200 p-2 rounded-full shadow-sm transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>

                  <div className="relative aspect-[4/3] overflow-hidden bg-black">
                    <img 
                      src={parseImages(model.image_url)[0]} 
                      alt={model.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    {parseImages(model.image_url).length > 1 && (
                      <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-md border border-gray-700 shadow-sm z-10 pointer-events-none">
                        +{parseImages(model.image_url).length - 1} photos
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="text-white font-semibold text-lg truncate mb-1">{model.title}</h3>
                    <p className="text-xs text-gray-500">
                      {model.author === currentUser ? 'Uploaded by you' : `Uploaded by @${model.author}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ----- Edit Modal ----- */}
          {editingModel && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
                <button onClick={() => setEditingModel(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors z-10">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="p-8 max-h-[90vh] overflow-y-auto hide-scrollbar">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Model 🎨</h2>
                  <form onSubmit={handleUpdateSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1.5">Model Name</label>
                      <input
                        type="text" required value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-gray-900 focus:ring-1 outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1.5">Description</label>
                      <textarea
                        rows="3"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-gray-900 focus:ring-1 outline-none resize-none"
                      ></textarea>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1.5">Model Images (Up to 4)</label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple
                        onChange={handleEditImageChange} 
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-900 hover:file:bg-gray-200 cursor-pointer outline-none" 
                      />
                      
                      {editImages.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mt-4">
                          {editImages.map((img, index) => (
                            <div key={index} className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                              <img src={img} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                              <button 
                                type="button"
                                onClick={() => handleRemoveEditImage(index)} 
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
                        value={editCategory} onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-gray-900 focus:ring-1 outline-none"
                      >
                        {CATEGORIES.filter(c => c !== 'All' && c !== 'New').map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1.5">Price (LAK)</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          placeholder="e.g., 50000 (Leave 0 for Free)"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:bg-white focus:border-gray-900 focus:ring-1 outline-none"
                        />
                        <span className="absolute right-4 top-3 text-gray-400 text-sm font-bold">₭</span>
                      </div>
                    </div>
                    
                    <button type="submit" disabled={isUpdating || editImages.length === 0} className="w-full bg-[#FF7518] hover:bg-orange-600 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md disabled:bg-gray-400 mt-4">
                      {isUpdating ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;