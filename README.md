# Ember Master Tab
## Synopsis

This addon provides a `service` that allows you to run code on a single tab of your ember
application. You might find this useful if your app has functionality that for some reason
does not make sense or it is wasteful/redundant to have it run on every tab that is currently
open. For example, you might be continuously pulling some state from your server API that
you are saving on `localStorage` which you then use to update your UI through event listeners.

## Notes

* The service ensures that only one master tab exists at any one time.
* If the current master tab closes or refreshes, any other tab can take the responsability at that time.
* If the current master tab crashes, ***currently*** no other tab will take the responsability until
  a new tab is opened. 
* This service is most useful on objects that provide global functionality to your application, such as other services.

## Installation

`ember install ember-master-tab`

## Code Example

You can clone this repository and have a look at the dummy app to see it in action.

**`run().else()`**

```js
// services/server-time-run.js
import Ember from 'ember';

export default Ember.Service.extend({
  masterTab: Ember.inject.service(),
  currentTime: null,
  init() {
    this._super(...arguments);
    window.addEventListener('storage', e => { // only slave tabs will receive this event
      if (e.key === 'currentTime') {
        this.set('currentTime', e.newValue);
      }
    });
    this.updateTime();
  },
  updateTime() {
    Ember.run.later(() => {
      this.get('masterTab')
        .run(() => {
          Ember.$.getJSON('/api/current-time').then(data => { // will only run on the master tab
            const currentTime = data.currentTime;
            this.set('currentTime', currentTime);
            localStorage['currentTime'] = currentTime;
          });
        })
        .else(() => {
          // Master tab is handling it.
        });
      this.updateTime();
    }, 900);
  }
});
```
*Notes*:
- `else()` is optional. 

**`lock().wait()`**

```js
// services/server-time-lock.js
import Ember from 'ember';

export default Ember.Service.extend({
  masterTab: Ember.inject.service(),
  currentTime: null,
  init() {
    this._super(...arguments);
    this.updateTime();
  },
  updateTime() {
    Ember.run.later(() => {
      this.get('masterTab')
        .lock('server-time', () => {
          return Ember.$.getJSON('/api/current-time').then(data => { // will only run on the master tab
            const currentTime = data.currentTime;
            this.set('currentTime', currentTime);
            return currentTime; // will be passed to slave tabs
          });
        })
        .wait(currentTime => { // will only run on slave tabs; currentTime is the result from the master tab
          this.set('currentTime', currentTime);
        });
      this.updateTime();
    }, 900);
  }
});
```
*Notes*:
- `wait()` is optional. It can take a second callback which runs if the
  promise failed.
- If the master tab is currently running the promise, the callbacks
  passed to `wait()` will execute once that promise resolves/rejects.
  Otherwise, they will run immediately. These callbacks only run on
  "slave" tabs.
- You use this if you need "slave" tabs to wait for whatever the master tab's
  promise returns. Maybe your service defers readiness of the application's
  initialization and you need the master tab to finish loading giving slave
  tabs its state.
- The service will save to `localStorage` whatever the promise returns.
  This value will be passed to the appropriate callback given to `wait()`.
  Note that `localStorage` only stores strings. So make sure whatever
  your promise returns can easily be converted to something usable in
  your `wait()` callbacks.

## License

Ember Master Tab is released under the [MIT Licencse](https://github.com/rhyek/ember-master-tab/blob/master/LICENSE.md).