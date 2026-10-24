# Definición del Producto Mínimo Viable (MVP)
**Proyecto:** Desarrollo de un Motor Predictivo de Rotación de Personal (PluriOne V2.1)  
**Unidad Económica:** PluriOne S.A. de C.V.  
**Versión del Sistema:** 2.1.0  
**Base de Datos Oficial:** `PluriOne_db` (PostgreSQL)  

---

## 1. Propósito y Resumen Ejecutivo del MVP

El presente documento define formalmente el alcance funcional, técnico y demostrativo del Producto Mínimo Viable (MVP) del **Motor Predictivo de Rotación de Personal**. Su objetivo es proporcionar al área de Recursos Humanos y Dirección de PluriOne S.A. de C.V. una herramienta web funcional y segura capaz de:
1. Centralizar el expediente operativo de los colaboradores (contratación, salario, desempeño y baja lógica).
2. Predecir la probabilidad de renuncia mediante un modelo de Machine Learning (**Random Forest Classifier**) entrenado sobre datos históricos reales/simulados en PostgreSQL.
3. Explicar en lenguaje natural las causas detrás de cada predicción (**Inteligencia Artificial Explicable - XAI**) para respaldar decisiones preventivas de retención.

---

## 2. Arquitectura Técnica del MVP

El MVP opera bajo una arquitectura cliente-servidor desacoplada en 4 capas:

| Capa | Tecnología / Librerías | Puerto / Ubicación | Responsabilidad en el MVP |
| :--- | :--- | :--- | :--- |
| **1. Presentación (Frontend)** | React + Vite + Recharts | `http://localhost:5173` | Interfaz de usuario con login, dashboard ejecutivo, directorio de personal, gestión de accesos y simulador interactivo. |
| **2. Servicios (API REST)** | Python + FastAPI + Uvicorn | `http://127.0.0.1:8000` | Exposición de endpoints asíncronos, validación de esquemas con Pydantic, protección CORS y validación de sesión. |
| **3. Seguridad y Criptografía** | `bcrypt` (`4.0.1`) + `PyJWT` (`2.8.0`) + `python-dotenv` | `backend/security.py` | Hashing irreversible de contraseñas con sal criptográfica, emisión/verificación de tokens JWT (`HS256`) y lectura estricta de variables `.env`. |
| **4. Datos e Inferencia (BD + ML)** | PostgreSQL (`PluriOne_db`) + SQLAlchemy (`asyncpg`) + `scikit-learn` | Puerto `5432` / `backend/ml/modelo_rotacion.pkl` | Persistencia relacional asíncrona e inferencia en memoria mediante bosque aleatorio de 100 estimadores. |

---

## 3. Funciones Incluidas en la Entrega (En Alcance)

A continuación se desglosan los módulos que integran la entrega actual y que se encuentran implementados y verificados de punta a punta en el repositorio (ver evidencias en la carpeta /Capturas):

### 3.1. Módulo de Seguridad, Autenticación y Control de Administradores
* **Aislamiento de Secretos (`.env`):** Ninguna credencial reside en el código fuente. `backend/database.py` consume `DATABASE_URL` con el driver asíncrono `postgresql+asyncpg://`, `backend/security.py` exige `JWT_SECRET_KEY` (deteniendo el arranque con un `ValueError` si no está configurada) y `backend/crear_admin.py` lee `ADMIN_PASSWORD_INICIAL`.
* **Encriptación Directa con `bcrypt`:** Las contraseñas de los administradores se procesan directamente con `bcrypt.gensalt()` y `bcrypt.hashpw()`, almacenando únicamente el hash resultante en la tabla `usuarios_admin`.
* **Autenticación OAuth2 con JWT (`POST /api/v1/login`):** Valida credenciales sin valores precargados en el frontend y emite un token `Bearer` firmado con el algoritmo `HS256`.
* **Gestión de Administradores (`GET /api/v1/admins` y `POST /api/v1/admins`):** Permite consultar la lista de administradores activos (omitiendo el campo `hashed_password` por seguridad) y registrar nuevos administradores verificando que no existan correos duplicados.

### 3.2. Módulo de Directorio y Ciclo de Vida de Empleados
* **Consulta Histórica Relacional (`GET /api/v1/empleados`):** Endpoint protegido que realiza un cruce asíncrono (`outerjoin`) entre las tablas `empleados`, `historial_salarios` y `evaluaciones_desempeno`, ordenando por fecha de contratación descendente.
* **Alta Transaccional de Colaboradores (`POST /api/v1/empleados`):** Registra un nuevo empleado generando su `UUID` primario y crea simultáneamente, en la misma transacción, su registro inicial en `historial_salarios` (motivo: *"Contratación Inicial"*) y su primera evaluación en `evaluaciones_desempeno`.
* **Baja Lógica / Soft Delete (`DELETE /api/v1/empleados/{empleado_id}`):** En lugar de destruir el registro con un `DELETE` físico, cambia la bandera `estado_activo = False`. **Regla de negocio clave:** Conservar a los exempleados en la base de datos es indispensable para que el modelo de Machine Learning tenga casos reales de renuncia (`renuncio = 1`) con los cuales aprender.

### 3.3. Pipeline de Machine Learning Ampliado (4 Variables Predictoras)
* **Extracción Multitabla (`backend/ml/train_model.py`):** Se conecta de forma asíncrona a `PluriOne_db` y extrae registros de **4 tablas del modelo relacional**:
  1. `empleados` (`distancia_oficina_km` y etiqueta objetivo `estado_activo`).
  2. `historial_salarios` (`monto_mensual`).
  3. `evaluaciones_desempeno` (`puntuacion_kpi`).
  4. `encuestas_clima` (promediando `satisfaccion_liderazgo` y `balance_vida_trabajo` en la métrica unificada `clima_laboral`).
* **Tolerancia a Datos Faltantes:** Aplica uniones izquierdas (`how="left"`) e imputación controlada (`fillna`) para evitar caídas si algún colaborador aún no cuenta con encuesta de clima registrada.
* **Entrenamiento y Serialización:** Entrena un `RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)` dividiendo el dataset en 80% entrenamiento y 20% prueba, y exporta el binario entrenado a `backend/ml/modelo_rotacion.pkl`.

### 3.4. Simulador de Riesgo con Inteligencia Artificial Explicable (XAI)
* **Inferencia en Tiempo Real (`POST /api/v1/predicciones/simulador`):** Recibe un objeto JSON validado por el esquema `SimulacionRiesgo` con 4 dimensiones: `distancia_km`, `salario`, `desempeno` y `clima_laboral`.
* **Cálculo de Probabilidad y Clasificación:** Ejecuta `modelo_ia.predict()` y `modelo_ia.predict_proba()` para determinar el estado (`🔴 ALTO RIESGO DE FUGA` o `🟢 EMPLEADO ESTABLE`) y el porcentaje exacto de probabilidad de renuncia.
* **Motor de Razonamiento Heurístico (XAI):** Genera una explicación dinámica en lenguaje natural detallando qué factores específicos detonan la alerta (desgaste por traslado > 20 km, salario < $20,000, subvaloración por alto desempeño > 4.0 con sueldo < $25,000, baja motivación < 2.5 o clima laboral deficiente < 3.0) o qué fortalezas retienen al colaborador.

### 3.5. Dashboard Ejecutivo e Interfaz de Usuario (React)
* **Visualización de Indicadores:** Tarjetas de resumen con métricas de plantilla activa, bajas registradas, tasa de retención y gráficas interactivas construidas con `Recharts`.
* **Exportación de Diagnóstico:** Capacidad de descargar el dictamen generado por el simulador en formato de texto (`.txt`) para integrarlo al expediente del trabajador.

---

## 4. Funciones Excluidas de esta Entrega (Fuera de Alcance)

Para acotar la complejidad del MVP y garantizar la calidad y seguridad del núcleo predictivo, los siguientes elementos quedan explícitamente fuera de esta entrega:

| Característica / Módulo | Estado Actual en el Repositorio | Justificación de Exclusión en el MVP |
| :--- | :--- | :--- |
| **Explotación de tablas `Capacitacion` y `RegistroAusentismo`** | Modeladas en `backend/models.py` (`capacitaciones` y `registro_ausentismos`), sin endpoints ni peso en el `.pkl`. | Se dejaron definidas en el esquema relacional para asegurar la escalabilidad de la base de datos sin requerir migraciones destructivas en la versión V3.0. |
| **Edición histórica de salarios y evaluaciones (PUT/PATCH)** | Se registra el salario y KPI inicial al contratar (`POST /api/v1/empleados`). | El MVP prioriza el flujo de alta, baja lógica y simulación; la pantalla de promociones salariales e histórico de KPIs por empleado corresponde a una fase posterior. |
| **Recuperación de contraseña por correo (SMTP)** | No implementado. | El alta y control de accesos se realiza de manera centralizada por los administradores autenticados en el módulo `/api/v1/admins`. |
| **Despliegue en Nube Pública y CI/CD** | Ejecución en entorno local controlado (`localhost:5173` y `127.0.0.1:8000`). | Por políticas de privacidad de datos de capital humano de la Unidad Económica, las pruebas del MVP se realizan en entorno local aislado. |
| **Aplicación Móvil Nativa / Base de Datos Local Móvil** | Interfaz web responsiva en navegador. | El sistema es una aplicación web cliente-servidor; no contempla almacenamiento local en dispositivos móviles (SQLite/Room) ni sincronización offline. |

---

## 5. ¿Cómo se Demuestra cada Función? (Protocolo de Verificación)

Durante la evaluación final, cada componente del MVP se demuestra en vivo siguiendo este protocolo de pruebas verificables:

### Prueba 1: Blindaje de Configuración y Variables de Entorno
* **Acción:** Verificar la existencia de `backend/.env.example` con el esquema `postgresql+asyncpg://` y comprobar que al omitir `JWT_SECRET_KEY` en `.env`, el backend impide el arranque lanzando `ValueError`.
* **Resultado esperado:** El sistema no permite ejecuciones inseguras con claves por defecto.

### Prueba 2: Control de Acceso y Protección de Endpoints (JWT)
* **Acción:** Realizar una petición directa sin token a `GET http://127.0.0.1:8000/api/v1/empleados` desde el navegador o Swagger UI (`/docs`).
* **Resultado esperado:** El servidor rechaza la petición con código HTTP `401 Unauthorized` (`{"detail": "Not authenticated"}`).

### Prueba 3: Inicio de Sesión Limpio y Emisión de Token
* **Acción:** Abrir `http://localhost:5173`, verificar que los campos de correo y contraseña estén vacíos (sin credenciales precargadas), e ingresar las credenciales del administrador creadas con `crear_admin.py`.
* **Resultado esperado:** `POST /api/v1/login` responde `200 OK` con el `access_token` JWT y redirige al Dashboard Ejecutivo mostrando las gráficas de retención.

### Prueba 4: Contratación y Baja Lógica (Soft Delete)
* **Acción:** 
  1. En la vista de Directorio, registrar un nuevo colaborador indicando puesto, departamento, distancia, salario y desempeño.
  2. Presionar el botón de dar de baja sobre un colaborador activo.
* **Resultado esperado:** 
  1. `POST /api/v1/empleados` inserta al empleado junto con su salario y evaluación inicial.
  2. `DELETE /api/v1/empleados/{id}` actualiza `estado_activo = False`. El colaborador cambia su estado sin ser borrado físicamente de PostgreSQL, preservando el historial para futuros reentrenamientos del modelo.

### Prueba 5: Simulación Predictiva de 4 Dimensiones y Razonamiento XAI
* **Acción A (Escenario de Alto Riesgo):** En el Simulador, ingresar `distancia_km: 35`, `salario: 14000`, `desempeno: 4.5`, `clima_laboral: 2.0` y ejecutar la predicción.
  * **Resultado esperado:** El sistema devuelve `🔴 ALTO RIESGO DE FUGA`, el porcentaje de probabilidad calculado por el Random Forest y el diagnóstico XAI explicando que la distancia genera desgaste, el sueldo no es proporcional a su alto desempeño y percibe un clima laboral deficiente.
* **Acción B (Escenario Estable):** Ingresar `distancia_km: 8`, `salario: 32000`, `desempeno: 4.0`, `clima_laboral: 4.5`.
  * **Resultado esperado:** El sistema devuelve `🟢 EMPLEADO ESTABLE` y detalla las fortalezas de retención del perfil.

### Prueba 6: Reproducibilidad del Entrenamiento ML
* **Acción:** Ejecutar en terminal dentro de `backend/`: `python ml/train_model.py`.
* **Resultado esperado:** El script extrae las 4 tablas desde `PluriOne_db`, construye el vector `X = df_completo[["distancia_km", "salario", "desempeno", "clima_laboral"]]`, imprime la precisión (`accuracy_score`) y el reporte de clasificación en consola, y actualiza el archivo `backend/ml/modelo_rotacion.pkl`.
  **Prueba 1.** Evidencia: Capturas/prueba1_variables_entorno.png
  **Prueba 2.** Evidencia: Capturas/prueba2_acceso_no_autorizado_401.png
  **Prueba 3.** Evidencia: Capturas/prueba3_login.png
  **Prueba 4.** Evidencia: Capturas/prueba4_directorio_alta_logica.png
  **Prueba 5.** Evidencia: Capturas/prueba5_simulador_4_variables(riesgo).png
  **Prueba 6.** Evidencia: Capturas/prueba6_simulador_4_variables(estable).png
  **Prueba 7.** Evidencia: Capturas/prueba7_entrenamiento_modelo.png
