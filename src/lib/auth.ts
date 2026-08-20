import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";

const COOKIE = "ccs_financas_session";
const WS_COOKIE = "ccs_financas_workspace";

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET ausente");
  return new TextEncoder().encode(value);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
  jar.delete(WS_COOKIE);
}

export async function getUserId() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    await clearSession();
    redirect("/login");
  }
  return user;
}

export async function getActiveWorkspaceId(userId: string) {
  const fromCookie = (await cookies()).get(WS_COOKIE)?.value;
  if (fromCookie) {
    const exists = await prisma.workspace.findFirst({
      where: { id: fromCookie, ownerId: userId },
      select: { id: true },
    });
    if (exists) return exists.id;
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastWorkspaceId: true },
  });
  if (user?.lastWorkspaceId) {
    const exists = await prisma.workspace.findFirst({
      where: { id: user.lastWorkspaceId, ownerId: userId },
      select: { id: true },
    });
    if (exists) return exists.id;
  }
  const first = await prisma.workspace.findFirst({
    where: { ownerId: userId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return first?.id ?? null;
}

export async function setActiveWorkspace(userId: string, workspaceId: string) {
  const jar = await cookies();
  jar.set(WS_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  await prisma.user.update({
    where: { id: userId },
    data: { lastWorkspaceId: workspaceId },
  });
}

export async function requireWorkspace() {
  const user = await requireUser();
  const workspaceId = await getActiveWorkspaceId(user.id);
  if (!workspaceId) redirect("/app/configuracoes");
  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, ownerId: user.id },
  });
  if (!workspace) redirect("/app/configuracoes");
  return { user, workspace };
}

export async function audit(
  userId: string,
  action: string,
  entity: string,
  opts?: { workspaceId?: string; entityId?: string; detail?: string },
) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entity,
      workspaceId: opts?.workspaceId,
      entityId: opts?.entityId,
      detail: opts?.detail,
    },
  });
}
