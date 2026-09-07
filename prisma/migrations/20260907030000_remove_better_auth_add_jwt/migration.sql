-- DropForeignKey
ALTER TABLE IF EXISTS "accounts" DROP CONSTRAINT IF EXISTS "accounts_userId_fkey";
ALTER TABLE IF EXISTS "sessions" DROP CONSTRAINT IF EXISTS "sessions_userId_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "googleId" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- Convert role column to Role enum if text
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role' AND data_type = 'text'
    ) THEN
        ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
        ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role" USING (
            CASE 
                WHEN "role" = 'CUR' THEN 'COURIER'::"Role"
                WHEN "role" = 'COURIER' THEN 'COURIER'::"Role"
                WHEN "role" = 'ADMIN' THEN 'ADMIN'::"Role"
                ELSE 'CUSTOMER'::"Role"
            END
        );
        ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CUSTOMER';
    END IF;
END $$;

-- DropTable
DROP TABLE IF EXISTS "accounts";
DROP TABLE IF EXISTS "sessions";
DROP TABLE IF EXISTS "verifications";

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_googleId_key" ON "users"("googleId");
