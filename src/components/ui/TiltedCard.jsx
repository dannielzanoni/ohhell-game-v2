import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import './TiltedCard.css';

const springValues = {
  damping: 30,
  mass: 2,
  stiffness: 100,
};

export default function TiltedCard({
  altText = 'Tilted card image',
  captionText = '',
  containerHeight = '300px',
  containerWidth = '100%',
  displayOverlayContent = false,
  imageHeight = '300px',
  imageSrc,
  imageWidth = '300px',
  overlayContent = null,
  rotateAmplitude = 14,
  scaleOnHover = 1.1,
  showMobileWarning = true,
  showTooltip = true,
}) {
  const ref = useRef(null);
  const x = useMotionValue();
  const y = useMotionValue();
  const rotateX = useSpring(useMotionValue(0), springValues);
  const rotateY = useSpring(useMotionValue(0), springValues);
  const scale = useSpring(1, springValues);
  const opacity = useSpring(0);
  const rotateFigcaption = useSpring(0, {
    damping: 30,
    mass: 1,
    stiffness: 350,
  });
  const [lastY, setLastY] = useState(0);

  function handleMouse(event) {
    if (!ref.current) {
      return;
    }

    const rect = ref.current.getBoundingClientRect();
    const offsetX = event.clientX - rect.left - rect.width / 2;
    const offsetY = event.clientY - rect.top - rect.height / 2;
    const rotationX = (offsetY / (rect.height / 2)) * -rotateAmplitude;
    const rotationY = (offsetX / (rect.width / 2)) * rotateAmplitude;

    rotateX.set(rotationX);
    rotateY.set(rotationY);
    x.set(event.clientX - rect.left);
    y.set(event.clientY - rect.top);

    rotateFigcaption.set(-(offsetY - lastY) * 0.6);
    setLastY(offsetY);
  }

  function handleMouseEnter() {
    scale.set(scaleOnHover);
    opacity.set(1);
  }

  function handleMouseLeave() {
    opacity.set(0);
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
    rotateFigcaption.set(0);
  }

  return (
    <figure
      ref={ref}
      className="tilted-card-figure"
      style={{
        height: containerHeight,
        width: containerWidth,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouse}
    >
      {showMobileWarning ? (
        <div className="tilted-card-mobile-alert">
          This effect is not optimized for mobile. Check on desktop.
        </div>
      ) : null}

      <motion.div
        className="tilted-card-inner"
        style={{
          height: imageHeight,
          rotateX,
          rotateY,
          scale,
          width: imageWidth,
        }}
      >
        <motion.img
          src={imageSrc}
          alt={altText}
          className="tilted-card-img"
          draggable="false"
          style={{
            height: imageHeight,
            width: imageWidth,
          }}
        />

        {displayOverlayContent && overlayContent ? (
          <motion.div className="tilted-card-overlay">
            {overlayContent}
          </motion.div>
        ) : null}
      </motion.div>

      {showTooltip ? (
        <motion.figcaption
          className="tilted-card-caption"
          style={{
            opacity,
            rotate: rotateFigcaption,
            x,
            y,
          }}
        >
          {captionText}
        </motion.figcaption>
      ) : null}
    </figure>
  );
}
