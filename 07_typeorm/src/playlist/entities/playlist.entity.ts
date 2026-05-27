import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Song } from '../../song/song.entity';

@Entity()
export class Playlist {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column()
  author!: string;

  @ManyToMany(() => Song, (song) => song.playlists)
  @JoinTable({
    name: 'playlist_songs',
  })
  songs!: Song[];

  /** Auto-managed audit columns — see album.entity.ts for details. */
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date | null;

  /** Enables `repository.softDelete(...)` for this entity. */
  @DeleteDateColumn()
  deletedAt!: Date | null;
}
