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

type EditType =
  | { type: "startEditing"; value: string; target: EditTarget }
  | { type: "updateValue"; value: string }
  | { type: "setError"; value: string }
  | { type: "cancelEditing"; whole?: boolean };
type EditTarget =
  | { type: "dialog"; element: "whole"; id: string }
  | { type: "dialog"; element: "text"; id: string }
  | { type: "option"; element: "text"; id: string }
  | { type: "option"; element: "condition"; id: string };

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
  isEdited: false,
  target: null,
  value: "",
  error: "",
};

function parseExOrError(s: string): S.Expression | string {
  try {
    return S.parseExpression(s);
  } catch (e) {
    return e + "";
  }
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
        {editState.isEdited &&
        editState.target &&
        editState.target.type == "dialog" &&
        editState.target.element == "text" ? (
          <div className="flex flex-col">
            <textarea
              className="h-20"
              value={editState.value}
              onChange={(e) =>
                dispatchEdit({ type: "updateValue", value: e.target.value })
              }
            ></textarea>
            <div className="flex gap-1 justify-between items-center">
              <Button
                onClick={() => {
                  const parsed = parseExOrError(editState.value);
                  if (typeof parsed == "string") {
                    dispatchEdit({ type: "setError", value: parsed });
                    console.log("Error", { parsed });
                    return;
                  }
                  dispatch({
                    type: "update dialogs",
                    dialogs: D.updateDialogText(dialogs, parsed, dialog.id),
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
          <TypeBadge type="text">
            <div
              onClick={() => {
                if (editState.isEdited)
                  dispatchEdit({
                    type: "startEditing",
                    value: S.stringifyExpression(dialog.text),
                    target: { type: "dialog", element: "text", id: dialog.id },
                  });
              }}
            >
              <ExpressionView
                expresssion={dialog.text}
                environment={environment}
              />
            </div>
          </TypeBadge>
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
              dispatch({ type: "add-go-back", dialogId: dialog.id });
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
        {editState.isEdited &&
        editState.target?.id == option.id &&
        editState.target.element == "text" ? (
          <div className="flex flex-col">
            <input
              value={editState.value}
              onChange={(e) =>
                dispatchEdit({ type: "updateValue", value: e.target.value })
              }
            />
            <div className="flex gap-1 justify-between items-center">
              <Button
                onClick={() => {
                  const parsed = parseExOrError(editState.value);
                  if (typeof parsed == "string") {
                    dispatchEdit({ type: "setError", value: parsed });
                    console.log("Error", { parsed });
                    return;
                  }
                  dispatch({
                    type: "update dialogs",
                    dialogs: D.updateDialogOption(
                      dialogs,
                      dialogId,
                      option.id,
                      (o) => ({ ...o, text: parsed })
                    ),
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
                  value: S.stringifyExpression(option.text),
                  target: { type: "option", element: "text", id: option.id },
                });
            }}
          >
            <ExpressionView
              expresssion={option.text}
              environment={environment}
            />
          </div>
        )}
      </TypeBadge>
      {(option.condition || editState.isEdited) && (
        <TypeBadge type="conditional">
          {editState.isEdited &&
          editState.target?.id == option.id &&
          editState.target.element == "condition" ? (
            <div className="flex flex-col">
              <input
                value={editState.value}
                onChange={(e) =>
                  dispatchEdit({ type: "updateValue", value: e.target.value })
                }
              />
              <div className="flex gap-1 justify-between items-center">
                <Button
                  onClick={() => {
                    const parsed =
                      editState.value === ""
                        ? undefined
                        : parseExOrError(editState.value);
                    if (typeof parsed == "string") {
                      dispatchEdit({ type: "setError", value: parsed });
                      console.log("Error", { parsed });
                      return;
                    }
                    dispatch({
                      type: "update dialogs",
                      dialogs: D.updateDialogOption(
                        dialogs,
                        dialogId,
                        option.id,
                        (o) => ({
                          ...o,
                          condition: parsed,
                        })
                      ),
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
                    value: option.condition
                      ? S.stringifyExpression(option.condition)
                      : "",
                    target: {
                      type: "option",
                      element: "condition",
                      id: option.id,
                    },
                  });
              }}
            >
              <ExpressionView
                expresssion={option.condition || S.l(S.n(1))}
                environment={environment}
              />
            </div>
          )}
        </TypeBadge>
      )}
      <div className="flex flex-col gap-1 pl-1">
        {option.actions.map((el) => (
          <DialogActionDebugView key={el.id} action={el} />
        ))}
      </div>
    </Card>
  );
}

type DialogActionDebugViewProps = {
  action: D.DialogAction;
};

function DialogActionDebugView({ action }: DialogActionDebugViewProps) {
  const { gameDefinition, dispatch } = useContext(DebugContext);
  const gameState = gameDefinition.gameState;
  const dialogs = gameDefinition.dialogs;
  const environment = gameState.screeptEnv;
  return (
    <div className="border p-1 rounded">
      {match(action)
        .with({ type: "go_dialog" }, ({ destination }) => (
          <div
            className={cn("cursor-pointer", {
              "bg-red-300": !(destination in dialogs),
            })}
            onClick={() => dispatch({ type: "gamestate", actions: [action] })}
          >
            <TypeBadge type="go"> {destination}</TypeBadge>
          </div>
        ))
        .with({ type: "go back" }, () => <TypeBadge type="back"> </TypeBadge>)
        .with({ type: "screept" }, ({ value }) => (
          <TypeBadge type="screept">
            <StatementView statement={value} />
          </TypeBadge>
        ))
        .with({ type: "conditional" }, (c) => (
          <TypeBadge type="conditional">
            <div className="flex gap-1 items-center">
              <ExpressionView expresssion={c.if} />
              <span>?</span>
              <DialogActionDebugView action={c.then} />
              <span>:</span>
              <DialogActionDebugView action={c.else} />
            </div>
          </TypeBadge>
        ))
        .with({ type: "block" }, ({ actions }) => (
          <div>
            {actions.map((el, i) => (
              <DialogActionDebugView key={i} action={el} />
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
