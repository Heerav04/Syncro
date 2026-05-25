import { GET as getTasks } from '../app/api/tasks/route';
import { POST as createLog } from '../app/api/logs/route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/firebase/admin', () => ({
  getAdminServices: jest.fn(() => ({
    firestore: {
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        docs: [
          { data: () => ({ id: '1', title: 'Test Task' }) }
        ]
      }),
      set: jest.fn().mockResolvedValue(true),
    }
  }))
}));

jest.mock('@/lib/api/auth', () => ({
  requireAuth: jest.fn().mockResolvedValue({
    session: { uid: 'user123', claims: { companyId: 'comp123', role: 'member' } },
    response: null
  }),
  requireRole: jest.fn().mockReturnValue(null),
  badRequest: jest.fn((msg) => new Response(JSON.stringify({ error: msg }), { status: 400 })),
  serverError: jest.fn((msg) => new Response(JSON.stringify({ error: msg }), { status: 500 })),
  success: jest.fn((data) => new Response(JSON.stringify(data), { status: 200 })),
  cleanText: jest.fn((val) => val),
  optionalText: jest.fn((val) => val),
  now: jest.fn(() => new Date().toISOString()),
  taskEditorRoles: ['superAdmin', 'companyAdmin', 'teamLead', 'editor']
}));

describe('API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Tasks API', () => {
    it('GET should require a teamId', async () => {
      const req = new NextRequest('http://localhost:3000/api/tasks');
      const res = await getTasks(req);
      
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('teamId is required.');
    });

    it('GET should return tasks when teamId is provided', async () => {
      const req = new NextRequest('http://localhost:3000/api/tasks?teamId=team1');
      const res = await getTasks(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.tasks[0].title).toBe('Test Task');
    });
  });

  describe('Logs API', () => {
    it('POST should create a work log successfully', async () => {
      const req = new NextRequest('http://localhost:3000/api/logs', {
        method: 'POST',
        body: JSON.stringify({
          teamId: 'team1',
          text: 'Did some work today',
          screenshotUrls: ['http://example.com/image.png']
        })
      });
      
      const res = await createLog(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.log.text).toBe('Did some work today');
    });

    it('POST should require text in work log', async () => {
      const req = new NextRequest('http://localhost:3000/api/logs', {
        method: 'POST',
        body: JSON.stringify({ teamId: 'team1' })
      });
      
      const res = await createLog(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Work log text is required.');
    });
  });
});
