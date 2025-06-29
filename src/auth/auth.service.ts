import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(phone: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    let user = await this.prisma.user.findUnique({ where: { phone } });

    if (user) {
      await this.prisma.user.update({
        where: { phone },
        data: { otp },
      });
    } else {
      await this.prisma.user.create({
        data: { phone, otp },
      });
    }

    // TODO: Send OTP via SMS (you can use Twilio, Exotel, etc.)
    console.log(`OTP for ${phone}: ${otp}`);

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

    const token = jwt.sign({ userId: user.id }, 'bunny-secret-key', {
      expiresIn: '7d',
    });

    return { success: true, token };
  }
}
