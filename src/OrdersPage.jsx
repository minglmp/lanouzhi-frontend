import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
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

  // 🌟 ฟังก์ชันแปลงวันที่ให้ดูอ่านง่าย (เช่น 10 Sep 2026)
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    // แปลงรูปแบบที่มาจาก SQLite (YYYY-MM-DD HH:MM:SS) ให้ Date ของ JavaScript รู้จัก
    const date = new Date(dateString.replace(' ', 'T') + 'Z');
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen bg-[#18181a] font-sans relative">
      
      <Sidebar activeTab="orders"/>

      {/* ================= Main Content ================= */}
      <div className="flex-1 flex flex-col min-w-0 pb-12">
        <Topbar />

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
                          
                          {/* 🌟 เพิ่มคอลัมน์ DATE ตรงนี้ 🌟 */}
                          <th className="px-6 py-4">Date</th>
                          
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
                            
                            {/* 🌟 แสดงวันที่สั่งซื้อ 🌟 */}
                            <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                              {formatDate(order.created_at)}
                            </td>

                            <td className="px-6 py-4 truncate max-w-[150px] text-gray-200">{order.model_title || order.model_id}</td>
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
                                  {order.status === 'approved' ? '✅ Ready' : order.status === 'rejected' ? '❌ Invalid slip' : '⏳ Waiting for admin'}
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