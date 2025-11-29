// pages/ResetPasswordPage.jsx
import React from 'react';
import Navbar from '../components/Navbar.jsx';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';
import BrandSection from '../components/auth/BrandSection';
import '../styles/login.css'; // Reutiliza los mismos estilos

const ResetPasswordPage = () => {
  return (
    <>
      {/* Navbar */}
      <Navbar />
      {/* Login Container */}
      <div className="login-container">
        <div className="login-box">
          <BrandSection />
          <div className="form-section">
            <div className="form-wrapper">
              <ResetPasswordForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPasswordPage;