import React, { useState, useEffect } from 'react';
import '../styles/Dashboard.css';
import robotSalud from '../assets/robot-salud.png';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useTransaccion } from '../components/Context/TransaccionContext';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const Dashboard = () => {
  const { actualizar } = useTransaccion();
  const [periodo, setPeriodo] = useState('3meses');
  const [loading, setLoading] = useState(true);
  const [datosFinancieros, setDatosFinancieros] = useState({
    ingresos: 0,
    gastos: 0,
    balance: 0,
    desgloseIngresos: [],
    desgloseGastos: [],
    comparativoMensual: [],
    distribucionGastos: []
  });

  // Función para generar PDF
const generarReportePDF = async (enviarCorreo = false) => {
  const dashboard = document.querySelector('.dashboard-container');
  if (!dashboard) return;

  const boton = document.getElementById('btn-pdf');
  const botonEmail = document.getElementById('btn-pdf-email');
  
  boton.disabled = true;
  if (botonEmail) botonEmail.disabled = true;
  boton.innerText = 'Generando PDF...';

  try {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const canvas = await html2canvas(dashboard, {
      scale: 2.5,
      useCORS: true,
      backgroundColor: '#0f1a2b',
      windowWidth: dashboard.scrollWidth,
      windowHeight: dashboard.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    const espacioBlanco = pageHeight - imgHeight;
    const footerHeight = espacioBlanco > 0 ? espacioBlanco : 22;

    pdf.setFillColor(10, 20, 40);
    pdf.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, 'F');

    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(0.2);
    pdf.line(0, pageHeight - footerHeight, pageWidth, pageHeight - footerHeight);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(255, 255, 255);

    const fecha = new Date().toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const footerText = `FintraX - Reporte generado automáticamente\n${fecha}`;
    const lines = footerText.split('\n');

    const lineHeight = 6;
    const startY = pageHeight - footerHeight / 2 - (lines.length - 1) * (lineHeight / 2);

    lines.forEach((line, i) => {
      const textWidth = pdf.getTextWidth(line);
      pdf.text(line, (pageWidth - textWidth) / 2, startY + i * lineHeight);
    });

    const nombreArchivo = `reporte_fintrax_${new Date().toLocaleDateString('es-CO')}.pdf`;
    
    if (enviarCorreo) {
      boton.innerText = 'Enviando por correo...';
      
      // Obtener PDF como base64
      const pdfBase64 = pdf.output('datauristring').split(',')[1];
      
      // Obtener el token del localStorage (o donde lo guardes)
      const token = localStorage.getItem('token'); // Cambiar si lo guardas en otro lugar
      
      if (!token) {
        alert('❌ Sesión expirada. Por favor inicia sesión nuevamente.');
        return;
      }

      // Enviar al backend
      const response = await fetch('/api/reportes/enviar-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Enviar el token
        },
        body: JSON.stringify({
          pdfBase64,
          nombreArchivo,
        }),
      });

      const datos = await response.json();
      if (response.ok) {
        alert('✅ PDF enviado exitosamente a tu correo');
      } else {
        alert('❌ Error: ' + (datos.error || 'No se pudo enviar el correo'));
      }
    } else {
      // Descargar PDF
      pdf.save(nombreArchivo);
    }
  } catch (error) {
    console.error('Error al generar el PDF:', error);
    alert('❌ Ocurrió un error al generar el PDF.');
  } finally {
    boton.disabled = false;
    if (botonEmail) botonEmail.disabled = false;
    boton.innerText = 'Descargar reporte';
    if (botonEmail) botonEmail.innerText = 'Enviar por correo';
  }
};

  const coloresGastos = ['#FF6B9D', '#4ECDC4', '#95E1D3', '#FFD93D', '#1A535C', '#639BFF'];

  // ✅ EFECTO PRINCIPAL para cargar datos
  useEffect(() => {
    cargarDatosFinancieros();
  }, [periodo, actualizar]);

  // ✅ NUEVO: Escuchar cambios en localStorage incluso si el contexto no se actualiza
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUpdate = localStorage.getItem('dashboard_actualizar');
      if (storedUpdate) {
        cargarDatosFinancieros();
      }
    };

    const handleCustomEvent = () => {
      cargarDatosFinancieros();
    };

    const generarReportePDF = async (enviarCorreo = false) => {
  const dashboard = document.querySelector('.dashboard-container');
  if (!dashboard) return;

  const boton = document.getElementById('btn-pdf');
  const botonEmail = document.getElementById('btn-pdf-email');
  
  boton.disabled = true;
  if (botonEmail) botonEmail.disabled = true;
  boton.innerText = 'Generando PDF...';

  try {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const canvas = await html2canvas(dashboard, {
      scale: 2.5,
      useCORS: true,
      backgroundColor: '#0f1a2b',
      windowWidth: dashboard.scrollWidth,
      windowHeight: dashboard.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    const espacioBlanco = pageHeight - imgHeight;
    const footerHeight = espacioBlanco > 0 ? espacioBlanco : 22;

    pdf.setFillColor(10, 20, 40);
    pdf.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, 'F');

    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(0.2);
    pdf.line(0, pageHeight - footerHeight, pageWidth, pageHeight - footerHeight);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(255, 255, 255);

    const fecha = new Date().toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const footerText = `FintraX - Reporte generado automáticamente\n${fecha}`;
    const lines = footerText.split('\n');

    const lineHeight = 6;
    const startY = pageHeight - footerHeight / 2 - (lines.length - 1) * (lineHeight / 2);

    lines.forEach((line, i) => {
      const textWidth = pdf.getTextWidth(line);
      pdf.text(line, (pageWidth - textWidth) / 2, startY + i * lineHeight);
    });

    const nombreArchivo = `reporte_fintrax_${new Date().toLocaleDateString('es-CO')}.pdf`;
    
    if (enviarCorreo) {
      boton.innerText = 'Enviando por correo...';
      
      // Obtener PDF como base64
      const pdfBase64 = pdf.output('datauristring').split(',')[1];
      
      // Solicitar email al usuario
      const email = prompt('Ingresa tu correo electrónico:');
      if (!email) {
        alert('Debes ingresar un correo para enviar el reporte.');
        return;
      }

      // Enviar al backend
      const response = await fetch('/api/reportes/enviar-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          pdfBase64,
          nombreArchivo,
        }),
      });

      const datos = await response.json();
      if (response.ok) {
        alert('✅ PDF enviado exitosamente a ' + email);
      } else {
        alert('❌ Error: ' + (datos.error || 'No se pudo enviar el correo'));
      }
    } else {
      // Descargar PDF
      pdf.save(nombreArchivo);
      alert('✅ PDF descargado correctamente');
    }
  } catch (error) {
    console.error('Error al generar el PDF:', error);
    alert('❌ Ocurrió un error al generar el PDF.');
  } finally {
    boton.disabled = false;
    if (botonEmail) botonEmail.disabled = false;
    boton.innerText = 'Descargar reporte';
    if (botonEmail) botonEmail.innerText = 'Enviar por correo';
  }
};

    // Escuchar eventos de storage (desde otras pestañas/componentes)
    window.addEventListener('storage', handleStorageChange);

    // Escuchar eventos personalizados (desde la misma pestaña)
    window.addEventListener('dashboardUpdate', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dashboardUpdate', handleCustomEvent);
    };
  }, []);

  const cargarDatosFinancieros = async () => {
    setLoading(true);
    try {
      const usuario = JSON.parse(localStorage.getItem('usuario'));
      const usuarioDocumento = usuario?.usuario_documento || usuario?.documento;

      if (!usuarioDocumento) {
        console.error('⚠️ No se encontró documento de usuario en localStorage');
        setLoading(false);
        return;
      }

      const url = `http://localhost:3000/api/transacciones/dashboard/${encodeURIComponent(
        usuarioDocumento
      )}?periodo=${encodeURIComponent(periodo)}`;

      const response = await fetch(url);
      const json = await response.json();

      if (!json.success) {
        setLoading(false);
        return;
      }

      const resumen = json.data;

      const desgloseIngresos = (resumen.desgloseIngresos || []).map((d) => ({
        nombre: d.categoria,
        monto: Number(d.monto),
        porcentaje: 0
      }));

      const desgloseGastos = (resumen.desgloseGastos || []).map((d) => ({
        nombre: d.categoria,
        monto: Number(d.monto),
        porcentaje: 0
      }));

      const ingresos = Number(resumen.ingresos) || 0;
      const gastos = Number(resumen.gastos) || 0;
      const balance = Number(resumen.balance) || ingresos - gastos;

      const withPorcentajesIngresos = desgloseIngresos.map((d) => ({
        ...d,
        porcentaje: ingresos > 0 ? parseFloat(((d.monto / ingresos) * 100).toFixed(1)) : 0
      }));

      const withPorcentajesGastos = desgloseGastos.map((d) => ({
        ...d,
        porcentaje: gastos > 0 ? parseFloat(((d.monto / gastos) * 100).toFixed(1)) : 0
      }));

      const comparativoMensual = (resumen.graficaBarras || []).map((r) => ({
        mes: String(r.mes).trim(),
        ingresos: Number(r.ingresos) || 0,
        gastos: Number(r.gastos) || 0
      }));

      const distribucionGastos = (resumen.graficaTorta || []).map((d, i) => ({
        categoria: d.categoria,
        valor: Number(d.monto),
        color: coloresGastos[i % coloresGastos.length],
        porcentaje: gastos > 0 ? parseFloat(((Number(d.monto) / gastos) * 100).toFixed(1)) : 0
      }));

      setDatosFinancieros({
        ingresos,
        gastos,
        balance,
        desgloseIngresos: withPorcentajesIngresos,
        desgloseGastos: withPorcentajesGastos,
        comparativoMensual,
        distribucionGastos
      });
    } catch (error) {
      console.error('❌ Error cargando datos financieros:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularScoreSalud = () => {
    const { ingresos, gastos } = datosFinancieros;
    if (ingresos === 0) {
      if (gastos === 0) return 80;
      return 30;
    }
    const balance = datosFinancieros.balance;
    const ratio = balance / ingresos;
    let score = Math.round(ratio * 100 + 50);
    score = Math.max(0, Math.min(100, score));
    return score;
  };

  const score = calcularScoreSalud();

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <p style={{ color: 'white' }}>Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        {(() => {
          const usuario = JSON.parse(localStorage.getItem('usuario'));
          const nombreCompleto = usuario ? `${usuario.nombre?.trim() || ''} ${usuario.apellido?.trim() || ''}`.trim() : 'Usuario';
          return (
            <>
              <h1>Hola, {nombreCompleto || 'Usuario'}</h1>
              <p>Este es el resumen general de tus finanzas</p>
            </>
          );
        })()}

        <div className="periodo-selector">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="periodo-dropdown"
          >
            <option value="1mes">Último mes</option>
            <option value="3meses">Últimos 3 meses</option>
            <option value="6meses">Últimos 6 meses</option>
            <option value="1año">Último año</option>
          </select>
        </div>
      </header>

      <div className="resumen-cards">
        <div className="resumen-card card-positivo">
          <div className="card-header">
            <span className="card-titulo">Ingresos</span>
          </div>
          <div className="card-monto">{formatearMoneda(datosFinancieros.ingresos)}</div>
        </div>

        <div className="resumen-card card-negativo">
          <div className="card-header">
            <span className="card-titulo">Gastos</span>
          </div>
          <div className="card-monto">{formatearMoneda(datosFinancieros.gastos)}</div>
        </div>

        <div className="resumen-card card-neutral">
          <div className="card-header">
            <span className="card-titulo">Balance</span>
          </div>
          <div className="card-monto">{formatearMoneda(datosFinancieros.balance)}</div>
        </div>
      </div>

      <div className="desgloses-container">
        <div className="desglose-section">
          <h3>Desglose de ingresos</h3>
          <div className="desglose-lista">
            {datosFinancieros.desgloseIngresos.length === 0 && (
              <p style={{ color: '#8b92a7' }}>No hay ingresos registrados</p>
            )}
            {datosFinancieros.desgloseIngresos.map((item, index) => (
              <div key={index} className="desglose-item">
                <div className="desglose-info">
                  <span className="desglose-nombre">{item.nombre}</span>
                  <span className="desglose-monto">{formatearMoneda(item.monto)}</span>
                </div>
                <div className="desglose-barra-container">
                  <div
                    className="desglose-barra"
                    style={{
                      width: `${item.porcentaje}%`,
                      background: '#4ECDC4'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="desglose-section">
          <h3>Desglose de gastos</h3>
          <div className="desglose-lista">
            {datosFinancieros.desgloseGastos.length === 0 && (
              <p style={{ color: '#8b92a7' }}>No hay gastos registrados</p>
            )}
            {datosFinancieros.desgloseGastos.map((item, index) => (
              <div key={index} className="desglose-item">
                <div className="desglose-info">
                  <span className="desglose-nombre">{item.nombre}</span>
                  <span className="desglose-monto">{formatearMoneda(item.monto)}</span>
                </div>
                <div className="desglose-barra-container">
                  <div
                    className="desglose-barra"
                    style={{
                      width: `${item.porcentaje}%`,
                      background: '#FF6B9D'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="graficos-container">
        <div className="grafico-comparativo">
          <h3>Ingresos vs Gastos</h3>

          <div className="grafico-barras">
            {datosFinancieros.comparativoMensual.length === 0 ? (
              <p style={{ color: '#8b92a7' }}>No hay datos mensuales para mostrar</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={datosFinancieros.comparativoMensual}
                  barCategoryGap="30%"
                  barGap={6}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(v) => formatearMoneda(v)} />
                  <Legend />
                  <Bar dataKey="ingresos" fill="#4ECDC4" name="Ingresos" barSize={45} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="gastos" fill="#FF6B9D" name="Gastos" barSize={45} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grafico-distribucion">
          <h3>Distribución de gastos</h3>

          <div className="dona-container">
            <div className="dona-centro">
              <div className="dona-total-label">Total</div>
              <div className="dona-total-valor">{formatearMoneda(datosFinancieros.gastos)}</div>
            </div>
            <div className="dona-anillos">
              {datosFinancieros.distribucionGastos.map((item, index) => (
                <div
                  key={index}
                  className="dona-anillo"
                  style={{
                    background: `conic-gradient(${item.color} 0deg ${item.porcentaje * 3.6}deg, transparent ${item.porcentaje * 3.6}deg 360deg)`,
                    transform: `rotate(${datosFinancieros.distribucionGastos
                      .slice(0, index)
                      .reduce((acc, curr) => acc + curr.porcentaje * 3.6, 0)}deg)`
                  }}
                />
              ))}
            </div>
          </div>

          <div className="distribucion-leyenda">
            {datosFinancieros.distribucionGastos.map((item, index) => (
              <div key={index} className="leyenda-distribucion-item">
                <div className="leyenda-info">
                  <div className="leyenda-indicador" style={{ background: item.color }}></div>
                  <span className="leyenda-categoria">{item.categoria}</span>
                </div>
                <span className="leyenda-porcentaje">{item.porcentaje}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="salud-financiera-container">
        <div className="salud-header">
          <h3>Tu salud financiera es: {score >= 75 ? 'Óptima' : score >= 50 ? 'Buena' : score >= 30 ? 'Regular' : 'Mejorable'}</h3>
        </div>

        <div className="salud-contenido">
          <div className="salud-score-container">
            <div className="score-circulo">
              <svg viewBox="0 0 120 120" className="score-svg">
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="8"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#4ECDC4"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(score / 100) * 328} 328`}
                  transform="rotate(-90 60 60)"
                  className="score-progreso"
                />
              </svg>
              <div className="score-valor">
                <span className="score-numero">{score}</span>
                <span className="score-total">/100</span>
              </div>
            </div>

            <div className="salud-mascota">
              <img
                src={robotSalud}
                alt="Salud financiera"
                className="salud-imagen"
              />
            </div>
          </div>

          <div className="salud-mensaje">
            <p>
              {score >= 75
                ? '¡Excelente! Mantén tus buenos hábitos financieros.'
                : score >= 50
                  ? 'Vas bien, intenta ahorrar un poco más cada mes.'
                  : score >= 30
                    ? 'Cuidado — revisa tus gastos y prioriza ahorros.'
                    : 'Es momento de ajustar ingresos/gastos. Empieza por un presupuesto.'}
            </p>
          </div>
        </div>

        <div className="salud-barra-container">
          <div className="salud-barra-fondo">
            <div
              className="salud-barra-progreso"
              style={{
                width: `${score}%`,
                background: 'linear-gradient(90deg, #FF6B6B 0%, #FFD93D 50%, #4ECDC4 100%)'
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
      <button
        id="btn-pdf"
        onClick={() => generarReportePDF(false)}
        style={{
          backgroundColor: '#4ECDC4',
          color: '#0f1a2b',
          border: 'none',
          borderRadius: '10px',
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'background 0.3s ease'
        }}
        onMouseOver={(e) => (e.target.style.backgroundColor = '#3db6aa')}
        onMouseOut={(e) => (e.target.style.backgroundColor = '#4ECDC4')}
      >
        📥 Descargar reporte
      </button>

      <button
        id="btn-pdf-email"
        onClick={() => generarReportePDF(true)}
        style={{
          backgroundColor: '#2563eb',
          color: '#ffffff',
          border: 'none',
          borderRadius: '10px',
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'background 0.3s ease'
        }}
        onMouseOver={(e) => (e.target.style.backgroundColor = '#1e40af')}
        onMouseOut={(e) => (e.target.style.backgroundColor = '#2563eb')}
      >
        📧 Enviar por correo
      </button>
      </div>
    </div>
  );
};

export default Dashboard;
