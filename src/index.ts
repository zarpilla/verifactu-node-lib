// Exportar todos los tipos
export * from "./types";

// Importar y re-exportar las funciones principales
import { createInvoice, cancelInvoice } from "./verifactu";

// Exportar funciones principales con nombres más claros
export const createVerifactuInvoice = createInvoice;
export const cancelVerifactuInvoice = cancelInvoice;

// También exportar las funciones originales
export { createInvoice, cancelInvoice } from "./verifactu";
