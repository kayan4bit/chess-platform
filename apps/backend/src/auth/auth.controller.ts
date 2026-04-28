import { Body, Controller, Get, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

interface SignupDto { username: string; password: string }
interface LoginDto { username: string; password: string }
interface UpgradeDto { username: string; password: string }

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly prisma: PrismaService) {}

  @Post('guest')
  async guest() {
    return this.auth.createGuest();
  }

  @Post('signup')
  async signup(@Body() body: SignupDto) {
    return this.auth.signup(body?.username ?? '', body?.password ?? '');
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.auth.login(body?.username ?? '', body?.password ?? '');
  }

  @Post('upgrade')
  async upgrade(@Headers('authorization') authHeader: string | undefined, @Body() body: UpgradeDto) {
    if (!authHeader?.startsWith('Bearer ')) throw new UnauthorizedException('Missing bearer token');
    const payload = this.auth.verify(authHeader.slice('Bearer '.length));
    return this.auth.upgradeGuest(payload.sub, body?.username ?? '', body?.password ?? '');
  }

  @Get('me')
  async me(@Headers('authorization') authHeader?: string) {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = authHeader.slice('Bearer '.length);
    const payload = this.auth.verify(token);
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('User not found');
    return this.auth.safeUser(user);
  }
}
