import asyncio
import random
from faker import Faker
from sqlalchemy import select, text
from database import SessionLocal
from models import (
    Departamento,
    Puesto,
    Empleado,
    HistorialSalario,
    EvaluacionDesempeno,
    EncuestaClima
)

fake = Faker('es_MX')

async def generar_datos_sinteticos():
    async with SessionLocal() as db:
        print("Limpiando registros anteriores para evitar sesgo cruzado...")
        # TRUNCATE con CASCADE borra a los empleados y sus historiales limpiecito
        await db.execute(text("TRUNCATE TABLE empleados CASCADE"))
        await db.commit()

        print("Iniciando generación de nuevos datos...")

        # 1. Crear Catálogos (Solo si están vacíos)
        deptos_nombres = ["Ventas", "Tecnología", "Operaciones", "Recursos Humanos"]
        puestos_info = [
            {"titulo": "Analista Jr.", "min": 12000, "max": 18000},
            {"titulo": "Desarrollador Mid", "min": 25000, "max": 40000},
            {"titulo": "Gerente", "min": 45000, "max": 80000}
        ]

        # Verificamos si los catálogos ya existen
        deptos_existentes = (await db.execute(select(Departamento))).scalars().all()
        if not deptos_existentes:
            db.add_all([Departamento(nombre=n, presupuesto_anual=random.randint(2, 10)*1000000) for n in deptos_nombres])
            db.add_all([Puesto(titulo=p["titulo"], rango_salarial_min=p["min"], rango_salarial_max=p["max"]) for p in puestos_info])
            await db.commit()

        depto_ids = [row[0] for row in (await db.execute(select(Departamento.id))).all()]
        puesto_ids = [row[0] for row in (await db.execute(select(Puesto.id))).all()]

        # 2. Generar 10,000 Empleados con CORRELACIÓN MATEMÁTICA (4 Dimensiones)
        print("Generando 10,000 perfiles de empleados con lógica proporcional y encuestas de clima...")
        
        for _ in range(10000):
            distancia = random.randint(2, 50)
            puesto_seleccionado = random.choice(puestos_info)
            salario = random.randint(puesto_seleccionado["min"], puesto_seleccionado["max"])
            desempeno = round(random.uniform(1.0, 5.0), 1)
            
            # Generamos las métricas de la encuesta de clima laboral (escala 1 a 5)
            satisfaccion_liderazgo = random.randint(1, 5)
            balance_vida_trabajo = random.randint(1, 5)
            clima_promedio = (satisfaccion_liderazgo + balance_vida_trabajo) / 2.0
            
            probabilidad_renuncia = 0.08 
            
            if distancia > 30: 
                probabilidad_renuncia += 0.30 
            if salario < (puesto_seleccionado["min"] + 2000): 
                probabilidad_renuncia += 0.25
            
            # Penalización proporcional por bajo desempeño
            penalizacion_desempeno = (5.0 - desempeno) * 0.08
            probabilidad_renuncia += penalizacion_desempeno

            # Impacto del Clima Laboral en la probabilidad de renuncia
            if clima_promedio < 3.0:
                probabilidad_renuncia += 0.30
            else:
                probabilidad_renuncia += (5.0 - clima_promedio) * 0.05

            sigue_activo = random.random() > probabilidad_renuncia

            nuevo_empleado = Empleado(
                departamento_id=random.choice(depto_ids),
                puesto_id=puesto_ids[puestos_info.index(puesto_seleccionado)],
                fecha_contratacion=fake.date_between(start_date='-5y', end_date='-1y'),
                distancia_oficina_km=distancia,
                estado_activo=sigue_activo
            )
            db.add(nuevo_empleado)
            await db.flush()

            db.add_all([
                HistorialSalario(
                    empleado_id=nuevo_empleado.id,
                    monto_mensual=salario,
                    fecha_cambio=nuevo_empleado.fecha_contratacion,
                    motivo="Contratación Inicial"
                ),
                EvaluacionDesempeno(
                    empleado_id=nuevo_empleado.id,
                    fecha_evaluacion=fake.date_between(start_date='-1y', end_date='today'),
                    puntuacion_kpi=desempeno,
                    cumplimiento_metas=desempeno * 20
                ),
                EncuestaClima(
                    empleado_id=nuevo_empleado.id,
                    fecha_encuesta=fake.date_between(start_date='-1y', end_date='today'),
                    satisfaccion_liderazgo=satisfaccion_liderazgo,
                    balance_vida_trabajo=balance_vida_trabajo
                )
            ])

        await db.commit()
        print("¡Dataset sintético de 10,000 empleados con encuestas de clima inyectado exitosamente!")

if __name__ == "__main__":
    asyncio.run(generar_datos_sinteticos())