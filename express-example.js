const express = require('express');
const { createVerifactuInvoice, cancelVerifactuInvoice } = require('./dist/index');

const app = express();
app.use(express.json());

// Configuración del software (esto debería venir de variables de entorno)
const SOFTWARE_CONFIG = {
    developerName: process.env.VERIFACTU_DEVELOPER_NAME || "Tu Empresa S.L.",
    developerIrsId: process.env.VERIFACTU_DEVELOPER_ID || "B00000000",
    name: process.env.VERIFACTU_SOFTWARE_NAME || "API VeriFacTu",
    id: process.env.VERIFACTU_SOFTWARE_ID || "API_001",
    version: process.env.VERIFACTU_SOFTWARE_VERSION || "1.0.0",
    number: process.env.VERIFACTU_SOFTWARE_NUMBER || "12345",
    useOnlyVerifactu: true,
    useMulti: true,
    useCurrentMulti: false
};

// Middleware de validación básica
function validateInvoiceData(req, res, next) {
    const { invoice } = req.body;
    
    if (!invoice) {
        return res.status(400).json({ error: 'Campo "invoice" es obligatorio' });
    }
    
    if (!invoice.issuer || !invoice.issuer.irsId || !invoice.issuer.name) {
        return res.status(400).json({ error: 'Datos del emisor incompletos' });
    }
    
    if (!invoice.id || !invoice.id.number || !invoice.id.issuedTime) {
        return res.status(400).json({ error: 'Datos de identificación de factura incompletos' });
    }
    
    if (!invoice.vatLines || invoice.vatLines.length === 0) {
        return res.status(400).json({ error: 'Debe incluir al menos una línea de IVA' });
    }
    
    next();
}

// Función auxiliar para convertir fechas
function convertDates(obj) {
    if (obj.id && obj.id.issuedTime) {
        obj.id.issuedTime = new Date(obj.id.issuedTime);
    }
    
    if (obj.description && obj.description.operationDate) {
        obj.description.operationDate = new Date(obj.description.operationDate);
    }
    
    if (obj.creditNote && obj.creditNote.ids) {
        obj.creditNote.ids.forEach(id => {
            if (id.issuedTime) {
                id.issuedTime = new Date(id.issuedTime);
            }
        });
    }
    
    if (obj.replacedTicketIds) {
        obj.replacedTicketIds.forEach(id => {
            if (id.issuedTime) {
                id.issuedTime = new Date(id.issuedTime);
            }
        });
    }
    
    return obj;
}

function convertPreviousInvoiceDates(previousInvoice) {
    if (previousInvoice && previousInvoice.issuedTime) {
        previousInvoice.issuedTime = new Date(previousInvoice.issuedTime);
    }
    return previousInvoice;
}

// Rutas principales

/**
 * POST /api/verifactu/invoice
 * Crear una nueva factura VeriFacTu
 * 
 * Body:
 * {
 *   "invoice": { ... },           // Datos de la factura
 *   "previousInvoice": { ... },   // Factura anterior para encadenamiento (opcional)
 *   "testing": false              // Usar URLs de testing (opcional)
 * }
 */
app.post('/api/verifactu/invoice', validateInvoiceData, async (req, res) => {
    try {
        const { invoice, previousInvoice, testing = false } = req.body;
        
        // Convertir fechas de string a Date
        convertDates(invoice);
        convertPreviousInvoiceDates(previousInvoice);
        
        console.log(`📄 Creando factura VeriFacTu: ${invoice.id.number}`);
        
        const result = await createVerifactuInvoice(
            invoice, 
            SOFTWARE_CONFIG, 
            previousInvoice,
            {},  // options
            testing
        );
        
        console.log(`✅ Factura creada exitosamente: ${invoice.id.number}`);
        console.log(`🔗 Hash: ${result.chainInfo.hash.substring(0, 16)}...`);
        
        res.json({
            success: true,
            data: result
        });
        
    } catch (error) {
        console.error(`❌ Error creando factura: ${error.message}`);
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

/**
 * POST /api/verifactu/invoice/cancel
 * Anular una factura VeriFacTu existente
 * 
 * Body:
 * {
 *   "cancelInvoice": { ... },     // Datos de la factura a anular
 *   "previousInvoice": { ... }    // Factura anterior para encadenamiento (opcional)
 * }
 */
app.post('/api/verifactu/invoice/cancel', async (req, res) => {
    try {
        const { cancelInvoice, previousInvoice } = req.body;
        
        if (!cancelInvoice) {
            return res.status(400).json({ error: 'Campo "cancelInvoice" es obligatorio' });
        }
        
        if (!cancelInvoice.issuer || !cancelInvoice.issuer.irsId || !cancelInvoice.issuer.name) {
            return res.status(400).json({ error: 'Datos del emisor incompletos' });
        }
        
        if (!cancelInvoice.id || !cancelInvoice.id.number || !cancelInvoice.id.issuedTime) {
            return res.status(400).json({ error: 'Datos de identificación de factura incompletos' });
        }
        
        // Convertir fechas
        convertDates(cancelInvoice);
        convertPreviousInvoiceDates(previousInvoice);
        
        console.log(`🗑️ Anulando factura VeriFacTu: ${cancelInvoice.id.number}`);
        
        const result = await cancelVerifactuInvoice(
            cancelInvoice, 
            SOFTWARE_CONFIG, 
            previousInvoice
        );
        
        console.log(`✅ Factura anulada exitosamente: ${cancelInvoice.id.number}`);
        console.log(`🔗 Hash: ${result.chainInfo.hash.substring(0, 16)}...`);
        
        res.json({
            success: true,
            data: result
        });
        
    } catch (error) {
        console.error(`❌ Error anulando factura: ${error.message}`);
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

/**
 * GET /api/verifactu/health
 * Endpoint de salud para verificar que la API funciona
 */
app.get('/api/verifactu/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'VeriFacTu API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        software: {
            name: SOFTWARE_CONFIG.name,
            version: SOFTWARE_CONFIG.version
        }
    });
});

/**
 * GET /api/verifactu/config
 * Obtener información de configuración (sin datos sensibles)
 */
app.get('/api/verifactu/config', (req, res) => {
    res.json({
        software: {
            name: SOFTWARE_CONFIG.name,
            version: SOFTWARE_CONFIG.version,
            useOnlyVerifactu: SOFTWARE_CONFIG.useOnlyVerifactu,
            useMulti: SOFTWARE_CONFIG.useMulti
        }
    });
});

// Middleware de manejo de errores
app.use((error, req, res, next) => {
    console.error('Error no manejado:', error);
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
    });
});

// Middleware para rutas no encontradas
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Ruta no encontrada'
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 API VeriFacTu corriendo en puerto ${PORT}`);
    console.log(`📋 Endpoints disponibles:`);
    console.log(`   POST /api/verifactu/invoice         - Crear factura`);
    console.log(`   POST /api/verifactu/invoice/cancel  - Anular factura`);
    console.log(`   GET  /api/verifactu/health          - Estado de la API`);
    console.log(`   GET  /api/verifactu/config          - Configuración`);
    console.log(`💡 Software: ${SOFTWARE_CONFIG.name} v${SOFTWARE_CONFIG.version}`);
});

module.exports = app;
