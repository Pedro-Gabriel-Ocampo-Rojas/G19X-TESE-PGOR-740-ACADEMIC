# Guía Técnica Detallada de Instalación y Despliegue Local

**Sistema:** PluriOne V2.1 — Motor Predictivo de Rotación

## Datos del Documento

- **Autor:** Pedro Gabriel Ocampo Rojas
- **Institución:** Tecnológico de Estudios Superiores de Ecatepec (TESE)
- **Fecha de Emisión:** Octubre 2026

---

## Paso 1: Validación de Prerrequisitos del Sistema

Antes de clonar o descomprimir el código, abra una terminal (PowerShell o CMD) y ejecute los siguientes comandos para verificar que cuenta con el software necesario:

1. **Verificar Python** (Debe ser versión 3.10 o superior):
   ```bash
   python --version
   ```

2. **Verificar Node.js** (Debe ser versión 18 o superior):
   ```bash
   node -v
   ```

3. **Verificar PostgreSQL:**  
   Asegúrese de que el servicio de PostgreSQL esté en ejecución en su sistema (normalmente en el puerto `5432`).

---

## Paso 2: Preparación del Código Fuente

1. Clone el repositorio o extraiga el archivo comprimido del proyecto en una ruta local accesible, por ejemplo: `C:\Proyectos\PluriOne`.
2. A partir de este momento, todas las instrucciones se ejecutarán tomando esta carpeta como la **"Ruta Raíz"**.

---

## Paso 3: Configuración de la Base de Datos y Variables de Entorno (`.env`)

### 3.1 Creación de la Base de Datos en PostgreSQL
1. Abra pgAdmin 4 o su gestor de bases de datos preferido (DBeaver, DataGrip, `psql`).
2. Autentíquese en su servidor local (`localhost`).
3. Haga clic derecho en **"Databases"** > **"Create"** > **"Database..."**.
4. En el campo Database, escriba exactamente: `PluriOne_db` (respetando mayúsculas y minúsculas).
5. Guarde los cambios.

### 3.2 Configuración del Archivo `backend/.env`
Por seguridad, el sistema no almacena credenciales ni llaves criptográficas dentro del código fuente (`backend/database.py` y `backend/security.py` leen exclusivamente variables de entorno):

1. Ingrese a la carpeta `backend/`.
2. Localice el archivo de plantilla `.env.example`, cópielo en esa misma carpeta y renómbrelo a **`.env`**.
3. Abra el archivo `backend/.env` en su editor de texto y configure las variables con sus datos locales:
   ```ini
   DATABASE_URL=postgresql+asyncpg://postgres:TU_PASSWORD_POSTGRES@localhost:5432/PluriOne_db
   JWT_SECRET_KEY=coloca_aqui_una_llave_secreta_segura_para_jwt
   ADMIN_PASSWORD_INICIAL=coloca_aqui_la_contrasena_del_admin
   DB_ECHO=False
   ```
   *(Nota: `DB_ECHO` es `False` por omisión en `backend/database.py` para evitar imprimir en consola cada sentencia SQL durante la carga masiva de `seed_data.py`).*

---

## Paso 4: Instalación y Despliegue del Backend (API & Machine Learning)

1. Abra una terminal de PowerShell.
2. Navegue hasta la carpeta del backend:
   ```powershell
   cd C:\Ruta\Hacia\El\Proyecto\PluriOne\backend
   ```

3. Si está en Windows, permita la ejecución de scripts locales para poder activar el entorno virtual (solo es necesario hacerlo una vez):
   ```powershell
   Set-ExecutionPolicy Unrestricted -Scope CurrentUser
   ```
   *(Presione 'S' y Enter si le pide confirmación).*

4. Cree el entorno virtual de Python:
   ```powershell
   python -m venv venv
   ```

5. Active el entorno virtual:
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```
   *(Sabrá que funcionó si visualiza el prefijo `(venv)` al inicio de la línea de comandos).*

6. Instale las librerías requeridas con sus versiones exactas:
   ```powershell
   pip install -r requirements.txt
   ```

7. **Inicialización de Base de Datos, Semilla y Modelo ML (Ejecutar en este orden exacto):**

   ```powershell
   # 7.1 Crear la estructura de tablas relacionales en PluriOne_db
   python init_db.py

   # 7.2 Poblar la base de datos con 10,000 empleados sintéticos (salarios, desempeño y clima laboral)
   python seed_data.py

   # 7.3 Entrenar y exportar el modelo Random Forest de 4 variables (ml/modelo_rotacion.pkl)
   python ml/train_model.py

   # 7.4 Generar credenciales de Administrador inicial (lee ADMIN_PASSWORD_INICIAL desde .env)
   python crear_admin.py
   ```

   > **Aviso importante sobre `seed_data.py`:** Este script inserta 10,000 empleados ejecutando un `await db.flush()` por cada registro para obtener su `UUID` antes de insertar su salario, evaluación y encuesta de clima. Gracias a que `DB_ECHO=False` está configurado por omisión en `backend/database.py`, no se imprimen las decenas de miles de consultas SQL en la terminal, evitando cuellos de botella de E/S en consola.

8. Encienda el servidor del backend:
   ```powershell
   uvicorn main:app --reload
   ```
   * Verá un mensaje indicando: `Uvicorn running on http://127.0.0.1:8000`.
   * La documentación interactiva (Swagger UI) estará disponible en: `http://127.0.0.1:8000/docs`.
   * **Deje esta terminal abierta y en ejecución.**

---

## Paso 5: Instalación y Despliegue del Frontend (React)

1. Abra una **nueva** terminal de PowerShell (no cierre la del backend).
2. Navegue hasta la carpeta del frontend:
   ```powershell
   cd C:\Ruta\Hacia\El\Proyecto\PluriOne\frontend
   ```

3. Descargue e instale las dependencias de Node.js:
   ```powershell
   npm install
   ```

4. Encienda el servidor de desarrollo de la interfaz de usuario:
   ```powershell
   npm run dev
   ```

5. La terminal confirmará la disponibilidad del servidor con un mensaje similar a:
   ```text
   VITE v5.x.x  ready in X ms
   ➜  Local:   http://localhost:5173/
   ```

---

## Paso 6: Ingreso al Sistema (Prueba de Humo)

1. Abra su navegador web (se recomienda Google Chrome o Microsoft Edge).
2. Escriba en la barra de direcciones: `http://localhost:5173`
3. En la pantalla de login, ingrese las credenciales configuradas:
   * **Correo Corporativo:** `admin@plurione.com`
   * **Contraseña:** *(El valor que definió en la variable `ADMIN_PASSWORD_INICIAL` dentro de su archivo `backend/.env`)*
4. Presione **"Iniciar Sesión"**.

---

## Paso 7: Verificación de Instalación en Carpeta Limpia y Tiempos de Ejecución

Para comprobar la reproducibilidad del proyecto desde cero, se clonó el repositorio en una carpeta nueva e independiente (`Prueba_Instalacion_Limpia`), sin entorno virtual (`venv`), sin `node_modules` y sin archivo `.env` preexistente, siguiendo únicamente los pasos del `README.md`:

- **Qué se hizo:** Se creó el entorno virtual limpio (`python -m venv venv`), se copió `backend/.env.example` a `backend/.env` definiendo `DATABASE_URL`, `JWT_SECRET_KEY` y `ADMIN_PASSWORD_INICIAL` (manteniendo `DB_ECHO=False` por defecto), y se ejecutó en orden cada comando del backend y del frontend midiendo su duración con `Measure-Command` en PowerShell.
- **Qué pasó y cuánto tardó cada paso:**

| Paso | Comando Ejecutado | Tiempo Medido | Resultado Observado |
| :--- | :--- | :--- | :--- |
| **1. Instalación de paquetes Python** | `pip install -r requirements.txt` | **35.84 s** | Instalación completa de las dependencias exactas (`pip freeze`) sin errores ni incompatibilidades. |
| **2. Creación de tablas** | `python init_db.py` | **5.15 s** | Esquema relacional verificado y creado en `PluriOne_db`. |
| **3. Carga de semilla (10,000 empleados)** | `python seed_data.py` | **1.05 s** *(~15–25 s en inserción inicial completa sin caché)* | Con `DB_ECHO=False` por omisión en `database.py`, el `flush` de los 10,000 empleados y sus tablas hijas se ejecuta sin saturar la salida de la terminal. |
| **4. Entrenamiento del modelo ML** | `python ml/train_model.py` | **43.97 s** | Extracción asíncrona de las 4 tablas desde PostgreSQL, entrenamiento del Random Forest (`Accuracy: 67.15%`, `Precision: 0.69`, `Recall: 0.76`) y actualización de `ml/modelo_rotacion.pkl`. |
| **5. Alta de administrador inicial** | `python crear_admin.py` | **0.94 s** | Creación/verificación de la cuenta `admin@plurione.com` con contraseña encriptada mediante `bcrypt`. |
| **6. Instalación del Frontend** | `npm install` | **12.68 s** | Instalación limpia de 212 paquetes en `node_modules`, listos para levantar Vite en `http://localhost:5173`. |

---

## Solución de Problemas Comunes (Troubleshooting)

- **Error:** `"ValueError: No se encontró la variable de entorno JWT_SECRET_KEY"`  
  * **Causa:** No se ha creado el archivo `.env` dentro de la carpeta `backend/`.  
  * **Solución:** Copie `backend/.env.example` a `backend/.env` y defina las variables `DATABASE_URL`, `JWT_SECRET_KEY` y `ADMIN_PASSWORD_INICIAL`.

- **Error:** `"ModuleNotFoundError: No module named 'fastapi'"`  
  * **Causa:** El entorno virtual no está activado.  
  * **Solución:** Ejecute `.\venv\Scripts\Activate.ps1` antes de correr los scripts o `uvicorn`.

- **Error:** `"ConnectionRefusedError"` o fallo de conexión al intentar el Login.  
  * **Causa:** El backend no está encendido o las credenciales de PostgreSQL son incorrectas.  
  * **Solución:** Revise la terminal del backend y verifique que la variable `DATABASE_URL` en su archivo `backend/.env` apunte a `PluriOne_db` con su contraseña local de PostgreSQL.

- **Error en Frontend:** `"Port 5173 is in use"`  
  * **Causa:** Ya hay otra instancia de Vite en ejecución.  
  * **Solución:** Cierre otras terminales o acceda a la URL alternativa asignada en consola.