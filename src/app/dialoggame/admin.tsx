"use client";
import * as S from "@crianonim/screept";
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
import { useReducer, useState, useContext } from "react";
import EnvironmentView from "../screept/environment";
import DialogDebug from "./dialogdebug";
import { Combobox } from "./dialogselector";
import ErrorBoundary from "@/components/errorBoundary";
import { DebugContext } from "./context";

function GameDebugAdmin() {
  const { gameDefinition, dispatch } = useContext(DebugContext);
  const [importValue, setImportValue] = useState("");
  return (
    <Card className="p-2">
      <CardTitle>Admin</CardTitle>
      <div>To export copy this JSON</div>
      <textarea
        className="w-full text-xs"
        readOnly={true}
        value={JSON.stringify(gameDefinition)}
      ></textarea>
      <div>Import</div>
      <textarea
        className="w-full text-xs border p-1"
        value={importValue}
        onChange={(e) => setImportValue(e.target.value)}
      ></textarea>
      <Button
        onClick={() => {
          dispatch({
            type: "replace game definition",
            newGameDefinition: D.schemaGameDefinition.parse(
              JSON.parse(importValue)
            ),
          });
        }}
      >
        Import JSON
      </Button>
      <Button
        onClick={() => {
          dispatch({
            type: "replace game definition",
            newGameDefinition: D.generateNewGameDefinition(),
          });
        }}
      >
        Blank Game Definition
      </Button>
    </Card>
  );
}

export default GameDebugAdmin;
