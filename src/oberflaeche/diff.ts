import { renderElement, runFunctionComponent } from ".";
import { removeEventListener, unsafeRemoveEventListeners, updateProps } from "./props";
import { Component, ComponentElement, DOMElement, Props } from "./types";
import { getPropsOfRenderedElement } from "./utils";
import { scheduleCommit, scheduleWork } from "./workLoop";

export type DiffParams = {
  parent: Element;
  currentlyRenderedElement: Element | ChildNode;
  component?: ComponentElement;
};
export const updateDOM = (params: DiffParams): void => {
  const { parent, currentlyRenderedElement, component } = params;

  // If we don't have a corresponding component for our rendered element means it got deleted.
  if (!component) {
    scheduleCommit(() => {
      unsafeRemoveEventListeners(currentlyRenderedElement as DOMElement);

      currentlyRenderedElement.remove();
    });

    return;
  }

  // If we have a function component we have to execute it first.
  if (typeof component.tag === "function") {
    const executedComponent = runFunctionComponent(component as { tag: Component; props: Props });

    scheduleWork({ parent, currentlyRenderedElement, component: executedComponent });

    return;
  }

  const element = currentlyRenderedElement as Element;

  // If we have a text node or another HTML tag, we replace the current DOM elements.
  if (
    currentlyRenderedElement.nodeType === Node.TEXT_NODE ||
    component.tag.toLowerCase() !== element.tagName.toLowerCase()
  ) {
    // Tag changed, so we have to remove the DOM element and create a new one.
    const newEl = renderElement(component);

    scheduleCommit(() => {
      unsafeRemoveEventListeners(element as DOMElement);
      element.replaceWith(newEl);
    });

    return;
  }

  // Otherwise we have the same HTML tag still present and can just update the props.
  scheduleCommit(() => {
    updateProps(element as HTMLElement, getPropsOfRenderedElement(element, component.props), component.props);
  });

  const children = element.childNodes;
  const componentChildren =
    component.props?.children && Array.isArray(component.props?.children)
      ? component.props?.children
      : ([component.props?.children] as ComponentElement[]);

  // If the component has new number of children, then we just replace the existing DOM elements with the new ones.
  if (children.length !== componentChildren.length) {
    scheduleCommit(() => {
      unsafeRemoveEventListeners(currentlyRenderedElement as DOMElement);
      currentlyRenderedElement.replaceWith(renderElement(component));
    });

    return;
  }

  // We have the same HTML tag and the children have the same length, so we loop over them and recursively diff them.
  children.forEach((c, index) => {
    scheduleWork({ parent: element, currentlyRenderedElement: c, component: componentChildren[index] });
  });
  return;
};
