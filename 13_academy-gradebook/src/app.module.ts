import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClassesModule } from './classes/classes.module';
import { GradesModule } from './grades/grades.module';
import { HomeworksModule } from './homeworks/homeworks.module';
import { StudentsModule } from './students/students.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // ConfigModule.forRoot() reads the .env file and makes all variables available
    // via ConfigService throughout the entire app. isGlobal:true means you don't
    // need to import ConfigModule again in any feature module.
    ConfigModule.forRoot({ isGlobal: true }),

    // MongooseModule.forRootAsync() establishes the single MongoDB connection for
    // the whole application. "Async" means it waits for ConfigService to be ready
    // before building the connection options — required when the URI comes from env vars.
    // useFactory receives the injected ConfigService and returns the connection config.
    // getOrThrow throws at startup if MONGO_URI is missing, preventing silent failures.
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGO_URI'),
      }),
    }),

    // Feature modules — each one registers its own Mongoose models via
    // MongooseModule.forFeature() and encapsulates its own routes/services.
    ClassesModule,
    GradesModule,
    HomeworksModule,
    StudentsModule,
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
