import React from "react";
import "../styles/CallToAction.css";

const CallToAction = () => {
  return (
    <section className="cta-section">
      <div className="cta-content">
        <h2 className="cta-title">
          ¿Listo para llevar tus finanzas al siguiente nivel?
        </h2>
        <p className="cta-text">
          Empieza ahora y toma el control de tu futuro financiero con Fintrax.
        </p>
        <div className="cta-actions">
          <button className="cta-btn">Empezar ahora</button>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
