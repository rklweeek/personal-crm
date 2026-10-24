"use client";

import { useOptimistic, useState, useTransition } from "react";

import { setContactFrequency } from "@/app/actions";
import { Slider } from "@/components/ui/slider";
import {
  frequencyToPosition,
  positionToFrequency,
  SLIDER_LABELS,
  type ContactFrequency,
} from "@/lib/keep-in-touch";
import { cn } from "@/lib/utils";

type ContactFrequencySliderProps = {
  contactId: number;
  frequency: ContactFrequency | null;
};

const LAST_POSITION = SLIDER_LABELS.length - 1;

export function ContactFrequencySlider({ contactId, frequency }: ContactFrequencySliderProps) {
  const [position, setPosition] = useOptimistic(frequencyToPosition(frequency));
  // Where the thumb is while it is being dragged, before the choice is saved.
  const [dragPosition, setDragPosition] = useState<number | null>(null);
  const [error, setError] = useState<string>();
  const [, startTransition] = useTransition();

  const shown = dragPosition ?? position;

  function save(next: number) {
    setDragPosition(null);
    if (next === position) return;
    setError(undefined);
    startTransition(async () => {
      setPosition(next);
      const result = await setContactFrequency(contactId, positionToFrequency(next));
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="px-2">
        <Slider
          min={0}
          max={LAST_POSITION}
          step={1}
          value={shown}
          onValueChange={(value) => setDragPosition(value as number)}
          onValueCommitted={(value) => save(value as number)}
          thumbProps={{
            "aria-label": "Как часто общаться",
            getAriaValueText: (_formatted, value) => SLIDER_LABELS[value],
          }}
        />
        <div className="relative mt-3 h-9 text-sm sm:h-5" aria-hidden>
          {SLIDER_LABELS.map((label, index) => (
            <span
              key={label}
              className={cn(
                "absolute top-0 text-center text-subtle",
                index === 0 ? "w-min sm:w-max" : "w-max",
                index === shown && "font-semibold text-foreground",
                index === 0 && "text-left",
                index === LAST_POSITION && "text-right",
              )}
              style={{
                left: `${(index / LAST_POSITION) * 100}%`,
                transform: `translateX(-${index === 0 ? 0 : index === LAST_POSITION ? 100 : 50}%)`,
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
