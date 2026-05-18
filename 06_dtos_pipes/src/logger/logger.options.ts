export const LOGGER_OPTIONS = Symbol('LOGGER_OPTIONS');

export type LogLevel = 'info' | 'debug' | 'warn' | 'error';

export interface LoggerOptions {
  level: LogLevel;
}
