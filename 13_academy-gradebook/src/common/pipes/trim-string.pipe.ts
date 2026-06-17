import type { PipeTransform } from '@nestjs/common';

export class TrimStringPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    return typeof value === 'string' ? value.trim() : value;
  }
}
