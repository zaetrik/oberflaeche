import { DiffParams, updateDOM } from "./diff";
import { requestIdleCallback, RequestIdleCallbackDeadline } from "./requestIdleCallback";

const work: {
  unitsOfWork: DiffParams[];
  running: boolean;
  workToCommit: ((...args: any[]) => void)[];
} = { unitsOfWork: [], running: false, workToCommit: [] };

export const workLoop = (deadline: RequestIdleCallbackDeadline) => {
  while (work.unitsOfWork.length > 0 && !work.running && !deadline.didTimeout) {
    const unit = getNextUnitOfWork();

    if (unit) {
      work.running = true;
      updateDOM(unit);
      work.running = false;
    }
  }

  // If we finished diffing the components and DOM tree, we commit the results to the DOM.
  if (!work.running && work.workToCommit.length > 0 && !deadline.didTimeout) {
    work.workToCommit.forEach((func) => {
      requestIdleCallback(func);
    });

    work.workToCommit = [];
  }

  requestIdleCallback(workLoop);
};

const getNextUnitOfWork = () => {
  return work.unitsOfWork.shift();
};

export const scheduleCommit = (func: () => void) => {
  work.workToCommit.push(func);
};

export const scheduleWork = (params: DiffParams) => {
  work.unitsOfWork.push(params);
};
