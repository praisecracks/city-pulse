const test = require("node:test");
const assert = require("node:assert/strict");
const Pulse = require("../src/models/pulse.model");
const User = require("../src/models/user.model");
const {
  createPulse,
  getMyPulses,
  getPulses,
  getPulseById,
  getNearbyPulses,
  resubmitPulse,
  updatePulseStatus,
} = require("../src/controllers/pulse.controller");

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
  handler(req, response, (error) => {
    nextError = error;
  });
  await new Promise(setImmediate);
  if (nextError) throw nextError;
  return response;
}

test("provider submissions are pending review regardless of client-supplied status", async () => {
  const originalCreate = Pulse.create;
  const user = { _id: "provider-id", roles: [], save: async () => {} };
  let created;

  try {
    Pulse.create = async (body) => {
      created = body;
      return body;
    };
    const response = await runController(createPulse, {
      body: {
        title: "Test Gas",
        category: "gas",
        location: "Ibara, Abeokuta South, Ogun State",
        localGovernment: "Abeokuta South",
        address: "Near Kuto Market",
        details: { pricePerKg: 1200 },
        reviewStatus: "approved",
      },
      user,
    });

    assert.equal(response.statusCode, 201);
    assert.equal(created.reviewStatus, "pending_review");
    assert.equal(created.status, "Unconfirmed");
    assert.equal(created.state, "Ogun State");
    assert.equal(created.localGovernment, "Abeokuta South");
    assert.equal(created.coordinates, undefined);
    assert.equal(created.locationPoint, undefined);
    assert.deepEqual(user.roles, ["agent"]);
  } finally {
    Pulse.create = originalCreate;
  }
});

test("manual listings omit GeoJSON while listings with coordinates get a valid Point", () => {
  const manual = new Pulse({
    title: "Manual listing",
    location: "Ibara, Abeokuta South, Ogun State",
    category: "food",
    details: { menuItems: [] },
    agent: "64d9280b6447f5cdaf48c",
  });
  assert.equal(manual.locationPoint, undefined);

  const located = new Pulse({
    title: "Located listing",
    location: "Ibara, Abeokuta South, Ogun State",
    category: "food",
    details: { menuItems: [] },
    agent: "64d9280b6447f5cdaf48c",
    locationPoint: { type: "Point", coordinates: [3.4, 6.8] },
  });
  assert.deepEqual(located.locationPoint.toObject(), {
    type: "Point",
    coordinates: [3.4, 6.8],
  });
});

test("provider submissions reject local government areas outside the allowed Ogun list", async () => {
  let created = false;
  const originalCreate = Pulse.create;
  try {
    Pulse.create = async () => {
      created = true;
    };
    const response = await runController(createPulse, {
      body: { localGovernment: "Lagos Mainland" },
      user: { _id: "provider-id", roles: [], save: async () => {} },
    });

    assert.equal(response.statusCode, 400);
    assert.match(response.body.message, /Ogun State local government/);
    assert.equal(created, false);
  } finally {
    Pulse.create = originalCreate;
  }
});

test("public list, detail, and nearby queries include approved and legacy listings only", async () => {
  const originalUserFind = User.find;
  const originalPulseFind = Pulse.find;
  const originalPulseFindOne = Pulse.findOne;
  const originalAggregate = Pulse.aggregate;
  let listQuery;
  let detailQuery;
  let nearbyQuery;

  try {
    User.find = () => ({ distinct: async () => [] });
    Pulse.find = (query) => {
      listQuery = query;
      return { select: () => ({ sort: async () => [] }) };
    };
    Pulse.findOne = (query) => {
      detailQuery = query;
      return { select: async () => ({ _id: "approved-id" }) };
    };
    Pulse.aggregate = async (pipeline) => {
      nearbyQuery = pipeline[0].$geoNear.query;
      return [];
    };

    await runController(getPulses, { query: {} });
    await runController(getPulseById, { params: { id: "approved-id" } });
    await runController(getNearbyPulses, {
      query: { lat: "6.5", lng: "3.4", radius: "5000" },
    });

    for (const query of [listQuery, detailQuery, nearbyQuery]) {
      const reviewFilter = query.$or || query.$and?.find((part) => part.$or)?.$or;
      assert.deepEqual(reviewFilter, [
        { reviewStatus: "approved" },
        { reviewStatus: { $exists: false } },
      ]);
    }
  } finally {
    User.find = originalUserFind;
    Pulse.find = originalPulseFind;
    Pulse.findOne = originalPulseFindOne;
    Pulse.aggregate = originalAggregate;
  }
});

test("a rejected listing can be resubmitted by its owner and review metadata is cleared", async () => {
  const originalFindById = Pulse.findById;
  let saved = false;
  const pulse = {
    agent: "provider-id",
    reviewStatus: "rejected",
    reviewNote: "Please provide an exterior photo.",
    reviewedAt: new Date(),
    reviewedBy: "admin",
    async save() {
      saved = true;
    },
    async populate() {},
  };

  try {
    Pulse.findById = async () => pulse;
    const response = await runController(resubmitPulse, {
      params: { id: "rejected-id" },
      user: { _id: "provider-id" },
    });

    assert.equal(response.statusCode, 200);
    assert.equal(pulse.reviewStatus, "pending_review");
    assert.equal(pulse.reviewNote, undefined);
    assert.equal(pulse.reviewedAt, undefined);
    assert.equal(pulse.reviewedBy, undefined);
    assert.equal(saved, true);
  } finally {
    Pulse.findById = originalFindById;
  }
});

test("providers can still retrieve their own pending listing", async () => {
  const originalFind = Pulse.find;
  let query;

  try {
    Pulse.find = (receivedQuery) => {
      query = receivedQuery;
      return {
        populate: () => ({
          sort: async () => [{ _id: "pending-id", reviewStatus: "pending_review" }],
        }),
      };
    };
    const response = await runController(getMyPulses, { user: { _id: "provider-id" } });

    assert.deepEqual(query, { agent: "provider-id" });
    assert.equal(response.body.data[0].reviewStatus, "pending_review");
  } finally {
    Pulse.find = originalFind;
  }
});

test("pending providers cannot publish an availability status", async () => {
  const originalFindById = Pulse.findById;
  let saved = false;

  try {
    Pulse.findById = async () => ({
      agent: "provider-id",
      reviewStatus: "pending_review",
      save: async () => { saved = true; },
    });
    const response = await runController(updatePulseStatus, {
      body: { status: "Available" },
      params: { id: "pending-id" },
      user: { _id: "provider-id" },
    });

    assert.equal(response.statusCode, 409);
    assert.equal(response.body.code, "LISTING_PENDING_REVIEW");
    assert.equal(saved, false);
  } finally {
    Pulse.findById = originalFindById;
  }
});
