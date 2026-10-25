# Manual Técnico de Arquitectura e Implementación

**PluriOne V2.1 — Motor Predictivo de Rotación de Personal**

## Datos del Proyecto

- **Autor:** Pedro Gabriel Ocampo Rojas
- **Especialidad:** Ingeniería en Sistemas Computacionales
- **Contexto Operativo:** Modelo Dual — TESE
- **Versión del Sistema:** 2.1.0
- **Fecha de Emisión:** Octubre 2026

---

## 1. Descripción General del Sistema

PluriOne es una plataforma web integral basada en una arquitectura cliente-servidor desacoplada orientada a servicios (API RESTful), diseñada para la monitorización de recursos humanos, control operativo de plantillas y predicción analítica del riesgo de deserción laboral (*Churn Rate*).

El sistema implementa capacidades de **Inteligencia Artificial Explicable (XAI)** mediante un modelo supervisado de aprendizaje automático (*Random Forest Classifier*), acoplado a un motor transaccional asíncrono con base de datos relacional (`PluriOne_db`) y una interfaz reactiva de alto rendimiento.

---

## 2. Arquitectura General y Flujo de Datos

El sistema sigue el principio de separación de responsabilidades (*Separation of Concerns*) estructurado en capas principales:

```text
[ Cliente Web SPA: React + Vite (Puerto 5173) ]
               │
               ▼   (HTTP / JSON + JWT Bearer)
[ Servidor de Aplicaciones: FastAPI Asíncrono (Puerto 8000) ]
       │                                  │
       ▼                                  ▼
[ Capa de Persistencia: PostgreSQL ]   [ Motor IA: Scikit-Learn (PKL en RAM) ]
```

1. **Capa de Presentación (Frontend):** *Single Page Application* (SPA) construida en React con Vite. Implementa enrutamiento protegido mediante `react-router-dom`, gráficos dinámicos con `Recharts` e interceptores de red mediante `Axios`.
2. **Capa de Seguridad e Intermediación:** Validación perimetral basada en tokens criptográficos JSON Web Tokens (JWT) bajo el esquema `OAuth2PasswordBearer` (`get_current_user`), complementada con políticas CORS para el origen local del cliente.
3. **Capa de Negocio y Servicios (Backend):** API REST asíncrona implementada con FastAPI y Python 3.10+, gestionando dependencias mediante inyección (`Depends(get_db)`), serialización tipada con esquemas Pydantic y consultas concurrentes vía `SQLAlchemy AsyncIO` (`asyncpg`).
4. **Capa de Datos y Persistencia:** Base de datos relacional PostgreSQL (`PluriOne_db`) con claves primarias tipo `UUIDv4`, integridad referencial y borrado lógico (*Soft Delete*).
5. **Capa de Inteligencia Artificial:** Modelo serializado con `Joblib` (`ml/modelo_rotacion.pkl`) cargado en memoria RAM en el ciclo de vida inicial del servidor para inferencia en tiempo real sobre 4 variables, complementado con un motor de heurística explicativa (XAI).

---

## 3. Modelo de Datos y Persistencia (PostgreSQL)

La capa de datos se gestiona mediante el ORM SQLAlchemy en modo asíncrono (`ext.asyncio`), leyendo la cadena de conexión desde variables de entorno (`DATABASE_URL` en `backend/.env`).

### 3.1 Diccionario de Datos Principal

#### Tabla: `empleados`
Almacena el registro maestro de los trabajadores de la organización.

| Campo | Tipo de Dato | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key, generado automáticamente (`uuid4`). |
| `departamento_id` | Integer | Foreign Key $\rightarrow$ `cat_departamentos.id`. |
| `puesto_id` | Integer | Foreign Key $\rightarrow$ `cat_puestos.id`. |
| `distancia_oficina_km` | Integer | Not Null, distancia lineal en km a la sede. |
| `fecha_contratacion` | Date | Not Null, fecha formal de incorporación. |
| `estado_activo` | Boolean | Default `True`. Bandera de borrado lógico (`False` = baja histórica). |

#### Tabla: `historial_salarios`
Registra la compensación económica asociada al trabajador.

| Campo | Tipo de Dato | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | Integer | Primary Key, autoincrementable. |
| `empleado_id` | UUID | Foreign Key $\rightarrow$ `empleados.id`. |
| `monto_mensual` | Float | Not Null, salario nominal mensual en MXN. |
| `fecha_cambio` | Date | Not Null, fecha de registro o modificación. |
| `motivo` | String(100) | Razón del movimiento (ej. *"Contratación Inicial"*). |

#### Tabla: `evaluaciones_desempeno`
Contiene las mediciones de rendimiento laboral utilizadas por el modelo predictivo.

| Campo | Tipo de Dato | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | Integer | Primary Key, autoincrementable. |
| `empleado_id` | UUID | Foreign Key $\rightarrow$ `empleados.id`. |
| `fecha_evaluacion` | Date | Not Null, fecha de la revisión. |
| `puntuacion_kpi` | Float | Not Null, calificación continua ($1.0$ a $5.0$). |
| `cumplimiento_metas` | Float | Porcentaje de cumplimiento ($0\%$ a $100\%$). |

#### Tabla: `encuestas_clima`
Almacena la percepción del entorno organizacional del empleado para alimentar la cuarta dimensión del modelo predictivo.

| Campo | Tipo de Dato | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | Integer | Primary Key, autoincrementable. |
| `empleado_id` | UUID | Foreign Key $\rightarrow$ `empleados.id`. |
| `fecha_encuesta` | Date | Not Null, fecha de aplicación de la encuesta. |
| `satisfaccion_liderazgo` | Integer | Calificación entera ($1$ a $5$). |
| `balance_vida_trabajo` | Integer | Calificación entera ($1$ a $5$). |

#### Tabla: `usuarios_admin`
Almacena las credenciales y perfiles de los operadores autorizados del sistema.

| Campo | Tipo de Dato | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key, identificador único del administrador. |
| `email` | String(150) | Unique, Not Null, correo institucional y usuario de acceso. |
| `hashed_password` | String(255) | Not Null, contraseña protegida con `bcrypt`. |
| `nombre_completo` | String(150) | Not Null, nombre del administrador. |
| `is_active` | Boolean | Default `True`, estado de la cuenta administrativa. |
| `fecha_creacion` | DateTime | Marca temporal de creación con zona horaria. |

### 3.2 Estrategia de Soft Delete (Borrado Lógico)

En lugar de ejecutar sentencias `DELETE FROM empleados`, el sistema actualiza `estado_activo = False`. Esto garantiza:
1. **Preservación del histórico de entrenamiento:** Los perfiles dados de baja constituyen los casos positivos de rotación (`rotacion_fuga = 1`) necesarios para entrenar el modelo supervisado.
2. **Consistencia analítica:** Permite calcular métricas de cohortes y tasas de rotación sin generar registros huérfanos en salarios, evaluaciones ni encuestas de clima.

---

## 4. Especificación de la API REST (FastAPI)

Todos los endpoints privados validan la sesión mediante la dependencia unificada `Depends(get_current_user)`.

| Método | Endpoint | Autenticación | Entrada | Salida / Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/login` | Pública | `form-data` (`username`, `password`) | `{"access_token": "<jwt>", "token_type": "bearer"}`. Valida credenciales contra PostgreSQL y firma el token. |
| `GET` | `/api/v1/empleados` | JWT Requerido | Cabecera `Bearer` | Lista completa de empleados cruzando salario, evaluación KPI y promedio de clima laboral (`OUTER JOIN` asíncrono). |
| `POST` | `/api/v1/empleados` | JWT Requerido | JSON (`departamento_id`, `puesto_id`, `distancia_oficina_km`, `salario`, `desempeno`, `clima_laboral`) | Confirmación de contratación y UUID. Inserta al empleado junto con su salario, evaluación y encuesta de clima inicial. |
| `DELETE` | `/api/v1/empleados/{id}` | JWT Requerido | UUID en URL | Mensaje de confirmación. Aplica baja lógica cambiando `estado_activo` a `False`. |
| `POST` | `/api/v1/predicciones/simulador` | JWT Requerido | JSON (`distancia_km`, `salario`, `desempeno`, `clima_laboral`) | Predicción (`ALTO RIESGO DE FUGA` / `EMPLEADO ESTABLE`), probabilidad porcentual y diagnóstico XAI sobre las 4 variables. |
| `GET` | `/api/v1/admins` | JWT Requerido | Cabecera `Bearer` | Listado de administradores registrados omitiendo hashes de contraseña. |
| `POST` | `/api/v1/admins` | JWT Requerido | JSON (`email`, `password`, `nombre_completo`) | Confirmación de alta. Registra nuevos administradores encriptando la contraseña con `bcrypt`. |

---

## 5. Motor Predictivo de Inteligencia Artificial y XAI

### 5.1 Pipeline de Inferencia

- **Algoritmo:** Clasificador Random Forest (`RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)`) de Scikit-Learn.
- **Vector de Entrada ($X$ — 4 Dimensiones):**
  $$X = [\text{distancia\_km}, \text{salario}, \text{desempeno}, \text{clima\_laboral}]$$
  donde $\text{clima\_laboral} = \frac{\text{satisfaccion\_liderazgo} + \text{balance\_vida\_trabajo}}{2.0}$.
- **Vector de Salida ($Y$):**
  * `predict(X)`: Clase binaria ($0 = \text{Estable / Retención}$, $1 = \text{Riesgo de Fuga}$).
  * `predict_proba(X)`: Probabilidad asignada a la clase positiva (renuncia).
- **Mecanismo de Despliegue:** Carga única en RAM al iniciar el backend mediante `joblib.load()`, garantizando tiempos de respuesta inferiores a 20 ms por solicitud.

### 5.2 Motor de Inteligencia Artificial Explicable (XAI)

Capa heurística de post-procesamiento en `backend/main.py` que traduce los factores cuantitativos evaluados a lenguaje natural:

- **Regla 1 (Desgaste por Traslado):** Se activa si $\text{distancia\_km} > 20$.
- **Regla 2 (Umbral Salarial):** Se activa si $\text{salario} < \$20,000 \text{ MXN}$.
- **Regla 3 (Subvaloración Salarial):** Se activa si $\text{desempeno} \ge 4.0$ y $\text{salario} < \$25,000 \text{ MXN}$ (talento sobresaliente con remuneración rezagada).
- **Regla 4 (Bajo Desempeño):** Se activa si $\text{desempeno} < 3.0$.
- **Regla 5 (Desgaste de Clima Organizacional):** Se activa si $\text{clima\_laboral} < 3.0$, alertando fricción en liderazgo o balance vida-trabajo.

### 5.3 Naturaleza de los Datos Sintéticos (`seed_data.py`) e Interpretación de Métricas

Por políticas de confidencialidad y protección de datos personales, el repositorio no contiene expedientes reales de colaboradores. En su lugar, el módulo **`backend/seed_data.py`** genera un conjunto de **10,000 perfiles sintéticos** gobernados por reglas probabilísticas explícitas que simulan el comportamiento organizacional:

1. **Riesgo base:** Todo empleado inicia con una probabilidad base de renuncia de `0.08` ($8\%$).
2. **Efecto de la distancia:** Si `distancia > 30 km`, la probabilidad de baja aumenta `+0.30` ($+30\%$).
3. **Efecto del salario:** Si el sueldo se ubica en la franja inferior del tabulador de su puesto (`< min + $2,000 MXN`), el riesgo aumenta `+0.25` ($+25\%$).
4. **Efecto del desempeño:** Se aplica una penalización lineal proporcional al bajo rendimiento igual a $(5.0 - \text{desempeno}) \times 0.08$.
5. **Efecto del clima laboral:** Si el promedio entre `satisfaccion_liderazgo` y `balance_vida_trabajo` es menor a `3.0`, la probabilidad de renuncia se incrementa en `+0.30` ($+30\%$); en caso contrario, suma una variación menor de $(5.0 - \text{clima\_promedio}) \times 0.05$.
6. **Asignación estocástica de estado:** El estado del empleado se determina evaluando `random.random() > probabilidad_renuncia`.

Al entrenar el modelo con `python ml/train_model.py` (8,000 registros de entrenamiento y 2,000 de validación), el `RandomForestClassifier` descubre y aproxima estas reglas a partir de los datos, arrojando las siguientes métricas verificables sobre el conjunto de prueba (`support = 2000`):

- **Accuracy Global (`67.15%`):** El modelo clasifica correctamente dos terceras partes de la plantilla total; el margen restante responde al ruido probabilístico (`random.random()`) introducido deliberadamente en `seed_data.py` para simular la variabilidad humana y evitar un conjunto determinista artificial del $100\%$.
- **Precision en Clase de Fuga (`0.69` / `69%`):** Significa que cuando el modelo emite una alerta de `ALTO RIESGO DE FUGA` (clase `1`), acierta en el **$69\%$** de los casos.
- **Recall (Sensibilidad) en Clase de Fuga (`0.76` / `76%`):** Significa que el motor es capaz de identificar preventivamente al **$76\%$** de todos los empleados que realmente renuncian en los datos de prueba (`F1-Score = 0.72`), priorizando la detección oportuna de fugas de talento para el área de Recursos Humanos.

---

## 6. Seguridad Criptográfica y Control de Sesión

1. **Aislamiento de Secretos (`python-dotenv`):** `backend/security.py` exige la variable `JWT_SECRET_KEY` desde `backend/.env` (lanzando `ValueError` si no está configurada) y `backend/crear_admin.py` lee `ADMIN_PASSWORD_INICIAL` desde el entorno.
2. **Derivación de Claves (`bcrypt`):** Las contraseñas se procesan directamente con `bcrypt.hashpw()` y `bcrypt.gensalt()`, sin almacenar texto plano en PostgreSQL.
3. **Tokens JWT (`PyJWT`):**
   * **Algoritmo de firma:** HMAC-SHA256 (`HS256`).
   * **Payload:** `{"sub": "correo_usuario", "exp": <timestamp_expiracion>}`
4. **Respuesta a Accesos Inválidos:** Peticiones sin token o con tokens expirados reciben `HTTP 401 Unauthorized`.

---

## 7. Arquitectura Frontend (React)

Interfaz implementada en `frontend/src/App.jsx`:

- **Autenticación y Guardias de Sesión:** Validación de token JWT y cabeceras `Authorization: Bearer <token>`.
- **Dashboard Analítico:**
  * Tarjetas de KPIs en tiempo real (Muestra Analizada, Empleados Activos, Bajas Históricas y Tasa de Rotación).
  * Modales interactivos de *Drill-down* para inspección de activos y bajas.
  * Gráficas comparativas en `Recharts`.
  * **Simulador de Riesgo (IA):** Formulario controlado (`formSimulador`) que envía las 4 variables convertidas con `parseFloat` (restringiendo salarios al dominio mínimo de entrenamiento de $\$12,000 \text{ MXN}$), presenta el resumen de los 4 factores evaluados, el diagnóstico XAI y permite exportar el dictamen a `.txt`.
- **Directorio General y Contratación:** Tabla general con visualización de UUID, fecha de ingreso, distancia, salario, semáforo de desempeño, semáforo de clima laboral, baja lógica y modal de **Nueva Contratación** (`formNuevo`) con captura de las 4 métricas operativas.
- **Control de Accesos:** Panel multi-administrador para el alta de personal de Recursos Humanos.

---

## 8. Mantenimiento y Configuración de Entornos

### 8.1 Dependencias Principales del Backend (`backend/requirements.txt`)

El archivo `requirements.txt` se genera directamente mediante `pip freeze` en el entorno virtual para garantizar reproducibilidad exacta:

```text
asyncpg==0.31.0
bcrypt==4.0.1
Faker==40.40.0
fastapi==0.141.1
greenlet==3.5.6
joblib==1.6.0
numpy==2.4.6
pandas==3.0.6
psycopg2-binary==2.9.13
pydantic==2.14.1
PyJWT==2.8.0
python-dotenv==1.0.0
python-multipart==0.0.32
scikit-learn==1.9.1
scipy==1.17.1
SQLAlchemy==2.1.1
uvicorn==0.54.0
```

### 8.2 Dependencias del Frontend (`frontend/package.json`)

```json
{
  "dependencies": {
    "axios": "^1.6.8",
    "lucide-react": "^0.359.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.3",
    "recharts": "^2.12.3"
  }
}
```

### 8.3 Aprovisionamiento del Administrador Inicial (`backend/crear_admin.py`)

1. Carga las variables de entorno mediante `load_dotenv()`.
2. Verifica la existencia de la variable `ADMIN_PASSWORD_INICIAL` en `backend/.env`.
3. Comprueba en PostgreSQL que el correo `admin@plurione.com` no esté duplicado.
4. Genera el hash irreversible con `bcrypt.hashpw()` e inserta el registro en `usuarios_admin`.