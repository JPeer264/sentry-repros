import Component from '@glimmer/component';

// A render that takes longer than the addon's 2 ms minimumComponentRenderDuration.
export default class HelloComponent extends Component {
  get greeting() {
    const until = performance.now() + 6;
    while (performance.now() < until) {}
    return `Hello ${this.args.name}`;
  }
}
