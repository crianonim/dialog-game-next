"use client";
import * as D from "../../dialog";
import { Button } from "@/components/ui/button";
import { useReducer, useState } from "react";
import DialogDebug from "./dialogdebug";
import { Combobox } from "./dialogselector";
import { DebugContext } from "./context";
import loadedDefinition from "../../games/custom.json";
import DialogGameReactUI from "@/components/dialog-game-react";
const initialGameDefinition = D.schemaGameDefinition.parse(loadedDefinition);

function DialogGame() {
  const [edit, setEdit] = useState(true);
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
        <DialogGameReactUI
          dispatch={dispatchGameDefinition}
          gameDefinition={gameDefinition}
        />
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
                      newGameDefinition: D.schemaGameDefinition.parse(
                        JSON.parse(loaded)
                      ),
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
