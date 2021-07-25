import consoleMessages from "../consoleMessages";
import { ComponentContext, ComponentEffect, Effect } from "./types";
import { logWarning } from "./utils";

// Stores the previous dependencies of effects. Key is the `oberflaecheId`.
const effects = new Map<string, ComponentEffect>();

const initialEffectState: Effect = {
  dependenciesPreviousRun: [],
  cleanUp: () => {},
  executedEffect: false,
  executedCleanUp: false,
  firstRun: true,
};

export const createEffectsHandler = (): ComponentContext["effect"] => {
  /**
   * @param func Wrap your effects inside this function and return a clean up function, if necessary.
   * @param dependencies Dependencies, that cause the effect function to run, when they change.
   */
  const effectHandler = (func: () => () => void, dependencies: any[], oberflaecheId: string, effectId: string) => {
    if (!oberflaecheId) {
      logWarning(consoleMessages.noOberflaecheIdForEffectHandler);
      return;
    }

    if (!effectId) {
      logWarning(consoleMessages.noEffectIdForEffectHandler);
      return;
    }

    const currentEffectData = effects.get(oberflaecheId)?.[effectId];
    // Set initial values
    if (!currentEffectData) {
      effects.set(oberflaecheId, {
        ...(effects.get(oberflaecheId) || {}),
        [effectId]: initialEffectState,
      });
    }

    const { dependenciesPreviousRun, executedEffect, executedCleanUp, firstRun } =
      effects.get(oberflaecheId)?.[effectId] || initialEffectState;

    if (
      (dependencies.some((dep, index) => dep != dependenciesPreviousRun[index]) && !executedEffect) ||
      (dependencies.length === 0 && firstRun && !executedCleanUp)
    ) {
      // Run the effect
      const cleanUp = func();

      effects.set(oberflaecheId, {
        ...(effects.get(oberflaecheId) || {}),
        [effectId]: {
          cleanUp: typeof cleanUp === "function" ? cleanUp : () => {},
          dependenciesPreviousRun: dependencies,
          executedEffect: true,
          executedCleanUp: false,
          firstRun: false,
        },
      });
    }
  };

  return effectHandler;
};

export const runComponentEffectCleanUps = (oberflaecheId: string) => {
  const effectCleanUps = effects.get(oberflaecheId) || {};

  Object.entries(effectCleanUps).map(
    ([effectId, { cleanUp, executedEffect, executedCleanUp, dependenciesPreviousRun }]) => {
      if (executedEffect && !executedCleanUp) {
        const currentEffectEntry = effects.get(oberflaecheId) || {};
        effects.set(oberflaecheId, {
          ...currentEffectEntry,
          [effectId]: {
            ...currentEffectEntry[effectId],
            cleanUp: () => {},
            executedEffect: false,
            executedCleanUp: true,
          },
        });

        cleanUp();
      }
    }
  );
};
