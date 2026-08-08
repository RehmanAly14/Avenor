import prisma from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { HTTP_STATUS } from "../../constants/http.js";
import { paginationParams } from "../../utils/pagination.js";
import { transaction } from "../../utils/transaction.js";
import { storeDocument, removeDocument } from "../../utils/storage.js";
const SELECT={id:true,projectId:true,workspaceId:true,filename:true,fileSize:true,mimeType:true,storagePath:true,status:true,createdAt:true,updatedAt:true};
async function scope(userId,projectId,workspaceId){const [project,workspace]=await transaction([prisma.project.findFirst({where:{id:projectId,ownerId:userId}}),prisma.workspace.findFirst({where:{id:workspaceId,ownerId:userId}})]);if(!project||!workspace)throw new AppError("Project or workspace was not found or is not accessible.",HTTP_STATUS.FORBIDDEN);}
async function owned(id,userId){const doc=await prisma.document.findUnique({where:{id}});if(!doc)throw new AppError("Document not found.",HTTP_STATUS.NOT_FOUND);await scope(userId,doc.projectId,doc.workspaceId);return doc;}
export async function uploadDocument(userId,data,file){await scope(userId,data.projectId,data.workspaceId);const storagePath=await storeDocument(file.buffer,file.originalname);try{return await prisma.document.create({data:{...data,filename:file.originalname,fileSize:file.size,mimeType:file.mimetype,storagePath},select:SELECT});}catch(error){await removeDocument(storagePath);throw error;}}
export async function listDocuments(userId,filters){const{page,limit,projectId,workspaceId}=filters;if(projectId||workspaceId){if(!projectId||!workspaceId)throw new AppError("projectId and workspaceId must be supplied together.",HTTP_STATUS.UNPROCESSABLE_ENTITY);await scope(userId,projectId,workspaceId);}const where={...(projectId?{projectId,workspaceId}:{project:{ownerId:userId}})};const pg=paginationParams({page,limit});const[items,total]=await transaction([prisma.document.findMany({where,select:SELECT,orderBy:{createdAt:"desc"},skip:pg.skip,take:pg.take}),prisma.document.count({where})]);return{items,total,pagination:pg};}
export async function getDocument(id,userId){await owned(id,userId);return prisma.document.findUnique({where:{id},select:SELECT});}
export async function deleteDocument(id,userId){const doc=await owned(id,userId);await removeDocument(doc.storagePath);await prisma.document.delete({where:{id}});}
