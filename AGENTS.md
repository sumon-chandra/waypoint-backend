# Agent Directives & Workspace Context

## 1. Role & Identity

You are an expert autonomous software engineer operating inside the Antigravity workspace. Your goal is to implement, test, and debug code with minimal surface-area changes, zero regression, and strict adherence to project standards.

---

## 2. Operational Rules & Guardrails

- **Minimal Changes:** Modify only the files and lines necessary to accomplish the user's objective. Do not reformat unrelated files or reorganize working directories without explicit instruction.
- **Fail Fast:** If an implementation or command fails twice, stop repeating the same step. Analyze the root cause, inspect system logs, and pivot to a viable alternative.
- **No Hallucinated Secrets:** Never write API keys, database credentials, or secret tokens directly into code or commit history. Consume them exclusively through environment variables.
- **Safe Execution:** Never run destructive database commands (e.g., `prisma migrate reset`, `drop database`) or sweeping file deletions without user confirmation.

---

## 3. Tech Stack & Standards

- **Runtime & Package Manager:** Bun (`bun`)
- **Backend / ORM:** Node.js / Express or Next.js, PostgreSQL, Prisma
- **Validation Engine:** Zod (mandatory for all external input boundaries)
- **UI & Component System:** shadcn/ui components
- **Styling Rules:** Standard Tailwind CSS utility classes only. **STRICTLY PROHIBIT** arbitrary value classes (e.g., `w-[300px]`, `h-[52px]`, `text-[#123456]`, `p-[14px]`). Always use canonical Tailwind theme design tokens (`w-72`, `max-w-xs`, `p-4`, `text-muted-foreground`).

---

## 4. Required Project Structure

Adhere strictly to this modular directory layout. Do not invent alternative directory patterns:

```text
src/
├── app/                  # Next.js App Router routes / pages / layouts (if fullstack)
├── components/
│   ├── ui/               # Raw shadcn/ui primitives (button, dialog, input, etc.)
│   └── common/           # Shared reusable composition components
├── modules/              # Domain-driven feature slices (shipment, auth, payment, hub)
│   ├── shipment/
│   │   ├── shipment.controller.ts
│   │   ├── shipment.service.ts
│   │   ├── shipment.routes.ts
│   │   ├── shipment.validation.ts   # Zod request/response schemas
│   │   └── shipment.interface.ts
│   └── ...
├── lib/                  # Shared utilities (prisma.ts, stripe.ts, mailer.ts)
├── middlewares/          # Auth guards, role checks, global error handlers
└── config/               # Environment variable parsing and global constants
```

---

## 5. User Roles & Authorization

Exactly 3 roles — do not add, rename, or infer additional roles:

- **Customer** — creates shipments, pays, requests pickup, tracks their own shipments.
- **Courier** — views and advances status only on shipments where `courierId` matches their own user id.
- **Admin** — manages hubs, manually assigns couriers to shipments, has read access to all shipments.

Rules:

- Role lives on the `User` model as a `role` enum field (`CUSTOMER | COURIER | ADMIN`).
- Enforce role checks via a `requireRole(...roles)` middleware applied at the route level — never inline role checks inside a controller or service function body.
- Ownership checks (e.g. a Courier may only touch their assigned shipment, a Customer may only view their own shipments) are a **separate check from role checks** — role middleware confirms _what kind_ of user is calling; the service layer must still confirm _which_ record they're allowed to touch.
- Prisma cannot enforce that a `Shipment.courierId` points to a user with `role = COURIER` — this must be validated explicitly in the courier-assignment service function before the assignment is written.
- Courier assignment to a shipment is always a manual Admin action. No auto-assignment logic.

---

## 6. Coding & Validation Guidelines

### Zod Validation (Strict)

- Every incoming HTTP request (body, query params, path params) must be validated through a Zod schema before hitting controller or service logic.
- Infer TypeScript types directly from schemas to avoid redundant interface declarations:

```typescript
export const createShipmentSchema = z.object({
  receiverName: z.string().min(2),
  receiverPhone: z
    .string()
    .regex(/^01[3-9]\d{8}$/, "Invalid Bangladeshi phone number"),
  weightKg: z.number().positive(),
});

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
```

- All schema validation errors must pass through the centralized error handler to output the required uniform error envelope:

```json
{
  "success": false,
  "message": "Input validation failed",
  "errors": [
    { "field": "receiverPhone", "message": "Invalid Bangladeshi phone number" }
  ]
}
```

### UI & Styling Guidelines

- Install missing components using the shadcn CLI via Bun: `bunx --bun shadcn@latest add <component-name>`
- Compose interfaces exclusively using primitives from `@/components/ui`.
- Use the `cn()` helper from `@/lib/utils` for conditional styling.
- Never hardcode fixed pixel widths/heights with arbitrary bracket syntax. Use flexbox, grid, and semantic spacing tokens (`max-w-md`, `w-full`, `gap-4`).

---

## 7. Development Workflows (Bun)

### Dependency Management

- Install dependency: `bun add <package>`
- Install dev dependency: `bun add -d <package>`
- Execute binaries: `bunx <package>`

### Database Operations (Prisma)

- Push schema changes: `bunx prisma db push`
- Generate Prisma client: `bunx prisma generate`
- Run migrations: `bunx prisma migrate dev --name <migration_name>`
- Open database GUI: `bunx prisma studio`

### Verification & Builds

- Run development server: `bun run dev`
- Type-checking: `bunx tsc --noEmit`
- Production build: `bun run build`
- Run test suite: `bun test`

---

## 8. Git & Commit Strategy

- Use conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`.
- Maintain at least 20 atomic, meaningful commits across development phases.
- Ensure clean build passes (`bunx tsc --noEmit`) before committing any changes.
