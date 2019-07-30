export function initialize(instance) {
  if (!instance.application.testing) {
    instance.lookup('service:server-time-sse');
  }
}

export default {
  name: 'server-time-sse',
  initialize
};
