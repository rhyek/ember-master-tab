import $ from 'jquery';
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
        return $.getJSON('/api/current-time').then(data => {
          const currentTime = data.currentTime;
          this.set('currentTime', currentTime);
          return currentTime;
        });
      }, { force })
      .wait(currentTime => {
        this.set('currentTime', currentTime);
      });
  }
});