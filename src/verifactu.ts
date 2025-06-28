import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import * as crypto from 'crypto';
import * as qrcode from 'qrcode';
import {
    Invoice,
    CancelInvoice,
    Software,
    PreviousInvoiceId,
    ToXmlOptions,
    VerifactuResult,
    Partner,
    PartnerIrs,
    PartnerOther,
    VatLine,
    InvoiceDescription,
    CreditNote
} from './types';
import {
    updateDocument,
    querySelector,
    querySelectorAll,
    removeElement,
    toStr20,
    toStr30,
    toStr50,
    toStr60,
    toStr64,
    toStr100,
    toStr120,
    toStr500,
    toNifStr,
    round2ToString,
    toDateString,
    toString,
    toBooleanString,
    SimpleType,
    FormatAndValidationFunction,
    // completeRetentionLines,
    // computeRetentionTotal
} from './utils';

const NS1 = `xmlns:sum="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroInformacion.xsd"`;
const NS2 = `xmlns="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroInformacion.xsd"`;

const VERIFACTU_CANCEL_XML_BASE = `
<sum:RegistroFactura ${NS1} ${NS2}>
    <RegistroAnulacion>
        <IDVersion>1.0</IDVersion>
        <IDFactura>
            <IDEmisorFacturaAnulada>???</IDEmisorFacturaAnulada>
            <NumSerieFacturaAnulada>????</NumSerieFacturaAnulada>
            <FechaExpedicionFacturaAnulada>????</FechaExpedicionFacturaAnulada>
        </IDFactura>
        <Encadenamiento>
            <PrimerRegistro>S</PrimerRegistro>
            <RegistroAnterior>
                <IDEmisorFactura>????</IDEmisorFactura>
                <NumSerieFactura>????</NumSerieFactura>
                <FechaExpedicionFactura>????</FechaExpedicionFactura>
                <Huella>????</Huella>
            </RegistroAnterior>
        </Encadenamiento>
        <SistemaInformatico>
            <NombreRazon>????</NombreRazon>
            <NIF>????</NIF>
            <NombreSistemaInformatico>????</NombreSistemaInformatico>
            <IdSistemaInformatico>????</IdSistemaInformatico>
            <Version>????</Version>
            <NumeroInstalacion>????</NumeroInstalacion>
            <TipoUsoPosibleSoloVerifactu>????</TipoUsoPosibleSoloVerifactu>
            <TipoUsoPosibleMultiOT>????</TipoUsoPosibleMultiOT>
            <IndicadorMultiplesOT>????</IndicadorMultiplesOT>
        </SistemaInformatico>
        <FechaHoraHusoGenRegistro>????</FechaHoraHusoGenRegistro>
        <TipoHuella>01</TipoHuella>
        <Huella>????</Huella>
    </RegistroAnulacion>
</sum:RegistroFactura>`.replace(/>\s+</g, "><").replace(/\s*xmlns/g, " xmlns");

const VERIFACTU_INVOICE_XML_BASE = `
<sum:RegistroFactura ${NS1} ${NS2}>
    <RegistroAlta>
        <IDVersion>1.0</IDVersion>
        <IDFactura>
            <IDEmisorFactura>????</IDEmisorFactura>
            <NumSerieFactura>????</NumSerieFactura>
            <FechaExpedicionFactura>????</FechaExpedicionFactura>
        </IDFactura>
        <NombreRazonEmisor>????</NombreRazonEmisor>
        <Subsanacion>S</Subsanacion>
        <RechazoPrevio>X</RechazoPrevio>
        <TipoFactura>F1</TipoFactura>
        <TipoRectificativa/>
        <FacturasRectificadas/>
        <FacturasSustituidas/>
        <ImporteRectificacion/>
        <FechaOperacion/>
        <DescripcionOperacion>????</DescripcionOperacion>
        <EmitidaPorTerceroODestinatario>????</EmitidaPorTerceroODestinatario>
        <Tercero>
            <NombreRazon>????</NombreRazon>
            <NIF>????</NIF>
        </Tercero>
        <Destinatarios/>
        <Desglose/>
        <CuotaTotal>????</CuotaTotal>
        <ImporteTotal>????</ImporteTotal>
        <RetencionSoportada>????</RetencionSoportada>
        <Encadenamiento>
            <PrimerRegistro>S</PrimerRegistro>
            <RegistroAnterior>
                <IDEmisorFactura>????</IDEmisorFactura>
                <NumSerieFactura>????</NumSerieFactura>
                <FechaExpedicionFactura>????</FechaExpedicionFactura>
                <Huella>????</Huella>
            </RegistroAnterior>
        </Encadenamiento>
        <SistemaInformatico>
            <NombreRazon>????</NombreRazon>
            <NIF>????</NIF>
            <NombreSistemaInformatico>????</NombreSistemaInformatico>
            <IdSistemaInformatico>????</IdSistemaInformatico>
            <Version>????</Version>
            <NumeroInstalacion>????</NumeroInstalacion>
            <TipoUsoPosibleSoloVerifactu>????</TipoUsoPosibleSoloVerifactu>
            <TipoUsoPosibleMultiOT>????</TipoUsoPosibleMultiOT>
            <IndicadorMultiplesOT>????</IndicadorMultiplesOT>
        </SistemaInformatico>
        <FechaHoraHusoGenRegistro>????</FechaHoraHusoGenRegistro>
        <TipoHuella>01</TipoHuella>
        <Huella>????</Huella>
    </RegistroAlta>
</sum:RegistroFactura>`.replace(/>\s+</g, "><").replace(/\s*xmlns/g, " xmlns");

// Funciones auxiliares para validaciones básicas
function validateInvoice(invoice: Invoice): void {
    if (!invoice.issuer || !invoice.issuer.irsId || !invoice.issuer.name) {
        throw new Error("El emisor es obligatorio y debe incluir NIF y nombre");
    }
    
    if (!invoice.id || !invoice.id.number || !invoice.id.issuedTime) {
        throw new Error("Los datos de identificación de la factura son obligatorios");
    }
    
    if (!invoice.vatLines || invoice.vatLines.length === 0) {
        throw new Error("Debe incluir al menos una línea de IVA");
    }
    
    if (typeof invoice.total !== "number" || typeof invoice.amount !== "number") {
        throw new Error("El total y el importe son obligatorios");
    }
    
    // Validar que no se usen retentionAmount y retentionLines al mismo tiempo
    // if (invoice.retentionAmount !== undefined && invoice.retentionLines && invoice.retentionLines.length > 0) {
    //     throw new Error("No se puede especificar retentionAmount y retentionLines al mismo tiempo");
    // }
}

function validateCancelInvoice(cancelInvoice: CancelInvoice): void {
    if (!cancelInvoice.issuer || !cancelInvoice.issuer.irsId || !cancelInvoice.issuer.name) {
        throw new Error('El emisor es obligatorio y debe incluir NIF y nombre');
    }
    
    if (!cancelInvoice.id || !cancelInvoice.id.number || !cancelInvoice.id.issuedTime) {
        throw new Error('Los datos de identificación de la factura a anular son obligatorios');
    }
}

function validateSoftware(software: Software): void {
    if (!software.developerName || !software.developerIrsId || !software.name || 
        !software.id || !software.version || !software.number) {
        throw new Error('Todos los datos del software son obligatorios');
    }
}

// Funciones para agregar elementos al XML
function addRecipientToXml(xml: any, recipient: Partner | undefined): void {
    const destinatarios = querySelector(xml, "Destinatarios");
    if (!destinatarios) return;
    
    if (!recipient) {
        // Remover el elemento Destinatarios si no hay destinatario
        removeElement(destinatarios);
        return;
    }
    
    const isIrs = 'irsId' in recipient;
    const template = isIrs ? `
<IDDestinatario ${NS2}>
    <NombreRazon></NombreRazon>
    <NIF></NIF>
</IDDestinatario>` : `
<IDDestinatario ${NS2}>
    <NombreRazon></NombreRazon>
    <IDOtro>
        <CodigoPais></CodigoPais>
        <IDType></IDType>
        <ID></ID>
    </IDOtro>
</IDDestinatario>`;
    
    const newXml = new DOMParser().parseFromString(template.replace(/>\s+</g, "><"), "application/xml");
    
    if (isIrs) {
        const irsRecipient = recipient as PartnerIrs;
        updateDocument(newXml, [
            ['NombreRazon', irsRecipient.name, toStr120],
            ['NIF', irsRecipient.irsId, toNifStr],
        ]);
    } else {
        const otherRecipient = recipient as PartnerOther;
        updateDocument(newXml, [
            ['NombreRazon', otherRecipient.name, toStr120],
            ['CodigoPais', otherRecipient.country, toString],
            ['IDType', otherRecipient.idType, toString],
            ['ID', otherRecipient.id, toStr20],
        ]);
    }
    
    if (newXml.documentElement) {
        destinatarios.appendChild(newXml.documentElement);
    }
}

function addVatLinesToXml(xml: any, vatLines: VatLine[]): void {
    const desglose = querySelector(xml, "Desglose");
    if (!desglose) return;
    
    vatLines.forEach(vatLine => {
        const template = `
<DetalleDesglose ${NS2}>
    <Impuesto></Impuesto>
    <ClaveRegimen></ClaveRegimen>
    <CalificacionOperacion></CalificacionOperacion>
    <OperacionExenta></OperacionExenta>
    <TipoImpositivo></TipoImpositivo>
    <BaseImponible></BaseImponible>
    <TipoImpositivo2></TipoImpositivo2>
    <CuotaRecargoEquivalencia></CuotaRecargoEquivalencia>
    <TipoRecargoEquivalencia></TipoRecargoEquivalencia>
    <CuotaImpuesto></CuotaImpuesto>
</DetalleDesglose>`;
        
        const newXml = new DOMParser().parseFromString(template.replace(/>\s+</g, "><"), "application/xml");
        
        updateDocument(newXml, [
            ['Impuesto', vatLine.tax || '01', toString],
            ['ClaveRegimen', vatLine.vatKey, toString],
            ['CalificacionOperacion', vatLine.vatOperation, toString],
            ['TipoImpositivo', vatLine.rate, round2ToString],
            ['BaseImponible', vatLine.base, round2ToString],
            ['TipoImpositivo2', vatLine.rate2, round2ToString],
            ['CuotaRecargoEquivalencia', vatLine.amount2, round2ToString],
            ['CuotaImpuesto', vatLine.amount, round2ToString],
        ]);
        
        if (newXml.documentElement) {
            desglose.appendChild(newXml.documentElement);
        }
    });
}

function addSoftwareToXml(xml: any, software: Software): void {
    const selectorsToValues: Array<[string, SimpleType, FormatAndValidationFunction]> = [
        ["SistemaInformatico>NombreRazon", software.developerName, toStr120],
        ["SistemaInformatico>NIF", software.developerIrsId, toNifStr],
        ["SistemaInformatico>NombreSistemaInformatico", software.name, toStr30],
        ["SistemaInformatico>IdSistemaInformatico", software.id, toStr30],
        ["SistemaInformatico>Version", software.version, toStr50],
        ["SistemaInformatico>NumeroInstalacion", software.number, toStr100],
        ["SistemaInformatico>TipoUsoPosibleSoloVerifactu", software.useOnlyVerifactu, toBooleanString],
        ["SistemaInformatico>TipoUsoPosibleMultiOT", software.useMulti, toBooleanString],
        ["SistemaInformatico>IndicadorMultiplesOT", software.useCurrentMulti, toBooleanString],
    ];
    updateDocument(xml, selectorsToValues);
}

function addPreviousInvoiceToXml(xml: any, previousId: PreviousInvoiceId | null): void {
    if (previousId) {
        querySelectorAll(xml, 'PrimerRegistro').forEach(removeElement);
        const selectorsToValues: Array<[string, SimpleType, FormatAndValidationFunction]> = [
            ["RegistroAnterior>IDEmisorFactura", previousId.issuerIrsId, toNifStr],
            ["RegistroAnterior>NumSerieFactura", previousId.number, toStr60],
            ["RegistroAnterior>FechaExpedicionFactura", previousId.issuedTime, toDateString],
            ["RegistroAnterior>Huella", previousId.hash, toStr64],
        ];
        updateDocument(xml, selectorsToValues);
    } else {
        querySelectorAll(xml, 'RegistroAnterior').forEach(removeElement);
    }
}

async function generateHash(invoice: Invoice | CancelInvoice, dateGenReg: string, previousHash: string): Promise<string> {
    let hashString: string;
    
    if ('vatLines' in invoice) {
        // Invoice
        hashString = [
            `IDEmisorFactura=${invoice.issuer.irsId}`,
            `NumSerieFactura=${invoice.id.number}`,
            `FechaExpedicionFactura=${toDateString(invoice.id.issuedTime)}`,
            `TipoFactura=${invoice.type}`,
            `CuotaTotal=${round2ToString(invoice.amount)}`,
            `ImporteTotal=${round2ToString(invoice.total)}`,
            `Huella=${previousHash}`,
            `FechaHoraHusoGenRegistro=${dateGenReg}`,
        ].join("&");
    } else {
        // CancelInvoice
        hashString = [
            `IDEmisorFacturaAnulada=${invoice.issuer.irsId}`,
            `NumSerieFacturaAnulada=${invoice.id.number}`,
            `FechaExpedicionFacturaAnulada=${toDateString(invoice.id.issuedTime)}`,
            `Huella=${previousHash}`,
            `FechaHoraHusoGenRegistro=${dateGenReg}`,
        ].join("&");
    }
    
    const hash = crypto.createHash('sha256');
    hash.update(hashString, 'utf8');
    return hash.digest('hex');
}

function getText(xml: any, selector: string): string {
    const element = querySelector(xml, selector);
    return element ? element.textContent || '' : '';
}

function getVerifactuUrl(xml: any, isTesting = false): string {
    const prefix = isTesting
        ? "https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR"
        : "https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR";
    
    const issuer = getText(xml, "IDFactura>IDEmisorFactura");
    const number = getText(xml, "IDFactura>NumSerieFactura");
    const date = getText(xml, "IDFactura>FechaExpedicionFactura");
    const total = getText(xml, "ImporteTotal");
    const hash = getText(xml, "Huella");
    
    const params = new URLSearchParams({
        nif: issuer,
        num: number,
        fecha: date,
        importe: total,
        hash: hash.slice(-6) // últimos 6 caracteres del hash
    });
    
    return `${prefix}?${params.toString()}`;
}

function completeXml(xml: string, vat: string, name: string): string {
    return `<sum:RegFactuSistemaFacturacion
        xmlns:sum="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroLR.xsd"
        xmlns="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroInformacion.xsd">
        <sum:Cabecera>
            <ObligadoEmision>
                <NombreRazon>${name}</NombreRazon>
                <NIF>${vat}</NIF>
            </ObligadoEmision>
        </sum:Cabecera>
        ${xml}
    </sum:RegFactuSistemaFacturacion>`
        .replace(/>\s+</g, "><")
        .replace(/\s*xmlns/g, " xmlns");
}

function getChainInfo(xml: any): PreviousInvoiceId {
    function getIssuedDate(): Date {
        const d = getText(xml, "IDFactura>FechaExpedicionFactura");
        return new Date(d.split("-").reverse().join("-"));
    }
    
    return {
        issuerIrsId: getText(xml, "IDFactura>IDEmisorFactura"),
        issuedTime: getIssuedDate(),
        number: getText(xml, "IDFactura>NumSerieFactura"),
        hash: getText(xml, "Huella").replace(/\s/g, ""),
    };
}

function getCancelChainInfo(xml: any): PreviousInvoiceId {
    function getIssuedDate(): Date {
        const d = getText(xml, "IDFactura>FechaExpedicionFacturaAnulada");
        return new Date(d.split("-").reverse().join("-"));
    }
    
    return {
        issuerIrsId: getText(xml, "IDFactura>IDEmisorFacturaAnulada"),
        issuedTime: getIssuedDate(),
        number: getText(xml, "IDFactura>NumSerieFacturaAnulada"),
        hash: getText(xml, "Huella").replace(/\s/g, ""),
    };
}

function getWSInfo(isTesting: boolean): { wsld: string; endpoint: string } {
    const wsld = isTesting
        ? "https://prewww2.aeat.es/static_files/common/internet/dep/aplicaciones/es/aeat/tikeV1.0/cont/ws/SistemaFacturacion.wsdl"
        : "https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tikeV1.0/cont/ws/SistemaFacturacion.wsdl";
    
    const endpoint = isTesting
        ? "https://prewww2.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP"
        : "https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP";
    
    return { wsld, endpoint };
}

export async function createInvoice(
    invoice: Invoice,
    software: Software,
    previousId: PreviousInvoiceId | null = null,
    options: ToXmlOptions = {},
    isTesting = true
): Promise<VerifactuResult> {
    // Validaciones
    validateInvoice(invoice);
    validateSoftware(software);
    
    const dateGenReg = new Date().toISOString();
    const xml = new DOMParser().parseFromString(VERIFACTU_INVOICE_XML_BASE, "application/xml");
    
    // Datos básicos de la factura
    const selectorsToValues: Array<[string, SimpleType, FormatAndValidationFunction]> = [
        ["IDFactura>IDEmisorFactura", invoice.issuer.irsId, toNifStr],
        ["IDFactura>NumSerieFactura", invoice.id.number, toStr60],
        ["IDFactura>FechaExpedicionFactura", invoice.id.issuedTime, toDateString],
        ["NombreRazonEmisor", invoice.issuer.name, toStr120],
        ["TipoFactura", invoice.type, toString],
        ["DescripcionOperacion", invoice.description?.text || "", toStr500],
        ["EmitidaPorTerceroODestinatario", invoice.issuedBy || "N", toString],
        ["CuotaTotal", invoice.amount, round2ToString],
        ["ImporteTotal", invoice.total, round2ToString],
        ["FechaHoraHusoGenRegistro", dateGenReg, toStr30],
    ];
    
    updateDocument(xml, selectorsToValues);
    
    // Remove Tercero section if invoice is not issued by third party
    if ((invoice.issuedBy || "N") === "N") {
        const terceroElement = querySelector(xml, "Tercero");
        if (terceroElement) {
            removeElement(terceroElement);
        }
    }
    
    // Agregar destinatario si existe
    addRecipientToXml(xml, invoice.recipient);
    
    // Agregar líneas de IVA
    addVatLinesToXml(xml, invoice.vatLines);
    
    // Calcular y añadir información de retención IRPF
    let retentionAmount = 0;
    // if (invoice.retentionAmount !== undefined) {
    //     retentionAmount = invoice.retentionAmount;
    // } else if (invoice.retentionLines && invoice.retentionLines.length > 0) {
    //     const retentionLinesFull = completeRetentionLines(invoice.retentionLines);
    //     retentionAmount = computeRetentionTotal(retentionLinesFull);
    // }
    
    // Añadir retención al XML si es mayor que 0
    if (retentionAmount > 0) {
        const retentionElement = querySelector(xml, "RetencionSoportada");
        if (retentionElement) {
            retentionElement.textContent = round2ToString(retentionAmount);
        }
    } else {
        // Eliminar el elemento si no hay retención
        querySelectorAll(xml, "RetencionSoportada").forEach(removeElement);
    }
    
    // Agregar información del software
    addSoftwareToXml(xml, software);
    
    // Agregar información de encadenamiento
    addPreviousInvoiceToXml(xml, previousId);
    
    // Generar hash
    const previousHash = previousId?.hash || "";
    const hash = await generateHash(invoice, dateGenReg, previousHash);
    
    // Find the final Huella element (not the one inside RegistroAnterior)
    const huellaElements = querySelectorAll(xml, "Huella");
    const hashElement = huellaElements.find(el => {
        // Find the Huella that is NOT inside RegistroAnterior
        let parent = el.parentNode;
        while (parent) {
            if (parent.tagName === 'RegistroAnterior' || parent.localName === 'RegistroAnterior') {
                return false; // Skip this one, it's inside RegistroAnterior
            }
            parent = parent.parentNode;
        }
        return true; // This is the final Huella element
    });
    
    if (hashElement) {
        hashElement.textContent = hash;
    }
    
    // Generar QR code
    const url = getVerifactuUrl(xml, isTesting);
    const qrcodeData = await qrcode.toDataURL(url);
    
    // Obtener información de encadenamiento
    const chainInfo = getChainInfo(xml);
    
    // Convertir XML a string y codificar en base64
    const xmlString = completeXml(new XMLSerializer().serializeToString(xml), toNifStr(invoice.issuer.irsId), toStr60(invoice.issuer.name));
    const verifactuXml = Buffer.from(xmlString).toString('base64');
    const { wsld, endpoint } = getWSInfo(isTesting);

    return {
        qrcode: qrcodeData,
        chainInfo,
        verifactuXml,
        wsld,
        endpoint
    };
}

export async function cancelInvoice(
    cancelInvoice: CancelInvoice,
    software: Software,
    previousId: PreviousInvoiceId | null = null,
    options: ToXmlOptions = {},
    isTesting = true
): Promise<VerifactuResult> {
    // Validaciones
    validateCancelInvoice(cancelInvoice);
    validateSoftware(software);
    
    const dateGenReg = new Date().toISOString();
    const xml = new DOMParser().parseFromString(VERIFACTU_CANCEL_XML_BASE, "application/xml");
    
    // Datos básicos de la anulación
    const selectorsToValues: Array<[string, SimpleType, FormatAndValidationFunction]> = [
        ["IDFactura>IDEmisorFacturaAnulada", cancelInvoice.issuer.irsId, toNifStr],
        ["IDFactura>NumSerieFacturaAnulada", cancelInvoice.id.number, toStr60],
        ["IDFactura>FechaExpedicionFacturaAnulada", cancelInvoice.id.issuedTime, toDateString],
        ["FechaHoraHusoGenRegistro", dateGenReg, toStr30],
    ];
    
    updateDocument(xml, selectorsToValues);
    
    // Agregar información del software
    addSoftwareToXml(xml, software);
    
    // Agregar información de encadenamiento
    addPreviousInvoiceToXml(xml, previousId);
    
    // Generar hash
    const previousHash = previousId?.hash || "";
    const hash = await generateHash(cancelInvoice, dateGenReg, previousHash);
    
    // Find the final Huella element (not the one inside RegistroAnterior)
    const huellaElements = querySelectorAll(xml, "Huella");
    const hashElement = huellaElements.find(el => {
        // Find the Huella that is NOT inside RegistroAnterior
        let parent = el.parentNode;
        while (parent) {
            if (parent.tagName === 'RegistroAnterior' || parent.localName === 'RegistroAnterior') {
                return false; // Skip this one, it's inside RegistroAnterior
            }
            parent = parent.parentNode;
        }
        return true; // This is the final Huella element
    });
    
    if (hashElement) {
        hashElement.textContent = hash;
    }
    
    // Obtener información de encadenamiento para la anulación
    const chainInfo = getCancelChainInfo(xml);
    
    // Convertir XML a string y codificar en base64
    const xmlString = completeXml(new XMLSerializer().serializeToString(xml), toNifStr(cancelInvoice.issuer.irsId), toStr60(cancelInvoice.issuer.name));
    const verifactuXml = Buffer.from(xmlString).toString('base64');
    const { wsld, endpoint } = getWSInfo(isTesting);
    
    return {
        qrcode: null, // Las anulaciones no generan QR
        chainInfo,
        verifactuXml,
        wsld,
        endpoint
    };
}
