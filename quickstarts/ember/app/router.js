import EmberRouter from '@embroider/router';
import config from 'qs-ember/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  this.route('user', { path: '/users/:user_id' });
});
