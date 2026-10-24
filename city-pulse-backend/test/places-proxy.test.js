const test = require("node:test");
const assert = require("node:assert/strict");

// The service captures `fetch` at module load, so the stub has to be in place
// before the service is required. A server-side key has to exist too, because
// the service refuses to call Google without one.
const TEST_API_KEY = "AIzaSyTESTKEY000000000000000000000000000";
process.env.GOOGLE_MAPS_API_KEY = TEST_API_KEY;

const fetchPath = require.resolve("node-fetch");

/** The stub every test drives. Each test replaces `responses` and reads `calls`. */
const fetchState = { responses: [], calls: [] };

function fetchStub(url, options) {
  fetchState.calls.push({ url, options });
  const next = fetchState.responses.shift();
  if (!next) throw new Error(`No stubbed response for ${url}`);
  if (next.throws) throw next.throws;
  return Promise.resolve({
    ok: next.status >= 200 && next.status < 300,
    status: next.status,
    json: () => Promise.resolve(next.body),
  });
}

require.cache[fetchPath] = {
  id: fetchPath,
  filename: fetchPath,
  loaded: true,
  exports: fetchStub,
};

const {
  GOOGLE_ERROR_REASONS,
  GoogleApiError,
  computeRoutes,
  fetchPlaceDetails,
  fetchPlacePredictions,
  reverseGeocode,
} = require("../src/services/googleMapsService");

const {
  autocompletePlaces,
  getDirections,
  getPlaceDetails,
  reverseGeocodeAddress,
} = require("../src/controllers/places.controller");

const optionalAuth = require("../src/middlewares/optionalAuth");
const { JWT_SECRET } = require("../src/config/jwt");

const jwt = require("jsonwebtoken");

function resetStub() {
  fetchState.responses = [];
  fetchState.calls = [];
}

/** The calls the service made, for assertions about the request it sent. */
function calls() {
  return fetchState.calls;
}

/** A Places API (New) autocomplete response with one suggestion. */
function autocompleteBody() {
  return {
    suggestions: [
      {
        placePrediction: {
          placeId: "ChIJ1234567890abcdef",
          text: { text: "Ibara, Abeokuta, Nigeria" },
          structuredFormat: {
            mainText: { text: "Ibara" },
            secondaryText: { text: "Abeokuta, Nigeria" },
          },
        },
      },
    ],
  };
}

// --- Service: places autocomplete -----------------------------------------

test("autocomplete returns real suggestions from a successful response", async () => {
  resetStub();
  fetchState.responses = [{ status: 200, body: autocompleteBody() }];

  const predictions = await fetchPlacePredictions("Ibara", { regionCode: "ng" });

  assert.equal(predictions.length, 1);
  assert.equal(predictions[0].placeId, "ChIJ1234567890abcdef");
  assert.equal(predictions[0].structuredFormatting.mainText, "Ibara");
  assert.equal(predictions[0].structuredFormatting.secondaryText, "Abeokuta, Nigeria");
});

test("autocomplete sends the Places API (New) request format and field mask", async () => {
  resetStub();
  fetchState.responses = [{ status: 200, body: autocompleteBody() }];

  await fetchPlacePredictions("Ibara", { regionCode: "ng" });

  const call = calls()[0];
  assert.equal(call.url, "https://places.googleapis.com/v1/places:autocomplete");
  assert.equal(call.options.method, "POST");

  const fieldMask = call.options.headers["X-Goog-FieldMask"];
  assert.ok(fieldMask.includes("suggestions.placePrediction.placeId"));
  assert.ok(fieldMask.includes("suggestions.placePrediction.structuredFormat"));
  // `description` does not exist on a New API place prediction. Asking for it
  // makes Google reject the whole request.
  assert.ok(!fieldMask.includes("description"));

  const body = JSON.parse(call.options.body);
  assert.equal(body.input, "Ibara");
  assert.equal(body.regionCode, "ng");
  assert.equal(body.languageCode, "en");
});

test("autocomplete with no matches is an empty result, not an error", async () => {
  resetStub();
  fetchState.responses = [{ status: 200, body: { suggestions: [] } }];

  const predictions = await fetchPlacePredictions("zzzzzzzznotaplace");

  assert.deepEqual(predictions, []);
});

test("a Google 403 is not converted into an empty result", async () => {
  resetStub();
  fetchState.responses = [
    {
      status: 403,
      body: {
        error: {
          code: 403,
          message: "Requests from this Android client application <empty> are blocked.",
          status: "PERMISSION_DENIED",
          details: [
            {
              "@type": "type.googleapis.com/google.rpc.ErrorInfo",
              reason: "API_KEY_ANDROID_APP_BLOCKED",
              domain: "googleapis.com",
            },
          ],
        },
      },
    },
  ];

  await assert.rejects(
    () => fetchPlacePredictions("Ibara"),
    (error) => {
      assert.ok(error instanceof GoogleApiError);
      assert.equal(error.reason, GOOGLE_ERROR_REASONS.KEY_RESTRICTED);
      return true;
    },
  );
});

test("an API that is not enabled is reported as a service problem", async () => {
  resetStub();
  fetchState.responses = [
    {
      status: 403,
      body: {
        error: {
          code: 403,
          message: "Places API (New) has not been used in project 123 before or it is disabled.",
          details: [
            {
              "@type": "type.googleapis.com/google.rpc.ErrorInfo",
              reason: "API_KEY_SERVICE_BLOCKED",
              domain: "googleapis.com",
            },
          ],
        },
      },
    },
  ];

  await assert.rejects(
    () => fetchPlacePredictions("Ibara"),
    (error) => {
      assert.equal(error.reason, GOOGLE_ERROR_REASONS.SERVICE_DISABLED);
      return true;
    },
  );
});

test("a network failure is reported as a network failure", async () => {
  resetStub();
  fetchState.responses = [{ throws: new TypeError("fetch failed") }];

  await assert.rejects(
    () => fetchPlacePredictions("Ibara"),
    (error) => {
      assert.equal(error.reason, GOOGLE_ERROR_REASONS.NETWORK_ERROR);
      return true;
    },
  );
});

test("an upstream timeout is reported as a timeout", async () => {
  resetStub();
  const timeoutError = new Error("network timeout at: https://places.googleapis.com");
  timeoutError.type = "request-timeout";
  fetchState.responses = [{ throws: timeoutError }];

  await assert.rejects(
    () => fetchPlacePredictions("Ibara"),
    (error) => {
      assert.equal(error.reason, GOOGLE_ERROR_REASONS.TIMEOUT);
      return true;
    },
  );
});

// --- Service: place details ------------------------------------------------

test("place details resolve a selection to real coordinates", async () => {
  resetStub();
  fetchState.responses = [
    {
      status: 200,
      body: {
        id: "ChIJ1234567890abcdef",
        formattedAddress: "Ibara, Abeokuta, Ogun State, Nigeria",
        location: { latitude: 7.1975, longitude: 3.4363 },
        displayName: { text: "Ibara" },
        addressComponents: [
          { longText: "Ibara", shortText: "Ibara", types: ["sublocality"] },
          { longText: "Abeokuta", shortText: "Abeokuta", types: ["locality"] },
        ],
      },
    },
  ];

  const place = await fetchPlaceDetails("ChIJ1234567890abcdef");

  assert.equal(place.latitude, 7.1975);
  assert.equal(place.longitude, 3.4363);
  assert.equal(place.addressComponents.sublocality, "Ibara");
  assert.equal(place.addressComponents.locality, "Abeokuta");
});

test("place details never invent coordinates when Google has no location", async () => {
  resetStub();
  fetchState.responses = [
    {
      status: 200,
      body: {
        id: "ChIJ-no-location",
        formattedAddress: "Somewhere without a pin",
        displayName: { text: "Somewhere" },
        addressComponents: [],
      },
    },
  ];

  const place = await fetchPlaceDetails("ChIJ-no-location");

  // Null, not 0. A zeroed coordinate would put the user in the Gulf of
  // Guinea while looking like a successful lookup.
  assert.equal(place.latitude, null);
  assert.equal(place.longitude, null);
});

test("place details uses the New API endpoint and header field mask", async () => {
  resetStub();
  fetchState.responses = [
    {
      status: 200,
      body: { id: "abc", location: { latitude: 1, longitude: 2 } },
    },
  ];

  await fetchPlaceDetails("ChIJ1234567890abcdef");

  const call = calls()[0];
  assert.equal(call.url, "https://places.googleapis.com/v1/places/ChIJ1234567890abcdef");
  assert.ok(call.options.headers["X-Goog-FieldMask"].includes("addressComponents"));
  assert.ok(call.options.headers["X-Goog-FieldMask"].includes("location"));
});

// --- Service: routes --------------------------------------------------------

test("directions are normalised into the shape the app consumes", async () => {
  resetStub();
  fetchState.responses = [
    {
      status: 200,
      body: {
        routes: [
          {
            duration: "600s",
            distanceMeters: 4200,
            polyline: { encodedPolyline: "abc_def" },
            legs: [
              {
                duration: "600s",
                distanceMeters: 4200,
                steps: [
                  {
                    navigationInstruction: { instructions: "Head north" },
                    distanceMeters: 120,
                    staticDuration: "60s",
                    startLocation: { latLng: { latitude: 7.1, longitude: 3.1 } },
                    endLocation: { latLng: { latitude: 7.2, longitude: 3.2 } },
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  ];

  const directions = await computeRoutes(
    { latitude: 7.1, longitude: 3.1 },
    { latitude: 7.2, longitude: 3.2 },
    "walking",
  );

  assert.equal(directions.status, "OK");
  assert.equal(directions.routes.length, 1);
  assert.equal(directions.routes[0].legs[0].distance.value, 4200);
  assert.equal(directions.routes[0].legs[0].duration.value, 600);
  assert.equal(directions.routes[0].overviewPolyline.points, "abc_def");
  assert.equal(directions.routes[0].legs[0].steps[0].htmlInstructions, "Head north");
  assert.equal(directions.routes[0].legs[0].steps[0].duration.value, 60);
  assert.equal(directions.routes[0].legs[0].steps[0].startLocation.lat, 7.1);
});

test("no road route is an empty route list, not an error", async () => {
  resetStub();
  fetchState.responses = [{ status: 200, body: { routes: [] } }];

  const directions = await computeRoutes(
    { latitude: 7.1, longitude: 3.1 },
    { latitude: 7.2, longitude: 3.2 },
    "walking",
  );

  assert.deepEqual(directions.routes, []);
  assert.equal(directions.status, "ZERO_RESULTS");
});

test("durations are parsed as seconds, not hours", async () => {
  resetStub();
  fetchState.responses = [
    {
      status: 200,
      body: {
        routes: [
          {
            duration: "600s",
            distanceMeters: 4200,
            polyline: { encodedPolyline: "abc" },
            legs: [
              {
                duration: "600s",
                distanceMeters: 4200,
                steps: [
                  {
                    navigationInstruction: { instructions: "Head north" },
                    distanceMeters: 120,
                    staticDuration: "120s",
                    startLocation: { latLng: { latitude: 7.1, longitude: 3.1 } },
                    endLocation: { latLng: { latitude: 7.2, longitude: 3.2 } },
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  ];

  const directions = await computeRoutes(
    { latitude: 7.1, longitude: 3.1 },
    { latitude: 7.2, longitude: 3.2 },
    "walking",
  );

  // 600s is ten minutes, not six hundred hours.
  assert.equal(directions.routes[0].legs[0].duration.value, 600);
  assert.equal(directions.routes[0].legs[0].steps[0].duration.value, 120);
});

// --- Service: reverse geocoding -------------------------------------------

test("reverse geocoding returns every normalised candidate", async () => {
  resetStub();
  fetchState.responses = [
    {
      status: 200,
      body: {
        status: "OK",
        results: [
          {
            formatted_address: "Ibara, Abeokuta, Nigeria",
            address_components: [
              { long_name: "Ibara", short_name: "Ibara", types: ["sublocality"] },
              { long_name: "Abeokuta", short_name: "Abeokuta", types: ["locality"] },
            ],
            geometry: { location: { lat: 7.1975, lng: 3.4363 } },
          },
        ],
      },
    },
  ];

  const result = await reverseGeocode(7.1975, 3.4363);

  assert.equal(result.results.length, 1);
  assert.equal(result.results[0].addressComponents.sublocality, "Ibara");
  assert.equal(result.results[0].latitude, 7.1975);
});

test("a reverse geocode with no address is an empty result, not an error", async () => {
  resetStub();
  fetchState.responses = [{ status: 200, body: { status: "ZERO_RESULTS", results: [] } }];

  const result = await reverseGeocode(0, 0);

  assert.deepEqual(result.results, []);
});

test("a reverse geocode denied by a key restriction is an error", async () => {
  resetStub();
  fetchState.responses = [
    {
      status: 200,
      body: {
        status: "REQUEST_DENIED",
        error_message: "The provided API key is invalid.",
        results: [],
      },
    },
  ];

  await assert.rejects(
    () => reverseGeocode(7.1, 3.1),
    (error) => {
      assert.equal(error.reason, GOOGLE_ERROR_REASONS.KEY_RESTRICTED);
      return true;
    },
  );
});

test("the API key never appears in an upstream error message", async () => {
  resetStub();
  fetchState.responses = [
    {
      status: 400,
      body: {
        error: {
          message: `Invalid request. key=${TEST_API_KEY}`,
          details: [],
        },
      },
    },
  ];

  await assert.rejects(
    () => fetchPlacePredictions("Ibara"),
    (error) => {
      assert.ok(!error.upstreamMessage.includes(TEST_API_KEY));
      assert.ok(error.upstreamMessage.includes("[REDACTED]"));
      return true;
    },
  );
});

// --- Controller ------------------------------------------------------------

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

async function runController(handler, req) {
  const response = createResponse();
  let nextError;
  await handler(req, response, (error) => {
    nextError = error;
  });
  await new Promise(setImmediate);
  if (nextError) throw nextError;
  return response;
}

test("the controller rejects a search that is too short", async () => {
  resetStub();

  const response = await runController(autocompletePlaces, { query: { input: "a" } });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.success, false);
  assert.equal(response.body.code, "INVALID_REQUEST");
  assert.equal(calls().length, 0);
});

test("the controller rejects a place identifier with an unexpected shape", async () => {
  resetStub();

  const response = await runController(getPlaceDetails, {
    query: { placeId: "not a valid id/../etc" },
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.code, "INVALID_REQUEST");
  assert.equal(calls().length, 0);
});

test("the controller rejects out of range coordinates for directions", async () => {
  resetStub();

  const response = await runController(getDirections, {
    query: {
      originLat: "999",
      originLng: "3.4",
      destinationLat: "7.2",
      destinationLng: "3.4",
    },
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.code, "INVALID_REQUEST");
  assert.equal(calls().length, 0);
});

test("the controller rejects an unknown travel mode", async () => {
  resetStub();

  const response = await runController(getDirections, {
    query: {
      originLat: "7.1",
      originLng: "3.4",
      destinationLat: "7.2",
      destinationLng: "3.4",
      mode: "teleport",
    },
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.code, "INVALID_REQUEST");
});

test("the controller returns the predictions the service produced", async () => {
  resetStub();
  fetchState.responses = [{ status: 200, body: autocompleteBody() }];

  const response = await runController(autocompletePlaces, {
    query: { input: "Ibara", regionCode: "ng" },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.predictions.length, 1);
  assert.equal(response.body.data.predictions[0].placeId, "ChIJ1234567890abcdef");
});

test("the controller turns an upstream 403 into a friendly, non-leaking response", async (t) => {
  resetStub();
  t.mock.method(console, "error", () => {});

  fetchState.responses = [
    {
      status: 403,
      body: {
        error: {
          message: "Requests from this Android client application <empty> are blocked. consumer: projects/secret-project",
          details: [{ reason: "API_KEY_ANDROID_APP_BLOCKED" }],
        },
      },
    },
  ];

  const response = await runController(autocompletePlaces, {
    query: { input: "Ibara" },
  });

  assert.equal(response.statusCode, 503);
  assert.equal(response.body.success, false);
  assert.equal(response.body.code, "LOCATION_SERVICE_MISCONFIGURED");
  // The client is told what happened, not what Google's internals say.
  assert.ok(!response.body.message.includes("Android client application"));
  assert.ok(!response.body.message.includes("secret-project"));
  assert.ok(!JSON.stringify(response.body).includes(TEST_API_KEY));
});

test("the controller reports a quota problem as a retryable 429", async (t) => {
  resetStub();
  t.mock.method(console, "error", () => {});

  fetchState.responses = [
    {
      status: 429,
      body: { error: { message: "quota", details: [{ reason: "RATE_LIMIT_EXCEEDED" }] } },
    },
  ];

  const response = await runController(autocompletePlaces, { query: { input: "Ibara" } });

  assert.equal(response.statusCode, 429);
  assert.equal(response.body.code, "LOCATION_QUOTA_EXCEEDED");
});

test("the controller reports a network failure as a service outage", async (t) => {
  resetStub();
  t.mock.method(console, "error", () => {});

  fetchState.responses = [{ throws: new TypeError("fetch failed") }];

  const response = await runController(reverseGeocodeAddress, {
    query: { lat: "7.1", lng: "3.4" },
  });

  assert.equal(response.statusCode, 502);
  assert.equal(response.body.code, "LOCATION_SERVICE_UNAVAILABLE");
});

test("the controller never reports a failure as a successful empty result", async (t) => {
  resetStub();
  t.mock.method(console, "error", () => {});

  fetchState.responses = [
    {
      status: 403,
      body: { error: { message: "denied", details: [{ reason: "API_KEY_INVALID" }] } },
    },
  ];

  const response = await runController(autocompletePlaces, { query: { input: "Ibara" } });

  assert.equal(response.body.success, false);
  assert.notEqual(response.body.code, undefined);
  assert.ok(!("data" in response.body));
});

// --- Optional auth ---------------------------------------------------------

test("optional auth identifies a signed-in caller", () => {
  const token = jwt.sign({ userId: "user-123", phone: "0803" }, JWT_SECRET, { expiresIn: "5m" });
  const req = { headers: { authorization: `Bearer ${token}` } };
  let nextCalled = false;

  optionalAuth(req, {}, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.userId, "user-123");
});

test("optional auth lets an unauthenticated caller through", () => {
  const req = { headers: {} };
  let nextCalled = false;

  optionalAuth(req, {}, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.userId, undefined);
});

test("optional auth treats a broken token as signed out rather than rejecting", () => {
  const req = { headers: { authorization: "Bearer not-a-real-token" } };
  let nextCalled = false;

  optionalAuth(req, {}, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.userId, undefined);
});
