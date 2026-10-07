from google.cloud import firestore
from datetime import datetime

db = firestore.Client(project="gen-lang-client-0862587160")

config_data = {
    "empresa": {
        "nombre_comercial": "CORDANO PMS - ParkOps",
        "direccion": "Serrano 447, Iquique, Región de Tarapacá",
        "pais": "Chile",
        "zona_horaria": "America/Santiago"
    },
    "recinto": {
        "capacidad_total_slots": 30,
        "umbral_alerta_capacidad_baja": 6,
        "umbral_estadia_prolongada_minutos": 360
    },
    "tarifas_vigentes": {
        "id_version_activa": "TAR-2026-V1",
        "valor_minuto_clp": 40,
        "minutos_gracia_ingreso": 5,
        "multa_ticket_perdido": 10000,
        "tarifa_minima_base": 800
    },
    "impresora_pos": {
        "ancho_papel_mm": 58,
        "encabezado_ticket": "CORDANO PARKING OPS\nSerrano 447, Iquique",
        "pie_ticket": "Conserve este comprobante para su salida.",
        "imprimir_codigo_barras": True
    },
    "integraciones": {
        "google_sheets_sync_activo": True,
        "spreadsheet_id": "18uqNlTM2pvxwbXKotYCXfg3ibI3Ha5n0G6zNzZeB8zo",
        "whatsapp_notificaciones_activo": False
    },
    "seguridad_caja": {
        "cierre_ciego_estricto": True,
        "tolerancia_descuadre_clp": 1000,
        "requiere_pin_supervisor_anulacion": True
    },
    "ultima_actualizacion": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
}

db.collection("Settings").document("global_config").set(config_data)
print("✅ Configuración global de Ajustes guardada exitosamente en Firestore (Settings/global_config).")
