import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';

import jwtConfig from './config/jwt.config';
import mailConfig from './config/mail.config';
import { AuthModule } from './modules/auth/auth.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { ExternalContactsModule } from './modules/external-contacts/external-contacts.module';
import { ParticipationsModule } from './modules/participations/participations.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { MailModule } from './modules/mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [jwtConfig, mailConfig],
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRATION: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_REFRESH_EXPIRATION: Joi.string().required(),
        MAIL_HOST: Joi.string().required(),
        MAIL_PORT: Joi.number().default(2525),
        MAIL_USER: Joi.string().allow('').optional(),
        MAIL_PASS: Joi.string().allow('').optional(),
        MAIL_FROM: Joi.string().required(),
      }),
      validationOptions: {
        abortEarly: true,
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
        migrations: [__dirname + '/migrations/*.{ts,js}'],
      }),
    }),
    AuthModule,
    ActivitiesModule,
    ExternalContactsModule,
    ParticipationsModule,
    InvitationsModule,
    MailModule,
  ],
})
export class AppModule {}
