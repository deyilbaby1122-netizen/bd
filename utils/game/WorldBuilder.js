/**
 * WorldBuilder — builds the full 3D portfolio environment.
 *
 * Uses React Three Fiber primitives (plain Three.js geometry objects)
 * returned as React elements, assembled from:
 *   - Roads, land, terrain
 *   - Buildings for each area (About, Skills, Projects,
 *     Design, Services, Contact)
 *   - Project exhibition pedestals
 *   - Trees, sky, ground detail
 */
"use strict";

import * as THREE from "three";

export class WorldBuilder {
  constructor() {
    this.buildings = [];
    this.trees = [];
    this.lights = [];
    this.metalColors = [];
  }

  // ── Ground ────────────────────────────────────────────────────────────────
  ground() {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2a4a3a,
      roughness: 1,
      metalness: 0,
      side: THREE.DoubleSide,
    });
    const geo = new THREE.PlaneGeometry(120, 120);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    return mesh;
  }

  // Grids
  grid() {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x446688,
      roughness: 1,
      metalness: 0,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const geo = new THREE.PlaneGeometry(80, 80);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.01;
    return mesh;
  }

  // ── Roads ────────────────────────────────────────────────────────────────
  road(options = {}) {
    const { color = "#556677", width = 1.5, length = 20, position = [0, 0.005, 0] } = options;
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0.1 });
    const geo = new THREE.BoxGeometry(width, 0.2, length);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(position[0], position[1] || 0, position[2] || 0);
    mesh.receiveShadow = true;
    return mesh;
  }

  // Road markings (dashed lines)
  markings(options = {}) {
    const { color = "#fff", y = 0, start = -8, end = 9, step = 0.8 } = options;
    const pts = [];
    for (let x = start; x <= end; x += step) {
      pts.push(new THREE.Vector3(x, y, 0.15), new THREE.Vector3(x, y, 0));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 });
    return new THREE.LineSegments(geo, mat);
  }

  // ── Building (area centerpiece) ──────────────────────────────────────────
  building(options = {}) {
    const {
      position = [0, 0, 0],
      scale = [1, 1, 1],
      color = 0x445566,
      height = 6,
      width = 4,
      depth = 5,
      roofColor = 0x667788,
      windows = true,
    } = options;

    const baseMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.5,
      metalness: 0.1,
    });
    const roofMat = new THREE.MeshStandardMaterial({
      color: roofColor,
      roughness: 0.7,
      metalness: 0.2,
    });

    const geo = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geo, baseMat);
    mesh.position.set(position[0], position[1] || 0, position[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Floor divisions
    const floors = 4;
    for (let f = 1; f < floors; f++) {
      const h = f * height / floors;
      const floor = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.95, 0.05, depth * 0.95),
        new THREE.MeshStandardMaterial({ color: 0x556677, roughness: 0.6 })
      );
      floor.position.set(
        position[0],
        position[1] + h,
        position[2]
      );
      floor.castShadow = true;
    }

    // Roof
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(depth * 0.45, height * 0.25, 8),
      roofMat
    );
    roof.position.set(
      position[0],
      position[1] + height + 0.2,
      position[2]
    );
    roof.castShadow = true;

    return [mesh, roof];
  }

  // ── Trees ────────────────────────────────────────────────────────────────
  tree(options = {}) {
    const { position = [0, 0, 0], scale = [1, 1, 1] } = options;
    const leaves = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.4),
      new THREE.MeshStandardMaterial({ color: 0x448822, roughness: 0.8, metalness: 0 })
    );
    leaves.position.y = 1.4;
    leaves.castShadow = true;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.25, 1.4, 6),
      new THREE.MeshStandardMaterial({ color: 0x553311, roughness: 0.9 })
    );
    trunk.position.y = 0.7;
    trunk.castShadow = true;

    // Combine
    const group = new THREE.Group();
    group.add(trunk);
    group.add(leaves);
    group.position.set(position[0] || 0, position[1] || 0, position[2] || 0);
    group.scale.set(scale[0] || 1, scale[1] || 1, scale[2] || 1);
    return group;
  }

  // ── Sphere/pillar platform ───────────────────────────────────────────────
  platform(options = {}) {
    const { position = [0, 0, 0], radius = 1.5, color = 0x334455 } = options;
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.4,
      metalness: 0.3,
      emissive: color,
      emissiveIntensity: 0.1,
    });
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.3, 24), mat);
    mesh.position.set(position[0], position[1] || 0, position[2]);
    mesh.receiveShadow = true;
    return mesh;
  }

  // ── Bouncing ball (animated object) ─────────────────────────────────────
  beacon(position, color = 0x00ff88) {
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.1,
      metalness: 0.8,
      emissive: color,
      emissiveIntensity: 0.3,
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.25, 20, 20), mat);
    mesh.position.set(position[0], position[1] || 0, position[2]);
    mesh.castShadow = true;
    return mesh;
  }

  // ── Sky dome ────────────────────────────────────────────────────────────
  sky() {
    const geo = new THREE.SphereGeometry(80, 32, 32);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        top: { value: new THREE.Color(0x0a0a2e) },
        bottom: { value: new THREE.Color(0x222244) },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPos;
        void main() {
          float v = smoothstep(0.0, 50.0, length(vWorldPos));
          vec3 col = mix(vec3(0x0a0a2e), vec3(0x222244), v);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    return new THREE.Mesh(geo, mat);
  }
}
