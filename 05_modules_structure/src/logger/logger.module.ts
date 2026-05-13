/**
 * Dynamic module example.
 *
 * `forRoot` lets the root module provide configuration once.
 * Any provider exported here can be used by all modules (because `global: true`).
 */
import { DynamicModule, Module } from '@nestjs/common';
import { LOGGER_OPTIONS, type LoggerOptions } from './logger.options';
import { LoggerService } from './logger.service';

@Module({})
export class LoggerModule {
  static forRoot(options: LoggerOptions): DynamicModule {
    return {
      module: LoggerModule,
      providers: [
        { provide: LOGGER_OPTIONS, useValue: options },
        LoggerService,
      ],
      exports: [LoggerService],
      global: true,
    };
  }
}
