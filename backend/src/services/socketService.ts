import { Server as IOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: IOServer;

export function initSocketServer(httpServer: HTTPServer) {
  io = new IOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    // Candidate/admin registers their Firebase UID
    socket.on('register', (uid: string) => {
      if (uid) {
        socket.join(`user:${uid}`);
      }
    });

    // Admin joins company room for live feed
    socket.on('join_company', (companyId: string) => {
      if (companyId) socket.join(`company:${companyId}`);
    });
  });

  return io;
}

export function notifyUser(firebaseUid: string, event: string, data: any) {
  if (io) io.to(`user:${firebaseUid}`).emit(event, data);
}

export function notifyCompany(companyId: string, event: string, data: any) {
  if (io) io.to(`company:${companyId}`).emit(event, data);
}

export function getIO() { return io; }
