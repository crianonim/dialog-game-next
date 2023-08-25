import * as S from "../../screept-lang";
import { exampleScreept, exampleEnv } from "../../example-screept";
import * as D from "../../dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { useContext, useReducer, useState, createContext } from "react";
import EnvironmentView from "../screept/environment";
import ExpressionView from "../screept/expression";
import { match } from "ts-pattern";
import StatementView from "../screept/statement";
import TypeBadge from "../screept/type_indicator";
import { cn } from "@/lib/utils";
import { DebugContext } from "./context";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
type EditType =
  | { type: "startEditing"; value: string; target: EditTarget }
  | { type: "updateValue"; value: string }
  | { type: "setError"; value: string }
  | { type: "cancelEditing"; whole?: boolean };
type EditTarget =
  | { type: "dialog"; element: "whole"; id: string }
  | { type: "dialog"; element: "text"; id: string }
  | { type: "option"; element: "text"; id: string }
  | { type: "option"; element: "condition"; id: string }
  | { type: "action"; element: "go dialog"; id: string }
  | { type: "action"; element: "dropdown"; id: string }
  | { type: "action"; element: "screept"; id: string }
  | { type: "action"; element: "conditional condition"; id: string };

type DialogDebugProps = {
  dialog: D.Dialog;
};

type EditContentState = {
  isEdited: boolean;
  target: EditTarget | null;
  value: string;
  error: string;
};

const initialContentState: EditContentState = {
  isEdited: true,
  target: null,
  value: "",
  error: "",
};

type ParseError = {
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

function editableDropdown(
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
            onValueChange={(value) =>
              dispatchEdit({ type: "updateValue", value })
            }
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
          <div className="flex gap-1 justify-between items-center">
            <Button
              onClick={() => {
                dispatch({
                  type: "update dialogs",
                  dialogs: updatedDialogs(editState.value),
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

function editableString(
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

function editableExpression(
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
function editableStatement(
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
function editableValue<A>(
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

function DialogDebug({ dialog }: DialogDebugProps) {
  const { gameDefinition, dispatch } = useContext(DebugContext);
  const [editState, dispatchEdit] = useReducer(
    editContentReducer,
    initialContentState
  );
  const { gameState, dialogs } = gameDefinition;

  const environment = gameState.screeptEnv;

  function editContentReducer(
    state: EditContentState,
    action: EditType
  ): EditContentState {
    console.log({ action });
    return match(action)
      .with({ type: "updateValue" }, ({ value }) => ({
        ...state,
        value,
        error: "",
      }))
      .with({ type: "startEditing" }, ({ value, target }) =>
        match(target)
          .with({ type: "dialog", element: "whole" }, () => ({
            ...state,
            isEdited: true,
          }))
          .otherwise(() => ({ ...state, target, value }))
      )
      .with({ type: "cancelEditing" }, ({ whole }) =>
        whole
          ? { ...state, error: "", isEdited: false }
          : { ...state, error: "", target: null }
      )
      .with({ type: "setError" }, ({ value }) => ({ ...state, error: value }))

      .exhaustive();
  }

  return (
    <>
      <Card className="max-w-[800px] text-xs flex flex-col gap-1 p-2">
        <div className="text-sm flex justify-between items-center">
          <div>
            {" "}
            Dialog Id: <span className="font-extrabold">{dialog.id}</span>
          </div>
          {editState.isEdited ? (
            <Button
              onClick={() => {
                dispatchEdit({
                  type: "cancelEditing",
                  whole: true,
                });
              }}
            >
              Cancel
            </Button>
          ) : (
            <Button
              onClick={() => {
                dispatchEdit({
                  type: "startEditing",
                  value: "",
                  target: { type: "dialog", element: "whole", id: dialog.id },
                });
              }}
            >
              Edit
            </Button>
          )}
        </div>
        {editableExpression(
          "textarea",
          (parsed) => D.updateDialogText(dialogs, parsed, dialog.id),
          dialog.text,
          { type: "dialog", id: dialog.id, element: "text" },
          editState,
          dispatchEdit,
          environment,
          dispatch
        )}

        {dialog.options.map((d) => (
          <OptionDebugView
            key={d.id}
            option={d}
            editState={editState}
            dispatchEdit={dispatchEdit}
            dialogId={dialog.id}
          />
        ))}
        {editState.isEdited && (
          <Button
            onClick={() => {
              dispatch({
                type: "update dialogs",
                dialogs: D.updateDialog(dialogs, dialog.id, (d) => ({
                  ...d,
                  options: [
                    ...d.options,
                    {
                      id: crypto.randomUUID(),
                      actions: [{ type: "go back", id: crypto.randomUUID() }],
                      text: S.l(S.t("Go Back")),
                    },
                  ],
                })),
              });
            }}
          >
            Add Option
          </Button>
        )}
      </Card>
      <EnvironmentView environment={environment} dispatch={dispatch} />
    </>
  );
}

type OptionDebugViewProps = {
  option: D.DialogOption;
  dialogId: string;
  editState: EditContentState;
  dispatchEdit: (value: EditType) => void;
};

function OptionDebugView({
  dialogId,
  option,
  editState,
  dispatchEdit,
}: OptionDebugViewProps) {
  const { gameDefinition, dispatch } = useContext(DebugContext);
  const { gameState, dialogs } = gameDefinition;

  const environment = gameState.screeptEnv;
  return (
    <Card className="p-1 flex flex-col gap-1">
      <TypeBadge type="text">
        {editableExpression(
          "input",
          (parsed) =>
            D.updateDialogOption(dialogs, dialogId, option.id, (o) => ({
              ...o,
              text: parsed,
            })),
          option.text,
          { type: "option", element: "text", id: option.id },
          editState,
          dispatchEdit,
          environment,
          dispatch
        )}
      </TypeBadge>
      {(option.condition || editState.isEdited) && (
        <TypeBadge type="conditional">
          {editableExpression(
            "input",
            (parsed) =>
              D.updateDialogOption(dialogs, dialogId, option.id, (o) => ({
                ...o,
                condition: parsed,
              })),
            option.condition || S.l(S.t("")),
            {
              type: "option",
              element: "condition",
              id: option.id,
            },
            editState,
            dispatchEdit,
            environment,
            dispatch
          )}
        </TypeBadge>
      )}
      <div className="flex flex-col gap-1 pl-1">
        {option.actions.map((el) => (
          <DialogActionDebugView
            key={el.id}
            action={el}
            editState={editState}
            optionId={option.id}
            dialogId={dialogId}
            dispatchEdit={dispatchEdit}
          />
        ))}
      </div>
      {editState.isEdited && (
        <Button
          onClick={() => {
            const newAction: D.DialogAction = {
              type: "screept",
              value: S.parseStatement(`PRINT "Hello!"`),
              id: crypto.randomUUID(),
            };
            const newDialogs = D.updateDialogOption(
              dialogs,
              dialogId,
              option.id,
              (o) => ({
                ...o,
                actions: [...o.actions, newAction],
              })
            );
            dispatch({ type: "update dialogs", dialogs: newDialogs });
          }}
          variant="secondary"
        >
          Add Action
        </Button>
      )}
    </Card>
  );
}

type DialogActionDebugViewProps = {
  action: D.DialogAction;
  dialogId: string;
  optionId: string;
  editState: EditContentState;
  dispatchEdit: (value: EditType) => void;
};

function DialogActionDebugView({
  action,
  dialogId,
  optionId,
  dispatchEdit,
  editState,
}: DialogActionDebugViewProps) {
  const { gameDefinition, dispatch } = useContext(DebugContext);
  const gameState = gameDefinition.gameState;
  const dialogs = gameDefinition.dialogs;
  const environment = gameState.screeptEnv;
  function dropdown(el: JSX.Element) {
    return editableDropdown(
      action.type,
      ["go back", "go_dialog", "screept", "msg", "conditional"],
      { type: "action", element: "dropdown", id: action.id },
      (newType) =>
        D.updateDialogAction(dialogs, dialogId, optionId, action.id, (_) => {
          console.log({ newType });
          return match(newType)
            .with(
              "go back",
              () => ({ type: "go back", id: action.id } as D.DialogAction)
            )
            .with("screept", () => {
              return {
                type: "screept",
                value: S.parseStatement(`PRINT ""`),
                id: action.id,
              } as D.DialogAction;
            })
            .with(
              "go_dialog",
              () =>
                ({
                  type: "go_dialog",
                  destination: "start",
                } as D.DialogAction)
            )
            .with("msg", () => {
              return {
                type: "msg",
                value: S.parseExpression(`"ok"`),
                id: action.id,
              } as D.DialogAction;
            })
            .with("conditional", () => {
              return {
                type: "conditional",
                if: S.parseExpression(`1`),
                then: {
                  type: "go back",
                  id: crypto.randomUUID(),
                } as D.DialogAction,
                else: {
                  type: "go back",
                  id: crypto.randomUUID(),
                } as D.DialogAction,
                id: action.id,
              } as D.DialogAction;
            })
            .otherwise(() => action);
        }),
      editState,
      dispatchEdit,
      environment,
      dispatch,
      el
    );
  }
  return (
    <div className="border p-1 rounded">
      {match(action)
        .with({ type: "go_dialog" }, ({ destination }) => (
          <div
            className={cn("cursor-pointer", {
              "bg-red-300": !(destination in dialogs),
            })}
            onClick={() => {
              if (editState.isEdited) return;
              dispatch({ type: "gamestate", actions: [action] });
            }}
          >
            <div className="flex gap-1">
              {editState.isEdited && dropdown(<TypeBadge type="go" />)}
              <TypeBadge invisible={editState.isEdited} type="go">
                {editableString(
                  "input",
                  (s) =>
                    D.updateDialogAction(
                      dialogs,
                      dialogId,
                      optionId,
                      action.id,
                      (x) => ({ ...x, destination: s })
                    ),
                  destination,
                  { type: "action", element: "go dialog", id: action.id },
                  editState,
                  dispatchEdit,
                  environment,
                  dispatch
                )}
              </TypeBadge>
            </div>
          </div>
        ))
        .with({ type: "go back" }, () =>
          dropdown(<TypeBadge type="back"> </TypeBadge>)
        )
        .with({ type: "screept" }, ({ value }) => (
          <div className="flex items-center gap-1">
            {dropdown(<TypeBadge type="screept" />)}
            <TypeBadge invisible={editState.isEdited} type="screept">
              {editableStatement(
                "input",
                (p) =>
                  D.updateDialogAction(
                    dialogs,
                    dialogId,
                    optionId,
                    action.id,
                    (a) => ({ ...a, type: "screept", value: p })
                  ),
                value,
                { type: "action", element: "screept", id: action.id },
                editState,
                dispatchEdit,
                environment,
                dispatch
              )}
            </TypeBadge>
          </div>
        ))
        .with({ type: "conditional" }, (c) => (
          <div className="flex items-center gap-1">
            {dropdown(<TypeBadge type="conditional" />)}
            <TypeBadge invisible={editState.isEdited} type="conditional">
              <div className="flex gap-1 items-center">
                {editableExpression(
                  "input",
                  (p) =>
                    D.updateDialogAction(
                      dialogs,
                      dialogId,
                      optionId,
                      action.id,
                      (a) => ({ ...a, if: p })
                    ),
                  c.if,
                  {
                    type: "action",
                    element: "conditional condition",
                    id: action.id,
                  },
                  editState,
                  dispatchEdit,
                  environment,
                  dispatch
                )}
                <span>?</span>
                <DialogActionDebugView
                  dialogId={dialogId}
                  action={c.then}
                  dispatchEdit={dispatchEdit}
                  optionId={optionId}
                  editState={editState}
                />
                <span>:</span>
                <DialogActionDebugView
                  dialogId={dialogId}
                  action={c.else}
                  dispatchEdit={dispatchEdit}
                  optionId={optionId}
                  editState={editState}
                />
              </div>
            </TypeBadge>
          </div>
        ))
        .with({ type: "block" }, ({ actions }) => (
          <div>
            {actions.map((el, i) => (
              <DialogActionDebugView
                key={i}
                action={el}
                dialogId={dialogId}
                dispatchEdit={dispatchEdit}
                optionId={optionId}
                editState={editState}
              />
            ))}
          </div>
        ))
        .with({ type: "msg" }, ({ value }) => (
          <div className="flex gap-1">
            <TypeBadge type="message" />
            <ExpressionView expresssion={value} />
          </div>
        ))
        .exhaustive()}
    </div>
  );
}

export default DialogDebug;
