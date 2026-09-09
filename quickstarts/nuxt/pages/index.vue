<script setup>
import * as Sentry from "@sentry/nuxt";

const status = ref("");

async function fetchEcho() {
  status.value = JSON.stringify(await $fetch("/api/echo"));
}
async function fetchRecorder() {
  const res = await fetch("http://localhost:4752/recorder?from=client");
  status.value = await res.text();
}
async function fetchApiError() {
  try {
    await $fetch("/api/error");
  } catch (e) {
    status.value = "api error: " + (e && e.message);
  }
}
function logAll() {
  Sentry.logger.info("User example action completed");

  Sentry.logger.warn("Slow operation detected", {
    operation: "data_fetch",
    duration: 3500,
  });

  Sentry.logger.error("Validation failed", {
    field: "email",
    reason: "Invalid email",
  });
  status.value = "logged";
}
</script>

<template>
  <div>
    <h1>QS-nuxt</h1>
    <button id="btn-echo" @click="fetchEcho">fetch /api/echo</button>
    <button id="btn-recorder" @click="fetchRecorder">fetch sink recorder</button>
    <button id="btn-api-error" @click="fetchApiError">fetch /api/error</button>
    <button id="btn-log" @click="logAll">logs</button>
    <pre id="status">{{ status }}</pre>
  </div>
</template>
