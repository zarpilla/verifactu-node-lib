// Utilidades básicas para el procesamiento XML y formateo
export type SimpleType = string | number | Date | boolean | undefined | null;

export type FormatAndValidationFunction = (input: SimpleType) => string;

// Tipos simples para evitar conflictos entre xmldom y DOM nativo
export interface XmlDocument {
    documentElement: any;
}

export interface XmlElement {
    nodeType: number;
    tagName: string;
    localName?: string;
    textContent: string | null;
    childNodes: any[];
    parentNode?: any;
    appendChild(child: any): void;
    removeChild(child: any): void;
}

export function toStringMaxLength(maxLength: number): FormatAndValidationFunction {
    return (input: SimpleType): string => {
        if (input === undefined || input === null) {
            return "";
        }
        const str = String(input);
        if (str.length > maxLength) {
            throw new Error(`String exceeds maximum length of ${maxLength}: ${str}`);
        }
        return str;
    };
}

export function toStringRegexp(regexp: RegExp): FormatAndValidationFunction {
    return (input: SimpleType): string => {
        if (input === undefined || input === null) {
            return "";
        }
        const str = String(input);
        if (!regexp.test(str)) {
            throw new Error(`String does not match required pattern: ${str}`);
        }
        return str;
    };
}

export function round2ToString(input: SimpleType): string {
    if (input === undefined || input === null) {
        return "";
    }
    const num = Number(input);
    if (isNaN(num)) {
        throw new Error(`Invalid number: ${input}`);
    }
    return num.toFixed(2);
}

export function toDateString(input: SimpleType): string {
    if (input === undefined || input === null) {
        return "";
    }
    
    let date: Date;
    if (input instanceof Date) {
        date = input;
    } else {
        date = new Date(String(input));
    }
    
    if (isNaN(date.getTime())) {
        throw new Error(`Invalid date: ${input}`);
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
}

export function toString(input: SimpleType): string {
    if (input === undefined || input === null) {
        return "";
    }
    return String(input);
}

export function toBooleanString(input: SimpleType): string {
    if (input === undefined || input === null) {
        return "";
    }
    return input ? "S" : "N";
}

// Validadores específicos
export const toStr2 = toStringMaxLength(2);
export const toStr20 = toStringMaxLength(20);
export const toStr30 = toStringMaxLength(30);
export const toStr50 = toStringMaxLength(50);
export const toStr60 = toStringMaxLength(60);
export const toStr64 = toStringMaxLength(64);
export const toStr100 = toStringMaxLength(100);
export const toStr120 = toStringMaxLength(120);
export const toStr500 = toStringMaxLength(500);

export const toNifStr = toStringRegexp(
    /^(([a-z|A-Z]{1}\d{7}[a-z|A-Z]{1})|(\d{8}[a-z|A-Z]{1})|([a-z|A-Z]{1}\d{8}))$/
);

// Función para buscar elementos en el DOM XML - versión optimizada sin bucles infinitos
export function querySelector(doc: any, selector: string): any {
    // Para selectores simples (sin >), buscar recursivamente
    if (!selector.includes('>')) {
        return findElementByNameRecursive(doc.documentElement, selector);
    }
    
    const parts = selector.split('>').map(part => part.trim());
    let current: any = doc.documentElement;
    
    for (const part of parts) {
        if (!current) return null;
        // For nested selectors, search only in direct children first, then fallback to recursive
        current = findElementByName(current, part) || findElementByNameRecursive(current, part);
    }
    
    return current;
}

// Función auxiliar para buscar elementos por nombre SOLO en hijos directos
function findElementByName(parent: any, name: string): any {
    if (!parent || !parent.childNodes) return null;
    
    const children = parent.childNodes;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.nodeType === 1) { // ELEMENT_NODE
            const tagName = child.tagName || '';
            const localName = child.localName || tagName;
            
            // Comparar el nombre sin namespace
            if (localName === name || tagName === name || tagName.endsWith(':' + name)) {
                return child;
            }
        }
    }
    return null;
}

// Función para buscar recursivamente en todo el árbol (solo para selectores simples)
function findElementByNameRecursive(parent: any, name: string, visited = new Set()): any {
    if (!parent || visited.has(parent)) return null;
    visited.add(parent);
    
    // Primero verificar si el padre mismo coincide
    if (parent.nodeType === 1) {
        const tagName = parent.tagName || '';
        const localName = parent.localName || tagName;
        
        if (localName === name || tagName === name || tagName.endsWith(':' + name)) {
            return parent;
        }
    }
    
    // Luego buscar recursivamente en todos los descendientes
    if (parent.childNodes) {
        const children = parent.childNodes;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child.nodeType === 1 && !visited.has(child)) { // ELEMENT_NODE
                const found = findElementByNameRecursive(child, name, visited);
                if (found) return found;
            }
        }
    }
    
    return null;
}

export function querySelectorAll(doc: any, selector: string): any[] {
    const elements: any[] = [];
    
    function findElements(element: any): void {
        if (element.nodeType === 1) { // ELEMENT_NODE
            const tagName = element.tagName || '';
            const localName = element.localName || tagName;
            
            if (localName === selector || tagName === selector || tagName.endsWith(':' + selector)) {
                elements.push(element);
            }
        }
        
        const children = element.childNodes || [];
        for (let i = 0; i < children.length; i++) {
            if (children[i].nodeType === 1) { // ELEMENT_NODE
                findElements(children[i]);
            }
        }
    }
    
    if (doc.documentElement) {
        findElements(doc.documentElement);
    }
    
    return elements;
}

export function updateDocument(
    doc: any,
    selectorsToValues: Array<[string, SimpleType, FormatAndValidationFunction]>
): void {
    for (const [selector, value, convert] of selectorsToValues) {
        const node = querySelector(doc, selector);
        if (node) {
            if (undefined === value && node.parentNode) {
                node.parentNode.removeChild(node);
            } else {
                node.textContent = convert(value);
            }
        }
    }
}

export function removeElement(e: any): boolean {
    if (e.parentNode) {
        e.parentNode.removeChild(e);
        return true;
    }
    return false;
}
