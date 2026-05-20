import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Artist {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 120 })
  name!: string;

  @Column({ length: 30 })
  genre!: string;

  @Column()
  isActive!: boolean;

  @Column({
    type: 'int',
    nullable: true,
  })
  debutYear!: number | null;
}
