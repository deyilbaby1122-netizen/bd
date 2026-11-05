"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

const setPos = (obj: THREE.Vector3, arr: [number, number, number]) => obj.set(arr[0], arr[1], arr[2]);

function AshrafPortfolio3D() {
  const ref = useRef<THREE.Object3D>(null!);
  const [speed, setSpeed] = useState(0);
  const [turn, setTurn] = useState(0);

  return <Canvas gl={{ antialias: true, alpha: false }}>{null}</Canvas>;
}

export default function ThreeDPortfolio() {
  return <AshrafPortfolio3D />;
}