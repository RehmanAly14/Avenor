# DataHub preparation

This boundary intentionally contains interfaces only. Future DataHub adapters should implement the client contract and translate DataHub entities into the metadata module's service inputs; they must not write Prisma records directly.
