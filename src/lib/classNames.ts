const classNames = (
  ...classes: Array<string | false | null | undefined>
): string => {
  console.log(classes);
  return classes.filter(Boolean).join(" ");
};

export default classNames;
