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
- **Axios / Fetch API:** Consumo de API e intercepción de tokens.
- **Lucide React:** Sistema de iconografía UI/UX.

### Backend (Server-Side & ML)
- **FastAPI + Uvicorn:** API REST asíncrona de alto rendimiento.
- **PostgreSQL + SQLAlchemy (`asyncpg`):** Base de datos relacional (`PluriOne_db`) y ORM asíncrono.
- **Scikit-Learn + Pandas + Joblib:** Entrenamiento e inferencia del modelo *Random Forest Classifier*.
- **PyJWT + bcrypt + python-dotenv:** Autenticación mediante tokens JWT, hashing directo de contraseñas con sal criptográfica y aislamiento de variables de entorno.

---

## 2. Características Principales

- **Inteligencia Artificial Explicable (XAI):** Simulador predictivo que evalúa 4 dimensiones clave (**distancia a la oficina, salario mensual, evaluación de desempeño y clima laboral**), detallando en lenguaje natural el motivo exacto del riesgo de fuga o estabilidad.
- **Seguridad JWT y `bcrypt`:** Sistema perimetral cerrado con autenticación basada en JSON Web Tokens (`HS256`) y encriptación irreversible de credenciales sin valores por defecto en el código.
- **Control de Accesos (Multi-Admin):** Módulo interno para gestionar y dar de alta a nuevos administradores de Recursos Humanos.
- **Directorio General y Baja Lógica:** Gestión de la plantilla con borrado lógico (*soft delete*) para preservar la integridad del histórico analítico requerido por el modelo de Machine Learning.
- **Dashboard Analítico con Drill-Down:** Exploración de datos interactiva, modales de visualización y análisis de tendencias de retención.
- **Exportación de Diagnóstico:** Generación en tiempo real de reportes de dictamen predictivo en formato `.txt`.

---

## 3. Guía de Instalación y Orden de Arranque

Para ejecutar este proyecto de forma local, sigue estos pasos en estricto orden:

### 3.1. Configuración de Base de Datos
Crea una base de datos vacía en PostgreSQL llamada exactamente `PluriOne_db`.

### 3.2. Variables de Entorno
Dentro de la carpeta `backend/`, copia el archivo `.env.example`, renómbralo a `.env` y configura tus credenciales locales (`DATABASE_URL` con esquema `postgresql+asyncpg://`, `JWT_SECRET_KEY` y `ADMIN_PASSWORD_INICIAL`).

### 3.3. Inicialización del Backend (Ejecutar en este orden exacto)
Abre una terminal en la carpeta `backend/` y ejecuta:

```bash
# Activar entorno virtual e instalar dependencias
python -m venv venv
.\venv\Scripts\activate      # En Windows (PowerShell/CMD)
# source venv/Scripts/activate  # En Git Bash
pip install -r requirements.txt

# 1. Crear la estructura de tablas en la base de datos PluriOne_db
python init_db.py

# 2. Poblar la base de datos con información sintética inicial
python seed_data.py

# 3. Entrenar y exportar el modelo de Machine Learning (Random Forest)
python ml/train_model.py

# 4. Generar credenciales de Administrador inicial (lee ADMIN_PASSWORD_INICIAL de .env)
python crear_admin.py

# 5. Levantar el servidor backend
uvicorn main:app --reload
```

> **Servidor Backend disponible en:** `http://127.0.0.1:8000`  
> **Documentación interactiva (Swagger UI):** `http://127.0.0.1:8000/docs`

### 3.4. Inicialización del Frontend
Abre otra terminal en la carpeta `frontend/` y ejecuta:

```bash
npm install
npm run dev
```

> **Aplicación Web (Frontend) disponible en:** `http://localhost:5173`

---

## 4. Documentación del Proyecto

Toda la documentación de ingeniería de software se encuentra en el directorio [`Documentos/`](./Documentos):

- [`MVP.md`](./Documentos/MVP.md): Definición del Producto Mínimo Viable (funciones en alcance, exclusiones y protocolo de demostración).
- [`PRD.md`](./Documentos/PRD.md): Documento de Requerimientos del Producto.
- [`Manual_Tecnico.md`](./Documentos/Manual_Tecnico.md): Arquitectura, esquema relacional y especificaciones técnicas.
- [`Guia_de_instalacion.md`](./Documentos/Guia_de_instalacion.md): Manual detallado de configuración del entorno.
- [`Bitacora.md`](./Documentos/Bitacora.md): Registro de avances y seguimiento del proyecto.

---

## 5. Nota de Transparencia (Uso de IA Generativa)

En cumplimiento con las buenas prácticas académicas y de ingeniería, se declara el uso de **Google Gemini** como asistente de programación y consulta técnica para la depuración de código, estructuración de pruebas y redacción de documentación durante el desarrollo de este proyecto.

---

## Autor

- **Pedro Gabriel Ocampo Rojas**  
  *Ingeniería en Sistemas Computacionales — TESE*