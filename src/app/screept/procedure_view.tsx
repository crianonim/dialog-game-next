import * as S from "@crianonim/screept";
import StatementView from "./statement";
type ProcedureViewProps = { statement: S.Statement; name: string };
function ProcedureView({ statement, name }: ProcedureViewProps) {
  return (
    <div className="flex gap-1">
      <span>{name}:</span>

      <span>
        <StatementView statement={statement} />
      </span>
    </div>
  );
}

export default ProcedureView;
