# Guía Técnica Detallada de Instalación y Despliegue Local

**Sistema:** PluriOne V2.1 — Motor Predictivo de Rotación

## Datos del Documento

* **Autor:** Pedro Gabriel Ocampo Rojas
* **Institución:** Tecnológico de Estudios Superiores de Ecatepec (TESE) / TODO Academy
* **Fecha de Emisión:** Octubre 2026

---

## Paso 1: Validación de Prerrequisitos del Sistema

Antes de descomprimir el código, abra una terminal (PowerShell o CMD) y ejecute los siguientes comandos para verificar que cuenta con el software necesario:

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

1. Localice el archivo comprimido entregado (ej. `PluriOne_CodigoFuente_PedroOcampo.zip`).
2. Haga clic derecho sobre el archivo y seleccione **"Extraer todo..."**.
3. Extraiga el contenido en una ruta accesible, por ejemplo: `C:\Proyectos\PluriOne`.
4. A partir de este momento, todas las instrucciones se ejecutarán tomando esta carpeta extraída como la **"Ruta Raíz"**.

---

## Paso 3: Configuración Exacta de la Base de Datos (PostgreSQL)

1. Abra pgAdmin 4 o su gestor de bases de datos preferido (DBeaver, DataGrip).
2. Autentíquese en su servidor local (`localhost`).
3. Haga clic derecho en **"Databases"** > **"Create"** > **"Database..."**.
4. En el campo Database, escriba exactamente: `PluriOne_db`.
5. Guarde los cambios.

### Vinculación en el Código
* Abra el archivo `backend/database.py` con un editor de texto o código.
* Localice la variable `SQLALCHEMY_DATABASE_URL` (alrededor de la línea 7).
* El formato por defecto es:
  ```python
  postgresql+asyncpg://postgres:admin@localhost/PluriOne_db
  ```
* Si su usuario de PostgreSQL no es `postgres` o su contraseña no es `admin`, **debe cambiar esos valores** en esa línea de código y guardar el archivo.

---

## Paso 4: Instalación y Despliegue del Backend (API & Machine Learning)

1. Abra una terminal de PowerShell como Administrador.
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

6. Instale las librerías requeridas (FastAPI, Scikit-Learn, Pandas, etc.):
   ```powershell
   pip install -r requirements.txt
   ```

7. **Migración y creación de datos semilla:**
   ```powershell
   python crear_admin.py
   ```
   * Este paso leerá las tablas y las creará en PostgreSQL.
   * Creará el usuario: `admin@plurione.com` con privilegios de superadministrador.

8. Encienda el motor del backend:
   ```powershell
   uvicorn main:app --reload
   ```
   * Verá un mensaje indicando: `Uvicorn running on http://127.0.0.1:8000`.
   * **Deje esta terminal abierta y minimizada.**

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
   *(Este proceso descargará la carpeta `node_modules`, puede tardar uno o dos minutos).*

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
2. Escriba en la barra de direcciones: [http://localhost:5173](http://localhost:5173)
3. En la pantalla de login, ingrese las credenciales predeterminadas:
   * **Correo Corporativo:** `admin@plurione.com`
   * **Contraseña Temporal:** *(La definida en `crear_admin.py`, ej. `admin123`)*
4. Presione **"Iniciar Sesión"**.

---

## Solución de Problemas Comunes (Troubleshooting)

* **Error:** `"ModuleNotFoundError: No module named 'fastapi'"`  
  * **Causa:** El entorno virtual no está activado.  
  * **Solución:** Ejecute `.\venv\Scripts\Activate.ps1` antes del comando `uvicorn`.

* **Error:** `"ConnectionRefusedError"` al intentar el Login en la web.  
  * **Causa:** El backend no está encendido o el motor PostgreSQL está detenido.  
  * **Solución:** Revise la terminal del backend y verifique que la URL en `database.py` sea correcta.

* **Error en Frontend:** `"Port 5173 is in use"`  
  * **Causa:** Ya hay otra instancia de Vite en ejecución.  
  * **Solución:** Cierre otras terminales o acceda a la URL alternativa asignada en consola (ej. `http://localhost:5174`).