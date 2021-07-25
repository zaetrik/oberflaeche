import consoleMessages from "../consoleMessages";
import { createComponentRefresh } from "./refresh";
import { Component, ComponentContext, Props } from "./types";
import { logWarning } from "./utils";

// Stores the state for all components. Key is the `oberflaecheId`.
export const state = new Map<string, any>();

/**
 * Utilities for components that will be passed as context to the component functions.
 */

/**
 * State functions for components.
 * Returns two state functions.
 * One is component bound and one let's you read and set state
 * for any other component that has a `oberflaecheId` defined.
 */
export const createComponentState = <INITIAL extends Record<string, any>>(
  initializingComponent: Component<INITIAL>,
  initializingProps: Props<INITIAL>
): [ComponentContext["state"], ComponentContext["stateOther"]] => {
  const componentState = <PROPS = Record<string, any>>(
    component: Component<PROPS>,
    props: Props<PROPS>
  ): ComponentContext["state"] => {
    return <STATE extends Record<string, any>>(
      oberflaecheId: string,
      initialState?: STATE,
      options: { diffing?: boolean; autoRefresh?: boolean } = { diffing: true, autoRefresh: true }
    ) => {
      // Return a dummies if the user forgot to add the `oberflaecheId`.
      if (!oberflaecheId) {
        logWarning(consoleMessages.noOberflaecheIdForState);

        return [() => initialState, () => {}];
      }

      // Key does not exist in state we know that this is the initial call for this component.
      if (!state.has(oberflaecheId)) {
        state.set(oberflaecheId, initialState);
      }

      // Setter function that will be available in the component.
      const stateUpdater = (newState: STATE) => {
        const currentState = state.get(oberflaecheId);

        // Only update the state, if it is new
        if (currentState === newState) return currentState;

        state.set(oberflaecheId, newState);

        if (options.autoRefresh) {
          const [refresh] = createComponentRefresh(component, props);
          refresh(oberflaecheId, options);
        }

        return;
      };

      // Getter function that will be available in the component.
      const getState = () => {
        return state.get(oberflaecheId);
      };

      return [getState, stateUpdater];
    };
  };

  return [
    componentState<INITIAL>(initializingComponent, initializingProps),
    <STATE2 extends Record<string, any>, PROPS2 = Record<string, any>>(
      component: Component<PROPS2>,
      props: Props<PROPS2>,
      oberflaecheId: string,
      initialState?: STATE2,
      options?: { diffing?: boolean; autoRefresh?: boolean }
    ) => componentState(component, props)(oberflaecheId, initialState, options),
  ];
};

/**
 * Global state function, that let's you view any components state.
 */
export function globalState(): Map<string, any>;
export function globalState<STATE extends Record<string, any>>(oberflaecheId: string): STATE;
export function globalState<STATE extends Record<string, any>>(oberflaecheId?: string): STATE | Map<string, any> {
  if (oberflaecheId) return state.get(oberflaecheId) as STATE;
  return state as Map<string, any>;
}
