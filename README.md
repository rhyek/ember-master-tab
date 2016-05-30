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

## Installation

`ember install ember-master-tab`

## Code Example

You can clone this repository and have a look at the dummy app to see it in action.

**Running simple functions:**

```js
import Ember from 'ember';

export default Ember.Controller.extend({
  masterTab: Ember.inject.service(),
  init() {
    this._super(...arguments);
    this.get('masterTab')
      .run(() => alert('I am the master tab!')) // will only run on the master tab
      .else(() => alert('I am NOT the master tab. :(')); // will only run on slave tabs
  }
});
```
*Notes*:
- `else()` is optional. 

**Working with promises:**

```js
import Ember from 'ember';

export default Ember.Controller.extend({
  masterTab: Ember.inject.service(),
  init() {
    this._super(...arguments);
    this.get('masterTab')
      .lock('some-identifier', () => { // will only run on the master tab
        return Ember.$.getJSON('/api/endpoint').then(
          data => {
            alert(`I got: ${data.value}`);
            return JSON.stringify(data);
          },
          error => {
            const message = error.responseText;
            alert(`Error: ${message}`);
            return message;
          });
      })
      .wait( // callbacks will only run on slave tabs
        (result, waited) => { // success on master tab
          const data = JSON.parse(result);
          const info = waited ?
            'It was running this task at the same time as me.' :
            'It had previously run this task.';
          alert(`The master tab got: ${data.value}. ${info}`);
        },
        (error, waited) => { // failure on master tab
          alert(`The master tab got an error: ${error}.`);
        } 
      );
  }
});
```
*Notes*:
- `wait()` is optional.
- If the master tab is currently running the promise, the callbacks
  passed to `wait()` will execute once that promise resolves/rejects.
  Otherwise, they will run immediately. These callbacks only run on
  "slave" tabs.
- You don't *need* to use `lock().wait()` for promises. You use this
  if you need "slave" tabs to react to whatever the master tab's
  promise returns. A better way to do this would be for the master tab
  to set some value on `localStorage` and then "slave" tabs would
  have handlers for the `storage` event and update the UI automatically.
- The service will save to `localStorage` whatever the promise returns.
  This value will be passed to the appropriate callback given to `wait()`.
  Note that `localStorage` only stores strings. So make sure whatever
  your promise returns can easily be converted to something usable in
  your `wait()` callbacks.

## License

Ember Master Tab is released under the [MIT Licencse](https://github.com/rhyek/ember-master-tab/blob/master/LICENSE.md).