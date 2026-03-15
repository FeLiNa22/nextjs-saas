# GitHub Copilot Instructions

## Package Manager

This project uses **[Bun](https://bun.sh)** as the package manager. Always use `bun` instead of `npm`, `yarn`, or `pnpm` for any package management or script execution.

```bash
bun install          # Install dependencies
bun dev              # Start development server (with Turbopack)
bun build            # Build for production (with Turbopack)
bun start            # Start production server
bun lint             # Run ESLint
bun db:generate      # Generate Drizzle ORM migrations
bun db:migrate       # Push schema changes to the database
bun db:studio        # Open Drizzle Studio
```

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | React 19 |
| Styling | Tailwind CSS v4 |
| UI Components | Radix UI + shadcn/ui (`components.json`) |
| Icons | Lucide React |
| Authentication | Better Auth |
| Database ORM | Drizzle ORM (PostgreSQL dialect) |
| Forms | React Hook Form + Zod |
| Notifications | Sonner |
| Theming | next-themes |
| Build tool | Turbopack (via Next.js) |

## Repository Structure

```
/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (routes)/               # Route groups
│   │   │   ├── (auth)/             # Auth pages (sign-in, sign-up, etc.)
│   │   │   └── (home)/             # Main app pages
│   │   ├── api/
│   │   │   └── auth/               # Better Auth API route handler
│   │   ├── layout.tsx              # Root layout
│   │   └── globals.css             # Global styles (Tailwind)
│   ├── components/
│   │   └── ui/                     # shadcn/ui components
│   ├── db/
│   │   ├── index.ts                # Drizzle database client
│   │   └── schema/                 # Drizzle table schemas
│   │       ├── auth.ts             # Auth-related tables
│   │       └── index.ts            # Schema barrel export
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── server.ts           # Better Auth server instance
│   │   │   ├── client.ts           # Better Auth client instance
│   │   │   ├── get-session.ts      # Server-side session helper
│   │   │   ├── password.ts         # Password utilities
│   │   │   └── usernames.ts        # Username utilities
│   │   └── utils.ts                # General utilities (cn helper)
│   ├── providers/                  # React context providers
│   ├── routes.ts                   # Centralized route constants
│   └── proxy.ts                    # API proxy utilities
├── drizzle.config.ts               # Drizzle Kit configuration
├── next.config.ts                  # Next.js configuration
├── components.json                 # shadcn/ui configuration
├── tsconfig.json                   # TypeScript configuration
├── .eslintrc.json                  # ESLint configuration
└── .prettierrc.json                # Prettier configuration (with tailwindcss plugin)
```

## Conventions

### Path Aliases
Use the `@/*` alias (maps to `./src/*`) for all internal imports:
```ts
import { cn } from "@/lib/utils";
import { auth } from "@/lib/auth/server";
```

### Styling
- Use **Tailwind CSS utility classes** for all styling.
- Use the `cn()` helper from `@/lib/utils` to merge conditional classes:
  ```ts
  import { cn } from "@/lib/utils";
  <div className={cn("base-class", condition && "conditional-class")} />
  ```
- Prettier with `prettier-plugin-tailwindcss` is configured to auto-sort class names.

### UI Components
- Add new shadcn/ui components via: `bunx --bun shadcn@latest add <component>`
- All generated components live in `src/components/ui/`.

### Database
- Define table schemas in `src/db/schema/` and export them from `src/db/schema/index.ts`.
- The database client is exported from `src/db/index.ts`.
- Use `DIRECT_URL` environment variable for the PostgreSQL connection string.
- After changing the schema, run `bun db:generate` then `bun db:migrate`.

### Authentication
- Server-side auth instance: `@/lib/auth/server`
- Client-side auth instance: `@/lib/auth/client`
- Session retrieval (server components/actions): `@/lib/auth/get-session`
- The Better Auth API handler is mounted at `/api/auth/[...all]`.

### Environment Variables
Copy `env.example` to `.env` and fill in the required values. The key variables are:
- `DIRECT_URL` — PostgreSQL direct connection URL (used by Drizzle)
- Any variables required by Better Auth

### Forms

All forms **must** follow these conventions:

- **Client-side forms** must use [`react-hook-form`](https://react-hook-form.com/) with `zodResolver` from `@hookform/resolvers/zod`.
- **Server Action forms** may alternatively use `useActionState` from `react` paired with Zod validation inside the action.
- **Zod** (from the `zod` package) is required for all schema validation — no ad-hoc or manual validation logic.
- Place each form's Zod schema and inferred types in a co-located `validate.ts` file in the same directory as the form.

**Pattern (react-hook-form):**
```tsx
// validate.ts
import { z } from "zod";

export const MyFormSchema = z.object({
  field: z.string().min(1, { message: "Field is required" }),
});

export type MyFormValues = z.infer<typeof MyFormSchema>;
```

```tsx
// form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { MyFormSchema, MyFormValues } from "./validate";

export default function MyForm() {
  const form = useForm<MyFormValues>({
    resolver: zodResolver(MyFormSchema),
    defaultValues: { field: "" },
  });

  function onSubmit(data: MyFormValues) {
    // handle submission
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="field"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
```

**Pattern (useActionState):**
```tsx
// action.ts
"use server";
import { z } from "zod";
import { MyFormSchema } from "./validate";

export async function myAction(_prev: unknown, formData: FormData) {
  const result = MyFormSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) return { errors: result.error.flatten().fieldErrors };
  // proceed with result.data
}
```

```tsx
// form.tsx
"use client";
import { useActionState } from "react";
import { myAction } from "./action";

export default function MyForm() {
  const [state, action, isPending] = useActionState(myAction, null);
  return (
    <form action={action}>
      <input name="field" />
      {state?.errors?.field && <p>{state.errors.field[0]}</p>}
      <button type="submit" disabled={isPending}>Submit</button>
    </form>
  );
}
```

### TypeScript
- Strict mode is enabled.
- Prefer explicit types; avoid `any`.
- Use Zod schemas (from `zod`) for runtime validation and type inference.
