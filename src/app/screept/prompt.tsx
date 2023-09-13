import { useState } from "react";
import * as S from "@crianonim/screept";
import { match } from "ts-pattern";

function Prompt() {
  const [command, setCommand] = useState("");
  return (
    <div>
      <input
        value={command}
        onChange={(e) => setCommand(e.target.value)}
      ></input>
    </div>
  );
}

export default Prompt;
