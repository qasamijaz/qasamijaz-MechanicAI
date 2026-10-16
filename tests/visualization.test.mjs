import test from "node:test";
import assert from "node:assert/strict";
import { createScene } from "../src/modules/visualization/scene.js";
import { planTask } from "../src/modules/task-engine/index.js";
test("fence scene produces bounded posts",()=>{const s=createScene(planTask("Design et hegn"),{length:10});assert.equal(s.kind,"fence");assert.equal(s.posts.at(-1).x,10);});
test("floorplan scene has rooms and conceptual status",()=>{const s=createScene(planTask("Tegn et hus"));assert.equal(s.kind,"floorplan");assert.equal(s.status,"conceptual");assert.equal(s.rooms.length,4);});
test("lights show placement, not wiring",()=>{const s=createScene(planTask("Sæt lamper op"));assert.equal(s.kind,"lights");assert.equal(s.points.length,3);assert.match(s.warning,/ikke elektrisk installation/);});
test("mechanics does not invent repair diagrams",()=>{const s=createScene(planTask("Skift olie"));assert.equal(s.kind,"guide");assert.equal(s.status,"conceptual");});
test("dimensions are clamped",()=>{const s=createScene(planTask("Design et hegn"),{length:1000});assert.equal(s.length,40);});
