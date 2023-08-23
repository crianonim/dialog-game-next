import { match } from "ts-pattern";
import * as S from "../../screept-lang";
import ValueView from "./value";
type VariableViewProps = {
  name: string;
  value: S.Value;
};

function VariableView({ name, value }: VariableViewProps) {
  return (
    <div className="flex gap-1">
      <span>{name}</span>
      <span>=</span>
      <ValueView value={value} />
    </div>
  );
}

export default VariableView;
