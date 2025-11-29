import React from 'react';
import botImage from '../../assets/botlogin.png'; // 👈 asegúrate de tener la imagen en /assets
import logo from '../../assets/logo.png';   // 👈 logo FintraX en /assets

const BrandSection = () => {
  return (
    <div className="brand-section">
      <div className="brand-overlay"></div>
      
      <div className="brand-content">
        <div className="logo-container">
          <img src={logo} alt="FintraX Logo" className="brand-logo" />
        </div>
        <div className="bot-container">
          <img src={botImage} alt="FintraX Bot" className="bot-img" />
        </div>
      </div>
    </div>
  );
};

export default BrandSection;
