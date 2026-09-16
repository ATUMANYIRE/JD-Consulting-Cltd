import { useLayoutEffect, useRef } from "react";

export default function Shadowed({ children, cast = true, receive = true, ...props }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    ref.current.traverse((object) => {
      if (object.isMesh || object.isInstancedMesh) {
        object.castShadow = cast;
        object.receiveShadow = receive;
      }
    });
  });

  return (
    <group ref={ref} {...props}>
      {children}
    </group>
  );
}
