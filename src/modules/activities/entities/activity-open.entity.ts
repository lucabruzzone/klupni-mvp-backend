import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Activity } from './activity.entity';

@Entity('activity_open')
export class ActivityOpen {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'activity_id', type: 'uuid', unique: true })
  activityId: string;

  @OneToOne(() => Activity, (activity) => activity.activityOpen)
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  @Column({ name: 'sport_name', type: 'text', nullable: true })
  sportName: string | null;

  @Column({ name: 'location_text', type: 'text', nullable: true })
  locationText: string | null;

  @Column({ name: 'max_participants', type: 'int' })
  maxParticipants: number;

  @Column({ name: 'min_participants', type: 'int' })
  minParticipants: number;

  @Index()
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
