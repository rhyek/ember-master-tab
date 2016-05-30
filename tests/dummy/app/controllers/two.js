import Ember from 'ember';

export default Ember.Controller.extend({
  masterTab: Ember.inject.service(),
  init() {
    this._super(...arguments);
    this.get('masterTab')
      .lock('some-identifier', () => {
        return Ember.$.getJSON('/api/person/1').then(
          data => {
            this.set('person', data.person);
            return JSON.stringify(data.person);
          },
          error => {
            const message = error.responseText;
            this.set('error', message);
            return message;
          });
      })
      .wait(
        result => {
          const person = JSON.parse(result);
          this.set('person', person);
        },
        result => {
          this.set('error', result);
        }
      );
  }
});