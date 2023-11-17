import { INestApplication } from '@nestjs/common';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { loadAppSettings } from '../../src/utils/load-app-settings';

export const createTestApplication = async (
  configure?: (builder: TestingModuleBuilder) => TestingModuleBuilder,
): Promise<INestApplication> => {
  let builder = Test.createTestingModule({
    imports: [AppModule],
  });

  if (configure) builder = configure(builder);

  const moduleFixture = await builder.compile();
  const app = moduleFixture.createNestApplication({ bodyParser: false });

  loadAppSettings(app);

  await app.init();
  await app.listen(0);
  return app;
};
