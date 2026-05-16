import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Jira Tool - Generates a ticket in Jira
 */
export const createJiraTicketTool = tool(
  async ({ title, description, priority = "Medium" }) => {
    console.log(`[JiraTool] Creating ticket: ${title}`);
    // Mock API call to Jira
    return `Successfully created Jira ticket: ${title} (Priority: ${priority}). Ticket ID: NEX-123`;
  },
  {
    name: "create_jira_ticket",
    description: "Generates a new Jira ticket for a task or bug. Use this when the user asks to track something or create a ticket.",
    schema: z.object({
      title: z.string().describe("The short summary of the ticket"),
      description: z.string().describe("Detailed explanation of the task or bug"),
      priority: z.enum(["High", "Medium", "Low"]).optional().describe("The priority level of the ticket"),
    }),
  }
);

/**
 * Slack Tool - Sends a message to Slack
 */
export const sendSlackMessageTool = tool(
  async ({ channel, message }) => {
    console.log(`[SlackTool] Sending message to #${channel}`);
    // Mock API call to Slack
    return `Successfully sent message to Slack channel #${channel}.`;
  },
  {
    name: "send_slack_message",
    description: "Sends a notification or message to a specific Slack channel. Use this for broadcasts or alerts.",
    schema: z.object({
      channel: z.string().describe("The name or ID of the slack channel"),
      message: z.string().describe("The content of the message to send"),
    }),
  }
);

/**
 * Notion Tool - Updates Notion page
 */
export const updateNotionPageTool = tool(
  async ({ pageId, content }) => {
    console.log(`[NotionTool] Updating page ${pageId}`);
    // Mock API call to Notion
    return `Successfully appended content to Notion page: ${pageId}.`;
  },
  {
    name: "update_notion_page",
    description: "Updates or appends content to a specific Notion page. Use this for documentation updates.",
    schema: z.object({
      pageId: z.string().describe("The ID of the Notion page to update"),
      content: z.string().describe("The text content to add to the page"),
    }),
  }
);
