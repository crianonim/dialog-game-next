import { createContext } from "react";
import * as S from "@crianonim/screept";
import * as D from "@crianonim/dialog";
type DebugContextType = {
  gameDefinition: D.GameDefinition;

  dispatch: React.Dispatch<D.GameDefinitionAction>;
};
import fabledDefinition from "../../games/fabled.json";
const gameDefinition: D.GameDefinition = fabledDefinition as D.GameDefinition;
const dialogs: Record<string, D.Dialog> = gameDefinition.dialogs;

export const DebugContext = createContext<DebugContextType>({
  gameDefinition: gameDefinition,
  dispatch: {} as unknown as React.Dispatch<D.GameDefinitionAction>,
});
