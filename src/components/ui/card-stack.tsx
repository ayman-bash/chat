"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { GlowingEffect } from "./GlowingEffect";
import { StarRating } from "./star-rating";

let interval: any;

type Card = {
  id: number;
  name: string;
  designation: string;
  content: React.ReactNode;
  rating?: number; // Ajout du champ rating
};

export const CardStack = ({
  items,
  offset,
  scaleFactor,
}: {
  items: Card[];
  offset?: number;
  scaleFactor?: number;
}) => {
  const CARD_OFFSET = offset || 10;
  const SCALE_FACTOR = scaleFactor || 0.06;
  const [cards, setCards] = useState<Card[]>(items);
  
  // Generate unique IDs for each card position that won't change during re-renders
  const cardPositionIds = useRef<string[]>(
    Array.from({ length: items.length }, (_, i) => `card-pos-${i}-${Date.now()}`)
  );

  useEffect(() => {
    startFlipping();

    return () => clearInterval(interval);
  }, [items]); // Ensure the effect runs when `items` changes

  const startFlipping = () => {
    interval = setInterval(() => {
      setCards((prevCards: Card[]) => {
        const newArray = [...prevCards]; // create a copy of the array
        newArray.unshift(newArray.pop()!); // move the last element to the front
        return newArray;
      });
    }, 5000);
  };

  return (
    <div className="relative h-60 w-60 md:h-60 md:w-96">
      {cards.map((card, index) => {
        // Validate card properties and ensure valid data
        if (!card || !card.content || !card.name) {
          return null; // Skip invalid cards
        }

        // Générer une note aléatoire entre 3 et 5 si elle n'est pas définie
        const rating = card.rating || Math.floor(Math.random() * 3) + 3;

        return (
          <motion.div
            key={`${cardPositionIds.current[index]}-${card.id}`} // Combine position ID with card ID for a truly unique key
            className="absolute dark:bg-black bg-white h-60 w-60 md:h-60 md:w-96 rounded-3xl p-4 shadow-xl border border-neutral-200 dark:border-white/[0.1] shadow-black/[0.1] dark:shadow-white/[0.05] flex flex-col justify-between group"
            style={{
              transformOrigin: "top center",
            }}
            animate={{
              top: index * -CARD_OFFSET,
              scale: 1 - index * SCALE_FACTOR, // decrease scale for cards that are behind
              zIndex: cards.length - index, // decrease z-index for the cards that are behind
            }}
            transition={{
              duration: 0.7, // Adding the smooth animation duration
              ease: "easeInOut", // Adding smooth easing
            }}
          >
            <GlowingEffect
              blur={10}
              proximity={50}
              spread={20}
              glow={true}
              className="z-[-1] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
            <div className="font-normal text-neutral-700 dark:text-neutral-200">
              {card.content}
            </div>
            <div>
              <p className="text-neutral-500 font-medium dark:text-white">
                {card.name}
              </p>
              <div className="flex justify-between items-center mt-1">
                <p className="text-neutral-400 font-normal dark:text-neutral-200">
                  {card.designation}
                </p>
                <StarRating rating={rating} size="sm" color="#FFD700" />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
