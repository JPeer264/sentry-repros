declare interface Env {
  SINK_URL: string;
  COUNTER: DurableObjectNamespace<import('./worker/index').Counter>;
  MY_WORKFLOW: Workflow;
  SELF: Service<import('./worker/index').Api>;
}
