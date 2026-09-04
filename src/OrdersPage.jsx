import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from './assets/logo2.jpeg';

const OrdersPage = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  const token = localStorage.getItem('maker_token');
  let currentUserRole = null;
  let currentUser = null;

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUserRole = payload.role;
      currentUser = payload.username;
    } catch (e) {
      console.error('Token invalid');
    }
  }

  const fetchOrders = useCallback(async () => {
    if (!token) return;
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
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate('/auth');
    } else {
      fetchOrders();
    }
  }, [navigate, token, fetchOrders]);

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
        setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      } else {
        alert('Failed to update order status');
      }
    } catch (err) {
      alert('Server error occurred.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('maker_token');
    navigate('/');
  };

  const pendingOrdersCount = currentUserRole === 'admin' 
    ? orders.filter(order => order.status === 'pending').length 
    : 0;

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / ordersPerPage);

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
          
          <button onClick={() => navigate('/profile')} className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-white hover:bg-[#2d2d2f]/50 rounded-lg font-medium text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            My Profile
          </button>

          {/* ปุ่มนี้จะ Active เพราะอยู่หน้า Orders */}
          <button className="w-full flex items-center justify-between px-3 py-2.5 mt-2 bg-[#2d2d2f] text-white rounded-lg font-medium text-sm transition-colors">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              {currentUserRole === 'admin' ? 'Manage Orders' : 'My Purchases'}
            </div>
            {currentUserRole === 'admin' && pendingOrdersCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                {pendingOrdersCount}
              </span>
            )}
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
      <div className="flex-1 flex flex-col min-w-0 pb-12">
        <nav className="bg-[#18181a] sticky top-0 z-40 px-6 py-4 flex items-center justify-end gap-6 border-b border-[#2d2d2f]">
          <button onClick={() => navigate('/')} className="md:hidden text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 text-sm font-medium transition-colors">Logout</button>
        </nav>

        <main className="w-full max-w-5xl mx-auto px-6 mt-8">
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-[#2d2d2f] pb-4 flex items-center gap-2">
              <svg className="w-7 h-7 text-[#FF7518]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              {currentUserRole === 'admin' ? 'Manage Customer Orders' : 'My Purchase History'}
              {currentUserRole === 'admin' && pendingOrdersCount > 0 && (
                <span className="ml-2 text-sm font-medium bg-red-500/10 text-red-500 px-3 py-1 rounded-full border border-red-500/20">
                  {pendingOrdersCount} Pending
                </span>
              )}
            </h2>

            <div className="bg-[#1c1c1e] border border-[#2d2d2f] rounded-2xl overflow-hidden shadow-lg flex flex-col">
              {isLoadingOrders ? (
                <p className="text-gray-400 text-center py-12">Loading orders...</p>
              ) : orders.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-lg font-medium text-white mb-2">{currentUserRole === 'admin' ? 'No orders yet.' : 'You haven\'t purchased anything yet.'}</p>
                  <p className="text-sm opacity-80 text-gray-400">{currentUserRole === 'admin' ? 'When customers place an order, it will appear here.' : 'Head over to the home page to explore models!'}</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-sm text-gray-300">
                      <thead className="text-xs text-gray-400 uppercase bg-black/40 border-b border-[#2d2d2f]">
                        <tr>
                          {currentUserRole === 'admin' ? <th className="px-6 py-4">Buyer</th> : <th className="px-6 py-4">Order ID</th>}
                          <th className="px-6 py-4">Model</th>
                          <th className="px-6 py-4 text-center">Status</th>
                          <th className="px-6 py-4 text-center">{currentUserRole === 'admin' ? 'Action' : 'Note'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentOrders.map((order) => (
                          <tr key={order.id} className="border-b border-[#2d2d2f] hover:bg-black/20 transition-colors">
                            {currentUserRole === 'admin' ? (
                              <td className="px-6 py-4 font-medium text-white">@{order.buyer_username}</td>
                            ) : (
                              <td className="px-6 py-4 font-medium text-gray-400">#{order.id.substring(0, 8).toUpperCase()}</td>
                            )}
                            <td className="px-6 py-4 truncate max-w-[150px]">{order.model_title || order.model_id}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                                order.status === 'approved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                order.status === 'rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                              }`}>{order.status.toUpperCase()}</span>
                            </td>
                            <td className="px-6 py-4 flex justify-center gap-2">
                              {currentUserRole === 'admin' ? (
                                order.status === 'pending' ? (
                                  <>
                                    <button onClick={() => handleUpdateOrderStatus(order.id, 'approved')} className="px-3 py-1.5 bg-green-600/20 text-green-500 border border-green-600/50 hover:bg-green-600 hover:text-white rounded-lg transition-colors font-medium">Approve</button>
                                    <button onClick={() => handleUpdateOrderStatus(order.id, 'rejected')} className="px-3 py-1.5 bg-red-600/20 text-red-500 border border-red-600/50 hover:bg-red-600 hover:text-white rounded-lg transition-colors font-medium">Reject</button>
                                  </>
                                ) : (
                                  <span className="text-gray-500 text-xs italic">Reviewed</span>
                                )
                              ) : (
                                <span className="text-gray-400 text-xs">
                                  {order.status === 'approved' ? '✅ Ready to download' : order.status === 'rejected' ? '❌ Invalid slip' : '⏳ Waiting for admin'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-[#2d2d2f] bg-[#18181a]/50">
                      <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 text-sm font-medium text-white bg-[#2d2d2f] rounded-lg disabled:opacity-30 hover:bg-[#3d3d3f] transition-colors">Previous</button>
                      <span className="text-sm text-gray-400">Page <span className="font-semibold text-white">{currentPage}</span> of <span className="font-semibold text-white">{totalPages}</span></span>
                      <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-2 text-sm font-medium text-white bg-[#2d2d2f] rounded-lg disabled:opacity-30 hover:bg-[#3d3d3f] transition-colors">Next</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OrdersPage;