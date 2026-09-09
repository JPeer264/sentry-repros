// packages/ember/UPGRADE.md:74-85 (also README.md:62-74) in JavaScript: the v2 addon's instance
// initializer. No docs page under guides/ember/ mentions it.
import { instrumentAppInstancePerformance } from '@sentry/ember';

export function initialize(appInstance) {
  instrumentAppInstancePerformance(appInstance);
}

export default {
  initialize,
};
