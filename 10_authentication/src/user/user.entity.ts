import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @ApiProperty({
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: number;

  @ApiProperty({ example: 'user@music.com' })
  @Column({ unique: true })
  email!: string;

  @Column({ select: false })
  passwordHash!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @CreateDateColumn()
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @UpdateDateColumn()
  updatedAt!: Date;
}
