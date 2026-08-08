import prisma from "../config/prisma.js";

export function transaction(operations) {
  return prisma.$transaction(operations);
}
