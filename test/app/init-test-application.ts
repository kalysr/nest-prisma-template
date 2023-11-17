import { INestApplication } from '@nestjs/common';
import { TestingModuleBuilder } from '@nestjs/testing';
import { createTestApplication } from './create-test-application';
import { PrismaService } from '../../src/infrastructure/database/prisma/prisma.service';
import { cleanUpDatabase } from '../utils/prisma.utils';
import { mockSQSClient } from '../utils/sqs-utils';

export const initTestApplication = async (
  onInitApp: (application: INestApplication) => any,
  configure?: (builder: TestingModuleBuilder) => TestingModuleBuilder,
) => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    mockSQSClient();

    app = await createTestApplication(configure);
    prismaService = app.get(PrismaService);

    onInitApp(app);
  });

  afterAll(async () => {
    if (prismaService) await prismaService.$disconnect();
    if (app) await app.close();
  });

  afterEach(() => cleanUpDatabase());
};
