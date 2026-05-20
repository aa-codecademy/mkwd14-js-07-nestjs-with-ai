import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Song {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 200 })
  title!: string;

  // add positive number check constraint
  @Column({
    type: 'int',
  })
  durationSeconds!: number;

  @Column({
    default: false,
  })
  isExplicit!: boolean;

  // @Column('uuid')
  @Column({ type: 'uuid', nullable: true })
  albumId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date | null;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}
