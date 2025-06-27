# VeriFacTu Library - Resumen del Proyecto

## ¿Qué hemos creado?

He convertido exitosamente la utilidad de consola `verifactu-xmlgen` en una **librería JavaScript/TypeScript** que puede ser integrada directamente en aplicaciones Node.js. 

## Estructura del Proyecto

```
verifactu-lib/
├── package.json              # Configuración del paquete npm
├── tsconfig.json             # Configuración TypeScript
├── README.md                 # Documentación principal
├── MIGRATION.md              # Guía de migración
├── jest.config.json          # Configuración de tests
├── src/                      # Código fuente TypeScript
│   ├── index.ts             # Punto de entrada principal
│   ├── types.ts             # Definiciones de tipos
│   ├── utils.ts             # Utilidades para XML y validación
│   └── verifactu.ts         # Funciones principales de VeriFacTu
├── dist/                     # Código compilado (JavaScript)
├── test/                     # Tests unitarios
├── examples/                 # Ejemplos de datos JSON
└── express-example.js        # API REST de ejemplo
```

## Funcionalidades Principales

### ✅ Operaciones Soportadas

1. **`createVerifactuInvoice`** - Crear facturas VeriFacTu
   - Facturas completas (F1)
   - Facturas simplificadas (F2) 
   - Facturas rectificativas (R1-R5)
   - Generación automática de códigos QR
   - Encadenamiento de facturas

2. **`cancelVerifactuInvoice`** - Anular facturas VeriFacTu
   - Anulación con encadenamiento
   - Validación automática

### ✅ Características Técnicas

- **TypeScript completo** con tipos estrictos
- **Validación automática** de datos de entrada
- **Generación de QR codes** automática
- **Encadenamiento de facturas** con hashes SHA256
- **Sin dependencias de certificados digitales**
- **Compatible con CommonJS y ES Modules**

## Comparación: Antes vs Después

| Aspecto | Utilidad Consola | Nueva Librería |
|---------|------------------|----------------|
| **Uso** | Proceso externo con JSON | Función JavaScript nativa |
| **Rendimiento** | Overhead de procesos | Ejecución directa |
| **Tipos** | Sin validación | TypeScript completo |
| **Debugging** | Difícil | Nativo de JavaScript |
| **Testing** | Complejo | Jest unitario |
| **Integración** | spawn/exec | import/require |
| **Errores** | Códigos de salida | Excepciones JS |

## Ejemplo de Uso

### Antes (utilidad de consola)
```bash
cat invoice.json | ./dist/verifactu-xmlgen \
    -o verifactu_create \
    -d B00000000 \
    -s Software \
    -n Odoo \
    -v 0.1 > result.json
```

### Después (librería)
```javascript
const { createVerifactuInvoice } = require('verifactu-lib');

const result = await createVerifactuInvoice(invoice, software, previousInvoice);
console.log(result.qrcode);        // QR code data URL
console.log(result.chainInfo);     // Info para siguiente factura
console.log(result.verifactuXml);  // XML en base64
```

## Archivos Importantes

### 📘 Documentación
- **`README.md`** - Documentación completa con ejemplos
- **`MIGRATION.md`** - Guía paso a paso para migrar desde la consola
- **`SUMMARY.md`** - Este archivo de resumen

### 🔧 Código Principal
- **`src/index.ts`** - Exportaciones principales
- **`src/verifactu.ts`** - Lógica de generación de XML
- **`src/types.ts`** - Tipos TypeScript completos
- **`src/utils.ts`** - Utilidades auxiliares

### 🧪 Ejemplos y Tests
- **`test-simple.js`** - Test básico de funcionamiento
- **`express-example.js`** - API REST completa
- **`examples/*.json`** - Datos de ejemplo
- **`test-api.sh`** - Script para probar la API

## Instalación y Uso

### 1. Instalar dependencias
```bash
cd verifactu-lib
npm install
```

### 2. Compilar TypeScript
```bash
npm run build
```

### 3. Probar funcionamiento básico
```bash
node test-simple.js
```

### 4. Probar API REST (opcional)
```bash
# Terminal 1: Iniciar API
node express-example.js

# Terminal 2: Probar endpoints
./test-api.sh
```

## Integración en Proyectos

### Como paquete npm local
```bash
cd tu-proyecto
npm install /ruta/a/verifactu-lib
```

### En tu código
```javascript
const { createVerifactuInvoice, cancelVerifactuInvoice } = require('verifactu-lib');

// Configurar software
const software = {
    developerName: "Tu Empresa S.L.",
    developerIrsId: "B12345678",
    name: "Tu Software",
    id: "SW_001",
    version: "1.0.0",
    number: "12345",
    useOnlyVerifactu: true,
    useMulti: true,
    useCurrentMulti: false
};

// Crear factura
const invoice = { /* datos de factura */ };
const result = await createVerifactuInvoice(invoice, software);
```

## Ventajas de la Nueva Implementación

### 🚀 **Rendimiento**
- Sin overhead de procesos externos
- Ejecución directa en el mismo proceso
- Menor uso de memoria y CPU

### 🛡️ **Robustez**
- Validación automática de tipos con TypeScript
- Manejo nativo de errores JavaScript
- Tests unitarios incluidos

### 🔧 **Mantenibilidad**
- Código más limpio y estructurado
- Separación clara de responsabilidades
- Documentación completa

### 🎯 **Facilidad de Uso**
- API simple y consistente
- Ejemplos completos incluidos
- Integración directa sin configuración compleja

## Limitaciones Conocidas

⚠️ **Importante**: Esta librería **NO incluye**:
- Firma digital de documentos (requiere certificados)
- Envío directo a la AEAT
- Validación contra esquemas XSD en tiempo real

Para esas funcionalidades necesitarás:
1. Usar la librería original para firmar el XML generado
2. Implementar el cliente SOAP para envío a AEAT
3. Configurar certificados digitales apropiados

## Siguiente Pasos Recomendados

1. **Publicar en npm** (opcional)
   ```bash
   npm publish
   ```

2. **Integrar en tu aplicación**
   - Reemplazar llamadas a la utilidad de consola
   - Actualizar manejo de fechas (string → Date)
   - Simplificar manejo de errores

3. **Añadir funcionalidades adicionales**
   - Validación contra esquemas XSD
   - Integración con firma digital
   - Cliente para envío a AEAT

## Soporte

Esta implementación está basada en la especificación oficial de VeriFacTu y mantiene compatibilidad total con el XML generado por la utilidad original.

Para dudas o problemas:
- Revisar `README.md` para documentación detallada
- Consultar `MIGRATION.md` para guía de migración
- Examinar `examples/` para casos de uso específicos
