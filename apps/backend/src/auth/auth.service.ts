import { Injectable, UnauthorizedException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { nanoid } from 'nanoid';
import * as bcrypt from 'bcryptjs';

const ADJECTIVES = [
  'Swift', 'Daring', 'Silent', 'Clever', 'Brave', 'Sly', 'Bold', 'Wise',
  'Royal', 'Noble', 'Mystic', 'Stormy', 'Sunny', 'Iron', 'Golden', 'Shadow',
];
const ANIMALS = [
  'Knight', 'Rook', 'Bishop', 'Pawn', 'Queen', 'Falcon', 'Tiger', 'Wolf',
  'Owl', 'Hawk', 'Panda', 'Otter', 'Fox', 'Bear', 'Lynx', 'Raven',
];

const USERNAME_RE = /^[A-Za-z0-9_-]{3,24}$/;
const RESERVED_NAMES = new Set(['admin', 'root', 'stockfishai', 'system', 'guest', 'me', 'null']);

function randomUsername(): string {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const b = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const n = Math.floor(Math.random() * 9000 + 1000);
  return `${a}${b}${n}`;
}

export interface JwtPayload {
  sub: string;
  username: string;
  guest: boolean;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async createGuest() {
    for (let i = 0; i < 5; i++) {
      const username = randomUsername();
      const exists = await this.prisma.user.findUnique({ where: { username } });
      if (exists) continue;
      const user = await this.prisma.user.create({
        data: {
          id: `g_${nanoid(10)}`,
          username,
          isGuest: true,
        },
      });
      const token = this.sign(user.id, user.username, true);
      return { token, user: this.safeUser(user) };
    }
    throw new Error('Could not allocate guest username');
  }

  async signup(username: string, password: string) {
    this.assertValidUsername(username);
    this.assertValidPassword(password);
    const existing = await this.prisma.user.findUnique({ where: { username } });
    if (existing) throw new ConflictException('Username taken');
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.prisma.user.create({
      data: {
        id: `u_${nanoid(10)}`,
        username,
        passwordHash,
        isGuest: false,
      },
    });
    const token = this.sign(user.id, user.username, false);
    return { token, user: this.safeUser(user) };
  }

  async login(username: string, password: string) {
    if (!username || !password) throw new BadRequestException('username and password required');
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const token = this.sign(user.id, user.username, user.isGuest);
    return { token, user: this.safeUser(user) };
  }

  /**
   * Promote a guest to a registered account by attaching a username + password.
   * Lets returning visitors keep their rating + game history.
   */
  async upgradeGuest(userId: string, username: string, password: string) {
    this.assertValidUsername(username);
    this.assertValidPassword(password);
    const me = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!me) throw new UnauthorizedException();
    if (!me.isGuest) throw new BadRequestException('Already a registered account');
    const collision = await this.prisma.user.findUnique({ where: { username } });
    if (collision) throw new ConflictException('Username taken');
    const passwordHash = await bcrypt.hash(password, 12);
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { username, passwordHash, isGuest: false },
    });
    const token = this.sign(updated.id, updated.username, false);
    return { token, user: this.safeUser(updated) };
  }

  sign(userId: string, username: string, guest: boolean): string {
    const payload: JwtPayload = { sub: userId, username, guest };
    return this.jwt.sign(payload);
  }

  verify(token: string): JwtPayload {
    try {
      return this.jwt.verify<JwtPayload>(token);
    } catch (err) {
      this.logger.warn(`JWT verify failed: ${(err as Error).message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }

  safeUser(u: { id: string; username: string; rating: number; isGuest: boolean }) {
    return { id: u.id, username: u.username, rating: u.rating, isGuest: u.isGuest };
  }

  private assertValidUsername(username: string): void {
    if (!username || !USERNAME_RE.test(username)) {
      throw new BadRequestException('username must be 3–24 chars, letters/numbers/_-');
    }
    if (RESERVED_NAMES.has(username.toLowerCase())) {
      throw new BadRequestException('that username is reserved');
    }
  }

  private assertValidPassword(password: string): void {
    if (!password || password.length < 8 || password.length > 200) {
      throw new BadRequestException('password must be 8–200 characters');
    }
  }
}
