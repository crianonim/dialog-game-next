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
import fabledDefinition from "../../games/fabled2.json";
const initialGameDefinition: D.GameDefinition =
  fabledDefinition as D.GameDefinition;

function getText(e: S.Expression, env: S.Environment): React.ReactNode {
  const splitString: string[] = S.getStringValue(
    S.evaluateExpression(env, e, true)
  ).split("<nl>");

  return (
    <div>
      {splitString.map((el, i) => (
        <div key={i}>{el}</div>
      ))}
    </div>
  );
}

// const dialogs = Object.fromEntries(gd.dialogs.map((d) => [d.id, d]));

function DialogGame() {
  const [gameDefinition, dispatchGameDefinition] = useReducer<
    (
      state: D.GameDefinition,
      action: D.GameDefinitionAction
    ) => D.GameDefinition
  >(D.gameDefinitionReducer, initialGameDefinition);
  const { gameState, dialogs } = gameDefinition;
  const dialog: D.Dialog = D.getDialogFromStack(gameState.dialogStack, dialogs);
  const environment = gameState.screeptEnv;
  const options: D.DialogOption[] = dialog.options.filter((option) => {
    return (
      !option.condition ||
      S.isTruthy(S.evaluateExpression(environment, option.condition, true))
    );
  });

  return (
    <div className="flex gap-1 p-4">
      {/* <textarea
        value={JSON.stringify({ dialogs: dialogs, gameState: gameState })}
      ></textarea> */}
      <Card className="w-[600px] p-4">
        <CardTitle>Fabled Lands</CardTitle>
        <div>{getText(dialog.text, gameState.screeptEnv)}</div>
        <CardContent className="flex flex-col gap-1 mt-1">
          {options.map((op) => (
            <Button
              key={op.id}
              className="w-full"
              variant="outline"
              onClick={() =>
                dispatchGameDefinition(D.createGameDefinitionAction(op.actions))
              }
            >
              {getText(op.text, gameState.screeptEnv)}
            </Button>
          ))}
        </CardContent>
        <div>
          <Card className="h-[200px] overflow-auto text-sm text-slate-700 p-1">
            {environment.output
              .slice()
              .reverse()
              .map((o) => (
                <div key={o.ts}>{o.value}</div>
              ))}
          </Card>
        </div>
      </Card>
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
                  newGameDefinition: JSON.parse(loaded),
                });
            }}
          >
            Load Game Definition
          </Button>
        </div>
        <DebugContext.Provider
          value={{ gameDefinition, dispatch: dispatchGameDefinition }}
        >
          <DialogDebug dialog={dialog} />
        </DebugContext.Provider>
      </div>
      {/*  <EnvironmentView environment={gameState.screeptEnv} /> */}
    </div>
  );
}

export default DialogGame;