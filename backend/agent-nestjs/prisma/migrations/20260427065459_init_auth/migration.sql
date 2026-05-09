-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'disabled');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "token_version" INTEGER NOT NULL DEFAULT 0,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "device_type" TEXT,
    "device_name" TEXT,
    "client_ip" TEXT,
    "user_agent" TEXT,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_active_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "operator_user_id" TEXT,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_session_id_key" ON "user_sessions"("session_id");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_operator_user_id_idx" ON "audit_logs"("operator_user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_operator_user_id_fkey" FOREIGN KEY ("operator_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
