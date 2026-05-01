import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

import { ReservationEntity } from './entities/reservation.entity';

@Injectable()
export class ReservationNotificationService {
  private readonly logger = new Logger(ReservationNotificationService.name);
  private readonly transporter?: nodemailer.Transporter;
  private readonly sender?: string;

  constructor(private readonly configService: ConfigService) {
    const user = this.configService.get<string>('EMAIL_USER', '').trim();
    const pass = this.configService.get<string>('EMAIL_PASS', '').trim();

    if (!user || !pass) {
      this.logger.warn('Email notifications are disabled because EMAIL_USER or EMAIL_PASS is not configured');
      return;
    }

    this.sender = user;
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  async sendReservationCreatedEmail(reservation: ReservationEntity): Promise<void> {
    if (!this.transporter || !this.sender) {
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.sender,
        to: reservation.email,
        subject: 'Booking confirmation',
        text: this.buildText(reservation),
        html: this.buildHtml(reservation),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send reservation confirmation email to ${reservation.email}: ${message}`);
    }
  }

  private buildText(reservation: ReservationEntity): string {
    return [
      `Hello, ${reservation.name}!`,
      '',
      'Your reservation has been successfully created.',
      '',
      `Room: ${reservation.roomName}`,
      `Room type: ${reservation.roomType}`,
      `Check-in: ${this.formatDate(reservation.checkIn)}`,
      `Check-out: ${this.formatDate(reservation.checkOut)}`,
      `Adults: ${reservation.adults}`,
      `Children: ${reservation.children}`,
      `Phone: ${reservation.phone}`,
      `Email: ${reservation.email}`,
      '',
      'Thank you for your booking.',
    ].join('\n');
  }

  private buildHtml(reservation: ReservationEntity): string {
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937;">
        <h2 style="margin-bottom: 16px;">Reservation confirmed</h2>
        <p>Hello, <strong>${reservation.name}</strong>.</p>
        <p>Your reservation has been successfully created with the following details:</p>
        <table style="border-collapse: collapse;">
          <tr><td style="padding: 4px 12px 4px 0;"><strong>Room</strong></td><td>${reservation.roomName}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0;"><strong>Room type</strong></td><td>${reservation.roomType}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0;"><strong>Check-in</strong></td><td>${this.formatDate(reservation.checkIn)}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0;"><strong>Check-out</strong></td><td>${this.formatDate(reservation.checkOut)}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0;"><strong>Adults</strong></td><td>${reservation.adults}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0;"><strong>Children</strong></td><td>${reservation.children}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0;"><strong>Phone</strong></td><td>${reservation.phone}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0;"><strong>Email</strong></td><td>${reservation.email}</td></tr>
        </table>
      </div>
    `;
  }

  private formatDate(value: Date): string {
    return new Date(value).toISOString().slice(0, 10);
  }
}