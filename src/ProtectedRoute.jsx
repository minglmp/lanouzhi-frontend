import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // ดึง Token จากลิ้นชักของเบราว์เซอร์
  const token = localStorage.getItem('maker_token');

  // ถ้าไม่มี Token (ยังไม่ได้ล็อกอิน หรือกดออกจากระบบไปแล้ว)
  if (!token) {
    // ให้เด้งกลับไปหน้า /auth อัตโนมัติ (ใช้ replace เพื่อไม่ให้กด Back กลับมาหน้านี้ได้)
    return <Navigate to="/auth" replace />;
  }

  // ถ้ามี Token ก็ปล่อยให้เข้าใช้งานหน้าเว็บ (children) ได้ตามปกติ
  return children;
};

export default ProtectedRoute;