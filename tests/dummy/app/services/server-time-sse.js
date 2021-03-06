import Service, { inject as service } from '@ember/service';

export default Service.extend({
  masterTab: service(),
  currentTime: null,
  init() {
    this._super(...arguments);
    if (this.get('masterTab.isMasterTab')) {
      this.setup();
    }
    this.get('masterTab').on('isMasterTab', isMaster => {
      if (isMaster) {
        this.setup();
      }
    });
    window.addEventListener('storage', e => {
      if (e.key === 'current-time-sse') {
        this.set('currentTime', e.newValue);
      }
    });
  },
  setup() {
    const sse = new window.EventSource('/sse');
    sse.onmessage = e => {
      if ( !(this.get('isDestroyed') || this.get('isDestroying')) ) {
        this.set('currentTime', e.data);
        window.localStorage['current-time-sse'] = e.data;
      }
    };
  }
});