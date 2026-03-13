"use client";

import React, { useState } from "react";

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
}

export default function ImageWithFallback({ src, alt, className, fallback, ...rest }: Props) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gray-50 ${className ?? ""}`}>
        {fallback ?? <div className="text-gray-300">No image</div>}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src as string}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
      {...rest}
    />
  );
}
