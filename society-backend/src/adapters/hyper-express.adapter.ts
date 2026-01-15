import {
  Logger,
  RequestMethod,
  StreamableFile,
  VersioningOptions,
  VersioningType,
  VERSION_NEUTRAL,
  INestApplication,
} from '@nestjs/common';
import { AbstractHttpAdapter } from '@nestjs/core/adapters/http-adapter';
import {
  CorsOptions,
  CorsOptionsDelegate,
} from '@nestjs/common/interfaces/external/cors-options.interface';
import { NestApplicationOptions } from '@nestjs/common/interfaces/nest-application-options.interface';
import type { VersionValue } from '@nestjs/common/interfaces';
import * as HyperExpress from 'hyper-express';
import { Readable } from 'stream';

// Utility functions
const isUndefined = (obj: unknown): obj is undefined =>
  typeof obj === 'undefined';

const isNil = (val: unknown): val is null | undefined =>
  isUndefined(val) || val === null;

const isString = (val: unknown): val is string => typeof val === 'string';

// Types
type VersionedRoute = (
  req: HyperExpressRequest,
  res: HyperExpressResponse,
  next: () => void,
) => Function;

type HyperExpressRequest = HyperExpress.Request;
type HyperExpressResponse = HyperExpress.Response;
type HyperExpressServer = HyperExpress.Server;

export interface HyperExpressAdapterOptions {
  key_file_name?: string;
  cert_file_name?: string;
  passphrase?: string;
  dh_params_file_name?: string;
  ssl_prefer_low_memory_usage?: boolean;
  fast_buffers?: boolean;
  fast_abort?: boolean;
  max_body_buffer?: number;
  max_body_length?: number;
  auto_close?: boolean;
  trust_proxy?: boolean;
}

export type NestHyperExpressApplication = INestApplication<HyperExpress.Server>;

export class HyperExpressAdapter extends AbstractHttpAdapter<
  HyperExpressServer,
  HyperExpressRequest,
  HyperExpressResponse
> {
  private readonly logger = new Logger(HyperExpressAdapter.name);
  private isParserRegistered = false;
  // Track response headers since HyperExpress doesn't provide a getHeader method
  private readonly responseHeaders = new WeakMap<
    HyperExpressResponse,
    Map<string, string>
  >();
  private readonly routerMethodMap = new Map<RequestMethod, string>([
    [RequestMethod.GET, 'get'],
    [RequestMethod.POST, 'post'],
    [RequestMethod.PUT, 'put'],
    [RequestMethod.DELETE, 'delete'],
    [RequestMethod.PATCH, 'patch'],
    [RequestMethod.OPTIONS, 'options'],
    [RequestMethod.HEAD, 'head'],
    [RequestMethod.ALL, 'any'],
  ]);

  constructor(options?: HyperExpressAdapterOptions) {
    super();
    const instance = new HyperExpress.Server(options);
    this.setInstance(instance);
  }

  public listen(port: string | number, callback?: () => void): void;
  public listen(
    port: string | number,
    hostname: string,
    callback?: () => void,
  ): void;
  public listen(port: unknown, ...args: unknown[]): void {
    const host = typeof args[0] === 'string' ? args[0] : '0.0.0.0';
    const callback =
      typeof args[0] === 'function'
        ? args[0]
        : typeof args[1] === 'function'
          ? args[1]
          : undefined;

    this.instance
      .listen(Number(port), host)
      .then(() => {
        this.logger.log(`Server listening on ${host}:${port}`);
        if (callback) {
          (callback as () => void)();
        }
      })
      .catch((error: Error) => {
        this.logger.error(`Failed to listen on ${host}:${port}`, error.stack);
        throw error;
      });
  }

  public close(): Promise<void> {
    return new Promise((resolve) => {
      this.instance.close();
      resolve();
    });
  }

  public initHttpServer(options: NestApplicationOptions): void {
    this.httpServer = this.instance;
  }

  public init(): Promise<void> {
    // Initialization hook called by NestJS application
    // HyperExpress doesn't require async initialization
    return Promise.resolve();
  }

  public useStaticAssets(
    path: string,
    options?: Record<string, unknown>,
  ): void {
    this.logger.warn(
      'Static assets serving is not natively supported by HyperExpress adapter. ' +
        'Consider using LiveDirectory from hyper-express or a reverse proxy.',
    );
  }

  public setViewEngine(engine: string): void {
    this.logger.warn(
      'View engine is not supported by HyperExpress adapter. ' +
        'Consider using a dedicated template library.',
    );
  }

  public getRequestHostname(request: HyperExpressRequest): string {
    return request.headers['host'] || '';
  }

  public getRequestMethod(request: HyperExpressRequest): string {
    return request.method;
  }

  public getRequestUrl(request: HyperExpressRequest): string {
    return request.url;
  }

  public status(
    response: HyperExpressResponse,
    statusCode: number,
  ): HyperExpressResponse {
    response.status(statusCode);
    return response;
  }

  public reply(
    response: HyperExpressResponse,
    body: unknown,
    statusCode?: number,
  ): void {
    if (statusCode) {
      response.status(statusCode);
    }

    if (isNil(body)) {
      response.send('');
      return;
    }

    if (body instanceof StreamableFile) {
      const streamHeaders = body.getHeaders();
      if (
        this.getHeader(response, 'Content-Type') === undefined &&
        streamHeaders.type !== undefined
      ) {
        response.type(streamHeaders.type);
      }
      if (
        this.getHeader(response, 'Content-Disposition') === undefined &&
        streamHeaders.disposition !== undefined
      ) {
        response.header('Content-Disposition', streamHeaders.disposition);
      }
      if (
        this.getHeader(response, 'Content-Length') === undefined &&
        streamHeaders.length !== undefined
      ) {
        response.header('Content-Length', String(streamHeaders.length));
      }
      response.stream(body.getStream());
      return;
    }

    if (body instanceof Readable) {
      response.stream(body);
      return;
    }

    if (Buffer.isBuffer(body)) {
      if (this.getHeader(response, 'Content-Type') === undefined) {
        response.type('application/octet-stream');
      }
      response.send(body);
      return;
    }

    if (isString(body)) {
      response.send(body);
      return;
    }

    response.json(body);
  }

  public end(response: HyperExpressResponse, message?: string): void {
    response.send(message || '');
  }

  public render(
    response: HyperExpressResponse,
    view: string,
    options: unknown,
  ): void {
    this.logger.warn('Render is not supported by HyperExpress adapter.');
    response.status(500).send('Render not supported');
  }

  public redirect(
    response: HyperExpressResponse,
    statusCode: number,
    url: string,
  ): void {
    response.status(statusCode).redirect(url);
  }

  public setErrorHandler(
    handler: (
      error: Error,
      request: HyperExpressRequest,
      response: HyperExpressResponse,
    ) => void,
  ): void {
    this.instance.set_error_handler(
      (
        request: HyperExpressRequest,
        response: HyperExpressResponse,
        error: Error,
      ) => {
        handler(error, request, response);
      },
    );
  }

  public setNotFoundHandler(
    handler: (
      request: HyperExpressRequest,
      response: HyperExpressResponse,
    ) => void,
  ): void {
    this.instance.set_not_found_handler(handler);
  }

  public isHeadersSent(response: HyperExpressResponse): boolean {
    return response.initiated || response.completed;
  }

  public getHeader(
    response: HyperExpressResponse,
    name: string,
  ): string | undefined {
    const headers = this.responseHeaders.get(response);
    return headers?.get(name.toLowerCase());
  }

  public setHeader(
    response: HyperExpressResponse,
    name: string,
    value: string,
  ): HyperExpressResponse {
    // Track the header in our WeakMap
    let headers = this.responseHeaders.get(response);
    if (!headers) {
      headers = new Map<string, string>();
      this.responseHeaders.set(response, headers);
    }
    headers.set(name.toLowerCase(), value);

    response.header(name, value);
    return response;
  }

  public appendHeader(
    response: HyperExpressResponse,
    name: string,
    value: string,
  ): HyperExpressResponse {
    // Track the header in our WeakMap (append by concatenating with comma)
    let headers = this.responseHeaders.get(response);
    if (!headers) {
      headers = new Map<string, string>();
      this.responseHeaders.set(response, headers);
    }
    const existing = headers.get(name.toLowerCase());
    headers.set(name.toLowerCase(), existing ? `${existing}, ${value}` : value);

    response.header(name, value, false);
    return response;
  }

  public registerParserMiddleware(prefix?: string, rawBody?: boolean): void {
    if (this.isParserRegistered) {
      return;
    }
    this.isParserRegistered = true;
    // HyperExpress handles body parsing via request.json(), request.text(), etc.
    // No explicit middleware needed
  }

  public enableCors(
    options: CorsOptions | CorsOptionsDelegate<HyperExpressRequest>,
  ): void {
    const corsOptions = typeof options === 'function' ? {} : options;
    const origin = (corsOptions as CorsOptions).origin || '*';
    const methods = (corsOptions as CorsOptions).methods || [
      'GET',
      'HEAD',
      'PUT',
      'PATCH',
      'POST',
      'DELETE',
    ];
    const credentials = (corsOptions as CorsOptions).credentials || false;
    const allowedHeaders = (corsOptions as CorsOptions).allowedHeaders || [];
    const exposedHeaders = (corsOptions as CorsOptions).exposedHeaders || [];
    const maxAge = (corsOptions as CorsOptions).maxAge || 86400;

    this.instance.use(
      async (
        request: HyperExpressRequest,
        response: HyperExpressResponse,
        next: () => void,
      ) => {
        const requestOrigin = request.headers['origin'];

        // Handle origin
        let allowOrigin = '*';
        if (typeof origin === 'string') {
          allowOrigin = origin;
        } else if (Array.isArray(origin)) {
          if (requestOrigin && origin.includes(requestOrigin)) {
            allowOrigin = requestOrigin;
          }
        } else if (typeof origin === 'function') {
          try {
            await new Promise<void>((resolve) => {
              (
                origin as (
                  origin: string | undefined,
                  callback: (err: Error | null, allow?: boolean) => void,
                ) => void
              )(requestOrigin, (err, allow) => {
                if (!err && allow) {
                  allowOrigin = requestOrigin || '*';
                }
                resolve();
              });
            });
          } catch (error) {
            this.logger.warn(
              `CORS origin callback failed for origin "${requestOrigin}": ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
          }
        }

        response.header('Access-Control-Allow-Origin', allowOrigin);

        if (credentials) {
          response.header('Access-Control-Allow-Credentials', 'true');
        }

        // Handle preflight
        if (request.method === 'OPTIONS') {
          response.header(
            'Access-Control-Allow-Methods',
            Array.isArray(methods) ? methods.join(',') : String(methods),
          );

          if ((allowedHeaders as string[]).length > 0) {
            response.header(
              'Access-Control-Allow-Headers',
              Array.isArray(allowedHeaders)
                ? (allowedHeaders as string[]).join(',')
                : String(allowedHeaders),
            );
          } else {
            const requestHeaders =
              request.headers['access-control-request-headers'];
            if (requestHeaders) {
              response.header('Access-Control-Allow-Headers', requestHeaders);
            }
          }

          if ((exposedHeaders as string[]).length > 0) {
            response.header(
              'Access-Control-Expose-Headers',
              Array.isArray(exposedHeaders)
                ? (exposedHeaders as string[]).join(',')
                : String(exposedHeaders),
            );
          }

          response.header('Access-Control-Max-Age', String(maxAge));
          response.status(204).send('');
          return;
        }

        next();
      },
    );
  }

  public createMiddlewareFactory(
    requestMethod: RequestMethod,
  ): (path: string, callback: Function) => void {
    return (path: string, callback: Function) => {
      const routeMethod = this.routerMethodMap.get(requestMethod) || 'any';
      const normalizedPath = this.normalizePath(path);

      (this.instance as unknown as Record<string, Function>)[routeMethod](
        normalizedPath,
        async (
          request: HyperExpressRequest,
          response: HyperExpressResponse,
          next: () => void,
        ) => {
          await callback(request, response, next);
        },
      );
    };
  }

  public getType(): string {
    return 'hyper-express';
  }

  public applyVersionFilter(
    handler: Function,
    version: VersionValue,
    versioningOptions: VersioningOptions,
  ): VersionedRoute {
    // Required by NestJS AbstractHttpAdapter interface - req/res params needed for signature compatibility
    const callNextHandler: VersionedRoute = (
      req: HyperExpressRequest,
      res: HyperExpressResponse,
      next: () => void,
    ) => {
      if (!next) {
        throw new Error('HTTP adapter does not support version filtering');
      }
      return next as unknown as Function;
    };

    if (
      version === VERSION_NEUTRAL ||
      !versioningOptions ||
      versioningOptions.type === VersioningType.URI
    ) {
      return handler as VersionedRoute;
    }

    // Header versioning
    if (versioningOptions.type === VersioningType.HEADER) {
      const headerKey = versioningOptions.header || 'X-API-Version';
      return (req, res, next) => {
        const requestVersion = req.headers[headerKey.toLowerCase()] as
          | string
          | undefined;

        if (Array.isArray(version)) {
          if (version.includes(requestVersion as string)) {
            return handler(req, res, next);
          }
        } else if (requestVersion === version) {
          return handler(req, res, next);
        }
        return callNextHandler(req, res, next);
      };
    }

    // Media type versioning
    if (versioningOptions.type === VersioningType.MEDIA_TYPE) {
      const key = versioningOptions.key || 'v=';
      return (req, res, next) => {
        const accept = req.headers['accept'] as string | undefined;
        const requestVersion = accept?.split(key)[1]?.split(/[,;\s]/)[0];

        if (Array.isArray(version)) {
          if (version.includes(requestVersion as string)) {
            return handler(req, res, next);
          }
        } else if (requestVersion === version) {
          return handler(req, res, next);
        }
        return callNextHandler(req, res, next);
      };
    }

    // Custom versioning
    if (
      versioningOptions.type === VersioningType.CUSTOM &&
      typeof versioningOptions.extractor === 'function'
    ) {
      return (req, res, next) => {
        const requestVersion = versioningOptions.extractor!(
          req as unknown as Record<string, unknown>,
        );

        if (Array.isArray(version)) {
          if (
            Array.isArray(requestVersion)
              ? requestVersion.some((v) =>
                  (version as string[]).includes(v as string),
                )
              : (version as string[]).includes(requestVersion as string)
          ) {
            return handler(req, res, next);
          }
        } else if (
          Array.isArray(requestVersion)
            ? requestVersion.includes(version as string)
            : requestVersion === version
        ) {
          return handler(req, res, next);
        }
        return callNextHandler(req, res, next);
      };
    }

    return handler as VersionedRoute;
  }

  // HTTP method implementations
  public get(handler: Function): void;
  public get(path: string, handler: Function): void;
  public get(path: string | Function, handler?: Function): void {
    this.injectRouteOptions('get', path, handler);
  }

  public post(handler: Function): void;
  public post(path: string, handler: Function): void;
  public post(path: string | Function, handler?: Function): void {
    this.injectRouteOptions('post', path, handler);
  }

  public put(handler: Function): void;
  public put(path: string, handler: Function): void;
  public put(path: string | Function, handler?: Function): void {
    this.injectRouteOptions('put', path, handler);
  }

  public delete(handler: Function): void;
  public delete(path: string, handler: Function): void;
  public delete(path: string | Function, handler?: Function): void {
    this.injectRouteOptions('delete', path, handler);
  }

  public patch(handler: Function): void;
  public patch(path: string, handler: Function): void;
  public patch(path: string | Function, handler?: Function): void {
    this.injectRouteOptions('patch', path, handler);
  }

  public options(handler: Function): void;
  public options(path: string, handler: Function): void;
  public options(path: string | Function, handler?: Function): void {
    this.injectRouteOptions('options', path, handler);
  }

  public head(handler: Function): void;
  public head(path: string, handler: Function): void;
  public head(path: string | Function, handler?: Function): void {
    this.injectRouteOptions('head', path, handler);
  }

  public all(handler: Function): void;
  public all(path: string, handler: Function): void;
  public all(path: string | Function, handler?: Function): void {
    this.injectRouteOptions('any', path, handler);
  }

  // WebDAV methods - using 'any' as HyperExpress doesn't have native WebDAV support
  public propfind(handler: Function): void;
  public propfind(path: string, handler: Function): void;
  public propfind(path: string | Function, handler?: Function): void {
    this.injectRouteOptions('any', path, handler);
  }

  public proppatch(handler: Function): void;
  public proppatch(path: string, handler: Function): void;
  public proppatch(path: string | Function, handler?: Function): void {
    this.injectRouteOptions('any', path, handler);
  }

  public mkcol(handler: Function): void;
  public mkcol(path: string, handler: Function): void;
  public mkcol(path: string | Function, handler?: Function): void {
    this.injectRouteOptions('any', path, handler);
  }

  public copy(handler: Function): void;
  public copy(path: string, handler: Function): void;
  public copy(path: string | Function, handler?: Function): void {
    this.injectRouteOptions('any', path, handler);
  }

  public move(handler: Function): void;
  public move(path: string, handler: Function): void;
  public move(path: string | Function, handler?: Function): void {
    this.injectRouteOptions('any', path, handler);
  }

  public lock(handler: Function): void;
  public lock(path: string, handler: Function): void;
  public lock(path: string | Function, handler?: Function): void {
    this.injectRouteOptions('any', path, handler);
  }

  public unlock(handler: Function): void;
  public unlock(path: string, handler: Function): void;
  public unlock(path: string | Function, handler?: Function): void {
    this.injectRouteOptions('any', path, handler);
  }

  public search(handler: Function): void;
  public search(path: string, handler: Function): void;
  public search(path: string | Function, handler?: Function): void {
    this.injectRouteOptions('any', path, handler);
  }

  public use(handler: Function): void;
  public use(path: string, handler: Function): void;
  public use(...args: unknown[]): void {
    const path = typeof args[0] === 'string' ? args[0] : '/';
    const handlers = typeof args[0] === 'string' ? args.slice(1) : args;

    for (const handler of handlers) {
      if (typeof handler === 'function') {
        this.instance.use(
          path,
          async (
            request: HyperExpressRequest,
            response: HyperExpressResponse,
            next: () => void,
          ) => {
            await handler(request, response, next);
          },
        );
      }
    }
  }

  private injectRouteOptions(
    method: string,
    pathOrHandler: string | Function,
    handler?: Function,
  ): void {
    const [routePath, routeHandler] =
      typeof pathOrHandler === 'function'
        ? ['/', pathOrHandler]
        : [pathOrHandler, handler!];

    const normalizedPath = this.normalizePath(routePath);

    (this.instance as unknown as Record<string, Function>)[method](
      normalizedPath,
      async (
        request: HyperExpressRequest,
        response: HyperExpressResponse,
        next?: () => void,
      ) => {
        // Ensure body is parsed for POST/PUT/PATCH requests
        if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
          try {
            const contentType = request.headers['content-type'] || '';
            if (contentType.includes('application/json')) {
              (request as unknown as Record<string, unknown>).body =
                await request.json();
            } else if (
              contentType.includes('application/x-www-form-urlencoded')
            ) {
              (request as unknown as Record<string, unknown>).body =
                await request.urlencoded();
            } else if (contentType.includes('text/')) {
              (request as unknown as Record<string, unknown>).body =
                await request.text();
            }
          } catch (error) {
            this.logger.debug(
              `Body parsing failed for ${request.method} ${request.url}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            // Continue without body - this may be intentional (empty body, wrong content-type header)
          }
        }

        // Map path_parameters to params for NestJS compatibility
        (request as unknown as Record<string, unknown>).params =
          request.path_parameters;
        (request as unknown as Record<string, unknown>).query =
          request.query_parameters;

        await routeHandler(request, response, next);
      },
    );
  }

  public normalizePath(path: string): string {
    // Convert Express-style params to HyperExpress style
    // Express: /users/:id -> HyperExpress: /users/:id (same format)
    let normalizedPath = path.replace(/\/+/g, '/').replace(/\/$/, '') || '/';

    // Ensure path starts with /
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = '/' + normalizedPath;
    }

    return normalizedPath;
  }
}
