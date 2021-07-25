/**
 * Utilities for components that will be passed as the context to the component functions.
 */

import { renderElement, runFunctionComponent } from ".";
import consoleMessages from "../consoleMessages";
import { Component, ComponentContext, Props, Tag } from "./types";
import { logWarning } from "./utils";
import { scheduleWork } from "./workLoop";

/**
 * Returns two refresh functions that will be available in the component.
 * One for the component bound refresh
 * and one that let's you refresh any component that has a `oberflaecheId` defined.
 */
export const createComponentRefresh = <INITIAL extends Record<string, any>>(
  initializingComponent: Component<INITIAL>,
  initializingProps: Props<INITIAL>
): [ComponentContext["refresh"], ComponentContext["refreshOther"]] => {
  const refresh = <PROPS extends Record<string, any>>(component: Component<PROPS>, props: Props<PROPS>) => {
    return (oberflaecheId: string, options: { diffing?: boolean } = { diffing: true }) => {
      // Return a dummy if the user forgot to add the `oberflaecheId`.
      if (!oberflaecheId) {
        logWarning(consoleMessages.noOberflaecheIdForRefresh);

        return [() => {}];
      }

      // Sanity check that we indeed have a function component.
      if (typeof component === "function") {
        const currentlyRenderedElement = document.querySelector(`[oberflaecheid="${oberflaecheId}"]`);

        // We can't refresh a component that is not in the DOM.
        if (!currentlyRenderedElement) {
          logWarning(consoleMessages.domElementWithOberflaecheIdNotFound(oberflaecheId));

          return;
        }

        const parent = currentlyRenderedElement.parentElement;

        // If we don't have a parent, we won't know where to append the DOM elements.
        if (!parent) {
          return;
        }

        // Start the diffing and commit the work to the DOM once it's done.
        if (options.diffing) {
          scheduleWork({ parent, currentlyRenderedElement, component: { tag: component as Tag, props } });
        } else {
          // Basic find and replace of the DOM element, if you don't want any diffing.
          const newEl = renderElement(runFunctionComponent({ tag: component as Component, props }));

          currentlyRenderedElement.remove();

          parent?.appendChild(newEl);
        }
      }
    };
  };

  return [
    refresh(initializingComponent, initializingProps),
    <PROPS2 extends Record<string, any>>(
      tag: Component<PROPS2>,
      props: Props<PROPS2>,
      oberflaecheId: string,
      options?: { diffing?: boolean }
    ) => refresh(tag, props)(oberflaecheId, options),
  ];
};
