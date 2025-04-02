import { ContentType } from "../types/ContentType";

export interface Serializer {
  serialize(data: any): any;
  deserialize(data: any): any;
  contentType: ContentType;
}

export class JsonSerializer implements Serializer {
  contentType = ContentType.JSON;

  serialize(data: any): string {
    return JSON.stringify(data);
  }

  deserialize(data: string): any {
    if (typeof data === "string") {
      return JSON.parse(data);
    }
    return data;
  }
}

export class XmlSerializer implements Serializer {
  contentType = ContentType.XML;

  constructor(private rootName: string = "root") {}

  serialize(data: any): string {
    return this.objectToXml(data, this.rootName);
  }

  deserialize(data: string): any {
    // Implementação simples - em um caso real,
    // você usaria uma biblioteca como xml2js
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(data, "text/xml");
    return this.xmlToObject(xmlDoc.documentElement);
  }

  private objectToXml(obj: any, nodeName: string): string {
    if (obj === null || obj === undefined) {
      return `<${nodeName}></${nodeName}>`;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.objectToXml(item, "item")).join("");
    }

    if (typeof obj === "object") {
      let xml = `<${nodeName}>`;
      for (const prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          xml += this.objectToXml(obj[prop], prop);
        }
      }
      xml += `</${nodeName}>`;
      return xml;
    }

    return `<${nodeName}>${obj}</${nodeName}>`;
  }

  private xmlToObject(node: Element): any {
    // Implementação simples de conversão XML para objeto
    if (node.nodeType === Node.TEXT_NODE) {
      return node.nodeValue;
    }

    const obj: Record<string, any> = {};

    if (node.hasChildNodes()) {
      for (let i = 0; i < node.childNodes.length; i++) {
        const childNode = node.childNodes[i] as Element;
        if (childNode.nodeType !== Node.TEXT_NODE) {
          const childName = childNode.nodeName;

          // Se já existe uma propriedade com este nome, converte para array
          if (obj[childName]) {
            if (!Array.isArray(obj[childName])) {
              obj[childName] = [obj[childName]];
            }
            obj[childName].push(this.xmlToObject(childNode));
          } else {
            obj[childName] = this.xmlToObject(childNode);
          }
        } else if (childNode.nodeValue && childNode.nodeValue.trim() !== "") {
          return childNode.nodeValue.trim();
        }
      }
    }

    return obj;
  }
}

export class FormDataSerializer implements Serializer {
  contentType = ContentType.FORM_DATA;

  serialize(data: any): FormData {
    const formData = new FormData();

    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const value = data[key];

        if (value instanceof Blob || value instanceof File) {
          formData.append(key, value);
        } else if (Array.isArray(value)) {
          value.forEach((item) => formData.append(`${key}[]`, item));
        } else if (typeof value === "object" && value !== null) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    }

    return formData;
  }

  deserialize(data: any): any {
    return data; // FormData geralmente retorna JSON
  }
}

export class FormUrlencodedSerializer implements Serializer {
  contentType = ContentType.FORM_URLENCODED;

  serialize(data: any): string {
    const params = new URLSearchParams();

    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const value = data[key];

        if (Array.isArray(value)) {
          value.forEach((item) => params.append(`${key}[]`, String(item)));
        } else if (typeof value === "object" && value !== null) {
          params.append(key, JSON.stringify(value));
        } else {
          params.append(key, String(value));
        }
      }
    }

    return params.toString();
  }

  deserialize(data: any): any {
    return data; // URLEncoded geralmente retorna JSON
  }
}

export function getSerializer(
  contentType: ContentType,
  xmlRootName?: string,
): Serializer {
  switch (contentType) {
    case ContentType.XML:
      return new XmlSerializer(xmlRootName);
    case ContentType.FORM_DATA:
      return new FormDataSerializer();
    case ContentType.FORM_URLENCODED:
      return new FormUrlencodedSerializer();
    case ContentType.JSON:
    default:
      return new JsonSerializer();
  }
}

