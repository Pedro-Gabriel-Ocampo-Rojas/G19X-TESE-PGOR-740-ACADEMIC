# Manual Técnico de Arquitectura e Implementación

**PluriOne V2.1 — Motor Predictivo de Rotación de Personal**

## Datos del Proyecto

* **Autor:** Pedro Gabriel Ocampo Rojas
* **Especialidad:** Ingeniería en Sistemas Computacionales
* **Contexto Operativo:** Modelo Dual — TESE / TODO Academy
* **Versión del Sistema:** 2.1.0
* **Fecha de Emisión:** Octubre 2026

---

## 1. Descripción General del Sistema

PluriOne es una plataforma web integral basada en una arquitectura cliente-servidor desacoplada orientada a servicios (API RESTful), diseñada para la monitorización de recursos humanos, control operativo de plantillas y predicción analítica del riesgo de deserción laboral (*Churn Rate*).

El sistema implementa capacidades de **Inteligencia Artificial Explicable (XAI)** mediante un modelo supervisado de aprendizaje automático (*Random Forest*), acoplado a un motor transaccional asíncrono con base de datos relacional y una interfaz reactiva de alto rendimiento.

---

## 2. Arquitectura General y Flujo de Datos

El sistema sigue el principio de separación de responsabilidades (*Separation of Concerns*) estructurado en capas principales:

```
[ Cliente Web SPA: React + Vite ]
               │
               ▼   (HTTP / JSON + JWT Bearer)
[ Servidor de Aplicaciones: FastAPI (Asíncrono) ]
       │                                  │
       ▼                                  ▼
[ Capa de Persistencia: PostgreSQL ]   [ Motor IA: Scikit-Learn (PKL en RAM) ]
```

1. **Capa de Presentación (Frontend):** *Single Page Application* (SPA) construida en React con Vite. Implementa enrutamiento protegido mediante `react-router-dom`, gráficos dinámicos con `Recharts` e interceptores de red mediante `Axios`.
2. **Capa de Seguridad e Intermediación:** Validación perimetral basada en tokens criptográficos JSON Web Tokens (JWT) bajo el esquema `OAuth2PasswordBearer`, complementada con políticas CORS para el origen local del cliente.
3. **Capa de Negocio y Servicios (Backend):** API REST asíncrona implementada con FastAPI y Python 3.10+, gestionando dependencias mediante inyección (`Depends`), serialización tipada con esquemas Pydantic y consultas concurrentes vía `SQLAlchemy AsyncIO`.
4. **Capa de Datos y Persistencia:** Base de datos relacional PostgreSQL con claves primarias tipo `UUIDv4`, integridad referencial y borrado lógico (*Soft Delete*).
5. **Capa de Inteligencia Artificial:** Modelo serializado con `Joblib` cargado en memoria RAM en el ciclo de vida inicial del servidor para inferencia en tiempo real, complementado con un motor de heurística explicativa (XAI).

---

## 3. Modelo de Datos y Persistencia (PostgreSQL)

La capa de datos se gestiona mediante el ORM SQLAlchemy en modo asíncrono (`ext.asyncio`).

### 3.1 Diccionario de Datos

#### Tabla: `empleados`
Almacena el registro maestro de los trabajadores de la organización.

| Campo | Tipo de Dato | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key, generado automáticamente. |
| `departamento_id` | Integer | Foreign Key, catálogo de departamentos. |
| `puesto_id` | Integer | Foreign Key, catálogo de puestos. |
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

#### Tabla: `usuarios_admin`
Almacena las credenciales y perfiles de los operadores autorizados del sistema.

| Campo | Tipo de Dato | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key, identificador único del administrador. |
| `email` | String(150) | Unique, Not Null, correo institucional y usuario de acceso. |
| `hashed_password` | String(255) | Not Null, contraseña protegida con Bcrypt. |
| `nombre_completo` | String(150) | Not Null, nombre y apellidos. |
| `fecha_creacion` | DateTime | Default `utcnow`, marca temporal de creación. |

### 3.2 Estrategia de Soft Delete (Borrado Lógico)

En lugar de ejecutar sentencias `DELETE FROM empleados`, el sistema actualiza `estado_activo = False`. Esto garantiza:
1. **Preservación del histórico de entrenamiento:** Datos disponibles para futuros reentrenamientos del modelo supervisado.
2. **Consistencia analítica:** Permite calcular métricas de cohortes y tasas de rotación sin generar registros huérfanos en salarios y evaluaciones.

---

## 4. Especificación de la API REST (FastAPI)

Los endpoints protegidos implementan inyección de dependencias mediante `Depends(obtener_admin_actual)`.

| Método | Endpoint | Autenticación | Entrada | Salida / Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/login` | Pública | `form-data` (`username`, `password`) | `{"access_token": "<jwt>", "token_type": "bearer"}`. Valida credenciales contra PostgreSQL y genera el token. |
| `GET` | `/api/v1/empleados` | Pública / Dashboard | Parámetros opcionales | Lista completa de empleados con su salario vigente y última evaluación (`OUTER JOIN` asíncrono sin límites artificiales). |
| `POST` | `/api/v1/empleados` | JWT Requerido | JSON (`departamento_id`, `puesto_id`, `distancia_oficina_km`, `salario`, `desempeno`) | Confirmación de contratación y UUID asignado. Registra al empleado y sus tablas asociadas. |
| `DELETE` | `/api/v1/empleados/{id}` | JWT Requerido | UUID en URL | Mensaje de confirmación. Aplica baja lógica cambiando `estado_activo` a `False`. |
| `POST` | `/api/v1/predicciones/simulador` | Pública | JSON (`distancia_km`, `salario`, `desempeno`) | Alerta (*Riesgo/Estable*), probabilidad porcentual y diagnóstico XAI mediante el modelo *Random Forest*. |
| `GET` | `/api/v1/admins` | JWT Requerido | Ninguna | Listado de administradores (`id`, `email`, `nombre_completo`, `fecha_creacion`), omitiendo hashes. |
| `POST` | `/api/v1/admins` | JWT Requerido | JSON (`email`, `password`, `nombre_completo`) | Confirmación de acceso. Registra administradores encriptando la clave con Bcrypt. |

---

## 5. Motor Predictivo de Inteligencia Artificial y XAI

### 5.1 Pipeline de Inferencia

* **Algoritmo:** Clasificador Random Forest (`RandomForestClassifier`) de Scikit-Learn.
* **Vector de Entrada ($X$):**
  $$X = [\text{distancia\_km}, \text{salario}, \text{desempeno}]$$
* **Vector de Salida ($Y$):**
  * `predict(X)`: Clase binaria ($0 = \text{Estable / Retención}$, $1 = \text{Riesgo de Fuga}$).
  * `predict_proba(X)`: Probabilidad asignada a la clase positiva (renuncia).
* **Mecanismo de Despliegue:** Carga única en RAM al iniciar el backend mediante `joblib.load()`, garantizando tiempos de respuesta menores a 20 ms por solicitud.

### 5.2 Motor de Inteligencia Artificial Explicable (XAI)

Capa heurística de post-procesamiento que traduce los factores cuantitativos a lenguaje natural:

* **Regla 1 (Estrés de Traslado):** Se activa si $\text{distancia\_km} > 20$.
* **Regla 2 (Umbral Salarial):** Se activa si $\text{salario} < \$20,000 \text{ MXN}$.
* **Regla 3 (Incongruencia Desempeño vs Compensación):** Se activa si $\text{desempeno} > 4.0$ y $\text{salario} < \$25,000 \text{ MXN}$ (fuga por subvaloración laboral).
* **Regla 4 (Bajo Encaje Organizacional):** Se activa si $\text{desempeno} < 2.5$.

---

## 6. Seguridad Criptográfica y Control de Sesión

1. **Derivación de Claves (Bcrypt):** Las contraseñas se procesan mediante `bcrypt.hashpw()` con sales criptográficas de 128 bits generadas aleatoriamente.
2. **Tokens JWT:**
   * **Algoritmo de firma:** HMAC-SHA256 (HS256).
   * **Payload:** `{"sub": "correo_usuario", "exp": <timestamp_expiracion>}`
3. **Interceptor en Frontend:** Axios intercepta todas las peticiones salientes e inyecta la cabecera:
   ```http
   Authorization: Bearer <token_jwt>
   ```
4. **Respuesta a Accesos Inválidos:** Tokens expirados o manipulados generan una respuesta `HTTP 401 Unauthorized`, activando la redirección inmediata a `/login`.

---

## 7. Arquitectura Frontend (React)

Estructura modular basada en componentes funcionales:

* **`App`:** Proveedor central de rutas con `BrowserRouter`.
* **`RutaProtegida` / `LayoutProtegido`:** Guardias de seguridad que validan el token en `localStorage` y estructuran la barra de navegación persistente.
* **`Dashboard`:**
  * Métricas y KPIs en tiempo real sin límites artificiales.
  * Modales interactivos de *Drill-down* para consultar activos y bajas.
  * Gráfica de líneas para análisis de cohortes temporales (mes de ingreso vs. bajas).
  * Simulador predictivo con visualización del diagnóstico XAI.
  * Función `descargarReporte()`: Generación nativa en el navegador de reportes TXT utilizando `Blob` y `URL.createObjectURL`.
* **`Directorio`:** Padrón general de empleados con visualización de UUID completo, distancia, salario, semáforo de desempeño y acciones de baja lógica.
* **`Accesos`:** Panel de administración multi-usuario para la creación y visualización de cuentas del equipo de Recursos Humanos.

---

## 8. Mantenimiento y Configuración de Entornos

### 8.1 Dependencias del Backend (`requirements.txt`)

```text
fastapi>=0.110.0
uvicorn[standard]>=0.28.0
sqlalchemy[asyncio]>=2.0.28
asyncpg>=0.29.0
psycopg2-binary>=2.9.9
pydantic>=2.6.4
pyjwt>=2.8.0
bcrypt>=4.1.2
scikit-learn>=1.4.0
pandas>=2.2.0
joblib>=1.3.2
```

### 8.2 Dependencias del Frontend (`package.json`)

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

### 8.3 Script de Aprovisionamiento Semilla (`crear_admin.py`)

Procedimiento automatizado para generar el primer usuario administrador:
1. Establecer conexión con el pool asíncrono de PostgreSQL.
2. Verificar si el usuario semilla ya existe en el sistema.
3. Generar el hash de contraseña con Bcrypt e insertar el registro en `usuarios_admin`.
4. Confirmar la transacción (`commit`) y cerrar la conexión.