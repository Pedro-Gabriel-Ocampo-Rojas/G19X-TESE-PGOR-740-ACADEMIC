import os
from dotenv import load_dotenv
import bcrypt
import jwt
from datetime import datetime, timedelta

# Carga las variables del archivo .env
load_dotenv()

# Lee la clave desde el .env sin valor de respaldo
CLAVE_SECRETA = os.getenv("JWT_SECRET_KEY")

# Lanza un error claro si el usuario olvidó configurar la clave
if not CLAVE_SECRETA:
    raise ValueError("ERROR CRÍTICO: La variable de entorno JWT_SECRET_KEY no está configurada en el archivo .env")

ALGORITMO = "HS256"
TIEMPO_EXPIRACION_MINUTOS = 60

def verificar_password(password_plana, password_encriptada):
    """Compara la contraseña que escribe el usuario con el hash de PostgreSQL"""
    return bcrypt.checkpw(password_plana.encode('utf-8'), password_encriptada.encode('utf-8'))

def crear_token_acceso(datos: dict):
    """Genera el gafete virtual JWT con una fecha de caducidad"""
    a_codificar = datos.copy()
    expiracion = datetime.utcnow() + timedelta(minutes=TIEMPO_EXPIRACION_MINUTOS)
    a_codificar.update({"exp": expiracion})
    
    token_jwt = jwt.encode(a_codificar, CLAVE_SECRETA, algorithm=ALGORITMO)
    return token_jwt