const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const Pulse = require("../src/models/pulse.model");
const User = require("../src/models/user.model");
const adminAuth = require("../src/middlewares/adminAuth");
const { JWT_SECRET } = require("../src/config/jwt");
const { getPendingListings, reviewListing } = require("../src/controllers/admin.controller");

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

test("admin listing filters query review states and populate provider identity", async () => {
  const originalFind = Pulse.find;
  const originalCount = Pulse.countDocuments;
  let findQuery;
  let countQuery;

  try {
    Pulse.find = (query) => {
      findQuery = query;
      return {
        populate: (path, fields) => {
          assert.equal(path, "agent");
          assert.equal(fields, "name email phone isVerified");
          return {
            sort: () => ({
              skip: () => ({
                limit: async () => [{ _id: "pending-id" }],
              }),
            }),
          };
        },
      };
    };
    Pulse.countDocuments = async (query) => {
      countQuery = query;
      return 1;
    };

    const response = await runController(getPendingListings, {
      query: { page: "2", limit: "10", reviewStatus: "pending_review" },
    });

    assert.deepEqual(findQuery, { reviewStatus: "pending_review" });
    assert.deepEqual(countQuery, findQuery);
    assert.equal(response.body.data.page, 2);
    assert.equal(response.body.data.limit, 10);
    assert.equal(response.body.data.total, 1);
  } finally {
    Pulse.find = originalFind;
    Pulse.countDocuments = originalCount;
  }
});

test("admin can view approved listings or all listings including legacy entries", async () => {
  const originalFind = Pulse.find;
  const originalCount = Pulse.countDocuments;
  const queries = [];

  try {
    Pulse.find = (query) => {
      queries.push(query);
      return {
        populate: () => ({
          sort: () => ({
            skip: () => ({
              limit: async () => [],
            }),
          }),
        }),
      };
    };
    Pulse.countDocuments = async () => 0;

    await runController(getPendingListings, { query: { reviewStatus: "approved" } });
    await runController(getPendingListings, { query: { reviewStatus: "all" } });

    assert.deepEqual(queries[0], {
      $or: [
        { reviewStatus: "approved" },
        { reviewStatus: { $exists: false } },
      ],
    });
    assert.deepEqual(queries[1], {});
  } finally {
    Pulse.find = originalFind;
    Pulse.countDocuments = originalCount;
  }
});

test("admin listing filter rejects unsupported review states", async () => {
  const response = await runController(getPendingListings, {
    query: { reviewStatus: "unverified" },
  });

  assert.equal(response.statusCode, 400);
  assert.match(response.body.message, /pending_review, approved, rejected, or all/);
});

test("admin can approve only a pending listing and the provider becomes verified", async () => {
  const originalFindOneAndUpdate = Pulse.findOneAndUpdate;
  const originalFindByIdAndUpdate = User.findByIdAndUpdate;
  let pulseQuery;
  let pulseUpdate;
  let userQuery;
  let userUpdate;
  const owner = { _id: "provider-id", isVerified: true };
  const pulse = { _id: "listing-id", agent: owner, reviewStatus: "approved" };

  try {
    Pulse.findOneAndUpdate = (query, update, options) => {
      pulseQuery = query;
      pulseUpdate = { update, options };
      return { populate: async () => pulse };
    };
    User.findByIdAndUpdate = (id, update, options) => {
      userQuery = id;
      userUpdate = { update, options };
      return { select: async () => owner };
    };

    const response = await runController(reviewListing, {
      params: { id: "listing-id" },
      body: { reviewStatus: "approved" },
      admin: { sub: "admin" },
    });

    assert.deepEqual(pulseQuery, { _id: "listing-id", reviewStatus: "pending_review" });
    assert.equal(pulseUpdate.update.$set.reviewStatus, "approved");
    assert.equal(pulseUpdate.update.$set.reviewedBy, "admin");
    assert.equal(pulseUpdate.options.runValidators, true);
    assert.equal(userQuery, "provider-id");
    assert.equal(userUpdate.update.$set.isVerified, true);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.data.agent.isVerified, true);
  } finally {
    Pulse.findOneAndUpdate = originalFindOneAndUpdate;
    User.findByIdAndUpdate = originalFindByIdAndUpdate;
  }
});

test("rejection requires a provider-facing correction note", async () => {
  const originalFindOneAndUpdate = Pulse.findOneAndUpdate;
  let updated = false;

  try {
    Pulse.findOneAndUpdate = () => {
      updated = true;
      throw new Error("Should not query/update listing");
    };
    const response = await runController(reviewListing, {
      params: { id: "listing-id" },
      body: { reviewStatus: "rejected", note: "  " },
      admin: { sub: "admin" },
    });

    assert.equal(response.statusCode, 400);
    assert.equal(updated, false);
  } finally {
    Pulse.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("admin rejection records correction notes and leaves the provider unverified", async () => {
  const originalFindOneAndUpdate = Pulse.findOneAndUpdate;
  const originalFindByIdAndUpdate = User.findByIdAndUpdate;
  const owner = { _id: "provider-id", isVerified: false };
  const pulse = { _id: "listing-id", agent: owner, reviewStatus: "rejected" };
  let storedNote;

  try {
    Pulse.findOneAndUpdate = (_query, update) => {
      storedNote = update.$set.reviewNote;
      return { populate: async () => pulse };
    };
    User.findByIdAndUpdate = (_id, update) => {
      assert.equal(update.$set.isVerified, false);
      return { select: async () => owner };
    };

    const response = await runController(reviewListing, {
      params: { id: "listing-id" },
      body: { reviewStatus: "rejected", note: "  Upload a clear storefront photo.  " },
      admin: { sub: "admin" },
    });

    assert.equal(response.statusCode, 200);
    assert.equal(storedNote, "Upload a clear storefront photo.");
    assert.equal(pulse.reviewStatus, "rejected");
    assert.equal(response.body.data.agent.isVerified, false);
  } finally {
    Pulse.findOneAndUpdate = originalFindOneAndUpdate;
    User.findByIdAndUpdate = originalFindByIdAndUpdate;
  }
});

test("admin authorization accepts admin JWTs and rejects regular user JWTs", () => {
  const adminToken = jwt.sign({ role: "admin", sub: "admin" }, JWT_SECRET);
  const userToken = jwt.sign({ role: "customer", userId: "user-id" }, JWT_SECRET);
  const request = (token) => ({ headers: { authorization: `Bearer ${token}` } });
  const adminResponse = createResponse();
  const userResponse = createResponse();
  let nextCalled = false;

  adminAuth(request(adminToken), adminResponse, () => { nextCalled = true; });
  adminAuth(request(userToken), userResponse, () => {});

  assert.equal(nextCalled, true);
  assert.equal(adminResponse.statusCode, 200);
  assert.equal(userResponse.statusCode, 403);
});
