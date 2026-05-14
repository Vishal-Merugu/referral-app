import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import referralRoutes from './routes/referralRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import companyRoutes from './routes/companyRoutes';
import messageRoutes from './routes/messageRoutes';
import notificationRoutes from './routes/notificationRoutes';
import reviewRoutes from './routes/reviewRoutes';
import resourceRoutes from './routes/resourceRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import adminRoutes from './routes/adminRoutes';
import aiRoutes from './routes/aiRoutes';
import availabilityRoutes from './routes/availabilityRoutes';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 16) {
  console.error('FATAL: JWT_SECRET must be set and at least 16 characters');
  process.exit(1);
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Socket.io connection logic
io.on('connection', (socket) => {
  console.log(`📡 WebSocket connected: ${socket.id}`);

  socket.on('join_global', (userId: string) => {
    socket.join(`user_${userId}`);
    console.log(`Socket ${socket.id} joined global room user_${userId}`);
  });

  // Clients join a specific "room" created by deterministically sorting caller/receiver IDs
  socket.on('join_room', (roomId: string) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  // Clients trigger this when sending a message
  socket.on(
    'send_message',
    (data: { roomId: string; receiverId?: string; message: any }) => {
      // Broadcast the incoming message down to anyone else currently sitting in that room
      socket.to(data.roomId).emit('receive_message', data.message);

      // Broadcast globally to update the target's navigation badge
      if (data.receiverId) {
        socket
          .to(`user_${data.receiverId}`)
          .emit('receive_global_message', data.message);
      }
    },
  );

  socket.on('disconnect', () => {
    console.log(`🔴 WebSocket disconnected: ${socket.id}`);
  });
});

app.get('/', (_req, res) => {
  res.json({ message: 'ReferralHub API v2', version: '2.0.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/availability', availabilityRoutes);

app.use(
  (
    err: Error & { stack?: string },
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || 'Something went wrong!' });
  },
);

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
