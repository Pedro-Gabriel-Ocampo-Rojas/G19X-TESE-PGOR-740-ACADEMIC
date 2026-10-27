# Bitácora de Desarrollo y Seguimiento Técnico

**Proyecto:** PluriOne V2.1 — Motor Predictivo de Rotación

## Datos del Documento

- **Autor:** Pedro Gabriel Ocampo Rojas
- **Institución:** Tecnológico de Estudios Superiores de Ecatepec (TESE)
- **Fecha de Emisión:** Octubre 2026

---

## Fase 1: Configuración de Arquitectura y Base de Datos

- **Objetivo:** Establecer la infraestructura base y la capa de persistencia.
- **Actividades Realizadas:**
  * Configuración de entorno virtual en Python (`venv`) e instalación de dependencias (`requirements.txt`).
  * Diseño del modelo Entidad-Relación para RRHH (Empleados, Salarios, Evaluaciones de Desempeño, Encuestas de Clima, Catálogos y Administradores).
  * Implementación de la conexión asíncrona a PostgreSQL (`PluriOne_db`) mediante SQLAlchemy (`database.py`) leyendo credenciales desde variables de entorno (`.env`).
  * Ejecución de scripts de inicialización (`init_db.py`), semilla sintética (`seed_data.py`) y aprovisionamiento de administrador inicial (`crear_admin.py`) con encriptación `bcrypt`.
- **Estado:** Completado.

---

## Fase 2: Desarrollo del Backend y API REST (FastAPI)

- **Objetivo:** Construir los endpoints transaccionales y de seguridad.
- **Actividades Realizadas:**
  * Implementación de autenticación basada en JSON Web Tokens (JWT) con el esquema `OAuth2PasswordBearer` (`get_current_user`).
  * Desarrollo del endpoint público de Login (`/api/v1/login`) con validación de credenciales contra PostgreSQL.
  * Construcción del CRUD de Empleados protegido por token, implementando la estrategia de Soft Delete (Borrado Lógico) para no alterar métricas históricas.
  * Creación del endpoint de Control de Accesos para registrar nuevos administradores de forma segura.
- **Estado:** Completado.

---

## Fase 3: Integración de Machine Learning e Inteligencia Artificial (XAI)

- **Objetivo:** Acoplar el modelo de Random Forest y dotarlo de explicabilidad.
- **Actividades Realizadas:**
  * Carga en memoria RAM del modelo pre-entrenado (`ml/modelo_rotacion.pkl`) utilizando `joblib`.
  * Creación del endpoint protegido `/api/v1/predicciones/simulador` para recibir las 4 variables operativas (Distancia, Salario, Desempeño y Clima Laboral).
  * Programación del motor de Inteligencia Artificial Explicable (XAI) mediante reglas heurísticas para traducir la predicción matemática a un diagnóstico en lenguaje natural (ej. *"Riesgo de fuga por subvaloración o desgaste en clima organizacional"*).
- **Estado:** Completado.

---

## Fase 4: Construcción del Frontend (React + Vite)

- **Objetivo:** Desarrollar la Interfaz de Usuario (SPA) y el enrutamiento protegido.
- **Actividades Realizadas:**
  * Configuración del proyecto con Vite e instalación de librerías (`axios`, `react-router-dom`, `lucide-react`, `recharts`).
  * Implementación de cabeceras de autorización para enviar el token JWT en cada petición a rutas privadas.
  * Construcción de los componentes de navegación superior y guardias de rutas privadas (`LayoutProtegido`).
  * Desarrollo del módulo Directorio General: Tabla interactiva de empleados con semáforos de desempeño y clima laboral, modal de alta y botón de baja lógica.
  * Desarrollo del módulo Control de Accesos: Formulario de alta para personal de RRHH y tabla de lectura.
- **Estado:** Completado.

---

## Fase 5: Dashboard Analítico y Reporteo

- **Objetivo:** Visualizar métricas en tiempo real y exportar resultados.
- **Actividades Realizadas:**
  * Eliminación de límites artificiales en las consultas de base de datos para que la "Muestra Analizada" refleje el 100% de la plantilla histórica.
  * Implementación de interactividad Drill-down: Creación de ventanas modales dinámicas al hacer clic en las tarjetas de "Empleados Activos" y "Bajas".
  * Integración de Recharts para generar la gráfica de barras de retención por distancia y la gráfica de líneas para el análisis de cohortes temporales.
  * Desarrollo de la función nativa en JavaScript (Blob API) para compilar y descargar reportes predictivos de la IA en formato `.txt` incluyendo las 4 variables evaluadas.
- **Estado:** Completado.

---

## Fase 6: Documentación Técnica y Cierre

- **Objetivo:** Cumplir con los entregables de ingeniería del proyecto.
- **Actividades Realizadas:**
  * Redacción del archivo `README.md` maestro en la raíz del repositorio con orden de arranque y declaración de uso de IA.
  * Elaboración del Product Requirements Document (`Documentos/PRD.md`) y definición del Producto Mínimo Viable (`Documentos/MVP.md`) con protocolo de 6 pruebas verificables.
  * Creación del Manual Técnico (`Documentos/Manual_Tecnico.md`), Guía de Instalación (`Documentos/Guia_de_instalacion.md`) y Manual de Usuario (`Documentos/Manual_Usuario.md`).
  * Ejecución de commits atómicos en Git y actualización de evidencias en la carpeta `Capturas/`.
- **Estado:** Completado.

---

## Actualización Corte 3 a Corte 5 — Ampliación del Modelo Predictivo a 4 Dimensiones (Octubre 2026)

### 1. Cambios Implementados en el Pipeline de Datos y ML
- **Poblado de Datos (`backend/seed_data.py`):** Se actualizó el generador sintético de 10,000 empleados para insertar registros en la tabla `encuestas_clima` (`EncuestaClima`), calculando el promedio entre `satisfaccion_liderazgo` y `balance_vida_trabajo` (escala 1 a 5) y correlacionando un clima laboral bajo (`< 3.0`) con un incremento en la probabilidad de renuncia.
- **Vector de Características (`backend/ml/train_model.py`):** El modelo `RandomForestClassifier` (`n_estimators=100, max_depth=5, random_state=42`) pasó de entrenar con 3 variables a entrenar con **4 variables extraídas de PostgreSQL**: `["distancia_km", "salario", "desempeno", "clima_laboral"]`.
- **Integración Punta a Punta:** Se actualizó el binario `backend/ml/modelo_rotacion.pkl`, el esquema `SimulacionRiesgo`, el alta de empleados en `contratar_empleado` (`db.add_all([historial, evaluacion, nueva_encuesta])`) en `backend/main.py` y los formularios de `frontend/src/App.jsx`.

### 2. Comparativa de Desempeño del Modelo (Línea Base vs. 3 Variables vs. 4 Variables)

En el conjunto de prueba (`2,000` registros), `1,128` casos corresponden a bajas (`clase 1`) y `872` a retenciones (`clase 0`), por lo que la **línea base (*baseline* de clase mayoritaria)** al predecir siempre «renuncia» es de **56.40%** (`1128 / 2000`).

| Versión / Iteración | Variables Predictoras (`X`) | Accuracy (`train_model.py`) | Precision (Clase `1`) | Recall (Clase `1`) | F1-Score (Clase `1`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Línea Base (ZeroR)** | Ninguna (predicción constante clase mayoritaria `1`) | **56.40%** | `0.56` | `1.00` | `0.72` |
| **Modelo v2.0 (3 variables)** | `distancia_km`, `salario`, `desempeno` | **64.10%** | `0.66` | `0.73` | `0.69` |
| **Modelo v2.1 (4 variables)** | `distancia_km`, `salario`, `desempeno`, `clima_laboral` | **67.15%** | `0.69` | `0.76` | `0.72` |

- **Observación técnica:** Al incorporar datos de `EncuestaClima` en lugar del valor constante de imputación (`3.0`), el modelo supera en `+10.75` puntos porcentuales a la línea base y en `+3.05` puntos a la versión de 3 variables, alcanzando un *recall* de `0.76` en la detección preventiva de fugas.