// pages/ForgotPasswordPage.jsx
import React from 'react';
import Navbar from '../components/Navbar.jsx';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import BrandSection from '../components/auth/BrandSection';
import '../styles/login.css'; 

const ForgotPasswordPage = () => {
  return (
    <>
      <Navbar />
      <div className="login-container">
        <div className="login-box">
          <BrandSection />
          <div className="form-section">
            <div className="form-wrapper">
              <ForgotPasswordForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;