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

type DebugActionGroupProps = {
  actions: D.DialogAction[];
  dialogId: string;
  optionId: string;
  editState: EditContentState;
  dispatchEdit: (value: EditType) => void;
  parentAction?: D.DialogAction;
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
  // const deleteAction={
  //     option.actions.length > 1
  //       ? () =>
  //           dispatch({
  //             type: "update dialogs",
  //             dialogs: D.updateDialogOption(
  //               dialogs,
  //               dialogId,
  //               option.id,
  //               (o) => ({
  //                 ...o,
  //                 actions: o.actions.filter((a) => a.id != el.id),
  //               })
  //             ),
  //           })
  //       : undefined
  //   }

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
              //   function addToActionWithParent(
              //     acts: D.DialogAction
              //   ): D.DialogAction {
              //     if (acts.id === parentAction?.id) return
              //     if (acts.type==="conditional") then
              //     return acts;
              //   }
              const newDialogs = D.updateDialogOption(
                dialogs,
                dialogId,
                optionId,
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
        </div>
      )}
    </div>
  );
}

export default DebugActionGroup;
