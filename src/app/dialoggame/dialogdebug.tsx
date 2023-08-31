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
import GameDebugAdmin from "./admin";
import {
  EditContentState,
  EditType,
  editableDropdown,
  editableExpression,
  editableStatement,
  editableString,
  initialContentState,
} from "./editable";
import { OptionDebugView } from "./option";

type DialogDebugProps = {
  dialog: D.Dialog;
};

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
          "singleLine",
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
      <GameDebugAdmin />
      <EnvironmentView environment={environment} dispatch={dispatch} />
    </>
  );
}

export default DialogDebug;
