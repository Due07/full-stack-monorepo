-- CreateTable
CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

INSERT INTO "system_settings" ("key", "value", "description", "created_at", "updated_at")
VALUES (
    'public_user_register_enabled',
    'false',
    '是否开启用户端 H5 注册入口',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO NOTHING;
