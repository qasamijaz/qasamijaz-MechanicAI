import test from "node:test";
import assert from "node:assert/strict";
import {cloudConfigured} from "../src/modules/ai-runtime/cloud.js";
test("cloud mode remains disabled until configured",()=>assert.equal(cloudConfigured(),false));
