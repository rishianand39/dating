import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) { }

  async register(phone: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await this.prisma.user.upsert({
      where: { phone },
      update: { otp },
      create: { phone, otp },
    });

    return { message: 'OTP sent!' };
  }

  async verifyOtp(phone: string, otp: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });

    if (!user || user.otp !== otp) {
      return { success: false, message: 'Invalid OTP' };
    }

    await this.prisma.user.update({
      where: { phone },
      data: { verified: true, otp: null },
    });

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    const token = jwt.sign({ userId: user.id }, jwtSecret, {
      expiresIn: '7d',
    });

    return { success: true, token };
  }
}
