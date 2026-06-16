// Enum listing every valid academy class name. Using an enum here instead of a plain
// string ensures that only these values can be stored in the database — any typo or
// unlisted value is rejected by @IsEnum(ClassName) in the DTO before reaching the service.
export enum ClassName {
  NODE_JS = 'Node JS',
  POSTGRESQL = 'PostgreSQL',
  NEST_JS = 'Nest JS',
  REACT = 'React',
  ANGULAR = 'Angular',
  ELECTIVE = 'Elective',
}
