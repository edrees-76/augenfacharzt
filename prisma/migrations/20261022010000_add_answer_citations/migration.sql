-- CreateEnum
CREATE TYPE "CitationSourceType" AS ENUM ('DOG_LEITLINIE', 'DOG_BVA_STELLUNGNAHME', 'AWMF_LEITLINIE', 'EYEWIKI', 'OTHER');

-- CreateTable
CREATE TABLE "AnswerCitation" (
    "id" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "type" "CitationSourceType" NOT NULL,
    "title" TEXT NOT NULL,
    "dateLabel" TEXT,
    "url" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AnswerCitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnswerCitation_answerId_idx" ON "AnswerCitation"("answerId");

-- AddForeignKey
ALTER TABLE "AnswerCitation" ADD CONSTRAINT "AnswerCitation_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "QuestionAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
