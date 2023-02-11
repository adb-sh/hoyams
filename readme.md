# hoyams

the validation tool nobody asked for | hoyams = hold on you are missing
something

## Concept

Rules are defined via a callback which retuns `true` or an error String. This is
so that you can define rules by using an or operator like this:

```javascript
new Rule((v) => typeof v === "string" || "is not a string");
```

or this:

```javascript
new Rule((v) =>
  typeof v === "string" && !!v.match(/^\w+@\w+\.\w+$/) ||
  "no valid email"
);
```

- If a executing a validation completes without an error an object with the same
  structure as the object given is returned.

- For creating powerful nested object rules there are some primites given:
  [How to use](#how-to-use)

### ValidationError

If a validation failes an custom Error (instance of `ValidationError`) will be
thrown. `ValidationError` has a custom proprty `map` which retunr the error
message(s) in the same structure as the rule object.

## How to use

### Rule

simple single rule definition

```javascript
const rule = new Rule(
  (v) => typeof v === "string" || "is not a string",
);
rule.validate(obj);
```

**ValidationError.map**: `"is not a string"`

### Ruleset

define multiple rules for a single property

```javascript
const rule = new Ruleset([
  (v) => typeof v === "string" || "is not a string",
  (v) => v.length > 5 || "too short",
]);
rule.validate(obj);
```

**ValidationError.map**: `["is not a string", "too short"]`

### ArrayRule

define a rule which applies to all elements in an array

```javascript
const rule = new ArrayRule(
  new Rule((v) => typeof v === "string" || "is not a string"),
);
rule.validate(arr);
```

**ValidationError.map**: `"is not an array"` or `[null, "is not a string", ...]`

### ObjectRule

define different rules to specific proprties in an object

```javascript
const rule = new ObjectRule({
  name: new Rule((v) => typeof v === "string" || "is not a string"),
});
rule.validate(arr);
```

**ValidationError.map**: `"is not an object"` or `{ name: "is not a string" }`

## More complex example

example to define more complex rules

```javascript
const rule = new ObjectRule({
  id: new Rule((v) => typeof v === "number" || "not a number"),
  user: {
    name: new Rule((v) => typeof v === "string" || "no string"),
    tags: new ArrayRule(
      new Ruleset([
        (v) => typeof v === "string" || "no string",
        (v) => typeof v === "string" && v.length > 2 || "too short",
      ]),
    ),
    email: new Rule((v) =>
      typeof v === "string" && !!v.match(/^\w+@\w+\.\w+$/) || "no valid email"
    ),
  },
});

try {
  const validated = rule.validate(obj);
} catch (e) {
  if (e instanceof ValidationError) {
    const errorMap = e.map;
  } else {
    throw e;
  }
}
```

You can also use the `validate` helper function directly. f/e/ if you need a
rule only time:

```javascript
try {
  const validated = validate(
    {
      id: "hey",
    },
    {
      id: new Rule((v) => typeof v === "number" || "not a number"),
    },
  );
} catch (e) {
  if (e instanceof ValidationError) {
    const errorMap = e.map;
  } else {
    throw e;
  }
}
```
