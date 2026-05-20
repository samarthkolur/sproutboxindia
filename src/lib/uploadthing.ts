import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";

const f = createUploadthing();

export const uploadRouter = {
  growerCheckin: f({ image: { maxFileSize: "4MB", maxFileCount: 2 } })
    .middleware(async () => {
      const session = await auth();
      return { userId: session?.user?.id || "anonymous" };
    })
    .onUploadComplete(async ({ file, metadata }) => ({
      url: file.url,
      key: file.key,
      userId: metadata.userId,
    })),
  growerSpace: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth();
      return { userId: session?.user?.id || "anonymous" };
    })
    .onUploadComplete(async ({ file, metadata }) => ({
      url: file.url,
      key: file.key,
      userId: metadata.userId,
    })),
  harvestPhoto: f({ image: { maxFileSize: "4MB", maxFileCount: 3 } })
    .middleware(async () => {
      const session = await auth();
      return { userId: session?.user?.id || "anonymous" };
    })
    .onUploadComplete(async ({ file, metadata }) => ({
      url: file.url,
      key: file.key,
      userId: metadata.userId,
    })),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
