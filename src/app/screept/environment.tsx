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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function EnvironmentView({ environment, dispatch }: EnvironmentViewProps) {
  const [variableValue, setVariableValue] = useState("");
  const [editedVariable, setEditedVariable] = useState<null | string>(null);
  const [parseError, setParseError] = useState<null | string>(null);
  const [newVarId, setNewVarId] = useState("");
  const [newVarValue, setNewVarValue] = useState("");
  const [newProcName, setNewProcName] = useState("");
  const [newProcStatement, setNewProcStatement] = useState("");
  return (
    <div className=" text-xs">
      <Card className="p-1">
        {Object.entries(environment.vars)
          .sort()
          .map(([name, variable]) => (
            <div key={name} className="flex gap-1 items-center">
              <button
                className="w-4 rounded border text-red-600 border-red-600"
                onClick={() => {
                  dispatch({
                    type: "update gamestate",
                    fn: (gs) => {
                      const vars = { ...gs.screeptEnv.vars };
                      delete vars[name];
                      return {
                        ...gs,
                        screeptEnv: { ...gs.screeptEnv, vars: vars },
                      };
                    },
                  });
                }}
              >
                x
              </button>
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
        <div className="flex gap-2">
          <Input
            value={newVarId}
            onChange={(e) => setNewVarId(e.target.value)}
            placeholder="identifier"
          />
          <Input
            value={newVarValue}
            onChange={(e) => setNewVarValue(e.target.value)}
            placeholder="value"
          />
          <Button
            onClick={() => {
              try {
                const parsedId = S.parseExpression(newVarId);
                const parsedValue = S.parseExpression(newVarValue);
                const goodId =
                  parsedId.type === "var" &&
                  parsedId.identifier.type === "literal" &&
                  !(parsedId.identifier.value in environment.vars);
                const goodValue = parsedValue.type === "literal";

                console.log(
                  { newVarId },
                  { newVarValue },
                  { parsedId },
                  { parsedValue },
                  "good?",
                  goodId,
                  goodValue
                );
                if (goodId && goodValue) {
                  dispatch({
                    type: "gamestate",
                    actions: [
                      {
                        type: "screept",
                        value: {
                          type: "bind",
                          identifier: parsedId.identifier,
                          value: parsedValue,
                        },
                        id: "irrelevant",
                      },
                    ],
                  });
                  setEditedVariable(null);
                  setNewVarId("");
                  setNewVarValue("");
                }
              } catch (e) {
                console.log("var add error", { e });
              }
            }}
          >
            Add Variable
          </Button>
        </div>
      </Card>

      {/* PROCEDURES */}
      <Card className="p-1">
        {Object.entries(environment.procedures)
          .sort()
          .map(([name, procedure]) => (
            <div key={name} className="flex gap-1 items-center">
              {editedVariable && name === editedVariable ? (
                <div className="flex flex-col gap-1 items-center  w-full">
                  <div>{name}</div>
                  <Textarea
                    spellCheck={false}
                    className="border w-full text-xs font-mono h-[300px]"
                    value={variableValue}
                    onChange={(e) => setVariableValue(e.target.value)}
                  />
                  {parseError && (
                    <div className="text-red-800 border rounded p-2">
                      {parseError}
                    </div>
                  )}
                  <div className="flex gap-2 justify-between ">
                    <Button
                      onClick={() => {
                        try {
                          const parsed = S.parseStatement(variableValue);
                          console.log("PROC", { parsed });
                          dispatch({
                            type: "gamestate",
                            actions: [
                              {
                                type: "screept",
                                value: {
                                  type: "proc_def",
                                  statement: parsed,
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
                    </Button>
                    <Button
                      onClick={() => {
                        try {
                          S.parseStatement(variableValue);
                        } catch (e) {
                          setParseError(e + "");
                        }
                      }}
                    >
                      Try
                    </Button>
                    <Button
                      onClick={() => {
                        setEditedVariable(null);
                        setParseError(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-1 ">
                  <button
                    className="w-4 rounded border text-red-600 border-red-600"
                    onClick={() => {
                      dispatch({
                        type: "update gamestate",
                        fn: (gs) => {
                          const procedures = { ...gs.screeptEnv.procedures };
                          delete procedures[name];
                          return {
                            ...gs,
                            screeptEnv: {
                              ...gs.screeptEnv,
                              procedures: procedures,
                            },
                          };
                        },
                      });
                    }}
                  >
                    x
                  </button>
                  <div
                    onClick={() => {
                      setVariableValue(S.stringifyStatement(procedure));
                      setEditedVariable(name);
                    }}
                  >
                    <ProcedureView
                      key={name}
                      statement={procedure}
                      name={name}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        <div className="flex gap-2">
          <Input
            value={newProcName}
            onChange={(e) => setNewProcName(e.target.value)}
            placeholder="identifier"
          />
          <Input
            value={newProcStatement}
            onChange={(e) => setNewProcStatement(e.target.value)}
            placeholder="statement"
          />
          <Button
            onClick={() => {
              try {
                const parsedId = S.parseExpression(newProcName);
                const parsedValue = S.parseStatement(newProcStatement);
                const goodId =
                  parsedId.type === "var" &&
                  parsedId.identifier.type === "literal" &&
                  !(parsedId.identifier.value in environment.procedures);

                console.log(
                  { newVarId },
                  { newVarValue },
                  { parsedId },
                  { parsedValue },
                  "good?",
                  goodId
                );
                if (goodId) {
                  dispatch({
                    type: "gamestate",
                    actions: [
                      {
                        type: "screept",
                        value: {
                          type: "proc_def",
                          identifier: parsedId.identifier,
                          statement: parsedValue,
                        },
                        id: "irrelevant",
                      },
                    ],
                  });
                  setEditedVariable(null);
                  setNewProcName("");
                  setNewProcStatement("");
                }
              } catch (e) {
                console.log("var add error", { e });
              }
            }}
          >
            Add Procedure
          </Button>
        </div>
      </Card>
      <div></div>
    </div>
  );
}

export default EnvironmentView;
