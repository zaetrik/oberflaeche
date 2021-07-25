import { createElement } from "./oberflaeche";
import { Props, Tag, ComponentElement } from "./oberflaeche/types";
//export { Fragment } from "./oberflaeche";

export function jsx(tag: Tag, props: Props): ComponentElement {
  // @ts-ignore
  if (props.children) createElement(tag, props, props.children);

  return createElement(tag, props);
}

export function jsxs(tag: Tag, props: Props): ComponentElement {
  // @ts-ignore
  return createElement(tag, props, props.children);
}
