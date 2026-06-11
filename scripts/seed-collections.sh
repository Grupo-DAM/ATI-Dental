#!/bin/bash

PROJECT_ID="ati-dental"
BASE_URL="https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents"
JSON_HEADER="Content-Type: application/json"

echo "Iniciando la creación y siembra de colecciones en Firestore..."

# 1. Crear colección 'usuarios'
echo "Creando documento en 'usuarios'..."
curl -s -X POST \
  -H "$JSON_HEADER" \
  -d '{"fields": {"nombre": {"stringValue": "Dra. Valeria"}, "alias": {"stringValue": "ValCicco"}, "email": {"stringValue": "valeria.ciccolella@atidental.com"}, "rol": {"stringValue": "odontologo"}, "estado": {"stringValue": "activo"}, "idiomaPreferencia": {"stringValue": "es"}, "fechaCreacion": {"stringValue": "2026-06-09T21:40:00Z"}}}' \
  "${BASE_URL}/usuarios?documentId=user_valcicco_456"
echo -e "\n"

# 2. Crear colección 'pacientes'
echo "Creando documento en 'pacientes'..."
curl -s -X POST \
  -H "$JSON_HEADER" \
  -d '{"fields": {"nombre": {"stringValue": "Carlos"}, "apellido": {"stringValue": "Cova"}, "dni": {"stringValue": "12345678A"}, "telefono": {"stringValue": "+34600000000"}, "email": {"stringValue": "carlos.cova@email.com"}, "fechaNacimiento": {"stringValue": "1995-03-20T00:00:00Z"}, "antecedentesMedicos": {"arrayValue": {"values": [{"stringValue": "hipertension"}, {"stringValue": "alergia_penicilina"}]}}, "fechaCreacion": {"stringValue": "2026-06-09T21:40:00Z"}}}' \
  "${BASE_URL}/pacientes?documentId=paciente_cova_123"
echo -e "\n"

# 3. Crear colección 'historias_clinicas'
echo "Creando documento en 'historias_clinicas'..."
curl -s -X POST \
  -H "$JSON_HEADER" \
  -d '{"fields": {"pacienteId": {"stringValue": "paciente_cova_123"}, "odontologoId": {"stringValue": "user_valcicco_456"}, "fechaConsulta": {"stringValue": "2026-06-09T19:00:00Z"}, "diagnostico": {"stringValue": "Caries profunda en pieza 46"}, "tratamiento": {"stringValue": "Obturación de resina compuesta"}, "notesEvolucion": {"stringValue": "Paciente refiere dolor moderado previo. Se realiza procedimiento sin complicaciones."}}}' \
  "${BASE_URL}/historias_clinicas?documentId=historia_clinica_789"
echo -e "\n"

# 4. Crear colección 'odontogramas'
echo "Creando documento en 'odontogramas'..."
curl -s -X POST \
  -H "$JSON_HEADER" \
  -d '{"fields": {"pacienteId": {"stringValue": "paciente_cova_123"}, "consultaId": {"stringValue": "historia_clinica_789"}, "tipo": {"stringValue": "adulto"}, "fechaRegistro": {"stringValue": "2026-06-09T19:00:00.000Z"}, "estadoPiezas": {"mapValue": {"fields": {"16": {"mapValue": {"fields": {"estado_general": {"stringValue": "obturado"}, "caras": {"mapValue": {"fields": {"oclusal": {"stringValue": "obturado"}, "mesial": {"stringValue": "sano"}}}}}}}, "46": {"mapValue": {"fields": {"estado_general": {"stringValue": "caries"}, "caras": {"mapValue": {"fields": {"oclusal": {"stringValue": "caries"}, "distal": {"stringValue": "caries"}}}}}}}}}}}}' \
  "${BASE_URL}/odontogramas"
echo -e "\n"

# 5. Crear colección 'citas'
echo "Creando documento en 'citas'..."
curl -s -X POST \
  -H "$JSON_HEADER" \
  -d '{"fields": {"pacienteId": {"stringValue": "paciente_cova_123"}, "medicoId": {"stringValue": "user_valcicco_456"}, "fechaHora": {"stringValue": "2026-06-12T10:00:00Z"}, "motivo": {"stringValue": "Revisión general y profilaxis"}, "estado": {"stringValue": "programada"}}}' \
  "${BASE_URL}/citas"
echo -e "\n"

# 6. Crear colección 'archivos_pacientes'
echo "Creando documento en 'archivos_pacientes'..."
curl -s -X POST \
  -H "$JSON_HEADER" \
  -d '{"fields": {"pacienteId": {"stringValue": "paciente_cova_123"}, "url": {"stringValue": "https://firebasestorage.googleapis.com/.../pacientes/cova_123/radiografias/rx_2026.png"}, "tipo": {"stringValue": "radiografia"}, "fechaCarga": {"stringValue": "2026-06-09T18:30:00Z"}}}' \
  "${BASE_URL}/archivos_pacientes"
echo -e "\n"

# 7. Crear colección 'contenido_multimedia'
echo "Creando documento en 'contenido_multimedia'..."
curl -s -X POST \
  -H "$JSON_HEADER" \
  -d '{"fields": {"titulo": {"stringValue": "Demostración de Escáner 3D Intraoral"}, "url": {"stringValue": "https://firebasestorage.googleapis.com/.../productos/demo_scanner.mp4"}, "tipo": {"stringValue": "video"}, "pesoBytes": {"integerValue": "15482910"}, "fechaCarga": {"stringValue": "2026-06-09T15:00:00Z"}, "activo": {"booleanValue": true}}}' \
  "${BASE_URL}/contenido_multimedia"
echo -e "\n"

echo "Proceso finalizado."
