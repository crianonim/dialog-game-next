import { Button } from "@/components/ui/button";
import ScreeptEditor from "./editor";
import * as S from "@crianonim/screept";
import { useContext, useState } from "react";
import { DebugContext } from "../dialoggame/context";

function CommandBox() {
  const [command, setCommand] = useState("");
  const [error, setError] = useState<string | null>();
  const { gameDefinition, dispatch } = useContext(DebugContext);
  const environment = gameDefinition.gameState.screeptEnv;
  const [showEditor, setShowEditor] = useState(false);
  return (
    <div className="flex flex-col">
      <div className="flex">
        {showEditor ? (
          <ScreeptEditor
            environment={environment}
            onChange={(v) => {
              if (v) setCommand(v);
            }}
            initialValue=""
            singleLine={true}
          />
        ) : (
          <button onClick={() => setShowEditor(true)}>edit</button>
        )}
        <button
          className="border rounded border-slate-600 px-2"
          onClick={() => {
            try {
              const parsed = S.parseStatement(command);
              setError(null);
              dispatch({
                type: "gamestate",
                actions: [{ type: "screept", value: parsed, id: "" }],
              });
            } catch (e) {
              setError(e + "");
            }
          }}
        >
          Run
        </button>
      </div>
      {error && <div className="text-red-400">{error}</div>}
    </div>
  );
}

export default CommandBox;
