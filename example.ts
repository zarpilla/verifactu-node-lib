import { createVerifactuInvoice, cancelVerifactuInvoice, Invoice, CancelInvoice, Software, PreviousInvoiceId } from './src/index';

// Ejemplo de uso de la librería VeriFacTu

async function main() {
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

    // Información de la factura anterior (para encadenamiento)
    const previousInvoice: PreviousInvoiceId = {
        issuerIrsId: "99999990S",
        number: "FAC-099",
        issuedTime: new Date("2024-03-17T10:00:00.000Z"),
        hash: "abc123def456789..."
    };

    // Ejemplo 1: Crear una factura
    try {
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
                text: "Servicios de consultoría tecnológica",
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

        console.log('Creando factura VeriFacTu...');
        const result = await createVerifactuInvoice(invoice, software, previousInvoice);
        
        console.log('✅ Factura creada exitosamente');
        console.log('📱 QR Code:', result.qrcode );
        console.log('🔗 Información de encadenamiento:', result.chainInfo);
        console.log('📄 XML (base64):', result.verifactuXml.substring(0, 50) + '...');
        
        // El XML decodificado se puede obtener así:
        const xmlDecoded = Buffer.from(result.verifactuXml, 'base64').toString('utf8');
        console.log('📄 XML decodificado (primeros 200 caracteres):', xmlDecoded.substring(0, 200) + '...');
        
        // Debug: Mostrar XML completo para diagnosticar
        console.log('\n🔍 XML COMPLETO PARA DEBUG:');
        console.log(xmlDecoded);
        console.log('🔍 FIN XML COMPLETO\n');

    } catch (error) {
        console.error('❌ Error creando factura:', error instanceof Error ? error.message : String(error));
    }

    // Ejemplo 2: Anular una factura
    try {
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

        console.log('\nAnulando factura VeriFacTu...');
        const cancelResult = await cancelVerifactuInvoice(cancelInvoice, software, previousInvoice);
        
        console.log('✅ Factura anulada exitosamente');
        console.log('🔗 Información de encadenamiento:', cancelResult.chainInfo);
        console.log('📄 XML de anulación (base64):', cancelResult.verifactuXml.substring(0, 50) + '...');

    } catch (error) {
        console.error('❌ Error anulando factura:', error instanceof Error ? error.message : String(error));
    }
}

// Ejemplo de factura simplificada (sin destinatario)
async function createSimplifiedInvoice() {
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

    try {
        const simplifiedInvoice: Invoice = {
            issuer: {
                irsId: "99999990S",
                name: "Mi Empresa S.L."
            },
            // Sin destinatario para factura simplificada
            id: {
                number: "SIMP-001",
                issuedTime: new Date("2024-03-18T14:00:00.000Z")
            },
            type: "F2", // Factura simplificada
            description: {
                text: "Venta en mostrador",
            },
            vatLines: [
                {
                    vatOperation: "S1",
                    base: 50.00,
                    rate: 21,
                    amount: 10.50,
                    vatKey: "01"
                }
            ],
            total: 60.50,
            amount: 10.50
        };

        console.log('\nCreando factura simplificada...');
        const result = await createVerifactuInvoice(simplifiedInvoice, software);
        console.log('✅ Factura simplificada creada exitosamente');
        console.log('🔗 Hash de encadenamiento:', result.chainInfo.hash);

    } catch (error) {
        console.error('❌ Error creando factura simplificada:', error instanceof Error ? error.message : String(error));
    }
}

// Ejecutar ejemplos
if (require.main === module) {
    main()
        .then(() => createSimplifiedInvoice())
        .then(() => console.log('\n🎉 Ejemplos completados'))
        .catch(console.error);
}

export { main, createSimplifiedInvoice };
