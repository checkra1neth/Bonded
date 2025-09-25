import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import "@testing-library/jest-dom/vitest";

import { ErrorHandlingProvider } from "../ErrorHandlingProvider";
import { useErrorHandling } from "../../hooks/useErrorHandling";

vi.mock("../errorHandling.module.css", () => ({
  default: new Proxy(
    {},
    {
      get: (_target, prop: string) => prop,
    },
  ),
}));

describe("ErrorHandlingProvider", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("exposes captureError and renders user-facing messages", async () => {
    function Trigger() {
      const { captureError } = useErrorHandling();
      return (
        <button
          type="button"
          onClick={() =>
            captureError(new Error("boom"), {
              userFacing: {
                title: "Authentication failed",
                description: "Please connect your wallet again.",
              },
            })
          }
        >
          trigger
        </button>
      );
    }

    render(
      <ErrorHandlingProvider>
        <Trigger />
      </ErrorHandlingProvider>,
    );

    fireEvent.click(screen.getByText("trigger"));

    expect(
      await screen.findByText("Authentication failed"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Please connect your wallet again."),
    ).toBeInTheDocument();
  });

  it("indicates offline mode when navigator reports offline", async () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      window.navigator,
      "onLine",
    );

    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      get: () => false,
    });

    render(
      <ErrorHandlingProvider>
        <div>child</div>
      </ErrorHandlingProvider>,
    );

    expect(
      await screen.findByText(/Offline mode enabled/i),
    ).toBeInTheDocument();

    if (originalDescriptor) {
      Object.defineProperty(window.navigator, "onLine", originalDescriptor);
    } else {
      Object.defineProperty(window.navigator, "onLine", {
        configurable: true,
        value: true,
        writable: false,
      });
    }
  });

  it("shows fallback UI when a child throws", async () => {
    const Boom: React.FC = () => {
      throw new Error("explode");
    };

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    render(
      <ErrorHandlingProvider>
        <Boom />
      </ErrorHandlingProvider>,
    );

    expect(
      await screen.findByText(/Something went wrong/i),
    ).toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
