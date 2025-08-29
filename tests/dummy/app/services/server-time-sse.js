import Service, { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class ServerTimeSseService extends Service {
  @service masterTab;

  @tracked currentTime = null;

  constructor() {
    super(...arguments);

    // Start SSE if already master
    if (this.masterTab.isMasterTab) {
      this.setup();
    }

    // Listen for master tab changes
    this.masterTab.onIsMasterTabChange((event) => {
      if (event.detail === true) {
        this.setup();
      }
    });

    // Sync current time via localStorage
    window.addEventListener('storage', (e) => {
      if (e.key === 'current-time-sse') {
        this.currentTime = e.newValue;
      }
    });
  }

  setup() {
    const sse = new window.EventSource('/sse');
    sse.onmessage = (e) => {
      this.currentTime = e.data;
      window.localStorage['current-time-sse'] = e.data;
    };
  }
}
