import {
  createVerifactuInvoice,
  cancelVerifactuInvoice,
  Invoice,
  CancelInvoice,
  Software,
  PreviousInvoiceId,
} from "../src/index";
import { DOMParser } from "xmldom";

function isValidXML(xmlString: string): boolean {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, "text/xml");

    // Check for parsing errors
    const parseErrors = doc.getElementsByTagName("parsererror");
    if (parseErrors.length > 0) {
      console.error("XML Parse Error:", parseErrors[0].textContent);
      return false;
    }

    return true;
  } catch (error) {
    console.error("XML Validation Error:", error);
    return false;
  }
}

describe("VeriFacTu Library", () => {
  const software: Software = {
    developerName: "Test Developer",
    developerIrsId: "B00000000",
    name: "Test Software",
    id: "TEST_ID",
    version: "1.0.0",
    number: "12345",
    useOnlyVerifactu: true,
    useMulti: true,
    useCurrentMulti: false,
  };

  const previousId: PreviousInvoiceId = {
    issuerIrsId: "99999990S",
    number: "TEST/099",
    issuedTime: new Date("2024-03-17T12:00:00.000Z"),
    hash: "9bf7ced3e03cd19d8ac807fa2a6dc9dac8e7426bd8515646ba7ba91089dc0ca3",
  };

  describe("createVerifactuInvoice", () => {
    it("should create a valid invoice", async () => {
      const invoice: Invoice = {
        issuer: {
          irsId: "99999990S",
          name: "Test Company S.L.",
        },
        recipient: {
          irsId: "B00000000",
          name: "ACME Inc.",
          country: "ES",
        },
        id: {
          number: "TEST/100",
          issuedTime: new Date("2024-03-18T12:00:00.000Z"),
        },
        type: "F1",
        description: {
          text: "Test invoice",
          operationDate: new Date("2024-03-18T12:00:00.000Z"),
        },
        vatLines: [
          {
            vatOperation: "S1",
            base: 100,
            rate: 21,
            amount: 21,
            vatKey: "01",
          },
        ],
        total: 121,
        amount: 21,
      };

      const result = await createVerifactuInvoice(
        invoice,
        software,
        previousId
      );

      expect(result).toBeDefined();
      expect(result.qrcode).toBeTruthy();
      expect(result.chainInfo).toBeDefined();
      expect(result.verifactuXml).toBeTruthy();
      expect(result.chainInfo.issuerIrsId).toBe(invoice.issuer.irsId);
      expect(result.chainInfo.number).toBe(invoice.id.number);

      // Validate that no placeholder values remain in the XML
      const xmlDecoded = Buffer.from(result.verifactuXml, "base64").toString(
        "utf8"
      );
      expect(xmlDecoded).not.toContain("????");

      // Validate that verifactuXml is valid XML
      expect(isValidXML(xmlDecoded)).toBe(true);

      // Additional XML structure validation
      expect(xmlDecoded).toContain('<?xml version="1.0" encoding="UTF-8"?>');      
    });

    it("should create a valid first invoice", async () => {
      const invoice: Invoice = {
        issuer: {
          irsId: "99999990S",
          name: "Test Company S.L.",
        },
        recipient: {
          irsId: "B00000000",
          name: "ACME Inc.",
          country: "ES",
        },
        id: {
          number: "TEST/001",
          issuedTime: new Date("2024-03-18T12:00:00.000Z"),
        },
        type: "F1",
        description: {
          text: "First invoice in chain",
          operationDate: new Date("2024-03-18T12:00:00.000Z"),
        },
        vatLines: [
          {
            vatOperation: "S1",
            base: 100,
            rate: 21,
            amount: 21,
            vatKey: "01",
          },
        ],
        total: 121,
        amount: 21,
      };

      // Create first invoice without previousId
      const result = await createVerifactuInvoice(invoice, software);

      expect(result).toBeDefined();
      expect(result.qrcode).toBeTruthy();
      expect(result.chainInfo).toBeDefined();
      expect(result.verifactuXml).toBeTruthy();
      expect(result.chainInfo.issuerIrsId).toBe(invoice.issuer.irsId);
      expect(result.chainInfo.number).toBe(invoice.id.number);

      // Validate that no placeholder values remain in the XML
      const xmlDecoded = Buffer.from(result.verifactuXml, "base64").toString(
        "utf8"
      );
      expect(xmlDecoded).not.toContain("????");

      // Validate that verifactuXml is valid XML
      expect(isValidXML(xmlDecoded)).toBe(true);

      // Validate that this is a first invoice (should contain PrimerRegistro)
      expect(xmlDecoded).toContain(
        "<sum1:PrimerRegistro>S</sum1:PrimerRegistro>"
      );
      expect(xmlDecoded).not.toContain("<sum1:RegistroAnterior>");
    });

    it("should create a valid simplified invoice", async () => {
      const simplifiedInvoice: Invoice = {
        issuer: {
          irsId: "99999990S",
          name: "Test Company S.L.",
        },
        // No recipient for simplified invoice
        id: {
          number: "SIMP/001",
          issuedTime: new Date("2024-03-18T14:00:00.000Z"),
        },
        type: "F2", // Simplified invoice type
        description: {
          text: "Simplified invoice test",
        },
        vatLines: [
          {
            vatOperation: "S1",
            base: 50,
            rate: 21,
            amount: 10.5,
            vatKey: "01",
          },
        ],
        total: 60.5,
        amount: 10.5,
      };

      const result = await createVerifactuInvoice(simplifiedInvoice, software);

      expect(result).toBeDefined();
      expect(result.qrcode).toBeTruthy();
      expect(result.chainInfo).toBeDefined();
      expect(result.verifactuXml).toBeTruthy();
      expect(result.chainInfo.issuerIrsId).toBe(simplifiedInvoice.issuer.irsId);
      expect(result.chainInfo.number).toBe(simplifiedInvoice.id.number);

      // Validate that no placeholder values remain in the XML
      const xmlDecoded = Buffer.from(result.verifactuXml, "base64").toString(
        "utf8"
      );
      expect(xmlDecoded).not.toContain("????");

      // Validate that verifactuXml is valid XML
      expect(isValidXML(xmlDecoded)).toBe(true);

      // Validate that it's a simplified invoice (F2 type)
      expect(xmlDecoded).toContain("<sum1:TipoFactura>F2</sum1:TipoFactura>");
      // Simplified invoices should not have Destinatarios section
      expect(xmlDecoded).not.toContain("<sum1:Destinatarios>");
    });

    it("should throw error for invalid invoice", async () => {
      const invalidInvoice = {} as Invoice;

      await expect(
        createVerifactuInvoice(invalidInvoice, software)
      ).rejects.toThrow();
    });
  });

  describe("cancelVerifactuInvoice", () => {
    it("should cancel an invoice", async () => {
      const cancelInvoice: CancelInvoice = {
        issuer: {
          irsId: "99999990S",
          name: "Test Company S.L.",
        },
        id: {
          number: "TEST/100",
          issuedTime: new Date("2024-03-18T12:00:00.000Z"),
        },
      };

      const result = await cancelVerifactuInvoice(
        cancelInvoice,
        software,
        previousId
      );

      expect(result).toBeDefined();
      expect(result.qrcode).toBeNull();
      expect(result.chainInfo).toBeDefined();
      expect(result.verifactuXml).toBeTruthy();
      expect(result.chainInfo.issuerIrsId).toBe(cancelInvoice.issuer.irsId);
      expect(result.chainInfo.number).toBe(cancelInvoice.id.number);

      // Validate that no placeholder values remain in the XML
      const xmlDecoded = Buffer.from(result.verifactuXml, "base64").toString(
        "utf8"
      );
      expect(xmlDecoded).not.toContain("????");

      // Validate that verifactuXml is valid XML
      expect(isValidXML(xmlDecoded)).toBe(true);
    });

    it("should throw error for invalid cancel invoice", async () => {
      const invalidCancelInvoice = {} as CancelInvoice;

      await expect(
        cancelVerifactuInvoice(invalidCancelInvoice, software)
      ).rejects.toThrow();
    });
  });
});
