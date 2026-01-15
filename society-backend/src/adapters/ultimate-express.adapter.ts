import { INestApplication, Logger } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { EventEmitter } from 'events';
import type { Express, NextFunction, Request, Response } from 'express';
import type { Server } from 'http';

// Ultimate Express provides Express-compatible APIs built on uWebSockets.js
// It's a drop-in replacement that provides 5-12x better performance
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ultimateExpress = require('ultimate-express');

export type NestUltimateExpressApplication = INestApplication<Express>;

export interface UltimateExpressAdapterOptions {
  // Body parsing options
  bodyMethods?: string[];
  // Enable async error catching (built-in feature)
  catchAsyncErrors?: boolean;
  // SSL/TLS options (passed to uWebSockets.js)
  uwsOptions?: {
    key_file_name?: string;
    cert_file_name?: string;
    passphrase?: string;
    dh_params_file_name?: string;
    ssl_prefer_low_memory_usage?: boolean;
  };
}

/**
 * Mock server that implements the minimal Server interface needed by NestJS.
 * This bridges Ultimate Express (which doesn't expose a Node.js Server) with NestJS's expectations.
 */
class MockServer extends EventEmitter {
  private _listening = false;
  public address(): { port: number; address: string } | null {
    return this._listening ? { port: 0, address: '0.0.0.0' } : null;
  }
  public setListening(port: number, hostname: string): void {
    this._listening = true;
    // Override address to return actual values
    this.address = () => ({ port, address: hostname });
    this.emit('listening');
  }
}

/**
 * Custom NestJS HTTP adapter using Ultimate Express.
 *
 * Ultimate Express is a drop-in Express replacement built on uWebSockets.js,
 * providing 5-12x better performance while maintaining Express API compatibility.
 *
 * IMPORTANT: Ultimate Express does NOT work with manually created HTTP servers.
 * You must use app.listen() directly. This adapter overrides NestJS's default
 * behavior to ensure proper integration.
 *
 * Key differences from standard Express:
 * - Case-sensitive routing enabled by default
 * - Built-in async error catching
 * - Body parsing only for POST/PUT/PATCH by default
 * - Uses uWebSockets.js under the hood
 */
export class UltimateExpressAdapter extends ExpressAdapter {
  private readonly adapterLogger = new Logger(UltimateExpressAdapter.name);
  private readonly mockServer: MockServer;
  private ultimateServer: unknown = null;

  constructor(options?: UltimateExpressAdapterOptions) {
    // Create Ultimate Express app with options
    const app = ultimateExpress({
      // Parse body for these methods
      'body methods': options?.bodyMethods || ['POST', 'PUT', 'PATCH'],
      // Catch async errors automatically
      'catch async errors': options?.catchAsyncErrors ?? true,
      // Pass through uWebSockets options
      ...options?.uwsOptions,
    });

    super(app);

    // Create mock server for NestJS compatibility
    // NestJS expects a Server object with event emitter capabilities
    this.mockServer = new MockServer();

    this.adapterLogger.log('Ultimate Express adapter initialized');
  }

  /**
   * Override initHttpServer to prevent Node.js http.createServer().
   * Ultimate Express requires using app.listen() directly.
   * We set up a mock server to satisfy NestJS's expectations.
   */
  initHttpServer(): void {
    // Do nothing - Ultimate Express handles server creation internally
    // The mock server is already created in the constructor
    this.adapterLogger.log('Skipping Node.js HTTP server creation (using Ultimate Express native server)');
  }

  /**
   * Override listen to use Ultimate Express's native listen method.
   * This is required because Ultimate Express doesn't work with manually created HTTP servers.
   */
  listen(port: string | number, callback?: () => void): Server;
  listen(port: string | number, hostname: string, callback?: () => void): Server;
  listen(port: string | number, hostnameOrCallback?: string | (() => void), callback?: () => void): Server {
    const hostname = typeof hostnameOrCallback === 'string' ? hostnameOrCallback : '0.0.0.0';
    const cb = typeof hostnameOrCallback === 'function' ? hostnameOrCallback : callback;
    const portNum = typeof port === 'string' ? parseInt(port, 10) : port;

    this.adapterLogger.log(`Starting Ultimate Express server on ${hostname}:${port}`);

    // Use Ultimate Express's native listen method
    this.ultimateServer = this.getInstance().listen(portNum, hostname, () => {
      // Mark mock server as listening and emit event for NestJS
      this.mockServer.setListening(portNum, hostname);
      // Call the original callback if provided
      if (cb) cb();
    });

    // Return mock server for NestJS compatibility
    return this.mockServer as unknown as Server;
  }

  /**
   * Override close to properly shut down Ultimate Express.
   */
  close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.ultimateServer && typeof (this.ultimateServer as { close?: (cb: () => void) => void }).close === 'function') {
        (this.ultimateServer as { close: (cb: () => void) => void }).close(() => {
          this.adapterLogger.log('Ultimate Express server closed');
          this.mockServer.emit('close');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Override getHttpServer to return the mock server.
   * NestJS uses this to subscribe to events like 'listening' and 'close'.
   */
  getHttpServer(): Server {
    return this.mockServer as unknown as Server;
  }

  /**
   * Get the type identifier for this adapter
   */
  getType(): string {
    return 'ultimate-express';
  }
}

// Re-export Express types for convenience
export type { Express, NextFunction, Request, Response };

