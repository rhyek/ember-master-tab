import Ember from 'ember';
const { run } = Ember;

export default Ember.Controller.extend({
  masterTab: Ember.inject.service(),
  init() {
    this._super(...arguments);
    this.runAjax();
  },
  runAjax() {
    Ember.run.later(this, () => {
      this.get('masterTab')
        .lock('some-identifier', () => {
          return Ember.$.getJSON('/api/person/1').then(
            data => {
              data.time = new Date().toISOString();
              run(() => this.set('data', data));
              return JSON.stringify(data);
            },
            error => {
              const time = new Date().toISOString();
              const message = error.responseText;
              const data = {
                time,
                error: message
              };
              run(() => this.set('data', data));
              return JSON.stringify(data);
            });
        })
        .wait(
          result => {
            const data = JSON.parse(result);
            run(() => this.set('data', data));
          },
          result => {
            const data = JSON.parse(result);
            run(() => this.set('data', data));
          }
        );
        this.runAjax();
    }, 1000);
  }
});