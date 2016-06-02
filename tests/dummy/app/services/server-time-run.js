import Ember from 'ember';

export default Ember.Service.extend({
  masterTab: Ember.inject.service(),
  currentTime: null,
  init() {
    this._super(...arguments);
    window.addEventListener('storage', e => {
      if (e.key === 'current-time-run') {
        this.set('currentTime', e.newValue);
      }
    });
    this.updateTime();
  },
  updateTime(force = false) {
    setTimeout(() => {
      this.get('masterTab')
        .run(() => {
          Ember.$.getJSON('/api/current-time').then(data => {
            const currentTime = data.currentTime;
            this.set('currentTime', currentTime);
            window.localStorage['current-time-run'] = currentTime;
          });
        }, force)
        .else(() => {
          // Master tab is handling it.
        });
      this.updateTime();
    }, 900);
  }
});