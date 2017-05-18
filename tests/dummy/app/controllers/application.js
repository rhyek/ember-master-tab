import Ember from 'ember';

export default Ember.Controller.extend({
  masterTab: Ember.inject.service(),
  serverTimeLock: Ember.inject.service(),
  serverTimeRun: Ember.inject.service(),
  serverTimeSse: Ember.inject.service(),
  init() {
    this._super(...arguments);
    this.incrementCounter();
    this.get('masterTab').on('isMasterTab', isMaster => {
      if (isMaster) {
        window.alert("I'm now the master tab.");
      }
    });
  },
  counterIsMasterTab: 0,
  counterIsNotMasterTab: 0,
  incrementCounter() {
    Ember.run.later(() => {
      this.get('masterTab')
        .run(() => this.incrementProperty('counterIsMasterTab'))
        .else(() => {
          this.incrementProperty('counterIsNotMasterTab');
          this.get('masterTab').contestMasterTab();
        });
      this.incrementCounter();
    }, 1000);
  },
  actions: {
    updateTimeLock() {
      this.get('serverTimeLock').updateTime(true);
    }
  }
});