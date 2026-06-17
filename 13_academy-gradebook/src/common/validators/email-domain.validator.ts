import {
  registerDecorator,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
  type ValidatorOptions,
} from 'class-validator';

const REQUIRED_DOMAIN = 'avenga.mk';

@ValidatorConstraint({ name: 'IsAvengaEmail', async: false })
export class IsAvengaEmailConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    const domain = value.split('@')[1]?.toLowerCase();
    return domain === REQUIRED_DOMAIN;
  }

  defaultMessage(): string {
    return `Email must be an @${REQUIRED_DOMAIN} address`;
  }
}

export function IsAvengaEmail(options?: ValidatorOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      constraints: [],
      validator: IsAvengaEmailConstraint,
    });
  };
}
