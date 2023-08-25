import { useState } from "react";
import * as S from "../../screept-lang";
import ProcedureView from "./procedure_view";
import VariableView from "./variables";
type EnvironmentViewProps = {
  environment: S.Environment;
  dispatch: React.Dispatch<D.GameDefinitionAction>;
};
import * as D from "../../dialog";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ValueView from "./value";

function EnvironmentView({ environment, dispatch }: EnvironmentViewProps) {
  const [variableValue, setVariableValue] = useState("");
  const [editedVariable, setEditedVariable] = useState<null | string>(null);
  const [parseError, setParseError] = useState<null | string>(null);
  return (
    <div className=" text-xs">
      {/* <div className="w-full"> */}
      {/* <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Name</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(environment.vars).map(([name, variable]) => (
              <TableRow key={name}>
                <TableCell className="font-medium">{name}</TableCell>
                <TableCell>
                  <ValueView value={variable} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table> */}
      {/* </div> */}
      <Card className="p-1">
        {Object.entries(environment.vars).map(([name, variable]) => (
          <div key={name} className="flex gap-1 items-center">
            <div
              onClick={() => {
                setVariableValue(S.stringifyValue(variable));
                setEditedVariable(name);
              }}
            >
              <VariableView key={name} value={variable} name={name} />
            </div>
            {editedVariable && name === editedVariable && (
              <div className="flex gap-1 items-center">
                <input
                  className="border"
                  value={variableValue}
                  onChange={(e) => setVariableValue(e.target.value)}
                />
                <button
                  onClick={() => {
                    try {
                      const parsed = S.parseExpression(variableValue);
                      dispatch({
                        type: "gamestate",
                        actions: [
                          {
                            type: "screept",
                            value: {
                              type: "bind",
                              value: parsed,
                              identifier: { type: "literal", value: name },
                            },
                            id: crypto.randomUUID(),
                          },
                        ],
                      });
                      setEditedVariable(null);
                      setParseError(null);
                    } catch (e) {
                      setParseError(e + "");
                    }
                  }}
                >
                  Save
                </button>
                {parseError && <div>{parseError}</div>}
              </div>
            )}
          </div>
        ))}
      </Card>
      <div>
        {Object.entries(environment.procedures).map(([name, statement], i) => (
          <ProcedureView key={name + i} statement={statement} name={name} />
        ))}
      </div>
    </div>
  );
}

export default EnvironmentView;
