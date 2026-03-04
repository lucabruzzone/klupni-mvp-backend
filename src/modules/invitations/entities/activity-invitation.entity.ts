import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Activity } from '../../activities/entities/activity.entity';
import { ExternalContact } from '../../external-contacts/entities/external-contact.entity';

export type InvitationStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'expired';

@Entity('activity_invitations')
export class ActivityInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'activity_id', type: 'uuid' })
  activityId: string;

  @ManyToOne(() => Activity)
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  @Column({ name: 'invited_by_user_id', type: 'uuid' })
  invitedByUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'invited_by_user_id' })
  invitedByUser: User;

  @Index()
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index()
  @Column({ name: 'external_contact_id', type: 'uuid', nullable: true })
  externalContactId: string | null;

  @ManyToOne(() => ExternalContact)
  @JoinColumn({ name: 'external_contact_id' })
  externalContact: ExternalContact;

  @Column({ type: 'text' })
  email: string;

  @Index()
  @Column({ type: 'text', unique: true })
  token: string;

  @Column({ type: 'text' })
  status: InvitationStatus;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'responded_at', type: 'timestamp', nullable: true })
  respondedAt: Date | null;

  @Index()
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
