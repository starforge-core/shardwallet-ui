import type { ReactNode } from "react";

import classNames from "../../lib/classNames";

const Label = ({
  className,
  children,
}: {
  className?: string | undefined;
  children: ReactNode;
}) => {
  return (
    <label
      className={classNames(
        "inline-block text-xs font-semifbold text-gray-500 dark:text-gray-400 uppercase",
        className
      )}
    >
      {children}
    </label>
  );
};

export default Label;
