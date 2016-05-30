import Ember from 'ember';
import { v4 } from 'ember-uuid';

export default Ember.Controller.extend({
  masterTab: Ember.inject.service(),
  init() {
    this._super(...arguments);
    this.incrementCounter();
    this.get('masterTab')
      .lock('test', () => {
        const delay = 4000;
        return new Ember.RSVP.Promise((resolve, reject) => {
          setTimeout(() => {
            if (Math.floor(Math.random()*2) === 1) {
              const uuid = v4();
              resolve(uuid);
              this.set('test', `I set <strong>test</strong> as ${uuid} after ${delay / 1000}s.`);
            } else {
              reject('some random error');
              this.set('test', 'I failed to generate a UUID.');
            }
          }, delay);
        });
      })
      .wait(
        (result, waited) => {
          const waitedText = waited ? 'had' : 'did not have';
          this.set('test', `I got <strong>test</strong> as ${result}. I <strong>${waitedText}</strong> to wait.`);
        },
        (result, waited) => {
          const waitedText = waited ? 'had' : 'did not have';
          this.set('test', `Master tab failed to generate a UUID with error <strong>${result}</strong>. I <strong>${waitedText}</strong> to wait.`);
        }
      );
  },
  counterIsMasterTab: 0,
  counterIsNotMasterTab: 0,
  incrementCounter() {
    Ember.run.later(() => {
      this.get('masterTab')
        .run(() => this.incrementProperty('counterIsMasterTab'))
        .else(() => this.incrementProperty('counterIsNotMasterTab'));
      this.incrementCounter();
    }, 1000);
  }
});