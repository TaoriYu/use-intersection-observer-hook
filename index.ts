import { equals, pipe, prop } from 'ramda';
import { RefObject, useEffect, useRef, useState } from 'react';

type TIntersectionObserverHook<T> = [RefObject<T>, ...IntersectionObserverEntry[]];

type TSetEntries = (entries: IntersectionObserverEntry[]) => void;

interface IObserverOptions extends IntersectionObserverInit {
  active: boolean;
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

const observers: IObserverObject[] = [];

export function useNewIntersectionObserver<T extends HTMLElement>({ active = true, ...options}: IObserverOptions): TIntersectionObserverHook<T> {
  const ref = useRef<T>(null);
  const [entries, setEntries] = useState<IntersectionObserverEntry[]>([]);
  const opts = { active, ...options };

  useEffect(() => {
    const observerInstance = observers.find(pipe(prop('options'), equals(opts))) ||
      registerObserverInstance({ setEntries, ...opts });

    if (ref.current && active) {
      return observerInstance.registerCallback(setEntries, ref.current);
    }

    if (ref.current && !active) {
      observerInstance.unregisterCallback(ref.current);
    }
  }, [ref.current, active]);

  return [ref, ...entries]
}

export function registerObserverInstance({ active, ...options }: IRegisterObserverProps): IObserverObject {
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