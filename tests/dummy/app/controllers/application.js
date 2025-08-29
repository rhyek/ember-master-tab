import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class ApplicationController extends Controller {
  @service masterTab;
  @service serverTimeLock;
  @service serverTimeRun;
  @service serverTimeSse;

  @tracked counterIsMasterTab = 0;
  @tracked counterIsNotMasterTab = 0;

  constructor() {
    super(...arguments);

    this.incrementCounter();

    // Subscribe to master tab change
    this.masterTab.onIsMasterTabChange((event) => {
      if (event.detail === true) {
        window.alert("I'm now the master tab.");
      }
    });
  }

  incrementCounter() {
    setTimeout(() => {
      this.masterTab
        .run(() => {
          this.counterIsMasterTab++;
        })
        .else(() => {
          this.counterIsNotMasterTab++;
          this.masterTab.contestMasterTab();
        });

      this.incrementCounter();
    }, 1000);
  }

  updateTimeLock = (force = true) => {
    this.serverTimeLock.updateTime(force);
  };
}
