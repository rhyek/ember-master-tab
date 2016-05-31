import Ember from 'ember';

export default Ember.Service.extend({
  masterTab: Ember.inject.service(),
  currentTime: null,
  init() {
    this._super(...arguments);
    window.addEventListener('storage', e => {
      if (e.key === 'currentTime') {
        this.set('currentTime', e.newValue);
      }
    });
    this.updateTime();
  },
  updateTime() {
    setTimeout(() => {
      this.get('masterTab')
        .run(() => {
          Ember.$.getJSON('/api/current-time').then(data => {
            const currentTime = data.currentTime;
            this.set('currentTime', currentTime);
            localStorage['currentTime'] = currentTime;
          });
        })
        .else(() => {
          // Master tab is handling it.
        });
      this.updateTime();
    }, 900);
  }
});