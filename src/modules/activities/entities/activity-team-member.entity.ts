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
import { ActivityTeam } from './activity-team.entity';
import { ActivityParticipation } from './activity-participation.entity';

@Entity('activity_team_members')
export class ActivityTeamMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'team_id', type: 'uuid' })
  teamId: string;

  @ManyToOne(() => ActivityTeam)
  @JoinColumn({ name: 'team_id' })
  team: ActivityTeam;

  @Index({ unique: true })
  @Column({ name: 'activity_participation_id', type: 'uuid' })
  activityParticipationId: string;

  @ManyToOne(() => ActivityParticipation)
  @JoinColumn({ name: 'activity_participation_id' })
  activityParticipation: ActivityParticipation;

  @Column({ name: 'is_captain', type: 'boolean', default: false })
  isCaptain: boolean;

  @Index()
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
