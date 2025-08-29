import Service, { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import fetch from 'fetch';

export default class CurrentTimeRunService extends Service {
  @service masterTab;

  @tracked currentTime = null;

  constructor() {
    super(...arguments);

    // Listen for updates from other tabs
    window.addEventListener('storage', (e) => {
      if (e.key === 'current-time-run') {
        this.currentTime = e.newValue;
      }
    });

    // Start polling loop
    this._updateTime();
  }

  _updateTime() {
    setTimeout(() => {
      this.updateTime();
      this._updateTime();
    }, 900);
  }

  async updateTime(force = false) {
    this.masterTab
      .run(async () => {
        try {
          let response = await fetch('/api/current-time');
          if (!response.ok) return;

          let data = await response.json();
          let currentTime = data.currentTime;

          this.currentTime = currentTime;
          window.localStorage['current-time-run'] = currentTime;
        } catch (e) {
          // optional: log error
          console.error('Failed to fetch current time', e);
        }
      }, { force })
      .else(() => {
        // not master, do nothing
      });
  }
}
