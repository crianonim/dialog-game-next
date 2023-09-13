import * as S from "@crianonim/screept";
import { match } from "ts-pattern";
import ExpressionView from "./expression";
import IdentifierView from "./identifier";
import { cn } from "@/lib/utils";
import { MouseEventHandler } from "react";

export type BadgeType =
  | "message"
  | "conditional"
  | "screept"
  | "text"
  | "back"
  | "go";

type TypeBadgeProps = {
  type: BadgeType;
  invisible?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
};

function getColorAndText(type: BadgeType) {
  switch (type) {
    case "message":
      return ["...", "bg-red-300"];
    case "conditional":
      return ["?", "bg-yellow-300"];
    case "screept":
      return ["{}", "bg-red-800"];
    case "text":
      return ["T", "bg-blue-600"];
    case "back":
      return ["<=", "bg-amber-600"];
    case "go":
      return ["=>", "bg-lime-600"];
  }
}

function TypeBadge({
  type,
  children,
  onClick,
  invisible,
}: React.PropsWithChildren<TypeBadgeProps>) {
  const [text, color] = getColorAndText(type);
  return (
    <div className="flex gap-1 items-center">
      {!invisible && (
        <div
          onClick={onClick}
          className={cn(
            "rounded p-[1px] w-4 text-white color justify-center flex shrink-0",
            color
          )}
        >
          {text}
        </div>
      )}
      {children}
    </div>
  );
}

export default TypeBadge;
