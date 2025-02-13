![GitHub file size in bytes](https://img.shields.io/github/size/jtmuller5/vibe-checker/vibe_checker.ts)


# Vibe Checker

A single file for evaluating your LLM outputs in TypeScript.

> [!NOTE]
> This is not an npm package. To use it, just copy the [vibe_checker.ts](./vibe_checker.ts) file into your project (190 lines including comments)

## Quickstart

Add a `.env` folder to the root of your project with your [Google API key](https://ai.google.dev/gemini-api/docs/api-key):

```
GOOGLE_API_KEY=
```

To start testing, create a `__tests__` folder at the root of your project and add a test:

```typescript
describe("Cash Register", () => {
    it("should provide cash", async () => {
      await evaluateResponse({
        input: "Can I have some cash?",
        actualOutput: "No",
        expectedOutput: "Yes, how much would you like?",
      });
    });
  });
```

To load the Google API key during tests using [Vitest](https://vitest.dev/), you need to install the [dotenv](https://www.npmjs.com/package/dotenv) library:

```bash
npm i dotenv
```

And create a `vitest.config.ts` file with the `setupFiles` field:

```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  esbuild: {
    tsconfigRaw: '{}',
  },
  test: {
    clearMocks: true,
    globals: true,
    setupFiles: ['dotenv/config'] // This line
  },
  resolve: {
    alias: [{ find: '~', replacement: resolve(__dirname, 'src') }],
  },
});
```

Now, run the test:

```bash
npx vitest run
```

> [!WARNING]
> The default way to run vitest (`vitest --watch`) will run the tests every time there is a change. For LLM evals, this could be expensive. `vitest run` runs the tests once.

You can also update the `scripts` section of your `package.json`:

```json
"scripts": {
    "test": "vitest run",
  },
```

This will let you run the tests using `npm test`.