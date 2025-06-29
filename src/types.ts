// Types específicos para VeriFacTu
export type VatKey = "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09" | "10" | "11" | "12" | "13" | "14" | "15" | "16" | "17" | "18" | "19" | "20" | "21" | "22" | "23" | "24" | "25" | "26" | "27" | "28" | "29" | "30" | "31" | "32" | "33" | "34" | "35" | "36" | "37" | "38" | "39" | "40" | "41" | "42" | "43" | "44" | "45" | "46" | "47" | "48" | "49" | "50" | "51" | "52";

export type VatExemptReason = "E1" | "E2" | "E3" | "E4" | "E5" | "E6";

export type VatType = "S1" | "S2";

export type VatNotSubjectReason = "N1" | "N2";

export type CountryCode = "AD" | "AE" | "AF" | "AG" | "AI" | "AL" | "AM" | "AO" | "AQ" | "AR" | "AS" | "AT" | "AU" | "AW" | "AX" | "AZ" | "BA" | "BB" | "BD" | "BE" | "BF" | "BG" | "BH" | "BI" | "BJ" | "BL" | "BM" | "BN" | "BO" | "BQ" | "BR" | "BS" | "BT" | "BV" | "BW" | "BY" | "BZ" | "CA" | "CC" | "CD" | "CF" | "CG" | "CH" | "CI" | "CK" | "CL" | "CM" | "CN" | "CO" | "CR" | "CU" | "CV" | "CW" | "CX" | "CY" | "CZ" | "DE" | "DJ" | "DK" | "DM" | "DO" | "DZ" | "EC" | "EE" | "EG" | "EH" | "ER" | "ES" | "ET" | "FI" | "FJ" | "FK" | "FM" | "FO" | "FR" | "GA" | "GB" | "GD" | "GE" | "GF" | "GG" | "GH" | "GI" | "GL" | "GM" | "GN" | "GP" | "GQ" | "GR" | "GS" | "GT" | "GU" | "GW" | "GY" | "HK" | "HM" | "HN" | "HR" | "HT" | "HU" | "ID" | "IE" | "IL" | "IM" | "IN" | "IO" | "IQ" | "IR" | "IS" | "IT" | "JE" | "JM" | "JO" | "JP" | "KE" | "KG" | "KH" | "KI" | "KM" | "KN" | "KP" | "KR" | "KW" | "KY" | "KZ" | "LA" | "LB" | "LC" | "LI" | "LK" | "LR" | "LS" | "LT" | "LU" | "LV" | "LY" | "MA" | "MC" | "MD" | "ME" | "MF" | "MG" | "MH" | "MK" | "ML" | "MM" | "MN" | "MO" | "MP" | "MQ" | "MR" | "MS" | "MT" | "MU" | "MV" | "MW" | "MX" | "MY" | "MZ" | "NA" | "NC" | "NE" | "NF" | "NG" | "NI" | "NL" | "NO" | "NP" | "NR" | "NU" | "NZ" | "OM" | "PA" | "PE" | "PF" | "PG" | "PH" | "PK" | "PL" | "PM" | "PN" | "PR" | "PS" | "PT" | "PW" | "PY" | "QA" | "RE" | "RO" | "RS" | "RU" | "RW" | "SA" | "SB" | "SC" | "SD" | "SE" | "SG" | "SH" | "SI" | "SJ" | "SK" | "SL" | "SM" | "SN" | "SO" | "SR" | "SS" | "ST" | "SV" | "SX" | "SY" | "SZ" | "TC" | "TD" | "TF" | "TG" | "TH" | "TJ" | "TK" | "TL" | "TM" | "TN" | "TO" | "TR" | "TT" | "TV" | "TW" | "TZ" | "UA" | "UG" | "UM" | "US" | "UY" | "UZ" | "VA" | "VC" | "VE" | "VG" | "VI" | "VN" | "VU" | "WF" | "WS" | "YE" | "YT" | "ZA" | "ZM" | "ZW";

export type IrsIdType = "02" | "03" | "04" | "05" | "06" | "07";

export type InvoiceType = "F1" | "F2" | "F3" | "R1" | "R2" | "R3" | "R4" | "R5";

export type CreditNoteType = "S" | "I";

export type IssuedBy = "N" | "T" | "D";

export type TaxType = "01" | "02" | "03" | "05";

export interface InvoiceId {
    number: string;
    issuedTime: Date;
    replacement?: boolean; // Indicates if this is a replacement (subsanación) invoice
}

export interface PreviousInvoiceId {
    issuerIrsId: string;
    number: string;
    issuedTime: Date;
    hash: string;
}

export interface Issuer {
    irsId: string;
    name: string;
}

export interface PartnerIrs {
    irsId: string;
    name: string;
    country?: CountryCode;
}

export interface PartnerOther {
    idType: IrsIdType;
    id: string;
    name: string;
    country: CountryCode;
}

export type Partner = PartnerIrs | PartnerOther;

export interface InvoiceDescription {
    text: string;
    operationDate?: Date;
}

export interface VatLine {
    base: number;
    rate: number;
    amount?: number;
    rate2?: number;
    amount2?: number;
    vatOperation: VatExemptReason | VatType | VatNotSubjectReason;
    vatKey: VatKey;
    tax?: TaxType;
    isUsingSimplifiedRegime?: boolean;
}

export interface CreditNote {
    ids: InvoiceId[];
    style: CreditNoteType;
    creditBase?: number;
    creditVat?: number;
}

export interface Invoice {
    issuer: Issuer;
    recipient?: Partner;
    id: InvoiceId;
    type: InvoiceType;
    replacedTicketIds?: InvoiceId[];
    creditNote?: CreditNote;
    description?: InvoiceDescription;
    vatLines: VatLine[];
    amount: number;
    total: number;
    issuedBy?: IssuedBy;
    isFix?: boolean;
    previousRejection?: boolean;
}

/**
 * Invoice line details (for complex invoices with line breakdown)
 */
export interface InvoiceLine {
  /** Base amount for the line */
  base: number;
  /** Description of the line item */
  description?: string;
  /** Quantity of items (if applicable) */
  quantity?: number;
  /** Unit of measure (if applicable) */
  unitMeasure?: string;
  /** Unit price */
  unitPrice: number;
  /** Total amount for the line (calculated as base * quantity) */
  totalAmount: number;
  /** VAT lines applicable to this invoice line */
  vatLines: VatLine[];
}

export interface CancelInvoice {
    id: InvoiceId;
    issuer: Issuer;
    issuedBy?: IssuedBy;
}

export interface Software {
    developerName: string;
    developerIrsId: string;
    name: string;
    id: string;
    version: string;
    number: string;
    useOnlyVerifactu: boolean;
    useMulti: boolean;
    useCurrentMulti: boolean;
}

export interface ToXmlOptions {
    deviceId?: string;
}

export interface VerifactuResult {
    qrcode: string | null;
    chainInfo: PreviousInvoiceId;
    verifactuXml: string; // XML codificado en base64
    wsld: string; // URL del WSDL del servicio
    endpoint: string; // URL del endpoint del servicio
    hash: string; // Hash del XML
}
