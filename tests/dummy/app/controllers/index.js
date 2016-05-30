import Ember from 'ember';
import { v4 } from 'ember-uuid';

export default Ember.Controller.extend({
  masterTab: Ember.inject.service(),
  init() {
    this._super(...arguments);
    this.incrementCounter();
    this.get('masterTab').lock('test', () => {
      const delay = 4000;
      return new Ember.RSVP.Promise(resolve => {
        setTimeout(() => {
          const uuid = v4();
          window.localStorage['test'] = uuid;
          resolve();
          this.set('test', (`I set <strong>test</strong> as ${uuid} after ${delay / 1000}s.`));
        }, delay);
      });
    }).wait((waited) => {
      const uuid = window.localStorage['test'];
      const waitedText = waited ? 'had' : 'did not have';
      this.set('test', `I found <strong>test</strong> as ${uuid}. I <strong>${waitedText}</strong> to wait.`);
    });
  },
  counterIsMasterTab: 0,
  counterIsNotMasterTab: 0,
  incrementCounter() {
    Ember.run.later(() => {
      this.get('masterTab').run(() => {
        this.incrementProperty('counterIsMasterTab');
      }).else(() => {
        this.incrementProperty('counterIsNotMasterTab');
      });
      this.incrementCounter();
    }, 1000);
  }
});