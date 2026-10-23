# Motor Predictivo de Rotación - PluriOne (v2.1)

Sistema integral Full-Stack diseñado para la gestión de recursos humanos y el análisis predictivo de rotación de personal (*Churn Rate*). Este proyecto combina un panel administrativo seguro con un modelo de Inteligencia Artificial capaz de predecir el riesgo de fuga de los empleados con base en métricas operativas y de clima organizacional.

> **Nota:** Desarrollado como Proyecto Específico para el Modelo de Educación Dual — Tecnológico de Estudios Superiores de Ecatepec (TESE).

---

## 1. Arquitectura y Stack Tecnológico

El proyecto está dividido en dos servicios principales:

### Frontend (Client-Side)
- **React.js (Vite)**
- **React Router DOM:** Navegación protegida y enrutamiento.
- **Recharts:** Visualización de datos y análisis de cohortes.
- **Axios:** Consumo de API e intercepción de tokens.
- **Lucide React:** Sistema de iconografía UI/UX.

### Backend (Server-Side & ML)
- **FastAPI + Uvicorn:** API REST asíncrona.
- **PostgreSQL + SQLAlchemy (`asyncpg`):** Base de datos relacional (`PluriOne_db`) y ORM asíncrono.
- **Scikit-Learn + Pandas + Joblib:** Entrenamiento e inferencia del modelo *Random Forest Classifier*.
- **PyJWT + Bcrypt + python-dotenv:** Autenticación con tokens JWT, encriptación de credenciales y carga de variables de entorno.

---

## 2. Características Principales

- **Inteligencia Artificial Explicable (XAI):** Simulador predictivo que evalúa **cuatro variables** (**distancia a la oficina, salario mensual, evaluación de desempeño y clima laboral**), detallando en lenguaje humano el motivo exacto del riesgo de fuga o estabilidad.
- **Seguridad JWT y Bcrypt:** Sistema perimetral cerrado con autenticación basada en JSON Web Tokens y hashing directo de contraseñas.
- **Control de Accesos (Multi-Admin):** Módulo interno para dar de alta a nuevos miembros del equipo de Recursos Humanos.
- **Directorio General y CRUD:** Gestión de la plantilla con borrado lógico (*soft delete*) para preservar la integridad del histórico analítico.
- **Dashboard Analítico con Drill-Down:** Exploración de datos interactiva, modales de visualización y análisis de tendencias de retención.
- **Exportación de Datos:** Generación en tiempo real de reportes de diagnóstico en formato `.txt`.

---

## 3. Guía de Instalación y Orden de Arranque

Para ejecutar este proyecto de forma local, sigue estos pasos en estricto orden:

1. **Configuración de Base de Datos:**
   Crea una base de datos vacía en PostgreSQL llamada exactamente `PluriOne_db`.

2. **Variables de Entorno:**
   Dentro de la carpeta `backend/`, copia el archivo `.env.example`, renómbralo a `.env` y actualiza las credenciales (`DATABASE_URL`, `JWT_SECRET_KEY` y `ADMIN_PASSWORD_INICIAL`) con tus datos locales.

3. **Inicialización del Backend (Ejecutar en este orden exacto):**
   Abre una terminal en la carpeta `backend/` y ejecuta:

   ```bash
   # Activar entorno virtual e instalar dependencias
   python -m venv venv
   .\venv\Scripts\activate      # En Windows (PowerShell)
   pip install -r requirements.txt

   # 1. Crear la estructura de tablas en la base de datos
   python init_db.py

   # 2. Poblar la base de datos con información sintética (10,000 perfiles con clima laboral)
   python seed_data.py

   # 3. Entrenar y exportar el modelo de Machine Learning (4 variables)
   python ml/train_model.py

   # 4. Generar credenciales de Administrador inicial
   python crear_admin.py

   # 5. Levantar el servidor backend
   uvicorn main:app --reload
   ```
   > El servidor Backend estará disponible en: `http://127.0.0.1:8000` (Swagger UI en `http://127.0.0.1:8000/docs`).

4. **Inicialización del Frontend:**
   Abre otra terminal en la carpeta `frontend/` y ejecuta:

   ```bash
   npm install
   npm run dev
   ```
   > La aplicación Frontend estará disponible en: `http://localhost:5173`

---

## 4. Documentación y Evidencias

- [`Documentos/MVP.md`](./Documentos/MVP.md): Definición del Producto Mínimo Viable y protocolo de las 6 pruebas verificables.
- [`Documentos/PRD.md`](./Documentos/PRD.md): Documento de Requerimientos del Producto.
- [`Documentos/Manual_Tecnico.md`](./Documentos/Manual_Tecnico.md): Arquitectura y especificaciones técnicas.
- [`Documentos/Guia_de_instalacion.md`](./Documentos/Guia_de_instalacion.md): Guía detallada de instalación.
- [`Documentos/Bitacora.md`](./Documentos/Bitacora.md): Bitácora de avances y métricas de entrenamiento del modelo.
- [`Capturas/`](./Capturas): Evidencias visuales de ejecución de las 6 pruebas del MVP.

---

## 5. Declaración de Uso de Inteligencia Artificial

Para el desarrollo, depuración, refactorización de código y estructuración documental de este proyecto se utilizó **Google Gemini** como asistente técnico de programación, validando e integrando manualmente cada cambio en el entorno local.

---

## Autor

- **Pedro Gabriel Ocampo Rojas**  
  *Ingeniería en Sistemas Computacionales — TESE*