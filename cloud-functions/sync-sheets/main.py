import functions_framework
import gspread
from google.auth import default
from google.events.cloud import firestore

SPREADSHEET_ID = "18uqNlTM2pvxwbXKotYCXfg3ibI3Ha5n0G6zNzZeB8zo"

@functions_framework.cloud_event
def sync_ticket_to_sheets(cloud_event):
    # Decodificar el formato binario Protobuf oficial de Firestore
    firestore_payload = firestore.DocumentEventData()
    firestore_payload._pb.ParseFromString(cloud_event.data)
    
    # Obtener el documento modificado
    document = firestore_payload.value
    if not document or not document.fields:
        return
        
    fields = document.fields

    # Extraer campos de manera segura manejando los tipos del Protobuf
    ticket_id = fields.get("id_ticket").string_value if "id_ticket" in fields else ""
    patente = fields.get("patente_normalizada").string_value if "patente_normalizada" in fields else ""
    ingreso = fields.get("fecha_hora_ingreso").string_value if "fecha_hora_ingreso" in fields else ""
    salida = fields.get("fecha_hora_salida").string_value if "fecha_hora_salida" in fields else "-"
    minutos = fields.get("duracion_total_minutos").integer_value if "duracion_total_minutos" in fields else 0
    monto = fields.get("monto_total_cobrado").integer_value if "monto_total_cobrado" in fields else 0
    estado = fields.get("estado_ticket").string_value if "estado_ticket" in fields else ""

    # Autenticación y conexión a Google Sheets
    credentials, _ = default(scopes=["https://www.googleapis.com/auth/spreadsheets"])
    gc = gspread.authorize(credentials)
    sheet = gc.open_by_key(SPREADSHEET_ID).worksheet("Tickets")

    # Si el ticket ya existe, se actualiza la fila; si no, se agrega una nueva
    cell = sheet.find(ticket_id) if ticket_id else None
    row_values = [ticket_id, patente, ingreso, salida, minutos, monto, estado]

    if cell:
        sheet.update(range_name=f"A{cell.row}:G{cell.row}", values=[row_values])
    else:
        sheet.append_row(row_values)
