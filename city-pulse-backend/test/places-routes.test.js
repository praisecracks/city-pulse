const test = require("node:test");
const assert = require("node:assert/strict");

/**
 * End-to-end checks against the real Express app.
 *
 * No Google key is configured here on purpose: the point of these tests is
 * that the routing, the validation and the "the server key is missing"
 * response all work through the real stack, and that a misconfigured server
 * produces an honest error rather than an empty result.
 */
delete process.env.GOOGLE_MAPS_API_KEY;

const app = require("../src/app");

let server;
let baseUrl;

test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
});

async function get(path) {
  const response = await fetch(`${baseUrl}${path}`);
  return { status: response.status, body: await response.json() };
}

test("the places routes are mounted under /api/v1/places", async () => {
  const { status, body } = await get("/api/v1/places/autocomplete?input=Ibara");

  assert.equal(status, 503);
  assert.equal(body.success, false);
  // A server that has no Google key must say so, not pretend there were no
  // matching places.
  assert.equal(body.code, "LOCATION_SERVICE_MISCONFIGURED");
});

test("a search that is too short is rejected before Google is called", async () => {
  const { status, body } = await get("/api/v1/places/autocomplete?input=a");

  assert.equal(status, 400);
  assert.equal(body.code, "INVALID_REQUEST");
});

test("a missing placeId is rejected", async () => {
  const { status, body } = await get("/api/v1/places/detail");

  assert.equal(status, 400);
  assert.equal(body.code, "INVALID_REQUEST");
});

test("out of range directions coordinates are rejected", async () => {
  const { status, body } = await get(
    "/api/v1/places/directions?originLat=999&originLng=3.4&destinationLat=7.2&destinationLng=3.4",
  );

  assert.equal(status, 400);
  assert.equal(body.code, "INVALID_REQUEST");
});

test("an unknown travel mode is rejected", async () => {
  const { status, body } = await get(
    "/api/v1/places/directions?originLat=7.1&originLng=3.4&destinationLat=7.2&destinationLng=3.4&mode=teleport",
  );

  assert.equal(status, 400);
  assert.equal(body.code, "INVALID_REQUEST");
});

test("out of range reverse geocode coordinates are rejected", async () => {
  const { status, body } = await get("/api/v1/places/reverse?lat=200&lng=3.4");

  assert.equal(status, 400);
  assert.equal(body.code, "INVALID_REQUEST");
});

test("the location endpoints work without a token so onboarding is not blocked", async () => {
  // No Authorization header at all. The request is validated and then fails on
  // the missing server key — it is not rejected with 401.
  const { status, body } = await get("/api/v1/places/autocomplete?input=Ibara");

  assert.notEqual(status, 401);
  assert.equal(status, 503);
  assert.equal(body.code, "LOCATION_SERVICE_MISCONFIGURED");
});

test("a broken token is treated as signed out rather than as a failure", async () => {
  const response = await fetch(`${baseUrl}/api/v1/places/autocomplete?input=Ibara`, {
    headers: { Authorization: "Bearer not-a-real-token" },
  });
  const body = await response.json();

  assert.notEqual(response.status, 401);
  assert.equal(response.status, 503);
  assert.equal(body.code, "LOCATION_SERVICE_MISCONFIGURED");
});

test("no Google key is ever echoed in a response", async () => {
  const { body } = await get("/api/v1/places/autocomplete?input=Ibara");

  assert.ok(!JSON.stringify(body).toLowerCase().includes("aizasy"));
});
