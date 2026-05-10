const ProctoringEvent = require('../models/ProctoringEvent');

/**
 * Sets up Socket.io event handlers for real-time proctoring.
 * @param {import('socket.io').Server} io
 */
function setupProctoringSocket(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Student joins an exam room
    socket.on('join-exam', ({ examId, studentId }) => {
      if (!examId || !studentId) return;
      const room = `exam-${examId}`;
      socket.join(room);
      console.log(`[Socket] Student ${studentId} joined room ${room}`);

      // Notify teacher room of connected student
      io.to(room).emit('student-connected', {
        studentId,
        socketId: socket.id,
        connectedAt: new Date().toISOString(),
      });
    });

    // Teacher joins to monitor an exam room
    socket.on('join-teacher', ({ teacherId, examId }) => {
      if (!examId) return;
      const room = `exam-${examId}`;
      socket.join(room);
      console.log(`[Socket] Teacher ${teacherId} joined monitoring room ${room}`);
    });

    // Proctoring event from student
    socket.on('proctor-event', async ({ type, examId, studentId, timestamp, metadata }) => {
      try {
        if (!type || !examId || !studentId) return;

        // Save to DB
        await ProctoringEvent.create({
          examId,
          studentId,
          type,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
          metadata: metadata || {},
        });

        // Broadcast to teacher room
        io.to(`exam-${examId}`).emit('violation', {
          studentId,
          type,
          timestamp: timestamp || new Date().toISOString(),
          metadata: metadata || {},
        });

        console.log(`[Socket] Proctoring event: ${type} from ${studentId} in exam ${examId}`);
      } catch (err) {
        console.error('[Socket] Error saving proctoring event:', err.message);
      }
    });

    // Student disconnects
    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id} (${reason})`);
    });
  });
}

module.exports = setupProctoringSocket;
