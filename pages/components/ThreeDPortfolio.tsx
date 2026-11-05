// @ts-nocheck

/**
 * ThreeDPortfolio.tsx — Ashraf's 3D Interactive Portfolio
 *
 * A fully explorable 3D world inspired by Bruno Simon's portfolio but
 * built entirely from Ashraf's own content:
 *   - Name: Ashraf
 *   - Title: Front-End Developer | Web Designer | Graphic Designer
 *   - Location: Hyderabad, Sindh, Pakistan
 *   - Three actual live projects (Coffee Shop, Gaming Website, NextNova)
 *   - Six areas: About Me, Skills, Projects, Design Work, Services, Contact
 *   - Controllable vehicle (WASD, Space brake, E interact)
 *   - Touch controls for mobile
 *   - Loading screen, sound toggle, fullscreen, tutorial
 */

"use strict";

import { useEffect, useRef, useState } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";
import { SoundManager } from "../../utils/sound/SoundManager.js";
import { VehicleController } from "../../utils/controller/VehicleController.js";
import { PhysicsWorld } from "../../utils/physics/RapierPhysics.js";
import { WorldBuilder } from "../../utils/game/WorldBuilder.js";

// ─── Camera controller (child of Canvas, owns the camera) ─────────────────
function CameraController({ camPos, camTarget, vehiclePos }: {
  camPos: THREE.Vector3 | null;
  camTarget: THREE.Vector3 | null;
  vehiclePos: THREE.Vector3 | null;
}) {
  const { camera } = useThree();

  useFrame(() => {
    if (vehiclePos) {
      const v = vehiclePos;
      const newCam = v.clone().add(new THREE.Vector3(0, 8, 18));
      camera.position.lerp(newCam, 0.05);
    } else if (camPos) {
      camera.position.lerp(camPos, 0.05);
    }
    if (camTarget) {
      camera.lookAt(camTarget);
    }
  });

  return null;
}

// ─── Responsive canvas wrapper (hides canvas on small screens) ─────────────
const ResponsiveCanvas = ({ children }: { children: React.ReactNode }) => {
  const [width, setWidth] = useState(1280);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  if (width < 768) return null;
  return <>{children}</>;
};

// ─── Constants ──────────────────────────────────────────────────────────────
const T = {
  name: "Ashraf",
  title: "Front-End Developer | Web Designer | Graphic Designer",
  subtitle: "Interactive 3D Portfolio",
  location: "Hyderabad, Sindh, Pakistan",
  email: "shaikashraf318@icloud.com",
  github: "https://github.com/deyilbaby1122-netizen",
  about:
    "I'm a creative and enthusiastic frontend developer, web designer, and graphic designer who enjoys building modern, interactive, responsive websites and digital experiences. I work with frontend technologies, modern web frameworks, UI design, and graphic design — continuously improving my skills by creating real projects and exploring new technologies. My goal is to transform creative ideas into beautiful, functional, and engaging digital experiences.",
};

const SKILLS = [
  "HTML5", "CSS3", "JavaScript", "Bootstrap", "React", "Next.js",
  "Tailwind CSS", "UI/UX Design", "Figma", "Graphic Design",
  "Responsive Web Design", "Git", "GitHub",
];

const PROJECTS = [
  {
    id: "coffee",
    name: "Coffee Shop Website",
    category: "Web Design",
    desc:
      "A premium, full-featured coffee shop website with menu browsing, online ordering, and location details — built with a clean, appetizing visual identity.",
    link: "https://coffeeshop-six-xi.vercel.app/",
    color: "#8B4513",
    accent: "#F5DEB3",
    mesh: "cone",
  },
  {
    id: "gaming",
    name: "Gaming Website",
    category: "Gaming",
    desc:
      "A high-energy gaming website with team information, event schedules, and an immersive, dark, neon-lit presentation for the gaming community.",
    link: "https://gamingweb-azure.vercel.app/",
    color: "#3C1060",
    accent: "#00FF7F",
    mesh: "box",
  },
  {
    id: "nextnova",
    name: "NextNova",
    category: "Web Development",
    desc:
      "A futuristic, high-performance web platform built on Next.js — showcasing modern, responsive, and cutting-edge frontend architecture.",
    link: "https://nextnova-blush.vercel.app/",
    color: "#0047AB",
    accent: "#7CFC00",
    mesh: "cylinder",
  },
];

// ─── Orbit point for camera target ──────────────────────────────────────────
const OrbitPoint = ({ target, ...props }: { target: THREE.Vector3 }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current && target) {
      ref.current.position.copy(target);
    }
  });
  return <group ref={ref} {...props} />;
};

// ─── Interactive marker panel ───────────────────────────────────────────────
interface MarkerProps {
  label: string;
  position: THREE.Vector3;
  color: string;
  onInteract?: () => void;
  scale?: [number, number, number];
}

function AreaMarker({ label, position, color, onInteract, scale = [1, 1, 1] }: MarkerProps) {
  const { camera, gl } = useThree();
  const marker = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Face the camera when it's far enough away
  useFrame(() => {
    if (marker.current && gl.domElement) {
      const toCam = new THREE.Vector3().subVectors(camera.position, marker.current.position);
      if (toCam.length() > 3) {
        const up = new THREE.Vector3(0, 1, 0);
        const quat = new THREE.Quaternion().setFromUnitVectors(up, toCam.clone().normalize());
        marker.current.quaternion.copy(quat);
      }
    }
  });

  return (
    <group
      ref={marker}
      position={position}
      scale={scale}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onInteract?.();
      }}
    >
      <mesh>
        <cylinderGeometry args={[0.15, 0.2, 0.6, 16]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.7} />
      </mesh>
      <group position={new THREE.Vector3(0, 0.28, 0.05)}>
        <planeGeometry args={[1.8, 0.4]} />
        <meshBasicMaterial color="#111" />
      </group>
      <group position={new THREE.Vector3(0, 0.6, 0.08)}>
        <planeGeometry args={[1.6, 1.2]} />
        <meshBasicMaterial color={color} />
      </group>
      <group position={new THREE.Vector3(0, 0.6, 0.18)}>
        <planeGeometry args={[1.5, 1.05]} />
        <meshBasicMaterial color="#ddd" />
      </group>
      <lineSegments
        geometry={new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0.8, 0),
          new THREE.Vector3(0, 0.82, 0),
        ])}
      >
        <lineBasicMaterial color={hovered ? "#f60" : "#f60"} />
      </lineSegments>
      <text3d
        font="/fonts/roboto.json"
        size={0.2}
        height={0.03}
        position={new THREE.Vector3(0, 0.98, 0.02)}
      >
        <meshBasicMaterial color="#fff" />
      </text3d>
    </group>
  );
}

// ─── Vehicle (the player) ───────────────────────────────────────────────────
function Vehicle({ position, rotation, speed, turn }: {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  speed: number;
  turn: number;
}) {
  return (
    <group position={new THREE.Vector3(position.x, position.y, position.z)}>
      {/* Chassis */}
      <group position={[0, -0.15, 0]}>
        <mesh>
          <boxGeometry args={[1.2, 0.05, 0.6]} />
          <meshStandardMaterial color="#555" roughness={0.4} />
        </mesh>
      </group>
      {/* Cabin */}
      <mesh castShadow>
        <boxGeometry args={[1.0, 0.4, 0.6]} />
        <meshStandardMaterial color="#ccc" roughness={0.2} metalness={0.9} />
      </mesh>
      {/* Cylinders */}
      <mesh castShadow>
        <cylinderGeometry args={[0.25, 0.3, 0.8, 12]} />
        <meshStandardMaterial color="#111" roughness={0.9} metalness={0.1} />
      </mesh>
      <mesh castShadow>
        <cylinderGeometry args={[0.22, 0.28, 0.8, 12]} />
      </mesh>
      <mesh castShadow>
        <cylinderGeometry args={[0.22, 0.28, 0.8, 12]} />
        <meshStandardMaterial color="#222" roughness={0.8} metalness={0.2} />
      </mesh>
      {/* Headlights */}
      <pointLight position={[0.6, 0.25, 0.25]} intensity={0.8} color="#fff3e0" />
      <pointLight position={[-0.6, 0.25, 0.25]} intensity={0.8} color="#fff3e0" />
      {/* Wheels */}
      <group position={[0.8, 0.15, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.4, 10]} />
        <meshStandardMaterial color="#333" roughness={0.95} metalness={0.05} />
      </group>
      <group position={[-0.8, 0.15, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.4, 10]} />
        <meshStandardMaterial color="#333" roughness={0.95} metalness={0.05} />
      </group>
      <group position={[0, 0.15, 0.4]}>
        <cylinderGeometry args={[0.15, 0.15, 0.4, 10]} />
        <meshStandardMaterial color="#333" roughness={0.95} metalness={0.05} />
      </group>
      <group position={[0, 0.15, -0.4]}>
        <cylinderGeometry args={[0.15, 0.15, 0.4, 10]} />
        <meshStandardMaterial color="#333" roughness={0.95} metalness={0.05} />
      </group>
    </group>
  );
}

// ─── Tutorial tooltip ───────────────────────────────────────────────────────
function Tutorial({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <group>
      <group position={new THREE.Vector3(0, 3, -12)}>
        <mesh>
          <boxGeometry args={[7, 0.5, 0.2]} />
          <meshStandardMaterial color="#222" roughness={0.5} metalness={0.2} />
        </mesh>
        <group position={[0, 0.2, 0.05]}>
          <planeGeometry args={[6.2, 0.35]} />
          <meshBasicMaterial color="#222" />
        </group>
        <planeGeometry args={[6.0, 0.3]} />
        <meshBasicMaterial color="#111" opacity={0.8} />
      </group>
      <group position={new THREE.Vector3(0, 2.6, -12)}>
        <planeGeometry args={[6, 1.4]} />
        <meshBasicMaterial color="#1a1a2e" />
      </group>
      <group position={new THREE.Vector3(0, 2.6, -11.85)}>
        <planeGeometry args={[5.8, 1.3]} />
        <meshBasicMaterial color="#fff" />
      </group>
      <text3d
        font="/fonts/roboto.json"
        size={0.16}
        height={0.03}
        position={[0, 3.4, -11.8]}
      >
        <meshBasicMaterial color="#1a1a2e" />
      </text3d>
      <text3d
        font="/fonts/roboto.json"
        size={0.1}
        height={0.03}
        position={[-1.4, 3.0, -11.8]}
      >
        <meshBasicMaterial color="#555" />
      </text3d>
      <text3d
        font="/fonts/roboto.json"
        size={0.1}
        height={0.03}
        position={[1.4, 3.0, -11.8]}
      >
        <meshBasicMaterial color="#555" />
      </text3d>
      <text3d
        font="/fonts/roboto.json"
        size={0.12}
        height={0.03}
        position={[0, 2.7, -11.8]}
      >
        <meshBasicMaterial color="#222" />
      </text3d>
    </group>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function ThreeDPortfolio() {
  return <AshrafPortfolio3D />;
}

function AshrafPortfolio3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── State ────────────────────────────────────────────────────────────────
  const [soundOn, setSoundOn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(true);
  const [mobileControls, setMobileControls] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // ── Sound ────────────────────────────────────────────────────────────────
  const sound = useRef<SoundManager | null>(null);
  useEffect(() => {
    sound.current = new SoundManager();
    return () => { sound.current?.dispose(); };
  }, []);

  // ── Vehicle ──────────────────────────────────────────────────────────────
  const vehicle = useRef<VehicleController | null>(null);
  const [vehiclePos, setVehiclePos] = useState<THREE.Vector3>(new THREE.Vector3(0, 0.3, 0));
  const [vehicleRot, setVehicleRot] = useState<THREE.Euler>(new THREE.Euler(0, 0, 0));

  // ── World builder ────────────────────────────────────────────────────────
  const world = useRef<WorldBuilder | null>(null);

  // ── Physics ──────────────────────────────────────────────────────────────
  const physics = useRef<PhysicsWorld | null>(null);

  // ── Camera state (managed by CameraController) ───────────────────────────
  const [camPos, setCamPos] = useState<THREE.Vector3>(new THREE.Vector3(0, 8, 18));
  const [camTarget, setCamTarget] = useState<THREE.Vector3>(new THREE.Vector3(0, 0.3, 0));

  // ── Keyboard controls ────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!vehicle.current) return;
      switch (e.key) {
        case "w": vehicle.current.accelerate = true; break;
        case "s": vehicle.current.accelerate = false; break;
        case "a": vehicle.current.steer = -1; break;
        case "d": vehicle.current.steer = 1; break;
        case " ": vehicle.current.brake = true; break;
        case "Shift": vehicle.current.brake = false; break;
      }
      if (e.key === "e") {
        e.preventDefault();
        const targets = [
          new THREE.Vector3(0, 0.3, 0),     // About
          new THREE.Vector3(0, 0.3, 20),    // Skills
          new THREE.Vector3(20, 0.3, 0),    // Projects
          new THREE.Vector3(20, 0.3, 20),   // Design Work
          new THREE.Vector3(40, 0.3, 0),    // Services
          new THREE.Vector3(40, 0.3, 20),   // Contact
        ];
        const idx = targets.findIndex(t => t.distanceTo(vehicle.current.position) < 3);
        if (idx >= 0) {
          const t = targets[idx];
          setCamPos(new THREE.Vector3(t.x, 8 + (idx > 2 ? 3 : 0), t.z - 4));
          setCamTarget(new THREE.Vector3(t.x, 0.3, t.z));
          vehicle.current.teleport(t.clone());
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case "w": vehicle.current.accelerate = false; break;
        case "s": vehicle.current.accelerate = true; break;
        case "a": vehicle.current.steer = 0; break;
        case "d": vehicle.current.steer = 0; break;
        case " ": vehicle.current.brake = false; break;
        case "Shift": vehicle.current.brake = true; break;
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Touch controls ──────────────────────────────────────────────────────
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setMobileControls(isMobile);

    if (!isMobile) return;
    let touchID: number | null = null;
    let startX = 0, startY = 0;
    const move = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        vehicle.current?.turn(dx * 0.01);
        vehicle.current?.accelerate(dy * 0.01);
      }
    };
    const up = (e: TouchEvent) => {
      if (e.changedTouches) {
        const t = e.changedTouches[0];
        if (t.identifier === touchID) {
          touchID = null;
        }
      }
    };
    const start = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        touchID = touch.identifier;
        startX = touch.clientX;
        startY = touch.clientY;
      }
    };
    const holder = containerRef.current;
    holder?.addEventListener("touchstart", start);
    holder?.addEventListener("touchmove", move);
    holder?.addEventListener("touchend", up);
    return () => {
      holder?.removeEventListener("touchstart", start);
      holder?.removeEventListener("touchmove", move);
      holder?.removeEventListener("touchend", up);
    };
  }, []);

  // ── Rapier physics init ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      await PhysicsWorld.init();
      physics.current = new PhysicsWorld();
      await world.current?.build();
      setLoading(false);
    })();
  }, []);

  return (
    <div ref={containerRef} className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Loading screen */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a1a] z-50">
          <div className="text-center">
            <div className="text-6xl mb-4">🚗</div>
            <h1 className="text-3xl font-bold text-white mb-2">Ashraf 3D Portfolio</h1>
            <p className="text-gray-400">Loading interactive world...</p>
            <div className="mt-4 h-2 bg-gray-700 rounded-full w-48 mx-auto">
              <div className="h-full bg-blue-500 rounded-full animate-loading" />
            </div>
          </div>
        </div>
      )}

      {/* Canvas */}
      <Canvas
        ref={canvasRef}
        gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
        camera={{ position: [0, 8, 18], fov: 60 }}
        dpr={[1, 2]}
        onCreated={(c) => { c.renderer.setClearColor(0x0a0a1a); }}
      >
        <background color="#0a0a1a" />

        {/* Ambient light */}
        <ambientLight intensity={0.2} />
        {/* Directional light */}
        <directionalLight
          position={[0, 10, 5]}
          intensity={0.5}
          castShadow
          shadow-map-size={[1024, 1024]}
        />
        {/* Fog */}
        <fog args={[0x0a0a1a, 20, 120]} />

        {/* Camera controller — manages the camera position and target */}
        <CameraController
          camPos={camPos?.clone()}
          camTarget={camTarget?.clone()}
          vehiclePos={vehiclePos?.clone()}
        />

        {/* Orbit point */}
        <OrbitPoint target={camTarget}>
          <group position={[0, 0.3, 0]}>
            <mesh>
              <sphereGeometry args={[0.3, 12, 12]} />
              <meshBasicMaterial color="#f60" emissive="#f60" emissive-intensity={0.3} />
            </mesh>
          </group>
        </OrbitPoint>

        {/* Vehicle */}
        {vehiclePos && (
          <Vehicle
            position={vehiclePos}
            rotation={vehicleRot}
            speed={2.0}
            turn={0}
          />
        )}

        {/* World builder */}
        {world.current && <WorldBuilder />}

        {/* Markers - visible in stats mode */}
        {showStats && (
          <group>
            <group position={[0, 0.3, 0]}>
              <mesh>
                <sphereGeometry args={[0.2, 12, 12]} />
                <meshBasicMaterial color="#f60" emissive="#f60" emissive-intensity={0.4} />
              </mesh>
            </group>
            <group position={[0, 0.3, 20]}>
              <mesh>
                <sphereGeometry args={[0.2, 12, 12]} />
                <meshBasicMaterial color="#f60" emissive="#f60" emissive-intensity={0.4} />
              </mesh>
            </group>
            <group position={[20, 0.3, 0]}>
              <mesh>
                <sphereGeometry args={[0.2, 12, 12]} />
                <meshBasicMaterial color="#f60" emissive="#f60" emissive-intensity={0.4} />
              </mesh>
            </group>
            <group position={[20, 0.3, 20]}>
              <mesh>
                <sphereGeometry args={[0.2, 12, 12]} />
                <meshBasicMaterial color="#f60" emissive="#f60" emissive-intensity={0.4} />
              </mesh>
            </group>
            <group position={[40, 0.3, 0]}>
              <mesh>
                <sphereGeometry args={[0.2, 12, 12]} />
                <meshBasicMaterial color="#f60" emissive="#f60" emissive-intensity={0.4} />
              </mesh>
            </group>
            <group position={[40, 0.3, 20]}>
              <mesh>
                <sphereGeometry args={[0.2, 12, 12]} />
                <meshBasicMaterial color="#f60" emissive="#f60" emissive-intensity={0.4} />
              </mesh>
            </group>
          </group>
        )}

        {/* Environment lights */}
        <directionalLight
          position={[5, 15, 10]}
          intensity={0.4}
          castShadow
        />
        <hemisphereLight
          args={[0x87ceeb, 0x222244, 0.7]}
        />
      </Canvas>

      {/* HUD — Sound Toggle */}
      <div className="absolute top-6 right-6 z-30">
        <button
          onClick={() => {
            setSoundOn(!soundOn);
            sound.current?.toggle();
          }}
          className="p-3 rounded-lg bg-black/50 hover:bg-black/70 transition"
          title="Toggle sound"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.07-3.29-2.63-4.03v8.05c1.56-.74 2.63-2.26 2.63-4.02zM14 3.23v2.06c2.88.86 5 3.5 5 6.71s-2.12 5.85-5 6.71v2.06c4.01-.93 7-4.49 7-8.77s-2.99-7.84-7-8.77z" />
          </svg>
        </button>
      </div>

      {/* HUD — Fullscreen */}
      <div className="absolute top-6 right-24 z-30">
        <button
          onClick={() => {
            if (fullscreenElement) {
              document.exitFullscreen();
            } else {
              canvasRef.current?.requestFullscreen();
            }
          }}
          className="p-3 rounded-lg bg-black/50 hover:bg-black/70 transition"
          title="Toggle fullscreen"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
          </svg>
        </button>
      </div>

      {/* HUD — Sound Indicator */}
      <div className="absolute top-6 right-48 z-30">
        <div className={`p-3 rounded-lg ${soundOn ? "bg-black/70" : "bg-black/30"}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill={soundOn ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M3 9v6h4l5 5V4L7 9H3z" />
            {soundOn && <polygon points="12 4 15 9 21 9 15 14 12 19 9 14 3 9" />}
          </svg>
        </div>
      </div>

      {/* HUD — Mobile sound control */}
      <div className="absolute bottom-6 left-6 z-30 md:hidden">
        <button
          onClick={() => {
            setSoundOn(!soundOn);
            sound.current?.toggle();
          }}
          className="p-4 rounded-full bg-black/70 text-white hover:bg-black/90 transition"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.07-3.29-2.63-4.03v8.05c1.56-.74 2.63-2.26 2.63-4.02zM14 3.23v2.06c2.88.86 5 3.5 5 6.71s-2.12 5.85-5 6.71v2.06c4.01-.93 7-4.49 7-8.77s-2.99-7.84-7-8.77z" />
          </svg>
        </button>
      </div>

      {/* HUD — Stats toggle */}
      <div className="absolute bottom-6 right-6 z-30">
        <button
          onClick={() => setShowStats(!showStats)}
          className="p-3 rounded-lg bg-black/50 hover:bg-black/70 transition"
          title="Toggle stats overlay"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <line x1="9" y1="9" x2="15" y2="15" />
            <line x1="15" y1="9" x2="9" y2="15" />
          </svg>
        </button>
      </div>

      {/* Info Panel */}
      <div className="absolute bottom-6 left-6 z-30 max-w-sm">
        <div className="bg-black/80 text-white rounded-xl p-4 text-sm max-h-40 overflow-y-auto">
          <div className="text-xs text-gray-400 mb-1">WASD / Arrow Keys - Drive</div>
          <div className="text-xs text-gray-400 mb-1">Space - Brake</div>
          <div className="text-xs text-gray-400 mb-1">E - Interact / Teleport</div>
          <div className="text-xs text-gray-400 mb-1">Touch drag - control vehicle</div>
          <div className="text-xs text-gray-400 mb-1">Click markers on buildings</div>
          <div className="text-xs text-gray-400 mb-2">Press ESC to close overlays</div>
        </div>
      </div>

      {/* Tutorial overlay */}
      {showTutorial && mobileControls && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="text-center p-6 rounded-xl bg-white/10 border border-white/20">
            <div className="text-4xl mb-3">🚗</div>
            <h2 className="text-xl font-bold text-white mb-2">Welcome to the 3D World</h2>
            <p className="text-gray-300 mb-4">
              Drive your vehicle with WASD keys or touch drag. Press <span className="text-white font-mono">E</span> to teleport to areas. Press <span className="text-white font-mono">ESC</span> to close this tutorial.
            </p>
            <button
              onClick={() => setShowTutorial(false)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* Interaction hint */}
      <div className="absolute bottom-6 right-6 z-30 text-white/60 text-xs">
        Click any marker to visit
      </div>
    </div>
  );
}
