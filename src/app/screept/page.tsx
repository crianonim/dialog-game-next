"use client";
import { useState } from "react";
import * as S from "@crianonim/screept";

import { exampleScreept } from "../../example-screept";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import * as D from "../../dialog";
import loadedDefinition from "../../games/custom.json";
const gameDefinition = D.schemaGameDefinition.parse(loadedDefinition);
function Screept() {
  const [screept, setScreept] = useState(exampleScreept);
  const [environment, setEnvironment] = useState<S.Environment>(
    gameDefinition.gameState.screeptEnv
  );
  const [status, setStatus] = useState("");
  const [command, setCommand] = useState("PRINT status()");
  function attemptParse() {
    try {
      S.parseStatement(screept);
      setStatus("OK");
    } catch (error) {
      setStatus(error + "");
    }
  }
  function run(s: string) {
    try {
      const newEnv = S.runStatement(environment, S.parseStatement(s));
      setStatus("OK");
      setEnvironment(newEnv);
    } catch (error) {
      setStatus(error + "");
    }
  }
  return (
    <div>
      <h2>Sceept</h2>
      <div>Status: {status}</div>
      <div className="flex  gap-4 ">
        <div className="w-[600px]">
          <Textarea
            className="font-mono w-[600px] h-[600px] text-xs"
            value={screept}
            onChange={(e) => setScreept(e.target.value)}
          ></Textarea>
          <button onClick={attemptParse}>Parse</button>
          <button onClick={() => run(screept)}>RUN</button>
        </div>
        <div>
          <Card>
            <Card className="h-[200px] overflow-auto">
              <div>
                {environment.output
                  .slice()
                  .reverse()
                  .map((o) => (
                    <div key={o.ts}>{o.value}</div>
                  ))}
              </div>
            </Card>
            <div>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(command);
                }}
              >
                <Input
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                ></Input>
                <Button>RUN</Button>
              </form>
            </div>
            {/* <EnvironmentView environment={environment} /> */}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Screept;
