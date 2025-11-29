import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, EffectCoverflow } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-coverflow";
import "../styles/HowItWorks.css";

export default function HowItWorks() {
  const steps = [
    {
      title: "Registro y Login",
      description: "Crea tu cuenta y accede a Fintrax en segundos, de forma segura.",
      videoUrl: "https://www.youtube.com/embed/TU_VIDEO1"
    },
    {
      title: "Gestión de Finanzas",
      description: "Agrega ingresos y gastos, clasifícalos y controla tus finanzas.",
      videoUrl: "https://www.youtube.com/embed/TU_VIDEO2"
    },
    {
      title: "Metas y Dashboard",
      description: "Crea metas, observa tu progreso y toma decisiones inteligentes.",
      videoUrl: "https://www.youtube.com/embed/TU_VIDEO3"
    },
    {
      title: "ChatBot IA y Gamificación",
      description: "Interactúa con nuestro asistente y diviértete con retos y logros.",
      videoUrl: "https://www.youtube.com/embed/TU_VIDEO4"
    }
  ];

  return (
    <section id="how-it-works" className="how-it-works">
      <div className="how-header">
        <h2>¿Cómo funciona?</h2>
        <p>
          Aprende a usar Fintrax de manera rápida con estos videos explicativos.
        </p>
      </div>

      <Swiper
        effect={"coverflow"}
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={3}   
        spaceBetween={40}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000 }}
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 200,
          modifier: 1,
          scale: 0.85,   
          slideShadows: false
        }}
        modules={[Navigation, Pagination, Autoplay, EffectCoverflow]}
        className="how-carousel"
      >
        {steps.map((step, index) => (
          <SwiperSlide key={index}>
            <div className="video-item">
              <iframe
                src={step.videoUrl}
                title={step.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
