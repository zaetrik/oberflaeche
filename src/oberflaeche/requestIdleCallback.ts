// We have to add requestIdleCallBack by ourself
type RequestIdleCallbackHandle = any;
type RequestIdleCallbackOptions = {
  timeout: number;
};
export type RequestIdleCallbackDeadline = {
  readonly didTimeout: boolean;
  timeRemaining: () => number;
};
declare global {
  interface Window {
    requestIdleCallback: (
      callback: (deadline: RequestIdleCallbackDeadline) => void,
      opts?: RequestIdleCallbackOptions
    ) => RequestIdleCallbackHandle;
    cancelIdleCallback: (handle: RequestIdleCallbackHandle) => void;
  }
}

/**
 * See https://developers.google.com/web/updates/2015/08/using-requestidlecallback
 *
 * This simple solution should be enough for now,
 * but if performance is not optimal we could implement our own polyfill like React did.
 *
 * => https://github.com/facebook/react/blob/eeb817785c771362416fd87ea7d2a1a32dde9842/packages/scheduler/src/Scheduler.js?source=post_page---------------------------#L212-L222
 */
export const requestIdleCallback = Boolean(window?.requestIdleCallback)
  ? window.requestIdleCallback.bind(window)
  : function (cb: (deadline: RequestIdleCallbackDeadline) => void) {
      const start = Date.now();
      return setTimeout(function () {
        cb({
          didTimeout: false,
          timeRemaining: function () {
            return Math.max(0, 50 - (Date.now() - start));
          },
        });
      }, 1);
    };
