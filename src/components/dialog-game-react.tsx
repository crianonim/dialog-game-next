import * as S from "@crianonim/screept";
import * as D from "@crianonim/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Dispatch } from "react";

function getSplitParagraphText(
  e: S.Expression,
  env: S.Environment
): React.ReactNode {
  return (
    <div>
      {D.getSplitStringOnNL(e, env).map((el, i) => (
        <div key={i}>{el}</div>
      ))}
    </div>
  );
}

type DialogGameReactUIProps = {
  gameDefinition: D.GameDefinition;
  dispatch: Dispatch<D.GameDefinitionAction>;
};
function DialogGameReactUI({
  gameDefinition,
  dispatch,
}: DialogGameReactUIProps) {
  const { gameState, dialogs } = gameDefinition;
  const environment: S.Environment = gameState.screeptEnv;
  const dialog: D.Dialog = D.getDialogFromStack(gameState.dialogStack, dialogs);
  const options: D.DialogOption[] = D.getVisibleOptions(
    dialog.options,
    environment
  );

  return (
    <Card className="w-full xl:w-[600px] p-4">
      <CardTitle>Dialog Game</CardTitle>

      <div>{getSplitParagraphText(dialog.text, gameState.screeptEnv)}</div>
      <div className="text-slate-600 text-sm">
        {D.getStatusLine(environment)}
      </div>
      <CardContent className="flex flex-col gap-1 mt-1">
        {options.map((op) => (
          <Button
            key={op.id}
            className="w-full"
            variant="outline"
            onClick={() => dispatch(D.createGameDefinitionAction(op.actions))}
          >
            {getSplitParagraphText(op.text, gameState.screeptEnv)}
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

export default DialogGameReactUI;
