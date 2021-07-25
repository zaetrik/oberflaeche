import { updateProps } from "./props";

// Types
import { DOMElement, Props } from "./types";

export const createDOMElement = (tag: string | "TEXT_ELEMENT", props: Props): DOMElement => {
  const domElement = tag === "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(tag);

  updateProps(domElement, {}, props);

  return domElement;
};
