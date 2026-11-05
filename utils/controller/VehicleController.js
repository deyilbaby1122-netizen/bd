/**
 * VehicleController — smooth, bounding-box-aware vehicle controller.
 *
 * Desktop:
 *   W / Up   — Accelerate
 *   S / Down — Reverse / brake
 *   A / Left — Turn left
 *   D / Right— Turn right
 *   Space    — Immediate brake
 *   E        — Interact
 *
 * The vehicle is a physics-free "manual drive" system: it integrates
 * velocity with smooth acceleration/deceleration into a bounding
 * environment (auto-scrolling terrain + invisible collision box) and
 * fires an "interact" event whenever the vehicle crosses the trigger
 * zone of an interactive marker named via `parent.Name`.
 */
"use strict";

import * as THREE from "three";
import { RapierPhysics } from "../physics/RapierPhysics.js";

export class VehicleController {
  constructor(opts = {}) {
    const {
      player = null,
      canvas,
      debug = false,
      world = null,
      ground = null,
      autoScroll = true,
    } = opts;

    this.player = player;
    this.canvas = canvas;
    this.debug = debug;
    this.world = world;
    this.ground = ground;
    this.autoScroll = autoScroll;

    // Movement state
    this.speed = 0;
    this.targetSpeed = 0;
    this.turn = 0;
    this.targetTurn = 0;
    this.brake = false;
    this.boost = false;
    this.interacting = false;
    this.interactCooldown = 0;
    this.interactTime = 0.25;

    // Physics step
    this._velocity = new THREE.Vector3();
    this._prevPosition = new THREE.Vector3();
    this._step = 0;
    this._time = 0;

    // Input
    this.keys = { w: false, a: false, s: false, d: false, space: false, up: false, down: false, left: false, right: false };

    // Interaction zone
    this.interactTrigger = new THREE.Sphere(0, 0, 0, 0.6);
    this.interactTarget = null;

    // Ground collision
    this.groundHeight = 0;

    // Speed limits
    this.maxSpeed = 5.0;
    this.brakeSpeed = 3.0;
    this.turnSpeed = 2.2;
    this.acceleration = 6.0;
    this.deceleration = 8.0;
    this.boostMultiplier = 1.6;
    this.minMoveSpeed = 0.6;

    // Pure-y movement
    this.maxY = 40;
    this.minY = 4;

    // Smoothing
    this._velocityLerp = 0.15;
    this._turnLerp = 0.12;

    // Interaction events
    this.onInteract = null;

    this._bindEvents();
  }

  _bindEvents() {
    window.addEventListener("keydown", (e) => this._onKeyDown(e), { passive: false });
    window.addEventListener("keyup", (e) => this._onKeyUp(e), { passive: false });
    window.addEventListener("blur", () => this._onBlur());
  }

  _onKeyDown(e) {
    const key = e.key;
    switch (key) {
      case "w":
      case "W":
      case "arrowup":
        this.keys.up = true;
        this.keys.w = true;
        e.preventDefault();
        break;
      case "s":
      case "S":
      case "arrowdown":
        this.keys.down = true;
        this.keys.s = true;
        e.preventDefault();
        break;
      case "a":
      case "A":
      case "arrowleft":
        this.keys.left = true;
        this.keys.a = true;
        e.preventDefault();
        break;
      case "d":
      case "D":
      case "arrowright":
        this.keys.right = true;
        this.keys.d = true;
        e.preventDefault();
        break;
      case " ":
        this.brake = true;
        e.preventDefault();
        break;
      case "e":
      case "E":
        this._tryInteract();
        e.preventDefault();
        break;
      default:
        break;
    }
  }

  _onKeyUp(e) {
    const key = e.key;
    switch (key) {
      case "w":
      case "W":
      case "arrowup":
        this.keys.up = false;
        this.keys.w = false;
        e.preventDefault();
        break;
      case "s":
      case "S":
      case "arrowdown":
        this.keys.down = false;
        this.keys.s = false;
        e.preventDefault();
        break;
      case "a":
      case "A":
      case "arrowleft":
        this.keys.left = false;
        this.keys.a = false;
        e.preventDefault();
        break;
      case "d":
      case "D":
      case "arrowright":
        this.keys.right = false;
        this.keys.d = false;
        e.preventDefault();
        break;
      case " ":
        this.brake = false;
        e.preventDefault();
        break;
      default:
        break;
    }
  }

  _onBlur() {
    this.keys = { w: false, a: false, s: false, d: false, up: false, down: false, left: false, right: false };
    this.brake = false;
  }

  // --- Physics integration ---
  _integrate(dt, advDt, groundY) {
    this.groundHeight = groundY || 0;
    this._step += dt;
    this._time += dt;

    // Decay inputs over time for smoother feel
    this.turn = Math.max(0.05, this.turn * 0.92);
    this.speed = Math.max(0, this.speed * 0.94);

    // Determine input axis
    const movingForward = this.keys.w || this.keys.up;
    const movingBack = this.keys.s || this.keys.down;
    const rotateLeft = this.keys.a || this.keys.left;
    const rotateRight = this.keys.d || this.keys.right;

    // Target steering
    if (rotateLeft && !rotateRight) this.targetTurn = -1;
    else if (rotateRight && !rotateLeft) this.targetTurn = 1;
    else this.targetTurn = 0;

    // Boost control
    if (this.boost && movingForward) {
      this.targetSpeed = this.boostMultiplier * this.maxSpeed;
    } else if (movingForward) {
      this.targetSpeed = this.maxSpeed;
    } else if (movingBack) {
      this.targetSpeed = -this.brakeSpeed;
    } else if (this.brake) {
      this.targetSpeed = 0;
    } else if (this.speed > 0) {
      this.targetSpeed = 0;
    } else {
      this.targetSpeed = 0;
    }

    // Smooth speed
    const accel = this.targetSpeed > this.speed ? this.acceleration : -this.deceleration;
    this.speed += accel * dt;
    this.speed = Math.max(-this.brakeSpeed, Math.min(this.targetSpeed * 1.05, this.maxSpeed * 1.05));
    if (Math.abs(this.speed) < 0.05) this.speed = 0;

    // Smooth turn
    this.turn += (this.targetTurn - this.turn) * this._turnLerp * 2;

    // Build velocity
    const forward = new THREE.Vector3(0, 0, -1);
    const right = new THREE.Vector3(1, 0, 0);
    forward.applyQuaternion(this.player.quaternion);
    right.applyQuaternion(this.player.quaternion);

    const velocity = new THREE.Vector3();
    velocity.addScaledVector(forward, this.speed);
    velocity.addScaledVector(right, this.turn * 0.6 * this.speed);

    // Vertical stabiliser
    velocity.y += (this.groundHeight - this.player.position.y) * 0.6;
    if (this.speed > 0.5) velocity.y += 0.25;

    // Clamp Y within bounds
    this.player.position.y = Math.max(this.minY, Math.min(this.maxY, this.player.position.y));

    // Apply velocity
    this.player.position.x += velocity.x * dt * 10;
    this.player.position.z += velocity.z * dt * 10;

    // Store previous position for collision response
    this._prevPosition.copy(this.player.position);
    this._velocity.copy(velocity);
  }

  _checkCollision() {
    // Bounding box check against auto-scrolling ground obstacles
    const box = this.player.getBoundingBox ? this.player.getBoundingBox() : null;
    if (!box) return;

    const half = 0.48;
    const min = new THREE.Vector3(
      box.min.x - half,
      box.min.y,
      box.min.z - half
    );
    const max = new THREE.Vector3(
      box.max.x + half,
      box.max.y,
      box.max.z + half
    );

    // Clamp within world bounds
    const worldMin = new THREE.Vector3(-120, 0, -80);
    const worldMax = new THREE.Vector3(120, 80, 80);
    this.player.position.x = Math.max(worldMin.x, Math.min(worldMax.x, this.player.position.x));
    this.player.position.z = Math.max(worldMin.z, Math.min(worldMax.z, this.player.position.z));
  }

  _tryInteract() {
    if (this.interactCooldown > 0 || this.interactTarget) return;
    this.interactTarget = null;

    // Check children by name for interactive triggers
    const children = this.player.children || [];
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.isGroup && child.name && child.name.toLowerCase().indexOf("interact") > -1) {
        if (child.visible) {
          this.interactTarget = child;
          this.interactCooldown = 0.2;
          if (this.onInteract) {
            this.onInteract({
              target: child,
              name: child.name,
              position: child.position.clone(),
            });
          }
          return;
        }
      }
    }
  }

  // --- Public API ---
  setSpeed(s) {
    this.targetSpeed = s;
  }

  setTurn(t) {
    this.targetTurn = t;
  }

  boost(value) {
    this.boost = value;
  }

  interact() {
    if (this.interactCooldown > 0 && !this.interactTarget) return false;
    this._tryInteract();
    return !!this.interactTarget;
  }

  update(dt, advDt, groundY) {
    this._integrate(dt, advDt, groundY);
    this._checkCollision();
    if (this.interactCooldown > 0) this.interactCooldown -= dt;
    else this.interactTarget = null;
  }

  dispose() {
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
    window.removeEventListener("blur", this._onBlur);
  }
}
