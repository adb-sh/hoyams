import { ArrayRule, ObjectRule, Rule, Ruleset, validate } from "./validate.ts";
import { assertEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts";

// test Rule
Deno.test("test Rule valid", () => {
  assertEquals(
    new Rule((v) => typeof v === "string" || "no string").validate("lol"),
    "lol",
  );
});

Deno.test("test Rule invalid", () => {
  assertEquals(
    (() => {
      try {
        new Rule((v) => typeof v === "string" || "no string").validate(123);
      } catch (e) {
        return e.map;
      }
    })(),
    "no string",
  );
});

// test Ruleset
Deno.test("test Ruleset valid", () => {
  assertEquals(
    new Ruleset([
      (v) => typeof v === "string" || "no string",
      (v) => typeof v === "string" && v.length > 2 || "too short",
    ]).validate("lol"),
    "lol",
  );
});

Deno.test("test Ruleset invalid", () => {
  assertEquals(
    (() => {
      try {
        new Ruleset([
          (v) => typeof v === "string" || "no string",
          (v) => typeof v === "string" && v.length > 2 || "too short",
        ]).validate(123);
      } catch (e) {
        return e.map;
      }
    })(),
    ["no string", "too short"],
  );
});

// test ArrayRule
Deno.test("test ArrayRule valid", () => {
  assertEquals(
    new ArrayRule(
      new Rule((v) => typeof v === "string" || "no string"),
    ).validate(["hai", "lol"]),
    ["hai", "lol"],
  );
});

Deno.test("test ArrayRule is not array", () => {
  assertEquals(
    (() => {
      try {
        new ArrayRule(
          new Rule((v) => typeof v === "string" || "no string"),
        ).validate("hai");
      } catch (e) {
        return e.message;
      }
    })(),
    "is not an array",
  );
});

Deno.test("test ArrayRule invalid ", () => {
  assertEquals(
    (() => {
      try {
        new ArrayRule(
          new Rule((v) => typeof v === "string" || "no string"),
        ).validate(["hai", 123]);
      } catch (e) {
        return e.map;
      }
    })(),
    [null, "no string"],
  );
});

// test ObjectRule
Deno.test("test ObjectRule valid", () => {
  assertEquals(
    new ObjectRule({
      name: new Rule((v) => typeof v === "string" || "no string"),
    }).validate({ name: "lol" }),
    { name: "lol" },
  );
});

Deno.test("test ObjectRule is not object", () => {
  assertEquals(
    (() => {
      try {
        return new ObjectRule({
          name: new Rule((v) => typeof v === "string" || "no string"),
        }).validate("hai");
      } catch (e) {
        return e.message;
      }
    })(),
    "is not an object",
  );
});

Deno.test("test ObjectRule invalid", () => {
  assertEquals(
    (() => {
      try {
        return new ObjectRule({
          name: new Rule((v) => typeof v === "string" || "no string"),
        }).validate({ name: 123 });
      } catch (e) {
        return e.map;
      }
    })(),
    { name: "no string" },
  );
});

// test All
const testRule = {
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
};

const testObjectValid = {
  id: 123,
  user: {
    name: "lol",
    tags: [
      "lol",
      "hai",
    ],
    email: "lol@foo.bar",
  },
};

const testObjectInvalid = {
  id: "lol",
  user: {
    name: 123,
    tags: [
      "lol",
      123,
    ],
    email: "lol@foobar",
  },
};

const testObjectObjectMissing = {
  id: "lol",
};


const testObjectArrayMissing = {
  user: {
    name: "lol",
    email: "lol@foo.bar",
  },
};

Deno.test("test All valid", () => {
  assertEquals(
    validate(testObjectValid, testRule),
    testObjectValid,
  );
});

Deno.test("test All invalid", () => {
  assertEquals(
    (() => {
      try {
        validate(testObjectInvalid, testRule);
      } catch (e) {
        return e.map;
      }
    })(),
    {
      id: "not a number",
      user: {
        name: "no string",
        tags: [
          null,
          [
            "no string",
            "too short",
          ],
        ],
        email: "no valid email",
      },
    },
  );
});

Deno.test("test All object missing", () => {
  assertEquals(
    (() => {
      try {
        validate(testObjectObjectMissing, testRule);
      } catch (e) {
        return e.map;
      }
    })(),
    {
      id: "not a number",
      user: "is not an object",
    },
  );
});

Deno.test("test All object missing", () => {
  assertEquals(
    (() => {
      try {
        validate(testObjectArrayMissing, testRule);
      } catch (e) {
        return e.map;
      }
    })(),
    {
      id: "not a number",
      user: {
        tags: "is not an array"
      },
    },
  );
});
