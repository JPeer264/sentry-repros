<!-- component-tracking.mdx:80-95 verbatim -->
<script>
  import * as Sentry from "@sentry/svelte";
  Sentry.trackComponent({
    // To disable component initialization spans, set this to `false`.
    // (defaults to `true`)
    trackInit: true,
    // To disable component update spans, set this to `false`
    // (defaults to `true`)
    trackUpdates: false,
    // Specify a custom name to be shown in the span description
    // (defaults to the automatically detected component name)
    componentName: 'MyAwesomeComponent'
  })
  // rest of your code
</script>

<p>MyComponent</p>
