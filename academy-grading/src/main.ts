import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  const openApi = new DocumentBuilder()
    .setTitle('Academy Gradebook')
    .setDescription('NestJS with Mongo & Mongoose integration')
    .setVersion('1.0.0')
    .build();

  const document = SwaggerModule.createDocument(app, openApi);

  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
