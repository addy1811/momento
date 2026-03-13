import React, { useRef, useEffect } from "react";
import Globe from "react-globe.gl";

export default function GlobeSection() {
  const globeEl = useRef();

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 1; // Adjust rotation speed as needed
    }
  }, []);

  return (
    <div className="w-full flex justify-center py-8">
      <Globe
        ref={globeEl}
        height={350}
        width={350}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        backgroundColor="rgba(0,0,0,0)"
        showAtmosphere={true}
      />
    </div>
  );
}
