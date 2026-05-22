import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Artist } from './artist.entity';

@Entity()
export class ArtistProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  country!: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  city!: string | null;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  bookingEmail!: string | null;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  website!: string | null;

  @Column('uuid')
  artistId!: string;

  @OneToOne(() => Artist, (artist) => artist.profile)
  @JoinColumn()
  artist!: Artist;

  /** Auto-managed audit columns — see album.entity.ts for details. */
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date | null;

  /** Enables `repository.softDelete(...)` for this entity. */
  @DeleteDateColumn()
  deletedAt!: Date | null;
}
