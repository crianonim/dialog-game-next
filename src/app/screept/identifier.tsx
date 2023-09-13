import * as S from "@crianonim/screept";
import { match } from "ts-pattern";
import ExpressionView from "./expression";

type IdentifierViewProps = {
  identifier: S.Identifier;
};

function IdentifierView({ identifier }: IdentifierViewProps) {
  return (
    <div className="font-mono flex gap-0">
      {match(identifier)
        .with({ type: "literal" }, ({ value }) => <div>{value}</div>)
        .with({ type: "computed" }, ({ value }) => (
          <div className="flex gap-0">
            $[ <ExpressionView expresssion={value} />]
          </div>
        ))
        .exhaustive()}
    </div>
  );
}

export default IdentifierView;
