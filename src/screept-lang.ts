import { Token, alt_sc, opt, kright, list_sc } from "typescript-parsec";
import { match } from "ts-pattern";

import {
  buildLexer,
  expectEOF,
  expectSingleResult,
  rule,
} from "typescript-parsec";
import { alt, apply, kmid, lrec_sc, seq, str, tok } from "typescript-parsec";

// AST

export type Value =
  | { type: "number"; value: number }
  | { type: "text"; value: string }
  | { type: "func"; value: Expression };

export type Expression =
  | { type: "literal"; value: Value }
  | { type: "unary_op"; op: UnaryOp; x: Expression }
  | { type: "binary_op"; x: Expression; op: BinaryOp; y: Expression }
  | { type: "var"; identifier: Identifier }
  | {
      type: "conditon";
      condition: Expression;
      onTrue: Expression;
      onFalse: Expression;
    }
  | { type: "fun_call"; identifier: Identifier; args: Expression[] }
  | { type: "parens"; expression: Expression };

export type BinaryOp = "+" | "-" | "*" | "/" | "//" | "==" | "<" | ">";

export type UnaryOp = "+" | "-" | "!";

export type Identifier =
  | { type: "literal"; value: string }
  | { type: "computed"; value: Expression };

export type Environment = {
  vars: Record<string, Value>;
  procedures: Record<string, Statement>;
  output: OutputLine[];
};
export type OutputLine = { ts: number; value: string };
export type Statement =
  | { type: "bind"; identifier: Identifier; value: Expression }
  | { type: "block"; statements: Statement[] }
  | { type: "print"; value: Expression }
  | {
      type: "if";
      condition: Expression;
      thenStatement: Statement;
      elseStatement?: Statement;
    }
  | { type: "proc_def"; identifier: Identifier; statement: Statement }
  | { type: "proc_run"; identifier: Identifier; args: Expression[] }
  | {
      type: "random";
      identifier: Identifier;
      from: Expression;
      to: Expression;
    };

//Lexer
enum TokenKind {
  String,
  Number,
  Add,
  Sub,
  Mul,
  Div,
  DivDiv,
  LParen,
  RParen,
  Space,
  ConditionalStart,
  ConditionalEnd,
  Identifier,
  ComputedIdentifierStart,
  ComputedIdentifierEnd,
  Bind,
  Print,
  Comma,
  LBracket,
  RBracket,
  SemiColon,
  Func,
  If,
  Then,
  Else,
  Not,
  NewLine,
  ProcDef,
  ProcRun,
  Rnd,
  Equal,
  Greater,
  LessThan,
}

const lexer = buildLexer([
  [true, /^".*?"/g, TokenKind.String],
  [true, /^PRINT/g, TokenKind.Print],
  [true, /^FUNC/g, TokenKind.Func],
  [true, /^IF/g, TokenKind.If],
  [true, /^THEN/g, TokenKind.Then],
  [true, /^ELSE/g, TokenKind.Else],
  [true, /^PROC/g, TokenKind.ProcDef],
  [true, /^RUN/g, TokenKind.ProcRun],
  [true, /^RND/g, TokenKind.Rnd],
  [true, /^[a-z_][A-Za-z_0-9]*/g, TokenKind.Identifier],
  [true, /^\$\[/g, TokenKind.ComputedIdentifierStart],
  [true, /^\]/g, TokenKind.ComputedIdentifierEnd],
  [true, /^\d+(\.\d+)?/g, TokenKind.Number],
  [true, /^\!/g, TokenKind.Not],
  [true, /^\+/g, TokenKind.Add],
  [true, /^\-/g, TokenKind.Sub],
  [true, /^\*/g, TokenKind.Mul],
  [true, /^\/\//g, TokenKind.Div],
  [true, /^\//g, TokenKind.Div],
  [true, /^\(/g, TokenKind.LParen],
  [true, /^\)/g, TokenKind.RParen],
  [true, /^\?/g, TokenKind.ConditionalStart],
  [true, /^\:/g, TokenKind.ConditionalEnd],
  [true, /^==/g, TokenKind.Equal],
  [true, /^>/g, TokenKind.Greater],
  [true, /^</g, TokenKind.LessThan],

  [true, /^\=/g, TokenKind.Bind],
  [false, /^\s+/g, TokenKind.Space],
  [true, /^,/g, TokenKind.Comma],
  [true, /^;/g, TokenKind.SemiColon],
  [true, /^\{/g, TokenKind.LBracket],
  [true, /^\}/g, TokenKind.RBracket],
]);

// Parser

const IDENTIFIER = rule<TokenKind, Identifier>();
const TERM = rule<TokenKind, Expression>();
const FACTOR_EXP = rule<TokenKind, Expression>();
const BINARY_EXP = rule<TokenKind, Expression>();
const COMPARISON_EXP = rule<TokenKind, Expression>();
const CONDITIONAL_EXP = rule<TokenKind, Expression>();
const STMT = rule<TokenKind, Statement>();

IDENTIFIER.setPattern(
  alt_sc(
    apply(tok(TokenKind.Identifier), (value: Token<TokenKind.Identifier>) => ({
      type: "literal",
      value: value.text,
    })),
    apply(
      kmid(
        tok(TokenKind.ComputedIdentifierStart),
        CONDITIONAL_EXP,
        tok(TokenKind.ComputedIdentifierEnd)
      ),
      (value: Expression) => ({ type: "computed", value: value })
    )
  )
);

/*
TERM
  = NUMBER
  = STRING
  = FUNC
  = FUNC call
  = VAR
  = ('+' | '-' | '!') TERM
  = '(' EXP ')'
*/
TERM.setPattern(
  alt_sc(
    // NUMBER literal
    apply(
      tok(TokenKind.Number),
      (value: Token<TokenKind.Number>): Expression => l(n(+value.text))
    ),
    // STRING
    apply(
      tok(TokenKind.String),
      (value: Token<TokenKind.String>): Expression =>
        l(t(value.text.substring(1, value.text.length - 1)))
    ),
    // FUNC literal
    apply(
      seq(tok(TokenKind.Func), CONDITIONAL_EXP),

      ([t1, value]: [Token<TokenKind.Func>, Expression]): Expression =>
        l({ type: "func", value })
    ),

    // FUNC call
    apply(
      seq(
        IDENTIFIER,
        tok(TokenKind.LParen),
        opt(list_sc(CONDITIONAL_EXP, str(","))),
        tok(TokenKind.RParen)
      ),
      ([identifier, a, args]: [
        Identifier,
        any,
        Expression[] | undefined,
        any
      ]): Expression => ({
        type: "fun_call",
        identifier,
        args: args || [],
      })
    ),
    // VAR resolution
    apply(IDENTIFIER, (identifier: Identifier) => ({
      type: "var",
      identifier,
    })),

    // UNARY
    apply(
      seq(alt(str("+"), str("-"), str("!")), TERM),
      ([opToken, expression]: [Token<TokenKind>, Expression]): Expression => {
        if (opToken.text == "+" || opToken.text == "-" || opToken.text == "!")
          return {
            type: "unary_op",
            op: opToken.text,
            x: expression,
          };
        else throw new Error(`Invalid unary op ${opToken.text}`);
      }
    ),

    // Parens
    apply(kmid(str("("), CONDITIONAL_EXP, str(")")), (value: Expression) => ({
      type: "parens",
      expression: value,
    }))
  )
);

/*
FACTOR_EXP
  = TERM ('*' | '/') TERM
*/
FACTOR_EXP.setPattern(
  lrec_sc(TERM, seq(alt(str("*"), str("//"), str("/")), TERM), applyBinary)
);
/*
BINARY_EXP
  = FACTOR_EXP ('+' | '-' ) FACTOR_EXP
*/
BINARY_EXP.setPattern(
  lrec_sc(FACTOR_EXP, seq(alt(str("+"), str("-")), FACTOR_EXP), applyBinary)
);

COMPARISON_EXP.setPattern(
  lrec_sc(
    BINARY_EXP,
    seq(alt(str("=="), str(">"), str("<")), BINARY_EXP),
    applyBinary
  )
);
/*
CONDITIONAL_EXP
  = BINARY_EXP ? BINARY_EXP : BINARY_EXP
*/

CONDITIONAL_EXP.setPattern(
  alt_sc(
    apply(
      seq(
        COMPARISON_EXP,
        tok(TokenKind.ConditionalStart),
        COMPARISON_EXP,
        tok(TokenKind.ConditionalEnd),
        CONDITIONAL_EXP
      ),
      ([first, t1, onTrue, t2, onFalse]: [
        Expression,
        Token<TokenKind.ConditionalStart>,
        Expression,
        Token<TokenKind.ConditionalEnd>,
        Expression
      ]): Expression => ({
        type: "conditon",
        condition: first,
        onTrue,
        onFalse,
      })
    ),
    apply(
      seq(
        COMPARISON_EXP,
        tok(TokenKind.ConditionalStart),
        CONDITIONAL_EXP,
        tok(TokenKind.ConditionalEnd),
        CONDITIONAL_EXP
      ),
      ([first, t1, onTrue, t2, onFalse]: [
        Expression,
        Token<TokenKind.ConditionalStart>,
        Expression,
        Token<TokenKind.ConditionalEnd>,
        Expression
      ]): Expression => ({
        type: "conditon",
        condition: first,
        onTrue,
        onFalse,
      })
    ),

    COMPARISON_EXP
  )
);

STMT.setPattern(
  alt(
    apply(
      seq(IDENTIFIER, tok(TokenKind.Bind), CONDITIONAL_EXP),
      (second: [Identifier, Token<TokenKind.Bind>, Expression]): Statement => ({
        type: "bind",
        identifier: second[0],
        value: second[2],
      })
    ),

    apply(
      seq(tok(TokenKind.Print), CONDITIONAL_EXP),
      ([t1, value]: [Token<TokenKind.Print>, Expression]): Statement => {
        return { type: "print", value };
      }
    ),
    apply(
      kmid(
        tok(TokenKind.LBracket),
        list_sc(STMT, str(";")),
        seq(opt(str(";")), tok(TokenKind.RBracket))
      ),
      (statements: Statement[]): Statement => ({ type: "block", statements })
    ),
    apply(
      seq(tok(TokenKind.ProcDef), IDENTIFIER, STMT),
      ([t1, identifier, statement]: [
        Token<TokenKind.ProcDef>,
        Identifier,
        Statement
      ]): Statement => {
        return {
          type: "proc_def",
          statement,
          identifier,
        };
      }
    ),

    apply(
      seq(
        tok(TokenKind.ProcRun),
        IDENTIFIER,
        tok(TokenKind.LParen),
        opt(list_sc(CONDITIONAL_EXP, str(","))),
        tok(TokenKind.RParen)
      ),
      ([t1, identifier, lp, args, rp]: [
        Token<TokenKind.ProcRun>,
        Identifier,
        any,
        Expression[] | undefined,
        any
      ]): Statement => ({
        type: "proc_run",
        identifier,
        args: args || [],
      })
    ),

    apply(
      seq(tok(TokenKind.Rnd), IDENTIFIER, CONDITIONAL_EXP, CONDITIONAL_EXP),
      ([t1, identifier, from, to]: [
        Token<TokenKind.Rnd>,
        Identifier,
        Expression,
        Expression
      ]): Statement => ({
        type: "random",
        identifier,
        from,
        to,
      })
    ),

    apply(
      seq(
        tok(TokenKind.If),
        CONDITIONAL_EXP,
        tok(TokenKind.Then),
        STMT,
        opt(kright(tok(TokenKind.Else), STMT))
      ),
      ([a, expr, b, thenStmt, elseStmt]) => ({
        type: "if",
        condition: expr,
        thenStatement: thenStmt,
        elseStatement: elseStmt,
      })
    )
  )
);

function applyBinary(
  first: Expression,
  second: [Token<TokenKind>, Expression]
): Expression {
  switch (second[0].text) {
    case "+":
      return add(first, second[1]);

    case "-":
      return sub(first, second[1]);

    case "*":
      return mul(first, second[1]);

    case "/":
      return div(first, second[1]);
    case "//":
      return { type: "binary_op", op: "//", x: first, y: second[1] };
    case "==":
      return { type: "binary_op", op: "==", x: first, y: second[1] };
    case "<":
      return { type: "binary_op", op: "<", x: first, y: second[1] };
    case ">":
      return { type: "binary_op", op: ">", x: first, y: second[1] };
  }
  throw new Error(`Unknown binary operator: ${second[0].text}`);
}

// PARSING
export function parseExpression(expr: string): Expression {
  return expectSingleResult(
    expectEOF(CONDITIONAL_EXP.parse(lexer.parse(expr)))
  );
}

export function parseStatement(expr: string): Statement {
  return expectSingleResult(expectEOF(STMT.parse(lexer.parse(expr))));
}

// EXPRESSION EVALUATION
export function evaluateIdentifier(environment: Environment, id: Identifier) {
  if (id.type == "literal") return id.value;
  else {
    return getStringValue(evaluateExpression(environment, id.value, true));
  }
}
export function evaluateExpression(
  environment: Environment,
  expression: Expression,
  safe?: boolean
): Value {
  try {
    return match(expression)
      .returnType<Value>()
      .with({ type: "literal" }, ({ value }) => value)
      .with({ type: "binary_op" }, ({ x, y, op }) => {
        const evX = evaluateExpression(environment, x);
        const evY = evaluateExpression(environment, y);
        return evaluateBinaryExpression(evX, op, evY);
      })
      .with({ type: "var" }, ({ identifier }) => {
        const lookup =
          environment.vars[evaluateIdentifier(environment, identifier)];
        if (lookup) return lookup;
        else {
          if (safe) return n(0);
          else throw new Error(`Undefined identifier: {${identifier.value}}`);
        }
      })
      .with({ type: "unary_op" }, ({ op, x }) =>
        match(op)
          .with("-", () => {
            const value = evaluateExpression(environment, x);
            return match(value)
              .with({ type: "number" }, ({ value }) => n(-value))
              .otherwise(() => {
                throw new Error("Unary only with numbers");
              });
          })
          .with("+", () => {
            const value = evaluateExpression(environment, x);
            return match(value)
              .with({ type: "number" }, ({ value }) => n(+value))
              .otherwise(() => {
                throw new Error("Unary only with numbers");
              });
          })
          .with("!", () =>
            isTruthy(evaluateExpression(environment, x)) ? n(0) : n(1)
          )
          .exhaustive()
      )

      .with({ type: "conditon" }, ({ condition, onTrue, onFalse }) => {
        const evCondition = evaluateExpression(environment, condition);
        return isTruthy(evCondition)
          ? evaluateExpression(environment, onTrue)
          : evaluateExpression(environment, onFalse);
      })

      .with({ type: "fun_call" }, ({ args, identifier }) => {
        const fnContent =
          environment.vars[evaluateIdentifier(environment, identifier)];
        if (!fnContent || fnContent.type !== "func") {
          throw new Error(
            `Undefined function: ${evaluateIdentifier(environment, identifier)}`
          );
        }
        const newEnv = newEnvironment(environment);
        const argsEvaluated = args.map((a) =>
          evaluateExpression(environment, a)
        );
        argsEvaluated.forEach((el, i) => {
          newEnv.vars[`_${i}`] = el;
        });
        return evaluateExpression(newEnv, fnContent.value);
      })
      .with({ type: "parens" }, ({ expression }) =>
        evaluateExpression(environment, expression)
      )
      .exhaustive();
  } catch (e) {
    console.log({ e }, "evaluating", expression);
    if (safe) return t("");
    else throw e;
  }
}

function evaluateBinaryExpression(x: Value, op: BinaryOp, y: Value): Value {
  return match(op)
    .with("+", () =>
      match([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) =>
          n(xx.value + yy.value)
        )
        .otherwise(() => t(getStringValue(x) + getStringValue(y)))
    )
    .with("-", () =>
      match([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) =>
          n(xx.value - yy.value)
        )
        .otherwise(() => {
          throw new Error("TypeError");
        })
    )
    .with("*", () =>
      match([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) =>
          n(xx.value * yy.value)
        )
        .otherwise(() => {
          throw new Error("TypeError");
        })
    )
    .with("/", () =>
      match([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) =>
          n(xx.value / yy.value)
        )
        .otherwise(() => {
          throw new Error("TypeError");
        })
    )
    .with("//", () =>
      match([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) =>
          n(Math.floor(xx.value / yy.value))
        )
        .otherwise(() => {
          throw new Error("TypeError");
        })
    )
    .with("==", () =>
      x.type === y.type && getStringValue(x) === getStringValue(y) ? n(1) : n(0)
    )
    .with("<", () =>
      match([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) =>
          x.value < y.value ? n(1) : n(0)
        )
        .otherwise(() => {
          throw new Error("TypeError");
        })
    )
    .with(">", () =>
      match([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) =>
          x.value > y.value ? n(1) : n(0)
        )
        .otherwise(() => {
          throw new Error("TypeError");
        })
    )
    .exhaustive();
}
export function getStringValue(v: Value): string {
  return match(v)
    .with({ type: "number" }, ({ value }) => String(value))
    .with({ type: "text" }, ({ value }) => value)
    .with({ type: "func" }, ({ value }) => `FUNC(${value})`)
    .exhaustive();
}

// RUN STATEMENT

export function runStatement(
  environment: Environment,
  statement: Statement
  // safe?: boolean
): Environment {
  try {
    return match(statement)
      .with({ type: "print" }, ({ value }) => {
        const evEx = evaluateExpression(environment, value);
        console.log("PRINT", getStringValue(evEx));
        return addOutputToEnvironment(environment, getStringValue(evEx));
      })
      .with({ type: "bind" }, ({ value, identifier }) => {
        const evEx = evaluateExpression(environment, value);
        const id = evaluateIdentifier(environment, identifier);
        const nEnvironment = newEnvironment(environment);
        nEnvironment.vars[id] = evEx;
        return nEnvironment;
      })
      .with({ type: "block" }, ({ statements }) => {
        return statements.reduce<Environment>((prev, current) => {
          return runStatement(prev, current);
        }, environment);
      })
      .with(
        { type: "if" },
        ({ condition, thenStatement: then, elseStatement }) => {
          if (isTruthy(evaluateExpression(environment, condition)))
            return runStatement(environment, then);
          else if (elseStatement)
            return runStatement(environment, elseStatement);
          else return environment;
        }
      )
      .with({ type: "proc_def" }, ({ statement, identifier }) => {
        const nEnvironment = newEnvironment(environment);
        nEnvironment.procedures[evaluateIdentifier(environment, identifier)] =
          statement;
        return nEnvironment;
      })

      .with({ type: "proc_run" }, ({ identifier, args }) => {
        const procContent =
          environment.procedures[evaluateIdentifier(environment, identifier)];
        if (!procContent) {
          throw new Error(
            `Undefined procedure ${evaluateIdentifier(environment, identifier)}`
          );
        }
        const newEnv = newEnvironment(environment);
        const argsEvaluated = args.map((a) =>
          evaluateExpression(environment, a)
        );
        argsEvaluated.forEach((el, i) => {
          newEnv.vars[`_${i}`] = el;
        });
        return runStatement(newEnv, procContent);
      })
      .with({ type: "random" }, ({ identifier, from, to }) => {
        const fromEv = evaluateExpression(environment, from);
        const toEv = evaluateExpression(environment, to);
        if (fromEv.type !== "number" || toEv.type !== "number") {
          throw new Error("Random only accepts number ranges.");
        }
        const f = fromEv.value;
        const t = toEv.value;
        const generated = Math.round(Math.random() * (t - f) + f);
        const id = evaluateIdentifier(environment, identifier);
        const nEnvironment = newEnvironment(environment);
        nEnvironment.vars[id] = n(generated);
        return nEnvironment;
      })

      .exhaustive();
  } catch (e) {
    console.log({ e }, "running", statement);
    if (false) return environment;
    else throw e;
  }
}

function newEnvironment(e: Environment): Environment {
  return JSON.parse(JSON.stringify(e));
}

export function isTruthy(value: Value): Boolean {
  return match(value)
    .with({ type: "number" }, ({ value }) => value !== 0)
    .with({ type: "text" }, ({ value }) => value !== "")
    .otherwise(() => true);
}

/// AST Value constructors helpers
export function n(n: number): Value {
  return { type: "number", value: n };
}

export function t(n: string): Value {
  return { type: "text", value: n };
}

export function fn(n: string): Value {
  return { type: "func", value: parseExpression(n) };
}
export function va(n: string): Expression {
  return { type: "var", identifier: { type: "literal", value: n } };
}

export function add(x: Expression, y: Expression): Expression {
  return { type: "binary_op", x, op: "+", y };
}

export function sub(x: Expression, y: Expression): Expression {
  return { type: "binary_op", x, op: "-", y };
}
export function mul(x: Expression, y: Expression): Expression {
  return { type: "binary_op", x, op: "*", y };
}
export function div(x: Expression, y: Expression): Expression {
  return { type: "binary_op", x, op: "/", y };
}
// Expressions
export function l(n: Value): Expression {
  return { type: "literal", value: n };
}

export function createOutput(value: string): OutputLine {
  return { ts: new Date().valueOf(), value };
}

export function addOutputToEnvironment(
  environment: Environment,
  value: string
): Environment {
  return {
    ...environment,
    output: [...environment.output, createOutput(value)],
  };
}

export function stringifyValue(v: Value): string {
  return match(v)
    .with({ type: "number" }, ({ value }) => value + "")
    .with({ type: "text" }, ({ value }) => `"${value}"`)
    .with({ type: "func" }, ({ value }) => `FUNC ${stringifyExpression(value)}`)
    .exhaustive();
}

export function stringifyIdentifier(i: Identifier): string {
  return match(i)
    .with({ type: "literal" }, ({ value }) => value)
    .with(
      { type: "computed" },
      ({ value }) => `$[${stringifyExpression(value)}]`
    )
    .exhaustive();
}

export function stringifyExpression(e: Expression): string {
  return match(e)
    .with({ type: "literal" }, ({ value }) => stringifyValue(value))
    .with(
      { type: "binary_op" },
      ({ op, x, y }) =>
        `${stringifyExpression(x)} ${op}  ${stringifyExpression(y)}`
    )
    .with({ type: "var" }, ({ identifier }) => stringifyIdentifier(identifier))
    .with(
      { type: "fun_call" },
      ({ identifier, args }) =>
        `${stringifyIdentifier(identifier)}(${args.map((a) =>
          stringifyExpression(a)
        )})`
    )
    .with(
      { type: "parens" },
      ({ expression }) => `(${stringifyExpression(expression)})`
    )

    .with({ type: "unary_op" }, ({ op, x }) => `${op}${stringifyExpression(x)}`)

    .with(
      { type: "conditon" },
      ({ condition, onFalse, onTrue }) =>
        `${stringifyExpression(condition)} ? ${stringifyExpression(
          onTrue
        )} : ${stringifyExpression(onFalse)}`
    )

    .exhaustive();
}

export function stringifyStatement(e: Statement): string {
  return (
    match(e)
      .with(
        { type: "print" },
        ({ value }) => `PRINT ${stringifyExpression(value)}`
      )
      .with(
        { type: "bind" },
        ({ value, identifier }) =>
          `${stringifyIdentifier(identifier)} = ${stringifyExpression(value)}`
      )
      .with(
        { type: "random" },
        ({ identifier, from, to }) =>
          `RND ${stringifyIdentifier(identifier)} ${stringifyExpression(
            from
          )} ${stringifyExpression(to)}`
      )
      .with(
        { type: "block" },
        ({ statements }) =>
          `{\n ${statements.map(stringifyStatement).join(";\n ")}\n}`
      )
      .with(
        { type: "if" },
        ({ thenStatement, elseStatement, condition }) =>
          `IF ${stringifyExpression(condition)} THEN ${stringifyStatement(
            thenStatement
          )} ${
            elseStatement ? `ELSE  ${stringifyStatement(elseStatement)}` : ``
          }`
      )
      .with(
        { type: "proc_run" },
        ({ identifier, args }) =>
          `${stringifyIdentifier(identifier)}(${args.map((a) =>
            stringifyExpression(a)
          )})`
      )
      .with(
        { type: "proc_def" },
        ({ identifier, statement }) =>
          "PROC " +
          stringifyIdentifier(identifier) +
          " " +
          stringifyStatement(statement)
      )
      // .with(
      //   { type: "binary_op" },
      //   ({ op, x, y }) =>
      //     `${stringifyExpression(x)} ${op}  ${stringifyExpression(y)}`
      // )
      // .with({ type: "var" }, ({ identifier }) => stringifyIdentifier(identifier))
      // .with(
      //   { type: "fun_call" },
      //   ({ identifier, args }) =>
      //     `${stringifyIdentifier(identifier)}(${args.map((a) =>
      //       stringifyExpression(a)
      //     )})`
      // )
      // .with({ type: "parens" }, ({ expression }) => `(${stringifyExpression})`)

      // .with({ type: "unary_op" }, ({ op, x }) => `${op}${stringifyExpression(x)}`)

      // .with(
      //   { type: "conditon" },
      //   ({ condition, onFalse, onTrue }) =>
      //     `${stringifyExpression(condition)} ? ${stringifyExpression(
      //       onTrue
      //     )} : ${stringifyExpression(onFalse)}`
      // )
      .exhaustive()
  );
}
