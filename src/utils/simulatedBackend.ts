export interface SimUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'trainer' | 'member';
  membership_status?: 'Active' | 'Suspended' | 'Expired';
  days_left?: number;
  phone?: string;
  profile_photo?: string;
}

export interface SimCheckIn {
  id: number;
  member_id: number;
  member_name: string;
  member_email: string;
  checked_in_by: string;
  timestamp: string;
}

export interface SimToken {
  token: string;
  userId: number;
  abilities: string[];
  expiresAt: string | null;
}

export interface SimLog {
  id: number;
  timestamp: string;
  type: 'HTTP' | 'SQL' | 'MIDDLEWARE' | 'SCHEDULER' | 'AUTH' | 'SYSTEM';
  message: string;
}

export interface SimClass {
  id: number;
  name: string;
  trainer: string;
  time: string;
  available: number;
  capacity: number;
}

export interface SimBooking {
  id: number;
  memberId: number;
  memberName: string;
  memberEmail: string;
  classId: number;
  className: string;
  classTime: string;
  classTrainer: string;
  bookedAt: string;
}

// Initial Mock Database Seed
const initialUsers: SimUser[] = [
  {
    id: 1,
    name: 'Alexander Mercer',
    email: 'admin@gym.com',
    role: 'admin',
    profile_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150',
  },
  {
    id: 2,
    name: 'Sophia Vance',
    email: 'receptionist@gym.com',
    role: 'staff',
    profile_photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150',
  },
  {
    id: 3,
    name: 'Marcus Aurelius',
    email: 'trainer@gym.com',
    role: 'trainer',
    profile_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150',
  },
  {
    id: 4,
    name: 'Ethan Hunt',
    email: 'ethan@gym.com',
    role: 'member',
    membership_status: 'Active',
    days_left: 45,
    phone: '+1 (555) 018-004',
    profile_photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150',
  },
  {
    id: 5,
    name: 'Selena Kyle',
    email: 'selena@gym.com',
    role: 'member',
    membership_status: 'Suspended',
    days_left: 14,
    phone: '+1 (555) 018-005',
    profile_photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=150&h=150',
  },
  {
    id: 6,
    name: 'Bruce Wayne',
    email: 'bruce@gym.com',
    role: 'member',
    membership_status: 'Expired',
    days_left: 0,
    phone: '+1 (555) 018-006',
    profile_photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150',
  },
  {
    id: 7,
    name: 'Diana Prince',
    email: 'diana@gym.com',
    role: 'member',
    membership_status: 'Active',
    days_left: 120,
    phone: '+1 (555) 018-007',
    profile_photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=150&h=150',
  },
];

const initialCheckIns: SimCheckIn[] = [
  {
    id: 1,
    member_id: 4,
    member_name: 'Ethan Hunt',
    member_email: 'ethan@gym.com',
    checked_in_by: 'Sophia Vance',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hrs ago
  },
  {
    id: 2,
    member_id: 7,
    member_name: 'Diana Prince',
    member_email: 'diana@gym.com',
    checked_in_by: 'Kiosk Self Check-In',
    timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(), // 2.5 hrs ago
  },
];

const initialClasses: SimClass[] = [
  { id: 101, name: 'CrossFit WOD & Power', trainer: 'Marcus Aurelius', time: '08:00 AM', available: 6, capacity: 15 },
  { id: 102, name: 'Flexibility & Flow Vinyasa', trainer: 'Sophia Vance', time: '10:00 AM', available: 14, capacity: 20 },
  { id: 103, name: 'Full-Body Boxing Sparring', trainer: 'Alexander Mercer', time: '06:00 PM', available: 0, capacity: 12 },
];

const initialBookings: SimBooking[] = [
  {
    id: 1,
    memberId: 4,
    memberName: 'Ethan Hunt',
    memberEmail: 'ethan@gym.com',
    classId: 101,
    className: 'CrossFit WOD & Power',
    classTime: '08:00 AM',
    classTrainer: 'Marcus Aurelius',
    bookedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  }
];

class SimulatedBackend {
  private users: SimUser[];
  private checkIns: SimCheckIn[];
  private tokens: SimToken[];
  private logs: SimLog[];
  private classes: SimClass[];
  private bookings: SimBooking[];
  private listeners: (() => void)[];
  private isLiveMode: boolean;

  constructor() {
    const savedUsers = localStorage.getItem('sim_users');
    const savedCheckIns = localStorage.getItem('sim_checkins');
    const savedTokens = localStorage.getItem('sim_tokens');
    const savedLogs = localStorage.getItem('sim_logs');
    const savedClasses = localStorage.getItem('sim_classes');
    const savedBookings = localStorage.getItem('sim_bookings');
    const savedMode = localStorage.getItem('sim_live_mode');

    this.users = savedUsers ? JSON.parse(savedUsers) : initialUsers;
    this.checkIns = savedCheckIns ? JSON.parse(savedCheckIns) : initialCheckIns;
    this.tokens = savedTokens ? JSON.parse(savedTokens) : [];
    this.logs = savedLogs ? JSON.parse(savedLogs) : [];
    this.classes = savedClasses ? JSON.parse(savedClasses) : initialClasses;
    this.bookings = savedBookings ? JSON.parse(savedBookings) : initialBookings;
    this.isLiveMode = savedMode === 'true';
    this.listeners = [];

    if (this.logs.length === 0) {
      this.addLog('SYSTEM', 'Virtual Gym Sanctum + MySQL Backend started.');
      this.addLog('SQL', 'Database tables `users`, `check_ins`, `class_slots` and `bookings` loaded.');
    }
  }

  private saveState() {
    localStorage.setItem('sim_users', JSON.stringify(this.users));
    localStorage.setItem('sim_checkins', JSON.stringify(this.checkIns));
    localStorage.setItem('sim_tokens', JSON.stringify(this.tokens));
    localStorage.setItem('sim_logs', JSON.stringify(this.logs));
    localStorage.setItem('sim_classes', JSON.stringify(this.classes));
    localStorage.setItem('sim_bookings', JSON.stringify(this.bookings));
    localStorage.setItem('sim_live_mode', this.isLiveMode.toString());
    this.notifyListeners();
  }

  public resetDatabase() {
    this.users = JSON.parse(JSON.stringify(initialUsers));
    this.checkIns = JSON.parse(JSON.stringify(initialCheckIns));
    this.tokens = [];
    this.logs = [];
    this.classes = JSON.parse(JSON.stringify(initialClasses));
    this.bookings = JSON.parse(JSON.stringify(initialBookings));
    this.addLog('SYSTEM', 'Virtual Gym Sanctum + MySQL Backend reset.');
    this.addLog('SQL', 'Database tables `users`, `check_ins`, `class_slots` and `bookings` re-seeded.');
    this.saveState();
  }

  public registerListener(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l());
  }

  public getDbState() {
    return {
      users: this.users,
      checkIns: this.checkIns,
      tokens: this.tokens,
      logs: this.logs,
      classes: this.classes,
      bookings: this.bookings,
      isLiveMode: this.isLiveMode,
    };
  }

  public setLiveMode(value: boolean) {
    this.isLiveMode = value;
    this.addLog('SYSTEM', `API client switched to: ${value ? 'LIVE API (localhost:8000)' : 'SIMULATION MODE'}`);
    this.saveState();
  }

  public addLog(type: SimLog['type'], message: string) {
    const newLog: SimLog = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
    };
    this.logs.unshift(newLog);
    if (this.logs.length > 100) {
      this.logs.pop();
    }
    this.saveState();
  }

  // SIMULATED ENDPOINTS
  public async handleRequest(
    method: 'GET' | 'POST' | 'PUT',
    url: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<any> {
    // Artificial Latency (250ms - 400ms)
    await new Promise(resolve => setTimeout(resolve, 250 + Math.random() * 150));

    const path = url.split('?')[0];
    this.addLog('HTTP', `--> ${method} ${url}`);

    // Middleware check
    const authHeader = headers?.['Authorization'];
    let authUser: SimUser | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const tokenString = authHeader.substring(7);
      this.addLog('MIDDLEWARE', `Sanctum Auth Middleware: Authenticating Bearer Token...`);
      
      const matchedToken = this.tokens.find(t => t.token === tokenString);
      if (matchedToken) {
        authUser = this.users.find(u => u.id === matchedToken.userId) || null;
        if (authUser) {
          this.addLog('MIDDLEWARE', `Sanctum Auth Middleware: Authenticated User ${authUser.name} [Role: ${authUser.role}]`);
        } else {
          this.addLog('MIDDLEWARE', `Sanctum Auth Middleware: Token valid but user record not found.`);
        }
      } else {
        this.addLog('MIDDLEWARE', `Sanctum Auth Middleware: Invalid Bearer Token.`);
      }
    }

    // Auth Middleware verification helpers
    const requireAuth = () => {
      if (!authUser) {
        this.addLog('HTTP', `<-- 401 Unauthorized`);
        throw { status: 401, message: 'Unauthenticated.' };
      }
    };

    const requireRoles = (roles: string[]) => {
      requireAuth();
      this.addLog('MIDDLEWARE', `CheckRole Middleware: Verifying role permissions. Required: [${roles.join(', ')}]. User: '${authUser?.role}'`);
      if (authUser && !roles.includes(authUser.role)) {
        this.addLog('MIDDLEWARE', `CheckRole Middleware: ACCESS DENIED. Scopes not matching.`);
        this.addLog('HTTP', `<-- 403 Forbidden`);
        throw { status: 403, message: 'Unauthorized. Action requires one of: ' + roles.join(', ') };
      }
    };

    try {
      // 1. POST /api/login
      if (method === 'POST' && path === '/api/login') {
        const { email, password } = body || {};
        this.addLog('SQL', `SELECT * FROM users WHERE email = '${email}' LIMIT 1`);
        
        const user = this.users.find(u => u.email === email.toLowerCase().trim());
        if (!user || password !== 'password') {
          this.addLog('HTTP', `<-- 422 Unprocessable Entity (Invalid Credentials)`);
          throw { status: 422, message: 'The credentials provided are incorrect.' };
        }

        // Enforce only Admin and Active Member access
        if (user.role !== 'admin' && !(user.role === 'member' && user.membership_status === 'Active')) {
          this.addLog('AUTH', `Login Denied: User ${user.name} has role [${user.role}] or inactive status.`);
          this.addLog('HTTP', `<-- 403 Forbidden`);
          throw { status: 403, message: 'Access Denied. Only Admins and Active Members can access the portal.' };
        }

        // Issue Sanctum Token with scopes based on role
        let abilities: string[] = [];
        switch (user.role) {
          case 'admin':
            abilities = ['*'];
            break;
          case 'member':
          default:
            abilities = ['view-profile', 'book-classes'];
            break;
        }

        const token = 'gym_token_' + Math.random().toString(36).substring(2, 15);
        const newToken: SimToken = {
          token,
          userId: user.id,
          abilities,
          expiresAt: null,
        };

        this.tokens.push(newToken);
        this.addLog('AUTH', `Laravel Sanctum: Issued Token for ${user.name} (Scopes: ${JSON.stringify(abilities)})`);
        this.saveState();

        this.addLog('HTTP', `<-- 200 OK`);
        return {
          access_token: token,
          token_type: 'Bearer',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            membership_status: user.membership_status,
          },
        };
      }

      // 2. POST /api/logout
      if (method === 'POST' && path === '/api/logout') {
        requireAuth();
        this.tokens = this.tokens.filter(t => t.token !== authHeader?.substring(7));
        this.addLog('AUTH', `Laravel Sanctum: Revoked Token for ${authUser?.name}`);
        this.saveState();
        this.addLog('HTTP', `<-- 200 OK`);
        return { message: 'Logged out successfully.' };
      }

      // 3. GET /api/members
      if (method === 'GET' && path === '/api/members') {
        requireRoles(['admin']);
        
        // Parse search query
        const queryParams = new URL(url, 'http://localhost').searchParams;
        const query = queryParams.get('query')?.toLowerCase().trim();

        this.addLog('SQL', `SELECT * FROM users WHERE role = 'member' ${query ? `AND (name LIKE '%${query}%' OR email LIKE '%${query}%' OR id = '${query}')` : ''}`);

        let results = this.users.filter(u => u.role === 'member');
        if (query) {
          results = results.filter(
            u =>
              u.name.toLowerCase().includes(query) ||
              u.email.toLowerCase().includes(query) ||
              u.id.toString() === query ||
              (u.phone && u.phone.includes(query))
          );
        }

        this.addLog('HTTP', `<-- 200 OK (${results.length} members found)`);
        return {
          members: results.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            profile_photo: u.profile_photo,
            membership_status: u.membership_status,
          })),
        };
      }

      // 3.5 PUT /api/members/{id}
      if (method === 'PUT' && path.startsWith('/api/members/')) {
        requireRoles(['admin']);
        const memberIdString = path.split('/')[3];
        const memberId = parseInt(memberIdString, 10);

        this.addLog('SQL', `SELECT * FROM users WHERE id = ${memberId} LIMIT 1`);
        const memberIdx = this.users.findIndex(u => u.id === memberId && u.role === 'member');
        if (memberIdx === -1) {
          this.addLog('HTTP', `<-- 404 Not Found`);
          throw { status: 404, message: 'Member not found.' };
        }

        const { name, email, phone, membership_status, days_left } = body || {};

        // Update in-memory DB
        const updatedMember: SimUser = {
          ...this.users[memberIdx],
          name: name ?? this.users[memberIdx].name,
          email: email ?? this.users[memberIdx].email,
          phone: phone ?? this.users[memberIdx].phone,
          membership_status: membership_status ?? this.users[memberIdx].membership_status,
          days_left: days_left !== undefined ? parseInt(days_left, 10) : this.users[memberIdx].days_left,
        };

        this.users[memberIdx] = updatedMember;
        this.addLog(
          'SQL',
          `UPDATE users SET name='${updatedMember.name}', email='${updatedMember.email}', phone='${updatedMember.phone}', membership_status='${updatedMember.membership_status}', days_left=${updatedMember.days_left} WHERE id=${memberId}`
        );
        this.addLog('AUTH', `Admin updated member details for ${updatedMember.name}.`);
        this.saveState();

        this.addLog('HTTP', `<-- 200 OK`);
        return {
          message: 'Member updated successfully.',
          member: updatedMember,
        };
      }

      // 3.6 POST /api/members
      if (method === 'POST' && path === '/api/members') {
        requireRoles(['admin']);
        const { name, email, phone, membership_status, days_left } = body || {};

        if (!name || !email) {
          this.addLog('HTTP', `<-- 422 Unprocessable Entity`);
          throw { status: 422, message: 'The name and email fields are required.' };
        }

        const emailExists = this.users.some(u => u.email.toLowerCase() === email.toLowerCase());
        if (emailExists) {
          this.addLog('HTTP', `<-- 422 Unprocessable Entity`);
          throw { status: 422, message: 'The email address has already been taken.' };
        }

        const newId = Math.max(...this.users.map(u => u.id)) + 1;
        const newMember: SimUser = {
          id: newId,
          name,
          email: email.toLowerCase().trim(),
          role: 'member',
          membership_status: membership_status || 'Active',
          days_left: days_left !== undefined ? parseInt(days_left, 10) : 30,
          phone: phone || `+1 (555) 018-${newId.toString().padStart(3, '0')}`,
          profile_photo: `https://images.unsplash.com/photo-${1500000000000 + (newId * 100000)}?auto=format&fit=crop&q=80&w=150&h=150`,
        };

        this.users.push(newMember);
        this.addLog(
          'SQL',
          `INSERT INTO users (name, email, role, password, membership_status, days_left, phone, profile_photo) VALUES ('${newMember.name}', '${newMember.email}', 'member', 'password_hash', '${newMember.membership_status}', ${newMember.days_left}, '${newMember.phone}', '${newMember.profile_photo}')`
        );
        this.addLog('AUTH', `Admin registered new member: ${newMember.name} (ID: ${newId})`);
        this.saveState();

        this.addLog('HTTP', `<-- 201 Created`);
        return {
          message: 'Member created successfully.',
          member: newMember,
        };
      }

      // 4. POST /api/members/{id}/check-in
      if (method === 'POST' && path.startsWith('/api/members/') && path.endsWith('/check-in')) {
        // Special case: Kiosk can self check-in, or desk staff.
        // Let's check permissions: require either 'admin', 'staff' role OR check if user checks themselves in.
        const memberIdString = path.split('/')[3];
        const memberId = parseInt(memberIdString, 10);

        requireAuth();
        
        const isKioskOrSelf = authUser?.role === 'member' && authUser.id === memberId;
        if (!isKioskOrSelf) {
          requireRoles(['admin']);
        }

        this.addLog('SQL', `SELECT * FROM users WHERE id = ${memberId} LIMIT 1`);
        const member = this.users.find(u => u.id === memberId && u.role === 'member');
        
        if (!member) {
          this.addLog('HTTP', `<-- 404 Not Found`);
          throw { status: 404, message: 'Member not found.' };
        }

        // Validate Status
        if (member.membership_status === 'Suspended') {
          this.addLog('AUTH', `Check-in Blocked: Member ${member.name} is Suspended.`);
          this.addLog('HTTP', `<-- 403 Forbidden`);
          throw { status: 403, message: 'Check-in denied. Account status is Suspended.' };
        }
        if (member.membership_status === 'Expired') {
          this.addLog('AUTH', `Check-in Blocked: Member ${member.name} is Expired.`);
          this.addLog('HTTP', `<-- 403 Forbidden`);
          throw { status: 403, message: 'Check-in denied. Account status is Expired.' };
        }

        // Create CheckIn
        const checkInBy = isKioskOrSelf ? 'Kiosk Self Check-In' : authUser?.name || 'Staff';
        const newCheckIn: SimCheckIn = {
          id: Date.now() + Math.round(Math.random() * 100),
          member_id: member.id,
          member_name: member.name,
          member_email: member.email,
          checked_in_by: checkInBy,
          timestamp: new Date().toISOString(),
        };

        this.checkIns.unshift(newCheckIn);
        this.addLog(
          'SQL',
          `INSERT INTO check_ins (member_id, checked_in_by, created_at) VALUES (${member.id}, ${
            isKioskOrSelf ? 'NULL' : authUser?.id
          }, NOW())`
        );
        this.addLog('AUTH', `Check-in Success: logged entry for ${member.name} authorized by ${checkInBy}.`);
        this.saveState();

        this.addLog('HTTP', `<-- 201 Created`);
        return {
          message: 'Check-in processed successfully.',
          check_in: {
            id: newCheckIn.id,
            member: {
              id: member.id,
              name: member.name,
              email: member.email,
            },
            authorized_by: {
              name: checkInBy,
            },
            created_at: newCheckIn.timestamp,
          },
        };
      }

      // 5. GET /api/check-ins
      if (method === 'GET' && path === '/api/check-ins') {
        requireRoles(['admin']);
        this.addLog('SQL', `SELECT check_ins.*, users.name FROM check_ins JOIN users ON check_ins.member_id = users.id ORDER BY created_at DESC`);
        
        this.addLog('HTTP', `<-- 200 OK`);
        return {
          total_check_ins: this.checkIns.length,
          check_ins: this.checkIns,
        };
      }

      // 5.1 GET /api/bookings
      if (method === 'GET' && path === '/api/bookings') {
        requireRoles(['admin']);
        this.addLog('SQL', `SELECT bookings.*, users.name, users.email FROM bookings JOIN users ON bookings.member_id = users.id ORDER BY booked_at DESC`);
        
        this.addLog('HTTP', `<-- 200 OK (${this.bookings.length} bookings found)`);
        return {
          bookings: this.bookings,
        };
      }

      // 5.2 POST /api/classes/{id}/book
      if (method === 'POST' && path.startsWith('/api/classes/') && path.endsWith('/book')) {
        requireAuth();
        const classIdString = path.split('/')[3];
        const classId = parseInt(classIdString, 10);
        
        this.addLog('SQL', `SELECT * FROM class_slots WHERE id = ${classId} LIMIT 1`);
        const gymClass = this.classes.find(c => c.id === classId);
        if (!gymClass) {
          this.addLog('HTTP', `<-- 404 Class Not Found`);
          throw { status: 404, message: 'Gym class slot not found.' };
        }

        const isSelfBooking = authUser?.role === 'member';
        if (!isSelfBooking) {
          requireRoles(['admin']);
        }

        const existingBookingIdx = this.bookings.findIndex(b => b.memberId === authUser?.id && b.classId === classId);
        if (existingBookingIdx !== -1) {
          // Cancel booking
          this.bookings.splice(existingBookingIdx, 1);
          gymClass.available = Math.min(gymClass.capacity, gymClass.available + 1);
          this.addLog('SQL', `DELETE FROM bookings WHERE member_id = ${authUser?.id} AND class_id = ${classId}`);
          this.addLog('SQL', `UPDATE class_slots SET available = ${gymClass.available} WHERE id = ${classId}`);
          this.addLog('AUTH', `Laravel Sanctum: Scopes check: Authorized for scope [book-classes].`);
          this.addLog('AUTH', `Booking Cancelled: ${authUser?.name} cancelled class ${gymClass.name}`);
          this.saveState();
          this.addLog('HTTP', `<-- 200 OK`);
          return { message: 'Booking cancelled successfully.' };
        } else {
          // Create booking
          if (gymClass.available <= 0) {
            this.addLog('HTTP', `<-- 403 Class Fully Booked`);
            throw { status: 403, message: 'Class is fully booked.' };
          }
          const newBooking: SimBooking = {
            id: Date.now() + Math.round(Math.random() * 100),
            memberId: authUser!.id,
            memberName: authUser!.name,
            memberEmail: authUser!.email,
            classId: gymClass.id,
            className: gymClass.name,
            classTime: gymClass.time,
            classTrainer: gymClass.trainer,
            bookedAt: new Date().toISOString()
          };
          this.bookings.unshift(newBooking);
          gymClass.available = Math.max(0, gymClass.available - 1);
          this.addLog('SQL', `INSERT INTO bookings (member_id, class_id, booked_at) VALUES (${authUser?.id}, ${classId}, NOW())`);
          this.addLog('SQL', `UPDATE class_slots SET available = ${gymClass.available} WHERE id = ${classId}`);
          this.addLog('AUTH', `Laravel Sanctum: Scopes check: Authorized for scope [book-classes].`);
          this.addLog('AUTH', `Booking Success: ${authUser?.name} registered for class ${gymClass.name}`);
          this.saveState();
          this.addLog('HTTP', `<-- 200 OK`);
          return { message: 'Booking confirmed successfully.' };
        }
      }

      // 5.3 POST /api/bookings/{id}/cancel or DELETE /api/bookings/{id}
      if (path.startsWith('/api/bookings/') && (path.endsWith('/cancel') || method === 'POST')) {
        requireRoles(['admin']);
        const parts = path.split('/');
        const bookingIdString = parts[3];
        const bookingId = parseInt(bookingIdString, 10);
        
        const bookingIdx = this.bookings.findIndex(b => b.id === bookingId);
        if (bookingIdx === -1) {
          this.addLog('HTTP', `<-- 404 Booking Not Found`);
          throw { status: 404, message: 'Booking not found.' };
        }
        
        const booking = this.bookings[bookingIdx];
        const gymClass = this.classes.find(c => c.id === booking.classId);
        if (gymClass) {
          gymClass.available = Math.min(gymClass.capacity, gymClass.available + 1);
          this.addLog('SQL', `UPDATE class_slots SET available = ${gymClass.available} WHERE id = ${booking.classId}`);
        }
        
        this.bookings.splice(bookingIdx, 1);
        this.addLog('SQL', `DELETE FROM bookings WHERE id = ${bookingId}`);
        this.addLog('AUTH', `Admin/Staff cancelled booking ID: ${bookingId} for member ${booking.memberName}`);
        this.saveState();
        this.addLog('HTTP', `<-- 200 OK`);
        return { message: 'Booking cancelled successfully by administrator.' };
      }

      // 6. GET /api/member/dashboard
      if (method === 'GET' && path === '/api/member/dashboard') {
        requireRoles(['member']);
        
        this.addLog('SQL', `SELECT * FROM memberships WHERE user_id = ${authUser?.id} LIMIT 1`);
        this.addLog('SQL', `SELECT * FROM bmi_logs WHERE user_id = ${authUser?.id} ORDER BY recorded_at DESC`);
        this.addLog('SQL', `SELECT * FROM class_slots`);

        const status = authUser?.membership_status || 'Active';
        const daysLeft = authUser?.days_left ?? 0;

        // Check if member has booked each class slot
        const classSlotsWithBookingInfo = this.classes.map(c => {
          const isBooked = this.bookings.some(b => b.memberId === authUser?.id && b.classId === c.id);
          return {
            ...c,
            booked: isBooked
          };
        });

        this.addLog('HTTP', `<-- 200 OK`);
        return {
          package: {
            name: 'Elite Club Gym Pass (Quarterly)',
            status: status,
            days_left: daysLeft,
            expires_at: new Date(Date.now() + daysLeft * 24 * 60 * 60 * 1000).toDateString(),
          },
          bmi_history: [
            { date: 'Jan', bmi: 25.8 },
            { date: 'Feb', bmi: 25.2 },
            { date: 'Mar', bmi: 24.9 },
            { date: 'Apr', bmi: 24.5 },
            { date: 'May', bmi: 23.8 },
          ],
          class_slots: classSlotsWithBookingInfo,
        };
      }

      // 404 API Route
      this.addLog('HTTP', `<-- 404 Not Found`);
      throw { status: 404, message: 'Route not found.' };
    } catch (err: any) {
      if (err.status) {
        throw err;
      }
      throw { status: 500, message: 'Internal Server Error: ' + err.message };
    }
  }

  // CRON SCHEDULER SIMULATION
  public runCronScheduler() {
    this.addLog('SCHEDULER', 'Daily Midnight Cron Job triggered by developer/admin...');
    this.addLog('SCHEDULER', 'Executing task: App\\Console\\Kernel::schedule -> check memberships.');
    this.addLog('SQL', 'SELECT * FROM users WHERE role = \'member\' AND membership_status = \'Active\'');

    let updatedCount = 0;
    this.users = this.users.map(u => {
      if (u.role === 'member') {
        // Decrease days left
        const currentDays = u.days_left ?? 0;
        const newDays = Math.max(0, currentDays - 1);
        let newStatus = u.membership_status;

        if (newDays === 0 && u.membership_status === 'Active') {
          newStatus = 'Expired';
          updatedCount++;
          this.addLog('SCHEDULER', `Member ${u.name} (ID: ${u.id}) has 0 days left. Membership status set to 'Expired'.`);
          this.addLog('SQL', `UPDATE users SET membership_status = 'Expired', days_left = 0 WHERE id = ${u.id}`);
        } else if (u.membership_status === 'Active') {
          this.addLog('SQL', `UPDATE users SET days_left = ${newDays} WHERE id = ${u.id}`);
        }

        return {
          ...u,
          days_left: newDays,
          membership_status: newStatus,
        };
      }
      return u;
    });

    this.addLog('SCHEDULER', `Daily Scheduler task complete. Expired: ${updatedCount} account(s).`);
    this.saveState();
  }
}

export const backendSim = new SimulatedBackend();
