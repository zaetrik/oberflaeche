import consoleMessages from "../consoleMessages";
import { DOMElement, Props } from "./types";
import { logWarning } from "./utils";

/**
 * Here we store all our event listeners.
 * The key is the `oberflaecheId`.
 */
export const eventSubscriptions = new Map<
  string, // oberflaecheId
  { [eventType: string]: { element: Element; func: (...args: any[]) => void; mounted: boolean } }
>();

/**
 * Fallback for event listeners if they were created without an `oberflaecheId`
 */
export const eventHandlersWithoutOberflaecheId = new Map<string, string[]>();

/** UTILS */

const isEvent = (key: keyof Props<Record<string, any>>): boolean => {
  return String(key).startsWith("on");
};

const isProperty = (key: keyof Props<Record<string, any>>): boolean =>
  key !== "children" && key !== "initialLoad" && key !== "previousProps" && !isEvent(key);

const isNewProp =
  (prev: Props<Record<string, any>>, next: Props<Record<string, any>>) =>
  (key: string | number): boolean =>
    prev[String(key).toLowerCase()] !== next[key];

const propIsGone =
  (prev: Props<Record<string, any>>, next: Props<Record<string, any>>) =>
  (key: string | number | symbol): boolean => {
    return !(String(key).toLowerCase() in prev);
  };

const propIsRemovable =
  (prev: Props<Record<string, any>>, next: Props<Record<string, any>>) =>
  (key: string | number): boolean => {
    return propIsGone(prev, next)(key) || isNewProp(prev, next)(key);
  };

const destroyableEventListener = (domElement: DOMElement, eventType: string, handler: (e: Event) => void) => {
  const eventHandler = (e: Event) => {
    if (!e.isTrusted) {
      e.currentTarget?.removeEventListener(e.type, eventHandler);
      return;
    }

    handler(e);
  };

  domElement.addEventListener(eventType, eventHandler);
};

/** UTILS END */

export const unsafeRemoveEventListeners = (domElement: DOMElement) => {
  eventHandlersWithoutOberflaecheId.get(domElement.nodeName)?.forEach((eventType) => {
    const event = new Event(eventType);

    domElement.dispatchEvent(event);
    return;
  });
};

export const removeEventListener = (oldProps: Props<Record<string, any>>) => (name: string | number) => {
  if (oldProps["oberflaecheid"] || oldProps.oberflaecheId) {
    const eventType = String(name).toLowerCase().substring(2);
    const subscription = eventSubscriptions.get(oldProps["oberflaecheid"] || oldProps.oberflaecheId)?.[String(name)];

    if (subscription) {
      subscription.element.removeEventListener(eventType, subscription.func);

      const currentSubscriptionsForElement = eventSubscriptions.get(
        oldProps["oberflaecheid"] || oldProps.oberflaecheId
      );

      // Set removed event listener to unmounted
      if (currentSubscriptionsForElement?.[String(name)]) {
        eventSubscriptions.set(oldProps["oberflaecheid"] || oldProps.oberflaecheId, {
          ...currentSubscriptionsForElement,
          [String(name)]: { ...currentSubscriptionsForElement[String(name)], mounted: false },
        });
      }
    }
  }
};

const setEventListener =
  (domElement: DOMElement, prevProps: Props<Record<string, any>>, newProps: Props<Record<string, any>>) =>
  (name: string | number | keyof HTMLElement) => {
    const eventType = String(name).toLowerCase().substring(2);

    // If there wasn't an `oberflaecheId` provided for the element that should receive an event listener, we add a self destroyable event listener.
    if (!newProps.oberflaecheId) {
      logWarning(consoleMessages.noOberflaecheIdForEventListener);

      unsafeRemoveEventListeners(domElement);

      destroyableEventListener(domElement, eventType, newProps[String(name)]);

      const currentElementTypesWithEventType = eventHandlersWithoutOberflaecheId.get(domElement.nodeName) || [];

      // Add event type to the list of event types for this element type.
      if (!currentElementTypesWithEventType.includes(eventType)) {
        eventHandlersWithoutOberflaecheId.set(domElement.nodeName, [...currentElementTypesWithEventType, eventType]);
      }

      return;
    } else {
      // Create a new reference to the event handler.
      const func = newProps[String(name)].bind();

      domElement.addEventListener(eventType, func);

      eventSubscriptions.set(newProps.oberflaecheId, {
        ...eventSubscriptions.get(newProps.oberflaecheId),
        [String(name)]: { func, element: domElement as Element, mounted: true },
      });
    }
  };

const removeProp = (domElement: DOMElement) => (name: string | number | keyof HTMLElement) => {
  if (typeof (domElement as HTMLElement).setAttribute === "function")
    (domElement as HTMLElement).setAttribute(String(name), "");
  // @ts-ignore
  else domElement[String(name)] = "";
};

const updateProp =
  (domElement: DOMElement, newProps: Props<Record<string, any>>) => (name: string | number | keyof HTMLElement) => {
    if (typeof (domElement as HTMLElement).setAttribute === "function")
      (domElement as HTMLElement).setAttribute(String(name), String(newProps[name]));
    // @ts-ignore
    else domElement[String(name)] = newProps[String(name)];
  };

type PropsUpdater = (
  filter: (key: keyof Props<Record<string, any>>) => boolean,
  differ: (key: keyof Props<Record<string, any>>) => boolean,
  updater: (prop: keyof Props<Record<string, any>>) => void
) => (props: Props<Record<string, any>>) => void;

const propsUpdater: PropsUpdater = (filter, differ, updater) => (props: Props<Record<string, any>>) =>
  props && Object.keys(props).filter(filter).filter(differ).forEach(updater);

//Remove old or changed event listeners
const removeOldEventListeners = (prevProps: Props<Record<string, any>>, nextProps: Props<Record<string, any>>) => {
  return propsUpdater(isEvent, propIsRemovable(prevProps, nextProps), removeEventListener(prevProps))(prevProps);
};

// Remove old properties
const removeOldProperties =
  (domElement: DOMElement) => (prevProps: Props<Record<string, any>>, nextProps: Props<Record<string, any>>) =>
    propsUpdater(isProperty, propIsGone(prevProps, nextProps), removeProp(domElement))(prevProps);

// Set new or changed properties
const updateProperties =
  (domElement: DOMElement) => (prevProps: Props<Record<string, any>>, nextProps: Props<Record<string, any>>) =>
    propsUpdater(isProperty, isNewProp(prevProps, nextProps), updateProp(domElement, nextProps))(nextProps);

// Add event listeners
const addEventListeners =
  (domElement: DOMElement) => (prevProps: Props<Record<string, any>>, nextProps: Props<Record<string, any>>) => {
    return propsUpdater(
      isEvent,
      isNewProp(prevProps, nextProps),
      setEventListener(domElement, prevProps, nextProps)
    )(nextProps);
  };

/**
 * Compare previous props with next props and update the DOM element properties accordingly.
 */
export const updateProps = (
  domElement: DOMElement,
  prevProps: Props<Record<string, any>>,
  nextProps: Props<Record<string, any>>
): void => {
  // Remove old or changed event listeners
  removeOldEventListeners(prevProps, nextProps);
  // Remove old properties
  removeOldProperties(domElement)(prevProps, nextProps);
  // Set new or changed properties
  updateProperties(domElement)(prevProps, nextProps);
  // Add event listeners
  addEventListeners(domElement)(prevProps, nextProps);
};
