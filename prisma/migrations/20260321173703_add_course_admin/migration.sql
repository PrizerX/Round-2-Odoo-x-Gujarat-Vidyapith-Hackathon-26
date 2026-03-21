-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tagsText" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "visibility" TEXT NOT NULL DEFAULT 'everyone',
    "accessRule" TEXT NOT NULL DEFAULT 'open',
    "priceInr" INTEGER,
    "website" TEXT,
    "thumbnailUrl" TEXT,
    "coverUrl" TEXT,
    "bannerUrl" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "durationMinutes" INTEGER NOT NULL DEFAULT 0,
    "lessonCount" INTEGER NOT NULL DEFAULT 0,
    "responsibleId" TEXT,
    "courseAdminId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Course_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Course_courseAdminId_fkey" FOREIGN KEY ("courseAdminId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Course" ("accessRule", "bannerUrl", "coverUrl", "createdAt", "description", "durationMinutes", "id", "lessonCount", "priceInr", "published", "responsibleId", "tagsText", "thumbnailUrl", "title", "updatedAt", "views", "visibility", "website") SELECT "accessRule", "bannerUrl", "coverUrl", "createdAt", "description", "durationMinutes", "id", "lessonCount", "priceInr", "published", "responsibleId", "tagsText", "thumbnailUrl", "title", "updatedAt", "views", "visibility", "website" FROM "Course";
DROP TABLE "Course";
ALTER TABLE "new_Course" RENAME TO "Course";
CREATE INDEX "Course_published_idx" ON "Course"("published");
CREATE INDEX "Course_visibility_idx" ON "Course"("visibility");
CREATE INDEX "Course_accessRule_idx" ON "Course"("accessRule");
CREATE INDEX "Course_courseAdminId_idx" ON "Course"("courseAdminId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
