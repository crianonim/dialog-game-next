import * as S from "../../screept-lang";
import { match } from "ts-pattern";
import ExpressionView from "./expression";
import IdentifierView from "./identifier";

type StatementViewProps = {
  statement: S.Statement;
};
function StatementView({ statement }: StatementViewProps) {
  return (
    <div>
      {match(statement)
        .with({ type: "print" }, ({ value }) => (
          <div className="flex gap-1">
            PRINT <ExpressionView expresssion={value} />
          </div>
        ))
        .with({ type: "bind" }, ({ identifier, value }) => (
          <div className="flex gap-1">
            <IdentifierView identifier={identifier} />
            <span>=</span>
            <ExpressionView expresssion={value} />
          </div>
        ))
        .with({ type: "block" }, ({ statements }) => (
          <div>
            {"{"}
            <ul className="pl-1">
              {statements.map((s, i) => (
                <li
                  key={s.type + i}
                  className="flex after:content-[';'] last:after:content-none"
                >
                  <StatementView statement={s} />
                </li>
              ))}
            </ul>
            {"}"}
          </div>
        ))
        .with({ type: "random" }, ({ identifier, from, to }) => (
          <div className="flex gap-1">
            <span>RND</span>
            <IdentifierView identifier={identifier} />
            <ExpressionView expresssion={from} />
            <ExpressionView expresssion={to} />
          </div>
        ))
        .with({ type: "proc_run" }, ({ identifier, args }) => (
          <div className="flex gap-1">
            <IdentifierView identifier={identifier} />
            <span>(</span>
            {args.map((a, i) => (
              <ExpressionView key={i} expresssion={a} />
            ))}
            <span>)</span>
          </div>
        ))
        // .with({type:"÷if"})
        .otherwise((s) => (
          <pre>{S.stringifyStatement(s)}</pre>
        ))}
    </div>
  );
}

export default StatementView;
