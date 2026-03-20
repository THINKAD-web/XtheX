import fs from "fs/promises";
import path from "path";

function proposalsDir(): string {
  const env = process.env.XTHEX_PROPOSAL_DIR?.trim();
  if (env) return path.resolve(env);
  return path.join(process.cwd(), ".data", "proposals");
}

const EXTS = [".pdf", ".pptx", ".ppt"] as const;

export const LOCAL_PROPOSAL_PREFIX = "xthex-local://";

export function isLocalProposalUrl(url: string | null | undefined): boolean {
  return Boolean(url?.startsWith(LOCAL_PROPOSAL_PREFIX));
}

export async function saveUploadedProposalFile(
  mediaId: string,
  buffer: Buffer,
  originalFileName: string,
): Promise<void> {
  const ext =
    path.extname(originalFileName).toLowerCase().match(/^\.(pdf|ppt|pptx)$/)?.[0] ??
    ".pdf";
  const dir = proposalsDir();
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${mediaId}${ext}`), buffer);
}

export async function readUploadedProposalFile(mediaId: string): Promise<{
  buffer: Buffer;
  fileName: string;
} | null> {
  const dir = proposalsDir();
  for (const ext of EXTS) {
    const p = path.join(dir, `${mediaId}${ext}`);
    try {
      const buffer = await fs.readFile(p);
      return { buffer, fileName: `proposal${ext}` };
    } catch {
      continue;
    }
  }
  return null;
}

export async function removeUploadedProposalFile(mediaId: string): Promise<void> {
  for (const ext of EXTS) {
    try {
      await fs.unlink(path.join(proposalsDir(), `${mediaId}${ext}`));
    } catch {
      /* noop */
    }
  }
}
