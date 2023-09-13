import * as S from "@crianonim/screept";
import fabled from "./games/custom.json";
import { match } from "ts-pattern";
export type GameState = { dialogStack: string[]; screeptEnv: S.Environment };

export type DialogAction =
  | { type: "go back"; id: string }
  | { type: "go_dialog"; destination: string; id: string }
  | { type: "msg"; value: S.Expression; id: string }
  | { type: "screept"; value: S.Statement; id: string }
  | {
      type: "conditional";
      if: S.Expression;
      then: DialogAction[];
      else: DialogAction[];
      id: string;
    }
  | { type: "block"; actions: DialogAction[]; id: string };

export type DialogOption = {
  id: string;
  text: S.Expression;
  condition?: S.Expression;
  actions: DialogAction[];
};

export type Game = { gameState: GameState; dialogs: Record<string, Dialog> };

export type GameDefinition = {
  dialogs: Record<string, Dialog>;
  gameState: GameState;
};

export type Dialog = {
  id: string;
  text: S.Expression;
  options: DialogOption[];
};

export type Dialogs = Record<string, Dialog>;

const BAD_DIALOG: Dialog = {
  text: S.l(S.t("Bad Dialog")),
  id: "bad",
  options: [
    {
      id: crypto.randomUUID(),
      actions: [{ type: "go back", id: crypto.randomUUID() }],
      text: S.l(S.t("Go Back")),
    },
  ],
};

export function getDialogById(
  id: string,
  dialogs: Record<string, Dialog>
): Dialog {
  return dialogs[id] || BAD_DIALOG;
}

export function getDialogFromStack(
  dialogStack: string[],
  dialogs: Record<string, Dialog>
): Dialog {
  const id = dialogStack[0];
  if (!id || !dialogs[id]) return BAD_DIALOG;
  else return dialogs[id];
}

export function gameStateReducer(
  state: GameState,
  actions: DialogAction[]
): GameState {
  return actions.reduce<GameState>(
    (prev, cur) => executeAction(prev, cur),
    state
  );
}

function executeAction(state: GameState, action: DialogAction): GameState {
  return match(action)
    .with({ type: "go_dialog" }, ({ destination }) => ({
      ...state,
      dialogStack: [destination, ...state.dialogStack],
    }))
    .with({ type: "go back" }, () => ({
      ...state,
      dialogStack: state.dialogStack.slice(1),
    }))
    .with({ type: "block" }, ({ actions }) => gameStateReducer(state, actions))
    .with({ type: "conditional" }, (a) => {
      const condition = S.isTruthy(
        S.evaluateExpression(state.screeptEnv, a.if)
      );
      return condition
        ? gameStateReducer(state, a.then)
        : gameStateReducer(state, a.else);
    })
    .with({ type: "screept" }, ({ value }) => ({
      ...state,
      screeptEnv: S.runStatement(state.screeptEnv, value),
    }))
    .with({ type: "msg" }, ({ value }) => {
      const newOutput: string = S.getStringValue(
        S.evaluateExpression(state.screeptEnv, value)
      );
      return {
        ...state,
        screeptEnv: S.addOutputToEnvironment(state.screeptEnv, newOutput),
      };
    })

    .exhaustive();
}

export type GameDefinitionAction =
  | {
      type: "gamestate";
      actions: DialogAction[];
    }
  | {
      type: "add-go-back";
      dialogId: string;
    }
  | { type: "update dialogs"; dialogs: Dialogs }
  | { type: "replace game definition"; newGameDefinition: GameDefinition }
  | { type: "update gamestate"; fn: (g: GameState) => GameState }
  | { type: "replace"; newState: GameState };

export function gameDefinitionReducer(
  state: GameDefinition,
  action: GameDefinitionAction
): GameDefinition {
  const newState = match(action)
    .with({ type: "gamestate" }, ({ actions }) => ({
      ...state,
      gameState: gameStateReducer(state.gameState, actions),
    }))
    .with({ type: "add-go-back" }, ({ dialogId }) => {
      const dialog = state.dialogs[dialogId];
      if (!dialog) return state;
      const options: DialogOption[] = [
        ...dialog.options,
        {
          actions: [{ type: "go back", id: crypto.randomUUID() }],
          text: S.l(S.t("..")),
          id: crypto.randomUUID(),
        },
      ];
      const newState = { ...state };
      newState.dialogs[dialogId] = { ...dialog, options };
      return newState;
    })
    .with({ type: "update dialogs" }, ({ dialogs }) => ({
      ...state,
      dialogs,
    }))
    .with({ type: "replace" }, ({ newState }) => ({
      ...state,
      gameState: newState,
    }))
    .with({ type: "replace game definition" }, ({ newGameDefinition }) => ({
      ...newGameDefinition,
    }))
    .with({ type: "update gamestate" }, ({ fn }) => ({
      ...state,
      gameState: fn(state.gameState),
    }))
    .exhaustive();

  localStorage.setItem("autosave", JSON.stringify(newState));
  return newState;
}

export function createGameDefinitionAction(
  actions: DialogAction[]
): GameDefinitionAction {
  return { type: "gamestate", actions };
}

export function updateDialog(
  dialogs: Dialogs,
  dialogId: string,
  fn: (x: Dialog) => Dialog
): Dialogs {
  const dialog = dialogs[dialogId];
  const newDialog = fn(dialog);
  const newDialogs = { ...dialogs };
  if (dialogId !== newDialog.id) {
    delete dialogs[dialogId];
  }

  newDialogs[newDialog.id] = newDialog;
  return newDialogs;
}

export function updateDialogOptions(
  dialogs: Dialogs,
  dialogId: string,
  options: DialogOption[]
): Dialogs {
  return updateDialog(dialogs, dialogId, (d) => ({ ...d, options }));
}

export function updateDialogOption(
  dialogs: Dialogs,
  dialogId: string,
  optionId: string,
  fn: (x: DialogOption) => DialogOption
): Dialogs {
  return updateDialog(dialogs, dialogId, (d) => ({
    ...d,
    options: d.options.map((o) => (o.id === optionId ? fn(o) : o)),
  }));
}
export function updateDialogAction(
  dialogs: Dialogs,
  dialogId: string,
  optionId: string,
  actionId: string,
  fn: (x: DialogAction) => DialogAction
): Dialogs {
  function updateActionInTree(a: DialogAction): DialogAction {
    return a.type === "conditional" && a.id !== actionId
      ? {
          ...a,
          then: a.then.map(updateActionInTree),
          else: a.else.map(updateActionInTree),
        }
      : a.id === actionId
      ? fn(a)
      : a;
  }

  return updateDialogOption(dialogs, dialogId, optionId, (d) => ({
    ...d,
    actions: d.actions.map(updateActionInTree),
  }));
}

// todo remove and use inline
export function updateDialogText(
  dialogs: Dialogs,
  text: S.Expression,
  dialogId: string
): Dialogs {
  return updateDialog(dialogs, dialogId, (d) => ({ ...d, text }));
}

export function generateNewDialog(id: string): Dialog {
  return {
    id,
    text: S.l(S.t("New dialog" + id)),
    options: [],
  };
}

export function generateNewGameDefinition(): GameDefinition {
  return {
    dialogs: { start: generateNewDialog("start") },
    gameState: {
      screeptEnv: {
        vars: {},
        procedures: {},
        output: [],
      },
      dialogStack: ["start"],
    },
  };
}
