import "../styles/FAQ.css";
import { useState } from "react";

export default function FAQ() {
  const faqs = [
    {
      question: "¿Cómo creo mi cuenta en Fintrax?",
      answer:
        "Puedes registrarte usando tu correo electrónico y una contraseña segura. Una vez registrado, recibirás un email de verificación para activar tu cuenta."
    },
    {
      question: "¿Es segura mi información financiera?",
      answer:
        "Sí, todos tus datos se encriptan y almacenan de manera segura, cumpliendo con los estándares de protección de información financiera."
    },
    {
      question: "¿Cómo agrego mis ingresos y gastos?",
      answer:
        "Dentro del módulo de Gestión de Finanzas puedes registrar tus transacciones y categorizarlas para un seguimiento detallado."
    },
    {
      question: "¿Puedo establecer metas de ahorro y seguimiento?",
      answer:
        "Sí, puedes crear metas de ahorro personalizadas y seguir tu progreso en el dashboard, con alertas y notificaciones inteligentes."
    },
    {
      question: "¿Cómo funciona el ChatBot de inteligencia artificial?",
      answer:
        "Nuestro ChatBot te ayuda a organizar tus finanzas, responder dudas y sugerir estrategias de ahorro de manera instantánea."
    },
    {
      question: "¿Qué es la gamificación y cómo me beneficia?",
      answer:
        "La gamificación convierte tus hábitos financieros en retos y logros, motivándote a cumplir metas de ahorro y buen manejo de tu dinero."
    },
    {
      question: "¿Puedo acceder desde mi celular o tablet?",
      answer:
        "Sí, Fintrax está diseñado para ser completamente responsivo y accesible desde cualquier dispositivo."
    },
    {
      question: "¿Qué pasa si pierdo mi contraseña?",
      answer:
        "Puedes restablecer tu contraseña desde la página de login usando la opción 'Olvidé mi contraseña', recibirás instrucciones por email."
    }
  ];

  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section id="faq" className="faq-section">
      <h2>Preguntas Frecuentes</h2>
      <div className="faq-container">
        {faqs.map((item, index) => (
          <div
            key={index}
            className={`faq-item ${activeIndex === index ? "active" : ""}`}
            onClick={() => toggleFAQ(index)}
          >
            <div className="faq-question">
              {item.question}
              <span className="faq-toggle">{activeIndex === index ? "-" : "+"}</span>
            </div>
            <div className="faq-answer">{item.answer}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
