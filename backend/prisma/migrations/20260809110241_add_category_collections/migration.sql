-- CreateEnum
CREATE TYPE "Collection" AS ENUM ('MEN', 'WOMEN', 'ACCESSORIES');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "collection" "Collection";
