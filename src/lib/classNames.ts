const classNames = (...classes: string | null): string => {
  console.log(classes);
  return classes.filter(Boolean).join(" ");
};

export default classNames;
