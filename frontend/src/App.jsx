import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link, Outlet, useLocation } from 'react-router-dom'
import api from './api'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Users, UserCheck, UserMinus, Activity, LogOut, Lock, PlusCircle, Trash2, X, List, Shield, Download } from 'lucide-react'

// ==========================================
// 1. PANTALLA DE INICIO DE SESIÓN
// ==========================================
function Login() {
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const navigate = useNavigate()

  const manejarLogin = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      const params = new URLSearchParams()
      params.append('username', email)
      params.append('password', password)
      const respuesta = await api.post('/login', params)
      localStorage.setItem('token', respuesta.data.access_token)
      navigate('/dashboard')
    } catch (err) {
      setError('Credenciales incorrectas. Intenta de nuevo.')
    }
    setCargando(false)
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f1f5f9' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ backgroundColor: '#eff6ff', display: 'inline-block', padding: '15px', borderRadius: '50%', color: '#3b82f6', marginBottom: '10px' }}>
            <Lock size={32} />
          </div>
          <h2 style={{ margin: 0, color: '#1e293b' }}>Motor Predictivo</h2>
          <p style={{ color: '#64748b', margin: '5px 0 0 0', fontSize: '0.9rem' }}>Acceso Administrativo PluriOne</p>
        </div>
        {error && <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '10px', borderRadius: '5px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
        <form onSubmit={manejarLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>Correo Electrónico</label>
            <input type="email" required style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>Contraseña</label>
            <input type="password" required style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={cargando} style={{ padding: '12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', marginTop: '10px' }}>
            {cargando ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ==========================================
// 2. LAYOUT PROTEGIDO (Menú Superior)
// ==========================================
function LayoutProtegido() {
  const token = localStorage.getItem('token')
  const navigate = useNavigate()
  const location = useLocation()

  if (!token) return <Navigate to="/login" replace />

  const cerrarSesion = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const linkStyle = (path) => ({
    textDecoration: 'none',
    fontWeight: 'bold',
    padding: '8px 12px',
    borderRadius: '5px',
    color: location.pathname === path ? '#2563eb' : '#64748b',
    backgroundColor: location.pathname === path ? '#eff6ff' : 'transparent',
    transition: 'all 0.2s'
  })

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{ backgroundColor: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
          <h2 style={{ margin: 0, color: '#1e293b', borderRight: '2px solid #e2e8f0', paddingRight: '20px' }}>PluriOne</h2>
          <Link to="/dashboard" style={linkStyle('/dashboard')}>📊 Dashboard Analítico</Link>
          <Link to="/directorio" style={linkStyle('/directorio')}><List size={18} style={{ display: 'inline', verticalAlign: 'text-bottom' }}/> Directorio General</Link>
          <Link to="/accesos" style={linkStyle('/accesos')}><Shield size={18} style={{ display: 'inline', verticalAlign: 'text-bottom' }}/> Control de Accesos</Link>
        </div>
        <button onClick={cerrarSesion} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 15px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '5px', color: '#475569', cursor: 'pointer', fontWeight: 'bold' }}>
          <LogOut size={18} /> Cerrar Sesión
        </button>
      </nav>
      <div style={{ padding: '30px', maxWidth: '1280px', margin: '0 auto' }}>
        <Outlet />
      </div>
    </div>
  )
}

// ==========================================
// 3. PANTALLA: DASHBOARD ANALÍTICO (CON DRILL-DOWN)
// ==========================================
function Dashboard() {
  const [empleados, setEmpleados] = useState([])
  const [cargando, setCargando] = useState(true)
  
  // Simulador
  const [formSimulador, setFormSimulador] = useState({ distancia_km: 0, salario: 0, desempeno: 0, clima_laboral: 0})
  const [resultadoSimulacion, setResultadoSimulacion] = useState(null)
  const [simulando, setSimulando] = useState(false)

  // Ventanas emergentes de los KPIs
  const [modalKPI, setModalKPI] = useState(null) // 'activos', 'bajas', 'rotacion', o null

useEffect(() => {
    // Ahora pide TODOS los registros, no importa si son 100 o 10,000
    api.get('/empleados')
      .then(respuesta => { setEmpleados(respuesta.data.datos); setCargando(false) })
      .catch(() => setCargando(false))
  }, [])

  const ejecutarSimulacion = async (e) => {
    e.preventDefault()
    setSimulando(true)
    try {
      const respuesta = await api.post('/predicciones/simulador', {
        distancia_km: parseFloat(formSimulador.distancia_km),
        salario: parseFloat(formSimulador.salario),
        desempeno: parseFloat(formSimulador.desempeno),
        clima_laboral: parseFloat(formSimulador.clima_laboral)
      })
      setResultadoSimulacion(respuesta.data)
    } catch (error) { console.error(error) }
    setSimulando(false)
  }

const descargarReporte = () => {
    if (!resultadoSimulacion) return;
    
    const { alerta, probabilidad_renuncia, parametros_analizados, razonamiento } = resultadoSimulacion;
    const fecha = new Date().toLocaleString('es-MX');
    
    // Armamos el texto del archivo
    const contenido = `================================================
REPORTE PREDICTIVO DE ROTACIÓN - PLURIONE
Fecha de Emisión: ${fecha}
================================================

[ RESULTADO DEL ANÁLISIS ]
Estado: ${alerta.replace('🔴', '[ALTO RIESGO]').replace('🟢', '[ESTABLE]')}
Probabilidad de Renuncia: ${probabilidad_renuncia}

[ PERFIL EVALUADO ]
Salario Mensual: $${parametros_analizados.salario.toLocaleString('es-MX')} MXN
Distancia a la Oficina: ${parametros_analizados.distancia_km} km
Evaluación de Desempeño: ${parametros_analizados.desempeno} / 5.0

[ DIAGNÓSTICO DE INTELIGENCIA ARTIFICIAL ]
${razonamiento}

================================================
Generado por el Motor Predictivo V2.1
Plataforma Administrativa PluriOne
`;

    // Creamos el archivo virtual y forzamos la descarga en el navegador
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(blob);
    enlace.download = `Reporte_IA_PluriOne_${Date.now()}.txt`;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
  };

  // Cálculos principales
  const totalEmpleados = empleados.length;
  const listaActivos = empleados.filter(e => e.estado_activo);
  const listaBajas = empleados.filter(e => !e.estado_activo);
  const activos = listaActivos.length;
  const bajas = listaBajas.length;
  const tasaRotacion = totalEmpleados > 0 ? ((bajas / totalEmpleados) * 100).toFixed(1) : 0;

  // Gráfica de Barras (Distancia)
  const datosGraficaBarras = [
    { rango: 'Cerca (0-15 km)', Retenidos: empleados.filter(e => e.distancia_oficina_km <= 15 && e.estado_activo).length, Renuncias: empleados.filter(e => e.distancia_oficina_km <= 15 && !e.estado_activo).length },
    { rango: 'Medio (16-30 km)', Retenidos: empleados.filter(e => e.distancia_oficina_km > 15 && e.distancia_oficina_km <= 30 && e.estado_activo).length, Renuncias: empleados.filter(e => e.distancia_oficina_km > 15 && e.distancia_oficina_km <= 30 && !e.estado_activo).length },
    { rango: 'Lejos (> 30 km)', Retenidos: empleados.filter(e => e.distancia_oficina_km > 30 && e.estado_activo).length, Renuncias: empleados.filter(e => e.distancia_oficina_km > 30 && !e.estado_activo).length }
  ];

  // Gráfica de Líneas (Tendencia de Cohortes)
  const procesarTendencia = () => {
    const mapaMeses = {};
    empleados.forEach(emp => {
      if (!emp.fecha_contratacion) return;
      const mes = emp.fecha_contratacion.substring(0, 7); // Extrae YYYY-MM
      if (!mapaMeses[mes]) mapaMeses[mes] = { mes, Contrataciones: 0, Bajas: 0 };
      
      mapaMeses[mes].Contrataciones += 1;
      if (!emp.estado_activo) mapaMeses[mes].Bajas += 1;
    });
    // Ordenar cronológicamente
    return Object.values(mapaMeses).sort((a, b) => a.mes.localeCompare(b.mes));
  };
  const datosTendencia = procesarTendencia();

  // Componente interno para mostrar la tabla en el modal
  const TablaModal = ({ datos, titulo }) => (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50 }}>
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '80%', maxWidth: '800px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#1e293b' }}>{titulo} ({datos.length})</h2>
          <button onClick={() => setModalKPI(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24}/></button>
        </div>
        <div style={{ overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc' }}>
              <tr style={{ textAlign: 'left', fontSize: '0.9rem', color: '#475569' }}>
                <th style={{ padding: '12px', borderBottom: '2px solid #cbd5e1' }}>UUID</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #cbd5e1' }}>Fecha Ingreso</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #cbd5e1' }}>Distancia</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #cbd5e1' }}>Desempeño</th>
              </tr>
            </thead>
            <tbody>
              {datos.map(emp => (
                <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>
                  <td style={{ padding: '12px', fontFamily: 'monospace', color: '#64748b' }}>{emp.id.substring(0, 12)}...</td>
                  <td style={{ padding: '12px' }}>{emp.fecha_contratacion}</td>
                  <td style={{ padding: '12px' }}>{emp.distancia_oficina_km} km</td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: emp.desempeno >= 3.5 ? '#166534' : '#991b1b' }}>⭐ {Number(emp.desempeno).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ position: 'relative' }}>
      
      {/* MODALES DE KPIS */}
      {modalKPI === 'activos' && <TablaModal datos={listaActivos} titulo="Visor: Empleados Activos" />}
      {modalKPI === 'bajas' && <TablaModal datos={listaBajas} titulo="Visor: Bajas Históricas" />}
      
      {modalKPI === 'rotacion' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '90%', maxWidth: '900px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#1e293b' }}>Tendencia de Contrataciones vs Bajas (Por Cohorte)</h2>
              <button onClick={() => setModalKPI(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24}/></button>
            </div>
            <div style={{ height: '400px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={datosTendencia} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Contrataciones" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} name="Altas (Mes de Ingreso)" />
                  <Line type="monotone" dataKey="Bajas" stroke="#ef4444" strokeWidth={3} name="Bajas (De ese grupo)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.9rem', marginTop: '15px' }}>
              *Esta gráfica muestra el volumen de contrataciones por mes y cuántos de esos empleados terminaron causando baja.
            </p>
          </div>
        </div>
      )}

      {/* TARJETAS KPI (Ahora son clickeables) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ backgroundColor: '#eff6ff', padding: '15px', borderRadius: '50%', color: '#3b82f6' }}><Users size={28} /></div>
          <div><p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: 'bold' }}>Muestra Analizada</p><h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.8rem' }}>{totalEmpleados}</h2></div>
        </div>
        
        <div onClick={() => setModalKPI('activos')} title="Haz clic para ver la lista" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', border: '1px solid transparent', transition: 'border 0.2s' }} onMouseOver={e => e.currentTarget.style.border = '1px solid #86efac'} onMouseOut={e => e.currentTarget.style.border = '1px solid transparent'}>
          <div style={{ backgroundColor: '#f0fdf4', padding: '15px', borderRadius: '50%', color: '#22c55e' }}><UserCheck size={28} /></div>
          <div><p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: 'bold' }}>Empleados Activos</p><h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.8rem' }}>{activos}</h2></div>
        </div>
        
        <div onClick={() => setModalKPI('bajas')} title="Haz clic para ver la lista" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', border: '1px solid transparent', transition: 'border 0.2s' }} onMouseOver={e => e.currentTarget.style.border = '1px solid #fca5a5'} onMouseOut={e => e.currentTarget.style.border = '1px solid transparent'}>
          <div style={{ backgroundColor: '#fef2f2', padding: '15px', borderRadius: '50%', color: '#ef4444' }}><UserMinus size={28} /></div>
          <div><p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: 'bold' }}>Bajas Históricas</p><h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.8rem' }}>{bajas}</h2></div>
        </div>
        
        <div onClick={() => setModalKPI('rotacion')} title="Haz clic para ver gráfica de tendencia" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', border: '1px solid transparent', transition: 'border 0.2s' }} onMouseOver={e => e.currentTarget.style.border = '1px solid #c4b5fd'} onMouseOut={e => e.currentTarget.style.border = '1px solid transparent'}>
          <div style={{ backgroundColor: '#f5f3ff', padding: '15px', borderRadius: '50%', color: '#8b5cf6' }}><Activity size={28} /></div>
          <div><p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: 'bold' }}>Tasa de Rotación</p><h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.8rem' }}>{tasaRotacion}%</h2></div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '350px', backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '1.2rem', color: '#334155', marginTop: 0 }}>Simulador de Riesgo (IA)</h2>
          <form onSubmit={ejecutarSimulacion} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '5px' }}>Distancia a la oficina (km)</label>
              <input type="number" step="0.1" required style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #cbd5e1' }} value={formSimulador.distancia_km} onChange={e => setFormSimulador({...formSimulador, distancia_km: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '5px' }}>Salario Mensual (MXN)</label>
              <input type="number" required style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #cbd5e1' }} value={formSimulador.salario} onChange={e => setFormSimulador({...formSimulador, salario: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '5px' }}>Evaluación (1.0 - 5.0)</label>
              <input type="number" step="0.1" min="1" max="5" required style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #cbd5e1' }} value={formSimulador.desempeno} onChange={e => setFormSimulador({...formSimulador, desempeno: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '5px' }}>Clima Laboral (1.0 - 5.0)</label>
              <input type="number" step="0.1" min="1" max="5" required style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #cbd5e1' }} value={formSimulador.clima_laboral} onChange={e => setFormSimulador({ ...formSimulador, clima_laboral: e.target.value })} />
            </div>
            <button type="submit" disabled={simulando} style={{ padding: '10px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
              {simulando ? 'Analizando...' : 'Ejecutar Predicción'}
            </button>
          </form>
          {resultadoSimulacion && (
            <div style={{ marginTop: '25px', padding: '15px', borderRadius: '8px', backgroundColor: resultadoSimulacion.alerta.includes('ALTO') ? '#fef2f2' : '#f0fdf4', border: `1px solid ${resultadoSimulacion.alerta.includes('ALTO') ? '#fca5a5' : '#86efac'}` }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: resultadoSimulacion.alerta.includes('ALTO') ? '#991b1b' : '#166534' }}>{resultadoSimulacion.alerta}</h3>
              <p style={{ margin: '0 0 15px 0', fontWeight: 'bold', fontSize: '1.2rem', color: '#0f172a' }}>Probabilidad: {resultadoSimulacion.probabilidad_renuncia}</p>
              
              <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px', fontSize: '0.9rem', color: '#334155', border: '1px solid #e2e8f0' }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#1e293b' }}>Resumen del Perfil Evaluado:</p>
                <ul style={{ margin: '0 0 12px 0', paddingLeft: '20px' }}>
                  <li><strong>Salario:</strong> ${resultadoSimulacion.parametros_analizados.salario.toLocaleString('es-MX')} MXN</li>
                  <li><strong>Distancia:</strong> {resultadoSimulacion.parametros_analizados.distancia_km} km</li>
                  <li><strong>Desempeño:</strong> {resultadoSimulacion.parametros_analizados.desempeno} / 5.0</li>
                </ul>
                <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '5px', borderLeft: '3px solid #3b82f6' }}>
                  <p style={{ margin: 0, fontStyle: 'italic', color: '#475569', lineHeight: '1.4' }}>
                    <strong style={{ color: '#2563eb', fontStyle: 'normal' }}>💡 Diagnóstico IA: </strong> 
                    {resultadoSimulacion.razonamiento}
                  </p>
                </div>
              </div>

              {/* NUEVO BOTÓN DE DESCARGA */}
              <button onClick={descargarReporte} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', marginTop: '15px', backgroundColor: '#475569', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#334155'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#475569'}>
                <Download size={18} /> Descargar Reporte (TXT)
              </button>

            </div>
          )}
        </div>

        <div style={{ flex: '1', minWidth: '400px', backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '1.2rem', color: '#334155', marginTop: 0 }}>Impacto de la Distancia en la Rotación</h2>
          <div style={{ height: '320px', width: '100%', marginTop: '20px' }}>
            {cargando ? <p>Procesando gráfica...</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosGraficaBarras} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="rango" />
                  <YAxis />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} />
                  <Legend />
                  <Bar dataKey="Retenidos" fill="#22c55e" radius={[4, 4, 0, 0]} name="Retenidos" />
                  <Bar dataKey="Renuncias" fill="#ef4444" radius={[4, 4, 0, 0]} name="Renuncias" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// 4. PANTALLA: DIRECTORIO COMPLETO Y CRUD
// ==========================================
function Directorio() {
  const [empleados, setEmpleados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [procesandoCrud, setProcesandoCrud] = useState(false)
  const [formNuevo, setFormNuevo] = useState({
    departamento_id: 1,
    puesto_id: 1,
    distancia_oficina_km: 10,
    salario: 25000,
    desempeno: 3.5,
    clima_laboral: 1
  })

  const cargarDatos = () => {
    api.get('/empleados?limite=1000')
      .then(respuesta => { setEmpleados(respuesta.data.datos); setCargando(false) })
      .catch(() => setCargando(false))
  }

  useEffect(() => {
    // Ahora pide TODOS los registros, no importa si son 100 o 10,000
    api.get('/empleados')
      .then(respuesta => { setEmpleados(respuesta.data.datos); setCargando(false) })
      .catch(() => setCargando(false))
  }, [])

  const manejarContratacion = async (e) => {
    e.preventDefault()
    setProcesandoCrud(true)
    try {
      await api.post('/empleados', formNuevo)
      setModalAbierto(false)
      cargarDatos()
    } catch (error) { alert("Error al registrar contratación.") }
    setProcesandoCrud(false)
  }

  const manejarBaja = async (id) => {
    if(!window.confirm(`¿Estás seguro de procesar la baja del empleado ${id.substring(0,8)}...?`)) return;
    try {
      await api.delete(`/empleados/${id}`)
      cargarDatos()
    } catch (error) { alert("Error al procesar la baja.") }
  }

  return (
    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
      
      {/* MODAL DE CONTRATACIÓN CON SALARIO Y DESEMPEÑO */}
      {modalAbierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '420px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#1e293b' }}>Contratar Nuevo Empleado</h3>
              <button onClick={() => setModalAbierto(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20}/></button>
            </div>
            <form onSubmit={manejarContratacion} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '5px' }}>Departamento</label>
                <select style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }} value={formNuevo.departamento_id} onChange={e => setFormNuevo({...formNuevo, departamento_id: parseInt(e.target.value)})}>
                  <option value={1}>Ventas</option>
                  <option value={2}>Tecnología</option>
                  <option value={3}>Operaciones</option>
                  <option value={4}>Recursos Humanos</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '5px' }}>Puesto</label>
                <select style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }} value={formNuevo.puesto_id} onChange={e => setFormNuevo({...formNuevo, puesto_id: parseInt(e.target.value)})}>
                  <option value={1}>Analista Jr.</option>
                  <option value={2}>Desarrollador Mid</option>
                  <option value={3}>Gerente</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '5px' }}>Distancia a la Oficina (km)</label>
                <input type="number" required min="1" style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} value={formNuevo.distancia_oficina_km} onChange={e => setFormNuevo({...formNuevo, distancia_oficina_km: parseInt(e.target.value)})} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '5px' }}>Salario Mensual (MXN)</label>
                <input type="number" required min="1000" step="500" style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} value={formNuevo.salario} onChange={e => setFormNuevo({...formNuevo, salario: parseFloat(e.target.value)})} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '5px' }}>Evaluación Inicial (1.0 - 5.0)</label>
                <input type="number" required min="1" max="5" step="0.1" style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} value={formNuevo.desempeno} onChange={e => setFormNuevo({...formNuevo, desempeno: parseFloat(e.target.value)})} />
              </div>
              <button type="submit" disabled={procesandoCrud} style={{ padding: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
                {procesandoCrud ? 'Procesando...' : 'Registrar Contratación'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: '#334155', margin: 0 }}>Directorio General de Empleados</h2>
          <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>Mostrando plantilla con métricas predictivas (Distancia, Salario, Desempeño)</p>
        </div>
        <button onClick={() => setModalAbierto(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '10px 15px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
          <PlusCircle size={18} /> Nueva Contratación
        </button>
      </div>
      
      {cargando ? <p>Cargando registros con métricas...</p> : (
        <div style={{ maxHeight: '600px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left', fontSize: '0.95rem' }}>
                <th style={{ padding: '15px', borderBottom: '2px solid #cbd5e1', color: '#475569' }}>UUID Completo</th>
                <th style={{ padding: '15px', borderBottom: '2px solid #cbd5e1', color: '#475569' }}>Fecha Ingreso</th>
                <th style={{ padding: '15px', borderBottom: '2px solid #cbd5e1', color: '#475569' }}>Distancia</th>
                <th style={{ padding: '15px', borderBottom: '2px solid #cbd5e1', color: '#475569' }}>Salario Mensual</th>
                <th style={{ padding: '15px', borderBottom: '2px solid #cbd5e1', color: '#475569' }}>Desempeño</th>
                <th style={{ padding: '15px', borderBottom: '2px solid #cbd5e1', color: '#475569' }}>Estado</th>
                <th style={{ padding: '15px', borderBottom: '2px solid #cbd5e1', color: '#475569', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {empleados.map((emp) => (
                <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem', backgroundColor: emp.estado_activo ? 'white' : '#f8fafc' }}>
                  <td style={{ padding: '15px', color: '#64748b', fontFamily: 'monospace' }}>{emp.id}</td>
                  <td style={{ padding: '15px', color: '#334155' }}>{emp.fecha_contratacion}</td>
                  <td style={{ padding: '15px', color: '#334155' }}>{emp.distancia_oficina_km} km</td>
                  <td style={{ padding: '15px', color: '#0f172a', fontWeight: 'bold' }}>
                    ${emp.salario?.toLocaleString('es-MX')} MXN
                  </td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '6px', 
                      fontWeight: 'bold', 
                      fontSize: '0.85rem',
                      backgroundColor: emp.desempeno >= 3.5 ? '#f0fdf4' : (emp.desempeno >= 2.5 ? '#fefce8' : '#fef2f2'),
                      color: emp.desempeno >= 3.5 ? '#166534' : (emp.desempeno >= 2.5 ? '#854d0e' : '#991b1b')
                    }}>
                      ⭐ {Number(emp.desempeno).toFixed(1)} / 5.0
                    </span>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ padding: '5px 10px', borderRadius: '15px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: emp.estado_activo ? '#dcfce7' : '#fee2e2', color: emp.estado_activo ? '#166534' : '#991b1b' }}>
                      {emp.estado_activo ? 'Activo' : 'Baja (Histórico)'}
                    </span>
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    {emp.estado_activo ? (
                      <button onClick={() => manejarBaja(emp.id)} style={{ background: 'none', border: '1px solid #fca5a5', padding: '5px 10px', borderRadius: '5px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', margin: '0 auto' }} title="Procesar Baja">
                        <Trash2 size={16} /> Dar de baja
                      </button>
                    ) : <span style={{ color: '#cbd5e1' }}>Sin acciones</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ==========================================
// PANTALLA: CONTROL DE ACCESOS
// ==========================================
function Accesos() {
  const [admins, setAdmins] = useState([])
  const [cargando, setCargando] = useState(true)
  const [formNuevo, setFormNuevo] = useState({ email: '', password: '', nombre_completo: '' })
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' })

  const cargarAdmins = () => {
    api.get('/admins')
      .then(respuesta => { setAdmins(respuesta.data); setCargando(false) })
      .catch(() => setCargando(false))
  }

  useEffect(() => { cargarAdmins() }, [])

  const manejarRegistro = async (e) => {
    e.preventDefault()
    setMensaje({ texto: 'Procesando...', tipo: 'info' })
    try {
      const res = await api.post('/admins', formNuevo)
      setMensaje({ texto: res.data.mensaje, tipo: 'exito' })
      setFormNuevo({ email: '', password: '', nombre_completo: '' })
      cargarAdmins()
    } catch (error) {
      setMensaje({ texto: error.response?.data?.detail || 'Error al registrar', tipo: 'error' })
    }
  }

  return (
    <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
      
      {/* FORMULARIO DE ALTA */}
      <div style={{ flex: '1', minWidth: '300px', backgroundColor: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', alignSelf: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#eff6ff', padding: '10px', borderRadius: '50%', color: '#3b82f6' }}><Shield size={24} /></div>
          <h2 style={{ fontSize: '1.2rem', color: '#334155', margin: 0 }}>Autorizar Nuevo Administrador</h2>
        </div>
        
        {mensaje.texto && (
          <div style={{ padding: '10px', borderRadius: '5px', marginBottom: '15px', backgroundColor: mensaje.tipo === 'error' ? '#fef2f2' : '#f0fdf4', color: mensaje.tipo === 'error' ? '#991b1b' : '#166534', border: `1px solid ${mensaje.tipo === 'error' ? '#fca5a5' : '#86efac'}` }}>
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={manejarRegistro} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '5px' }}>Nombre Completo</label>
            <input type="text" required style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} value={formNuevo.nombre_completo} onChange={e => setFormNuevo({...formNuevo, nombre_completo: e.target.value})} placeholder="Ej. Ana Gómez" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '5px' }}>Correo Corporativo</label>
            <input type="email" required style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} value={formNuevo.email} onChange={e => setFormNuevo({...formNuevo, email: e.target.value})} placeholder="ana@plurione.com" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '5px' }}>Contraseña Temporal</label>
            <input type="password" required minLength="6" style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} value={formNuevo.password} onChange={e => setFormNuevo({...formNuevo, password: e.target.value})} />
          </div>
          <button type="submit" style={{ padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>Conceder Acceso</button>
        </form>
      </div>

      {/* LISTA DE ADMINISTRADORES */}
      <div style={{ flex: '2', minWidth: '400px', backgroundColor: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '1.2rem', color: '#334155', marginTop: 0, marginBottom: '20px' }}>Personal de RRHH Autorizado</h2>
        {cargando ? <p>Cargando administradores...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left', fontSize: '0.95rem' }}>
                <th style={{ padding: '15px', borderBottom: '2px solid #cbd5e1', color: '#475569' }}>Nombre</th>
                <th style={{ padding: '15px', borderBottom: '2px solid #cbd5e1', color: '#475569' }}>Correo (Usuario)</th>
                <th style={{ padding: '15px', borderBottom: '2px solid #cbd5e1', color: '#475569' }}>Fecha de Alta</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>
                  <td style={{ padding: '15px', color: '#0f172a', fontWeight: 'bold' }}>{admin.nombre_completo}</td>
                  <td style={{ padding: '15px', color: '#64748b' }}>{admin.email}</td>
                  <td style={{ padding: '15px', color: '#64748b' }}>{new Date(admin.fecha_creacion).toLocaleDateString('es-MX')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ==========================================
// 5. ENRUTADOR PRINCIPAL (App)
// ==========================================
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route element={<LayoutProtegido />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/directorio" element={<Directorio />} />
          <Route path="/accesos" element={<Accesos />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App