from google.cloud import firestore

db = firestore.Client(project="gen-lang-client-0862587160")
doc_ref = db.collection("Tickets").document("TKT-TEST-CLI")
doc_ref.set({
    "id_ticket": "TKT-TEST-CLI",
    "patente_normalizada": "TEST01",
    "fecha_hora_ingreso": "2026-09-01 12:00:00",
    "fecha_hora_salida": "-",
    "duracion_total_minutos": 0,
    "monto_total_cobrado": 0,
    "estado_ticket": "In-Parking"
})
print("Ticket de prueba enviado.")
