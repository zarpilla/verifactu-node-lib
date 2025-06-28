# VeriFacTu Library

Una librería JavaScript/TypeScript para generar facturas electrónicas compatibles con VeriFacTu de la AEAT (Agencia Estatal de Administración Tributaria).

## Características

- ✅ Generación de facturas VeriFacTu
- ✅ Anulación de facturas VeriFacTu
- ✅ Generación automática de códigos QR
- ✅ Encadenamiento de facturas
- ✅ Validación de datos
- ✅ Soporte TypeScript completo
- ✅ Sin dependencias de certificados digitales

## Instalación

```bash
npm install verifactu-node-lib
```

## Uso Básico

### Crear una factura

```typescript
import { createVerifactuInvoice, Invoice, Software } from 'verifactu-node-lib';

// Configuración del software
const software: Software = {
    developerName: "Mi Empresa Desarrolladora S.L.",
    developerIrsId: "B12345678",
    name: "Mi Software de Facturación",
    id: "SOFT_001",
    version: "1.0.0",
    number: "12345",
    useOnlyVerifactu: true,
    useMulti: true,
    useCurrentMulti: false
};

// Datos de la factura
const invoice: Invoice = {
    issuer: {
        irsId: "99999990S",
        name: "Mi Empresa S.L."
    },
    recipient: {
        irsId: "B87654321",
        name: "Cliente S.A.",
        country: "ES"
    },
    id: {
        number: "FAC-100",
        issuedTime: new Date("2024-03-18T10:00:00.000Z")
    },
    type: "F1", // Factura completa
    description: {
        text: "Servicios de consultoría",
        operationDate: new Date("2024-03-18T09:00:00.000Z")
    },
    vatLines: [
        {
            vatOperation: "S1", // Operación sujeta
            base: 1000.00,
            rate: 21,
            amount: 210.00,
            vatKey: "01" // IVA general
        }
    ],
    total: 1210.00,
    amount: 210.00
};

// Crear la factura
const result = await createVerifactuInvoice(invoice, software);

console.log('QR Code:', result.qrcode);
console.log('XML base64:', result.verifactuXml);
console.log('Info encadenamiento:', result.chainInfo);
```

### Anular una factura

```typescript
import { cancelVerifactuInvoice, CancelInvoice } from 'verifactu-node-lib';

const cancelInvoice: CancelInvoice = {
    issuer: {
        irsId: "99999990S",
        name: "Mi Empresa S.L."
    },
    id: {
        number: "FAC-100",
        issuedTime: new Date("2024-03-18T10:00:00.000Z")
    }
};

const result = await cancelVerifactuInvoice(cancelInvoice, software);
console.log('Factura anulada:', result.chainInfo);
```

### Factura con encadenamiento

```typescript
import { PreviousInvoiceId } from 'verifactu-node-lib';

// Información de la factura anterior
const previousInvoice: PreviousInvoiceId = {
    issuerIrsId: "99999990S",
    number: "FAC-099",
    issuedTime: new Date("2024-03-17T10:00:00.000Z"),
    hash: "abc123def456789..."
};

// Crear factura con encadenamiento
const result = await createVerifactuInvoice(invoice, software, previousInvoice);
```

## Tipos de Factura

### Facturas Completas (F1)
Requieren destinatario identificado:

```typescript
const invoice: Invoice = {
    // ...otros campos
    type: "F1",
    recipient: {
        irsId: "B87654321",
        name: "Cliente S.A.",
        country: "ES"
    }
    // ...
};
```

### Facturas Simplificadas (F2)
No requieren destinatario:

```typescript
const invoice: Invoice = {
    // ...otros campos
    type: "F2",
    // Sin campo recipient
    // ...
};
```

### Facturas Rectificativas (R1, R2, R3, R4)
Para correcciones de facturas anteriores:

```typescript
const invoice: Invoice = {
    // ...otros campos
    type: "R1",
    creditNote: {
        ids: [{
            number: "FAC-099",
            issuedTime: new Date("2024-03-17T10:00:00.000Z")
        }],
        style: "S", // Sustitución
        creditBase: 100.00,
        creditVat: 21.00
    }
    // ...
};
```

## Líneas de IVA

### Operación Sujeta (S1, S2)
```typescript
{
    vatOperation: "S1",
    base: 1000.00,
    rate: 21,
    amount: 210.00,
    vatKey: "01"
}
```

### Operación Exenta (E1-E6)
```typescript
{
    vatOperation: "E1",
    base: 1000.00,
    rate: 0,
    amount: 0,
    vatKey: "02"
}
```

### Operación No Sujeta (N1, N2)
```typescript
{
    vatOperation: "N1",
    base: 1000.00,
    rate: 0,
    vatKey: "07"
}
```

## Claves de Régimen de IVA

- `"01"`: Operación de régimen general
- `"02"`: Exportación
- `"03"`: Operaciones a las que se aplique el régimen especial de bienes usados, objetos de arte, antigüedades y objetos de colección
- `"04"`: Régimen especial del oro de inversión
- `"05"`: Régimen especial de las agencias de viajes
- `"06"`: Régimen especial grupo de entidades en IGIC (Nivel Avanzado)
- `"07"`: Régimen especial del criterio de caja
- `"08"`: Operaciones sujetas al IPSI / IVA (Impuesto sobre la Producción, los Servicios y la Importación / Impuesto sobre el Valor Añadido)
- `"09"`: Facturación de las prestaciones de servicios de agencias de viaje que actúan como mediadoras en nombre y por cuenta ajena (D.A.4ª RD1619/2012)
- `"10"`: Cobros por cuenta de terceros de honorarios profesionales o de derechos derivados de la propiedad industrial, de autor u otros por cuenta de sus socios, asociados o colegiados efectuados por sociedades, asociaciones, colegios profesionales u otras entidades que realicen estas funciones de cobro
- `"11"`: Operaciones de arrendamiento de local de negocio
- `"14"`: Factura con IGIC pendiente de devengo en certificaciones de obra cuyo destinatario sea una Administración Pública
- `"15"`: Factura con IGIC pendiente de devengo en operaciones de tracto sucesivo
- `"17"`: Régimen especial de comerciante minorista
- `"18"`: Régimen especial del pequeño empresario o profesional
- `"19"`: Operaciones interiores exentas por aplicación artículo 25 Ley 19/1994

## Países Soportados

La librería soporta todos los códigos de país ISO 3166-1 alpha-2. Ejemplos:
- `"ES"`: España
- `"FR"`: Francia
- `"DE"`: Alemania
- `"PT"`: Portugal
- `"US"`: Estados Unidos

## Validaciones

La librería incluye validaciones automáticas para:

- ✅ Formato de NIF/CIF
- ✅ Campos obligatorios
- ✅ Tipos de factura válidos
- ✅ Operaciones de IVA correctas
- ✅ Importes numéricos
- ✅ Fechas válidas

## Resultado

Todas las operaciones devuelven un objeto `VerifactuResult`:

```typescript
interface VerifactuResult {
    qrcode: string | null;        // Código QR en formato data URL (solo facturas)
    chainInfo: PreviousInvoiceId; // Información para el siguiente encadenamiento
    verifactuXml: string;         // XML codificado en base64
}
```

## Manejo de Errores

```typescript
try {
    const result = await createVerifactuInvoice(invoice, software);
    // Procesar resultado exitoso
} catch (error) {
    console.error('Error creando factura:', error.message);
    // Manejar el error
}
```

## Ejemplos Completos

Consulta el archivo `example.ts` para ver ejemplos completos de uso.

## Limitaciones

- Esta librería **NO** firma digitalmente las facturas
- **NO** envía las facturas a la AEAT
- Se centra únicamente en la generación del XML VeriFacTu

Para el envío a la AEAT necesitarás:
1. Certificado digital válido
2. Implementar la comunicación SOAP con los servicios de la AEAT
3. Firmar digitalmente el XML generado

## Licencia

MIT

## Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue o envía un pull request.

## Soporte

Para soporte y preguntas, abre un issue en el repositorio.
