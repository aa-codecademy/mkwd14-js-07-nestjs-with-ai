import { Module, DynamicModule } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { LOGGER_OPTIONS, type LoggerOptions } from './logger.options';

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
