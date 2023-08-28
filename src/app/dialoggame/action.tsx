import { useContext, useReducer, useState, createContext } from "react";
import EnvironmentView from "../screept/environment";
import ExpressionView from "../screept/expression";
import { match } from "ts-pattern";
import StatementView from "../screept/statement";
import TypeBadge from "../screept/type_indicator";
import { cn } from "@/lib/utils";
import { DebugContext } from "./context";
import {
  Trash2,
  ChevronUpSquare,
  ChevronDownSquare,
  MenuSquare,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EditContentState,
  EditType,
  editableDropdown,
  editableExpression,
  editableStatement,
  editableString,
} from "./editable";
import * as S from "../../screept-lang";
import * as D from "../../dialog";
import { Button } from "@/components/ui/button";
import { DebugActionGroup } from "./actionGroup";
type DialogActionDebugViewProps = {
  action: D.DialogAction;
  dialogId: string;
  optionId: string;
  editState: EditContentState;
  dispatchEdit: (value: EditType) => void;
  deleteAction?: () => void;
};

export function DialogActionDebugView({
  action,
  dialogId,
  optionId,
  dispatchEdit,
  editState,
  deleteAction,
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
                  id: action.id,
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
                then: [
                  {
                    type: "go back",
                    id: crypto.randomUUID(),
                  } as D.DialogAction,
                ],
                else: [
                  {
                    type: "go back",
                    id: crypto.randomUUID(),
                  } as D.DialogAction,
                ],
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
              {!(destination in dialogs) && (
                <Button
                  onClick={() => {
                    dispatch({
                      type: "update dialogs",
                      dialogs: {
                        ...dialogs,
                        [destination]: D.generateNewDialog(destination),
                      },
                    });
                  }}
                >
                  Add Dialog
                </Button>
              )}
            </div>
          </div>
        ))
        .with({ type: "go back" }, () =>
          dropdown(<TypeBadge type="back"> </TypeBadge>)
        )
        .with({ type: "screept" }, ({ value }) => (
          <TypeBadge type="screept">
            {editableStatement(
              "textarea",
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
                <DebugActionGroup
                  dialogId={dialogId}
                  actions={c.then}
                  dispatchEdit={dispatchEdit}
                  optionId={optionId}
                  editState={editState}
                />
                <span>:</span>
                <DebugActionGroup
                  dialogId={dialogId}
                  actions={c.else}
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
            {actions.map((el) => (
              <DialogActionDebugView
                key={el.id}
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
      {editState.isEdited && (
        <div className="flex items-center gap-1 p-1">
          {dropdown(<MenuSquare />)}
          {deleteAction && <Trash2 onClick={deleteAction} />}
          <ChevronUpSquare />
          <ChevronDownSquare />
          <div className="text-slate-600">ActionID ({action.id})</div>
        </div>
      )}
    </div>
  );
}

export default DialogActionDebugView;
