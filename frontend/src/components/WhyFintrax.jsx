import "../styles/WhyFintrax.css";
import dashboardImg from '../assets/dashboard.png';
import botImg from '../assets/bot.png';
import badgesImg from '../assets/badges.png';
import goalsImg from '../assets/goals.png';
import educationImg from '../assets/education.png';
export default function WhyFintrax() {
  return (
    <section id="why-fintrax" className="why-section">
      <div className="why-header">
        <h2>¿Por qué Fintrax?</h2>
        <p>
         Porque tus finanzas merecen ser claras y fáciles de entender.  
  Fintrax combina tecnología, educación y acompañamiento para que tomes 
  el control de tu dinero con confianza.
        </p>
      </div>

      <div className="why-grid">
        <div className="why-card">
          <img src={dashboardImg} alt="Dashboard visual" />
          <h3>Dashboard visual e intuitivo</h3>
          <p>
            Consulta estadísticas, reportes y el balance de tus ingresos y gastos 
            de forma clara y sencilla.
          </p>
        </div>

        <div className="why-card">
          <img src={botImg} alt="Asistente con IA" />
          <h3>Asistente con IA</h3>
          <p>
            Haz preguntas y obtén respuestas inmediatas.  
  Un asistente financiero siempre disponible para orientarte.
          </p>
        </div>

        <div className="why-card">
          <img src={badgesImg} alt="Gamificación financiera" />
          <h3>Motivación que se siente</h3>
          <p>
             Convierte cada avance en un logro.  
  Gana recompensas y mantén la motivación en tu camino al ahorro..
          </p>
        </div>

        <div className="why-card">
          <img src={goalsImg} alt="Metas de ahorro dinámicas" />
          <h3>Construye tus objetivos</h3>
          <p>
            Define tus metas —desde un viaje hasta tu primera inversión—  
  y observa tu progreso con claridad en todo momento.
          </p>
        </div>

        <div className="why-card">
          <img src={educationImg} alt="Educación financiera" />

          <h3>Educación financiera accesible</h3>
          <p>
            Aprende a manejar tus finanzas con recursos prácticos y entretenidos.
          </p>
        </div>
      </div>
    </section>
  );
}
