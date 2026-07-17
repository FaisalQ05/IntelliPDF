/*
  Warnings:

  - The values [PENDING,READY,ERROR] on the enum `DocumentStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DocumentStatus_new" AS ENUM ('QUEUED', 'PROCESSING', 'EMBEDDING', 'INDEXING', 'COMPLETED', 'FAILED');
ALTER TABLE "public"."documents" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "documents" ALTER COLUMN "status" TYPE "DocumentStatus_new" USING ("status"::text::"DocumentStatus_new");
ALTER TYPE "DocumentStatus" RENAME TO "DocumentStatus_old";
ALTER TYPE "DocumentStatus_new" RENAME TO "DocumentStatus";
DROP TYPE "public"."DocumentStatus_old";
ALTER TABLE "documents" ALTER COLUMN "status" SET DEFAULT 'QUEUED';
COMMIT;

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "error" TEXT,
ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "status" SET DEFAULT 'QUEUED';
