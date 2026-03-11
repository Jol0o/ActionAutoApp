"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

export function CinematicPane() {
    return (
        <div className="relative w-full h-full overflow-hidden bg-black select-none">
            {/* Cinematic Background Image */}
            <motion.div
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute inset-0 z-0"
            >
                <Image
                    src="/camaro.png" // User: You'll need to move the generated image here or I will provide a placeholder logic
                    alt="Cinematic Corvette"
                    fill
                    className="object-cover object-center"
                    priority
                    quality={100}
                />
            </motion.div>
        </div>
    );
}
