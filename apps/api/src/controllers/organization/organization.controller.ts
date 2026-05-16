import { Request, Response } from "express";
import { prisma } from "@nexus/database";

export class OrganizationController {
  async getSettings(req: Request, res: Response) {
    try {
      const organizationId = req.headers['x-organization-id'] as string;
      
      if (!organizationId) {
        return res.status(400).json({ message: "Organization ID is required" });
      }

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      return res.status(200).json(organization);
    } catch (error) {
      console.error("Error fetching organization settings:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async updateSettings(req: Request, res: Response) {
    try {
      const organizationId = req.headers['x-organization-id'] as string;
      const { name, timezone, language, llmProvider, retentionDays } = req.body;

      if (!organizationId) {
        return res.status(400).json({ message: "Organization ID is required" });
      }

      const updated = await prisma.organization.update({
        where: { id: organizationId },
        data: {
          name,
          timezone,
          language,
          llmProvider,
          retentionDays: retentionDays ? parseInt(retentionDays) : undefined,
        },
      });

      return res.status(200).json(updated);
    } catch (error) {
      console.error("Error updating organization settings:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
