import { createDOMElement } from "./DOM";
import { requestIdleCallback } from "./requestIdleCallback";
import { Props, DOMElement, ComponentElement, Tag, RawChildren, Component, ComponentContext } from "./types";
import { workLoop } from "./workLoop";
import { runComponentEffectCleanUps, createEffectsHandler } from "./effects";
import { createComponentState, globalState } from "./state";
import { createComponentRefresh } from "./refresh";

// Start the work loop
requestIdleCallback(workLoop);

/**
 * JSX factory.
 * Turn JSX element into a virtual DOM object.
 */
const createElement = (tag: Tag, props: Props, ...children: RawChildren): ComponentElement => {
  return {
    tag,
    props: {
      ...props,
      children: (props.children ? [props.children] : children)
        .flat()
        // If one of the children falsy then we ignore it (used for conditional rendering).
        .filter((child) => child)
        .map((child) =>
          // If child is not an object it should be rendered as a text node.
          typeof child === "object" ? child : createTextElement(child || "")
        ) as ComponentElement[],
    },
  };
};

const createTextElement = (text: string | number): ComponentElement<{ nodeValue: string | number }> => {
  return {
    tag: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
};

export const renderElement = (component: ComponentElement): DOMElement => {
  // If the tag is a function and not a string for a DOM element we need to execute the function first
  if (typeof component.tag === "function") {
    return renderElement(runFunctionComponent(component as { tag: Component; props: Props }));
  }

  const parentDOMEl = createDOMElement(component.tag, component.props);
  const childrenDOMEls = (
    component.props?.children && Array.isArray(component.props?.children)
      ? component.props?.children
      : ([component.props?.children] as ComponentElement[])
  ).map((child: ComponentElement) => renderElement(child));

  // Add children to parent DOM node
  childrenDOMEls.forEach((el) => {
    parentDOMEl.appendChild(el);
  });

  return parentDOMEl;
};

/**
 * Render components to the DOM.
 */
const render = (element: JSX.Element, container: DOMElement | null): void => {
  if (!container) return;

  container.appendChild(renderElement(element));
};

/**
 * Utility to build the context, that is passed to the components.
 */
export const createComponentContext = (component: Component, props: Props): ComponentContext => {
  const [refresh, refreshOther] = createComponentRefresh(component, props);
  const [state, stateOther] = createComponentState(component, props);
  const effect = createEffectsHandler();

  return { refresh, refreshOther, state, stateOther, globalState, effect };
};

/**
 * Passes the context to a function component and runs any effect clean up functions.
 */
export const runFunctionComponent = (component: { tag: Component; props: Props }) => {
  // Run the clean up functions of the effects.
  if (component.props.oberflaecheId) {
    const oberflaecheId = component.props.oberflaecheId;
    runComponentEffectCleanUps(oberflaecheId);

    /**
     * If the function component has a `oberflaecheId` prop, then we add it to the container of the resulting element.
     * We are practically passing down the `oberflaecheId` prop.
     */
    const executedComponent = component.tag(component.props, createComponentContext(component.tag, component.props));

    const propsWithOberflaecheIdAddedToElement: Props = {
      ...executedComponent.props,
      oberflaecheId: component.props.oberflaecheId,
    };

    return { ...executedComponent, props: propsWithOberflaecheIdAddedToElement };
  }

  return component.tag(component.props, createComponentContext(component.tag, component.props));
};

//const Fragment = (...children: RawChildren): RawChildren => children;

const Oberflaeche = { createElement, render };
export default Oberflaeche;

export { createElement, render };
