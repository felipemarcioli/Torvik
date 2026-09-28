import type { Exercise } from "./data";

/** Shared preview mapping, including reduced motion and unavailable-asset fallback. */
export function ExercisePreview({ exercise, animated }: { exercise: Exercise; animated: boolean }) {
  const fallback = "/torvik-image-3d-180.webp";
  const still = exercise.previewAvailable === false ? fallback : exercise.previewStill;
  return (
    <picture>
      <source media="(prefers-reduced-motion: reduce)" srcSet={still} />
      <img
        src={
          exercise.previewAvailable === false
            ? fallback
            : animated
              ? exercise.previewAnimation
              : still
        }
        width="256"
        height="256"
        alt=""
        aria-hidden="true"
        className="exercise-preview-animation"
      />
    </picture>
  );
}
