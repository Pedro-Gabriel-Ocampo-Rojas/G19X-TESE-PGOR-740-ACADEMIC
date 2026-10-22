# Product Requirements Document (PRD)

**PluriOne V2.1 — Motor Predictivo de Rotación de Personal**  
* **Autor:** Pedro Gabriel Ocampo Rojas  
* **Fecha:** Octubre 2026  
* **Proyecto:** Prueba de Concepto (PoC) - Modelo Dual TESE / TODO Academy  

---

## 1. Resumen Ejecutivo (Executive Summary)

El índice de rotación de personal (*Churn Rate*) representa uno de los mayores costos operativos y organizacionales para las empresas contemporáneas. PluriOne nace como una plataforma SaaS (*Software as a Service*) orientada a los departamentos de Recursos Humanos.

La solución integra algoritmos de Inteligencia Artificial y Machine Learning para predecir el riesgo de fuga de talento basándose en variables operativas, económicas y demográficas. Esto permite a las direcciones de capital humano e instructores tomar decisiones proactivas y fundamentadas en datos para la retención efectiva del personal.

---

## 2. Objetivos del Producto

* **Predecir:** Identificar proactivamente qué empleados presentan un alto riesgo de renuncia mediante un modelo supervisado de Random Forest.
* **Explicar (XAI):** Proporcionar transparencia algorítmica. El sistema no solo entrega un porcentaje de probabilidad, sino que provee un diagnóstico en lenguaje natural con las causas raíz (ej. salario bajo en relación al alto desempeño y gran distancia de traslado).
* **Gestionar:** Ofrecer un panel de administración CRUD seguro para la gestión integral de la plantilla laboral, conservando el historial de bajas para reentrenar y nutrir continuamente la IA.
* **Asegurar:** Garantizar la confidencialidad, integridad y disponibilidad de la información corporativa sensible mediante autenticación robusta de múltiples capas (JWT y encriptación Bcrypt).

---

## 3. Público Objetivo (User Personas)

| Rol / Persona | Necesidades Principales | Caso de Uso en PluriOne |
| :--- | :--- | :--- |
| **Gerentes de Recursos Humanos** | Visualizar métricas globales de la empresa para reportes ejecutivos. | Consulta de KPIs de rotación, balance contrataciones vs. bajas y análisis de cohortes. |
| **Analistas de Retención** | Evaluar perfiles específicos en riesgo y tomar medidas preventivas. | Uso del simulador predictivo para evaluar ajustes salariales o modalidad Home Office. |
| **Administradores de TI** | Controlar el acceso seguro a la plataforma y gestionar permisos. | Alta y baja de usuarios directivos en el panel de control de accesos. |

---

## 4. Alcance del MVP (Versión 2.1)

El Producto Mínimo Viable (MVP) entregado en esta fase consta de cinco módulos integrados:

* **Módulo de Autenticación:** Inicio de sesión protegido. Prevención de accesos no autorizados mediante interceptores en frontend y guardias de ruta.
* **Dashboard Analítico con Drill-down:** KPIs interactivos (Muestra analizada, Activos, Bajas, Tasa de rotación), gráfica de barras (Distancia vs. Retención) y gráfica de líneas (Análisis de cohortes).
* **Motor Predictivo con Exportación:** Simulador de IA con variables de entrada (Salario, Distancia, Desempeño). Devuelve nivel de alerta, probabilidad estimada y diagnóstico detallado, con capacidad de exportar los resultados a TXT.
* **Directorio General y CRUD:** Tabla de visualización masiva, registro de nuevas contrataciones y borrado lógico de empleados (pasan a estado inactivo para preservar métricas históricas).
* **Control de Accesos:** Panel restringido para la creación y administración de nuevos usuarios con rol de administrador.

---

## 5. Requisitos Funcionales

* **RF-01:** El sistema debe permitir a un usuario autenticarse de forma segura mediante credenciales de correo electrónico y contraseña.
* **RF-02:** El sistema debe permitir registrar la contratación de un nuevo empleado, asignándole salario, datos operativos y evaluación inicial.
* **RF-03:** El sistema debe permitir el borrado lógico (baja) de un empleado activo mediante una acción directa de un solo clic.
* **RF-04:** El simulador de IA debe admitir el ingreso de distancia, salario y nivel de desempeño para retornar el nivel de riesgo y la justificación textual estructurada.
* **RF-05:** El sistema debe permitir la descarga del reporte predictivo individual en un archivo de texto plano (`.txt`).
* **RF-06:** Los usuarios administradores deben poder crear cuentas para otros administradores desde un panel de acceso protegido.

---

## 6. Requisitos No Funcionales

* **Seguridad:** Las contraseñas deben ser hasheadas con el algoritmo Bcrypt. Todas las peticiones a la API backend deben requerir un token JWT tipo Bearer en la cabecera HTTP.
* **Escalabilidad:** El backend construido en FastAPI debe ser completamente asíncrono. La capa de persistencia debe utilizar una base de datos relacional PostgreSQL.
* **Desempeño:** La interfaz gráfica en React debe operar como una *Single Page Application* (SPA), evitando recargas completas del navegador al cambiar de vistas.
* **Disponibilidad del Modelo:** El modelo Scikit-Learn comprimido (`.pkl`) debe cargarse en memoria RAM desde el arranque del servidor para ofrecer predicciones en tiempo real sin latencia de disco.

---

## 7. Tecnologías Utilizadas (Stack Tecnológico)

* **Frontend:** React, React Router, Recharts, Axios, Lucide React, Vite.
* **Backend:** Python, FastAPI, SQLAlchemy, PyJWT, Bcrypt.
* **Base de Datos:** PostgreSQL.
* **Data Science / Machine Learning:** Scikit-Learn (Random Forest Classifier), Pandas, Joblib, NumPy.

---

## 8. Criterios de Éxito

1. **Sincronización en tiempo real:** El sistema procesa altas y bajas reflejándolas en los gráficos del dashboard inmediatamente, sin requerir paginación bloqueante o recargas manuales.
2. **Coherencia predictiva:** El motor detecta combinaciones de alto riesgo y devuelve un diagnóstico explicable, coherente y directamente accionable por el equipo de RRHH.
3. **Protección de endpoints:** Las rutas privadas del backend rechazan cualquier petición no autorizada respondiendo con código de estado `HTTP 401 Unauthorized`.