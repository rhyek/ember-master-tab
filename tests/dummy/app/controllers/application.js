import { later } from '@ember/runloop';
import { inject as service } from '@ember/service';
import Controller from '@ember/controller';

export default Controller.extend({
  masterTab: service(),
  serverTimeLock: service(),
  serverTimeRun: service(),
  serverTimeSse: service(),
  init() {
    this._super(...arguments);
    this.incrementCounter();
    this.masterTab.on('isMasterTab', (isMaster) => {
      if (isMaster) {
        window.alert("I'm now the master tab.");
      }
    });
  },
  counterIsMasterTab: 0,
  counterIsNotMasterTab: 0,
  incrementCounter() {
    later(() => {
      this.masterTab
        .run(() => this.incrementProperty('counterIsMasterTab'))
        .else(() => {
          this.incrementProperty('counterIsNotMasterTab');
          this.masterTab.contestMasterTab();
        });
      this.incrementCounter();
    }, 1000);
  },
  actions: {
    updateTimeLock() {
      this.serverTimeLock.updateTime(true);
    },
  },
});
