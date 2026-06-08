import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

import { ReservationEntity } from './entities/reservation.entity';

@Injectable()
export class ReservationNotificationService {
  private readonly logger = new Logger(ReservationNotificationService.name);
  private readonly transporter?: nodemailer.Transporter;
  private readonly sender?: string;
  private readonly recipient?: string;

  constructor(private readonly configService: ConfigService) {
    const configuredUser = this.configService.get<string>('MAIL_USER', '')
      || this.configService.get<string>('EMAIL_USER', '');
    const configuredPass = this.configService.get<string>('EMAIL_PASS', '');
    const user = configuredUser.replace(/\s+/g, '');
    const pass = configuredPass.replace(/\s+/g, '');

    if (!user || !pass) {
      this.logger.warn('Email notifications are disabled because MAIL_USER or EMAIL_PASS is not configured');
      return;
    }

    this.sender = user;
    this.recipient = user;
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  async sendReservationCreatedEmail(reservation: ReservationEntity): Promise<void> {
    if (!this.transporter || !this.sender || !this.recipient) {
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.sender,
        to: this.recipient,
        subject: 'New reservation created',
        text: this.buildText(reservation),
        html: this.buildHtml(reservation),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send reservation notification for reservation ${reservation.id}: ${message}`);
    }
  }

  private buildText(reservation: ReservationEntity): string {
    return [
      'A new reservation has been created.',
      '',
      `Guest: ${reservation.name}`,
      '',
      `Room: ${reservation.roomName}`,
      `Room type: ${reservation.roomType}`,
      `Check-in: ${this.formatDate(reservation.checkIn)}`,
      `Check-out: ${this.formatDate(reservation.checkOut)}`,
      `Adults: ${reservation.adults}`,
      `Children: ${reservation.children}`,
      `Phone: ${reservation.phone}`,
      `Status: ${reservation.status}`,
      '',
      `Reservation ID: ${reservation.id}`,
    ].join('\n');
  }

  private buildHtml(reservation: ReservationEntity): string {
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937;">
        <h2 style="margin-bottom: 16px;">New reservation created</h2>
        <p>A guest has created a new reservation.</p>
        <table style="border-collapse: collapse;">
          <tr><td style="padding: 4px 12px 4px 0;"><strong>Guest</strong></td><td>${reservation.name}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0;"><strong>Room</strong></td><td>${reservation.roomName}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0;"><strong>Room type</strong></td><td>${reservation.roomType}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0;"><strong>Check-in</strong></td><td>${this.formatDate(reservation.checkIn)}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0;"><strong>Check-out</strong></td><td>${this.formatDate(reservation.checkOut)}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0;"><strong>Adults</strong></td><td>${reservation.adults}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0;"><strong>Children</strong></td><td>${reservation.children}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0;"><strong>Phone</strong></td><td>${reservation.phone}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0;"><strong>Status</strong></td><td>${reservation.status}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0;"><strong>Reservation ID</strong></td><td>${reservation.id}</td></tr>
        </table>
      </div>
    `;
  }

  private formatDate(value: Date | null): string {
    if (!value) {
      return '';
    }

    return new Date(value).toISOString().slice(0, 10);
  }
}