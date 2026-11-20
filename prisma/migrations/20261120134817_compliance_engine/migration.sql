-- CreateEnum
CREATE TYPE "PhoneNumberStatus" AS ENUM ('AVAILABLE', 'SUSPENDED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "DncReason" AS ENUM ('COMPLAINT', 'OPT_OUT', 'REGULATOR');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('DRAFT', 'COMPLIANCE_PASSED', 'DIALING', 'COMPLETED', 'FAILED', 'BLOCKED');

-- AlterTable
ALTER TABLE "calls" ADD COLUMN     "recordingExpiresAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "phone_numbers" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "status" "PhoneNumberStatus" NOT NULL DEFAULT 'SUSPENDED',
    "carrier" TEXT,
    "authorization" TEXT,
    "dailyLimit" INTEGER NOT NULL DEFAULT 3,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "phone_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dnc_entries" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "reason" "DncReason" NOT NULL,
    "source" TEXT,
    "expiresAt" TIMESTAMP(3),
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dnc_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbound_tasks" (
    "id" TEXT NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "customerId" TEXT,
    "callId" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'DRAFT',
    "complianceSnap" JSONB,
    "scheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outbound_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "phone_numbers_number_key" ON "phone_numbers"("number");

-- CreateIndex
CREATE INDEX "phone_numbers_status_idx" ON "phone_numbers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "dnc_entries_phone_key" ON "dnc_entries"("phone");

-- CreateIndex
CREATE INDEX "dnc_entries_phone_idx" ON "dnc_entries"("phone");

-- CreateIndex
CREATE INDEX "outbound_tasks_status_idx" ON "outbound_tasks"("status");

-- CreateIndex
CREATE INDEX "outbound_tasks_phoneNumberId_idx" ON "outbound_tasks"("phoneNumberId");

-- AddForeignKey
ALTER TABLE "outbound_tasks" ADD CONSTRAINT "outbound_tasks_phoneNumberId_fkey" FOREIGN KEY ("phoneNumberId") REFERENCES "phone_numbers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

