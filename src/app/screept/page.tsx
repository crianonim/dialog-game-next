"use client";
import { useState } from "react";
import * as S from "../../screept-lang";
import { exampleScreept, exampleEnv } from "../../example-screept";
import EnvironmentView from "./environment";

function Screept() {
  const [screept, setScreept] = useState(exampleScreept);
  const [environment, setEnvironment] = useState(exampleEnv);
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
      <div className="flex  justify-between">
        <div className="w-[800px]">
          <textarea
            className="font-mono w-[800px] h-[600px] text-xs"
            value={screept}
            onChange={(e) => setScreept(e.target.value)}
          ></textarea>
          <button onClick={attemptParse}>Parse</button>
          <button onClick={() => run(screept)}>RUN</button>
        </div>
        <div>
          <div className="flex">
            <input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
            ></input>
            <button onClick={() => run(command)}>RUN</button>
          </div>
          <EnvironmentView environment={environment} />
        </div>
      </div>
    </div>
  );
}

export default Screept;
