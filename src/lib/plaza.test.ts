import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "./prisma";

// getSelectedPlaza() (bkz. src/lib/plaza.ts) çok-kiracılı izolasyonun tek geçit noktası:
// prisma.plaza.findFirst({ where: { id, organizationId } }). cookies()/redirect() gibi
// Next.js'e özgü kısımları burada mock'lamak yerine, izolasyonu sağlayan asıl sorguyu
// doğrudan test ediyoruz — güvenlik açısından kritik olan kısım budur.
describe("plaza izolasyonu (organizationId ile filtreleme)", () => {
  const orgAId = "test-iso-org-a";
  const orgBId = "test-iso-org-b";
  let plazaAId: string;
  let plazaBId: string;

  beforeAll(async () => {
    await prisma.organization.createMany({
      data: [
        { id: orgAId, name: "Test İzolasyon Org A" },
        { id: orgBId, name: "Test İzolasyon Org B" },
      ],
      skipDuplicates: true,
    });
    const plazaA = await prisma.plaza.create({
      data: { name: "Test İzolasyon Plaza A", organizationId: orgAId },
    });
    const plazaB = await prisma.plaza.create({
      data: { name: "Test İzolasyon Plaza B", organizationId: orgBId },
    });
    plazaAId = plazaA.id;
    plazaBId = plazaB.id;
  });

  afterAll(async () => {
    await prisma.plaza.deleteMany({ where: { organizationId: { in: [orgAId, orgBId] } } });
    await prisma.organization.deleteMany({ where: { id: { in: [orgAId, orgBId] } } });
  });

  it("kendi organizasyonundaki plazayı bulur", async () => {
    const plaza = await prisma.plaza.findFirst({
      where: { id: plazaAId, organizationId: orgAId },
    });
    expect(plaza?.id).toBe(plazaAId);
  });

  it("başka organizasyonun plazasını ASLA bulamaz", async () => {
    const plaza = await prisma.plaza.findFirst({
      where: { id: plazaBId, organizationId: orgAId },
    });
    expect(plaza).toBeNull();
  });
});
