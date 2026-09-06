export const UserRole = {
    ADMIN: "ADMIN",
    CUSTOMER: "CUSTOMER",
    COURIER: "COURIER",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];