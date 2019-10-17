import { equals, pipe, prop, merge } from 'ramda';
import { RefObject, useEffect, useRef, useState } from 'react';

type TIntersectionObserverHook<T> = [RefObject<T>, ...IntersectionObserverEntry[]];

type TSetEntries = (entries: IntersectionObserverEntry[]) => void;

interface IObserverOptions extends IntersectionObserverInit {
  active?: boolean;
}

interface IObserverObject {
  observer: IntersectionObserver;
  options: IObserverOptions;
  registerCallback(cb: TSetEntries, element: Element): void;
  unregisterCallback(element: Element): void;
}

interface IRegisterObserverProps extends IObserverOptions {
  setEntries(entries: IntersectionObserverEntry[]): void;
}

interface ICallbackOptions {
  callback: IntersectionObserverCallback;
  element: Element;
}

/** Default values for useIntersectionObserver parameters */
const DEFAULT_PARAMS: IObserverOptions = {
  active: true,
  rootMargin: '0px 0px 0px 0px',
  threshold: 0,
  root: null,
};
const observers: IObserverObject[] = [];

export function useIntersectionObserver<T extends HTMLElement>(params?: IObserverOptions): TIntersectionObserverHook<T> {
  const ref = useRef<T>(null);
  const [entries, setEntries] = useState<IntersectionObserverEntry[]>([]);
  const { active, ...options } = merge(params || {}, DEFAULT_PARAMS);

  useEffect(() => {
    const observerInstance = observers.find(pipe(prop('options'), equals(options))) ||
      registerObserverInstance({ setEntries, ...options });

    if (ref.current && active) {
      return observerInstance.registerCallback(setEntries, ref.current);
    }

    if (ref.current && !active) {
      observerInstance.unregisterCallback(ref.current);
    }
  }, [ref.current, active]);

  return [ref, ...entries]
}

function registerObserverInstance({ active, ...options }: IRegisterObserverProps): IObserverObject {
  let callbackOptions: ICallbackOptions[] = [];

  const cbRunner = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {

    callbackOptions.forEach(({ callback, element }) => {
      const entriesForElement = entries.filter(({ target }) => target === element);

      if (entriesForElement) {
        callback(entriesForElement, observer);
      }

    });
  };

  const observerInstance = new IntersectionObserver(cbRunner, options);

  const observerObject: IObserverObject = {
    observer: observerInstance,
    options: { ...options, active },
    registerCallback: (setEntries: TSetEntries, element: Element) => {
      observerInstance.observe(element);
      callbackOptions.push({ callback: setEntries, element });

      return () => {
        observerInstance.unobserve(element);
        callbackOptions = callbackOptions.filter(({ callback, element: optionElement }) =>
          optionElement === element && callback === setEntries
        );
      };
    },
    unregisterCallback(element: Element): void {
      observerInstance.unobserve(element);
    },
  };

  observers.push(observerObject);

  return observerObject;
}
