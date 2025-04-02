export enum ContentType {
  JSON = 'application/json',
  XML = 'application/xml',
  FORM_DATA = 'multipart/form-data',
  FORM_URLENCODED = 'application/x-www-form-urlencoded',
  TEXT_PLAIN = 'text/plain',
  TEXT_HTML = 'text/html',
  BINARY = 'application/octet-stream'
}

export interface ContentTypeOptions {
  requestType: ContentType;
  responseType: ContentType;
  xmlRootName?: string; // Para requisições XML
}

export const defaultContentTypeOptions: ContentTypeOptions = {
  requestType: ContentType.JSON,
  responseType: ContentType.JSON
};