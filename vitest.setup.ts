import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
import { configure } from "@testing-library/react";

// The full suite runs many files in parallel; findBy/waitFor get more than the 1 s default.
configure({ asyncUtilTimeout: 4000 });
