import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('mail.host'),
      port: this.configService.get<number>('mail.port'),
      auth: {
        user: this.configService.get<string>('mail.user'),
        pass: this.configService.get<string>('mail.pass'),
      },
    });
  }

  async sendMail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const from = this.configService.get<string>('mail.from');
    await this.transporter.sendMail({ from, ...options });
    this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('mail.frontendUrl');
    const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #333;">Welcome to Klupni!</h2>
        <p style="color: #555; line-height: 1.6;">
          Thanks for signing up. Please verify your email address by clicking the button below.
        </p>
        <a href="${verifyUrl}"
           style="display: inline-block; padding: 12px 24px; margin: 16px 0;
                  background-color: #4f46e5; color: #fff; text-decoration: none;
                  border-radius: 6px; font-weight: bold;">
          Verify Email
        </a>
        <p style="color: #888; font-size: 13px;">
          Or copy and paste this link in your browser:<br/>
          <a href="${verifyUrl}" style="color: #4f46e5;">${verifyUrl}</a>
        </p>
        <p style="color: #888; font-size: 13px;">
          This link expires in 24 hours.
        </p>
      </div>
    `;

    await this.sendMail({
      to,
      subject: 'Verify your Klupni account',
      html,
    });
  }

  async sendActivityInvitation(params: {
    to: string;
    invitedByEmail: string;
    activityTitle: string;
    activityStartAt: Date;
    locationText?: string | null;
    token: string;
  }): Promise<void> {
    const frontendUrl = this.configService.get<string>('mail.frontendUrl');
    const acceptUrl = `${frontendUrl}/invitations/accept?token=${params.token}`;
    const startDate = new Date(params.activityStartAt).toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const locationLine = params.locationText
      ? `<p style="color: #555; margin: 4px 0;"><strong>Location:</strong> ${params.locationText}</p>`
      : '';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #333;">You're invited!</h2>
        <p style="color: #555; line-height: 1.6;">
          <strong>${params.invitedByEmail}</strong> has invited you to join an activity on Klupni.
        </p>
        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="color: #333; font-size: 18px; font-weight: bold; margin: 0 0 8px 0;">
            ${params.activityTitle}
          </p>
          <p style="color: #555; margin: 4px 0;">
            <strong>When:</strong> ${startDate}
          </p>
          ${locationLine}
        </div>
        <a href="${acceptUrl}"
           style="display: inline-block; padding: 12px 24px; margin: 16px 0;
                  background-color: #4f46e5; color: #fff; text-decoration: none;
                  border-radius: 6px; font-weight: bold;">
          Accept Invitation
        </a>
        <p style="color: #888; font-size: 13px;">
          Or copy and paste this link in your browser:<br/>
          <a href="${acceptUrl}" style="color: #4f46e5;">${acceptUrl}</a>
        </p>
        <p style="color: #888; font-size: 13px;">
          This invitation expires in 48 hours.
        </p>
      </div>
    `;

    await this.sendMail({
      to: params.to,
      subject: `You're invited to "${params.activityTitle}" on Klupni`,
      html,
    });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('mail.frontendUrl');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #333;">Reset your password</h2>
        <p style="color: #555; line-height: 1.6;">
          You requested a password reset for your Klupni account. Click the button below to choose a new password.
        </p>
        <a href="${resetUrl}"
           style="display: inline-block; padding: 12px 24px; margin: 16px 0;
                  background-color: #4f46e5; color: #fff; text-decoration: none;
                  border-radius: 6px; font-weight: bold;">
          Reset Password
        </a>
        <p style="color: #888; font-size: 13px;">
          Or copy and paste this link in your browser:<br/>
          <a href="${resetUrl}" style="color: #4f46e5;">${resetUrl}</a>
        </p>
        <p style="color: #888; font-size: 13px;">
          This link expires in 1 hour. If you did not request this, you can safely ignore this email.
        </p>
      </div>
    `;

    await this.sendMail({
      to,
      subject: 'Reset your Klupni password',
      html,
    });
  }

  async sendPasswordChangedConfirmation(to: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #333;">Password changed successfully</h2>
        <p style="color: #555; line-height: 1.6;">
          Your Klupni account password has been changed successfully. If you did not make this change, please contact us immediately.
        </p>
        <p style="color: #555; line-height: 1.6;">
          You can now sign in with your new password.
        </p>
      </div>
    `;

    await this.sendMail({
      to,
      subject: 'Your Klupni password was changed',
      html,
    });
  }

  async sendInvitationAccepted(params: {
    to: string;
    guestEmail: string;
    activityTitle: string;
    activityStartAt: Date;
  }): Promise<void> {
    const startDate = new Date(params.activityStartAt).toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #333;">Invitation accepted!</h2>
        <p style="color: #555; line-height: 1.6;">
          <strong>${params.guestEmail}</strong> has accepted your invitation to join:
        </p>
        <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="color: #333; font-size: 18px; font-weight: bold; margin: 0 0 8px 0;">
            ${params.activityTitle}
          </p>
          <p style="color: #555; margin: 4px 0;">
            <strong>When:</strong> ${startDate}
          </p>
        </div>
        <p style="color: #555; line-height: 1.6;">
          Your group is growing! Check the activity details in Klupni.
        </p>
      </div>
    `;

    await this.sendMail({
      to: params.to,
      subject: `${params.guestEmail} joined "${params.activityTitle}"`,
      html,
    });
  }
}
