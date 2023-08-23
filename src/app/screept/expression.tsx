import * as S from "../../screept-lang";
import { match } from "ts-pattern";
import IdentifierView from "./identifier";
import ValueView from "./value";

type ExpressionViewProps = { expresssion: S.Expression };
function ExpressionView({ expresssion }: ExpressionViewProps) {
  return (
    <div className="flex">
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
          <IdentifierView identifier={identifier} />
        ))
        .with({ type: "fun_call" }, ({ identifier, args }) => (
          <div className="flex gap-1">
            <IdentifierView identifier={identifier} />
            <span>(</span>
            {args.map((a) => (
              <ExpressionView expresssion={a} />
            ))}
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
        .otherwise(() => (
          <div>EXPRESSION BODY</div>
        ))}
    </div>
  );
}

export default ExpressionView;
