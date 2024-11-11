import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: Request) {
    try {
      // Get and validate request data
      const { name, email, roomId, roomKey } = await request.json();
  
      console.log("[name, email, room, room key]:", name, email, roomId, roomKey)
      if (!name?.trim() || !email?.trim() || !roomKey?.trim()) {
        return Response.json({
          success: false,
          message: "Name, email, and room key are required"
        }, { status: 400 });
      }
  
      // Validate room key
      const roomSecretKey = process.env.KANBAN_SECRET_KEY;
      if (!roomSecretKey || roomKey !== roomSecretKey) {
        return Response.json({
          success: false,
          message: "Invalid room key"
        }, { status: 403 });
      }
  
      const randomAvatar = `https://liveblocks.io/avatars/avatar-${Math.floor(Math.random() * 29)}.png`

      // Create and authorize session
      const session = liveblocks.prepareSession(email, {
        userInfo: { name, email, avatar: randomAvatar }
      });
  
      // Set permissions
      session.allow(roomId, session.FULL_ACCESS);
  
      // Get authorization token
      const { status, body } = await session.authorize();
  
      if (status !== 200) {
        return Response.json({
          success: false,
          message: "Authorization failed"
        }, { status });
      }
  
      return new Response(body, { status });
  
    } catch (error) {
      console.error("Error:", error);
      return Response.json({
        success: false,
        message: "Server error"
      }, { status: 500 });
    }
  }