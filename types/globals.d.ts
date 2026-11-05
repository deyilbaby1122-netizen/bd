/// <reference types="next" />
/// <reference types="next/image-types/global" />

// Fix JSX namespace for @react-three/fiber
import "@react-three/fiber"
import type { JSX as ThreeJSX } from "three"
import { JSX as R3FJSX } from "@react-three/fiber"

// Augment the global JSX namespace to use @react-three/fiber types
declare module "react" {
  // @ts-ignore
  interface JSX {
    // @ts-ignore
    _owner: any;
    // @ts-ignore
    _store: any;
  }
}
