import Service, { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import fetch from 'fetch';

export default class ServerTimeLockService extends Service {
  @service masterTab;

  @tracked currentTime = null;

  constructor() {
    super(...arguments);
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
      .lock(
        'server-time',
        async () => {
          let response = await fetch('/api/current-time');
          if (!response.ok) return;

          let data = await response.json();
          let currentTime = data.currentTime;
          this.currentTime = currentTime;
          return currentTime;
        },
        { force }
      )
      .wait((currentTime) => {
        this.currentTime = currentTime;
      });
  }
}
