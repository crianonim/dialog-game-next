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
import { EditContentState, EditType, editableExpression } from "./editable";
import { DialogActionDebugView } from "./action";

type OptionDebugViewProps = {
  option: D.DialogOption;
  dialogId: string;
  editState: EditContentState;
  dispatchEdit: (value: EditType) => void;
};

export function OptionDebugView({
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
        <div className="flex justify-between">
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
          <Button
            onClick={() => {
              const newDialogs = D.updateDialog(dialogs, dialogId, (d) => ({
                ...d,
                options: d.options.filter((o) => o.id !== option.id),
              }));
              dispatch({ type: "update dialogs", dialogs: newDialogs });
            }}
          >
            Remove Option
          </Button>
        </div>
      )}
      <span>Option ID({option.id})</span>
    </Card>
  );
}
