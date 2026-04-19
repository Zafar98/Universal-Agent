import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDepartmentRoutingInstructions,
  buildTenantConfigFromBusiness,
  getVerificationPolicyForTenant,
  resolveDepartmentFromText,
  resolveDepartmentVoice,
  resolveLeadVoiceForTenant,
} from "../lib/businessModels";

test("hotel verification policy uses booking-specific factors", () => {
  const hotel = buildTenantConfigFromBusiness({
    tenantId: "hotel-test",
    businessName: "Hotel Test",
    businessModelId: "hotel",
  });

  const policy = getVerificationPolicyForTenant(hotel);
  assert.match(policy, /booking reference/i);
  assert.match(policy, /check-in date/i);
});

test("department routing and voice model resolution for restaurant", () => {
  const restaurant = buildTenantConfigFromBusiness({
    tenantId: "restaurant-test",
    businessName: "Restaurant Test",
    businessModelId: "restaurant",
  });

  const matched = resolveDepartmentFromText(
    restaurant,
    "I want a delivery order and need to change menu items."
  );

  assert.equal(matched?.id, "restaurant-orders");
  assert.equal(resolveDepartmentVoice(restaurant, "Orders"), "verse");
});

test("voice fallback normalizes invalid lead voice configs", () => {
  const housing = buildTenantConfigFromBusiness({
    tenantId: "housing-test",
    businessName: "Housing Test",
    businessModelId: "housing-association",
  });

  const invalid = {
    ...housing,
    leadAgent: {
      ...housing.leadAgent,
      realtimeVoice: "invalid-voice",
    },
  };

  assert.equal(resolveLeadVoiceForTenant(invalid), "marin");
});

test("routing instructions include workflow tasks and handoff payload schema", () => {
  const hotel = buildTenantConfigFromBusiness({
    tenantId: "hotel-test",
    businessName: "Hotel Test",
    businessModelId: "hotel",
  });

  const instructions = buildDepartmentRoutingInstructions(hotel);
  assert.match(instructions, /Call workflow by type/i);
  assert.match(instructions, /Handoff payload required fields/i);
  assert.match(instructions, /booking_reference|stay_dates/i);
});
