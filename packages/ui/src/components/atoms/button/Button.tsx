"use client";

import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
}

export const Button = ({ children }: ButtonProps) => {
  return (
    <button
      onClick={() => alert(`Hello World!`)}
    >
      {children}
    </button>
  );
};
