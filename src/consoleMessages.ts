export default {
  noOberflaecheIdForEventListener: `
You attached an event listener to an element without an oberflaecheId! This is less performant and could cause undesired behaviour in some cases.
    
Event listener gets removed when the event is not initiated by the user, e.g. by a script.
`,
  noOberflaecheIdForEffectHandler: `No oberflaecheId provided to the effect handler! It won't do anything.`,
  noEffectIdForEffectHandler: `No effectId provided to the effect handler! It won't do anything.`,
  noOberflaecheIdForRefresh: `
  No oberflaecheId provided to refresh!
  Calling it will do nothing.
      `,
  noOberflaecheIdForState: `
    No oberflaecheId provided for state!          
    Calling it will do nothing.
        `,
  domElementWithOberflaecheIdNotFound: (oberflaecheId: string) => `
DOM element with oberflaecheId "${oberflaecheId}" could not be found!
Please make sure you set the oberflaecheId prop on the outermost element in the component you try to call refresh for.
      `,
};
