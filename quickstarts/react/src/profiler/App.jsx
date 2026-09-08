// features/component-monitoring.mdx:16-32 verbatim, with the three child components defined.
import React from "react";
import * as Sentry from "@sentry/react";

const FancyComponent = ({ children }) => <div id="profiled-app">{children}</div>;
const NestedComponent = ({ someProp }) => <span>nested {someProp}</span>;
const AnotherComponent = () => <span>another</span>;

class App extends React.Component {
  render() {
    return (
      <FancyComponent>
        <NestedComponent someProp={2} />
        <AnotherComponent />
      </FancyComponent>
    );
  }
}

export default Sentry.withProfiler(App);
