/** Resolve the display label of an `{ id, label }` option list (design
 *  direction vocabularies, filter options…). Falls back to the raw id. */
export function optionLabel(options = [], id) {
  if (!id) return "";
  return options.find((option) => option.id === id)?.label ?? id;
}

export default optionLabel;
