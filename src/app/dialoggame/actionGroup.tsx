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
import { DialogActionDebugView } from "./action";
import { moveDown, moveUp } from "@/utils";

type DebugActionGroupProps = {
  actions: D.DialogAction[];
  dialogId: string;
  optionId: string;
  editState: EditContentState;
  dispatchEdit: (value: EditType) => void;
  parentAction?: { side: "then" | "else"; action: D.DialogAction };
};

export function DebugActionGroup({
  actions,
  dialogId,
  optionId,
  editState,
  dispatchEdit,
  parentAction,
}: DebugActionGroupProps) {
  const { gameDefinition, dispatch } = useContext(DebugContext);
  const { gameState, dialogs } = gameDefinition;

  function moveAction(el: D.DialogAction, dir: "up" | "down") {
    console.log(el, dir);
    function moveWithParent(
      acts: D.DialogAction,
      pa: { side: "then" | "else"; action: D.DialogAction }
    ): D.DialogAction {
      if (acts.type === "conditional") {
        console.log("CON", acts.id, pa.action.id, pa.side);
        if (acts.id === pa.action.id) {
          if (pa.side === "then")
            return {
              ...acts,
              then:
                dir === "up"
                  ? moveUp(
                      acts.then.findIndex((x) => x.id === el.id),
                      acts.then
                    )
                  : moveDown(
                      acts.then.findIndex((x) => x.id === el.id),
                      acts.then
                    ),
            };
          if (pa.side === "else")
            return {
              ...acts,
              else:
                dir === "up"
                  ? moveUp(
                      acts.else.findIndex((x) => x.id === el.id),
                      acts.else
                    )
                  : moveDown(
                      acts.else.findIndex((x) => x.id === el.id),
                      acts.else
                    ),
            };
        } else
          return {
            ...acts,
            then: acts.then.map((a, ii) => moveWithParent(a, pa)),
            else: acts.else.map((a, ii) => moveWithParent(a, pa)),
          };
      }

      return acts;
    }

    dispatch({
      type: "update dialogs",
      dialogs: D.updateDialogOption(dialogs, dialogId, optionId, (o) => {
        const index = o.actions.findIndex((x) => x == el);
        return {
          ...o,
          actions: parentAction
            ? o.actions.map((a) => moveWithParent(a, parentAction))
            : dir === "up"
            ? moveUp(index, o.actions)
            : moveDown(index, o.actions),
        };
      }),
    });
  }

  function deleteAction(el: D.DialogAction) {
    function removeFromActionWithParent(
      acts: D.DialogAction,
      pa: { side: "then" | "else"; action: D.DialogAction }
    ): D.DialogAction {
      if (acts.type === "conditional") {
        if (acts.id === pa.action.id) {
          if (pa.side === "then")
            return {
              ...acts,
              then: [...acts.then.filter((x) => x.id !== el.id)],
            };
          if (pa.side === "else")
            return {
              ...acts,
              else: [...acts.else.filter((x) => x.id !== el.id)],
            };
        } else
          return {
            ...acts,
            then: acts.then.map((a) => removeFromActionWithParent(a, pa)),
            else: acts.else.map((a) => removeFromActionWithParent(a, pa)),
          };
      }

      return acts;
    }

    return actions.length > 1
      ? () =>
          dispatch({
            type: "update dialogs",
            dialogs: D.updateDialogOption(dialogs, dialogId, optionId, (o) => ({
              ...o,
              actions: parentAction
                ? o.actions.map((a) =>
                    removeFromActionWithParent(a, parentAction)
                  )
                : o.actions.filter((a) => a.id != el.id),
            })),
          })
      : undefined;
  }

  return (
    <div className="border border-red-600">
      {actions.map((a) => (
        <DialogActionDebugView
          key={a.id}
          action={a}
          dialogId={dialogId}
          optionId={optionId}
          editState={editState}
          dispatchEdit={dispatchEdit}
          deleteAction={deleteAction(a)}
          moveAction={moveAction}
        />
      ))}
      {editState.isEdited && (
        <div className="flex justify-between">
          <Button
            onClick={() => {
              const newAction: D.DialogAction = {
                type: "screept",
                value: S.parseStatement(`PRINT "Hello!"`),
                id: crypto.randomUUID(),
              };
              function addToActionWithParent(
                acts: D.DialogAction,
                pa: { side: "then" | "else"; action: D.DialogAction }
              ): D.DialogAction {
                if (acts.type === "conditional") {
                  if (acts.id === pa.action.id) {
                    if (pa.side === "then")
                      return { ...acts, then: [...acts.then, newAction] };
                    if (pa.side === "else")
                      return { ...acts, else: [...acts.else, newAction] };
                  } else
                    return {
                      ...acts,
                      then: acts.then.map((a) => addToActionWithParent(a, pa)),
                      else: acts.else.map((a) => addToActionWithParent(a, pa)),
                    };
                }

                return acts;
              }
              const newDialogs = D.updateDialogOption(
                dialogs,
                dialogId,
                optionId,
                (o) => ({
                  ...o,
                  actions: parentAction
                    ? o.actions.map((a) =>
                        addToActionWithParent(a, parentAction)
                      )
                    : [...o.actions, newAction],
                })
              );
              dispatch({ type: "update dialogs", dialogs: newDialogs });
            }}
            variant="secondary"
          >
            Add Action
          </Button>
        </div>
      )}
    </div>
  );
}

export default DebugActionGroup;
