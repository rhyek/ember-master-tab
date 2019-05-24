import { namespace } from './consts';

export function debug() {
  console.log(namespace, ...arguments);
}