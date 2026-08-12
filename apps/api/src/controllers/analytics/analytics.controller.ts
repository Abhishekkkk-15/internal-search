import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";

interface AuthenticatedRequest extends Request {
  user?: any;
}

export class AnalyticsController {
  async getDashboardStats(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id || (req.headers['x-user-id'] as string);

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // 1. Ensure user exists
      await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: { id: userId }
      });

      // 2. FetchCounts
      const [connectedSourcesCount, indexedDocumentsCount, conversationsCount, messagesCount, activeConnections, recentConversations] = await Promise.all([
        prisma.connection.count({
          where: { userId, status: 'connected', source: { in: ['slack', 'notion', 'github'] } }
        }),
        prisma.document.count({
          where: { userId, source: { in: ['slack', 'notion', 'github'] } }
        }),
        prisma.conversation.count({
          where: { userId }
        }),
        prisma.message.count({
          where: { conversation: { userId }, role: 'user' }
        }),
        prisma.connection.findMany({
          where: { userId, source: { in: ['slack', 'notion', 'github'] } },
          select: { source: true, status: true, indexedCount: true, lastSync: true }
        }),
        prisma.conversation.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            messages: {
              orderBy: { timestamp: 'desc' },
              take: 1
            }
          }
        })
      ]);

      // 3. Aggregate Weekly Activity (Past 7 days)
      const now = new Date();
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyDataMap: Record<string, number> = {};

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayName = days[d.getDay()] || 'Sun';
        weeklyDataMap[dayName] = 0;
      }

      const recentUserMessages = await prisma.message.findMany({
        where: {
          conversation: { userId },
          role: 'user',
          timestamp: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
        },
        select: { timestamp: true }
      });

      recentUserMessages.forEach((msg) => {
        const dayName = days[new Date(msg.timestamp).getDay()] || 'Sun';
        if (weeklyDataMap[dayName] !== undefined) {
          weeklyDataMap[dayName]! += 1;
        }
      });

      const chartData = Object.keys(weeklyDataMap).map((day) => ({
        day,
        queries: weeklyDataMap[day],
        actions: 0
      }));

      return res.status(200).json({
        stats: {
          connectedSourcesCount,
          indexedDocumentsCount,
          conversationsCount,
          messagesCount
        },
        chartData,
        connections: activeConnections,
        recentConversations: recentConversations.map((c) => ({
          id: c.id,
          title: c.title || "Untitled Conversation",
          platform: 'slack',
          time: c.createdAt.toISOString(),
          preview: c.messages[0]?.content?.substring(0, 80) || "No messages yet..."
        }))
      });
    } catch (error) {
      console.error("Error fetching dashboard analytics:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
