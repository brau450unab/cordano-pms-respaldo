from google.cloud import firestore
from datetime import datetime

db = firestore.Client(project="gen-lang-client-0862587160")

usuarios = [
    {
        "id_usuario": "USR-ADM-01",
        "nombre_completo": "Supervisor 1 (Dueño)",
        "email": "dueno1@cordano.cl",
        "rol": "SUPERVISOR",
        "pin_autorizacion": "1234",
        "activo": True,
        "fecha_creacion": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "permisos": {
            "ver_dashboard_financiero": True,
            "ver_monitoreo_vivo": True,
            "gestionar_tareas_kanban": True,
            "autorizar_anulaciones": True,
            "operar_pos": False
        }
    },
    {
        "id_usuario": "USR-ADM-02",
        "nombre_completo": "Supervisor 2 (Dueño)",
        "email": "dueno2@cordano.cl",
        "rol": "SUPERVISOR",
        "pin_autorizacion": "5678",
        "activo": True,
        "fecha_creacion": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "permisos": {
            "ver_dashboard_financiero": True,
            "ver_monitoreo_vivo": True,
            "gestionar_tareas_kanban": True,
            "autorizar_anulaciones": True,
            "operar_pos": False
        }
    },
    {
        "id_usuario": "USR-OP-01",
        "nombre_completo": "Operador Turno Mañana",
        "email": "operador1@cordano.cl",
        "rol": "OPERATOR",
        "pin_autorizacion": "",
        "activo": True,
        "fecha_creacion": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "permisos": {
            "ver_dashboard_financiero": False,
            "ver_monitoreo_vivo": False,
            "gestionar_tareas_kanban": False,
            "autorizar_anulaciones": False,
            "operar_pos": True
        }
    },
    {
        "id_usuario": "USR-OP-02",
        "nombre_completo": "Operador Turno Tarde",
        "email": "operador2@cordano.cl",
        "rol": "OPERATOR",
        "pin_autorizacion": "",
        "activo": True,
        "fecha_creacion": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "permisos": {
            "ver_dashboard_financiero": False,
            "ver_monitoreo_vivo": False,
            "gestionar_tareas_kanban": False,
            "autorizar_anulaciones": False,
            "operar_pos": True
        }
    }
]

tareas = [
    {
        "id_tarea": "TSK-001",
        "titulo": "Revisar stock de papel térmico",
        "descripcion": "Verificar que la impresora del POS tenga al menos 2 rollos de repuesto.",
        "estado": "TODO",
        "prioridad": "ALTA",
        "creado_por": "USR-ADM-01",
        "asignado_a": "USR-OP-01",
        "fecha_creacion": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "fecha_completada": "-"
    },
    {
        "id_tarea": "TSK-002",
        "titulo": "Limpieza y despeje de accesos",
        "descripcion": "Verificar visibilidad de letreros y barreras de entrada.",
        "estado": "IN_PROGRESS",
        "prioridad": "MEDIA",
        "creado_por": "USR-ADM-01",
        "asignado_a": "USR-OP-01",
        "fecha_creacion": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "fecha_completada": "-"
    }
]

for u in usuarios:
    db.collection("Users").document(u["id_usuario"]).set(u)
    print(f"✅ Usuario {u['id_usuario']} ({u['rol']}) creado.")

for t in tareas:
    db.collection("Tasks").document(t["id_tarea"]).set(t)
    print(f"✅ Tarea {t['id_tarea']} creada.")

print("🚀 Base de datos inicializada correctamente en Firestore.")
