import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadAppSettings } from './utils/load-app-settings';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  loadAppSettings(app);

  await app.listen(3030);
}
bootstrap();
