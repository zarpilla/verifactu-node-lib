#!/bin/bash

# Script para probar la API VeriFacTu
# Asegúrate de que la API esté corriendo en puerto 3000

API_URL="http://localhost:3000/api/verifactu"

echo "🧪 Probando API VeriFacTu..."
echo

# Función para hacer peticiones y mostrar resultado
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data_file=$3
    local description=$4
    
    echo "📋 Test: $description"
    echo "   $method $endpoint"
    
    if [ -n "$data_file" ]; then
        echo "   Datos: $data_file"
        response=$(curl -s -X $method \
            -H "Content-Type: application/json" \
            -d @"$data_file" \
            "$API_URL$endpoint")
    else
        response=$(curl -s -X $method "$API_URL$endpoint")
    fi
    
    # Verificar si la respuesta es JSON válido
    if echo "$response" | jq . >/dev/null 2>&1; then
        echo "   ✅ Respuesta válida"
        echo "$response" | jq .
    else
        echo "   ❌ Error en la respuesta"
        echo "   Respuesta cruda: $response"
    fi
    
    echo
}

# Verificar que curl y jq estén disponibles
if ! command -v curl &> /dev/null; then
    echo "❌ curl no está instalado"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "❌ jq no está instalado"
    exit 1
fi

# Verificar que la API esté corriendo
echo "🔍 Verificando que la API esté corriendo..."
if ! curl -s "$API_URL/health" >/dev/null; then
    echo "❌ La API no está corriendo en $API_URL"
    echo "   Inicia la API con: node express-example.js"
    exit 1
fi

echo "✅ API disponible"
echo

# Tests
test_endpoint "GET" "/health" "" "Estado de la API"
test_endpoint "GET" "/config" "" "Configuración de la API"
test_endpoint "POST" "/invoice" "examples/create-invoice.json" "Crear factura completa"
test_endpoint "POST" "/invoice" "examples/simplified-invoice.json" "Crear factura simplificada"
test_endpoint "POST" "/invoice/cancel" "examples/cancel-invoice.json" "Anular factura"

echo "🎉 Tests completados"
