import os
from dotenv import load_dotenv
import asyncio
import bcrypt
from database import engine, SessionLocal
from models import Base, UsuarioAdmin
from sqlalchemy.future import select

load_dotenv()

async def instalar_admin():
    # 1. Le decimos a PostgreSQL que cree la nueva tabla si no existe
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 2. Insertamos la cuenta administrativa
    async with SessionLocal() as db:
        # Verificamos que no esté duplicado
        resultado = await db.execute(select(UsuarioAdmin).filter(UsuarioAdmin.email == "admin@plurione.com"))
        if resultado.scalars().first():
            print("El usuario ya existe.")
            return

        # Leemos la contraseña desde las variables de entorno
        contrasena_real = os.getenv("ADMIN_PASSWORD_INICIAL")
        
        if not contrasena_real:
             print("ERROR: Falta la variable ADMIN_PASSWORD_INICIAL en tu archivo .env")
             return
         
        # Usamos bcrypt directamente para encriptar
        sal_criptografica = bcrypt.gensalt()
        contrasena_encriptada = bcrypt.hashpw(contrasena_real.encode('utf-8'), sal_criptografica).decode('utf-8')

        nuevo_admin = UsuarioAdmin(
            email="admin@plurione.com",
            hashed_password=contrasena_encriptada,
            nombre_completo="elPeddi"
        )
        
        db.add(nuevo_admin)
        await db.commit()
        print("✅ ¡Usuario Administrador creado exitosamente!")
        print("Correo: admin@plurione.com")
        print("Clave secreta guardada como hash irreconocible en PostgreSQL.")

if __name__ == "__main__":
    asyncio.run(instalar_admin())