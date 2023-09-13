import * as S from "@crianonim/screept";
import { match } from "ts-pattern";

export const schemaGameState = z.object({
  dialogStack: z.array(z.string()),
  screeptEnv: S.schemaEnvironment,
});
export type GameState = z.infer<typeof schemaGameState>;
import { z } from "zod";

const schemaDialogActionGoBack = z.object({
  type: z.literal("go back"),
  id: z.string(),
});

const schemaDialogActionGoDialog = z.object({
  type: z.literal("go_dialog"),
  destination: z.string(),
  id: z.string(),
});

const schemaDialogActionMsg = z.object({
  type: z.literal("msg"),
  value: S.schemaExpression,
  id: z.string(),
});

const schemaDialogActionScreept = z.object({
  type: z.literal("screept"),
  value: S.schemaStatement,
  id: z.string(),
});

const schemaDialogActionConditionalBase = z.object({
  type: z.literal("conditional"),
  if: S.schemaExpression,
  id: z.string(),
});
type DialogActionConditional = z.infer<
  typeof schemaDialogActionConditionalBase
> & { then: DialogAction[]; else: DialogAction[] };

const schemaDialogActionConditional: z.ZodType<DialogActionConditional> =
  schemaDialogActionConditionalBase.extend({
    then: z.lazy(() => z.array(schemaDialogAction)),
    else: z.lazy(() => z.array(schemaDialogAction)),
  });

const schemaDialogActionBlockBase = z.object({
  type: z.literal("block"),
  id: z.string(),
});

type DialogActionBlock = z.infer<typeof schemaDialogActionBlockBase> & {
  actions: DialogAction[];
};

const schemaDialogActionBlock: z.ZodType<DialogActionBlock> =
  schemaDialogActionBlockBase.extend({
    actions: z.array(z.lazy(() => schemaDialogAction)),
  });
const schemaDialogAction = z.union([
  schemaDialogActionGoBack,
  schemaDialogActionGoDialog,
  schemaDialogActionMsg,
  schemaDialogActionScreept,
  schemaDialogActionConditional,
  schemaDialogActionBlock,
]);

export type DialogAction = z.infer<typeof schemaDialogAction>;
const schemaDialogOption = z.object({
  id: z.string(),
  text: S.schemaExpression,
  condition: S.schemaExpression.optional(),
  actions: z.array(schemaDialogAction),
});
export type DialogOption = z.infer<typeof schemaDialogOption>;

const schemaDialog = z.object({
  id: z.string(),
  text: S.schemaExpression,
  options: z.array(schemaDialogOption),
});

export type Dialog = z.infer<typeof schemaDialog>;

export type Dialogs = Record<string, Dialog>;

export const schemaGameDefinition = z.object({
  dialogs: z.record(schemaDialog),
  gameState: schemaGameState,
});

export type GameDefinition = z.infer<typeof schemaGameDefinition>;
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
