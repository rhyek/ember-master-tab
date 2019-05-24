import $ from 'jquery';
import Service, { inject as service } from '@ember/service';

export default Service.extend({
  masterTab: service(),
  currentTime: null,
  init() {
    this._super(...arguments);
    window.addEventListener('storage', e => {
      if (e.key === 'current-time-run') {
        this.set('currentTime', e.newValue);
      }
    });
    this._updateTime();
  },
  _updateTime() {
    setTimeout(() => {
      this.updateTime();
      this._updateTime();
    }, 900);
  },
  updateTime(force = false) {
    this.get('masterTab')
      .run(() => {
        $.getJSON('/api/current-time').then(data => {
          const currentTime = data.currentTime;
          this.set('currentTime', currentTime);
          window.localStorage['current-time-run'] = currentTime;
        });
      }, { force })
      .else(() => {
        // Master tab is handling it.
      });
  }
});