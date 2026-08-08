import * as service from "./document.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess,buildPaginationMeta } from "../../utils/response.js";
import { HTTP_STATUS } from "../../constants/http.js";
export const uploadDocument=asyncHandler(async(req,res)=>sendSuccess(res,{statusCode:HTTP_STATUS.CREATED,message:"Document uploaded successfully.",data:{document:await service.uploadDocument(req.user.id,req.body,req.file)}}));
export const listDocuments=asyncHandler(async(req,res)=>{const result=await service.listDocuments(req.user.id,req.query);sendSuccess(res,{message:"Documents retrieved successfully.",data:{documents:result.items},meta:buildPaginationMeta({total:result.total,page:result.pagination.page,limit:result.pagination.limit})});});
export const getDocument=asyncHandler(async(req,res)=>sendSuccess(res,{message:"Document retrieved successfully.",data:{document:await service.getDocument(req.params.id,req.user.id)}}));
export const deleteDocument=asyncHandler(async(req,res)=>{await service.deleteDocument(req.params.id,req.user.id);sendSuccess(res,{message:"Document deleted successfully."});});
