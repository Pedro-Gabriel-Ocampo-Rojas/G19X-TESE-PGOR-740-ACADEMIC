from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import SessionLocal, get_db
from models import Empleado, UsuarioAdmin, HistorialSalario, EvaluacionDesempeno
from security import verificar_password, crear_token_acceso, CLAVE_SECRETA, ALGORITMO
import joblib
import os
import pandas as pd
import jwt
import uuid
from datetime import date

app = FastAPI(
    title="Motor Predictivo de Rotación API",
    description="API REST para la gestión de empleados y predicción de riesgo (PluriOne)",
    version="2.1.0"
)

# --- CONFIGURACIÓN DE SEGURIDAD PARA ENDPOINTS ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        # Intenta desencriptar el token usando tu clave secreta
        payload = jwt.decode(token, CLAVE_SECRETA, algorithms=[ALGORITMO])
        usuario: str = payload.get("sub")
        if usuario is None:
            raise HTTPException(status_code=401, detail="Credenciales inválidas")
        return usuario
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
# -------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. CARGA DEL MODELO IA ---
RUTA_MODELO = os.path.join(os.path.dirname(__file__), "ml", "modelo_rotacion.pkl")
try:
    modelo_ia = joblib.load(RUTA_MODELO)
    print("Cerebro de IA cargado correctamente.")
except Exception as e:
    modelo_ia = None
    print(f"Advertencia: No se pudo cargar el modelo de IA: {RUTA_MODELO}")


# --- 2. ESQUEMAS ---
class SimulacionRiesgo(BaseModel):
    distancia_km: float
    salario: float
    desempeno: float

class NuevoEmpleado(BaseModel):
    puesto_id: int
    departamento_id: int
    distancia_oficina_km: int
    salario: float = 25000.0
    desempeno: float = 3.5

class NuevoAdmin(BaseModel):
    email: str
    password: str
    nombre_completo: str


# --- 3. ENDPOINTS ---
@app.get("/")
async def root():
    return {"mensaje": "Motor Predictivo V2.1 en línea."}

@app.post("/api/v1/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    resultado = await db.execute(select(UsuarioAdmin).filter(UsuarioAdmin.email == form_data.username))
    admin = resultado.scalars().first()
    
    if not admin or not verificar_password(form_data.password, admin.hashed_password):
        raise HTTPException(status_code=400, detail="Correo o contraseña incorrectos")
        
    token = crear_token_acceso(datos={"sub": admin.email})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/api/v1/empleados")
async def obtener_empleados(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    # Cruzamos empleados con su salario y evaluación sin NINGÚN límite
    query = (
        select(
            Empleado,
            HistorialSalario.monto_mensual,
            EvaluacionDesempeno.puntuacion_kpi
        )
        .outerjoin(HistorialSalario, Empleado.id == HistorialSalario.empleado_id)
        .outerjoin(EvaluacionDesempeno, Empleado.id == EvaluacionDesempeno.empleado_id)
        .order_by(Empleado.fecha_contratacion.desc())
        # Eliminamos la línea de .limit() para traer el 100% del histórico
    )
    resultado = await db.execute(query)
    filas = resultado.all()
    
    datos = []
    for emp, salario, desempeno in filas:
        datos.append({
            "id": str(emp.id),
            "departamento_id": emp.departamento_id,
            "puesto_id": emp.puesto_id,
            "fecha_contratacion": emp.fecha_contratacion,
            "distancia_oficina_km": emp.distancia_oficina_km,
            "estado_activo": emp.estado_activo,
            "salario": salario if salario is not None else 0.0,
            "desempeno": desempeno if desempeno is not None else 0.0
        })
    return {"total_mostrados": len(datos), "datos": datos}

@app.post("/api/v1/predicciones/simulador")
async def simular_riesgo(datos: SimulacionRiesgo, current_user = Depends(get_current_user)):
    if modelo_ia is None:
        raise HTTPException(status_code=500, detail="El modelo predictivo no está disponible.")
    df_entrada = pd.DataFrame([{"distancia_km": datos.distancia_km, "salario": datos.salario, "desempeno": datos.desempeno}])
    prediccion = modelo_ia.predict(df_entrada)[0]
    probabilidad = modelo_ia.predict_proba(df_entrada)[0][1]
    
    # --- NUEVA LÓGICA: GENERACIÓN DE RAZONAMIENTO (EXPLAINABLE AI) ---
    razonamiento = ""
    if prediccion == 1: # ALTO RIESGO
        razones = []
        if datos.distancia_km > 20:
            razones.append("la gran distancia a la oficina genera desgaste diario")
        if datos.salario < 20000:
            razones.append("el salario mensual se encuentra por debajo del umbral competitivo de retención")
        if datos.desempeno > 4.0 and datos.salario < 25000:
            razones.append("presenta un alto desempeño pero la compensación no es proporcional (alto riesgo de fuga por subvaloración)")
        elif datos.desempeno < 2.5:
            razones.append("existe una baja calificación de desempeño que indica falta de motivación o encaje")
            
        if razones:
            razonamiento = "El modelo detecta alto riesgo principalmente porque " + " y ".join(razones) + "."
        else:
            razonamiento = "El modelo detecta un patrón de riesgo generalizado basado en la combinación de su salario, distancia y evaluación."
    else: # ESTABLE
        razonamiento = "El perfil presenta métricas saludables de retención. "
        fortalezas = []
        if datos.distancia_km <= 15:
            fortalezas.append("su cercanía a la oficina reduce el estrés de traslado")
        if datos.salario >= 25000:
            fortalezas.append("cuenta con un salario competitivo dentro del mercado")
        if 3.0 <= datos.desempeno <= 4.5:
            fortalezas.append("mantiene un desempeño constante y adecuado")
            
        if fortalezas:
            razonamiento += "Destaca que " + " y ".join(fortalezas) + "."
        else:
            razonamiento += "Sus condiciones actuales no muestran indicadores críticos de fuga."

    return {
        "alerta": "🔴 ALTO RIESGO DE FUGA" if prediccion == 1 else "🟢 EMPLEADO ESTABLE",
        "probabilidad_renuncia": f"{probabilidad * 100:.2f}%",
        "parametros_analizados": datos.model_dump(),
        "razonamiento": razonamiento
    }

@app.post("/api/v1/empleados", summary="Contratar Empleado (Protegido)")
async def contratar_empleado(empleado: NuevoEmpleado, db: AsyncSession = Depends(get_db), admin: str = Depends(get_current_user)):
    nuevo = Empleado(
        puesto_id=empleado.puesto_id,
        departamento_id=empleado.departamento_id,
        distancia_oficina_km=empleado.distancia_oficina_km,
        fecha_contratacion=date.today(),
        estado_activo=True
    )
    db.add(nuevo)
    await db.flush() # Genera el UUID antes del commit
    
    # Insertamos su salario inicial y su primera evaluación
    historial = HistorialSalario(
        empleado_id=nuevo.id,
        monto_mensual=empleado.salario,
        fecha_cambio=date.today(),
        motivo="Contratación Inicial"
    )
    evaluacion = EvaluacionDesempeno(
        empleado_id=nuevo.id,
        fecha_evaluacion=date.today(),
        puntuacion_kpi=empleado.desempeno,
        cumplimiento_metas=empleado.desempeno * 20
    )
    db.add_all([historial, evaluacion])
    await db.commit()
    await db.refresh(nuevo)
    return {"mensaje": "Empleado contratado exitosamente", "id": str(nuevo.id), "admin_responsable": admin}

@app.delete("/api/v1/empleados/{empleado_id}", summary="Dar de Baja (Protegido)")
async def dar_de_baja(empleado_id: uuid.UUID, db: AsyncSession = Depends(get_db), admin: str = Depends(get_current_user)):
    resultado = await db.execute(select(Empleado).filter(Empleado.id == empleado_id))
    emp = resultado.scalars().first()
    
    if not emp:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
        
    emp.estado_activo = False
    await db.commit()
    return {"mensaje": "Empleado dado de baja exitosamente", "admin_responsable": admin}

# --- 4. ENDPOINTS DE ACCESOS (Solo Administradores) ---
@app.get("/api/v1/admins", summary="Listar Administradores (Protegido)")
async def obtener_admins(db: AsyncSession = Depends(get_db), admin_actual: str = Depends(get_current_user)):
    # Solo devolvemos datos seguros (jamás la contraseña)
    resultado = await db.execute(select(UsuarioAdmin.id, UsuarioAdmin.email, UsuarioAdmin.nombre_completo, UsuarioAdmin.fecha_creacion))
    admins = resultado.all()
    
    datos = [{"id": str(a.id), "email": a.email, "nombre_completo": a.nombre_completo, "fecha_creacion": a.fecha_creacion} for a in admins]
    return datos

@app.post("/api/v1/admins", summary="Registrar Nuevo Admin (Protegido)")
async def crear_admin(datos: NuevoAdmin, db: AsyncSession = Depends(get_db), admin_actual: str = Depends(get_current_user)):
    import bcrypt
    
    # Verificamos que el correo no exista ya
    resultado = await db.execute(select(UsuarioAdmin).filter(UsuarioAdmin.email == datos.email))
    if resultado.scalars().first():
        raise HTTPException(status_code=400, detail="Este correo ya tiene acceso administrativo")
        
    # Encriptamos la contraseña del nuevo colega
    sal = bcrypt.gensalt()
    contrasena_encriptada = bcrypt.hashpw(datos.password.encode('utf-8'), sal).decode('utf-8')
    
    nuevo_admin = UsuarioAdmin(
        email=datos.email,
        hashed_password=contrasena_encriptada,
        nombre_completo=datos.nombre_completo
    )
    db.add(nuevo_admin)
    await db.commit()
    
    return {"mensaje": f"Acceso concedido exitosamente para {datos.nombre_completo}"}