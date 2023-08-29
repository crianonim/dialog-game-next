import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as S from "../../screept-lang";
import * as D from "../../dialog";
import ExpressionView from "../screept/expression";
import StatementView from "../screept/statement";

export type EditType =
  | { type: "startEditing"; value: string; target: EditTarget }
  | { type: "updateValue"; value: string }
  | { type: "setError"; value: string }
  | { type: "cancelEditing"; whole?: boolean };
export type EditTarget =
  | { type: "dialog"; element: "whole"; id: string }
  | { type: "dialog"; element: "text"; id: string }
  | { type: "option"; element: "text"; id: string }
  | { type: "option"; element: "condition"; id: string }
  | { type: "action"; element: "go dialog"; id: string }
  | { type: "action"; element: "dropdown"; id: string }
  | { type: "action"; element: "screept"; id: string }
  | { type: "action"; element: "conditional condition"; id: string };

export type EditContentState = {
  isEdited: boolean;
  target: EditTarget | null;
  value: string;
  error: string;
};

export type ParseError = {
  errorMsg: string;
};

function isError(a: any): a is ParseError {
  return (a as ParseError).errorMsg !== undefined;
}
function parseExOrError<A>(s: string, parse: (s: string) => A): A | ParseError {
  try {
    return parse(s);
  } catch (e) {
    return { errorMsg: e + "" };
  }
}

export const initialContentState: EditContentState = {
  isEdited: true,
  target: null,
  value: "",
  error: "",
};

export function editableDropdown(
  savedValue: string,
  values: string[],
  editTarget: EditTarget,
  updatedDialogs: (p: string) => D.Dialogs,
  editState: EditContentState,
  dispatchEdit: React.Dispatch<EditType>,
  environment: S.Environment,
  dispatch: React.Dispatch<D.GameDefinitionAction>,
  readonlyElement: JSX.Element
) {
  return (
    <div>
      {editState.isEdited &&
      editState.target &&
      editState.target.type == editTarget.type &&
      editState.target.element == editTarget.element &&
      editState.target.id == editTarget.id ? (
        <div className="flex flex-col">
          <Select
            onValueChange={(value) => {
              dispatch({
                type: "update dialogs",
                dialogs: updatedDialogs(value),
              });
              dispatchEdit({ type: "cancelEditing" });
            }}
          >
            <SelectTrigger className="">
              <SelectValue placeholder={savedValue} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Action type</SelectLabel>
                {values.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div
          onClick={() => {
            if (editState.isEdited) {
              dispatchEdit({
                type: "startEditing",
                value: savedValue,
                target: editTarget,
              });
            }
          }}
        >
          {readonlyElement}
          {/* <ExpressionView expresssion={savedValue} environment={environment} /> */}
        </div>
      )}
    </div>
  );
}

export function editableString(
  inputType: "textarea" | "input",
  updatedDialogs: (p: string) => D.Dialogs,
  savedValue: string,
  editTarget: EditTarget,
  editState: EditContentState,
  dispatchEdit: React.Dispatch<EditType>,
  environment: S.Environment,
  dispatch: React.Dispatch<D.GameDefinitionAction>
) {
  return editableValue<string>(
    inputType,
    updatedDialogs,
    (a) => a,
    (a) => a,
    savedValue,
    editTarget,
    editState,
    dispatchEdit,
    environment,
    dispatch,
    <span>{savedValue}</span>
  );
}

export function editableExpression(
  inputType: "textarea" | "input",
  updatedDialogs: (p: S.Expression) => D.Dialogs,
  savedValue: S.Expression,
  editTarget: EditTarget,
  editState: EditContentState,
  dispatchEdit: React.Dispatch<EditType>,
  environment: S.Environment,
  dispatch: React.Dispatch<D.GameDefinitionAction>
) {
  return editableValue<S.Expression>(
    inputType,
    updatedDialogs,
    S.parseExpression,
    S.stringifyExpression,
    savedValue,
    editTarget,
    editState,
    dispatchEdit,
    environment,
    dispatch,
    <ExpressionView expresssion={savedValue} environment={environment} />
  );
}
export function editableStatement(
  inputType: "textarea" | "input",
  updatedDialogs: (p: S.Statement) => D.Dialogs,
  savedValue: S.Statement,
  editTarget: EditTarget,
  editState: EditContentState,
  dispatchEdit: React.Dispatch<EditType>,
  environment: S.Environment,
  dispatch: React.Dispatch<D.GameDefinitionAction>
) {
  return editableValue<S.Statement>(
    inputType,
    updatedDialogs,
    S.parseStatement,
    S.stringifyStatement,
    savedValue,
    editTarget,
    editState,
    dispatchEdit,
    environment,
    dispatch,
    <StatementView statement={savedValue} />
  );
}
export function editableValue<A>(
  inputType: "textarea" | "input",
  updatedDialogs: (parsed: A) => D.Dialogs,
  parse: (s: string) => A,
  stringify: (a: A) => string,
  savedValue: A,
  editTarget: EditTarget,
  editState: EditContentState,
  dispatchEdit: React.Dispatch<EditType>,
  environment: S.Environment,
  dispatch: React.Dispatch<D.GameDefinitionAction>,
  readonlyElement: JSX.Element
) {
  return (
    <div>
      {editState.isEdited &&
      editState.target &&
      editState.target.type == editTarget.type &&
      editState.target.element == editTarget.element &&
      editState.target.id == editTarget.id ? (
        <div className="flex flex-col">
          {inputType == "textarea" ? (
            <textarea
              className="h-20"
              value={editState.value}
              onChange={(e) =>
                dispatchEdit({ type: "updateValue", value: e.target.value })
              }
            ></textarea>
          ) : (
            <input
              value={editState.value}
              onChange={(e) =>
                dispatchEdit({ type: "updateValue", value: e.target.value })
              }
            />
          )}
          <div className="flex gap-1 justify-between items-center">
            <Button
              onClick={() => {
                const parsed = parseExOrError(editState.value, parse);
                if (isError(parsed)) {
                  dispatchEdit({ type: "setError", value: parsed.errorMsg });
                  console.log("Error", parsed.errorMsg);
                  return;
                }
                dispatch({
                  type: "update dialogs",
                  dialogs: updatedDialogs(parsed),
                });
                dispatchEdit({ type: "cancelEditing" });
              }}
            >
              Save
            </Button>
            {editState.error && (
              <div className="text-red-500 h-10 overflow-auto">
                {editState.error}
              </div>
            )}
            <Button
              onClick={() => {
                dispatchEdit({ type: "cancelEditing", whole: false });
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => {
            if (editState.isEdited)
              dispatchEdit({
                type: "startEditing",
                value: stringify(savedValue),
                target: editTarget,
              });
          }}
        >
          {readonlyElement}
          {/* <ExpressionView expresssion={savedValue} environment={environment} /> */}
        </div>
      )}
    </div>
  );
}
