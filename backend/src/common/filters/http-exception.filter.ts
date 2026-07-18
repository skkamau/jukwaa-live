import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const details = this.getDetails(exception, statusCode);

    if (!(exception instanceof HttpException)) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(
        'Unexpected request failure',
        process.env.NODE_ENV === 'production' ? undefined : stack,
      );
    }

    const body: ErrorResponseBody = {
      statusCode,
      error: details.error,
      message: details.message,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
    };

    response.status(statusCode).json(body);
  }

  private getDetails(
    exception: unknown,
    statusCode: number,
  ): Pick<ErrorResponseBody, 'error' | 'message'> {
    if (!(exception instanceof HttpException)) {
      return {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
    }

    const exceptionResponse = exception.getResponse();
    const defaultError = HttpStatus[statusCode] ?? 'Error';

    if (typeof exceptionResponse === 'string') {
      return { error: defaultError, message: exceptionResponse };
    }

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const payload = exceptionResponse as {
        error?: string;
        message?: string | string[];
      };
      return {
        error: payload.error ?? defaultError,
        message: payload.message ?? exception.message,
      };
    }

    return { error: defaultError, message: exception.message };
  }
}
