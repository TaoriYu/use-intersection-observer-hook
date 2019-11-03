# useIntersectionObserver React hook

Tiny react compatible implementation of
[Intersection Observer browser API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API).

## Installation
```
npm install useIntersectionObserver
```
```
yarn add useIntersectionObserver
```

## Why do you need it
- api is very simple;
- **whole codebase is 100 lines only;**
- it takes care of memory management;

## Example

```typescript
import * as React from 'react';
import { useIntersectionObserver } from 'use-intersection-observer';

// let's assume that we want create a component that
// paginates when it intersect the viewport
interface IPaginatorProps {
  fetchAction(): void;
}

export function Paginator({ fetchAction }: IPaginatorProps) {
  // we call useIntersectionObserver hook without any settings provided,
  // because we want the root is to be viewport and the threshold is to be set
  // to a single value - 0. Also we will add rootMargin parameter like below
  // to make pagination triggers in 100px below viewport - so there is no any big
  // lags while page scrolling.
  const [ref, ...entries] = useIntersectionObserver<HTMLDivElement>({ rootMargin: '0px 0px 100px 0px'});
  // here we've got the ref to identify our target element and set of entries to manipulate

  React.useEffect(() => {
    // now we need to fire pagination as soon as Paginator intersects the viewport
    if (entries[0] && entries[0].isIntersecting) {
      fetchAction();
    } 
  }, [entries]);
  
  // very important part is to set some dimensions to this div - otherwise it will stay
  // "invisible" for Intersection Observer
  return <div className={someStyles} ref={ref} />; 
  
} 
// all we need at this point is to set Paginator at the end of some long list of data:
interface ISomeLongListOfDataProps {
  dataList: any[];
}

export function SomeLongListOfData({ dataList }: ISomeLongListOfDataProps) {
  // let's use just fake action with some log inside
  const paginate = () => { console.log('>> PAGINATE TRIGGERS') }

  return (
    <div>
      {dataList.map(ListItem)}
      <Paginator fetchAction={paginate} />
    </ div>
  );
}
// And here we are - this is all necessary steps to achieve our goals.
// As soon as we scroll to the end of the list message
// '>> PAGINATE TRIGGERS' will appear in console.
```

## API
Parameters accepted with useIntersectionObserver are identical to
IntersectionObserver class settings except of "active" parameter.
Let's consider each parameter in more detail.

###Input
UseIntersectionObserver takes an object of four parameters:
```typescript
interface IParameters {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  active?: boolean;
}
```
- root?: Element | null - the same root as IntersectionObserver's one. It's optional
and means rectangle that will be intersected by the target. Sets to null and is viewport
by default.
- rootMargin?: string - the same rootMargin as IntersectionObserver's one. It's optional
and means margin that adding to your root if it's provided. By default has value '0px 0px 0px 0px'.
- threshold?: number | number[] - the same threshold as IntersectionObserver's one.
It is optional and means percents of target visibility in root element. By default sets to
[0].
- active?: boolean - this boolean parameter provides in due to control of observation.
It is optional and sets to true by default.

###Output
UseIntersectionObserver returns an array of two values: ref and array of entries.
`type TOutput<T> = [React.RefObject<T>, ...IntersectionObserverEntry[]]`
- ref: React.RefObject<T> - React.RefObject that provided to connect your Intersection
Observer with your target element.
- entries: IntersectionObserverEntry[] - an array of Intersection Observer entries gives 
you an instrument to manage Intersection Observer callbacks.

## Examples

### Using active parameter
Let's implement lazy load image component. Besides we want to stop observe an image
when it stops to load.

```typescript
import * as React from 'react';
import { useIntersectionObserver } from 'useIntersectionObserver';
 
interface ILazyImage {
  src: string;
  alt: string;
}

export function LazyImage({ alt, src }: ILazyImage) {
  // we will use state to control active parameter and switch it when needed
  const [ active, setActive ] = React.useState(true);
  // call an intersection observer hook where active is true so it will observe out img
  const [ref, ...entries] = useIntersectionObserver({ active });
  // a handler to stop observe image
  const unobserve = () => { setActive(false); }

  // Now what we need to do is specify src which should be set with empty string
  // first and when it intersects viewport, it should be set to actual image address.
  // Another thing to do is to set onLoad handler to disconnect Intersection Observer
  // and this target.
  return (
    <img
      alt={alt}
      ref={ref}
      src={entries[0] && entries[0].isIntersecting ? src : ''}
      onLoad={unobserve}
    />
  );
}
```
