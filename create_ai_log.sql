CREATE TABLE IF NOT EXISTS "AIConversationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIConversationLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AIConversationLog_userId_idx" ON "AIConversationLog"("userId");
CREATE INDEX IF NOT EXISTS "AIConversationLog_sessionId_idx" ON "AIConversationLog"("sessionId");
CREATE INDEX IF NOT EXISTS "AIConversationLog_createdAt_idx" ON "AIConversationLog"("createdAt");

-- Safely try to add the foreign key
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'AIConversationLog_userId_fkey'
    ) THEN
        ALTER TABLE "AIConversationLog" 
        ADD CONSTRAINT "AIConversationLog_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
