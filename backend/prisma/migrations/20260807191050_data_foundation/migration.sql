-- AlterTable
ALTER TABLE "_MetadataAssetToMetadataOwner" ADD CONSTRAINT "_MetadataAssetToMetadataOwner_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_MetadataAssetToMetadataOwner_AB_unique";

-- AlterTable
ALTER TABLE "_MetadataAssetToMetadataTag" ADD CONSTRAINT "_MetadataAssetToMetadataTag_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_MetadataAssetToMetadataTag_AB_unique";
