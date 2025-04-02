export class HttpError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly response?: any,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class NetworkError extends HttpError {
  constructor(message: string = "Network error occurred") {
    super(message, 0);
    this.name = "NetworkError";
  }
}

export class TimeoutError extends HttpError {
  constructor(message: string = "Request timeout") {
    super(message, 408);
    this.name = "TimeoutError";
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string = "Unauthorized access", response?: any) {
    super(message, 401, response);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string = "Forbidden access", response?: any) {
    super(message, 403, response);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string = "Resource not found", response?: any) {
    super(message, 404, response);
    this.name = "NotFoundError";
  }
}

export class ServerError extends HttpError {
  constructor(message: string = "Server error occurred", response?: any) {
    super(message, 500, response);
    this.name = "ServerError";
  }
}
