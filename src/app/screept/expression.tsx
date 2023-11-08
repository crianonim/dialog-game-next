import * as S from "@crianonim/screept";
import { match } from "ts-pattern";
import IdentifierView from "./identifier";
import ValueView from "./value";
import { cn } from "@/lib/utils";

type ExpressionViewProps = {
  expresssion: S.Expression;
  environment?: S.Environment;
};
function ExpressionView({ expresssion, environment }: ExpressionViewProps) {
  const evaluated = environment
    ? S.getStringValue(S.evaluateExpression(environment, expresssion))
    : undefined;
  let failed = false;
  try {
    environment
      ? S.getStringValue(S.evaluateExpression(environment, expresssion))
      : undefined;
  } catch (e) {
    console.log("EXP", { e });
    failed = true;
  }

  return (
    <div className={cn("flex", { ["bg-red-200 "]: failed })} title={evaluated}>
      {match(expresssion)
        .with({ type: "literal" }, ({ value }) => <ValueView value={value} />)
        .with({ type: "binary_op" }, ({ op, x, y }) => (
          <div className="flex gap-1">
            <ExpressionView expresssion={x} />
            <span>{op}</span>
            <ExpressionView expresssion={y} />
          </div>
        ))
        .with({ type: "var" }, ({ identifier }) => (
          <div>
            <IdentifierView identifier={identifier} />
          </div>
        ))
        .with({ type: "fun_call" }, ({ identifier, args }) => (
          <div className="flex gap-1">
            <IdentifierView identifier={identifier} />
            <span>(</span>
            <span className="flex gap-1">
              {args.map((a, i) => (
                <span
                  className="after:content-[','] last:after:content-none flex"
                  key={i}
                >
                  <ExpressionView expresssion={a} />
                </span>
              ))}
            </span>
            <span>)</span>
          </div>
        ))
        .with({ type: "parens" }, ({ expression }) => (
          <div className="flex">
            <span>(</span>
            <span>
              <ExpressionView expresssion={expression} />
            </span>
            <span>)</span>
          </div>
        ))
        .with({ type: "unary_op" }, ({ op, x }) => {
          return (
            <div className="flex">
              {op} <ExpressionView expresssion={x} />
            </div>
          );
        })
        .with({ type: "condition" }, ({ condition, onFalse, onTrue }) => (
          <div className="flex gap-1">
            <ExpressionView expresssion={condition} />
            <span>?</span>
            <ExpressionView expresssion={onTrue} />
            <span>:</span>
            <ExpressionView expresssion={onFalse} />
          </div>
        ))
        .exhaustive()}
    </div>
  );
}

export default ExpressionView;
