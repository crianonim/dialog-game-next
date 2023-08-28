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
};

export function DebugActionGroup({
  actions,
  dialogId,
  optionId,
  editState,
  dispatchEdit,
}: DebugActionGroupProps) {
  console.log({ actions });
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
    <div>
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
    </div>
  );
}

export default DebugActionGroup;
