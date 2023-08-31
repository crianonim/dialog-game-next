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
import { useContext, useReducer, useState } from "react";
import EnvironmentView from "../screept/environment";
import DialogDebug from "./dialogdebug";
import { Combobox } from "./dialogselector";
import ErrorBoundary from "@/components/errorBoundary";
import { DebugContext } from "./context";
import fabledDefinition from "../../games/custom.json";
import GameDebugAdmin from "./admin";
const loadedGameDefinition = fabledDefinition as D.GameDefinition;
const initialGameDefinition = loadedGameDefinition;

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

function Game() {
  const { gameDefinition, dispatch } = useContext(DebugContext);

  const { gameState, dialogs } = gameDefinition;

  const environment = gameState.screeptEnv;
  const dialog: D.Dialog = D.getDialogFromStack(gameState.dialogStack, dialogs);
  const options: D.DialogOption[] = dialog.options.filter((option) => {
    return (
      !option.condition ||
      S.isTruthy(S.evaluateExpression(environment, option.condition, true))
    );
  });

  const specialOption: D.DialogOption | boolean = S.getStringValue(
    environment.vars["_specialOption"]
  ) !== "0" && {
    text: S.l(S.t("Menu")),
    id: crypto.randomUUID(),
    actions: [
      {
        type: "screept",
        value: {
          type: "bind",
          identifier: { type: "literal", value: "_specialOption" },
          value: { type: "literal", value: { type: "number", value: 0 } },
        },
        id: crypto.randomUUID(),
      },
      {
        type: "go_dialog",
        destination: S.getStringValue(environment.vars["_specialOption"]),
        id: crypto.randomUUID(),
      },
    ],
  };
  console.log(environment.vars["_specialOption"], specialOption);

  return (
    <Card className="w-full xl:w-[600px] p-4">
      <CardTitle>Dialog Game</CardTitle>

      <div>{getText(dialog.text, gameState.screeptEnv)}</div>
      {"__statusLine" in environment.vars && (
        <div className="text-slate-600 text-sm">
          {S.getStringValue(
            S.evaluateExpression(
              environment,
              S.parseExpression("__statusLine()")
            )
          )}
        </div>
      )}
      <CardContent className="flex flex-col gap-1 mt-1">
        {(specialOption ? [...options, specialOption] : options).map((op) => (
          <Button
            key={op.id}
            className="w-full"
            variant="outline"
            onClick={() => dispatch(D.createGameDefinitionAction(op.actions))}
          >
            {getText(op.text, gameState.screeptEnv)}
          </Button>
        ))}
      </CardContent>
      <div>
        <Card className="h-[200px] overflow-auto text-sm text-slate-700 p-1 mb-1">
          {environment.output.toReversed().map((o, i) => (
            <div key={o.ts + i}>{o.value}</div>
          ))}
        </Card>
        <Button
          onClick={() => {
            dispatch({
              type: "update gamestate",
              fn: (gs) => ({
                ...gs,
                screeptEnv: { ...gs.screeptEnv, output: [] },
              }),
            });
          }}
        >
          Clear
        </Button>
      </div>
    </Card>
  );
}

export default Game;
