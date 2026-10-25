# Bitácora de Desarrollo y Seguimiento Técnico

**Proyecto:** PluriOne V2.1 — Motor Predictivo de Rotación

## Datos del Documento

* **Autor:** Pedro Gabriel Ocampo Rojas
* **Institución:** Tecnológico de Estudios Superiores de Ecatepec (TESE) / TODO Academy
* **Fecha de Emisión:** Octubre 2026

---

## Fase 1: Configuración de Arquitectura y Base de Datos

* **Objetivo:** Establecer la infraestructura base y la capa de persistencia.
* **Actividades Realizadas:**
  * Configuración de entorno virtual en Python (`venv`) e instalación de dependencias (`requirements.txt`).
  * Diseño del modelo Entidad-Relación para RRHH (Empleados, Salarios, Evaluaciones, Administradores).
  * Implementación de la conexión asíncrona a PostgreSQL mediante SQLAlchemy (`database.py`).
  * Ejecución de migraciones y script de aprovisionamiento inicial (`crear_admin.py`) con encriptación Bcrypt.
* **Estado:** Completado.

---

## Fase 2: Desarrollo del Backend y API REST (FastAPI)

* **Objetivo:** Construir los endpoints transaccionales y de seguridad.
* **Actividades Realizadas:**
  * Implementación de autenticación basada en JSON Web Tokens (JWT) con el esquema `OAuth2PasswordBearer`.
  * Desarrollo del endpoint público de Login (`/api/v1/login`) con validación de credenciales.
  * Construcción del CRUD de Empleados protegido por token, implementando la estrategia de Soft Delete (Borrado Lógico) para no alterar métricas históricas.
  * Creación del endpoint de Control de Accesos para registrar nuevos administradores de forma segura.
* **Estado:** Completado.

---

## Fase 3: Integración de Machine Learning e Inteligencia Artificial (XAI)

* **Objetivo:** Acoplar el modelo de Random Forest y dotarlo de explicabilidad.
* **Actividades Realizadas:**
  * Carga en memoria RAM del modelo pre-entrenado (`.pkl`) utilizando `joblib`.
  * Creación del endpoint `/api/v1/predicciones/simulador` para recibir variables operativas (Salario, Distancia, Desempeño).
  * Programación del motor de Inteligencia Artificial Explicable (XAI) mediante reglas heurísticas para traducir la predicción matemática a un diagnóstico en lenguaje natural (ej. *"Riesgo de fuga por subvaloración"*).
* **Estado:** Completado.

---

## Fase 4: Construcción del Frontend (React + Vite)

* **Objetivo:** Desarrollar la Interfaz de Usuario (SPA) y el enrutamiento protegido.
* **Actividades Realizadas:**
  * Configuración del proyecto con Vite e instalación de librerías (`axios`, `react-router-dom`, `lucide-react`, `recharts`).
  * Implementación de Axios Interceptor para inyectar automáticamente el token JWT en las cabeceras de cada petición.
  * Construcción de los componentes de navegación superior (Barra de menús) y guardias de rutas privadas (`LayoutProtegido`).
  * Desarrollo del módulo Directorio General: Tabla interactiva de empleados con semáforos de desempeño y botón de baja lógica.
  * Desarrollo del módulo Control de Accesos: Formulario de alta para personal de RRHH y tabla de lectura.
* **Estado:** Completado.

---

## Fase 5: Dashboard Analítico y Reporteo

* **Objetivo:** Visualizar métricas en tiempo real y exportar resultados.
* **Actividades Realizadas:**
  * Eliminación de límites artificiales en las consultas de base de datos para que la "Muestra Analizada" refleje el 100% de la plantilla histórica.
  * Implementación de interactividad Drill-down: Creación de ventanas modales dinámicas al hacer clic en las tarjetas de "Empleados Activos" y "Bajas".
  * Integración de Recharts para generar la gráfica de barras de retención por distancia y la gráfica de líneas para el análisis de cohortes temporales.
  * Desarrollo de la función nativa en JavaScript (Blob API) para compilar y descargar reportes predictivos de la IA en formato `.txt`.
* **Estado:** Completado.

---

## Fase 6: Documentación Técnica y Cierre

* **Objetivo:** Cumplir con los entregables administrativos del Modelo Dual.
* **Actividades Realizadas:**
  * Redacción del archivo `README.md` maestro en la raíz del repositorio.
  * Elaboración del Product Requirements Document (PRD) detallando alcance, público objetivo y requisitos funcionales.
  * Creación del Manual Técnico con la arquitectura del sistema, diccionario de base de datos y flujos de endpoints.
  * Creación del Manual de Usuario con las instrucciones operativas para el cliente final.
  * Ejecución de micro-commits en Git y despliegue final del código fuente en el repositorio principal de GitHub.
* **Estado:** Completado.

---

## Actualización Corte 3 — Ampliación del Modelo Predictivo a 4 Dimensiones (22 de octubre de 2026)

### 1. Cambios Implementados en el Pipeline de Datos y ML
* **Poblado de Datos (`backend/seed_data.py`):** Se actualizó el generador sintético de 10,000 empleados para insertar registros en la tabla `encuestas_clima` (`EncuestaClima`), calculando el promedio entre `satisfaccion_liderazgo` y `balance_vida_trabajo` (escala 1 a 5) y correlacionando un clima laboral bajo (`< 3.0`) con un incremento en la probabilidad de renuncia.
* **Vector de Características (`backend/ml/train_model.py`):** El modelo `RandomForestClassifier` (`n_estimators=100, max_depth=5, random_state=42`) pasó de entrenar con 3 variables a entrenar con **4 variables reales extraídas de PostgreSQL**: `["distancia_km", "salario", "desempeno", "clima_laboral"]`.
* **Integración Punta a Punta:** Se actualizó el binario `backend/ml/modelo_rotacion.pkl`, el esquema `SimulacionRiesgo` en `backend/main.py` y el formulario de `frontend/src/App.jsx` (`formSimulador`) para enviar las 4 variables convertidas con `parseFloat`.

### 2. Comparativa de Precisión del Modelo (`accuracy_score`)

| Iteración del Modelo | Variables Predictoras (`X`) | Origen de Datos de Clima | Precisión Obtenida (`Accuracy`) |
| :--- | :--- | :--- | :--- |
| **Versión Actual V2.1 (4 variables)** | `distancia_km`, `salario`, `desempeno`, `clima_laboral` | 10,000 registros en `encuestas_clima` generados por `seed_data.py` | | **Versión Actual v2.1 (4 variables)** | `distancia_km`, `salario`, `desempeno`, `clima_laboral` | 10,000 encuestas sintéticas generadas en `encuestas_clima` por `seed_data.py` | **67.15%** | **Precision:** `0.69` (69%) · **Recall:** `0.76` (76%) · **F1-Score:** `0.72` |

* **Observación técnica:** Al incorporar datos reales de `EncuestaClima` en lugar del valor constante de imputación (`3.0`), los árboles de decisión del Random Forest cuentan con un nodo discriminante adicional para separar perfiles con condiciones salariales similares pero distinto nivel de desgaste organizacional.