# How does history.js work? 

## Motivation

Recently, I've been delving into React Router. As we know, it provides two primary methods for implementing routing in our applications: HashRouter and BrowserRouter.

My curiosity was piqued by how React Router do this behind the scenes.  I discovered that the Remix team maintains a repository named `history.js`, which serves as the underlying layer for React Router. 

Let 's explore this further and enjoy the learning journey 🥳.

## Prepare  

* You 'd better have a solid understanding  about the [History API](https://developer.mozilla.org/en-US/docs/Web/API/History).

* Obtain the source code, and here, we will specifically analyze the [core part](https://github.com/remix-run/history/blob/dev/packages/history/index.ts).

  > Note: this analysis is besed on  history.js version 5.3.0.

## **Overview**

### What is `history.js` ? 

> The history library lets you easily manage session history anywhere JavaScript runs. A `history` object abstracts away the differences in various environments and provides a minimal API that lets you manage the history stack, navigate, and persist state between sessions.

Keywords: 

* Manage History anywhere JavaScript Runs:
* Abstract APIs
* Persist  State

## Code analysis

### Basis 

#### Path & Location

The `Path` interface declares the visible part of a `Location`, such as `http://example/home?type=foo#bar`, which can be divided into different parts. On the other hand, `Location` contains `state` and `key` properties that are invisible yet crucial. Developers have the ability to conceal certain information from the URL by storing it in the `state` property. Additionally, valuable data can be stored in `localStorage` based on the `key` property. This flexibility allows developers to manage the visibility of information in the URL and handle sensitive or persistent data according to their specific needs.

```typescript
export type Pathname = string;
export type Search = string;
export type Hash = string;
export type State = unknown;
export type Key = string;

/** 
 * The pathname, search, and hash values of a URL.
 */
export interface Path {
  pathname: Pathname;
  search: Search;
  hash: Hash;
}

/** 
 * An entry in a history stack. A location contains information about the
 * URL path, as well as possibly some arbitrary state and a key.
 */
export interface Location extends Path {
  state: unknown;
  key: Key;
}
```

#### Action 

```typescript
/** 
 * Actions represent the type of change to a location value.
 */
export enum Action {
  Pop = 'POP',
  Push = 'PUSH',
  Replace = 'REPLACE'
}
```

#### Update & Transition

*Something like Redux 🤔* 

```typescript
/**
 * A change to the current location.
 */
export interface Update {
  action: Action;
  location: Location;
}

/**
 * A change to the current location that was blocked. May be retried
 * after obtaining user confirmation.
 */
export interface Transition extends Update {
  retry(): void;
}
```

#### Events

A simple implementation of a publish-subscribe model

```typescript
/**
 * A function that receives notifications about location changes.
 */
export interface Listener {
  (update: Update): void;
}

/**
 * A function that receives transitions when navigation is blocked.
 */
export interface Blocker {
  (tx: Transition): void;
}

type Events<F> = {
  length: number;
  push: (fn: F) => () => void;
  call: (arg: any) => void;
};
function createEvents<F extends Function>(): Events<F> {
  // event handlers list
  let handlers: F[] = [];

  return {
    get length() {
      return handlers.length;
    },
    // Register a handler and return a function that can be used to remove it
    push(fn: F) {
      handlers.push(fn);
      return function () {
        handlers = handlers.filter((handler) => handler !== fn);
      };
    },
    // When the event is triggered, execute all handlers.
    call(arg) {
      handlers.forEach((fn) => fn && fn(arg));
    }
  };
}
```

### Methods

`history.js` provides three methods to create history object.

```typescript
// BROWSER
export function createBrowserHistory(
  options: BrowserHistoryOptions = {}
): BrowserHistory {}
// HASH
export function createHashHistory(
  options: HashHistoryOptions = {}
): HashHistory {...}
// MEMORY
export function createMemoryHistory(
  options: MemoryHistoryOptions = {}
): MemoryHistory {...}
```

#### Input 

In both `createBrowserHistory` and `createHashHistory`, to set up the history, provide options with a window object that is used to establish a connection with the browser.

```typescript
// BROWSER
export type BrowserHistoryOptions = { window?: Window };
function createBrowserHistory(options) {
  // use document.defaultView as a defaultValue 
  // BTW , in ts 'defaultView!' indicates that you are asserting it is not empty
	let { window = document.defaultView! } = options;
	let globalHistory = window.history;
  
  // ...
} 
// HASH is same with BROWSER
```

In the `createMemoryHistory`, to configure the history, provide options with an `initialEntries` object, used to initialize entries similar to the history stack in a browser, and `initialIndex` to set the current position in the entries.

This history implementation internally stores its locations in an array and is not tied to an external source. Therefore, it is suitable for Node.js, React Native, or test environments.

```typescript
export type InitialEntry = string | Partial<Location>;
export type MemoryHistoryOptions = {
  initialEntries?: InitialEntry[];
  initialIndex?: number;
};

function createMemeryHistory(options) {
  let { initialEntries = ['/'], initialIndex } = options;
  // using a map to generate entries	
	let entries: Location[] = initialEntries.map((entry) => {
    let location = readOnly<Location>({
      pathname: '/',
      search: '',
      hash: '',
      state: null,
      key: createKey(),
      ...(typeof entry === 'string' ? parsePath(entry) : entry)
    });
    return location;
  });
  // limit the initialIndex within 0 to entries.length - 1
  let index = clamp(
    initialIndex == null ? entries.length - 1 : initialIndex,
    0,
    entries.length - 1
  );
}

```

#### Output

```typescript
// BROWSER
export interface BrowserHistory extends History {}
// HASH
export interface HashHistory extends History {}
// MEMORY
export interface MemoryHistory extends History {
  readonly index: number;
}
```

As we can see, the output object of these three methods is a subtype derived from `History`. Let's check it.

#### History Interface

```typescript
/**
 * A history is an interface to the navigation stack. The history serves as the
 * source of truth for the current location, as well as provides a set of
 * methods that may be used to change it.
 *
 * It is similar to the DOM's `window.history` object, but with a smaller, more
 * focused API.
 */
export interface History {
  readonly action: Action;
  readonly location: Location;
  createHref(to: To): string;
  push(to: To, state?: any): void;
  replace(to: To, state?: any): void;
  go(delta: number): void;
  back(): void;
  forward(): void;
  listen(listener: Listener): () => void;
  block(blocker: Blocker): () => void;
}
```

#### Inner Functions 

OK! Now that we have taken a glance at what we need to know beforehand, let's break down the details of these methods. Let's examine some internal functions first

##### HistoryState

It is used in `createBrowserHistory` and `createHashHistory`

```typescript
/**
  * An internal object utilized to store the 'key' and 'state' properties of 
  * a Location in window.history.state, while maintaining a count of 'index'
  * for going back in block events .
*/
type HistoryState = {
  // Location's state that stores the real user's state value
  usr: any;
  // Location's key
  key?: string;
  // index used for blocking purposes init value is 0.
  idx: number;
};

```

##### getIndexAndLocation

It is used in `createBrowserHistory` and `createHashHistory`

```typescript
function getIndexAndLocation(): [number, Location] {
  	/**
      * get Path properties from window.loaction or window.location.hash
      *
  		* << Code in createHashHistory >>
  		* let {
      *   pathname = '/',
      *  	search = '',
      * 	hash = ''
      * } = parsePath(window.location.hash.substr(1));
    */
    let { pathname, search, hash } = window.location;
  	
		/**
			* The state declared here is either a HistoryState or an empty object.
			* When a user opens a new window,window.state is null. By default the 
			* state here is set to empty object
			* Upon window refresh, it will retrieve state from window.state.
			* So it can persist state even when the user refreshes the page.
		*/
    let state = globalHistory.state || {};
  
  	// return the index and the created Location 
    return [
      state.idx,
      readOnly<Location>({
        pathname,
        search,
        hash,
        state: state.usr || null,
        key: state.key || 'default'
      })
    ];
  }
```

##### getHistoryStateAndUrl

It is used in `createBrowserHistory` and `createHashHistory`.

```typescript
// generate the parameters for history.pushState or history.replaceState
function getHistoryStateAndUrl(
    nextLocation: Location,
    index: number
  ): [HistoryState, string] {
    return [
      {
        usr: nextLocation.state,
        key: nextLocation.key,
        idx: index
      },
      createHref(nextLocation)
    ];
  }
```

##### getNextLocation

It is used in all of three methods.

```typescript
// generate a new Location object
function getNextLocation(to: To, state: any = null): Location {
    return readOnly<Location>({
      pathname: location.pathname,
      hash: '',
      search: '',
      ...(typeof to === 'string' ? parsePath(to) : to),
      state,
      key: createKey()
    });
  }
```

##### allowTx & applyTx

```typescript
// check if the transcation can be applied
function allowTx(action: Action, location: Location, retry: () => void) {
  	// if these is no blocker, just return true
  	// else exec all blockers and return false
    return (
      !blockers.length || (blockers.call({ action, location, retry }), false)
    );
  }

// upadate action,location and index that is maintanined in the history,
// and exec all listeners.
function applyTx(nextAction: Action) {
    action = nextAction;
    [index, location] = getIndexAndLocation();
    listeners.call({ action, location });
  }
// in createMemeryHistory
function applyTx(nextAction: Action, nextLocation: Location) {
    action = nextAction;
    location = nextLocation;
    listeners.call({ action, location });
 }
```

#### Exposed Porperties

Let's proceed to see how the exposed porperties are implemented.

##### action & location & index 

```typescript
// use getter function for real-time data
let history: MemoryHistory = {
  	// only in createMemoryHistory
    get index() {
      return index;
    },
    get action() {
      return action;
    },
    get location() {
      return location;
    },
    ...
  };
```

##### createHref 

```typescript
// in createBrowserHistory and createMemeryHistory 
function createHref(to: To) {
   return typeof to === 'string' ? to : createPath(to);
}

// in createHashHistory 
function getBaseHref() {
    let base = document.querySelector('base');
    let href = '';
		// Check base value here but actually use 'window.location.href' to ensure the href created by 'creatHref' is an absolute path. Because linking to a relative path erases the hash part of a URL 
    if (base && base.getAttribute('href')) {
      let url = window.location.href;
      let hashIndex = url.indexOf('#');
      href = hashIndex === -1 ? url : url.slice(0, hashIndex);
    }

    return href;
}

function createHref(to: To) {
   return getBaseHref() + '#' + (typeof to === 'string' ? to : createPath(to));
}
```

##### push & replace

When `push` or `replace` is called in hash and browser mode , it checks for the presence of a blocker. If no blocker is found, it proceeds to invoke the `pushState` or `replaceState` with the newly generated `HistoryState` and `index`.On the other hand, it executes all blockers, typically allowing users to discard the blocker if they approve the navigation.Beside, hash mode  does not support relative path.

In memory mode, instead of invoking the HTML5 API, it directly manipulates the entries stack created by itself. The blocking process operates in a similar manner.

```typescript
	// in createBrowserHistory and createMemeryHistory 
	function push(to: To, state?: any) {
    let nextAction = Action.Push;
    let nextLocation = getNextLocation(to, state);    
    // set retry for resuming the push operation after the execution of blockers
    function retry() {
      push(to, state);
    }
		
    
    
    if (allowTx(nextAction, nextLocation, retry)) {
      let [historyState, url] = getHistoryStateAndUrl(nextLocation, index + 1);

      // try...catch because iOS limits us to 100 pushState calls :/
      try {
        globalHistory.pushState(historyState, '', url);
      } catch (error) {
        // They are going to lose state here, but there is no real
        // way to warn them about it since the page will refresh...
        window.location.assign(url);
      }

      applyTx(nextAction);
    }
  }

  function replace(to: To, state?: any) {
		...
    if (allowTx(nextAction, nextLocation, retry)) {
      ...
      globalHistory.replaceState(historyState, '', url);

      applyTx(nextAction);
    }
  }

  // in createMemeryHistory
	function push(to: To, state?: any) {
  	...
    if (allowTx(nextAction, nextLocation, retry)) {
      index += 1;
      entries.splice(index, entries.length, nextLocation);
      applyTx(nextAction, nextLocation);
    }
  }
	
  function replace(to: To, state?: any) {
    ...
    if (allowTx(nextAction, nextLocation, retry)) {
      entries[index] = nextLocation;
      applyTx(nextAction, nextLocation);
    }
  }
```

##### go & back & forward

Cause `back` equal to `go(-1)`, `forward` equal to `go(1)` ,we just need to focus on `go`'s implementation.

In browser and hash mode, it simply invokes the HTML5 `go`. However, in memory mode, it invokes `allowTx` and `applyTx`. This distinction arises because `go` triggers an event called 'popstate' in the browser environment, and we'll discuss this later.

```typescript
// in createBrowserHistory and createMemeryHistory 
function go(delta: number) {
    globalHistory.go(delta);
}

// in createMemoryHistory
function go(delta: number) {
    // prevent the array from exceeding its limits.
    let nextIndex = clamp(index + delta, 0, entries.length - 1);
  
    let nextAction = Action.Pop;
    let nextLocation = entries[nextIndex];
    function retry() {
      go(delta);
    }
		// like push and repalce
    if (allowTx(nextAction, nextLocation, retry)) {
      index = nextIndex;
      applyTx(nextAction, nextLocation);
    }
  }

```

##### listen & block  

If you have forgotten what is the type definition in this context, you can go back and check [it](#Events)

```typescript
const BeforeUnloadEventType = 'beforeunload';

// init the events
let listeners = createEvents<Listener>();
let blockers = createEvents<Blocker>();

function promptBeforeUnload(event: BeforeUnloadEvent) {
  // Cancel the event.
  event.preventDefault();
  // Chrome (and legacy IE) requires returnValue to be set.
  event.returnValue = '';
}

let history = {
		// ...
  	// add a listener and return a dismiss function
    // just like 'useEffect' 👀
    listen(listener) {
      return listeners.push(listener);
    },
    // add blocker and return a dismiss function
  	block(blocker) {
      let unblock = blockers.push(blocker);
			
		 //	In browser and hash mode, it handles the beforeunload event to
     //  provide a warning before the user leaves the page.
      if (blockers.length === 1) {
        window.addEventListener(BeforeUnloadEventType, promptBeforeUnload);
      }

      return function () {
        unblock();

        // Remove the beforeunload listener so the document may
        // still be salvageable in the pagehide event.
        // See https://html.spec.whatwg.org/#unloading-documents
        if (!blockers.length) {
          window.removeEventListener(BeforeUnloadEventType, promptBeforeUnload);
        }
      };
    }
  };

// in createMemoryHistory
let history = {
	//  ... 
  block(blocker) {
     let unblock = blockers.push(blocker);
  }
}
```

#### Browser Events

Here, we reach the final part of this code analysis 🙌.There are two browser events that `history.js` uses to establish client router: `popstate` and `hashchange`. The MDN explanations are as follow.

> The **`hashchange`** event is fired when the fragment identifier of the URL has changed (the part of the URL beginning with and following the `#` symbol).

>  The **`popstate`** event of the `Window` interface is fired when the active history entry changes while the user navigates the session history. It changes the current history entry to that of the last page the user visited or, if `history.pushState()` has been used to add a history entry to the history stack, that history entry is used instead.

So, we use `hashchange` for hash mode and `popstate` for both hash and browser modes.

```typescript
const HashChangeEventType = 'hashchange';
const PopStateEventType = 'popstate';

// store the last transcation using a closure
let blockedPopTx: Transition | null = null;

function handlePop() {
    // if blockedPopTx exsit, use it to execute all blokcers and set blockedPopTx to null
    if (blockedPopTx) {
      blockers.call(blockedPopTx);
      blockedPopTx = null;
    } else {
      // When the code reaches this point, the browser's location has changed, allowing us to retrieve the next index and Location.
			// To be explicit, 'next' has no relation to the direction; going back can also be 	treated as 'next'.
			
      let nextAction = Action.Pop;
      let [nextIndex, nextLocation] = getIndexAndLocation();
 			
      // if there is blockers
      if (blockers.length) {
        // Usually, we can obtain a valid index and location here because all history entries are produced from history.js unless you invoke the HTML5 APIs directly.
        if (nextIndex != null) {
          // calculate the steps of change
          let delta = index - nextIndex;
          if (delta) {
            // create and save the transaction to 'blockedPopTx'
            blockedPopTx = {
              action: nextAction,
              location: nextLocation,
              retry() {
                go(delta * -1);
              }
            };
						// Go back to the former page, and this action will trigger the 'handlePop' function again. This allows it to execute blockers saved in 'blockedPopTx'.
            go(delta);
          }
        } else {
          // Trying to POP to a location with no index. We did not create
          // this location, so we can't effectively block the navigation.
          warning(
            false,
            // TODO: Write up a doc that explains our blocking strategy in
            // detail and link to it here so people can understand better
            // what is going on and how to avoid it.
            `You are trying to block a POP navigation to a location that was not ` +
              `created by the history library. The block will fail silently in ` +
              `production, but in general you should do all navigation with the ` +
              `history library (instead of using window.history.pushState directly) ` +
              `to avoid this situation.`
          );
        }
      } else {
        // no blocker 
        applyTx(nextAction);
      }
    }
  }

  window.addEventListener(PopStateEventType, handlePop);

  // popstate does not fire on hashchange in IE 11 and old (trident) Edge
  // https://developer.mozilla.org/de/docs/Web/API/Window/popstate_event
  window.addEventListener(HashChangeEventType, () => {
    let [, nextLocation] = getIndexAndLocation();

    // Ignore extraneous hashchange events.
    if (createPath(nextLocation) !== createPath(location)) {
      handlePop();
    }
  });
```

#### Process

#####  Initialization Phase

- Bind `window.history` to `globalHistory`.
- Initialize index, action, and location.
- Create listener and blocker events.
- Add `hashchange` and `popstate` listeners to the window.

##### Runtime  Phase

- Developers register `listener` and `blocker`.
- Users perform operations in the app that affect routers.
- `history.js` stores every router action in `window.history` so that it persists even after refreshing the page.
- `history.js` watches router changes and invokes listener handlers and blocker handlers at the right time.

## Summary

`history.js` is a minimal yet crucial library for React Router. It implements both hash router and browser router through the secondary encapsulation of HTML5 history APIs. Additionally, it offers a simulation for non-browser environments such as Node and React Native, ensuring compatibility across different platforms. By utilizing a transaction and events mode, it empowers users to block URL changes and exec extra task when the URL changes. 

**Thanks for reading!😋** 











