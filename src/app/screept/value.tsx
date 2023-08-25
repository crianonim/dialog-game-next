import * as S from "../../screept-lang";
import { match } from "ts-pattern";
import ExpressionView from "./expression";

type ValueViewProps = {
  value: S.Value;
};

function ValueView({ value }: ValueViewProps) {
  return (
    <div className="whitespace-pre-wrap">
      {match(value)
        .with({ type: "number" }, ({ value }) => (
          <div className="text-red-500">{value}</div>
        ))
        .with({ type: "text" }, ({ value }) => (
          <div className="text-blue-500">"{value}"</div>
        ))
        .with({ type: "func" }, ({ value }) => (
          <div className="text-green-500 flex gap-1">
            <span className="font-bold">FUNC</span>{" "}
            <ExpressionView expresssion={value} />
          </div>
        ))
        .exhaustive()}
    </div>
  );
}

export default ValueView;
