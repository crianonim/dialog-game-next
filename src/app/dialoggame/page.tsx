"use client";
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
import { useReducer, useState } from "react";
import EnvironmentView from "../screept/environment";
import DialogDebug from "./dialogdebug";
import { Combobox } from "./dialogselector";
import ErrorBoundary from "@/components/errorBoundary";
import { DebugContext } from "./context";
import fabledDefinition from "../../games/custom.json";
import GameDebugAdmin from "./admin";
import Game from "./game";
const loadedGameDefinition = fabledDefinition as D.GameDefinition;
const initialGameDefinition = loadedGameDefinition;
// const initialGameDefinition: D.GameDefinition = {
//   ...loadedGameDefinition,
//   dialogs: Object.fromEntries(
//     Object.entries(loadedGameDefinition.dialogs).map(([dId, dialog]) => [
//       dId,
//       addIdsToDialogItems(dialog),
//     ])
//   ),
// };
// function addIdsToDialogItems(dialog: D.Dialog) {
//   return {
//     ...dialog,
//     options: dialog.options.map((o) => ({
//       ...addId(o),
//       actions: addIdToActionGroup(o.actions),
//     })),
//   };
// }

// function addIdToActionGroup(actions: D.DialogAction[]): D.DialogAction[] {
//   return actions.map((a) => {
//     const updated = addId(a);
//     if (updated.type === "conditional")
//       return {
//         ...updated,
//         then: addIdToActionGroup(updated.then),
//         else: addIdToActionGroup(updated.else),
//       };
//     else return updated;
//   });
// }
// function addId<T extends D.DialogOption | D.DialogAction>(e: T): T {
//   return { ...e, id: crypto.randomUUID() };
// }

// const dialogs = Object.fromEntries(gd.dialogs.map((d) => [d.id, d]));

function DialogGame() {
  const [edit, setEdit] = useState(false);
  const [gameDefinition, dispatchGameDefinition] = useReducer<
    (
      state: D.GameDefinition,
      action: D.GameDefinitionAction
    ) => D.GameDefinition
  >(D.gameDefinitionReducer, initialGameDefinition);
  const { gameState, dialogs } = gameDefinition;
  const dialog: D.Dialog = D.getDialogFromStack(gameState.dialogStack, dialogs);

  return (
    <DebugContext.Provider
      value={{ gameDefinition, dispatch: dispatchGameDefinition }}
    >
      <div className="flex gap-1 p-4">
        <Game />
        {edit && (
          <div>
            <div className="flex gap-1">
              <Combobox
                values={Object.keys(dialogs).map((el) => ({
                  value: el,
                  label: el,
                }))}
                onSelect={(id: string) =>
                  dispatchGameDefinition(
                    D.createGameDefinitionAction([
                      {
                        type: "go_dialog",
                        destination: id,
                        id: crypto.randomUUID(),
                      },
                    ])
                  )
                }
                initial={gameState.dialogStack[0]}
              />
              <Button
                variant="outline"
                disabled={gameState.dialogStack.length < 2}
                onClick={() =>
                  dispatchGameDefinition(
                    D.createGameDefinitionAction([
                      { type: "go back", id: crypto.randomUUID() },
                    ])
                  )
                }
              >
                Back
              </Button>
              {/* <Button
                variant="outline"
                onClick={() =>
                  localStorage.setItem("env", JSON.stringify(gameState))
                }
              >
                Save
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  const loaded = localStorage.getItem("env");
                  if (loaded)
                    dispatchGameDefinition({
                      type: "replace",
                      newState: JSON.parse(loaded),
                    });
                }}
              >
                Load
              </Button> */}
              <Button
                onClick={() =>
                  localStorage.setItem(
                    "game",
                    JSON.stringify({ gameState, dialogs })
                  )
                }
              >
                Save Game Definition
              </Button>
              <Button
                onClick={() => {
                  const loaded = localStorage.getItem("game");
                  if (loaded)
                    dispatchGameDefinition({
                      type: "replace game definition",
                      newGameDefinition: JSON.parse(loaded),
                    });
                }}
              >
                Load Game Definition
              </Button>
              <Button
                onClick={() => {
                  const loaded = localStorage.getItem("autosave");
                  if (loaded)
                    dispatchGameDefinition({
                      type: "replace game definition",
                      newGameDefinition: JSON.parse(loaded),
                    });
                }}
              >
                Load Auto
              </Button>
            </div>

            <DialogDebug dialog={dialog} />
          </div>
        )}
        {/*  <EnvironmentView environment={gameState.screeptEnv} /> */}
      </div>
      <Button
        className="m-4"
        variant="secondary"
        onClick={() => setEdit((x) => !x)}
      >
        Toggle Edit
      </Button>
    </DebugContext.Provider>
  );
}

export default DialogGame;
