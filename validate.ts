export type Validator = (a: unknown) => true | string;
export type RuleSegment = Rule<unknown> | Ruleset<unknown> | ArrayRule<unknown> | {
  [key: string]: RuleSegment;
};

export class ValidationError extends Error {
  map: unknown;

  constructor(message: string, options: ErrorOptions & { map: unknown }) {
    super(message);
    this.map = options.map;
  }
}

export class Rule<T> {
  validator: Validator;

  constructor(validator: Validator) {
    this.validator = validator;
  }

  validate(v: unknown): T {
    const result = this.validator(v);
    if (result !== true) {
      throw new ValidationError(result.toString(), { map: result });
    } else {
      return v as T;
    }
  }
}

export class Ruleset<T> {
  validators: Array<Validator>;

  constructor(validators: Array<Validator>) {
    this.validators = validators;
  }

  validate(v: unknown): T {
    const errors = this.validators
      .map((validator) => validator(v))
      .filter((result) => result !== true);
    if (errors.length > 0) {
      throw new ValidationError(errors.toString(), { map: errors });
    } else {
      return v as T;
    }
  }
}

export class ArrayRule<T> {
  ruleSegment: RuleSegment;

  constructor(ruleSegment: RuleSegment) {
    this.ruleSegment = ruleSegment;
  }

  validate(v: unknown) {
    if (!Array.isArray(v)) throw new Error("is not an array");
    let errorFound = false as boolean;
    const results = v.map((entry) => {
      try {
        validate(entry, this.ruleSegment);
        return null;
      } catch (e) {
        if (e instanceof ValidationError) {
          errorFound = true;
          return e.map;
        } else {
          throw e;
        }
      }
    });
    if (errorFound) {
      throw new ValidationError(results.toString(), { map: results });
    } else {
      return v as Array<T>;
    }
  }
}

export class ObjectRule<T> {
  ruleSegment: RuleSegment;

  constructor(ruleSegment: RuleSegment) {
    this.ruleSegment = ruleSegment;
  }

  validate(v: unknown) {
    if (typeof v !== "object") throw new Error("is not an object");
    const errors = Object.entries(this.ruleSegment)
      .reduce((_errors: Array<unknown>, [key, el]) => {
        try {
          validate((v as { [key: string]: unknown })[key], el);
          return _errors;
        } catch (e) {
          if (e instanceof ValidationError) {
            _errors.push([key, e.map]);
            return _errors;
          } else {
            throw e;
          }
        }
      }, []) as Array<[string, unknown]>;
    if (errors.length > 0) {
      throw new ValidationError(errors.toString(), { map: Object.fromEntries(errors) });
    } else {
      return v as T;
    }
  }
}

export const validate = (
  obj: unknown,
  ruleSegment: RuleSegment,
) => {
  if (
    ruleSegment instanceof Rule ||
    ruleSegment instanceof Ruleset ||
    ruleSegment instanceof ArrayRule
  ) {
    return ruleSegment.validate(obj);
  } else if (typeof ruleSegment === "object") {
    return new ObjectRule(ruleSegment).validate(obj);
  } else {
    throw new Error("unexpected rule segment");
  }
};
