// docs/platforms/javascript/guides/react/index.mdx:283-290 ("Capture Redux State Data").
import { createStore, compose } from "redux";
import * as Sentry from "@sentry/react";

function rootReducer(state = { count: 0, password: null, secret: null }, action) {
  switch (action.type) {
    case "INCREMENT":
      return { ...state, count: state.count + 1 };
    case "SET_PASSWORD":
      return { ...state, password: action.password };
    case "GOVERNMENT_SECRETS":
      return { ...state, secret: action.secret };
    default:
      return state;
  }
}

const sentryEnhancer = Sentry.createReduxEnhancer();

const store = createStore(rootReducer, compose(sentryEnhancer));

export default store;
