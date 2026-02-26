-- CreateTable
CREATE TABLE "mass_message_batches" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "total" INTEGER NOT NULL,
    "success_count" INTEGER NOT NULL,
    "failure_count" INTEGER NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mass_message_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_mass_message_batches_sent_at" ON "mass_message_batches"("sent_at" DESC);

-- AddForeignKey
ALTER TABLE "mass_message_batches" ADD CONSTRAINT "mass_message_batches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
