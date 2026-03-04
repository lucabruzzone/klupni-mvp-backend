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
import { Activity } from './activity.entity';
import { ExternalContact } from '../../external-contacts/entities/external-contact.entity';

export type ParticipationRole = 'host' | 'participant';
export type ParticipationStatus = 'active' | 'removed' | 'left';

@Entity('activity_participations')
export class ActivityParticipation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'activity_id', type: 'uuid' })
  activityId: string;

  @ManyToOne(() => Activity)
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

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

  @Column({ type: 'text', nullable: true })
  alias: string | null;

  @Column({ type: 'text' })
  role: ParticipationRole;

  @Column({ type: 'text' })
  status: ParticipationStatus;

  @Column({ name: 'joined_at', type: 'timestamp' })
  joinedAt: Date;

  @Index()
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
