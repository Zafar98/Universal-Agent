import assert from "node:assert/strict";
import test from "node:test";
import { buildTenantConfigFromBusiness } from "../lib/businessModels";
import {
  extractVerificationFactors,
  hasSatisfiedVerification,
  indicatesResolution,
} from "../lib/useVoiceCall";

test("extractVerificationFactors detects multiple identity factors", () => {
  const text = "Hi, my name is Alex Stone, my phone is 07700 900123 and postcode AB1 2CD.";
  const factors = extractVerificationFactors(text);

  assert.ok(factors.includes("name"));
  assert.ok(factors.includes("phone"));
  assert.ok(factors.includes("postcode"));
});

test("extractVerificationFactors detects booking and date details", () => {
  const text = "Booking reference REF-8821 and dob 01/02/1990.";
  const factors = extractVerificationFactors(text);

  assert.ok(factors.includes("reference"));
  assert.ok(factors.includes("dob"));
});

test("indicatesResolution identifies close-call phrasing", () => {
  assert.equal(indicatesResolution("Everything is resolved now, that's all."), true);
  assert.equal(indicatesResolution("I still need help with this issue."), false);
});

test("hotel verification requires approved factor pairs", () => {
  const hotel = buildTenantConfigFromBusiness({
    tenantId: "hotel-test",
    businessName: "Hotel Test",
    businessModelId: "hotel",
  });

  const insufficient = new Set(extractVerificationFactors("My phone is 07700 900123."));
  const valid = new Set(
    extractVerificationFactors("Booking reference REF-1133 and my surname is Stone.")
  );

  assert.equal(hasSatisfiedVerification(hotel, insufficient), false);
  assert.equal(hasSatisfiedVerification(hotel, valid), true);
});
