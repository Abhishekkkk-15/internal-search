import { Request, Response } from "express";

export class OrganizationController {
  async getSettings(req: Request, res: Response) {
    try {
      return res.status(200).json({
        id: "user_default",
        name: "User Workspace",
        timezone: "America/Los_Angeles",
        language: "en-US",
        llmProvider: "openai",
        retentionDays: 90,
        enabledTools: { jira: false, slack: true, notion: true, github: true }
      });
    } catch (error) {
      console.error("Error fetching organization settings:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async updateSettings(req: Request, res: Response) {
    try {
      const { name, timezone, language, llmProvider, retentionDays, tools } = req.body;

      return res.status(200).json({
        id: "user_default",
        name: name || "User Workspace",
        timezone: timezone || "America/Los_Angeles",
        language: language || "en-US",
        llmProvider: llmProvider || "openai",
        retentionDays: retentionDays ? parseInt(retentionDays) : 90,
        enabledTools: tools || { jira: false, slack: true, notion: true, github: true },
      });
    } catch (error) {
      console.error("Error updating organization settings:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
