import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { ActivityOpen } from './activity-open.entity';

export type ActivityStatus =
  | 'draft'
  | 'open'
  | 'closed'
  | 'cancelled'
  | 'completed';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'created_by_user_id', type: 'uuid' })
  createdByUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser: User;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Index()
  @Column({ name: 'start_at', type: 'timestamp' })
  startAt: Date;

  @Column({ name: 'end_at', type: 'timestamp', nullable: true })
  endAt: Date | null;

  @Index()
  @Column({ type: 'text' })
  status: ActivityStatus;

  @OneToOne(() => ActivityOpen, (open) => open.activity)
  activityOpen: ActivityOpen;

  @Index()
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
