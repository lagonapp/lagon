import createGlobe from 'cobe';
import { useEffect, useRef } from 'react';

// const random = (min, max) => Math.random() * (max - min) + min;

const Globe = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    let phi = 0;
    let renders = 0;
    let width = 0;
    let height = 0;

    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth;
        height = canvasRef.current.offsetHeight;
      }
    };

    window.addEventListener('resize', onResize);
    onResize();

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: height,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 2,
      mapSamples: 20000,
      mapBrightness: 6,
      baseColor: [0.2, 0.2, 0.2],
      markerColor: [0.65, 0.33, 0.95],
      // glowColor: [0.8, 0.8, 0.8],
      glowColor: [0.57, 0.77, 0.99],
      markers: [],
      scale: 6,
      offset: [0, height / 2],
      onRender: state => {
        state.phi = phi;
        phi += 0.001;

        state.width = width * 2;
        state.height = height;

        if (renders === 0) {
          // state.markers = [
          //   { location: [random(0, 60), random(-180, 180)], size: Math.random() / 10 },
          //   { location: [random(0, 60), random(-180, 180)], size: Math.random() / 10 },
          //   { location: [random(0, 60), random(-180, 180)], size: Math.random() / 10 },
          //   { location: [random(0, 60), random(-180, 180)], size: Math.random() / 10 },
          //   { location: [random(0, 60), random(-180, 180)], size: Math.random() / 10 },
          // ];
        }

        renders += 1;

        if (renders >= 200) {
          renders = 0;
        }
      },
    });

    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.style.opacity = '1';
      }
    });

    return () => {
      globe.destroy();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      className="absolute bottom-0"
      ref={canvasRef}
      style={{
        width: '100%',
        height: '60%',
        opacity: 0,
        transition: 'opacity 1s ease',
      }}
    />
  );
};

export default Globe;
