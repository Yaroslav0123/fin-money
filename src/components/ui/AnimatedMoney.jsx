import { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';
import { formatMoney } from '../../utils/format.js';

const DURATION = 0.6;

/**
 * Сумма, которая плавно «докручивается» до нового значения: после импорта выписки,
 * смены периода или новой операции. При первом показе — сразу итоговое число, без анимации.
 * При системной настройке «уменьшить движение» число меняется мгновенно.
 * value — сумма в копейках; format — как показать (по умолчанию formatMoney).
 */
export default function AnimatedMoney({ value, format = formatMoney }) {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(value);
  // Откуда начинать следующую анимацию: текущее показанное значение, даже если прошлая не закончилась
  const currentRef = useRef(value);

  useEffect(() => {
    if (reduceMotion || currentRef.current === value) {
      currentRef.current = value;
      setShown(value);
      return undefined;
    }
    const controls = animate(currentRef.current, value, {
      duration: DURATION,
      ease: 'easeOut',
      onUpdate: (latest) => {
        currentRef.current = latest;
        setShown(Math.round(latest));
      },
    });
    return () => controls.stop();
  }, [value, reduceMotion]);

  return format(shown);
}
