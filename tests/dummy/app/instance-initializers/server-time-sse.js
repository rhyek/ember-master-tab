export function initialize(instance) {
  instance.lookup('service:server-time-sse');
}

export default {
  name: 'server-time-sse',
  initialize
};
