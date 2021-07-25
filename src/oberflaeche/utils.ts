import { eventSubscriptions } from "./props";
import { Props } from "./types";

export const logWarning = (text: string) => {
  console.warn(text);
};

/**
 * Get the attributes attached to the current DOM node,
 * so we can update or replace them, when comparing them to a new run of the component.
 */
export const getPropsOfRenderedElement = (element: Element, props: Props): Props => {
  if (!element?.attributes) return {};

  const attributes = {};
  for (let x = 0; x < element.attributes.length; x++) {
    const attribute = element.attributes[x];
    // @ts-ignore
    attributes?.[attribute.nodeName as string] = attribute?.nodeValue;
  }

  const elementEventListeners =
    //@ts-ignore
    attributes["oberflaecheid"] || props.oberflaecheId
      ? //@ts-ignore
        eventSubscriptions.get((attributes["oberflaecheid"] as string) || props.oberflaecheId)
      : {};

  return { ...attributes, ...elementEventListeners };
};
