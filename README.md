# Motor Predictivo de Rotación - Plurione (v2.1)

Sistema integral Full-Stack diseñado para la gestión de recursos humanos y el análisis predictivo de rotación de personal (*Churn Rate*). Este proyecto combina un panel administrativo seguro con un modelo de Inteligencia Artificial capaz de predecir el riesgo de fuga de los empleados con base en métricas operativas.

> **Nota:** Desarrollado como Prueba de Concepto (PoC) para el Modelo Dual - Tecnológico de Estudios Superiores de Ecatepec (TESE).

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
- **FastAPI:** API REST asíncrona.
- **PostgreSQL + SQLAlchemy:** Base de datos relacional y ORM.
- **Scikit-Learn + Pandas + Joblib:** Entrenamiento e inferencia del modelo Random Forest.
- **JWT + Bcrypt:** Autenticación y encriptación de credenciales.

---

## 2. Características Principales

- **Inteligencia Artificial Explicable (XAI):** Simulador predictivo que evalúa distancia, salario y desempeño, detallando en lenguaje humano el motivo exacto del riesgo de fuga.
- **Seguridad JWT:** Sistema perimetral cerrado con autenticación basada en JSON Web Tokens.
- **Control de Accesos (Multi-Admin):** Módulo interno para dar de alta a nuevos miembros del equipo de Recursos Humanos.
- **Directorio General y CRUD:** Gestión ininterrumpida de la plantilla con borrado lógico para preservar la integridad del histórico analítico.
- **Dashboard Analítico con Drill-Down:** Exploración de datos interactiva, modales de visualización y análisis de tendencias de retención.
- **Exportación de Datos:** Generación en tiempo real de reportes de diagnóstico en formato TXT.

---

## 3. Guía de Instalación y Orden de Arranque

Para ejecutar este proyecto de forma local, sigue estos pasos en estricto orden:

1. **Configuración de Base de Datos:**
   Crea una base de datos vacía en PostgreSQL llamada exactamente `PluriOne_db`.

2. **Variables de Entorno:**
   Dentro de la carpeta `backend/`, copia el archivo `.env.example`, renómbralo a `.env` y actualiza las credenciales (`DATABASE_URL` y `JWT_SECRET_KEY`) con tus datos locales.

3. **Inicialización del Backend (Ejecutar en este orden exacto):**
   Abre una terminal en la carpeta `backend/` y ejecuta:
   
   ```bash
   # Activar entorno virtual e instalar dependencias
   python -m venv venv
   source venv/Scripts/activate  # En Windows
   pip install -r requirements.txt
   
   # 1. Crear la estructura de tablas en la base de datos
   python init_db.py
   
   # 2. Poblar la base de datos con información sintética
   python seed_data.py
   
   # 3. Entrenar y exportar el modelo de Machine Learning
   python ml/train_model.py
   
   # 4. Generar credenciales de Administrador por defecto
   python crear_admin.py
   
   # 5. Levantar el servidor backend
   uvicorn main:app --reload
4. **Inicialización del Frontend:**
   Abre otra terminal en la carpeta `frontend/` y ejecuta:
   
   ```bash
   npm install
   npm run dev
   ```
   > El servidor estará disponible en: [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

### Primer Acceso

Para generar el usuario maestro inicial de la plataforma, ejecuta el siguiente script desde la carpeta `backend` con el servidor apagado:

```bash
python crear_admin.py
```

---

## Autor

- **Pedro Gabriel Ocampo Rojas**  
  *Ingeniería en Sistemas Computacionales*