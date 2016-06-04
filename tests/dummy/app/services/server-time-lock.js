import Ember from 'ember';

export default Ember.Service.extend({
  masterTab: Ember.inject.service(),
  currentTime: null,
  init() {
    this._super(...arguments);
    this._updateTime();
  },
  _updateTime() {
    Ember.run.later(() => {
      this.updateTime();
      this._updateTime();
    }, 900);
  },
  updateTime(force = false) {
    this.get('masterTab')
      .lock('server-time', () => {
        return Ember.$.getJSON('/api/current-time').then(data => {
          const currentTime = data.currentTime;
          this.set('currentTime', currentTime);
          return currentTime;
        });
      }, force)
      .wait(currentTime => {
        this.set('currentTime', currentTime);
      });
  }
});