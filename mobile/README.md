# AuthFlow

A modern, production-style **mobile authentication flow** built with:

- **Expo (SDK 54) + React Native 0.81**
- **TypeScript** (strict mode)
- **NativeWind v4** (Tailwind CSS for React Native)
- **Expo Router v6** (file-based routing)
- **React Hook Form + Zod** for type-safe validation

It ships with polished Login and Signup screens, a small set of reusable
UI primitives, keyboard-avoiding layouts, dark/light theming, loading
and disabled states, and inline form errors.

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm start

# Or jump straight onto a platform
npm run ios       # iOS simulator (macOS only)
npm run android   # Android emulator / device
npm run web       # Web (react-native-web)
```

The first run with `npm start` uses `expo start -c` to clear the Metro
cache, which is important after any change to `tailwind.config.js`,
`babel.config.js`, or `metro.config.js`.

Open the dev tools and scan the QR code with the **Expo Go** app
(or your dev client) to launch on a physical device.

---

## Scripts

| Script              | Description                                    |
| ------------------- | ---------------------------------------------- |
| `npm start`         | Start Expo dev server with cleared cache       |
| `npm run ios`       | Open in iOS simulator                          |
| `npm run android`   | Open in Android emulator                       |
| `npm run web`       | Open in browser via react-native-web           |
| `npm run lint`      | Run ESLint (Expo flat config)                  |
| `npm run typecheck` | Run `tsc --noEmit` to verify TypeScript types  |

---

## Project structure

```
AuthFlow/
├── app/                         # Expo Router file-based routes
│   ├── _layout.tsx              # Root layout (providers + Stack)
│   ├── index.tsx                # Redirects to /login
│   ├── login.tsx                # Login route wrapper
│   └── signup.tsx               # Signup route wrapper
├── global.css                   # Tailwind directives consumed by NativeWind
├── tailwind.config.js           # Theme tokens (brand colors, radii)
├── babel.config.js              # babel-preset-expo + nativewind/babel
├── metro.config.js              # withNativeWind wrapper
├── nativewind-env.d.ts          # className prop typings for RN elements
├── tsconfig.json                # Strict TS + `@/*` -> `src/*` path alias
├── app.json                     # Expo app config
└── src/
    ├── components/
    │   ├── ui/                  # Generic primitives (Button, Input)
    │   ├── forms/               # RHF-aware composites (FormField)
    │   ├── auth/                # Feature-specific UI (AuthHeader)
    │   ├── layout/              # Page-level shells (ScreenContainer)
    │   └── index.ts             # Barrel export for ergonomic imports
    ├── screens/
    │   ├── LoginScreen.tsx
    │   └── SignupScreen.tsx
    ├── schemas/
    │   └── auth.schema.ts       # Zod schemas + inferred form types
    ├── hooks/
    │   ├── useColorScheme.ts    # Returns "light" | "dark" (never null)
    │   └── useAuthSubmit.ts     # Loading/error wrapper for submit handlers
    └── utils/
        └── cn.ts                # Tiny class-name joiner
```

The path alias `@/*` resolves to `src/*` so imports stay short:

```ts
import { Button, FormField, ScreenContainer } from "@/components";
import { loginSchema } from "@/schemas/auth.schema";
```

---

## NativeWind configuration

NativeWind v4 needs **four** pieces to be wired correctly. They are all
already configured in this repo — this section explains _what_ each one
does so you can extend the setup safely.

### 1. `babel.config.js`

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

`jsxImportSource: "nativewind"` is what enables the `className` prop on
core React Native components (`View`, `Text`, `Pressable`, ...).

### 2. `metro.config.js`

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: "./global.css" });
```

Tells Metro to compile the Tailwind stylesheet and inject the resulting
classes into the JS bundle.

### 3. `tailwind.config.js`

Lives next to the project root. The `content` array must include any
file that uses NativeWind classes:

```js
content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
presets: [require("nativewind/preset")],
darkMode: "class",
```

Tokens (brand palette, surface colors, radii) live in `theme.extend`.

### 4. `global.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Imported once from `app/_layout.tsx`:

```ts
import "./global.css";
```

### TypeScript support

`nativewind-env.d.ts` adds the `className` prop to React Native's built-in
component types so TS doesn't complain when you write
`<View className="flex-1" />`.

---

## Form validation (React Hook Form + Zod)

All validation lives in one place: `src/schemas/auth.schema.ts`.

```ts
const emailField = z.string().trim().min(1, "Email is required")
  .email("Enter a valid email address");

const passwordField = z.string().min(8, "Password must be at least 8 characters")
  .max(64, "Password is too long");

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type SignupFormValues = z.infer<typeof signupSchema>;
```

Screens then wire the schema to RHF in one line:

```ts
const { control, handleSubmit, formState } = useForm<SignupFormValues>({
  resolver: zodResolver(signupSchema),
  mode: "onTouched",
});
```

`<FormField>` is the glue — it pairs `<Controller>` with the themed
`<Input>` and renders an inline error message automatically.

---

## Reusable components

| Component         | Purpose                                                                 |
| ----------------- | ----------------------------------------------------------------------- |
| `Button`          | Primary / secondary / ghost variants, sizes, loading + disabled states  |
| `Input`           | Themed text input with focus ring, error border, and optional right slot |
| `FormField`       | `Controller` + `Input` + label + inline error, fully typed by RHF       |
| `AuthHeader`      | Branded title + subtitle pair used at the top of auth screens           |
| `ScreenContainer` | SafeArea + StatusBar + `KeyboardAvoidingView` + `ScrollView` wrapper    |

Each is small, composable, and meant to be copied as a starting point
for additional screens (e.g., `ForgotPasswordScreen`, `ResetPasswordScreen`).

---

## Navigation

Routing is handled by **Expo Router** via the `app/` directory:

- `app/login.tsx` renders `LoginScreen`
- `app/signup.tsx` renders `SignupScreen`
- `app/index.tsx` redirects to `/login`
- `app/_layout.tsx` defines the root `Stack` options

To add a screen:

1. Create `src/screens/MyScreen.tsx`.
2. Create a corresponding route file in `app/` (e.g., `app/forgot-password.tsx`).
3. Use `router.push("../forgot-password")` or `<Link href="/forgot-password" />` from other screens.

---

## Connecting a real backend

`useAuthSubmit` is intentionally backend-agnostic. Replace the simulated
`setTimeout` inside each screen with your real call:

```ts
const { submit, isSubmitting, submitError } = useAuthSubmit(async (values) => {
  const res = await fetch("https://api.example.com/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  if (!res.ok) throw new Error("Invalid credentials");
  const { token } = await res.json();
  // persist token (SecureStore / Async Storage / Zustand / Redux ...)
});
```

The hook gives you `isSubmitting` for spinners + disabled buttons,
plus `submitError` for top-of-form error messages. Throwing from your
handler is enough to populate it.

---

## Best practices baked in

- **Strict TypeScript** with a single `@/*` path alias.
- **One schema, one source of truth** — `z.infer` derives the form type.
- **Separation of concerns**: validation (`schemas/`), state (`hooks/`),
  presentation (`components/`), route files (`app/`), and screen views
  (`screens/`) all live in dedicated folders.
- **Composable UI primitives** — every screen reuses the same `Button`,
  `Input`, and `ScreenContainer`, guaranteeing visual consistency.
- **Keyboard-friendly forms** — `KeyboardAvoidingView`, `ScrollView` with
  `keyboardShouldPersistTaps="handled"`, and `returnKeyType` chained
  across inputs.
- **Accessible by default** — buttons expose `accessibilityRole` and
  `accessibilityState`, password fields announce their visibility.
- **Dark mode out of the box** — driven by the OS color scheme via
  `useColorScheme` and applied to NativeWind classes (`dark:...`).

---

## Troubleshooting

- **Classes not applying?** Restart Metro with cache cleared:
  `npx expo start -c`.
- **`Cannot find module '@/...'` in your editor?** Restart the TS server
  so it re-reads `tsconfig.json` paths.
- **Type errors after upgrading RN/Expo?** Run `npm run typecheck` and
  fix any prop-type drift — the strict `tsconfig` will surface them
  immediately.

---

Happy shipping.
