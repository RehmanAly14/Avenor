import * as service from "./catalog.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess, buildPaginationMeta } from "../../utils/response.js";
export const listAssets=asyncHandler(async(req,res)=>{const result=await service.listCatalogAssets(req.user.id,req.query);sendSuccess(res,{message:"Catalog assets retrieved successfully.",data:{assets:result.items},meta:buildPaginationMeta({total:result.total,page:result.pagination.page,limit:result.pagination.limit})});});
export const getAsset=asyncHandler(async(req,res)=>sendSuccess(res,{message:"Catalog asset retrieved successfully.",data:{asset:await service.getCatalogAsset(req.user.id,req.params.id)}}));
