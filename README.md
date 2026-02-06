# Ember Master Tab

## Synopsis

This addon provides a `service` that allows you to run code on a single tab of your ember
application. You might find this useful if your app has functionality that for some reason
does not make sense or it is wasteful/redundant to have it run on every tab that is currently
open. For example, you might be continuously pulling some state from your server API that
you are saving on `localStorage` which you then use to update your UI through event listeners.

## Compatibility

* Ember.js v4.4 or above
* Ember CLI v4.4 or above
* Node.js v14 or above

## Modern Implementation

As of version 3.0.0, the `master-tab-factory` service has been updated to use native ES6 class syntax for better performance, security, and maintainability:

* **Native class syntax** - Uses modern `class` syntax instead of `Service.extend()`
* **Secure implementation** - Replaces insecure `eval()` calls with safe boolean parsing
* **Reactive `isMasterTab` property** - Uses `@tracked` decorator for automatic template updates when master tab status changes
* **Full backward compatibility** - All existing APIs remain unchanged and work with both classic and native class patterns

The examples in this README use **native class syntax** (Ember Octane style), which is the recommended approach for modern Ember applications. The service works seamlessly with both classic and native class implementations in your application.

### Automatic Reactivity

The `isMasterTab` property is now decorated with `@tracked`, which means templates automatically re-render when the master tab status changes:

```hbs
{{!-- This will automatically update when master tab status changes --}}
<p>Is this the master tab? <strong>{{#if this.masterTab.isMasterTab}}Yes{{else}}No{{/if}}</strong></p>
```

When a tab loses or gains master status (e.g., when the master tab closes), any template or computed property referencing `this.masterTab.isMasterTab` will automatically update without requiring manual property observation or `set()` calls. This provides a seamless reactive experience with Ember's auto-tracking system.

## Notes

* The service ensures that only one master tab exists at any one time.
* If the current master tab closes or refreshes, any other tab can take the responsability at that time.
* If the current master tab crashes, ***currently*** no other tab will take the responsability until
  a new tab is opened. 
* This service is most useful on objects that provide global functionality to your application, such as other services.


`npm install ember-master-tab`

## Code Example

You can clone this repository and have a look at the dummy app to see it in action.

**`run(func1, options = {}).else(func2)`**
- `func1`: If this is the master tab, run this function.
- `options` *(optional)*:
 - `force` *(optional, default: `false`)*: If `true`, run `func1` irregardless of this being the master tab or not.
- `func2`: If this is *not* the master tab, run this instead.

```js
// services/server-time-run.js
import Service from '@ember/service';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { later } from '@ember/runloop';

export default class ServerTimeRunService extends Service {
  @service masterTab;
  @tracked currentTime = null;

  constructor() {
    super(...arguments);
    window.addEventListener('storage', (e) => {
      // only slave tabs will receive this event
      if (e.key === 'current-time-run') {
        this.currentTime = e.newValue;
      }
    });
    this._updateTime();
  }

  _updateTime() {
    later(() => {
      this.updateTime();
      this._updateTime();
    }, 900);
  }

  updateTime(force = false) {
    this.masterTab
      .run(() => {
        fetch('/api/current-time')
          .then((response) => response.json())
          .then((data) => {
            // will only run on the master tab
            const currentTime = data.currentTime;
            this.currentTime = currentTime;
            localStorage['current-time-run'] = currentTime;
          });
      }, { force })
      .else(() => {
        // Master tab is handling it.
      });
  }
}
```
*Notes*:
- `else()` is optional.
- `run()` takes a second optional `boolean` parameter. If `true` it will
  make the function run irregardless of this being the master tab or not
  for that call on that tab and the function passed to `else()` will not
  run. Considering the previous example, this would be useful if a
  controller calls `this.serverTimeRun.updateTime(true)` directly
  on any tab.

**`lock(lockName, func1, options = {}).wait(func2)`**
- `lockName`: Name of the lock.
- `func1`: Function which returns a `Promise` that will run only if this is the master tab.
  Once the promise `resolve`s or `reject`s, the lock will be freed.
- `options` *(optional)*:
 - `force` *(optional, default: `false`)*: If `true`, run `func1` irregardless of this being the master tab or not.
 - `waitNext` *(optional, default: `true`)*: If `true` and there is currently no lock present, wait a maximum of `waitNextDelay` until the lock has been obtained and released.
 - `waitNextDelay` *(optional, default: 1000)*: If `waitNext` is `true`, wait this amount of milliseconds.
- `func2`: If this is *not* the master tab, run this instead once the lock has been freed.

```js
// services/server-time-lock.js
import Service from '@ember/service';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { later } from '@ember/runloop';

export default class ServerTimeLockService extends Service {
  @service masterTab;
  @tracked currentTime = null;

  constructor() {
    super(...arguments);
    this._updateTime();
  }

  _updateTime() {
    later(() => {
      this.updateTime();
      this._updateTime();
    }, 900);
  }

  updateTime(force = false) {
    this.masterTab
      .lock(
        'server-time',
        () => {
          return fetch('/api/current-time')
            .then((response) => response.json())
            .then((data) => {
              // will only run on the master tab
              const currentTime = data.currentTime;
              this.currentTime = currentTime;
              return currentTime; // will be passed to slave tabs
            });
        },
        { force }
      )
      .wait((currentTime) => {
        // will only run on slave tabs; currentTime is the result from the master tab
        this.currentTime = currentTime;
      });
  }
}
```
*Notes*:
- `wait()` is optional. It can take a second callback which runs if the
  promise failed.
- If the master tab is currently running the promise (there is a lock present),
  the callbacks passed to `wait()` will execute once that promise
  resolves/rejects. Otherwise, they will run immediately. These callbacks
  only run on "slave" tabs, generally.
- You use this if you need "slave" tabs to wait for whatever the master
  tab's promise returns. Maybe your service defers readiness of the application's
  initialization and you need the master tab to finish loading giving slave
  tabs its state.
- The value passed to the `wait()` callbacks will be the last value returned
  by the `lock()` promise.
- If `options.force` is `true` it will
  make the function run irregardless of this being the master tab or not for
  that call on that tab. It sets a lock and the callbacks passed to `wait()`
  will not run. If the master tab encounters a lock during this, it will instead
  run the `wait()` callbacks. Considering the previous example, this would
  be useful if a controller calls `this.serverTimeLock.updateTime(true)`
  directly on any tab.
- The service will save to `localStorage` whatever the promise returns.
  This value will be passed to the appropriate callback given to `wait()`.
  Note that `localStorage` only stores strings. So make sure whatever
  your promise returns can easily be converted to something usable in
  your `wait()` callbacks.
  
**`isMasterTab` event**

Whenever a tab is promoted to master status, the `masterTab` service will emit an `isMasterTab` event.
So, following the theme of the previous examples, you could also work with `EventSource` objects
(or `WebSocket`, etc.) like this:
```js
// services/server-time-sse.js
import Service from '@ember/service';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class ServerTimeSseService extends Service {
  @service masterTab;
  @tracked currentTime = null;

  constructor() {
    super(...arguments);
    if (this.masterTab.isMasterTab) {
      this.setup();
    }
    this.masterTab.on('isMasterTab', (isMaster) => {
      if (isMaster) {
        this.setup();
      }
    });
    window.addEventListener('storage', (e) => {
      if (e.key === 'current-time-sse') {
        this.currentTime = e.newValue;
      }
    });
  }

  setup() {
    const sse = new EventSource('/sse');
    sse.onmessage = (e) => {
      this.currentTime = e.data;
      window.localStorage['current-time-sse'] = e.data;
    };
    this.masterTab.on('isMasterTab', (isMaster) => {
      if (!isMaster) {
        sse.close();
      }
    });
  }
}
```
*Notes*:
- The event is only raised after the application has been initialized. Therefore,
  the master tab will not emit it. It will only be triggered if the master
  tab is closed/refreshed and a different tab is promoted.

## License

Ember Master Tab is released under the [MIT Licencse](https://github.com/rhyek/ember-master-tab/blob/master/LICENSE.md).
