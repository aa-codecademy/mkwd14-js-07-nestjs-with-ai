---
applyTo: '**/src/**/schemas/*.schema.ts'
---

# Mongoose schema conventions

Schemas use the `@nestjs/mongoose` decorator API.

- Structure of every schema file:

  ```ts
  export type EntityDocument = HydratedDocument<Entity>;

  @Schema({ timestamps: true })
  export class Entity {
    /* @Prop fields */
  }

  export const EntitySchema = SchemaFactory.createForClass(Entity);
  ```

- Always pass `{ timestamps: true }` to `@Schema` (gives `createdAt`/`updatedAt`).
- Mark every prop with `!`: `firstName!: string;`.
- Put validation/normalization on `@Prop`: `required`, `unique`, `trim`, `lowercase`, `min`, `max`.
- **Relations** are `ObjectId` refs, not embedded docs:
  `@Prop({ type: Types.ObjectId, ref: 'Student', required: true }) student!: Types.ObjectId;`
  The `ref` string matches the related class name.
- Register the schema in the feature module via
  `MongooseModule.forFeature([{ name: Entity.name, schema: EntitySchema }])`.
- Validate incoming ids in DTOs/pipes (`ParseObjectIdPipe`, `@IsMongoId`) — not in the schema.
