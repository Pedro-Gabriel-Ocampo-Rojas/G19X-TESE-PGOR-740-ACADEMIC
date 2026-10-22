import asyncio
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os
import sys

# Agregamos la carpeta 'backend' al path para poder importar nuestra base de datos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import SessionLocal
from models import Empleado, HistorialSalario, EvaluacionDesempeno, EncuestaClima 
from sqlalchemy.future import select

async def extraer_datos():
    async with SessionLocal() as db:
        # Extraemos las tablas a memoria
        empleados = (await db.execute(select(Empleado))).scalars().all()
        salarios = (await db.execute(select(HistorialSalario))).scalars().all()
        evaluaciones = (await db.execute(select(EvaluacionDesempeno))).scalars().all()
        climas = (await db.execute(select(EncuestaClima))).scalars().all()
        return empleados, salarios, evaluaciones, climas

def entrenar_modelo():
    print("1. Extrayendo datos históricos de PostgreSQL...")
    empleados, salarios, evaluaciones, climas = asyncio.run(extraer_datos())
    
    # FORZAMOS la creación de columnas por si alguna tabla está vacía
    df_emp = pd.DataFrame([{
        "id": e.id, 
        "distancia_km": e.distancia_oficina_km, 
        "renuncio": 0 if e.estado_activo else 1 
    } for e in empleados], columns=["id", "distancia_km", "renuncio"])
    
    df_sal = pd.DataFrame([{"id": s.empleado_id, "salario": s.monto_mensual} for s in salarios], columns=["id", "salario"])
    
    df_eval = pd.DataFrame([{"id": ev.empleado_id, "desempeno": ev.puntuacion_kpi} for ev in evaluaciones], columns=["id", "desempeno"])
    
    df_clima = pd.DataFrame([{
        "id": c.empleado_id, 
        "clima_laboral": ((c.satisfaccion_liderazgo or 3) + (c.balance_vida_trabajo or 3)) / 2.0
    } for c in climas], columns=["id", "clima_laboral"])
    
    print("2. Construyendo el Vector de Características...")
    # Unimos todas las tablas usando 'left join'
    df_completo = df_emp.merge(df_sal, on="id", how="left")\
                        .merge(df_eval, on="id", how="left")\
                        .merge(df_clima, on="id", how="left")
    
    # Rellenamos huecos por si a algún empleado le falta una evaluación
    df_completo.fillna({
        "salario": 20000.0,
        "desempeno": 3.0,
        "clima_laboral": 3.0
    }, inplace=True)
    
    # Definimos variables predictoras (ahora con 4 dimensiones)
    X = df_completo[["distancia_km", "salario", "desempeno", "clima_laboral"]]
    y = df_completo["renuncio"]
    
    # Dividimos los datos
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("3. Entrenando el algoritmo Random Forest (con nueva métrica de clima)...")
    modelo = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
    modelo.fit(X_train, y_train)
    
    print("4. Evaluando el modelo...")
    predicciones = modelo.predict(X_test)
    precision = accuracy_score(y_test, predicciones)
    
    print(f"\n>>> ¡Entrenamiento Exitoso! Precisión del modelo: {precision * 100:.2f}% <<<")
    print("\nReporte de Clasificación:")
    print(classification_report(y_test, predicciones))
    
    # Guardamos el modelo
    ruta_guardado = os.path.join(os.path.dirname(__file__), "modelo_rotacion.pkl")
    joblib.dump(modelo, ruta_guardado)
    print(f"\n[OK] Cerebro de IA guardado en: {ruta_guardado}")

if __name__ == "__main__":
    entrenar_modelo()