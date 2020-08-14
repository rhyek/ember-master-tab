import fetch from 'fetch';
import { later } from '@ember/runloop';
import Service, { inject as service } from '@ember/service';

export default Service.extend({
  masterTab: service(),
  currentTime: null,
  init() {
    this._super(...arguments);
    this._updateTime();
  },
  _updateTime() {
    later(() => {
      this.updateTime();
      this._updateTime();
    }, 900);
  },
  updateTime(force = false) {
    this.get('masterTab')
      .lock('server-time', () => {
        return fetch('/api/current-time').then(response => {
          if (response.ok) {
            return response.json()
              .then((data) => {
                const currentTime = data.currentTime;
                this.set('currentTime', currentTime);
                return currentTime;
              });
          }
          return undefined;
        });
      }, { force })
      .wait(currentTime => {
        this.set('currentTime', currentTime);
      });
  }
});