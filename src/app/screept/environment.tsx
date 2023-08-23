import { useState } from "react";
import * as S from "../../screept-lang";
import ProcedureView from "./procedure_view";
import VariableView from "./variables";
type EnvironmentViewProps = {
  environment: S.Environment;
};

function EnvironmentView({ environment }: EnvironmentViewProps) {
  return (
    <div className="w-[400px] text-xs">
      <div>
        {environment.output.map((o) => (
          <div key={o}>{o}</div>
        ))}
      </div>
      <div>
        {Object.entries(environment.procedures).map(([name, statement]) => (
          <ProcedureView statement={statement} name={name} />
        ))}
      </div>
      {Object.entries(environment.vars).map(([name, variable]) => (
        <VariableView value={variable} name={name} />
      ))}
    </div>
  );
}

export default EnvironmentView;
