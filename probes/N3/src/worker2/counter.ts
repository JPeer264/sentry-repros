import { DurableObject } from 'cloudflare:workers';

export class Counter extends DurableObject {
  async bump(): Promise<string> {
    return 'bumped';
  }
}
