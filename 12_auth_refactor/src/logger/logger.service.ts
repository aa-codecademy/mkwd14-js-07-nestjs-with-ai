import { Injectable } from '@nestjs/common';
import { LogLevel } from './logger.options';

@Injectable()
export class LoggerService {
  debug(tag: string, message: string): void {
    this.emit('debug', tag, message);
  }

  info(tag: string, message: string): void {
    this.emit('info', tag, message);
  }

  warn(tag: string, message: string): void {
    this.emit('warn', tag, message);
  }

  error(tag: string, message: string): void {
    this.emit('error', tag, message);
  }

  private emit(level: LogLevel, tag: string, message: string): void {
    const line = `[${level.toUpperCase()}] ${tag}: ${message}`;

    switch (level) {
      case 'info':
        console.log(line);
        break;
      case 'debug':
        console.debug(line);
        break;
      case 'warn':
        console.warn(line);
        break;
      case 'error':
        console.error(line);
        break;
      default:
        console.log(line);
    }
  }
}
