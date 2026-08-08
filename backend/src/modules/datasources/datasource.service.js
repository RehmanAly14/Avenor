import prisma from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { HTTP_STATUS } from "../../constants/http.js";
import { encrypt } from "../../utils/encryption.js";
import { paginationParams } from "../../utils/pagination.js";
import { transaction } from "../../utils/transaction.js";

const SELECT = { id: true, projectId: true, workspaceId: true, name: true, provider: true, host: true, port: true, database: true, username: true, status: true, createdAt: true, updatedAt: true };
async function assertScope(userId, projectId, workspaceId) {
  const [project, workspace] = await transaction([prisma.project.findFirst({ where: { id: projectId, ownerId: userId } }), prisma.workspace.findFirst({ where: { id: workspaceId, ownerId: userId } })]);
  if (!project || !workspace) throw new AppError("Project or workspace was not found or is not accessible.", HTTP_STATUS.FORBIDDEN);
}
async function owned(id, userId) {
  const source = await prisma.dataSource.findUnique({ where: { id } });
  if (!source) throw new AppError("Data source not found.", HTTP_STATUS.NOT_FOUND);
  await assertScope(userId, source.projectId, source.workspaceId); return source;
}
export async function createDataSource(userId, data) { await assertScope(userId, data.projectId, data.workspaceId); const { password, ...rest } = data; return prisma.dataSource.create({ data: { ...rest, encryptedPassword: encrypt(password) }, select: SELECT }); }
export async function listDataSources(userId, filters) { const { page, limit, projectId, workspaceId } = filters; if (projectId || workspaceId) { if (!projectId || !workspaceId) throw new AppError("projectId and workspaceId must be supplied together.", HTTP_STATUS.UNPROCESSABLE_ENTITY); await assertScope(userId, projectId, workspaceId); } const where = { ...(projectId ? { projectId } : { project: { ownerId: userId } }), ...(workspaceId && { workspaceId }) }; const pg = paginationParams({ page, limit }); const [items, total] = await transaction([prisma.dataSource.findMany({ where, select: SELECT, orderBy: { createdAt: "desc" }, skip: pg.skip, take: pg.take }), prisma.dataSource.count({ where })]); return { items, total, pagination: pg }; }
export async function getDataSource(id, userId) { await owned(id, userId); return prisma.dataSource.findUnique({ where: { id }, select: SELECT }); }
export async function updateDataSource(id, userId, data) { await owned(id, userId); const { password, ...rest } = data; return prisma.dataSource.update({ where: { id }, data: { ...rest, ...(password && { encryptedPassword: encrypt(password) }) }, select: SELECT }); }
export async function deleteDataSource(id, userId) { await owned(id, userId); await prisma.dataSource.delete({ where: { id } }); }
