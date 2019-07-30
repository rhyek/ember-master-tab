import { namespace } from './consts';

export function debug() {
  if (console.debug) {
    console.debug(namespace, ...arguments);
  } else {
    console.log(namespace, ...arguments);
  }
}
