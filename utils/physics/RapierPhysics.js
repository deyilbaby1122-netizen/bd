/**
 * RapierPhysics — thin wrapper around @dimforge/rapier3d-compat.
 *
 * Rapier needs `init()` to be called and awaited before use. The
 * vehicle itself uses a smooth manual-drive system for predictable,
 * responsive feel; Rapier provides collision geometry for the
 * environment so the drive system can react to obstacles, plus an
 * authoritative step for any truly dynamic objects.
 */
"use strict";

let Ragie = null;
let _initialized = false;

async function ensureInit() {
  if (_initialized) return;
  Ragie = await import("@dimforge/rapier3d-compat");
  await Ragie.init();
  _initialized = true;
}

export class PhysicsWorld {
  constructor(opts) {
    opts = opts || {};
    this.enabled = false;
    this.gravity = opts.gravity || [0, -9.81, 0];
    this.timestep = opts.timestep || 1 / 60;
    this.iterations = opts.iterations || 6;
    this.stiffness = opts.stiffness || 0.5;
    this._world = null;
    this.bodies = new Map();
  }

  async init() {
    if (this._world) return;
    await ensureInit();
    Ragie = await import("@dimforge/rapier3d-compat");
    this._world = new Ragie.World();
    this.enabled = true;
  }

  async createRigidBody(options) {
    await this.init();
    if (!this._world) return null;
    const pos = options.position || { x: options.x || 0, y: options.y || 0, z: options.z || 0 };
    const body = this._world.createRigidBody({
      position: pos,
      type: options.type || Ragie.RigidBodyType.Dynamic,
      mass: options.mass || 0,
      restitution: options.restitution ?? 0,
    });
    this.bodies.set(body.handle, body);
    return body;
  }

  createShape(type, args) {
    if (!this._world) return null;
    let shape = null;
    switch (type) {
      case "cuboid":
        shape = this._world.createShape(Ragie.ShapeType.Cuboid, args);
        break;
      case "ball":
        shape = this._world.createShape(Ragie.ShapeType.Ball, args);
        break;
      case "trimesh":
        shape = this._world.createShape(Ragie.ShapeType.TriMesh, args);
        break;
    }
    return shape;
  }

  step() {
    if (this.enabled && this._world) {
      this._world.step();
    }
  }

  queryPoint(point, opts) {
    if (!this.enabled || !this._world) return [];
    return this._world.queryPoint(point, opts);
  }

  dispose() {
    if (this._world) {
      this._world.dispose();
      this._world = null;
    }
    this.bodies.clear();
  }
}

export default PhysicsWorld;
